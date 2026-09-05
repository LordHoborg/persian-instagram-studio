import { NextRequest, NextResponse } from 'next/server'
import { getPostById } from '@/lib/db'
import { exportCarouselWithBrowser } from '@/lib/carousel/export-browser'
import { CarouselTemplateId } from '@/components/carousel/carouselMeta'
import { z } from 'zod'

const ALLOWED_TEMPLATES = ['editorial', 'historical', 'minimal', 'modern', 'magazine'] as const satisfies readonly CarouselTemplateId[]
const ExportRequestSchema = z.object({
  postId: z.string().trim().min(1).max(128),
  template: z.enum(ALLOWED_TEMPLATES).optional(),
}).strict()

export async function POST(req: NextRequest) {
  try {
    const parsed = ExportRequestSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'شناسه پست یا قالب خروجی معتبر نیست' }, { status: 400 })
    }

    const { postId, template } = parsed.data
    const resolvedTemplate: CarouselTemplateId = template ?? 'modern'
    const post = await getPostById(postId)

    if (!post) {
      return NextResponse.json({ error: 'پست یافت نشد' }, { status: 404 })
    }

    const origin = req.nextUrl.origin
    const result = await exportCarouselWithBrowser(post, resolvedTemplate, origin)
    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error('[export-carousel]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'خطا در خروجی گرفتن از کاروسل' },
      { status: 500 }
    )
  }
}
