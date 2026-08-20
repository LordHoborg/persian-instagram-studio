// services/ai/modelConfig.ts
// Centralized model configuration — update here when OpenAI changes pricing or model names

export const MODEL_CONFIG = {
  /** Low-cost routine tasks: topic gen, classification, hashtags, formatting */
  cheap: 'gpt-4o-mini',
  /** Main content generation: full Persian posts, carousel writing, captions */
  standard: 'gpt-4o',
  /** High-value review: complex reasoning, fact review, editorial */
  premium: 'o1-mini',
  /** Image generation */
  image: 'gpt-image-1',
} as const

export type ModelTier = keyof typeof MODEL_CONFIG
export type ModelId = (typeof MODEL_CONFIG)[ModelTier]

/** Map operation names to model tiers */
export const OPERATION_MODEL_MAP: Record<string, ModelTier> = {
  generate_post: 'standard',
  generate_ideas: 'cheap',
  rewrite_slide: 'cheap',
  improve_hook: 'cheap',
  generate_caption: 'cheap',
  generate_hashtags: 'cheap',
  editorial_review: 'premium',
  research_topic: 'standard',
  fact_check: 'standard',
  generate_image: 'image',
}

export function getModelForOperation(operation: string): string {
  const tier = OPERATION_MODEL_MAP[operation] ?? 'standard'
  return MODEL_CONFIG[tier]
}
