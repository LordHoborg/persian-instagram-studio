import { describe, it, expect } from 'vitest'
import { calculateTextCost, calculateImageCost, calculateWebSearchCost, TEXT_MODEL_PRICING } from '@/lib/ai/pricing'

describe('calculateTextCost', () => {
  it('calculates gpt-4o-mini cost correctly', () => {
    const pricing = TEXT_MODEL_PRICING['gpt-4o-mini']
    const cost = calculateTextCost('gpt-4o-mini', 1_000_000, 1_000_000)
    expect(cost).toBeCloseTo(pricing.inputPerMillion + pricing.outputPerMillion, 5)
  })

  it('calculates gpt-4.1 cost correctly', () => {
    const pricing = TEXT_MODEL_PRICING['gpt-4.1']
    const cost = calculateTextCost('gpt-4.1', 1_000_000, 1_000_000)
    expect(cost).toBeCloseTo(pricing.inputPerMillion + pricing.outputPerMillion, 5)
  })

  it('calculates gpt-5 cost correctly', () => {
    const pricing = TEXT_MODEL_PRICING['gpt-5']
    const cost = calculateTextCost('gpt-5', 1_000_000, 1_000_000)
    expect(cost).toBeCloseTo(pricing.inputPerMillion + pricing.outputPerMillion, 5)
  })

  it('handles cached input tokens', () => {
    const pricing = TEXT_MODEL_PRICING['gpt-4.1']
    const cachedRate = pricing.cachedInputPerMillion ?? pricing.inputPerMillion * 0.5
    const cost = calculateTextCost('gpt-4.1', 1_000_000, 0, 1_000_000)
    expect(cost).toBeCloseTo(cachedRate, 5)
  })

  it('returns 0 for zero tokens', () => {
    expect(calculateTextCost('gpt-4o-mini', 0, 0)).toBe(0)
  })

  it('uses fallback for unknown model', () => {
    const cost = calculateTextCost('unknown-model-xyz', 1_000_000, 1_000_000)
    expect(cost).toBeGreaterThan(0)
  })
})

describe('calculateImageCost', () => {
  it('calculates gpt-image-2 cost', () => {
    const cost = calculateImageCost('gpt-image-2', 1)
    expect(cost).toBeGreaterThan(0)
  })

  it('scales with count', () => {
    const single = calculateImageCost('gpt-image-2', 1)
    const triple = calculateImageCost('gpt-image-2', 3)
    expect(triple).toBeCloseTo(single * 3, 5)
  })
})

describe('calculateWebSearchCost', () => {
  it('calculates web search cost', () => {
    const cost = calculateWebSearchCost(3)
    expect(cost).toBeGreaterThan(0)
  })

  it('returns 0 for 0 calls', () => {
    expect(calculateWebSearchCost(0)).toBe(0)
  })
})
