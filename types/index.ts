export interface PostSlide {
  slideNumber: number
  type: 'cover' | 'content' | 'quote' | 'cta' | 'source'
  headline: string
  body: string
  visualDirection: string
  imagePrompt: string
  renderedHtml?: string
}

export interface Source {
  id: string
  title: string
  url: string
  publisher: string
  date: string
  verified: 'unverified' | 'verified' | 'questionable'
}

export interface PostPackage {
  id: string
  title: string
  topic: string
  contentType: 'single' | 'carousel' | 'quote' | 'story' | 'reel'
  contentPillar: string
  goal: string
  targetAudience: string
  hook: string
  slides: PostSlide[]
  caption: string
  cta: string
  hashtags: string[]
  sources: Source[]
  imageStyle: string
  status: 'idea' | 'draft' | 'generated' | 'review' | 'approved' | 'scheduled' | 'published' | 'archived'
  createdAt: string
  scheduledAt: string | null
  publishedAt: string | null
  estimatedCost: {
    textCost: number
    imageCost: number
    total: number
  }
  qualityScore?: {
    hook: number
    clarity: number
    originality: number
    persianNaturalness: number
    factualConfidence: number
    visualConsistency: number
  }
  performanceMetrics?: PerformanceMetrics
  versionHistory: PostVersion[]
}

export interface PostVersion {
  id: string
  createdAt: string
  changes: string
  snapshot: Partial<PostPackage>
}

export interface PerformanceMetrics {
  views: number
  reach: number
  likes: number
  comments: number
  shares: number
  saves: number
  profileVisits: number
  follows: number
  engagementRate: number
}

export interface ContentPillar {
  id: string
  name: string
  description: string
  weight: number
  enabled: boolean
  color: string
}

export interface BrandProfile {
  pageTopic: string
  targetAudience: string
  writingStyle: string
  visualStyle: string
  preferredTopics: string[]
  avoidedTopics: string[]
  preferredHooks: string[]
  captionRules: string
  persianLanguageRules: string
  ctaStyle: string
  sourcePolicy: string
  imageStyle: string
  successfulPatterns: string[]
  failedPatterns: string[]
  customInstructions: string
}

export interface AIUsage {
  id: string
  operation: string
  model: string
  inputTokens: number
  outputTokens: number
  estimatedTextCost: number
  imageCost: number
  webSearchCost: number
  totalCost: number
  createdAt: string
  postId?: string
}

export interface AutomationSettings {
  publishDays: string[]
  suggestedHour: number
  postsPerDay: number
  allowedFormats: string[]
  autoGenerate: boolean
  autoPublish: boolean
  requireApproval: boolean
}

export interface LearnedPattern {
  id: string
  pattern: string
  confidence: number
  evidence: string[]
  createdAt: string
}

export interface MediaAsset {
  id: string
  type: 'generated' | 'uploaded' | 'background' | 'logo' | 'graphic'
  url: string
  name: string
  tags: string[]
  createdAt: string
}

export interface IntegrationStatus {
  instagram: {
    connected: boolean
    accountName?: string
    lastError?: string
  }
  openai: {
    configured: boolean
    model?: string
  }
}

export interface CostBudget {
  dailyBudget: number
  monthlyBudget: number
  imageGenerationLimit: number
  maxRetries: number
}

export type AIProvider = 'mock' | 'openai'

export interface PromptTemplate {
  id: string
  key: string
  name: string
  prompt: string
  description: string
}
