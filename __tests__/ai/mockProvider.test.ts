import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { GeneratedPostSchema } from '@/services/ai/schemas'
import { MockAIProvider } from '@/services/ai/mockProvider'

describe('MockAIProvider user flows', () => {
  const provider = new MockAIProvider()

  it('returns usable ideas for the standalone brainstorm action', async () => {
    const schema = z.object({ ideas: z.array(z.string()).min(1) })
    const result = await provider.generateStructured({
      operation: 'brainstorm_ideas',
      prompt: 'چند ایده پیشنهاد بده',
      schema,
    })

    expect(result.success).toBe(true)
    expect(result.data?.ideas.length).toBeGreaterThan(0)
  })

  it('respects a requested non-carousel content type', async () => {
    const result = await provider.generateStructured({
      operation: 'generate_post',
      prompt: 'موضوع: معماری ایرانی\nقالب محتوا: story',
      schema: GeneratedPostSchema,
    })

    expect(result.success).toBe(true)
    expect(result.data?.contentType).toBe('story')
    expect(result.data?.slides).toHaveLength(1)
  })
})
