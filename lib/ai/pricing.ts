// lib/ai/pricing.ts
// Centralized AI pricing — update when OpenAI changes rates.
// Rates are stored per 1,000,000 tokens (as OpenAI communicates them).
// Unknown/future model prices are configurable via environment variables.

export interface TextPricing {
  inputPerMillion: number
  cachedInputPerMillion?: number
  outputPerMillion: number
}

export interface ImagePricing {
  /** Cost per image generation */
  perImage: number
}

// ---------------------------------------------------------------------------
// Configurable fallback rates for new/unknown models (set via env vars)
// ---------------------------------------------------------------------------
const FALLBACK_INPUT_PER_MILLION = parseFloat(process.env.AI_FALLBACK_INPUT_COST_PER_MILLION ?? '5')
const FALLBACK_OUTPUT_PER_MILLION = parseFloat(process.env.AI_FALLBACK_OUTPUT_COST_PER_MILLION ?? '15')

// ---------------------------------------------------------------------------
// Text model pricing (per 1,000,000 tokens)
// NOTE: gpt-5.6-* are new model aliases. Prices below are placeholders —
// update them when OpenAI publishes official rates.
// Set AI_FALLBACK_INPUT_COST_PER_MILLION / AI_FALLBACK_OUTPUT_COST_PER_MILLION
// in .env to override the fallback until official prices are known.
// ---------------------------------------------------------------------------
export const TEXT_MODEL_PRICING: Record<string, TextPricing> = {
  // New project models (prices TBD — using env-configurable fallback)
  'gpt-5.6-luna': {
    inputPerMillion: parseFloat(process.env.PRICE_GPT56_LUNA_INPUT ?? String(FALLBACK_INPUT_PER_MILLION * 0.03)),
    cachedInputPerMillion: parseFloat(process.env.PRICE_GPT56_LUNA_CACHED ?? String(FALLBACK_INPUT_PER_MILLION * 0.015)),
    outputPerMillion: parseFloat(process.env.PRICE_GPT56_LUNA_OUTPUT ?? String(FALLBACK_OUTPUT_PER_MILLION * 0.04)),
  },
  'gpt-5.6-terra': {
    inputPerMillion: parseFloat(process.env.PRICE_GPT56_TERRA_INPUT ?? String(FALLBACK_INPUT_PER_MILLION)),
    cachedInputPerMillion: parseFloat(process.env.PRICE_GPT56_TERRA_CACHED ?? String(FALLBACK_INPUT_PER_MILLION * 0.5)),
    outputPerMillion: parseFloat(process.env.PRICE_GPT56_TERRA_OUTPUT ?? String(FALLBACK_OUTPUT_PER_MILLION)),
  },
  'gpt-5.6-sol': {
    inputPerMillion: parseFloat(process.env.PRICE_GPT56_SOL_INPUT ?? String(FALLBACK_INPUT_PER_MILLION * 3)),
    cachedInputPerMillion: parseFloat(process.env.PRICE_GPT56_SOL_CACHED ?? String(FALLBACK_INPUT_PER_MILLION * 1.5)),
    outputPerMillion: parseFloat(process.env.PRICE_GPT56_SOL_OUTPUT ?? String(FALLBACK_OUTPUT_PER_MILLION * 4)),
  },
  // Legacy models kept for reference / backward compat
  'gpt-4o': { inputPerMillion: 5, cachedInputPerMillion: 2.5, outputPerMillion: 15 },
  'gpt-4o-mini': { inputPerMillion: 0.15, cachedInputPerMillion: 0.075, outputPerMillion: 0.6 },
  'o1-mini': { inputPerMillion: 3, outputPerMillion: 12 },
  'o1': { inputPerMillion: 15, outputPerMillion: 60 },
  'gpt-4-turbo': { inputPerMillion: 10, outputPerMillion: 30 },
}

// ---------------------------------------------------------------------------
// Image model pricing
// ---------------------------------------------------------------------------
export const IMAGE_MODEL_PRICING: Record<string, ImagePricing> = {
  'gpt-image-2': { perImage: parseFloat(process.env.PRICE_GPT_IMAGE_2 ?? '0.04') },
  'gpt-image-1': { perImage: 0.04 },
  'dall-e-3': { perImage: 0.04 },
  'dall-e-2': { perImage: 0.02 },
}

/** Web search tool cost per call (configurable) */
export const WEB_SEARCH_COST_PER_CALL = parseFloat(process.env.AI_WEB_SEARCH_COST_PER_CALL ?? '0.01')

// ---------------------------------------------------------------------------
// Cost calculation helpers
// ---------------------------------------------------------------------------

export function calculateTextCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cachedInputTokens = 0
): number {
  const pricing = TEXT_MODEL_PRICING[model]
  if (!pricing) {
    // Unknown model — use configurable fallback and warn
    console.warn(`[pricing] Unknown model "${model}" — using fallback rates. Set PRICE_* env vars to configure.`)
    const uncached = inputTokens - cachedInputTokens
    return (
      (uncached / 1_000_000) * FALLBACK_INPUT_PER_MILLION +
      (cachedInputTokens / 1_000_000) * (FALLBACK_INPUT_PER_MILLION * 0.5) +
      (outputTokens / 1_000_000) * FALLBACK_OUTPUT_PER_MILLION
    )
  }
  const cachedRate = pricing.cachedInputPerMillion ?? pricing.inputPerMillion * 0.5
  const uncachedInput = inputTokens - cachedInputTokens
  return (
    (uncachedInput / 1_000_000) * pricing.inputPerMillion +
    (cachedInputTokens / 1_000_000) * cachedRate +
    (outputTokens / 1_000_000) * pricing.outputPerMillion
  )
}

export function calculateImageCost(model: string, count: number): number {
  const pricing = IMAGE_MODEL_PRICING[model]
  if (!pricing) {
    console.warn(`[pricing] Unknown image model "${model}" — using gpt-image-2 fallback rate.`)
    return (IMAGE_MODEL_PRICING['gpt-image-2']?.perImage ?? 0.04) * count
  }
  return pricing.perImage * count
}

/** Calculate web search cost */
export function calculateWebSearchCost(calls: number): number {
  return calls * WEB_SEARCH_COST_PER_CALL
}
