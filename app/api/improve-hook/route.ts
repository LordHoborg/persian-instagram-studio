import { NextRequest, NextResponse } from 'next/server'
import { improveHook } from '@/lib/aiService'
import { updatePost } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { postId, currentHook, topic } = await req.json()

    if (!postId || !currentHook) {
      return NextResponse.json(
        { error: 'postId و currentHook الزامی هستند' },
        { status: 400 }
      )
    }

    const result = await improveHook(currentHook, topic ?? '')
    await updatePost(postId, { hook: result.hook })

    return NextResponse.json({ hook: result.hook, cost: result.cost })
  } catch (err: any) {
    console.error('[improve-hook]', err)
    return NextResponse.json(
      { error: err?.message ?? 'خطا در بهبود Hook' },
      { status: 500 }
    )
  }
}
