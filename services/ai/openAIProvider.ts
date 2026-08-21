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
  GeneratedImageResult,
  ResearchSource,
} from './types'
import { MODEL_CONFIG, getModelForOperation } from './modelConfig'
import {
  calculateTextCost,
  calculateImageCost,
  calculateWebSearchCost,
  TEXT_MODEL_PRICING,
} from '@/lib/ai/pricing'

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

const AVAILABLE_MODELS: AIModelConfig[] = Object.entries(TEXT_MODEL_PRICING).map(([id, p]) => ({
  id,
  name: id,
  provider: 'openai',
  costPer1kInput: p.inputPerMillion / 1000,
  costPer1kOutput: p.outputPerMillion / 1000,
  capabilities: ['text', 'structured'],
}))

function extractUsage(
  model: string,
  usage: OpenAI.Responses.ResponseUsage | undefined,
  start: number,
  extras: Partial<AIUsageMetadata> = {}
): AIUsageMetadata {
  const inputTokens = usage?.input_tokens ?? 0
  const outputTokens = usage?.output_tokens ?? 0
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
    ...extras,
  }
}

function parseStructuredOutput<T>(rawText: string, request: StructuredGenerationRequest<T>): { success: true; data: T } | { success: false; error: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(rawText)
  } catch {
    return {
      success: false,
      error: 'AI returned invalid JSON',
    }
  }

  const validated = request.schema.safeParse(parsed)
  if (!validated.success) {
    console.error(`[AI] Zod validation failed for ${request.operation}:`, validated.error.flatten())
    return {
      success: false,
      error: `Schema validation failed: ${validated.error.message}`,
    }
  }

  return { success: true, data: validated.data }
}

type AnnotationLike = {
  type?: string
  url?: string
  title?: string
  publisher?: string
  published_at?: string
  publishedAt?: string
}

function extractTextAnnotations(response: OpenAI.Responses.Response): AnnotationLike[] {
  const annotations: AnnotationLike[] = []

  for (const item of response.output ?? []) {
    if (item.type !== 'message') continue

    for (const content of item.content ?? []) {
      if (content.type !== 'output_text') continue
      const contentAnnotations = ((content as unknown) as { annotations?: AnnotationLike[] }).annotations ?? []
      annotations.push(...contentAnnotations)
    }
  }

  return annotations
}

function extractWebSearchSources(response: OpenAI.Responses.Response): ResearchSource[] {
  const annotations = extractTextAnnotations(response)
  const sources: ResearchSource[] = []
  const seen = new Set<string>()

  for (const annotation of annotations) {
    // Only process url_citation annotations from the Responses API
    if (annotation.type !== 'url_citation') continue
    const url = typeof annotation.url === 'string' ? annotation.url.trim() : ''
    if (!url || seen.has(url)) continue
    seen.add(url)

    const title = typeof annotation.title === 'string' && annotation.title.trim() ? annotation.title.trim() : url
    const publisher = typeof annotation.publisher === 'string' && annotation.publisher.trim() ? annotation.publisher.trim() : undefined
    const publishedAt = typeof annotation.published_at === 'string' && annotation.published_at.trim()
      ? annotation.published_at.trim()
      : typeof annotation.publishedAt === 'string' && annotation.publishedAt.trim()
        ? annotation.publishedAt.trim()
        : undefined

    sources.push({
      id: `source_${sources.length + 1}`,
      title,
      url,
      publisher,
      publishedAt,
      provenance: 'openai_web_search',
      verificationStatus: 'verified',
    })
  }

  return sources
}

function countWebSearchCalls(response: OpenAI.Responses.Response): number {
  return (response.output ?? []).filter(item => item.type === 'web_search_call').length
}

/**
 * Sanitize a JSON Schema (draft-07) object for use with OpenAI Structured Outputs (strict mode).
 *
 * OpenAI strict mode requires:
 * - All object properties must be listed in `required`
 * - No `additionalProperties: true`
 * - No `$schema` key
 * - No draft-07 numeric `exclusiveMinimum` (convert to `minimum`)
 * - No `default` keys
 *
 * This function applies all fixes recursively.
 */
function sanitizeSchemaForOpenAI(schema: unknown): unknown {
  if (schema === null || typeof schema !== 'object') return schema
  if (Array.isArray(schema)) return schema.map(sanitizeSchemaForOpenAI)

  const obj = schema as Record<string, unknown>
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (key === '$schema') continue
    if (key === 'default') continue
    if (key === 'additionalProperties' && value === true) continue
    if (key === 'exclusiveMinimum' && typeof value === 'number') {
      result['minimum'] = Number.isInteger(value) ? value + 1 : value
      continue
    }
    result[key] = sanitizeSchemaForOpenAI(value)
  }

  // OpenAI strict mode: if this is an object schema with properties,
  // all property keys must appear in `required`
  if (
    result['type'] === 'object' &&
    result['properties'] &&
    typeof result['properties'] === 'object' &&
    !Array.isArray(result['properties'])
  ) {
    const allKeys = Object.keys(result['properties'] as Record<string, unknown>)
    result['required'] = allKeys
    // strict mode also requires additionalProperties: false
    if (!('additionalProperties' in result)) {
      result['additionalProperties'] = false
    }
  }

  return result
}

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
      })

      const text = response.output_text ?? ''
      const usageMeta = extractUsage(model, response.usage, start)

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
      const rawSchema = zodToJsonSchema(request.schema, { target: 'jsonSchema7' })
      const jsonSchema = sanitizeSchemaForOpenAI(rawSchema)

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
      })

      const rawText = response.output_text ?? '{}'
      const usageMeta = extractUsage(model, response.usage, start)
      const parsed = parseStructuredOutput(rawText, request)

      if (!parsed?.success) {
        return {
          success: false,
          error: parsed?.error ?? 'Schema validation failed',
          usage: usageMeta,
        }
      }

      return { success: true, data: parsed.data, usage: usageMeta }
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

  async researchWithWebSearch(request: StructuredGenerationRequest<unknown>): Promise<AIGenerationResult<unknown>> {
    const model = request.model ?? getModelForOperation(request.operation)
    const start = Date.now()

    try {
      const client = getClient()
      const rawSchema = zodToJsonSchema(request.schema, { target: 'jsonSchema7' })
      const jsonSchema = sanitizeSchemaForOpenAI(rawSchema)

      const response = await client.responses.create({
        model,
        input: [
          {
            role: 'system',
            content:
              'Use the web search tool when needed. Return only valid JSON matching the schema. Do not invent citations or URLs.',
          },
          {
            role: 'user',
            content: request.prompt,
          },
        ],
        tools: [{ type: 'web_search_preview' }],
        text: {
          format: {
            type: 'json_schema',
            name: request.operation,
            schema: jsonSchema as Record<string, unknown>,
            strict: true,
          },
        },
        max_output_tokens: request.maxTokens ?? 4000,
      })

      const rawText = response.output_text ?? '{}'
      const parsed = parseStructuredOutput(rawText, request)
      const webSearchCalls = countWebSearchCalls(response)
      const webSearchCost = calculateWebSearchCost(webSearchCalls)
      const toolCalls = webSearchCalls
      const usageMeta = extractUsage(model, response.usage, start, {
        webSearchCalls,
        webSearchCost,
        toolCalls,
      })

      if (!parsed?.success) {
        return {
          success: false,
          error: parsed?.error ?? 'Schema validation failed',
          usage: usageMeta,
        }
      }

      return {
        success: true,
        data: {
          summary: parsed.data,
          sources: extractWebSearchSources(response),
        },
        usage: usageMeta,
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[AI] researchWithWebSearch failed: ${message}`)
      return {
        success: false,
        error: message,
        usage: { inputTokens: 0, outputTokens: 0, estimatedCost: 0, webSearchCalls: 0, webSearchCost: 0, toolCalls: 0 },
      }
    }
  }

  async generateImage(prompt: string, size = '1024x1024'): Promise<AIGenerationResult<GeneratedImageResult>> {
    const model = MODEL_CONFIG.image
    const start = Date.now()

    try {
      const client = getClient()
      const response = await client.images.generate({
        model,
        prompt,
        n: 1,
        size: size as '1024x1024' | '1536x1024' | '1024x1536' | 'auto',
      })

      const imageData = response.data?.[0]
      const base64 = imageData?.b64_json?.trim()
      const url = imageData?.url?.trim()

      let asset: GeneratedImageResult | undefined
      if (base64) {
        asset = {
          assetType: 'base64',
          data: base64,
          mimeType: 'image/png',
          model,
          size,
        }
      } else if (url) {
        asset = {
          assetType: 'url',
          data: url,
          mimeType: 'image/png',
          model,
          size,
        }
      }

      if (!asset) {
        return {
          success: false,
          error: 'Image generation returned no usable image payload.',
          usage: { inputTokens: 0, outputTokens: 0, estimatedCost: 0, imageGenerationCount: 0, imageCost: 0, durationMs: Date.now() - start },
        }
      }

      const estimatedCost = calculateImageCost(model, 1, { size })

      return {
        success: true,
        data: asset,
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
