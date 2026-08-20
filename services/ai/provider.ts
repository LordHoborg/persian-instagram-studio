// services/ai/provider.ts
import { AIProviderInterface } from './types'
import { MockAIProvider } from './mockProvider'

let _provider: AIProviderInterface | null = null

export function getAIProvider(): AIProviderInterface {
  if (_provider) return _provider

  const useMock =
    process.env.USE_MOCK_AI === 'true' ||
    !process.env.OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY.trim() === ''

  if (useMock) {
    console.log('[AI] Using MockAIProvider (no OPENAI_API_KEY or USE_MOCK_AI=true)')
    _provider = new MockAIProvider()
    return _provider
  }

  // Lazy import to avoid bundling OpenAI SDK in mock mode
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { OpenAIProvider } = require('./openAIProvider') as { OpenAIProvider: new () => AIProviderInterface }
  console.log('[AI] Using OpenAIProvider')
  _provider = new OpenAIProvider()
  return _provider
}

/** Reset provider singleton (useful for testing) */
export function resetAIProvider() {
  _provider = null
}
