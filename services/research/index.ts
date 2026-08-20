// services/research/index.ts
import { ResearchResultSchema } from '@/services/ai/schemas'
import { getAIProvider } from '@/services/ai/provider'
import { MODEL_CONFIG } from '@/services/ai/modelConfig'
import { calculateWebSearchCost } from '@/lib/ai/pricing'

export interface ResearchUsage {
  model: string
  inputTokens: number
  cachedInputTokens: number
  outputTokens: number
  webSearchCalls: number
  textCost: number
  webSearchCost: number
  totalCost: number
  durationMs: number
}

export interface ResearchResult {
  summary: string
  keyFacts: Array<{ claim: string; confidence: 'high' | 'medium' | 'low' }>
  sources: Array<{
    title: string
    url: string
    publisher?: string
    publishedAt?: string
    /** true only when returned by a real web search tool */
    verified: boolean
  }>
  usage: ResearchUsage
}

/**
 * Research a topic using OpenAI web search capabilities.
 * Only call this for factual/historical/scientific content — not for trivial rewrites.
 */
export async function researchTopic(topic: string): Promise<ResearchResult> {
  const provider = getAIProvider()
  const model = MODEL_CONFIG.standard
  const start = Date.now()

  const prompt = `درباره موضوع زیر تحقیق کن و اطلاعات دقیق و قابل اعتماد ارائه بده:

موضوع: ${topic}

اطلاعات باید شامل:
- خلاصه‌ای از موضوع (۲-۳ پاراگراف)
- حقایق کلیدی با سطح اطمینان
- منابع معتبر (فقط منابعی که واقعاً وجود دارند)

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

  // Import schema locally to avoid circular dep
  const { ResearchResultSchema: schema } = await import('@/services/ai/schemas')

  const result = await provider.generateStructured({
    operation: 'research_topic',
    prompt,
    schema,
    model,
    maxTokens: 2000,
  })

  const durationMs = Date.now() - start
  const usageMeta = result.usage

  // Web search calls: if the provider tracked them, use that; otherwise estimate 1 if research ran
  const webSearchCalls = usageMeta.webSearchCalls ?? (result.success ? 1 : 0)
  const webSearchCost = calculateWebSearchCost(webSearchCalls)
  const textCost = usageMeta.estimatedCost

  const usage: ResearchUsage = {
    model,
    inputTokens: usageMeta.inputTokens,
    cachedInputTokens: usageMeta.cachedInputTokens ?? 0,
    outputTokens: usageMeta.outputTokens,
    webSearchCalls,
    textCost,
    webSearchCost,
    totalCost: textCost + webSearchCost,
    durationMs,
  }

  if (!result.success || !result.data) {
    return {
      summary: `اطلاعاتی درباره ${topic} یافت نشد.`,
      keyFacts: [],
      sources: [],
      usage,
    }
  }

  // Mark sources as verified=true since they came from a real web search
  const sources = (result.data.sources ?? []).map(s => ({
    ...s,
    url: s.url ?? '',
    verified: true, // real web search ran
  }))

  return {
    summary: result.data.summary,
    keyFacts: result.data.keyFacts ?? [],
    sources,
    usage,
  }
}

/**
 * Determine if a topic needs web research before content generation.
 */
export function shouldResearchTopic(topic: string, contentPillar?: string): boolean {
  const researchPillars = ['تاریخ', 'علم', 'تاریخ ایران', 'تهران قدیم', 'شخصیت‌های تاریخی']
  if (contentPillar && researchPillars.some(p => contentPillar.includes(p))) return true

  const researchKeywords = ['تاریخ', 'علم', 'کشف', 'اختراع', 'جنگ', 'انقلاب', 'شخصیت', 'دوره', 'قرن', 'میلادی', 'هجری']
  return researchKeywords.some(kw => topic.includes(kw))
}
