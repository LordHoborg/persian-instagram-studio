// services/research/index.ts
import { ResearchResult, ResearchResultSchema } from '@/services/ai/schemas'
import { getAIProvider } from '@/services/ai/provider'
import { MODEL_CONFIG } from '@/services/ai/modelConfig'

/**
 * Research a topic using OpenAI web search capabilities.
 * Only call this for factual/historical/scientific content — not for trivial rewrites.
 */
export async function researchTopic(topic: string): Promise<ResearchResult> {
  const provider = getAIProvider()

  const prompt = `درباره موضوع زیر تحقیق کن و اطلاعات دقیق و قابل اعتماد ارائه بده:

موضوع: ${topic}

اطلاعات باید شامل:
- خلاصه‌ای از موضوع (۲-۳ پاراگراف)
- حقایق کلیدی با سطح اطمینان
- منابع معتبر

فقط اطلاعاتی که از منابع معتبر تأیید شده را ارائه بده. اطلاعات جعلی نده.

خروجی را به صورت JSON برگردان:
{
  "summary": "خلاصه موضوع",
  "keyFacts": [
    {"claim": "ادعا", "confidence": "high|medium|low"}
  ],
  "sources": [
    {"title": "عنوان منبع", "url": "آدرس", "publisher": "ناشر", "publishedAt": "تاریخ"}
  ]
}`

  const result = await provider.generateStructured<ResearchResult>({
    operation: 'research_topic',
    prompt,
    model: MODEL_CONFIG.standard,
    maxTokens: 2000,
  })

  if (!result.success || !result.data) {
    return {
      summary: `اطلاعاتی درباره ${topic} یافت نشد.`,
      keyFacts: [],
      sources: [],
    }
  }

  // Validate with Zod
  const parsed = ResearchResultSchema.safeParse(result.data)
  if (!parsed.success) {
    console.warn('[Research] Validation failed, returning raw data')
    return result.data
  }

  return parsed.data
}

/**
 * Determine if a topic needs web research before content generation.
 * Historical, scientific, and factual topics should be researched.
 * Opinion, creative, and general topics don't need research.
 */
export function shouldResearchTopic(topic: string, contentPillar?: string): boolean {
  const researchPillars = ['تاریخ', 'علم', 'تاریخ ایران', 'تهران قدیم', 'شخصیت‌های تاریخی']
  if (contentPillar && researchPillars.some(p => contentPillar.includes(p))) return true

  const researchKeywords = ['تاریخ', 'علم', 'کشف', 'اختراع', 'جنگ', 'انقلاب', 'شخصیت', 'دوره', 'قرن', 'میلادی', 'هجری']
  return researchKeywords.some(kw => topic.includes(kw))
}
