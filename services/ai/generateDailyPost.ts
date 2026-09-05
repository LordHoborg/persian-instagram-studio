'use server'

import { getAIUsage, getBrandProfile, getBudget, getPillars, getRecentContentMemory, createPost } from '@/lib/db'
import { addAIUsage } from '@/lib/db'
import { getAIProvider } from './provider'
import { buildContentBrainContext, formatContextForPrompt } from './contentBrain'
import { buildTopicGeneratorPrompt } from '@/lib/prompts/topicGenerator'
import { buildPostWriterPrompt } from '@/lib/prompts/postWriter'
import { buildEditorialReviewPrompt } from '@/lib/prompts/editorialReview'
import { GeneratedPostSchema, QualityReviewSchema } from './schemas'
import { researchTopic, shouldResearchTopic } from '@/services/research'
import { BudgetExceededError, type ResearchResultData } from '@/services/ai/types'
import { getModelForOperation } from './modelConfig'
import { POST_WRITER_PROMPT } from '@/lib/prompts/postWriter'
import { TOPIC_GENERATOR_PROMPT } from '@/lib/prompts/topicGenerator'
import { EDITORIAL_REVIEW_PROMPT } from '@/lib/prompts/editorialReview'
import { generateId } from '@/lib/utils'
import { PostPackage, PostSlide } from '@/types'
import { z } from 'zod'

export interface GenerateDailyPostOptions {
  /** If provided, skip topic selection and use this topic */
  topic?: string
  /** Whether to run editorial review (costs more) */
  withReview?: boolean
  /** Content type */
  contentType?: string
  /** Generate an image for each slide. Disabled by default to prevent surprise spend. */
  generateImages?: boolean
}

export interface GenerateDailyPostResult {
  post: PostPackage
  totalCost: number
  usedResearch: boolean
  generationSessionId: string
  warnings: string[]
}

// Schema for improved topic candidates
const TopicCandidateSchema = z.object({
  topic: z.string().min(1),
  pillar: z.string().default(''),
  reason: z.string().default(''),
  noveltyScore: z.number().min(0).max(10).default(5),
})

const TopicCandidatesSchema = z.object({
  candidates: z.array(TopicCandidateSchema).min(1).max(10),
})

type TopicCandidate = z.infer<typeof TopicCandidateSchema>

/**
 * Select the best topic candidate using deterministic application logic.
 * Considers: novelty score, avoided topics, pillar weights.
 */
function selectBestCandidate(
  candidates: TopicCandidate[],
  avoidedTopics: string[],
  recentTopics: string[],
  pillars: Array<{ name: string; weight: number }>
): TopicCandidate | null {
  // Filter out avoided topics
  const filtered = candidates.filter(c => {
    const topicLower = c.topic.toLowerCase()
    return !avoidedTopics.some(a => topicLower.includes(a.toLowerCase()))
  })

  if (filtered.length === 0) return candidates[0] ?? null

  // Filter out recently used topics
  const notRecent = filtered.filter(c =>
    !recentTopics.some(r => r.toLowerCase().includes(c.topic.toLowerCase().slice(0, 10)))
  )
  const pool = notRecent.length > 0 ? notRecent : filtered

  // Score by novelty + pillar weight
  const pillarWeightMap = new Map(pillars.map(p => [p.name, p.weight]))
  const scored = pool.map(c => {
    const pillarWeight = pillarWeightMap.get(c.pillar) ?? 20
    return { candidate: c, score: c.noveltyScore * 0.7 + (pillarWeight / 100) * 3 }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored[0]?.candidate ?? null
}

/**
 * Full daily post generation flow:
 * 1. Load Content Brain
 * 2. Get recent posts memory
 * 3. Select topic (or use provided)
 * 4. Optionally research topic
 * 5. Generate structured post
 * 6. Optionally run editorial review
 * 7. Save post
 * 8. Record AI usage (all linked by generationSessionId)
 */
export async function generateDailyPost(
  options: GenerateDailyPostOptions = {}
): Promise<GenerateDailyPostResult> {
  const { topic: providedTopic, withReview = false, contentType = 'carousel', generateImages = false } = options

  const provider = getAIProvider()
  const generationSessionId = generateId()
  let totalCost = 0
  let textCost = 0
  let usedResearch = false
  let researchData: ResearchResultData | undefined
  const warnings: string[] = []

  // ── Step 1: Load Content Brain ──────────────────────────────────────────────
  const [profile, pillars, recentMemory, budget, usageHistory] = await Promise.all([
    getBrandProfile(),
    getPillars(),
    getRecentContentMemory(20),
    getBudget(),
    getAIUsage(),
  ])

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const dailySpend = usageHistory
    .filter(item => new Date(item.createdAt).getTime() >= startOfDay)
    .reduce((sum, item) => sum + item.totalCost, 0)
  const monthlyUsage = usageHistory.filter(item => new Date(item.createdAt).getTime() >= startOfMonth)
  const monthlySpend = monthlyUsage.reduce((sum, item) => sum + item.totalCost, 0)
  const monthlyImages = monthlyUsage.reduce((sum, item) => sum + (item.imageGenerationCount ?? 0), 0)

  if (dailySpend >= budget.dailyBudget) {
    throw new BudgetExceededError('بودجه روزانه هوش مصنوعی مصرف شده است. سقف را در تنظیمات افزایش دهید.')
  }
  if (monthlySpend >= budget.monthlyBudget) {
    throw new BudgetExceededError('بودجه ماهانه هوش مصنوعی مصرف شده است. سقف را در تنظیمات افزایش دهید.')
  }
  if (generateImages && monthlyImages >= budget.imageGenerationLimit) {
    throw new BudgetExceededError('سقف ماهانه تولید تصویر مصرف شده است.')
  }

  const brainCtx = buildContentBrainContext(profile, pillars, recentMemory)
  const brandContextStr = formatContextForPrompt(brainCtx)

  // ── Step 2: Select topic ────────────────────────────────────────────────────
  let selectedTopic = providedTopic
  let selectedPillar = ''

  if (!selectedTopic) {
    const topicPrompts = buildTopicGeneratorPrompt({
      brandContext: brandContextStr,
      recentTopics: recentMemory.topics,
      recentPillars: recentMemory.pillars,
      pillars: brainCtx.pillars,
    })

    const ideasResult = await provider.generateStructured({
      operation: 'generate_ideas',
      prompt: `${topicPrompts.system}\n\n${topicPrompts.user}\n\nبرای هر ایده، یک شیء JSON با فیلدهای topic، pillar، reason، و noveltyScore (0-10) برگردان.`,
      schema: TopicCandidatesSchema,
      model: getModelForOperation('generate_ideas'),
    })

    await addAIUsage({
      generationSessionId,
      operation: 'generate_ideas',
      provider: 'openai',
      model: getModelForOperation('generate_ideas'),
      inputTokens: ideasResult.usage.inputTokens,
      cachedInputTokens: ideasResult.usage.cachedInputTokens ?? 0,
      outputTokens: ideasResult.usage.outputTokens,
      estimatedTextCost: ideasResult.usage.estimatedCost,
      imageCost: 0,
      webSearchCost: 0,
      totalCost: ideasResult.usage.estimatedCost,
      promptKey: TOPIC_GENERATOR_PROMPT.key,
      promptVersion: TOPIC_GENERATOR_PROMPT.version,
      durationMs: ideasResult.usage.durationMs,
    })

    totalCost += ideasResult.usage.estimatedCost
    textCost += ideasResult.usage.estimatedCost

    if (!ideasResult.success || !ideasResult.data) {
      throw new Error(ideasResult.error ?? 'تولید ایده‌های موضوعی ناموفق بود')
    }

    const best = selectBestCandidate(
      ideasResult.data.candidates.map(c => ({
        topic: c.topic,
        pillar: c.pillar ?? '',
        reason: c.reason ?? '',
        noveltyScore: c.noveltyScore ?? 5,
      })),
      profile.avoidedTopics ?? [],
      recentMemory.topics,
      brainCtx.pillars
    )

    if (!best) {
      throw new Error('هیچ موضوع مناسبی برای تولید محتوا یافت نشد')
    }

    selectedTopic = best.topic
    selectedPillar = best.pillar
  }

  // ── Step 3: Research (if needed) ────────────────────────────────────────────
  let researchContext: string | undefined

  if (shouldResearchTopic(selectedTopic, selectedPillar)) {
    try {
      researchData = await researchTopic(selectedTopic)
      researchContext = `خلاصه تحقیق:\n${researchData.summary}\n\nحقایق کلیدی:\n${researchData.keyFacts.map(f => `- ${f.claim} (اطمینان: ${f.confidence})`).join('\n')}`
      usedResearch = true

      // Record research usage separately, linked to same session
      await addAIUsage({
        generationSessionId,
        operation: 'research_topic',
        provider: 'openai',
        model: researchData.usage.model,
        inputTokens: researchData.usage.inputTokens,
        cachedInputTokens: researchData.usage.cachedInputTokens,
        outputTokens: researchData.usage.outputTokens,
        estimatedTextCost: researchData.usage.textCost,
        webSearchCost: researchData.usage.webSearchCost,
        webSearchCalls: researchData.usage.webSearchCalls,
        imageCost: 0,
        totalCost: researchData.usage.totalCost,
        durationMs: researchData.usage.durationMs,
      })

      totalCost += researchData.usage.totalCost
    } catch (err) {
      console.warn('[generateDailyPost] Research failed, continuing without it:', err)
    }
  }

  // ── Step 4: Generate post ───────────────────────────────────────────────────
  const postPrompts = buildPostWriterPrompt({
    topic: selectedTopic,
    contentType,
    brandContext: brandContextStr,
    researchContext,
    recentHooks: recentMemory.hooks,
  })

  const postResult = await provider.generateStructured({
    operation: 'generate_post',
    prompt: `${postPrompts.system}\n\n${postPrompts.user}`,
    schema: GeneratedPostSchema,
    model: getModelForOperation('generate_post'),
    maxTokens: 4000,
  })

  if (!postResult.success || !postResult.data) {
    throw new Error(postResult.error ?? 'تولید پست ناموفق بود')
  }

  await addAIUsage({
    generationSessionId,
    operation: 'generate_post',
    provider: 'openai',
    model: getModelForOperation('generate_post'),
    inputTokens: postResult.usage.inputTokens,
    cachedInputTokens: postResult.usage.cachedInputTokens ?? 0,
    outputTokens: postResult.usage.outputTokens,
    estimatedTextCost: postResult.usage.estimatedCost,
    imageCost: 0,
    webSearchCost: 0,
    totalCost: postResult.usage.estimatedCost,
    promptKey: POST_WRITER_PROMPT.key,
    promptVersion: POST_WRITER_PROMPT.version,
    durationMs: postResult.usage.durationMs,
  })

  totalCost += postResult.usage.estimatedCost
  textCost += postResult.usage.estimatedCost

  const generatedPost = postResult.data

  // ── Step 5: Editorial review (optional) ────────────────────────────────────
  let qualityScore: PostPackage['qualityScore'] | undefined

  if (withReview) {
    const reviewPrompts = buildEditorialReviewPrompt({
      postTitle: generatedPost.title,
      hook: generatedPost.hook,
      slides: generatedPost.slides,
      caption: generatedPost.caption,
    })

    const reviewResult = await provider.generateStructured({
      operation: 'editorial_review',
      prompt: `${reviewPrompts.system}\n\n${reviewPrompts.user}`,
      schema: QualityReviewSchema,
      model: getModelForOperation('editorial_review'),
    })

    if (reviewResult.success && reviewResult.data) {
      qualityScore = {
        hook: reviewResult.data.hook,
        clarity: reviewResult.data.clarity,
        originality: reviewResult.data.originality,
        persianNaturalness: reviewResult.data.persianNaturalness,
        factualConfidence: reviewResult.data.factualConfidence,
        visualConsistency: reviewResult.data.visualConsistency,
      }

      await addAIUsage({
        generationSessionId,
        operation: 'editorial_review',
        provider: 'openai',
        model: getModelForOperation('editorial_review'),
        inputTokens: reviewResult.usage.inputTokens,
        cachedInputTokens: reviewResult.usage.cachedInputTokens ?? 0,
        outputTokens: reviewResult.usage.outputTokens,
        estimatedTextCost: reviewResult.usage.estimatedCost,
        imageCost: 0,
        webSearchCost: 0,
        totalCost: reviewResult.usage.estimatedCost,
        promptKey: EDITORIAL_REVIEW_PROMPT.key,
        promptVersion: EDITORIAL_REVIEW_PROMPT.version,
        durationMs: reviewResult.usage.durationMs,
      })

      totalCost += reviewResult.usage.estimatedCost
      textCost += reviewResult.usage.estimatedCost
    }
  }

  // ── Step 5.5: Generate images ────────────────────────────────────────
  let imageTotalCost = 0
  const slidesWithImages: PostSlide[] = generatedPost.slides.map(slide => ({
    ...slide,
    visualDirection: slide.visualDirection ?? '',
    imagePrompt: slide.imagePrompt ?? '',
    imageAssetId: null,
  }))

  const remainingImageAllowance = Math.max(0, budget.imageGenerationLimit - monthlyImages)
  const imageTargetCount = Math.min(generatedPost.slides.length, remainingImageAllowance)
  if (generateImages && imageTargetCount < generatedPost.slides.length) {
    warnings.push(`به‌دلیل سقف ماهانه، فقط ${imageTargetCount} تصویر از ${generatedPost.slides.length} تصویر قابل تولید بود.`)
  }
  if (generateImages) {
    const aiProvider = getAIProvider()
    const generateImage = aiProvider.generateImage?.bind(aiProvider)
    if (!generateImage) {
      warnings.push('Provider فعلی از تولید تصویر پشتیبانی نمی‌کند.')
    }

    for (let index = 0; generateImage && index < imageTargetCount; index += 1) {
      const slide = generatedPost.slides[index]
      const imagePrompt = slide.imagePrompt?.trim()
      if (!imagePrompt) {
        warnings.push(`اسلاید ${index + 1} پرامپت تصویر نداشت.`)
        continue
      }

      let generated = false
      let lastError = 'پاسخ قابل استفاده‌ای دریافت نشد.'
      const maxAttempts = Math.max(1, budget.maxRetries + 1)
      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const imageResult = await generateImage(imagePrompt, '1024x1536')
        if (!imageResult.success || !imageResult.data) {
          lastError = imageResult.error ?? lastError
          if (attempt + 1 < maxAttempts) await new Promise(resolve => setTimeout(resolve, Math.min(4_000, 750 * (2 ** attempt))))
          continue
        }

        const imageUrl =
          imageResult.data.assetType === 'base64'
            ? `data:${imageResult.data.mimeType};base64,${imageResult.data.data}`
            : imageResult.data.data
        const imageCost = imageResult.usage.imageCost ?? 0
        imageTotalCost += imageCost
        await addAIUsage({
          generationSessionId,
          operation: 'generate_image',
          provider: 'openai',
          model: getModelForOperation('generate_image'),
          inputTokens: 0,
          outputTokens: 0,
          estimatedTextCost: 0,
          imageCost,
          imageGenerationCount: imageResult.usage.imageGenerationCount ?? 1,
          webSearchCost: 0,
          totalCost: imageCost,
        })
        slidesWithImages[index] = { ...slidesWithImages[index], imageAssetId: imageUrl }
        generated = true
        break
      }

      if (!generated) {
        warnings.push(`تولید تصویر اسلاید ${index + 1} پس از ${maxAttempts} تلاش ناموفق بود: ${lastError}`)
      }
    }
  }

  totalCost += imageTotalCost

  // ── Step 6: Save post ───────────────────────────────────────────────
  const postId = generateId()

  const slidesWithIds = slidesWithImages.map((s, i) => ({
    ...s,
    id: s.id || `${postId}_slide_${i + 1}`,
    slideNumber: i + 1,
  }))

  const researchSources = (researchData?.sources ?? []).map(source => ({
    id: source.id || generateId(),
    title: source.title,
    url: source.url ?? '',
    publisher: source.publisher ?? '',
    date: source.publishedAt ?? '',
    verified: source.verificationStatus,
    verificationStatus: source.verificationStatus,
  }))

  const generatedSources = (generatedPost.sources ?? []).map(s => ({
    ...s,
    id: s.id || generateId(),
    url: s.url ?? '',
    publisher: s.publisher ?? '',
    date: s.date ?? '',
    verified: 'unverified' as const,
    verificationStatus: 'unverified' as const,
  }))

  const sourcesWithIds = researchSources.length > 0 ? [...researchSources, ...generatedSources] : generatedSources

  const researchCost = researchData?.usage.totalCost ?? 0

  const estimatedCost = {
    textCost,
    researchCost,
    imageCost: imageTotalCost,
    total: totalCost,
  }

  const postToSave: Omit<PostPackage, 'id' | 'createdAt' | 'updatedAt' | 'versionHistory'> = {
    title: generatedPost.title,
    topic: generatedPost.topic,
    contentType: (generatedPost.contentType ?? 'carousel') as PostPackage['contentType'],
    contentPillar: generatedPost.contentPillar ?? '',
    goal: generatedPost.goal ?? '',
    targetAudience: generatedPost.targetAudience ?? '',
    hook: generatedPost.hook,
    slides: slidesWithIds.map(s => ({
      ...s,
      visualDirection: s.visualDirection ?? '',
      imagePrompt: s.imagePrompt ?? '',
      imageAssetId: s.imageAssetId ?? null,
    })),
    caption: generatedPost.caption,
    cta: generatedPost.cta ?? '',
    hashtags: generatedPost.hashtags ?? [],
    sources: sourcesWithIds,
    imageStyle: generatedPost.imageStyle ?? 'modern',
    status: 'generated',
    scheduledAt: null,
    publishedAt: null,
    estimatedCost,
    qualityScore,
  }

  const savedPost = await createPost(postToSave)

  return {
    post: savedPost,
    totalCost,
    usedResearch,
    generationSessionId,
    warnings,
  }
}
