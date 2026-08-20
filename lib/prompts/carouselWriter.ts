// lib/prompts/carouselWriter.ts
import { PERSIAN_CONTENT_SYSTEM_PROMPT, JSON_OUTPUT_INSTRUCTION } from './system'

export const CAROUSEL_WRITER_PROMPT = {
  key: 'carousel_writer',
  version: 1,
}

export function buildRewriteSlidePrompt(params: {
  slideHeadline: string
  slideBody: string
  slideType: string
  instruction: string
  brandContext: string
}): { system: string; user: string } {
  const { slideHeadline, slideBody, slideType, instruction, brandContext } = params

  return {
    system: PERSIAN_CONTENT_SYSTEM_PROMPT,
    user: `${brandContext}

اسلاید فعلی:
نوع: ${slideType}
تیتر: ${slideHeadline}
متن: ${slideBody}

دستور: ${instruction}

اسلاید را بازنویسی کن.
${JSON_OUTPUT_INSTRUCTION}
فرمت: {"headline": "تیتر جدید", "body": "متن جدید", "visualDirection": "راهنمای بصری", "imagePrompt": "image prompt"}`,
  }
}

export function buildImproveHookPrompt(params: {
  currentHook: string
  topic: string
  brandContext: string
}): { system: string; user: string } {
  const { currentHook, topic, brandContext } = params

  return {
    system: PERSIAN_CONTENT_SYSTEM_PROMPT,
    user: `${brandContext}

موضوع: ${topic}
hook فعلی: ${currentHook}

یک hook بهتر بنویس. hook باید:
- کوتاه (زیر ۱۵ کلمه)
- کنجکاوی‌برانگیز
- طبیعی فارسی
- بدون کلیشه

${JSON_OUTPUT_INSTRUCTION}
فرمت: {"hook": "hook جدید", "reasoning": "دلیل بهتر بودن"}`,
  }
}
