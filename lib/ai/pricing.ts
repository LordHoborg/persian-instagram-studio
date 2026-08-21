// lib/ai/pricing.ts
// Static pricing defaults verified against current OpenAI pricing docs.
// Update these values whenever OpenAI changes rates.

export interface PricingMetadata {
  sourceDescription: string
  updatedAt: string
}

export interface TextPricing {
  inputPerMillion: number
  cachedInputPerMillion?: number
  outputPerMillion: number
  metadata: PricingMetadata
}

export interface ImagePricing {
  inputPerMillion?: number
  cachedInputPerMillion?: number
  outputPerMillion?: number
  metadata: PricingMetadata
}

export interface ImageCostOptions {
  size?: string
  inputTokens?: number
  outputTokens?: number
  cachedInputTokens?: number
}

const VERIFIED_PRICING_METADATA: PricingMetadata = {
  sourceDescription: 'Verified against the current official OpenAI pricing page.',
  updatedAt: '2026-08-21',
}

const FALLBACK_INPUT_PER_MILLION = parseFloat(process.env.AI_FALLBACK_INPUT_COST_PER_MILLION ?? '5')
const FALLBACK_OUTPUT_PER_MILLION = parseFloat(process.env.AI_FALLBACK_OUTPUT_COST_PER_MILLION ?? '15')
const FALLBACK_CACHED_INPUT_PER_MILLION = parseFloat(
  process.env.AI_FALLBACK_CACHED_INPUT_COST_PER_MILLION ?? String(FALLBACK_INPUT_PER_MILLION * 0.5)
)

export const TEXT_MODEL_PRICING: Record<string, TextPricing> = {
  'gpt-5.6-luna': {
    inputPerMillion: parseFloat(process.env.PRICE_GPT56_LUNA_INPUT ?? '0.5'),
    cachedInputPerMillion: parseFloat(process.env.PRICE_GPT56_LUNA_CACHED ?? '0.05'),
    outputPerMillion: parseFloat(process.env.PRICE_GPT56_LUNA_OUTPUT ?? '3'),
    metadata: VERIFIED_PRICING_METADATA,
  },
  'gpt-5.6-terra': {
    inputPerMillion: parseFloat(process.env.PRICE_GPT56_TERRA_INPUT ?? '1.25'),
    cachedInputPerMillion: parseFloat(process.env.PRICE_GPT56_TERRA_CACHED ?? '0.125'),
    outputPerMillion: parseFloat(process.env.PRICE_GPT56_TERRA_OUTPUT ?? '7.5'),
    metadata: VERIFIED_PRICING_METADATA,
  },
  'gpt-5.6-sol': {
    inputPerMillion: parseFloat(process.env.PRICE_GPT56_SOL_INPUT ?? '2.5'),
    cachedInputPerMillion: parseFloat(process.env.PRICE_GPT56_SOL_CACHED ?? '0.25'),
    outputPerMillion: parseFloat(process.env.PRICE_GPT56_SOL_OUTPUT ?? '15'),
    metadata: VERIFIED_PRICING_METADATA,
  },
  'gpt-4o': {
    inputPerMillion: 5,
    cachedInputPerMillion: 2.5,
    outputPerMillion: 15,
    metadata: VERIFIED_PRICING_METADATA,
  },
  'gpt-4o-mini': {
    inputPerMillion: 0.15,
    cachedInputPerMillion: 0.075,
    outputPerMillion: 0.6,
    metadata: VERIFIED_PRICING_METADATA,
  },
}

export const IMAGE_MODEL_PRICING: Record<string, ImagePricing> = {
  'gpt-image-2': {
    inputPerMillion: parseFloat(process.env.PRICE_GPT_IMAGE_2_INPUT ?? '4'),
    cachedInputPerMillion: parseFloat(process.env.PRICE_GPT_IMAGE_2_CACHED ?? '1'),
    outputPerMillion: parseFloat(process.env.PRICE_GPT_IMAGE_2_OUTPUT ?? '15'),
    metadata: VERIFIED_PRICING_METADATA,
  },
}

export const WEB_SEARCH_COST_PER_CALL = parseFloat(process.env.AI_WEB_SEARCH_COST_PER_CALL ?? '0.01')

export function calculateTextCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cachedInputTokens = 0
): number {
  const pricing = TEXT_MODEL_PRICING[model]
  if (!pricing) {
    console.warn(`[pricing] Unknown model "${model}" — using fallback rates. Set PRICE_* env vars to configure.`)
    const uncached = Math.max(0, inputTokens - cachedInputTokens)
    return (
      (uncached / 1_000_000) * FALLBACK_INPUT_PER_MILLION +
      (cachedInputTokens / 1_000_000) * FALLBACK_CACHED_INPUT_PER_MILLION +
      (outputTokens / 1_000_000) * FALLBACK_OUTPUT_PER_MILLION
    )
  }

  const cachedRate = pricing.cachedInputPerMillion ?? pricing.inputPerMillion * 0.5
  const uncachedInput = Math.max(0, inputTokens - cachedInputTokens)
  return (
    (uncachedInput / 1_000_000) * pricing.inputPerMillion +
    (cachedInputTokens / 1_000_000) * cachedRate +
    (outputTokens / 1_000_000) * pricing.outputPerMillion
  )
}

export function calculateImageCost(model: string, count: number, options: ImageCostOptions = {}): number {
  const pricing = IMAGE_MODEL_PRICING[model]
  if (!pricing?.outputPerMillion) {
    console.warn(`[pricing] Unknown image model "${model}" — using configurable fallback.`)
    return count * parseFloat(process.env.PRICE_UNKNOWN_IMAGE_PER_IMAGE ?? '0')
  }

  const inputTokens = options.inputTokens ?? 0
  const outputTokens = options.outputTokens ?? 0
  const cachedInputTokens = options.cachedInputTokens ?? 0

  if (inputTokens > 0 || outputTokens > 0 || cachedInputTokens > 0) {
    const cachedRate = pricing.cachedInputPerMillion ?? pricing.inputPerMillion ?? 0
    const uncachedInput = Math.max(0, inputTokens - cachedInputTokens)
    return (
      (uncachedInput / 1_000_000) * (pricing.inputPerMillion ?? 0) +
      (cachedInputTokens / 1_000_000) * cachedRate +
      (outputTokens / 1_000_000) * pricing.outputPerMillion
    )
  }

  const defaultOutputTokensBySize: Record<string, number> = {
    '1024x1024': 2667,
    '1024x1792': 4667,
    '1792x1024': 4667,
  }

  const estimatedOutputTokens = defaultOutputTokensBySize[options.size ?? '1024x1024'] ?? defaultOutputTokensBySize['1024x1024']
  return count * ((estimatedOutputTokens / 1_000_000) * pricing.outputPerMillion)
}

export function calculateWebSearchCost(calls: number): number {
  return calls * WEB_SEARCH_COST_PER_CALL
}
