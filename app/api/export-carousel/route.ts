import { NextRequest, NextResponse } from 'next/server'
import { getPostById } from '@/lib/db'
import { exportCarouselWithBrowser } from '@/lib/carousel/export-browser'
import { CarouselTemplateId } from '@/components/carousel/carouselMeta'

const ALLOWED_TEMPLATES: CarouselTemplateId[] = ['editorial', 'historical', 'minimal', 'modern', 'magazine']

export async function POST(req: NextRequest) {
  try {
    const { postId, template } = await req.json()

    if (!postId) {
      return NextResponse.json({ error: 'postId الزامی است' }, { status: 400 })
    }

    const resolvedTemplate = ALLOWED_TEMPLATES.includes(template) ? template : 'modern'
    const post = await getPostById(postId)

    if (!post) {
      return NextResponse.json({ error: 'پست یافت نشد' }, { status: 404 })
    }

    const origin = req.nextUrl.origin
    const result = await exportCarouselWithBrowser(post, resolvedTemplate, origin)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[export-carousel]', error)
    return NextResponse.json({ error: 'خطا در خروجی گرفتن از کاروسل' }, { status: 500 })
  }
}
