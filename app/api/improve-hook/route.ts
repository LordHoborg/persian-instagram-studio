import { NextRequest, NextResponse } from 'next/server'
import { improveHook } from '@/lib/aiService'
import { db } from '@/lib/db/client'
import { posts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const ImproveHookRequestSchema = z.object({
  postId: z.string().trim().min(1).max(128),
  currentHook: z.string().trim().min(1).max(2_000),
  topic: z.string().trim().max(1_000).optional(),
}).strict()

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export async function POST(req: NextRequest) {
  try {
    const parsed = ImproveHookRequestSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'شناسه پست و Hook معتبر الزامی هستند' },
        { status: 400 }
      )
    }

    const { postId, currentHook, topic } = parsed.data
    const result = await improveHook(currentHook, topic ?? '')
    const updated = await db
      .update(posts)
      .set({ hook: result.hook, updatedAt: new Date().toISOString() })
      .where(eq(posts.id, postId))
      .returning({ id: posts.id })

    if (updated.length === 0) {
      return NextResponse.json({ error: 'پست یافت نشد' }, { status: 404 })
    }

    return NextResponse.json({ hook: result.hook, cost: result.cost })
  } catch (err: unknown) {
    console.error('[improve-hook]', err)
    return NextResponse.json(
      { error: errorMessage(err, 'خطا در بهبود Hook') },
      { status: 500 }
    )
  }
}
