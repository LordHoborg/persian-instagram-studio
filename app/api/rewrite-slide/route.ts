import { NextRequest, NextResponse } from 'next/server'
import { rewriteSlide } from '@/lib/aiService'
import { db } from '@/lib/db/client'
import { postSlides } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import type { PostSlide } from '@/types'
import { z } from 'zod'

const RewriteSlideRequestSchema = z.object({
  postId: z.string().trim().min(1).max(128),
  slideIndex: z.number().int().min(0).max(99),
  instruction: z.string().trim().min(1).max(2_000),
}).strict()

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export async function POST(req: NextRequest) {
  try {
    const parsed = RewriteSlideRequestSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'شناسه پست، شماره اسلاید و دستور بازنویسی معتبر الزامی هستند' },
        { status: 400 }
      )
    }

    const { postId, slideIndex, instruction } = parsed.data
    const slideRows = await db.select().from(postSlides)
      .where(and(eq(postSlides.postId, postId), eq(postSlides.slideNumber, slideIndex + 1)))
      .limit(1)
    const slide = slideRows[0] as PostSlide | undefined
    if (!slide) {
      return NextResponse.json({ error: 'اسلاید یافت نشد' }, { status: 404 })
    }
    const result = await rewriteSlide(slide, instruction)
    await db.update(postSlides)
      .set({
        headline: result.slide.headline,
        body: result.slide.body,
        visualDirection: result.slide.visualDirection,
        imagePrompt: result.slide.imagePrompt,
      })
      .where(and(eq(postSlides.postId, postId), eq(postSlides.slideNumber, slideIndex + 1)))
    return NextResponse.json({ slide: result.slide, cost: result.cost })
  } catch (err: unknown) {
    console.error('[rewrite-slide]', err)
    return NextResponse.json(
      { error: errorMessage(err, 'خطا در بازنویسی اسلاید') },
      { status: 500 }
    )
  }
}
