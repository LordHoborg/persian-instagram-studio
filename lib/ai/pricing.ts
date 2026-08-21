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
  // Primary models
  'gpt-5.6-luna': {
    inputPerMillion: parseFloat(process.env.PRICE_GPT56_LUNA_INPUT ?? '0.20'),
    cachedInputPerMillion: parseFloat(process.env.PRICE_GPT56_LUNA_CACHED ?? '0.02'),
    outputPerMillion: parseFloat(process.env.PRICE_GPT56_LUNA_OUTPUT ?? '1.20'),
    metadata: VERIFIED_PRICING_METADATA,
  },
  'gpt-5.6-terra': {
    inputPerMillion: parseFloat(process.env.PRICE_GPT56_TERRA_INPUT ?? '2.00'),
    cachedInputPerMillion: parseFloat(process.env.PRICE_GPT56_TERRA_CACHED ?? '0.20'),
    outputPerMillion: parseFloat(process.env.PRICE_GPT56_TERRA_OUTPUT ?? '12.00'),
    metadata: VERIFIED_PRICING_METADATA,
  },
  'gpt-5.6-sol': {
    inputPerMillion: parseFloat(process.env.PRICE_GPT56_SOL_INPUT ?? '5.00'),
    cachedInputPerMillion: parseFloat(process.env.PRICE_GPT56_SOL_CACHED ?? '0.50'),
    outputPerMillion: parseFloat(process.env.PRICE_GPT56_SOL_OUTPUT ?? '30.00'),
    metadata: VERIFIED_PRICING_METADATA,
  },
  // Fallback models (available if overridden via env vars)
  'gpt-4o': {
    inputPerMillion: parseFloat(process.env.PRICE_GPT4O_INPUT ?? '2.50'),
    cachedInputPerMillion: parseFloat(process.env.PRICE_GPT4O_CACHED ?? '1.25'),
    outputPerMillion: parseFloat(process.env.PRICE_GPT4O_OUTPUT ?? '10.00'),
    metadata: VERIFIED_PRICING_METADATA,
  },
  'gpt-4o-mini': {
    inputPerMillion: parseFloat(process.env.PRICE_GPT4O_MINI_INPUT ?? '0.15'),
    cachedInputPerMillion: parseFloat(process.env.PRICE_GPT4O_MINI_CACHED ?? '0.075'),
    outputPerMillion: parseFloat(process.env.PRICE_GPT4O_MINI_OUTPUT ?? '0.6'),
    metadata: VERIFIED_PRICING_METADATA,
  },
  'gpt-4.1': {
    inputPerMillion: parseFloat(process.env.PRICE_GPT41_INPUT ?? '2.00'),
    cachedInputPerMillion: parseFloat(process.env.PRICE_GPT41_CACHED ?? '0.50'),
    outputPerMillion: parseFloat(process.env.PRICE_GPT41_OUTPUT ?? '8.00'),
    metadata: VERIFIED_PRICING_METADATA,
  },
  'gpt-4.1-mini': {
    inputPerMillion: parseFloat(process.env.PRICE_GPT41_MINI_INPUT ?? '0.40'),
    cachedInputPerMillion: parseFloat(process.env.PRICE_GPT41_MINI_CACHED ?? '0.10'),
    outputPerMillion: parseFloat(process.env.PRICE_GPT41_MINI_OUTPUT ?? '1.60'),
    metadata: VERIFIED_PRICING_METADATA,
  },
  'gpt-5': {
    inputPerMillion: parseFloat(process.env.PRICE_GPT5_INPUT ?? '1.25'),
    cachedInputPerMillion: parseFloat(process.env.PRICE_GPT5_CACHED ?? '0.125'),
    outputPerMillion: parseFloat(process.env.PRICE_GPT5_OUTPUT ?? '10.00'),
    metadata: VERIFIED_PRICING_METADATA,
  },
}

export interface ImagePricingExtended extends ImagePricing {
  textInputPerMillion?: number
  cachedTextInputPerMillion?: number
}

export const IMAGE_MODEL_PRICING: Record<string, ImagePricingExtended> = {
  // gpt-image-2 pricing (image tokens):
  //   image input: $8.00/1M, cached image input: $2.00/1M, image output: $30.00/1M
  //   text input: $5.00/1M, cached text input: $1.25/1M
  'gpt-image-2': {
    inputPerMillion: parseFloat(process.env.PRICE_GPT_IMAGE_2_INPUT ?? '8'),
    cachedInputPerMillion: parseFloat(process.env.PRICE_GPT_IMAGE_2_CACHED ?? '2'),
    outputPerMillion: parseFloat(process.env.PRICE_GPT_IMAGE_2_OUTPUT ?? '30'),
    textInputPerMillion: parseFloat(process.env.PRICE_GPT_IMAGE_2_TEXT_INPUT ?? '5'),
    cachedTextInputPerMillion: parseFloat(process.env.PRICE_GPT_IMAGE_2_TEXT_CACHED ?? '1.25'),
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

  // Estimated output token counts per image size for gpt-image-2.
  // These are approximations; actual token counts vary by quality setting.
  const defaultOutputTokensBySize: Record<string, number> = {
    '1024x1024': 2667,
    '1024x1536': 4667,
    '1536x1024': 4667,
  }

  const estimatedOutputTokens = defaultOutputTokensBySize[options.size ?? '1024x1024'] ?? defaultOutputTokensBySize['1024x1024']
  return count * ((estimatedOutputTokens / 1_000_000) * pricing.outputPerMillion)
}

export function calculateWebSearchCost(calls: number): number {
  return calls * WEB_SEARCH_COST_PER_CALL
}
