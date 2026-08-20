// lib/ai/pricing.ts
// Centralized AI pricing — update when OpenAI changes rates
// Prices are per 1,000 tokens (text) or per image

export interface ModelPricing {
  inputPer1k: number
  outputPer1k: number
  cachedInputPer1k?: number
}

export const TEXT_MODEL_PRICING: Record<string, ModelPricing> = {
  'gpt-4o': { inputPer1k: 0.005, outputPer1k: 0.015, cachedInputPer1k: 0.0025 },
  'gpt-4o-mini': { inputPer1k: 0.00015, outputPer1k: 0.0006, cachedInputPer1k: 0.000075 },
  'o1-mini': { inputPer1k: 0.003, outputPer1k: 0.012 },
  'o1': { inputPer1k: 0.015, outputPer1k: 0.06 },
  'gpt-4-turbo': { inputPer1k: 0.01, outputPer1k: 0.03 },
}

export interface ImagePricing {
  /** Cost per image generation */
  perImage: number
}

export const IMAGE_MODEL_PRICING: Record<string, ImagePricing> = {
  'gpt-image-1': { perImage: 0.04 },
  'dall-e-3': { perImage: 0.04 },
  'dall-e-2': { perImage: 0.02 },
}

/** Web search tool cost per call */
export const WEB_SEARCH_COST_PER_CALL = 0.01

export function calculateTextCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cachedInputTokens = 0
): number {
  const pricing = TEXT_MODEL_PRICING[model] ?? TEXT_MODEL_PRICING['gpt-4o']
  const cachedRate = pricing.cachedInputPer1k ?? pricing.inputPer1k * 0.5
  const uncachedInput = inputTokens - cachedInputTokens
  return (
    (uncachedInput / 1000) * pricing.inputPer1k +
    (cachedInputTokens / 1000) * cachedRate +
    (outputTokens / 1000) * pricing.outputPer1k
  )
}

export function calculateImageCost(model: string, count: number): number {
  const pricing = IMAGE_MODEL_PRICING[model] ?? IMAGE_MODEL_PRICING['gpt-image-1']
  return pricing.perImage * count
}
