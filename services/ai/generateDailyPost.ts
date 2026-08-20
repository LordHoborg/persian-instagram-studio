'use server'

import { getBrandProfile, getPillars, getRecentContentMemory, createPost } from '@/lib/db'
import { addAIUsage } from '@/lib/db'
import { getAIProvider } from './provider'
import { buildContentBrainContext, formatContextForPrompt } from './contentBrain'
import { buildTopicGeneratorPrompt } from '@/lib/prompts/topicGenerator'
import { buildPostWriterPrompt } from '@/lib/prompts/postWriter'
import { buildEditorialReviewPrompt } from '@/lib/prompts/editorialReview'
import { GeneratedPostSchema, GeneratedIdeasSchema, QualityReviewSchema } from './schemas'
import { researchTopic, shouldResearchTopic } from '@/services/research'
import { getModelForOperation, MODEL_CONFIG } from './modelConfig'
import { POST_WRITER_PROMPT } from '@/lib/prompts/postWriter'
import { TOPIC_GENERATOR_PROMPT } from '@/lib/prompts/topicGenerator'
import { EDITORIAL_REVIEW_PROMPT } from '@/lib/prompts/editorialReview'
import { generateId } from '@/lib/utils'
import { PostPackage } from '@/types'

export interface GenerateDailyPostOptions {
  /** If provided, skip topic selection and use this topic */
  topic?: string
  /** Whether to run editorial review (costs more) */
  withReview?: boolean
  /** Content type */
  contentType?: string
}

export interface GenerateDailyPostResult {
  post: PostPackage
  totalCost: number
  usedResearch: boolean
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
 * 8. Record AI usage
 */
export async function generateDailyPost(
  options: GenerateDailyPostOptions = {}
): Promise<GenerateDailyPostResult> {
  const { topic: providedTopic, withReview = false, contentType = 'carousel' } = options

  const provider = getAIProvider()
  let totalCost = 0
  let usedResearch = false

  // ── Step 1: Load Content Brain ──────────────────────────────────────────────
  const [profile, pillars, recentMemory] = await Promise.all([
    getBrandProfile(),
    getPillars(),
    getRecentContentMemory(20),
  ])

  const brainCtx = buildContentBrainContext(profile, pillars, recentMemory)
  const brandContextStr = formatContextForPrompt(brainCtx)

  // ── Step 2: Select topic ────────────────────────────────────────────────────
  let selectedTopic = providedTopic

  if (!selectedTopic) {
    const topicPrompts = buildTopicGeneratorPrompt({
      brandContext: brandContextStr,
      recentTopics: recentMemory.topics,
      recentPillars: recentMemory.pillars,
      pillars: brainCtx.pillars,
    })

    const ideasResult = await provider.generateStructured<{ ideas: string[] }>({
      operation: 'generate_ideas',
      prompt: `${topicPrompts.system}\n\n${topicPrompts.user}`,
      model: getModelForOperation('generate_ideas'),
    })

    await addAIUsage({
      operation: 'generate_ideas',
      provider: 'openai',
      model: getModelForOperation('generate_ideas'),
      inputTokens: ideasResult.usage.inputTokens,
      outputTokens: ideasResult.usage.outputTokens,
      estimatedTextCost: ideasResult.usage.estimatedCost,
      imageCost: 0,
      webSearchCost: 0,
      totalCost: ideasResult.usage.estimatedCost,
      promptKey: TOPIC_GENERATOR_PROMPT.key,
      promptVersion: TOPIC_GENERATOR_PROMPT.version,
    })

    totalCost += ideasResult.usage.estimatedCost

    const ideasParsed = GeneratedIdeasSchema.safeParse(ideasResult.data)
    const ideas = ideasParsed.success ? ideasParsed.data.ideas : []
    selectedTopic = ideas[0] ?? 'تاریخ ایران'
  }

  // ── Step 3: Research (if needed) ────────────────────────────────────────────
  let researchContext: string | undefined

  if (shouldResearchTopic(selectedTopic)) {
    try {
      const research = await researchTopic(selectedTopic)
      researchContext = `خلاصه تحقیق:\n${research.summary}\n\nحقایق کلیدی:\n${research.keyFacts.map(f => `- ${f.claim} (اطمینان: ${f.confidence})`).join('\n')}`
      usedResearch = true
      // Research cost is included in the AI usage from researchTopic
      // We add a nominal cost here for tracking
      totalCost += 0.01
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

  const postResult = await provider.generateStructured<unknown>({
    operation: 'generate_post',
    prompt: `${postPrompts.system}\n\n${postPrompts.user}`,
    model: getModelForOperation('generate_post'),
    maxTokens: 4000,
  })

  if (!postResult.success || !postResult.data) {
    throw new Error(postResult.error ?? 'Failed to generate post')
  }

  await addAIUsage({
    operation: 'generate_post',
    provider: 'openai',
    model: getModelForOperation('generate_post'),
    inputTokens: postResult.usage.inputTokens,
    outputTokens: postResult.usage.outputTokens,
    estimatedTextCost: postResult.usage.estimatedCost,
    imageCost: 0,
    webSearchCost: usedResearch ? 0.01 : 0,
    totalCost: postResult.usage.estimatedCost,
    promptKey: POST_WRITER_PROMPT.key,
    promptVersion: POST_WRITER_PROMPT.version,
  })

  totalCost += postResult.usage.estimatedCost

  // Validate with Zod
  const postParsed = GeneratedPostSchema.safeParse(postResult.data)
  if (!postParsed.success) {
    console.error('[generateDailyPost] Post validation failed:', postParsed.error.flatten())
    throw new Error('AI returned invalid post structure')
  }

  const generatedPost = postParsed.data

  // ── Step 5: Editorial review (optional) ────────────────────────────────────
  let qualityScore: PostPackage['qualityScore'] | undefined

  if (withReview) {
    const reviewPrompts = buildEditorialReviewPrompt({
      postTitle: generatedPost.title,
      hook: generatedPost.hook,
      slides: generatedPost.slides,
      caption: generatedPost.caption,
    })

    const reviewResult = await provider.generateStructured<unknown>({
      operation: 'editorial_review',
      prompt: `${reviewPrompts.system}\n\n${reviewPrompts.user}`,
      model: getModelForOperation('editorial_review'),
    })

    if (reviewResult.success && reviewResult.data) {
      const reviewParsed = QualityReviewSchema.safeParse(reviewResult.data)
      if (reviewParsed.success) {
        const { feedback: _feedback, ...scores } = reviewParsed.data
        qualityScore = scores
      }

      await addAIUsage({
        operation: 'editorial_review',
        provider: 'openai',
        model: getModelForOperation('editorial_review'),
        inputTokens: reviewResult.usage.inputTokens,
        outputTokens: reviewResult.usage.outputTokens,
        estimatedTextCost: reviewResult.usage.estimatedCost,
        imageCost: 0,
        webSearchCost: 0,
        totalCost: reviewResult.usage.estimatedCost,
        promptKey: EDITORIAL_REVIEW_PROMPT.key,
        promptVersion: EDITORIAL_REVIEW_PROMPT.version,
      })

      totalCost += reviewResult.usage.estimatedCost
    }
  }

  // ── Step 6: Save post ───────────────────────────────────────────────────────
  const now = new Date().toISOString()
  const postId = generateId()

  const slidesWithIds = generatedPost.slides.map((s, i) => ({
    ...s,
    id: s.id || `${postId}_slide_${i + 1}`,
    slideNumber: i + 1,
  }))

  const sourcesWithIds = generatedPost.sources.map(s => ({
    ...s,
    id: s.id || generateId(),
    verified: s.verificationStatus as 'unverified' | 'verified' | 'questionable',
  }))

  const estimatedCost = {
    textCost: postResult.usage.estimatedCost,
    researchCost: usedResearch ? 0.01 : 0,
    imageCost: 0,
    total: totalCost,
  }

  const postToSave: Omit<PostPackage, 'id' | 'createdAt' | 'updatedAt' | 'versionHistory'> = {
    title: generatedPost.title,
    topic: generatedPost.topic,
    contentType: generatedPost.contentType,
    contentPillar: generatedPost.contentPillar,
    goal: generatedPost.goal,
    targetAudience: generatedPost.targetAudience,
    hook: generatedPost.hook,
    slides: slidesWithIds,
    caption: generatedPost.caption,
    cta: generatedPost.cta,
    hashtags: generatedPost.hashtags,
    sources: sourcesWithIds,
    imageStyle: generatedPost.imageStyle,
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
  }
}
