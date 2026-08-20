// lib/prompts/topicGenerator.ts
import { PERSIAN_CONTENT_SYSTEM_PROMPT, JSON_OUTPUT_INSTRUCTION } from './system'

export const TOPIC_GENERATOR_PROMPT = {
  key: 'topic_generator',
  version: 1,
}

export function buildTopicGeneratorPrompt(params: {
  brandContext: string
  recentTopics: string[]
  recentPillars: string[]
  pillars: Array<{ name: string; weight: number }>
}): { system: string; user: string } {
  const { brandContext, recentTopics, recentPillars, pillars } = params

  const pillarList = pillars
    .filter(p => p.weight > 0)
    .map(p => `- ${p.name} (وزن: ${p.weight}%)`)
    .join('\n')

  const avoidTopics = recentTopics.slice(0, 10).join('، ')

  return {
    system: PERSIAN_CONTENT_SYSTEM_PROMPT,
    user: `${brandContext}

ستون‌های محتوایی و وزن آن‌ها:
${pillarList}

موضوعات اخیر (از تکرار پرهیز کن):
${avoidTopics || 'هیچ'}

ستون‌های اخیر استفاده‌شده:
${recentPillars.slice(0, 5).join('، ') || 'هیچ'}

وظیفه: ۸ ایده موضوعی جذاب برای پست اینستاگرام پیشنهاد بده. موضوعات باید:
- متنوع و تکراری نباشند
- با ستون‌های محتوایی هماهنگ باشند
- برای مخاطب جذاب باشند
- قابل تولید محتوای کاروسل باشند

${JSON_OUTPUT_INSTRUCTION}
فرمت: {"ideas": ["موضوع ۱", "موضوع ۲", ...]}`,
  }
}
