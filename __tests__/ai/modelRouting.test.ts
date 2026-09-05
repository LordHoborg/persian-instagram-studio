import { describe, it, expect } from 'vitest'
import { getModelForOperation, MODEL_CONFIG } from '@/services/ai/modelConfig'

describe('model routing', () => {
  it('routes generate_ideas to cheap', () => {
    expect(getModelForOperation('generate_ideas')).toBe(MODEL_CONFIG.cheap)
  })

  it('routes rewrite_slide to cheap', () => {
    expect(getModelForOperation('rewrite_slide')).toBe(MODEL_CONFIG.cheap)
  })

  it('routes generate_post to standard', () => {
    expect(getModelForOperation('generate_post')).toBe(MODEL_CONFIG.standard)
  })

  it('routes research_topic to standard', () => {
    expect(getModelForOperation('research_topic')).toBe(MODEL_CONFIG.standard)
  })

  it('routes editorial_review to premium', () => {
    expect(getModelForOperation('editorial_review')).toBe(MODEL_CONFIG.premium)
  })

  it('routes generate_image to image', () => {
    expect(getModelForOperation('generate_image')).toBe(MODEL_CONFIG.image)
  })

  it('defaults unknown operation to standard', () => {
    expect(getModelForOperation('unknown_operation')).toBe(MODEL_CONFIG.standard)
  })
})

describe('MODEL_CONFIG defaults', () => {
  it('has expected default model names', () => {
    // These are the defaults when env vars are not set
    // In test env, process.env overrides may apply
    expect(MODEL_CONFIG.cheap).toBeTruthy()
    expect(MODEL_CONFIG.standard).toBeTruthy()
    expect(MODEL_CONFIG.premium).toBeTruthy()
    expect(MODEL_CONFIG.image).toBeTruthy()
  })
})
