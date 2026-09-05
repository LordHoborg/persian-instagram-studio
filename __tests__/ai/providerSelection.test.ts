import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { resetAIProvider } from '@/services/ai/provider'

describe('provider selection', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    resetAIProvider()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    resetAIProvider()
  })

  it('returns MockAIProvider when USE_MOCK_AI=true', async () => {
    process.env.USE_MOCK_AI = 'true'
    delete process.env.OPENAI_API_KEY
    const { getAIProvider } = await import('@/services/ai/provider')
    const provider = getAIProvider()
    expect(provider.constructor.name).toBe('MockAIProvider')
  })

  it('throws MissingApiKeyError when USE_MOCK_AI=false and no key', async () => {
    process.env.USE_MOCK_AI = 'false'
    delete process.env.OPENAI_API_KEY
    const { getAIProvider } = await import('@/services/ai/provider')
    expect(() => getAIProvider()).toThrow('OPENAI_API_KEY')
  })
})
