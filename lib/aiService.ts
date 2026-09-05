'use server'

import { getAIProvider } from '@/services/ai/provider'
import { addAIUsage } from './db'
import { PostSlide } from '@/types'
import { getModelForOperation } from '@/services/ai/modelConfig'
import { calculateImageCost } from './ai/pricing'
import { buildImproveHookPrompt, buildRewriteSlidePrompt } from './prompts/carouselWriter'
import { RewrittenSlideSchema, HookImprovementSchema } from '@/services/ai/schemas'

export async function generatePost(
  topic?: string,
  contentType: string = 'carousel',
  options: { withReview?: boolean; generateImages?: boolean } = {}
) {
  const { generateDailyPost } = await import('@/services/ai/generateDailyPost')
  return generateDailyPost({ topic, contentType, ...options })
}

export async function generateIdeas(): Promise<{ ideas: string[]; cost: number }> {
  // Just generate ideas without a full post
  const provider = getAIProvider()
  const { z } = await import('zod')
  const IdeasSchema = z.object({ ideas: z.array(z.string()).min(1) })
  const result = await provider.generateStructured({
    operation: 'brainstorm_ideas',
    prompt: '۱۰ ایده جذاب برای پست اینستاگرام درباره تاریخ و فرهنگ ایران پیشنهاد بده.\n\nخروجی JSON: {"ideas": ["ایده ۱", "ایده ۲", ...]}',
    schema: IdeasSchema,
    model: getModelForOperation('brainstorm_ideas'),
  })

  if (!result.success || !result.data) {
    throw new Error(result.error ?? 'Failed to generate ideas')
  }

  await addAIUsage({
    operation: 'brainstorm_ideas',
    provider: 'openai',
    model: getModelForOperation('brainstorm_ideas'),
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
    estimatedTextCost: result.usage.estimatedCost,
    imageCost: 0,
    webSearchCost: 0,
    totalCost: result.usage.estimatedCost,
  })

  const ideas = Array.isArray(result.data.ideas) ? result.data.ideas : []
  return { ideas, cost: result.usage.estimatedCost }
}

export async function rewriteSlide(
  slide: PostSlide,
  instruction: string
): Promise<{ slide: PostSlide; cost: number }> {
  const provider = getAIProvider()
  const model = getModelForOperation('rewrite_slide')

  const prompts = buildRewriteSlidePrompt({
    slideHeadline: slide.headline,
    slideBody: slide.body,
    slideType: slide.type,
    instruction,
    brandContext: '',
  })

  const result = await provider.generateStructured({
    operation: 'rewrite_slide',
    prompt: `${prompts.system}\n\n${prompts.user}`,
    schema: RewrittenSlideSchema,
    model,
  })

  if (!result.success || !result.data) {
    throw new Error(result.error ?? 'Failed to rewrite slide')
  }

  await addAIUsage({
    operation: 'rewrite_slide',
    provider: 'openai',
    model,
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
    estimatedTextCost: result.usage.estimatedCost,
    imageCost: 0,
    webSearchCost: 0,
    totalCost: result.usage.estimatedCost,
  })

  const parsed = RewrittenSlideSchema.safeParse(result.data)
  if (!parsed.success) {
    throw new Error('Invalid slide rewrite response')
  }

  return {
    slide: {
      ...slide,
      headline: parsed.data.headline,
      body: parsed.data.body,
      visualDirection: parsed.data.visualDirection ?? slide.visualDirection,
      imagePrompt: parsed.data.imagePrompt ?? slide.imagePrompt,
    },
    cost: result.usage.estimatedCost,
  }
}

export async function improveHook(
  currentHook: string,
  topic = ''
): Promise<{ hook: string; cost: number }> {
  const provider = getAIProvider()
  const model = getModelForOperation('improve_hook')

  const prompts = buildImproveHookPrompt({
    currentHook,
    topic,
    brandContext: '',
  })

  const result = await provider.generateStructured({
    operation: 'improve_hook',
    prompt: `${prompts.system}\n\n${prompts.user}`,
    schema: HookImprovementSchema,
    model,
  })

  if (!result.success || !result.data) {
    throw new Error(result.error ?? 'Failed to improve hook')
  }

  await addAIUsage({
    operation: 'improve_hook',
    provider: 'openai',
    model,
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
    estimatedTextCost: result.usage.estimatedCost,
    imageCost: 0,
    webSearchCost: 0,
    totalCost: result.usage.estimatedCost,
  })

  const parsed = HookImprovementSchema.safeParse(result.data)
  if (!parsed.success) {
    throw new Error('Invalid hook improvement response')
  }

  return { hook: parsed.data.hook, cost: result.usage.estimatedCost }
}

export async function generateHeroImage(
  prompt: string
): Promise<{ url: string; cost: number }> {
  const provider = getAIProvider()
  const model = getModelForOperation('generate_image')

  if (!provider.generateImage) {
    throw new Error('Image generation not supported by current provider')
  }

  const result = await provider.generateImage(prompt, '1024x1024')

  if (!result.success || !result.data) {
    throw new Error(result.error ?? 'Failed to generate image')
  }

  const imageCost = result.usage.imageCost ?? calculateImageCost(model, 1, { size: result.data.size })

  await addAIUsage({
    operation: 'generate_image',
    provider: 'openai',
    model,
    inputTokens: 0,
    outputTokens: 0,
    estimatedTextCost: 0,
    imageCost,
    imageGenerationCount: result.usage.imageGenerationCount ?? 1,
    webSearchCost: 0,
    totalCost: imageCost,
  })

  if (result.data.assetType === 'base64') {
    return { url: `data:${result.data.mimeType};base64,${result.data.data}`, cost: imageCost }
  }

  return { url: result.data.data, cost: imageCost }
}
