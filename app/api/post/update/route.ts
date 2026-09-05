import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { posts, postSlides, sources } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { generateId } from '@/lib/utils'
import { ensureSeeded } from '@/lib/db/seed'
import { z } from 'zod'

const SlideSchema = z.object({
  slideNumber: z.number().int().positive().max(100),
  type: z.enum(['cover', 'content', 'quote', 'cta', 'source']),
  headline: z.string().max(500),
  body: z.string().max(10_000),
  visualDirection: z.string().max(5_000),
  imagePrompt: z.string().max(5_000),
  imageAssetId: z.string().max(25_000_000).nullable().optional(),
}).strict()

const SourceSchema = z.object({
  title: z.string().trim().min(1).max(1_000),
  url: z.string().max(2_000),
  publisher: z.string().max(500),
  date: z.string().max(100).optional(),
  verified: z.enum(['unverified', 'verified', 'questionable']).optional(),
  verificationStatus: z.enum(['unverified', 'verified', 'questionable', 'demo']).optional(),
}).strict()

const CostSchema = z.object({
  textCost: z.number().nonnegative(),
  researchCost: z.number().nonnegative(),
  imageCost: z.number().nonnegative(),
  total: z.number().nonnegative(),
}).strict()

const QualityScoreSchema = z.object({
  hook: z.number().min(0).max(10),
  clarity: z.number().min(0).max(10),
  originality: z.number().min(0).max(10),
  persianNaturalness: z.number().min(0).max(10),
  factualConfidence: z.number().min(0).max(10),
  visualConsistency: z.number().min(0).max(10),
}).strict().nullable()

const PostUpdatesSchema = z.object({
  title: z.string().trim().min(1).max(500).optional(),
  topic: z.string().trim().min(1).max(1_000).optional(),
  contentType: z.enum(['single', 'carousel', 'quote', 'story', 'reel']).optional(),
  contentPillar: z.string().max(500).optional(),
  goal: z.string().max(2_000).optional(),
  targetAudience: z.string().max(2_000).optional(),
  hook: z.string().max(2_000).optional(),
  caption: z.string().max(20_000).optional(),
  cta: z.string().max(2_000).optional(),
  hashtags: z.array(z.string().max(200)).max(100).optional(),
  imageStyle: z.string().max(200).optional(),
  status: z.enum(['idea', 'draft', 'generated', 'review', 'approved', 'scheduled', 'published', 'archived']).optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  publishedAt: z.string().datetime().nullable().optional(),
  estimatedCost: CostSchema.optional(),
  qualityScore: QualityScoreSchema.optional(),
  slides: z.array(SlideSchema).min(1).max(100).optional(),
  sources: z.array(SourceSchema).max(100).optional(),
}).strict().refine(value => Object.keys(value).length > 0)

const PostUpdateRequestSchema = z.object({
  id: z.string().trim().min(1).max(128),
  updates: PostUpdatesSchema,
}).strict()

const SlideUpdateRequestSchema = z.object({
  postId: z.string().trim().min(1).max(128),
  slideNumber: z.number().int().positive().max(100),
  updates: SlideSchema.omit({ slideNumber: true, type: true }).partial().refine(
    value => Object.keys(value).length > 0
  ),
}).strict()

let initializationPromise: Promise<void> | null = null
async function ensureInitialized() {
  initializationPromise ??= ensureSeeded().catch(error => {
    initializationPromise = null
    throw error
  })
  await initializationPromise
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export async function POST(req: NextRequest) {
  try {
    const parsed = PostUpdateRequestSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'داده‌های ویرایش پست معتبر نیستند' }, { status: 400 })
    }

    const { id, updates } = parsed.data
    await ensureInitialized()

    const existing = await db.select().from(posts).where(eq(posts.id, id)).limit(1)
    if (!existing[0]) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    const row = existing[0]
    const now = new Date().toISOString()

    await db.update(posts).set({
      title: updates.title ?? row.title,
      topic: updates.topic ?? row.topic,
      contentType: updates.contentType ?? row.contentType,
      contentPillar: updates.contentPillar ?? row.contentPillar,
      goal: updates.goal ?? row.goal,
      targetAudience: updates.targetAudience ?? row.targetAudience,
      hook: updates.hook ?? row.hook,
      caption: updates.caption ?? row.caption,
      cta: updates.cta ?? row.cta,
      hashtags: updates.hashtags ?? row.hashtags,
      imageStyle: updates.imageStyle ?? row.imageStyle,
      status: updates.status ?? row.status,
      scheduledAt: updates.scheduledAt === undefined ? row.scheduledAt : updates.scheduledAt,
      publishedAt: updates.publishedAt === undefined ? row.publishedAt : updates.publishedAt,
      estimatedCost: updates.estimatedCost ?? row.estimatedCost,
      qualityScore: updates.qualityScore === undefined ? row.qualityScore : updates.qualityScore,
      updatedAt: now,
    }).where(eq(posts.id, id))

    if (updates.slides) {
      const existingSlides = await db.select({
        slideNumber: postSlides.slideNumber,
        imageAssetId: postSlides.imageAssetId,
      }).from(postSlides).where(eq(postSlides.postId, id))
      const existingAssets = new Map(existingSlides.map(slide => [slide.slideNumber, slide.imageAssetId]))

      await db.delete(postSlides).where(eq(postSlides.postId, id))
      if (updates.slides.length) {
        const slideValues = updates.slides.map(s => ({
          id: generateId(),
          postId: id,
          slideNumber: s.slideNumber,
          type: s.type,
          headline: s.headline,
          body: s.body,
          visualDirection: s.visualDirection,
          imagePrompt: s.imagePrompt,
          imageAssetId: s.imageAssetId === undefined
            ? (existingAssets.get(s.slideNumber) ?? null)
            : s.imageAssetId,
        }))
        await db.insert(postSlides).values(slideValues)
      }
    }

    if (updates.sources) {
      await db.delete(sources).where(eq(sources.postId, id))
      if (updates.sources.length) {
        const sourceValues = updates.sources.map(s => ({
          id: generateId(),
          postId: id,
          title: s.title,
          url: s.url,
          publisher: s.publisher,
          publishedAt: s.date || null,
          verificationStatus: s.verificationStatus ?? s.verified ?? 'unverified',
        }))
        await db.insert(sources).values(sourceValues)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('[api/post/update]', err)
    return NextResponse.json({ error: errorMessage(err, 'ویرایش پست ناموفق بود') }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const parsed = SlideUpdateRequestSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'داده‌های ویرایش اسلاید معتبر نیستند' }, { status: 400 })
    }

    const { postId, slideNumber, updates } = parsed.data
    await ensureInitialized()

    const updated = await db.update(postSlides)
      .set(updates)
      .where(and(eq(postSlides.postId, postId), eq(postSlides.slideNumber, slideNumber)))
      .returning({ id: postSlides.id })

    if (updated.length === 0) {
      return NextResponse.json({ error: 'اسلاید یافت نشد' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('[api/post/slide]', err)
    return NextResponse.json({ error: errorMessage(err, 'ویرایش اسلاید ناموفق بود') }, { status: 500 })
  }
}
