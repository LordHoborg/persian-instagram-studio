// services/ai/contentBrain.ts
import { BrandProfile, ContentPillar } from '@/types'

export interface ContentBrainContext {
  brandSummary: string
  pillars: Array<{ name: string; weight: number }>
  recentMemory: {
    topics: string[]
    hooks: string[]
    pillars: string[]
  }
}

/**
 * Build a compact, token-efficient Content Brain context string.
 * Do NOT dump the entire database — keep it concise.
 */
export function buildContentBrainContext(
  profile: BrandProfile,
  pillars: ContentPillar[],
  recentMemory: { topics: string[]; hooks: string[]; pillars: string[] }
): ContentBrainContext {
  return {
    brandSummary: formatBrandSummary(profile),
    pillars: pillars
      .filter(p => p.enabled)
      .map(p => ({ name: p.name, weight: p.weight })),
    recentMemory,
  }
}

export function formatBrandSummary(profile: BrandProfile): string {
  const lines: string[] = []

  if (profile.pageTopic) lines.push(`پیج درباره: ${profile.pageTopic}`)
  if (profile.targetAudience) lines.push(`مخاطب: ${profile.targetAudience}`)
  if (profile.writingStyle) lines.push(`سبک نگارش: ${profile.writingStyle}`)
  if (profile.visualStyle) lines.push(`سبک بصری: ${profile.visualStyle}`)

  if (profile.preferredHooks?.length) {
    lines.push(`hook‌های ترجیحی: ${profile.preferredHooks.slice(0, 3).join('، ')}`)
  }

  if (profile.captionRules) lines.push(`قوانین کپشن: ${profile.captionRules}`)
  if (profile.persianLanguageRules) lines.push(`قوانین زبانی: ${profile.persianLanguageRules}`)
  if (profile.ctaStyle) lines.push(`سبک CTA: ${profile.ctaStyle}`)

  if (profile.avoidedTopics?.length) {
    lines.push(`موضوعات ممنوع: ${profile.avoidedTopics.join('، ')}`)
  }

  if (profile.successfulPatterns?.length) {
    lines.push(`الگوهای موفق: ${profile.successfulPatterns.slice(0, 2).join('، ')}`)
  }

  if (profile.customInstructions) {
    lines.push(`دستورالعمل‌های خاص: ${profile.customInstructions}`)
  }

  return lines.join('\n')
}

export function formatContextForPrompt(ctx: ContentBrainContext): string {
  const pillarList = ctx.pillars
    .map(p => `${p.name} (${p.weight}%)`)
    .join('، ')

  return `=== مغز محتوا ===
${ctx.brandSummary}

ستون‌های محتوایی: ${pillarList}

موضوعات اخیر (پرهیز از تکرار): ${ctx.recentMemory.topics.slice(0, 10).join('، ') || 'هیچ'}
=================`
}
