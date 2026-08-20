import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

// ─── brand_profile ───────────────────────────────────────────────────────────
export const brandProfile = sqliteTable('brand_profile', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  pageTopic: text('page_topic').notNull().default(''),
  targetAudience: text('target_audience').notNull().default(''),
  writingStyle: text('writing_style').notNull().default('محاوره‌ای ولی آگاهانه'),
  visualStyle: text('visual_style').notNull().default('مینیمال و تمیز'),
  preferredTopics: text('preferred_topics', { mode: 'json' }).$type<string[]>().notNull().default([]),
  avoidedTopics: text('avoided_topics', { mode: 'json' }).$type<string[]>().notNull().default([]),
  preferredHooks: text('preferred_hooks', { mode: 'json' }).$type<string[]>().notNull().default([]),
  captionRules: text('caption_rules').notNull().default(''),
  persianLanguageRules: text('persian_language_rules').notNull().default(''),
  ctaStyle: text('cta_style').notNull().default(''),
  sourcePolicy: text('source_policy').notNull().default(''),
  imageStyle: text('image_style').notNull().default(''),
  successfulPatterns: text('successful_patterns', { mode: 'json' }).$type<string[]>().notNull().default([]),
  failedPatterns: text('failed_patterns', { mode: 'json' }).$type<string[]>().notNull().default([]),
  customInstructions: text('custom_instructions').notNull().default(''),
  updatedAt: text('updated_at').notNull().default(new Date().toISOString()),
})

// ─── content_pillars ─────────────────────────────────────────────────────────
export const contentPillars = sqliteTable('content_pillars', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  weight: integer('weight').notNull().default(20),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  color: text('color').notNull().default('#6366f1'),
})

// ─── posts ───────────────────────────────────────────────────────────────────
export const posts = sqliteTable('posts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  topic: text('topic').notNull(),
  contentType: text('content_type').notNull().default('carousel'),
  contentPillar: text('content_pillar').notNull().default(''),
  goal: text('goal').notNull().default(''),
  targetAudience: text('target_audience').notNull().default(''),
  hook: text('hook').notNull().default(''),
  caption: text('caption').notNull().default(''),
  cta: text('cta').notNull().default(''),
  hashtags: text('hashtags', { mode: 'json' }).$type<string[]>().notNull().default([]),
  imageStyle: text('image_style').notNull().default(''),
  status: text('status').notNull().default('draft'),
  promptKey: text('prompt_key'),
  promptVersion: integer('prompt_version'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  scheduledAt: text('scheduled_at'),
  publishedAt: text('published_at'),
  // Cost summary stored as JSON
  estimatedCost: text('estimated_cost', { mode: 'json' }).$type<{
    textCost: number
    researchCost: number
    imageCost: number
    total: number
  }>().notNull().default({ textCost: 0, researchCost: 0, imageCost: 0, total: 0 }),
  // Quality score stored as JSON
  qualityScore: text('quality_score', { mode: 'json' }).$type<{
    hook: number
    clarity: number
    originality: number
    persianNaturalness: number
    factualConfidence: number
    visualConsistency: number
  } | null>(),
  // Performance metrics stored as JSON
  performanceMetrics: text('performance_metrics', { mode: 'json' }).$type<{
    views: number
    reach: number
    likes: number
    comments: number
    shares: number
    saves: number
    profileVisits: number
    follows: number
    engagementRate: number
  } | null>(),
})

// ─── post_slides ─────────────────────────────────────────────────────────────
export const postSlides = sqliteTable('post_slides', {
  id: text('id').primaryKey(),
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  slideNumber: integer('slide_number').notNull(),
  type: text('type').notNull().default('content'),
  headline: text('headline').notNull().default(''),
  body: text('body').notNull().default(''),
  visualDirection: text('visual_direction').notNull().default(''),
  imagePrompt: text('image_prompt').notNull().default(''),
  imageAssetId: text('image_asset_id'),
})

// ─── sources ─────────────────────────────────────────────────────────────────
export const sources = sqliteTable('sources', {
  id: text('id').primaryKey(),
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  url: text('url').notNull().default(''),
  publisher: text('publisher').notNull().default(''),
  publishedAt: text('published_at'),
  verificationStatus: text('verification_status').notNull().default('unverified'),
})

// ─── ai_usage ────────────────────────────────────────────────────────────────
export const aiUsage = sqliteTable('ai_usage', {
  id: text('id').primaryKey(),
  generationSessionId: text('generation_session_id'),
  operation: text('operation').notNull(),
  provider: text('provider').notNull().default('openai'),
  model: text('model').notNull(),
  inputTokens: integer('input_tokens').notNull().default(0),
  cachedInputTokens: integer('cached_input_tokens').notNull().default(0),
  outputTokens: integer('output_tokens').notNull().default(0),
  reasoningTokens: integer('reasoning_tokens').notNull().default(0),
  toolCalls: integer('tool_calls').notNull().default(0),
  webSearchCalls: integer('web_search_calls').notNull().default(0),
  imageGenerationCount: integer('image_generation_count').notNull().default(0),
  estimatedTextCost: real('estimated_text_cost').notNull().default(0),
  webSearchCost: real('web_search_cost').notNull().default(0),
  imageCost: real('image_cost').notNull().default(0),
  totalCost: real('total_cost').notNull().default(0),
  /** @deprecated use totalCost */
  estimatedCost: real('estimated_cost').notNull().default(0),
  durationMs: integer('duration_ms'),
  postId: text('post_id'),
  promptKey: text('prompt_key'),
  promptVersion: integer('prompt_version'),
  success: integer('success', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
})

// ─── automation_settings ─────────────────────────────────────────────────────
export const automationSettings = sqliteTable('automation_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  publishDays: text('publish_days', { mode: 'json' }).$type<string[]>().notNull().default([]),
  suggestedHour: integer('suggested_hour').notNull().default(19),
  postsPerDay: integer('posts_per_day').notNull().default(1),
  allowedFormats: text('allowed_formats', { mode: 'json' }).$type<string[]>().notNull().default([]),
  autoGenerate: integer('auto_generate', { mode: 'boolean' }).notNull().default(false),
  autoPublish: integer('auto_publish', { mode: 'boolean' }).notNull().default(false),
  requireApproval: integer('require_approval', { mode: 'boolean' }).notNull().default(true),
})

// ─── performance_metrics ─────────────────────────────────────────────────────
export const performanceMetrics = sqliteTable('performance_metrics', {
  id: text('id').primaryKey(),
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  views: integer('views').notNull().default(0),
  reach: integer('reach').notNull().default(0),
  likes: integer('likes').notNull().default(0),
  comments: integer('comments').notNull().default(0),
  shares: integer('shares').notNull().default(0),
  saves: integer('saves').notNull().default(0),
  profileVisits: integer('profile_visits').notNull().default(0),
  follows: integer('follows').notNull().default(0),
  engagementRate: real('engagement_rate').notNull().default(0),
  recordedAt: text('recorded_at').notNull(),
})

// ─── learned_patterns ────────────────────────────────────────────────────────
export const learnedPatterns = sqliteTable('learned_patterns', {
  id: text('id').primaryKey(),
  pattern: text('pattern').notNull(),
  confidence: real('confidence').notNull().default(0),
  evidence: text('evidence', { mode: 'json' }).$type<string[]>().notNull().default([]),
  createdAt: text('created_at').notNull(),
})

// ─── prompt_templates ────────────────────────────────────────────────────────
export const promptTemplates = sqliteTable('prompt_templates', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  version: integer('version').notNull().default(1),
  name: text('name').notNull(),
  prompt: text('prompt').notNull(),
  description: text('description').notNull().default(''),
  updatedAt: text('updated_at').notNull(),
})

// ─── media_assets ────────────────────────────────────────────────────────────
export const mediaAssets = sqliteTable('media_assets', {
  id: text('id').primaryKey(),
  type: text('type').notNull().default('generated'),
  url: text('url').notNull(),
  name: text('name').notNull(),
  tags: text('tags', { mode: 'json' }).$type<string[]>().notNull().default([]),
  createdAt: text('created_at').notNull(),
})

// ─── app_settings ────────────────────────────────────────────────────────────
export const appSettings = sqliteTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value', { mode: 'json' }).notNull(),
  updatedAt: text('updated_at').notNull(),
})
