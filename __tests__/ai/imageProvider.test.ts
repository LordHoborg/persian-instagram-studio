import { describe, expect, it } from 'vitest'
import type { GeneratedImageResult } from '@/services/ai/types'
import { calculateImageCost } from '@/lib/ai/pricing'

describe('image result handling', () => {
  it('supports URL image results', () => {
    const result: GeneratedImageResult = {
      assetType: 'url',
      data: 'https://example.com/image.png',
      mimeType: 'image/png',
      model: 'gpt-image-2',
    }

    expect(result.assetType).toBe('url')
    expect(result.data).toContain('https://')
  })

  it('supports base64 image results', () => {
    const result: GeneratedImageResult = {
      assetType: 'base64',
      data: 'ZmFrZQ==',
      mimeType: 'image/png',
      model: 'gpt-image-2',
    }

    expect(result.assetType).toBe('base64')
    expect(result.data.length).toBeGreaterThan(0)
  })

  it('uses size-aware image cost path', () => {
    const square = calculateImageCost('gpt-image-2', 1, { size: '1024x1024' })
    const portrait = calculateImageCost('gpt-image-2', 1, { size: '1024x1536' })

    expect(square).toBeGreaterThan(0)
    expect(portrait).toBeGreaterThan(square)
  })
})
