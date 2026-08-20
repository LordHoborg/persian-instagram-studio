// lib/prompts/editorialReview.ts
import { PERSIAN_CONTENT_SYSTEM_PROMPT, JSON_OUTPUT_INSTRUCTION } from './system'

export const EDITORIAL_REVIEW_PROMPT = {
  key: 'editorial_review',
  version: 1,
}

export function buildEditorialReviewPrompt(params: {
  postTitle: string
  hook: string
  slides: Array<{ headline: string; body: string }>
  caption: string
}): { system: string; user: string } {
  const { postTitle, hook, slides, caption } = params

  const slideSummary = slides
    .map((s, i) => `اسلاید ${i + 1}: ${s.headline} — ${s.body.substring(0, 80)}...`)
    .join('\n')

  return {
    system: PERSIAN_CONTENT_SYSTEM_PROMPT,
    user: `پست زیر را از نظر کیفیت بررسی کن:

عنوان: ${postTitle}
Hook: ${hook}

اسلایدها:
${slideSummary}

کپشن: ${caption.substring(0, 200)}...

هر معیار را از ۰ تا ۱۰ امتیاز بده:
- hook: جذابیت و قدرت hook
- clarity: وضوح و خوانایی
- originality: اصالت و تازگی
- persianNaturalness: روانی زبان فارسی
- factualConfidence: اطمینان به صحت اطلاعات
- visualConsistency: هماهنگی بصری

${JSON_OUTPUT_INSTRUCTION}
فرمت: {"hook": 8, "clarity": 7, "originality": 8, "persianNaturalness": 9, "factualConfidence": 7, "visualConsistency": 8, "feedback": "بازخورد کلی"}`,
  }
}
