import { NextRequest, NextResponse } from 'next/server'
import { rewriteSlide } from '@/lib/aiService'
import { getPostById, updatePost } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { postId, slideIndex, instruction } = await req.json()

    if (!postId || slideIndex === undefined || !instruction) {
      return NextResponse.json(
        { error: 'postId، slideIndex و instruction الزامی هستند' },
        { status: 400 }
      )
    }

    const post = await getPostById(postId)
    if (!post) {
      return NextResponse.json({ error: 'پست یافت نشد' }, { status: 404 })
    }

    const slide = post.slides[slideIndex]
    if (!slide) {
      return NextResponse.json({ error: 'اسلاید یافت نشد' }, { status: 404 })
    }

    const result = await rewriteSlide(slide, instruction)

    const newSlides = [...post.slides]
    newSlides[slideIndex] = result.slide
    await updatePost(postId, { slides: newSlides })

    return NextResponse.json({ slide: result.slide, cost: result.cost })
  } catch (err: any) {
    console.error('[rewrite-slide]', err)
    return NextResponse.json(
      { error: err?.message ?? 'خطا در بازنویسی اسلاید' },
      { status: 500 }
    )
  }
}
