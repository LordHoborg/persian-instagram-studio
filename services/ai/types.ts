// services/ai/types.ts
import type { ZodType } from 'zod'

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export class AIError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message)
    this.name = 'AIError'
  }
}

export class MissingApiKeyError extends AIError {
  constructor() {
    super('کلید API هوش مصنوعی تنظیم نشده است. لطفاً OPENAI_API_KEY را در .env تنظیم کنید.', 'MISSING_API_KEY')
    this.name = 'MissingApiKeyError'
  }
}

export class RateLimitError extends AIError {
  constructor(message = 'محدودیت نرخ درخواست به API رسیده است. لطفاً کمی صبر کنید.') {
    super(message, 'RATE_LIMIT')
    this.name = 'RateLimitError'
  }
}

export class StructuredOutputError extends AIError {
  constructor(message = 'خروجی ساختاریافته از AI دریافت نشد یا نامعتبر بود.') {
    super(message, 'STRUCTURED_OUTPUT_ERROR')
    this.name = 'StructuredOutputError'
  }
}

export class ResearchError extends AIError {
  constructor(message = 'خطا در انجام تحقیق.') {
    super(message, 'RESEARCH_ERROR')
    this.name = 'ResearchError'
  }
}

export class BudgetExceededError extends AIError {
  constructor(message = 'بودجه هوش مصنوعی تجاوز شده است.') {
    super(message, 'BUDGET_EXCEEDED')
    this.name = 'BudgetExceededError'
  }
}

export class ProviderError extends AIError {
  constructor(message: string) {
    super(message, 'PROVIDER_ERROR')
    this.name = 'ProviderError'
  }
}

// ---------------------------------------------------------------------------
// Model config
// ---------------------------------------------------------------------------

export interface AIModelConfig {
  id: string
  name: string
  provider: string
  costPer1kInput: number
  costPer1kOutput: number
  capabilities: string[]
}

// ---------------------------------------------------------------------------
// Usage metadata
// ---------------------------------------------------------------------------

export interface AIUsageMetadata {
  inputTokens: number
  cachedInputTokens?: number
  outputTokens: number
  reasoningTokens?: number
  estimatedCost: number
  webSearchCalls?: number
  webSearchCost?: number
  imageGenerationCount?: number
  imageCost?: number
  durationMs?: number
  toolCalls?: number
}

export type ResearchSourceProvenance = 'openai_web_search' | 'model_generated' | 'manual'
export type ResearchSourceVerificationStatus = 'verified' | 'unverified' | 'questionable'

export interface ResearchSource {
  id: string
  title: string
  url?: string
  publisher?: string
  publishedAt?: string
  provenance: ResearchSourceProvenance
  verificationStatus: ResearchSourceVerificationStatus
}

export interface ResearchFact {
  claim: string
  confidence: 'high' | 'medium' | 'low'
  sourceIds?: string[]
}

export interface ResearchUsageDetails {
  model: string
  inputTokens: number
  cachedInputTokens: number
  outputTokens: number
  reasoningTokens?: number
  webSearchCalls: number
  textCost: number
  webSearchCost: number
  totalCost: number
  durationMs: number
  toolCalls?: number
}

export interface ResearchResultData {
  summary: string
  keyFacts: ResearchFact[]
  sources: ResearchSource[]
  usage: ResearchUsageDetails
}

export interface GeneratedImageResult {
  assetType: 'url' | 'base64'
  data: string
  mimeType: string
  model: string
  size?: string
}

// ---------------------------------------------------------------------------
// Generation requests
// ---------------------------------------------------------------------------

export interface AIGenerationRequest {
  operation: string
  prompt: string
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface StructuredGenerationRequest<T> extends AIGenerationRequest {
  schema: ZodType<T>
}

// ---------------------------------------------------------------------------
// Generation results
// ---------------------------------------------------------------------------

export interface AIGenerationResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  usage: AIUsageMetadata
}

// ---------------------------------------------------------------------------
// Provider interface
// ---------------------------------------------------------------------------

export interface AIProviderInterface {
  generateText(request: AIGenerationRequest): Promise<AIGenerationResult<string>>
  generateStructured<T>(request: StructuredGenerationRequest<T>): Promise<AIGenerationResult<T>>
  generateImage?(prompt: string, size?: string): Promise<AIGenerationResult<GeneratedImageResult>>
  researchWithWebSearch?(request: StructuredGenerationRequest<unknown>): Promise<AIGenerationResult<unknown>>
  getAvailableModels(): AIModelConfig[]
}
