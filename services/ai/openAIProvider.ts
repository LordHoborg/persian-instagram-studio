// services/ai/openAIProvider.ts
import OpenAI from 'openai'
import { z } from 'zod'
import { AIProviderInterface, AIGenerationRequest, AIGenerationResult, AIModelConfig } from './types'
import { MODEL_CONFIG, getModelForOperation } from './modelConfig'
import { calculateTextCost, calculateImageCost, TEXT_MODEL_PRICING, IMAGE_MODEL_PRICING } from '@/lib/ai/pricing'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const AVAILABLE_MODELS: AIModelConfig[] = Object.entries(TEXT_MODEL_PRICING).map(([id, p]) => ({
  id,
  name: id,
  provider: 'openai',
  costPer1kInput: p.inputPer1k,
  costPer1kOutput: p.outputPer1k,
  capabilities: ['text', 'structured'],
}))

export class OpenAIProvider implements AIProviderInterface {
  getAvailableModels(): AIModelConfig[] {
    return AVAILABLE_MODELS
  }

  async generateText(request: AIGenerationRequest): Promise<AIGenerationResult<string>> {
    const model = request.model ?? getModelForOperation(request.operation)
    const start = Date.now()

    try {
      const response = await client.responses.create({
        model,
        input: request.prompt,
        max_output_tokens: request.maxTokens ?? 2000,
        temperature: request.temperature ?? 0.7,
      })

      const text = response.output_text ?? ''
      const usage = response.usage
      const inputTokens = usage?.input_tokens ?? 0
      const outputTokens = usage?.output_tokens ?? 0
      const cachedInputTokens = (usage as any)?.input_tokens_details?.cached_tokens ?? 0
      const estimatedCost = calculateTextCost(model, inputTokens, outputTokens, cachedInputTokens)

      console.log(`[AI] ${request.operation} | model=${model} | ${inputTokens}+${outputTokens} tokens | $${estimatedCost.toFixed(5)} | ${Date.now() - start}ms`)

      return {
        success: true,
        data: text,
        usage: { inputTokens, outputTokens, estimatedCost },
      }
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

  async generateStructured<T>(request: AIGenerationRequest): Promise<AIGenerationResult<T>> {
    const model = request.model ?? getModelForOperation(request.operation)
    const start = Date.now()

    try {
      const response = await client.responses.create({
        model,
        input: [
          {
            role: 'system',
            content: 'You must respond with valid JSON only. No markdown, no explanation, just the JSON object.',
          },
          {
            role: 'user',
            content: request.prompt,
          },
        ],
        text: {
          format: {
            type: 'json_object',
          },
        },
        max_output_tokens: request.maxTokens ?? 4000,
        temperature: request.temperature ?? 0.7,
      })

      const rawText = response.output_text ?? '{}'
      const usage = response.usage
      const inputTokens = usage?.input_tokens ?? 0
      const outputTokens = usage?.output_tokens ?? 0
      const cachedInputTokens = (usage as any)?.input_tokens_details?.cached_tokens ?? 0
      const estimatedCost = calculateTextCost(model, inputTokens, outputTokens, cachedInputTokens)

      console.log(`[AI] ${request.operation} | model=${model} | ${inputTokens}+${outputTokens} tokens | $${estimatedCost.toFixed(5)} | ${Date.now() - start}ms`)

      let parsed: T
      try {
        parsed = JSON.parse(rawText) as T
      } catch {
        return {
          success: false,
          error: 'AI returned invalid JSON',
          usage: { inputTokens, outputTokens, estimatedCost },
        }
      }

      return {
        success: true,
        data: parsed,
        usage: { inputTokens, outputTokens, estimatedCost },
      }
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
      const response = await client.images.generate({
        model,
        prompt,
        n: 1,
        size: size as '1024x1024' | '1792x1024' | '1024x1792',
      })

      const url = response.data?.[0]?.url ?? ''
      const estimatedCost = calculateImageCost(model, 1)

      console.log(`[AI] generate_image | model=${model} | $${estimatedCost.toFixed(4)} | ${Date.now() - start}ms`)

      return {
        success: true,
        data: url,
        usage: { inputTokens: 0, outputTokens: 0, estimatedCost },
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
