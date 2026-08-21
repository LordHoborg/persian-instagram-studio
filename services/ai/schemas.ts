// services/ai/schemas.ts
import { z } from 'zod'

// ─── PostSlide ────────────────────────────────────────────────────────────────
export const PostSlideSchema = z.object({
  id: z.string(),
  slideNumber: z.number().int().positive(),
  type: z.enum(['cover', 'content', 'quote', 'cta', 'source']),
  headline: z.string().min(1),
  body: z.string().min(1),
  visualDirection: z.string().default(''),
  imagePrompt: z.string().default(''),
  imageAssetId: z.string().nullable().optional(),
})

// ─── Source ───────────────────────────────────────────────────────────────────
export const SourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().default(''),
  publisher: z.string().default(''),
  date: z.string().default(''),
  verificationStatus: z.enum(['unverified', 'verified', 'questionable', 'demo']).default('unverified'),
})

// ─── CostSummary ──────────────────────────────────────────────────────────────
export const CostSummarySchema = z.object({
  textCost: z.number().default(0),
  researchCost: z.number().default(0),
  imageCost: z.number().default(0),
  total: z.number().default(0),
})

// ─── GeneratedPost ────────────────────────────────────────────────────────────
export const GeneratedPostSchema = z.object({
  title: z.string().min(1),
  topic: z.string().min(1),
  contentType: z.enum(['single', 'carousel', 'quote', 'story', 'reel']).default('carousel'),
  contentPillar: z.string().default(''),
  goal: z.string().default(''),
  targetAudience: z.string().default(''),
  hook: z.string().min(1),
  slides: z.array(PostSlideSchema).min(1),
  caption: z.string().min(1),
  cta: z.string().default(''),
  hashtags: z.array(z.string()).default([]),
  sources: z.array(SourceSchema).default([]),
  imageStyle: z.string().default('modern'),
})

export type GeneratedPost = z.infer<typeof GeneratedPostSchema>

// ─── GeneratedIdeas ───────────────────────────────────────────────────────────
export const GeneratedIdeasSchema = z.object({
  ideas: z.array(z.string()).min(1).max(15),
})

export type GeneratedIdeas = z.infer<typeof GeneratedIdeasSchema>

// ─── RewrittenSlide ───────────────────────────────────────────────────────────
export const RewrittenSlideSchema = z.object({
  headline: z.string().min(1),
  body: z.string().min(1),
  visualDirection: z.string().optional(),
  imagePrompt: z.string().optional(),
})

export type RewrittenSlide = z.infer<typeof RewrittenSlideSchema>

// ─── HookImprovement ─────────────────────────────────────────────────────────
export const HookImprovementSchema = z.object({
  hook: z.string().min(1),
  reasoning: z.string().optional(),
})

export type HookImprovement = z.infer<typeof HookImprovementSchema>

// ─── CaptionResult ───────────────────────────────────────────────────────────
export const CaptionResultSchema = z.object({
  caption: z.string().min(1),
  cta: z.string().default(''),
  hashtags: z.array(z.string()).default([]),
})

export type CaptionResult = z.infer<typeof CaptionResultSchema>

// ─── QualityReview ────────────────────────────────────────────────────────────
export const QualityReviewSchema = z.object({
  hook: z.number().int().min(0).max(10),
  clarity: z.number().int().min(0).max(10),
  originality: z.number().int().min(0).max(10),
  persianNaturalness: z.number().int().min(0).max(10),
  factualConfidence: z.number().int().min(0).max(10),
  visualConsistency: z.number().int().min(0).max(10),
  feedback: z.string().optional(),
})

export type QualityReview = z.infer<typeof QualityReviewSchema>

// ─── ResearchResult ───────────────────────────────────────────────────────────
export const ResearchResultSchema = z.object({
  summary: z.string(),
  keyFacts: z.array(z.object({
    claim: z.string(),
    confidence: z.enum(['high', 'medium', 'low']),
    sourceIds: z.array(z.string()).optional(),
  })).default([]),
  sources: z.array(z.object({
    id: z.string(),
    title: z.string(),
    url: z.string().optional(),
    publisher: z.string().optional(),
    publishedAt: z.string().optional(),
    provenance: z.enum(['openai_web_search', 'model_generated', 'manual']),
    verificationStatus: z.enum(['verified', 'unverified', 'questionable']),
  })).default([]),
})

export type ResearchResult = z.infer<typeof ResearchResultSchema>

// ─── SourceSuggestion ─────────────────────────────────────────────────────────
export const SourceSuggestionSchema = z.object({
  suggestions: z.array(z.object({
    title: z.string(),
    url: z.string(),
    publisher: z.string().optional(),
    relevance: z.enum(['high', 'medium', 'low']),
  })),
})

export type SourceSuggestion = z.infer<typeof SourceSuggestionSchema>
