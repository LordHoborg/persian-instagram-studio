// services/ai/modelConfig.ts
// Centralized model configuration.
// Defaults verified against the current OpenAI API model list and can be overridden via environment variables.

export const MODEL_CONFIG = {
  /** Low-cost routine tasks: topic gen, classification, hashtags, formatting */
  cheap: process.env.OPENAI_MODEL_CHEAP ?? 'gpt-5.6-luna',
  /** Main content generation: full Persian posts, carousel writing, captions */
  standard: process.env.OPENAI_MODEL_STANDARD ?? 'gpt-5.6-terra',
  /** High-value review: complex reasoning, fact review, editorial */
  premium: process.env.OPENAI_MODEL_PREMIUM ?? 'gpt-5.6-sol',
  /** Image generation */
  image: process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-2',
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
