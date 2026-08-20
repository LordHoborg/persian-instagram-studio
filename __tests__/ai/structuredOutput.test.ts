import { describe, it, expect } from 'vitest'
import { GeneratedPostSchema, GeneratedIdeasSchema, QualityReviewSchema } from '@/services/ai/schemas'

describe('GeneratedPostSchema', () => {
  it('accepts valid post', () => {
    const result = GeneratedPostSchema.safeParse({
      title: 'تست',
      topic: 'تاریخ',
      hook: 'هوک جذاب',
      slides: [{ id: '1', slideNumber: 1, type: 'cover', headline: 'عنوان', body: 'متن' }],
      caption: 'کپشن',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing required fields', () => {
    const result = GeneratedPostSchema.safeParse({ title: 'تست' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid content type', () => {
    const result = GeneratedPostSchema.safeParse({
      title: 'تست',
      topic: 'تاریخ',
      hook: 'هوک',
      slides: [{ id: '1', slideNumber: 1, type: 'cover', headline: 'عنوان', body: 'متن' }],
      caption: 'کپشن',
      contentType: 'invalid_type',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty slides array', () => {
    const result = GeneratedPostSchema.safeParse({
      title: 'تست',
      topic: 'تاریخ',
      hook: 'هوک',
      slides: [],
      caption: 'کپشن',
    })
    expect(result.success).toBe(false)
  })
})

describe('QualityReviewSchema', () => {
  it('rejects score out of range', () => {
    const result = QualityReviewSchema.safeParse({
      hook: 15,
      clarity: 8,
      originality: 7,
      persianNaturalness: 8,
      factualConfidence: 7,
      visualConsistency: 8,
    })
    expect(result.success).toBe(false)
  })

  it('accepts valid review', () => {
    const result = QualityReviewSchema.safeParse({
      hook: 8,
      clarity: 8,
      originality: 7,
      persianNaturalness: 9,
      factualConfidence: 7,
      visualConsistency: 8,
    })
    expect(result.success).toBe(true)
  })
})
