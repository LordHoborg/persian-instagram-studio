// services/ai/provider.ts
import { AIProviderInterface } from './types'
import { MockAIProvider } from './mockProvider'
import { MissingApiKeyError } from './types'

let _provider: AIProviderInterface | null = null

export function getAIProvider(): AIProviderInterface {
  if (_provider) return _provider

  const useMockEnv = process.env.USE_MOCK_AI

  // Explicit mock mode
  if (useMockEnv === 'true') {
    console.log('[AI] USE_MOCK_AI=true → MockAIProvider')
    _provider = new MockAIProvider()
    return _provider
  }

  // Explicit real mode — require API key
  if (useMockEnv === 'false') {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey || apiKey.trim() === '') {
      throw new MissingApiKeyError()
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { OpenAIProvider } = require('./openAIProvider') as { OpenAIProvider: new () => AIProviderInterface }
    console.log('[AI] USE_MOCK_AI=false → OpenAIProvider')
    _provider = new OpenAIProvider()
    return _provider
  }

  // USE_MOCK_AI not set — default to mock in development, require key in production
  if (process.env.NODE_ENV === 'production') {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey || apiKey.trim() === '') {
      throw new MissingApiKeyError()
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { OpenAIProvider } = require('./openAIProvider') as { OpenAIProvider: new () => AIProviderInterface }
    console.log('[AI] Production mode → OpenAIProvider')
    _provider = new OpenAIProvider()
    return _provider
  }

  // Development with no key set → mock
  console.log('[AI] No USE_MOCK_AI set, no API key → MockAIProvider (dev default)')
  _provider = new MockAIProvider()
  return _provider
}

/** Reset provider singleton (useful for testing) */
export function resetAIProvider() {
  _provider = null
}
