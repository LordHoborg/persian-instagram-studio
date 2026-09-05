'use server'

import { eq, desc } from 'drizzle-orm'
import { db } from './client'
import {
  brandProfile, contentPillars, posts, postSlides, sources,
  aiUsage, automationSettings, learnedPatterns, promptTemplates,
  mediaAssets, appSettings,
} from './schema'
import {
  PostPackage, ContentPillar, BrandProfile, AIUsage,
  AutomationSettings, LearnedPattern, MediaAsset, IntegrationStatus,
  CostBudget, PromptTemplate, PostSlide, Source,
} from '@/types'
import { generateId } from '@/lib/utils'
import { ensureSeeded } from './seed'

// ─── Initialization ──────────────────────────────────────────────────────────

let initializationPromise: Promise<void> | null = null

async function ensureInitialized() {
  initializationPromise ??= ensureSeeded().catch(error => {
    initializationPromise = null
    throw error
  })
  await initializationPromise
}

// ─── Helper: row → PostPackage ───────────────────────────────────────────────

async function rowToPost(row: typeof posts.$inferSelect): Promise<PostPackage> {
  const slides = await db
    .select()
    .from(postSlides)
    .where(eq(postSlides.postId, row.id))
    .orderBy(postSlides.slideNumber)

  const srcs = await db
    .select()
    .from(sources)
    .where(eq(sources.postId, row.id))

  return {
    id: row.id,
    title: row.title,
    topic: row.topic,
    contentType: row.contentType as PostPackage['contentType'],
    contentPillar: row.contentPillar,
    goal: row.goal,
    targetAudience: row.targetAudience,
    hook: row.hook,
    slides: slides.map(s => ({
      id: s.id,
      slideNumber: s.slideNumber,
      type: s.type as PostSlide['type'],
      headline: s.headline,
      body: s.body,
      visualDirection: s.visualDirection,
      imagePrompt: s.imagePrompt,
      imageAssetId: s.imageAssetId ?? undefined,
    })),
    caption: row.caption,
    cta: row.cta,
    hashtags: row.hashtags as string[],
    sources: srcs.map(s => ({
      id: s.id,
      title: s.title,
      url: s.url,
      publisher: s.publisher,
      date: s.publishedAt ?? '',
      verified: s.verificationStatus as Source['verified'],
      verificationStatus: s.verificationStatus as Source['verificationStatus'],
    })),
    imageStyle: row.imageStyle,
    status: row.status as PostPackage['status'],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    scheduledAt: row.scheduledAt ?? null,
    publishedAt: row.publishedAt ?? null,
    estimatedCost: row.estimatedCost as PostPackage['estimatedCost'],
    qualityScore: row.qualityScore ?? undefined,
    performanceMetrics: row.performanceMetrics ?? undefined,
    versionHistory: [],
  }
}

// ─── Posts ───────────────────────────────────────────────────────────────────

export async function getPosts(): Promise<PostPackage[]> {
  await ensureInitialized()
  const rows = await db.select().from(posts).orderBy(desc(posts.createdAt))
  return Promise.all(rows.map(rowToPost))
}

export async function getPostById(id: string): Promise<PostPackage | null> {
  await ensureInitialized()
  const rows = await db.select().from(posts).where(eq(posts.id, id)).limit(1)
  if (!rows[0]) return null
  return rowToPost(rows[0])
}

export async function createPost(
  post: Omit<PostPackage, 'id' | 'createdAt' | 'updatedAt' | 'versionHistory'>
): Promise<PostPackage> {
  await ensureInitialized()
  const id = generateId()
  const now = new Date().toISOString()

  await db.insert(posts).values({
    id,
    title: post.title,
    topic: post.topic,
    contentType: post.contentType,
    contentPillar: post.contentPillar,
    goal: post.goal,
    targetAudience: post.targetAudience,
    hook: post.hook,
    caption: post.caption,
    cta: post.cta,
    hashtags: post.hashtags,
    imageStyle: post.imageStyle,
    status: post.status,
    createdAt: now,
    updatedAt: now,
    scheduledAt: post.scheduledAt ?? null,
    publishedAt: post.publishedAt ?? null,
    estimatedCost: post.estimatedCost,
    qualityScore: post.qualityScore ?? null,
    performanceMetrics: post.performanceMetrics ?? null,
  })

  if (post.slides?.length) {
    const slideValues = post.slides.map(s => ({
      id: generateId(),
      postId: id,
      slideNumber: s.slideNumber,
      type: s.type,
      headline: s.headline,
      body: s.body,
      visualDirection: s.visualDirection,
      imagePrompt: s.imagePrompt,
      imageAssetId: s.imageAssetId ?? null,
    }))
    await db.insert(postSlides).values(slideValues)
  }

  if (post.sources?.length) {
    const sourceValues = post.sources.map(s => ({
      id: generateId(),
      postId: id,
      title: s.title,
      url: s.url,
      publisher: s.publisher,
      publishedAt: s.date || null,
      verificationStatus: s.verificationStatus ?? s.verified ?? 'unverified',
    }))
    await db.insert(sources).values(sourceValues)
  }

  return (await getPostById(id))!
}

export async function deletePost(id: string): Promise<boolean> {
  await ensureInitialized()
  const deleted = await db.delete(posts).where(eq(posts.id, id)).returning({ id: posts.id })
  return deleted.length > 0
}

// ─── Pillars ─────────────────────────────────────────────────────────────────

export async function getPillars(): Promise<ContentPillar[]> {
  await ensureInitialized()
  const rows = await db.select().from(contentPillars)
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    description: r.description,
    weight: r.weight,
    enabled: r.enabled,
    color: r.color,
  }))
}

export async function updatePillars(pillars: ContentPillar[]): Promise<void> {
  await ensureInitialized()
  const normalized = pillars.slice(0, 50).map(p => ({
    ...p,
    id: p.id.trim(),
    name: p.name.trim(),
    description: p.description.trim(),
    weight: Math.min(100, Math.max(0, Math.round(p.weight))),
  }))

  if (normalized.some(p => !p.id || !p.name)) {
    throw new Error('شناسه و نام ستون محتوا الزامی است')
  }

  for (const p of normalized) {
    await db.insert(contentPillars).values({
      id: p.id,
      name: p.name,
      description: p.description,
      weight: p.weight,
      enabled: p.enabled,
      color: p.color,
    }).onConflictDoUpdate({
      target: contentPillars.id,
      set: { name: p.name, description: p.description, weight: p.weight, enabled: p.enabled, color: p.color },
    })
  }
}

// ─── Brand Profile ───────────────────────────────────────────────────────────

export async function getBrandProfile(): Promise<BrandProfile> {
  await ensureInitialized()
  const rows = await db.select().from(brandProfile).limit(1)
  if (!rows[0]) {
    return {
      pageTopic: '', targetAudience: '', writingStyle: 'محاوره‌ای ولی آگاهانه',
      visualStyle: 'مینیمال و تمیز', preferredTopics: [], avoidedTopics: [],
      preferredHooks: [], captionRules: '', persianLanguageRules: '',
      ctaStyle: '', sourcePolicy: '', imageStyle: '',
      successfulPatterns: [], failedPatterns: [], customInstructions: '',
    }
  }
  const r = rows[0]
  return {
    pageTopic: r.pageTopic, targetAudience: r.targetAudience,
    writingStyle: r.writingStyle, visualStyle: r.visualStyle,
    preferredTopics: r.preferredTopics as string[],
    avoidedTopics: r.avoidedTopics as string[],
    preferredHooks: r.preferredHooks as string[],
    captionRules: r.captionRules, persianLanguageRules: r.persianLanguageRules,
    ctaStyle: r.ctaStyle, sourcePolicy: r.sourcePolicy, imageStyle: r.imageStyle,
    successfulPatterns: r.successfulPatterns as string[],
    failedPatterns: r.failedPatterns as string[],
    customInstructions: r.customInstructions,
  }
}

export async function updateBrandProfile(profile: Partial<BrandProfile>): Promise<void> {
  await ensureInitialized()
  const now = new Date().toISOString()
  const existing = await db.select().from(brandProfile).limit(1)
  if (existing.length === 0) {
    const defaults = await getBrandProfile()
    await db.insert(brandProfile).values({ ...defaults, ...profile, updatedAt: now })
  } else {
    await db.update(brandProfile).set({ ...profile, updatedAt: now })
  }
}

// ─── AI Usage ────────────────────────────────────────────────────────────────

export async function getAIUsage(): Promise<AIUsage[]> {
  await ensureInitialized()
  const rows = await db.select().from(aiUsage).orderBy(desc(aiUsage.createdAt))
  return rows.map(r => ({
    id: r.id,
    operation: r.operation,
    provider: r.provider,
    model: r.model,
    inputTokens: r.inputTokens,
    cachedInputTokens: r.cachedInputTokens,
    outputTokens: r.outputTokens,
    reasoningTokens: r.reasoningTokens,
    toolCalls: r.toolCalls,
    webSearchCalls: r.webSearchCalls,
    imageGenerationCount: r.imageGenerationCount,
    estimatedTextCost: r.estimatedTextCost ?? r.estimatedCost,
    imageCost: r.imageCost ?? 0,
    webSearchCost: r.webSearchCost ?? 0,
    totalCost: r.totalCost ?? r.estimatedCost,
    success: r.success,
    createdAt: r.createdAt,
    postId: r.postId ?? undefined,
  }))
}

export async function addAIUsage(usage: Omit<AIUsage, 'id' | 'createdAt'> & {
  generationSessionId?: string
  estimatedTextCost?: number
  webSearchCost?: number
  imageCost?: number
  totalCost?: number
  durationMs?: number
  webSearchCalls?: number
  cachedInputTokens?: number
}): Promise<AIUsage> {
  await ensureInitialized()
  const id = generateId()
  const now = new Date().toISOString()
  const estimatedTextCost = usage.estimatedTextCost ?? 0
  const webSearchCost = usage.webSearchCost ?? 0
  const imageCost = usage.imageCost ?? 0
  const totalCost = usage.totalCost ?? (estimatedTextCost + webSearchCost + imageCost)
  await db.insert(aiUsage).values({
    id,
    generationSessionId: usage.generationSessionId ?? null,
    operation: usage.operation,
    provider: usage.provider ?? 'openai',
    model: usage.model,
    inputTokens: usage.inputTokens,
    cachedInputTokens: usage.cachedInputTokens ?? 0,
    outputTokens: usage.outputTokens,
    reasoningTokens: usage.reasoningTokens ?? 0,
    toolCalls: usage.toolCalls ?? 0,
    webSearchCalls: usage.webSearchCalls ?? 0,
    imageGenerationCount: usage.imageGenerationCount ?? 0,
    estimatedTextCost,
    webSearchCost,
    imageCost,
    totalCost,
    estimatedCost: totalCost,
    durationMs: usage.durationMs ?? null,
    postId: usage.postId ?? null,
    promptKey: usage.promptKey ?? null,
    promptVersion: usage.promptVersion ?? null,
    success: usage.success ?? true,
    createdAt: now,
  })
  return { ...usage, id, createdAt: now }
}

// ─── Automation Settings ─────────────────────────────────────────────────────

export async function getAutomationSettings(): Promise<AutomationSettings> {
  await ensureInitialized()
  const rows = await db.select().from(automationSettings).limit(1)
  if (!rows[0]) {
    return {
      publishDays: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه'],
      suggestedHour: 19, postsPerDay: 1,
      allowedFormats: ['carousel', 'single', 'quote'],
      autoGenerate: false, autoPublish: false, requireApproval: true,
    }
  }
  const r = rows[0]
  return {
    publishDays: r.publishDays as string[],
    suggestedHour: r.suggestedHour,
    postsPerDay: r.postsPerDay,
    allowedFormats: r.allowedFormats as string[],
    autoGenerate: r.autoGenerate,
    autoPublish: r.autoPublish,
    requireApproval: r.requireApproval,
  }
}

export async function updateAutomationSettings(settings: AutomationSettings): Promise<void> {
  await ensureInitialized()
  const normalized: AutomationSettings = {
    publishDays: settings.publishDays.slice(0, 7),
    suggestedHour: Math.min(23, Math.max(0, Math.round(settings.suggestedHour))),
    postsPerDay: Math.min(10, Math.max(1, Math.round(settings.postsPerDay))),
    allowedFormats: settings.allowedFormats.slice(0, 5),
    autoGenerate: Boolean(settings.autoGenerate),
    autoPublish: Boolean(settings.autoPublish),
    requireApproval: Boolean(settings.requireApproval),
  }
  const existing = await db.select().from(automationSettings).limit(1)
  if (existing.length === 0) {
    await db.insert(automationSettings).values(normalized)
  } else {
    await db.update(automationSettings).set(normalized)
  }
}

// ─── Patterns ────────────────────────────────────────────────────────────────

export async function getPatterns(): Promise<LearnedPattern[]> {
  await ensureInitialized()
  const rows = await db.select().from(learnedPatterns)
  return rows.map(r => ({
    id: r.id, pattern: r.pattern, confidence: r.confidence,
    evidence: r.evidence as string[], createdAt: r.createdAt,
  }))
}

export async function addPattern(pattern: Omit<LearnedPattern, 'id' | 'createdAt'>): Promise<LearnedPattern> {
  await ensureInitialized()
  const id = generateId()
  const now = new Date().toISOString()
  await db.insert(learnedPatterns).values({ id, ...pattern, createdAt: now })
  return { id, ...pattern, createdAt: now }
}

// ─── Integration Status (stored in app_settings) ─────────────────────────────

export async function getIntegrationStatus(): Promise<IntegrationStatus> {
  await ensureInitialized()
  const row = await db.select().from(appSettings).where(eq(appSettings.key, 'integration_status')).limit(1)
  const openaiConfigured = !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '' && process.env.USE_MOCK_AI !== 'true')
  const stored = row[0]?.value as IntegrationStatus | undefined
  return {
    instagram: stored?.instagram ?? { connected: false },
    openai: { configured: openaiConfigured },
  }
}

export async function updateIntegrationStatus(status: IntegrationStatus): Promise<void> {
  await ensureInitialized()
  const now = new Date().toISOString()
  await db.insert(appSettings).values({ key: 'integration_status', value: status, updatedAt: now })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: status, updatedAt: now } })
}

// ─── Budget (stored in app_settings) ─────────────────────────────────────────

export async function getBudget(): Promise<CostBudget> {
  await ensureInitialized()
  const row = await db.select().from(appSettings).where(eq(appSettings.key, 'cost_budget')).limit(1)
  if (!row[0]) {
    return { dailyBudget: 2, monthlyBudget: 30, imageGenerationLimit: 50, maxRetries: 3 }
  }
  return row[0].value as CostBudget
}

export async function updateBudget(budget: CostBudget): Promise<void> {
  await ensureInitialized()
  const now = new Date().toISOString()
  const finiteOr = (value: number, fallback: number) => Number.isFinite(value) ? value : fallback
  const normalized: CostBudget = {
    dailyBudget: Math.max(0, finiteOr(budget.dailyBudget, 2)),
    monthlyBudget: Math.max(0, finiteOr(budget.monthlyBudget, 30)),
    imageGenerationLimit: Math.max(0, Math.round(finiteOr(budget.imageGenerationLimit, 50))),
    maxRetries: Math.min(10, Math.max(0, Math.round(finiteOr(budget.maxRetries, 3)))),
  }
  await db.insert(appSettings).values({ key: 'cost_budget', value: normalized, updatedAt: now })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: normalized, updatedAt: now } })
}

// ─── Prompts ─────────────────────────────────────────────────────────────────

export async function getPrompts(): Promise<PromptTemplate[]> {
  await ensureInitialized()
  const rows = await db.select().from(promptTemplates)
  return rows.map(r => ({
    id: r.id, key: r.key, name: r.name, prompt: r.prompt, description: r.description,
  }))
}

export async function updatePrompts(prompts: PromptTemplate[]): Promise<void> {
  await ensureInitialized()
  const now = new Date().toISOString()
  for (const p of prompts) {
    await db.insert(promptTemplates).values({ ...p, version: 1, updatedAt: now })
      .onConflictDoUpdate({ target: promptTemplates.key, set: { name: p.name, prompt: p.prompt, description: p.description, updatedAt: now } })
  }
}

// ─── Onboarding ──────────────────────────────────────────────────────────────

export async function isOnboardingComplete(): Promise<boolean> {
  await ensureInitialized()
  const row = await db.select().from(appSettings).where(eq(appSettings.key, 'onboarding_complete')).limit(1)
  if (!row[0]) return false
  return row[0].value as boolean
}

export async function setOnboardingComplete(complete: boolean): Promise<void> {
  await ensureInitialized()
  const now = new Date().toISOString()
  await db.insert(appSettings).values({ key: 'onboarding_complete', value: complete, updatedAt: now })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: complete, updatedAt: now } })
}

// ─── Media ───────────────────────────────────────────────────────────────────

export async function getMedia(): Promise<MediaAsset[]> {
  await ensureInitialized()
  const rows = await db.select().from(mediaAssets)
  return rows.map(r => ({
    id: r.id, type: r.type as MediaAsset['type'], url: r.url,
    name: r.name, tags: r.tags as string[], createdAt: r.createdAt,
  }))
}

export async function addMedia(media: Omit<MediaAsset, 'id' | 'createdAt'>): Promise<MediaAsset> {
  await ensureInitialized()
  const id = generateId()
  const now = new Date().toISOString()
  await db.insert(mediaAssets).values({ id, ...media, createdAt: now })
  return { id, ...media, createdAt: now }
}

// ─── Recent Content Memory ───────────────────────────────────────────────────

export async function getRecentContentMemory(limit = 20) {
  await ensureInitialized()
  const recentPosts = await db
    .select({ topic: posts.topic, contentPillar: posts.contentPillar, hook: posts.hook })
    .from(posts)
    .orderBy(desc(posts.createdAt))
    .limit(limit)

  return {
    topics: recentPosts.map(p => p.topic),
    hooks: recentPosts.map(p => p.hook).filter(Boolean),
    pillars: recentPosts.map(p => p.contentPillar).filter(Boolean),
  }
}
