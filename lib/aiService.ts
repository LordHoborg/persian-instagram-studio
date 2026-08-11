'use server'

import { mockAIProvider } from '@/services/ai/mockProvider'
import { AIGenerationRequest } from '@/services/ai/types'
import { PostPackage, PostSlide } from '@/types'
import { addAIUsage } from './db'
import { estimateImageCost } from './utils'

const USE_MOCK = process.env.USE_MOCK_AI !== 'false'

const provider = USE_MOCK ? mockAIProvider : mockAIProvider // TODO: swap for OpenAIProvider

export async function generatePost(topic: string, contentType: string = 'carousel'): Promise<{ post: PostPackage; cost: number }> {
  const request: AIGenerationRequest = {
    operation: 'generate_post',
    prompt: `موضوع: ${topic}\nنوع محتوا: ${contentType}\nلطفاً یک پست کامل اینستاگرام به فارسی تولید کنید.`,
    model: 'gpt-4o',
  }

  const result = await provider.generateStructured<PostPackage>(request)
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to generate post')
  }

  const imageCost = estimateImageCost(result.data.slides?.length || 1)
  const totalCost = (result.usage.estimatedCost || 0) + imageCost

  await addAIUsage({
    operation: 'generate_post',
    model: request.model || 'gpt-4o',
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
    estimatedTextCost: result.usage.estimatedCost || 0,
    imageCost,
    webSearchCost: 0,
    totalCost,
    postId: result.data.id,
  })

  return { post: result.data, cost: totalCost }
}

export async function generateIdeas(): Promise<{ ideas: string[]; cost: number }> {
  const request: AIGenerationRequest = {
    operation: 'generate_ideas',
    prompt: '۱۰ ایده جذاب برای پست اینستاگرام درباره تاریخ و فرهنگ ایران پیشنهاد بده.',
    model: 'gpt-3.5',
  }

  const result = await provider.generateStructured<string[]>(request)
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to generate ideas')
  }

  await addAIUsage({
    operation: 'generate_ideas',
    model: request.model || 'gpt-3.5',
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
    estimatedTextCost: result.usage.estimatedCost || 0,
    imageCost: 0,
    webSearchCost: 0,
    totalCost: result.usage.estimatedCost || 0,
  })

  return { ideas: result.data, cost: result.usage.estimatedCost || 0 }
}

export async function rewriteSlide(slide: PostSlide, instruction: string): Promise<{ slide: PostSlide; cost: number }> {
  const request: AIGenerationRequest = {
    operation: 'rewrite_slide',
    prompt: `اسلاید: ${JSON.stringify(slide)}\nدستور: ${instruction}`,
    model: 'gpt-4o',
  }

  const result = await provider.generateStructured<PostSlide>(request)
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to rewrite slide')
  }

  await addAIUsage({
    operation: 'rewrite_slide',
    model: request.model || 'gpt-4o',
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
    estimatedTextCost: result.usage.estimatedCost || 0,
    imageCost: 0,
    webSearchCost: 0,
    totalCost: result.usage.estimatedCost || 0,
  })

  return { slide: result.data, cost: result.usage.estimatedCost || 0 }
}

export async function improveHook(currentHook: string): Promise<{ hook: string; cost: number }> {
  const request: AIGenerationRequest = {
    operation: 'improve_hook',
    prompt: `hook فعلی: ${currentHook}\nلطفاً hook جذاب‌تری بنویسید.`,
    model: 'gpt-4o',
  }

  const result = await provider.generateStructured<string>(request)
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to improve hook')
  }

  await addAIUsage({
    operation: 'improve_hook',
    model: request.model || 'gpt-4o',
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
    estimatedTextCost: result.usage.estimatedCost || 0,
    imageCost: 0,
    webSearchCost: 0,
    totalCost: result.usage.estimatedCost || 0,
  })

  return { hook: result.data, cost: result.usage.estimatedCost || 0 }
}

export async function generateHeroImage(prompt: string): Promise<{ url: string; cost: number }> {
  const result = await provider.generateImage!(prompt, '1024x1024')
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to generate image')
  }

  await addAIUsage({
    operation: 'generate_image',
    model: 'dall-e-3',
    inputTokens: 0,
    outputTokens: 0,
    estimatedTextCost: 0,
    imageCost: result.usage.estimatedCost || 0.04,
    webSearchCost: 0,
    totalCost: result.usage.estimatedCost || 0.04,
  })

  return { url: result.data, cost: result.usage.estimatedCost || 0.04 }
}
