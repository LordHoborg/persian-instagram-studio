// lib/prompts/postWriter.ts
import { PERSIAN_CONTENT_SYSTEM_PROMPT, JSON_OUTPUT_INSTRUCTION } from './system'

export const POST_WRITER_PROMPT = {
  key: 'post_writer',
  version: 1,
}

export function buildPostWriterPrompt(params: {
  topic: string
  contentType: string
  brandContext: string
  researchContext?: string
  recentHooks?: string[]
}): { system: string; user: string } {
  const { topic, contentType, brandContext, researchContext, recentHooks } = params

  const researchSection = researchContext
    ? `\nاطلاعات تحقیقاتی:\n${researchContext}\n`
    : ''

  const avoidHooks = recentHooks?.slice(0, 5).join('\n') ?? ''
  const hookAvoidSection = avoidHooks
    ? `\nاز این نوع hook‌ها پرهیز کن (اخیراً استفاده شده):\n${avoidHooks}\n`
    : ''

  return {
    system: PERSIAN_CONTENT_SYSTEM_PROMPT,
    user: `${brandContext}
${researchSection}
${hookAvoidSection}

موضوع: ${topic}
فرمت: ${contentType}

یک پست کامل اینستاگرام فارسی بنویس. پست باید شامل:
- hook قوی و کوتاه
- ۴ تا ۷ اسلاید (cover + content + cta)
- کپشن طبیعی (زیر ۱۵۰ کلمه)
- ۵ تا ۸ هشتگ مرتبط
- منابع (اگر محتوا تاریخی/علمی است)

${JSON_OUTPUT_INSTRUCTION}
فرمت JSON:
{
  "title": "عنوان پست",
  "topic": "${topic}",
  "contentType": "${contentType}",
  "contentPillar": "ستون محتوایی",
  "goal": "هدف پست",
  "targetAudience": "مخاطب هدف",
  "hook": "hook اصلی",
  "slides": [
    {
      "id": "slide_1",
      "slideNumber": 1,
      "type": "cover",
      "headline": "تیتر اسلاید",
      "body": "متن اسلاید",
      "visualDirection": "راهنمای بصری",
      "imagePrompt": "prompt برای تولید تصویر به انگلیسی"
    }
  ],
  "caption": "کپشن کامل",
  "cta": "call to action",
  "hashtags": ["#هشتگ"],
  "sources": [],
  "imageStyle": "modern"
}`,
  }
}
