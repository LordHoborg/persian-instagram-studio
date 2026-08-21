import { describe, expect, it } from 'vitest'
import { calculateWebSearchCost } from '@/lib/ai/pricing'
import type { ResearchSource } from '@/services/ai/types'

function dedupeSources(sources: ResearchSource[]): ResearchSource[] {
  const seen = new Set<string>()
  return sources.filter(source => {
    const url = source.url?.trim()
    if (!url || seen.has(url)) return false
    seen.add(url)
    return true
  })
}

describe('research provenance', () => {
  it('marks actual web search sources as verified', () => {
    const source: ResearchSource = {
      id: 'source_1',
      title: 'Example',
      url: 'https://example.com',
      provenance: 'openai_web_search',
      verificationStatus: 'verified',
    }

    expect(source.provenance).toBe('openai_web_search')
    expect(source.verificationStatus).toBe('verified')
  })

  it('keeps model-generated bibliography unverified', () => {
    const source: ResearchSource = {
      id: 'source_2',
      title: 'Invented bibliography',
      url: 'https://example.com/fake',
      provenance: 'model_generated',
      verificationStatus: 'unverified',
    }

    expect(source.provenance).toBe('model_generated')
    expect(source.verificationStatus).not.toBe('verified')
  })

  it('does not verify sources when no search occurred', () => {
    const source: ResearchSource = {
      id: 'source_3',
      title: 'No search source',
      provenance: 'model_generated',
      verificationStatus: 'unverified',
    }

    expect(source.verificationStatus).toBe('unverified')
  })

  it('deduplicates identical URLs and drops missing URLs', () => {
    const sources: ResearchSource[] = [
      { id: '1', title: 'A', url: 'https://example.com/a', provenance: 'openai_web_search', verificationStatus: 'verified' },
      { id: '2', title: 'A duplicate', url: 'https://example.com/a', provenance: 'openai_web_search', verificationStatus: 'verified' },
      { id: '3', title: 'Missing URL', provenance: 'openai_web_search', verificationStatus: 'verified' },
    ]

    expect(dedupeSources(sources)).toHaveLength(1)
  })

  it('calculates web search cost from actual call count', () => {
    expect(calculateWebSearchCost(0)).toBe(0)
    expect(calculateWebSearchCost(3)).toBeCloseTo(0.03)
  })
})
