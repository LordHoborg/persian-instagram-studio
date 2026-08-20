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
  generateImage?(prompt: string, size?: string): Promise<AIGenerationResult<string>>
  getAvailableModels(): AIModelConfig[]
}
