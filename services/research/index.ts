// services/research/index.ts
import { z } from 'zod'
import { getAIProvider } from '@/services/ai/provider'
import { MODEL_CONFIG } from '@/services/ai/modelConfig'
import { calculateWebSearchCost } from '@/lib/ai/pricing'
import type { ResearchResultData, ResearchSource, ResearchUsageDetails } from '@/services/ai/types'

const ResearchSummarySchema = z.object({
  summary: z.string(),
  keyFacts: z.array(z.object({
    claim: z.string(),
    confidence: z.enum(['high', 'medium', 'low']),
    sourceIds: z.array(z.string()).optional(),
  })).default([]),
})

type ResearchSummary = z.infer<typeof ResearchSummarySchema>

function dedupeSources(sources: ResearchSource[]): ResearchSource[] {
  const seen = new Set<string>()
  const deduped: ResearchSource[] = []

  for (const source of sources) {
    const normalizedUrl = source.url?.trim()
    if (!normalizedUrl) continue

    if (seen.has(normalizedUrl)) continue
    seen.add(normalizedUrl)

    deduped.push({
      ...source,
      url: normalizedUrl,
    })
  }

  return deduped
}

function buildFallbackUsage(model: string, durationMs: number): ResearchUsageDetails {
  return {
    model,
    inputTokens: 0,
    cachedInputTokens: 0,
    outputTokens: 0,
    reasoningTokens: 0,
    webSearchCalls: 0,
    textCost: 0,
    webSearchCost: 0,
    totalCost: 0,
    durationMs,
    toolCalls: 0,
  }
}

export async function researchTopic(topic: string): Promise<ResearchResultData> {
  const provider = getAIProvider()
  const model = MODEL_CONFIG.standard
  const start = Date.now()

  if (!provider.researchWithWebSearch) {
    throw new Error('Current AI provider does not support real web search research.')
  }

  const prompt = `موضوع زیر را با استفاده از جست‌وجوی وب واقعی بررسی کن و فقط بر اساس نتایج واقعی جمع‌بندی کن.

موضوع: ${topic}

خروجی باید شامل این موارد باشد:
- summary: خلاصه دقیق و کوتاه به فارسی
- keyFacts: فهرست ادعاهای مهم با confidence و در صورت امکان sourceIds

قواعد مهم:
- از خودت منبع نساز
- URLها را تغییر نده
- اگر برای ادعایی منبع مشخصی نداری، sourceIds را خالی بگذار
- فقط JSON معتبر برگردان`

  const result = await provider.researchWithWebSearch({
    operation: 'research_topic',
    prompt,
    schema: ResearchSummarySchema,
    model,
    maxTokens: 2000,
  })

  const durationMs = Date.now() - start

  if (!result.success || !result.data) {
    return {
      summary: `اطلاعاتی درباره ${topic} یافت نشد.`,
      keyFacts: [],
      sources: [],
      usage: {
        ...buildFallbackUsage(model, durationMs),
        ...(result.usage ? {
          inputTokens: result.usage.inputTokens,
          cachedInputTokens: result.usage.cachedInputTokens ?? 0,
          outputTokens: result.usage.outputTokens,
          reasoningTokens: result.usage.reasoningTokens ?? 0,
          textCost: result.usage.estimatedCost,
          webSearchCalls: result.usage.webSearchCalls ?? 0,
          webSearchCost: result.usage.webSearchCost ?? calculateWebSearchCost(result.usage.webSearchCalls ?? 0),
          totalCost: result.usage.estimatedCost + (result.usage.webSearchCost ?? calculateWebSearchCost(result.usage.webSearchCalls ?? 0)),
          toolCalls: result.usage.toolCalls ?? 0,
          durationMs: result.usage.durationMs ?? durationMs,
        } : {}),
      },
    }
  }

  const data = result.data as {
    summary: ResearchSummary
    sources?: ResearchSource[]
  }

  const sources = dedupeSources(data.sources ?? [])
  const webSearchCalls = result.usage.webSearchCalls ?? 0
  const webSearchCost = result.usage.webSearchCost ?? calculateWebSearchCost(webSearchCalls)
  const textCost = result.usage.estimatedCost

  return {
    summary: data.summary.summary,
    keyFacts: data.summary.keyFacts ?? [],
    sources,
    usage: {
      model,
      inputTokens: result.usage.inputTokens,
      cachedInputTokens: result.usage.cachedInputTokens ?? 0,
      outputTokens: result.usage.outputTokens,
      reasoningTokens: result.usage.reasoningTokens ?? 0,
      webSearchCalls,
      textCost,
      webSearchCost,
      totalCost: textCost + webSearchCost,
      durationMs: result.usage.durationMs ?? durationMs,
      toolCalls: result.usage.toolCalls ?? 0,
    },
  }
}

export function shouldResearchTopic(topic: string, contentPillar?: string): boolean {
  const researchPillars = ['تاریخ', 'علم', 'تاریخ ایران', 'تهران قدیم', 'شخصیت‌های تاریخی', 'زندگینامه']
  if (contentPillar && researchPillars.some(p => contentPillar.includes(p))) return true

  const researchKeywords = [
    'تاریخ', 'علم', 'کشف', 'اختراع', 'جنگ', 'انقلاب', 'شخصیت', 'دوره', 'قرن', 'میلادی', 'هجری',
    'آمار', 'درصد', 'جمعیت', 'زندگی‌نامه', 'بیوگرافی', 'رویداد', 'سال', 'تاریخچه',
  ]

  return researchKeywords.some(kw => topic.includes(kw))
}
