// services/ai/openAIProvider.ts
import OpenAI from 'openai'
import { zodToJsonSchema } from 'zod-to-json-schema'
import {
  AIProviderInterface,
  AIGenerationRequest,
  StructuredGenerationRequest,
  AIGenerationResult,
  AIModelConfig,
  AIUsageMetadata,
} from './types'
import { MODEL_CONFIG, getModelForOperation } from './modelConfig'
import {
  calculateTextCost,
  calculateImageCost,
  calculateWebSearchCost,
  TEXT_MODEL_PRICING,
  IMAGE_MODEL_PRICING,
} from '@/lib/ai/pricing'

// ---------------------------------------------------------------------------
// Lazy client — only instantiated when real provider is used
// ---------------------------------------------------------------------------
let _client: OpenAI | null = null

function getClient(): OpenAI {
  if (_client) return _client
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('OPENAI_API_KEY is not set. Cannot use OpenAIProvider.')
  }
  _client = new OpenAI({ apiKey })
  return _client
}

// ---------------------------------------------------------------------------
// Available models list (derived from pricing table)
// ---------------------------------------------------------------------------
const AVAILABLE_MODELS: AIModelConfig[] = Object.entries(TEXT_MODEL_PRICING).map(([id, p]) => ({
  id,
  name: id,
  provider: 'openai',
  costPer1kInput: p.inputPerMillion / 1000,
  costPer1kOutput: p.outputPerMillion / 1000,
  capabilities: ['text', 'structured'],
}))

// ---------------------------------------------------------------------------
// Helper: extract usage from OpenAI response
// ---------------------------------------------------------------------------
function extractUsage(
  model: string,
  usage: OpenAI.Responses.ResponseUsage | undefined,
  start: number
): AIUsageMetadata {
  const inputTokens = usage?.input_tokens ?? 0
  const outputTokens = usage?.output_tokens ?? 0
  // input_tokens_details is present in the SDK but may not be typed in all versions
  const details = (usage as { input_tokens_details?: { cached_tokens?: number } } | undefined)
    ?.input_tokens_details
  const cachedInputTokens = details?.cached_tokens ?? 0
  const reasoningTokens =
    (usage as { output_tokens_details?: { reasoning_tokens?: number } } | undefined)
      ?.output_tokens_details?.reasoning_tokens ?? 0
  const estimatedCost = calculateTextCost(model, inputTokens, outputTokens, cachedInputTokens)
  return {
    inputTokens,
    cachedInputTokens,
    outputTokens,
    reasoningTokens,
    estimatedCost,
    durationMs: Date.now() - start,
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export class OpenAIProvider implements AIProviderInterface {
  getAvailableModels(): AIModelConfig[] {
    return AVAILABLE_MODELS
  }

  async generateText(request: AIGenerationRequest): Promise<AIGenerationResult<string>> {
    const model = request.model ?? getModelForOperation(request.operation)
    const start = Date.now()

    try {
      const client = getClient()
      const response = await client.responses.create({
        model,
        input: request.prompt,
        max_output_tokens: request.maxTokens ?? 2000,
        temperature: request.temperature ?? 0.7,
      })

      const text = response.output_text ?? ''
      const usageMeta = extractUsage(model, response.usage, start)

      console.log(
        `[AI] ${request.operation} | model=${model} | ${usageMeta.inputTokens}+${usageMeta.outputTokens} tokens | $${usageMeta.estimatedCost.toFixed(5)} | ${usageMeta.durationMs}ms`
      )

      return { success: true, data: text, usage: usageMeta }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[AI] generateText failed: ${message}`)
      return {
        success: false,
        error: message,
        usage: { inputTokens: 0, outputTokens: 0, estimatedCost: 0 },
      }
    }
  }

  async generateStructured<T>(request: StructuredGenerationRequest<T>): Promise<AIGenerationResult<T>> {
    const model = request.model ?? getModelForOperation(request.operation)
    const start = Date.now()

    try {
      const client = getClient()

      // Build JSON Schema from Zod schema for API-level enforcement
      const jsonSchema = zodToJsonSchema(request.schema, { target: 'openAi' })

      const response = await client.responses.create({
        model,
        input: [
          {
            role: 'system',
            content:
              'You must respond with valid JSON that strictly conforms to the provided schema. No markdown, no explanation, just the JSON object.',
          },
          {
            role: 'user',
            content: request.prompt,
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: request.operation,
            schema: jsonSchema as Record<string, unknown>,
            strict: true,
          },
        },
        max_output_tokens: request.maxTokens ?? 4000,
        temperature: request.temperature ?? 0.7,
      })

      const rawText = response.output_text ?? '{}'
      const usageMeta = extractUsage(model, response.usage, start)

      console.log(
        `[AI] ${request.operation} | model=${model} | ${usageMeta.inputTokens}+${usageMeta.outputTokens} tokens | $${usageMeta.estimatedCost.toFixed(5)} | ${usageMeta.durationMs}ms`
      )

      // Parse JSON
      let parsed: unknown
      try {
        parsed = JSON.parse(rawText)
      } catch {
        return {
          success: false,
          error: 'AI returned invalid JSON',
          usage: usageMeta,
        }
      }

      // Zod validation as final defensive layer
      const validated = request.schema.safeParse(parsed)
      if (!validated.success) {
        console.error(`[AI] Zod validation failed for ${request.operation}:`, validated.error.flatten())
        return {
          success: false,
          error: `Schema validation failed: ${validated.error.message}`,
          usage: usageMeta,
        }
      }

      return { success: true, data: validated.data, usage: usageMeta }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[AI] generateStructured failed: ${message}`)
      return {
        success: false,
        error: message,
        usage: { inputTokens: 0, outputTokens: 0, estimatedCost: 0 },
      }
    }
  }

  async generateImage(prompt: string, size = '1024x1024'): Promise<AIGenerationResult<string>> {
    const model = MODEL_CONFIG.image
    const start = Date.now()

    try {
      const client = getClient()
      const response = await client.images.generate({
        model,
        prompt,
        n: 1,
        size: size as '1024x1024' | '1792x1024' | '1024x1792',
      })

      const imageData = response.data?.[0]
      // gpt-image-2 may return base64 or url depending on response_format
      const url = imageData?.url ?? ''
      const estimatedCost = calculateImageCost(model, 1)

      console.log(`[AI] generate_image | model=${model} | $${estimatedCost.toFixed(4)} | ${Date.now() - start}ms`)

      return {
        success: true,
        data: url,
        usage: {
          inputTokens: 0,
          outputTokens: 0,
          estimatedCost,
          imageGenerationCount: 1,
          imageCost: estimatedCost,
          durationMs: Date.now() - start,
        },
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[AI] generateImage failed: ${message}`)
      return {
        success: false,
        error: message,
        usage: { inputTokens: 0, outputTokens: 0, estimatedCost: 0 },
      }
    }
  }
}
