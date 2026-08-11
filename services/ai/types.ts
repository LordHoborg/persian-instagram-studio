export interface AIModelConfig {
  id: string
  name: string
  provider: string
  costPer1kInput: number
  costPer1kOutput: number
  capabilities: string[]
}

export interface AIGenerationRequest {
  operation: string
  prompt: string
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface AIGenerationResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  usage: {
    inputTokens: number
    outputTokens: number
    estimatedCost: number
  }
}

export interface AIProviderInterface {
  generateText(request: AIGenerationRequest): Promise<AIGenerationResult<string>>
  generateStructured<T>(request: AIGenerationRequest): Promise<AIGenerationResult<T>>
  generateImage?(prompt: string, size?: string): Promise<AIGenerationResult<string>>
  getAvailableModels(): AIModelConfig[]
}
