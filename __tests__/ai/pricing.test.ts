import { describe, it, expect } from 'vitest'
import { calculateTextCost, calculateImageCost, calculateWebSearchCost, TEXT_MODEL_PRICING } from '@/lib/ai/pricing'

describe('calculateTextCost', () => {
  it('calculates terra cost correctly', () => {
    const pricing = TEXT_MODEL_PRICING['gpt-5.6-terra']
    const cost = calculateTextCost('gpt-5.6-terra', 1_000_000, 1_000_000)
    expect(cost).toBeCloseTo(pricing.inputPerMillion + pricing.outputPerMillion, 5)
  })

  it('calculates luna cost correctly', () => {
    const pricing = TEXT_MODEL_PRICING['gpt-5.6-luna']
    const cost = calculateTextCost('gpt-5.6-luna', 1_000_000, 1_000_000)
    expect(cost).toBeCloseTo(pricing.inputPerMillion + pricing.outputPerMillion, 5)
  })

  it('calculates sol cost correctly', () => {
    const pricing = TEXT_MODEL_PRICING['gpt-5.6-sol']
    const cost = calculateTextCost('gpt-5.6-sol', 1_000_000, 1_000_000)
    expect(cost).toBeCloseTo(pricing.inputPerMillion + pricing.outputPerMillion, 5)
  })

  it('handles cached input tokens', () => {
    const pricing = TEXT_MODEL_PRICING['gpt-5.6-terra']
    const cachedRate = pricing.cachedInputPerMillion ?? pricing.inputPerMillion * 0.5
    const cost = calculateTextCost('gpt-5.6-terra', 1_000_000, 0, 1_000_000)
    expect(cost).toBeCloseTo(cachedRate, 5)
  })

  it('returns 0 for zero tokens', () => {
    expect(calculateTextCost('gpt-5.6-terra', 0, 0)).toBe(0)
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
