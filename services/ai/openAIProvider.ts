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
import { generateId } from '@/lib/utils'

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
  // Some API versions nest citation under a `url_citation` sub-key
  url_citation?: {
    url?: string
    title?: string
    publisher?: string
    published_at?: string
  }
}

/**
 * Collect all annotation-like objects from every possible location in a
 * Responses API response:
 *   1. output[].content[output_text].annotations  (standard path)
 *   2. output[].content[output_text].text (scan for inline citation markers — future-proof)
 *
 * When using json_schema format, OpenAI strips inline annotations from the
 * structured output message.  We therefore run a separate plain-text web-search
 * phase first (see researchWithWebSearch) and pass that response here.
 */
function extractTextAnnotations(response: OpenAI.Responses.Response): AnnotationLike[] {
  const annotations: AnnotationLike[] = []

  for (const item of response.output ?? []) {
    if (item.type !== 'message') continue

    for (const content of (item as unknown as { content?: unknown[] }).content ?? []) {
      const c = content as Record<string, unknown>
      if (c['type'] !== 'output_text') continue

      // Primary path: annotations array on the output_text content block
      const contentAnnotations = (c['annotations'] as AnnotationLike[] | undefined) ?? []
      annotations.push(...contentAnnotations)
    }
  }

  return annotations
}

/**
 * Convert raw annotation objects into ResearchSource records.
 *
 * Handles two known shapes:
 *   Shape A (flat):   { type: "url_citation", url, title, publisher, published_at }
 *   Shape B (nested): { type: "url_citation", url_citation: { url, title, ... } }
 *
 * Deduplicates by URL.
 */
function extractWebSearchSources(response: OpenAI.Responses.Response): ResearchSource[] {
  const annotations = extractTextAnnotations(response)
  const sources: ResearchSource[] = []
  const seen = new Set<string>()

  for (const annotation of annotations) {
    if (annotation.type !== 'url_citation') continue

    // Resolve the actual fields — handle both flat and nested shapes
    const nested = annotation.url_citation
    const rawUrl = nested?.url ?? annotation.url
    const rawTitle = nested?.title ?? annotation.title
    const rawPublisher = nested?.publisher ?? annotation.publisher
    const rawPublishedAt = nested?.published_at ?? annotation.published_at ?? annotation.publishedAt

    const url = typeof rawUrl === 'string' ? rawUrl.trim() : ''
    if (!url || seen.has(url)) continue
    seen.add(url)

    const title = typeof rawTitle === 'string' && rawTitle.trim() ? rawTitle.trim() : url
    const publisher = typeof rawPublisher === 'string' && rawPublisher.trim() ? rawPublisher.trim() : undefined
    const publishedAt = typeof rawPublishedAt === 'string' && rawPublishedAt.trim() ? rawPublishedAt.trim() : undefined

    sources.push({
      id: generateId(),
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
  // Primary: count web_search_call output items
  const fromOutput = (response.output ?? []).filter(item => item.type === 'web_search_call').length
  if (fromOutput > 0) return fromOutput

  // Fallback: read tool_usage.web_search.num_requests if present (Responses API v2+)
  const toolUsage = (response as unknown as Record<string, unknown>)['tool_usage'] as
    | { web_search?: { num_requests?: number } }
    | undefined
  return toolUsage?.web_search?.num_requests ?? 0
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

      // ── Phase 1: plain-text web search ──────────────────────────────────────
      // OpenAI's Responses API only injects url_citation annotations into
      // plain-text (non-json_schema) output.  When json_schema format is active
      // the structured message carries no annotations at all.
      // We therefore run a plain-text search first to harvest real citations,
      // then feed the annotated text into a structured extraction call.
      //
      // IMPORTANT: the system prompt must NOT ask for JSON or structured output —
      // that causes the model to suppress inline citations even in plain-text mode.
      const searchResponse = await client.responses.create({
        model,
        input: [
          {
            role: 'system',
            content:
              'You are a research assistant. Use the web search tool to research the topic thoroughly. ' +
              'Write a detailed, narrative answer in Persian prose (NOT JSON, NOT bullet lists). ' +
              'Cite your sources inline as you write — this is critical.',
          },
          {
            role: 'user',
            // Strip any JSON-formatting instructions from the original prompt
            // so the model writes narrative text and preserves inline citations.
            content: `درباره موضوع زیر تحقیق کن و یک متن روایی مفصل به فارسی بنویس. از JSON یا لیست استفاده نکن.\n\n${request.prompt}`,
          },
        ],
        tools: [{ type: 'web_search_preview' }],
        // No json_schema format here — plain text so annotations are preserved
        max_output_tokens: request.maxTokens ?? 4000,
      })

      const searchText = searchResponse.output_text ?? ''
      const webSearchCalls = countWebSearchCalls(searchResponse)
      const sources = extractWebSearchSources(searchResponse)

      console.log(`[AI] researchWithWebSearch phase-1: webSearchCalls=${webSearchCalls}, sources=${sources.length}`)

      // ── Phase 2: structured extraction from the annotated text ──────────────
      // Feed the plain-text research result into a structured call (no web
      // search needed — we already have the content).
      const structuredResponse = await client.responses.create({
        model,
        input: [
          {
            role: 'system',
            content:
              'You are given research text. Extract the requested structured data from it. Return only valid JSON matching the schema. Do not invent new information.',
          },
          {
            role: 'user',
            content: `متن تحقیق:\n${searchText}\n\nاطلاعات بالا را به فرمت JSON درخواستی تبدیل کن.`,
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

      const rawText = structuredResponse.output_text ?? '{}'
      const parsed = parseStructuredOutput(rawText, request)

      // Combine usage from both phases
      const phase1Usage = searchResponse.usage
      const phase2Usage = structuredResponse.usage
      const combinedInputTokens = (phase1Usage?.input_tokens ?? 0) + (phase2Usage?.input_tokens ?? 0)
      const combinedOutputTokens = (phase1Usage?.output_tokens ?? 0) + (phase2Usage?.output_tokens ?? 0)
      const phase1Details = (phase1Usage as { input_tokens_details?: { cached_tokens?: number } } | undefined)
        ?.input_tokens_details
      const phase2Details = (phase2Usage as { input_tokens_details?: { cached_tokens?: number } } | undefined)
        ?.input_tokens_details
      const combinedCached = (phase1Details?.cached_tokens ?? 0) + (phase2Details?.cached_tokens ?? 0)
      const webSearchCost = calculateWebSearchCost(webSearchCalls)
      const textCost = calculateTextCost(model, combinedInputTokens, combinedOutputTokens, combinedCached)

      const usageMeta: AIUsageMetadata = {
        inputTokens: combinedInputTokens,
        cachedInputTokens: combinedCached,
        outputTokens: combinedOutputTokens,
        reasoningTokens: 0,
        estimatedCost: textCost,
        webSearchCalls,
        webSearchCost,
        toolCalls: webSearchCalls,
        durationMs: Date.now() - start,
      }

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
          sources,
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
