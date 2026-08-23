'use client'

import { CSSProperties } from 'react'
import { PostSlide } from '@/types'
import { cn } from '@/lib/utils'
import { CarouselTemplateId } from './carouselMeta'

interface CarouselRendererPostMeta {
  title?: string
  topic?: string
  cta?: string
  imageStyle?: string
}

interface CarouselRendererSourceMeta {
  verifiedCount?: number
}

interface CarouselRendererThemeMeta {
  label?: string
}

interface CarouselRendererContext {
  post?: CarouselRendererPostMeta
  sourceMeta?: CarouselRendererSourceMeta
  themeMeta?: CarouselRendererThemeMeta
}

interface CarouselRendererProps {
  slide: PostSlide
  template?: CarouselTemplateId
  className?: string
  slideCount?: number
  context?: CarouselRendererContext
}

interface TemplateConfig {
  bg: string
  bgGradient?: string
  text: string
  textMuted: string
  accent: string
  accentText: string
  border: string
  surface: string
  surfaceText: string
  isDark: boolean
}

interface SlideLayoutMeta {
  eyebrow: string
  bodyLines?: number
}

const TEMPLATES: Record<CarouselTemplateId, TemplateConfig> = {
  editorial: {
    bg: '#1a1a2e',
    text: '#ffffff',
    textMuted: 'rgba(255,255,255,0.65)',
    accent: '#e94560',
    accentText: '#ffffff',
    border: 'rgba(233,69,96,0.35)',
    surface: 'rgba(255,255,255,0.06)',
    surfaceText: '#ffffff',
    isDark: true,
  },
  historical: {
    bgGradient: 'linear-gradient(160deg, #3d2b1f 0%, #2a1f14 100%)',
    bg: '#3d2b1f',
    text: '#f4e4c1',
    textMuted: 'rgba(244,228,193,0.65)',
    accent: '#c9a227',
    accentText: '#1a0f00',
    border: 'rgba(201,162,39,0.4)',
    surface: 'rgba(255,255,255,0.07)',
    surfaceText: '#f4e4c1',
    isDark: true,
  },
  minimal: {
    bg: '#ffffff',
    text: '#171717',
    textMuted: '#6b7280',
    accent: '#0ea5e9',
    accentText: '#ffffff',
    border: '#e5e7eb',
    surface: '#f8fafc',
    surfaceText: '#171717',
    isDark: false,
  },
  modern: {
    bg: '#0f172a',
    bgGradient: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
    text: '#f8fafc',
    textMuted: 'rgba(248,250,252,0.6)',
    accent: '#38bdf8',
    accentText: '#0f172a',
    border: 'rgba(56,189,248,0.25)',
    surface: 'rgba(255,255,255,0.05)',
    surfaceText: '#f8fafc',
    isDark: true,
  },
  magazine: {
    bg: '#ffffff',
    text: '#1a1a1a',
    textMuted: '#6b7280',
    accent: '#dc2626',
    accentText: '#ffffff',
    border: '#e5e7eb',
    surface: '#f9fafb',
    surfaceText: '#1a1a1a',
    isDark: false,
  },
}

const SLIDE_LAYOUT_META: Record<PostSlide['type'], SlideLayoutMeta> = {
  cover: { eyebrow: 'شروع روایت', bodyLines: 4 },
  content: { eyebrow: 'نکته کلیدی', bodyLines: 5 },
  quote: { eyebrow: 'نقل‌قول', bodyLines: 5 },
  cta: { eyebrow: 'دعوت به تعامل', bodyLines: 5 },
  source: { eyebrow: 'منابع', bodyLines: 6 },
}

const PERSIAN_FONT: CSSProperties = {
  fontFamily: "'Vazirmatn', 'Tahoma', sans-serif",
  direction: 'rtl',
  textAlign: 'right',
}

function toPersianNum(n: number): string {
  return n.toString().replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

function getSlideLabel(type: PostSlide['type']) {
  switch (type) {
    case 'cover':
      return 'کاور'
    case 'content':
      return 'محتوایی'
    case 'quote':
      return 'نقل‌قول'
    case 'cta':
      return 'پایانی'
    case 'source':
      return 'منبع'
    default:
      return 'اسلاید'
  }
}

function getBodyLineClampClass(lines = 5) {
  const map: Record<number, string> = {
    3: 'line-clamp-3',
    4: 'line-clamp-4',
    5: 'line-clamp-5',
    6: 'line-clamp-6',
  }

  return map[lines] ?? 'line-clamp-5'
}

function getSlideEyebrow(slide: PostSlide, slideCount: number) {
  const meta = SLIDE_LAYOUT_META[slide.type] ?? SLIDE_LAYOUT_META.content
  if (slide.type === 'cover') return `${meta.eyebrow} · ${toPersianNum(slideCount)} اسلاید`
  return `${meta.eyebrow} · ${getSlideLabel(slide.type)}`
}

function getSlideFooter(slide: PostSlide, context?: CarouselRendererContext) {
  if (slide.type === 'cover') {
    return context?.post?.topic || context?.post?.imageStyle || 'روایت تصویری فارسی'
  }
  if (slide.type === 'cta') {
    return context?.post?.cta || 'دعوت به تعامل با مخاطب'
  }
  if (slide.type === 'source') {
    const verifiedCount = context?.sourceMeta?.verifiedCount ?? 0
    return verifiedCount > 0 ? `${toPersianNum(verifiedCount)} منبع تأییدشده` : 'مرور منابع و ارجاعات'
  }
  return slide.visualDirection || context?.themeMeta?.label || 'چیدمان ساختاریافته'
}

function getImageOverlayStyle(slide: PostSlide): CSSProperties | undefined {
  if (!slide.imageAssetId) return undefined
  return {
    backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.08) 0%, rgba(15,23,42,0.22) 100%), url(${slide.imageAssetId})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
}

function SlideFrame({
  slide,
  slideCount,
  accent,
  textMuted,
  children,
  context,
}: {
  slide: PostSlide
  slideCount: number
  accent: string
  textMuted: string
  children: React.ReactNode
  context?: CarouselRendererContext
}) {
  return (
    <>
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 pt-4 text-[11px] font-semibold tracking-[0.08em]">
        <div className="rounded-full border px-2.5 py-1" style={{ borderColor: `${accent}55`, color: accent }}>
          {toPersianNum(slide.slideNumber)} / {toPersianNum(slideCount)}
        </div>
        <div className="max-w-[65%] truncate" style={{ color: textMuted }}>
          {getSlideEyebrow(slide, slideCount)}
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col pt-12 pb-10">{children}</div>

      <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between px-5 pb-4 text-[11px]">
        <div className="max-w-[70%] truncate" style={{ color: textMuted }}>
          {getSlideFooter(slide, context)}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent, opacity: 0.45 }} />
          <div className="h-1.5 w-6 rounded-full" style={{ backgroundColor: accent }} />
        </div>
      </div>
    </>
  )
}

function EditorialCover({ slide, t, slideCount, context }: { slide: PostSlide; t: TemplateConfig; slideCount: number; context?: CarouselRendererContext }) {
  return (
    <SlideFrame slide={slide} slideCount={slideCount} accent={t.accent} textMuted={t.textMuted} context={context}>
      <div className="flex-1 flex flex-col justify-center px-7 py-6 gap-5" style={PERSIAN_FONT}>
        <div className="flex items-center gap-3 justify-end">
          <div className="h-px flex-1" style={{ background: `linear-gradient(to left, ${t.accent}, transparent)` }} />
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.accent }} />
        </div>

        <h1 className="text-3xl font-black leading-snug tracking-tight" style={{ color: t.text, lineHeight: 1.55 }}>
          {slide.headline}
        </h1>

        {slide.body && (
          <p className="text-sm font-medium line-clamp-4" style={{ color: t.textMuted, lineHeight: 1.9 }}>
            {slide.body}
          </p>
        )}

        <div className="flex items-center gap-3 justify-end mt-2">
          <div className="h-px flex-1" style={{ background: `linear-gradient(to left, ${t.accent}, transparent)` }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.accent }} />
          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: t.accent, opacity: 0.5 }} />
        </div>
      </div>
    </SlideFrame>
  )
}

function EditorialContent({ slide, t, slideCount, context }: { slide: PostSlide; t: TemplateConfig; slideCount: number; context?: CarouselRendererContext }) {
  return (
    <SlideFrame slide={slide} slideCount={slideCount} accent={t.accent} textMuted={t.textMuted} context={context}>
      <div className="flex-1 flex flex-col px-7 py-6 gap-4" style={PERSIAN_FONT}>
        <div className="flex justify-start">
          <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: t.accent, color: t.accentText, letterSpacing: '0.02em' }}>
            {toPersianNum(slide.slideNumber)}
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-4">
          <div className="flex gap-3 items-start justify-end">
            <h2 className="text-xl font-bold flex-1" style={{ color: t.text, lineHeight: 1.6 }}>
              {slide.headline}
            </h2>
            <div className="w-1 rounded-full mt-1 shrink-0" style={{ backgroundColor: t.accent, height: '2.5rem' }} />
          </div>

          <p className={`text-sm ${getBodyLineClampClass(SLIDE_LAYOUT_META.content.bodyLines)}`} style={{ color: t.textMuted, lineHeight: 1.9 }}>
            {slide.body}
          </p>
        </div>
      </div>
    </SlideFrame>
  )
}

function OrnamentalBorder({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-2 justify-center px-6">
      <div className="h-px flex-1" style={{ backgroundColor: color, opacity: 0.5 }} />
      <span style={{ color, fontSize: 14, opacity: 0.8 }}>✦</span>
      <div className="h-px flex-1" style={{ backgroundColor: color, opacity: 0.5 }} />
    </div>
  )
}

function HistoricalCover({ slide, t, slideCount, context }: { slide: PostSlide; t: TemplateConfig; slideCount: number; context?: CarouselRendererContext }) {
  return (
    <SlideFrame slide={slide} slideCount={slideCount} accent={t.accent} textMuted={t.textMuted} context={context}>
      <div className="flex-1 flex flex-col justify-between px-6 py-5" style={PERSIAN_FONT}>
        <OrnamentalBorder color={t.accent} />

        <div className="flex flex-col items-center gap-4 text-center px-2">
          <div className="w-10 h-px" style={{ backgroundColor: t.accent }} />
          <h1 className="text-2xl font-bold" style={{ color: t.text, lineHeight: 1.7, textAlign: 'center' }}>
            {slide.headline}
          </h1>
          {slide.body && (
            <p className="text-xs line-clamp-4" style={{ color: t.textMuted, lineHeight: 2, textAlign: 'center' }}>
              {slide.body}
            </p>
          )}
          <div className="w-10 h-px" style={{ backgroundColor: t.accent }} />
        </div>

        <OrnamentalBorder color={t.accent} />
      </div>
    </SlideFrame>
  )
}

function HistoricalContent({ slide, t, slideCount, context }: { slide: PostSlide; t: TemplateConfig; slideCount: number; context?: CarouselRendererContext }) {
  return (
    <SlideFrame slide={slide} slideCount={slideCount} accent={t.accent} textMuted={t.textMuted} context={context}>
      <div className="flex-1 flex flex-col px-6 py-5 gap-4" style={PERSIAN_FONT}>
        <div className="flex justify-start">
          <span className="text-xs font-bold px-3 py-1 rounded" style={{ backgroundColor: `${t.accent}33`, color: t.accent, border: `1px solid ${t.accent}55` }}>
            {toPersianNum(slide.slideNumber)}
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-3">
          <OrnamentalBorder color={t.accent} />
          <h2 className="text-lg font-bold text-center" style={{ color: t.text, lineHeight: 1.7 }}>
            {slide.headline}
          </h2>
          <OrnamentalBorder color={t.accent} />
          <p className={`text-sm text-center ${getBodyLineClampClass(SLIDE_LAYOUT_META.content.bodyLines)}`} style={{ color: t.textMuted, lineHeight: 2 }}>
            {slide.body}
          </p>
        </div>
      </div>
    </SlideFrame>
  )
}

function MinimalCover({ slide, t, slideCount, context }: { slide: PostSlide; t: TemplateConfig; slideCount: number; context?: CarouselRendererContext }) {
  return (
    <SlideFrame slide={slide} slideCount={slideCount} accent={t.accent} textMuted={t.textMuted} context={context}>
      <div className="flex-1 flex flex-col justify-center px-8 py-6 gap-5" style={PERSIAN_FONT}>
        <div className="w-12 h-1 rounded-full" style={{ backgroundColor: t.accent, marginRight: 0, marginLeft: 'auto' }} />
        <h1 className="text-3xl font-black" style={{ color: t.text, lineHeight: 1.5 }}>
          {slide.headline}
        </h1>
        {slide.body && (
          <p className="text-sm line-clamp-4" style={{ color: t.textMuted, lineHeight: 1.9 }}>
            {slide.body}
          </p>
        )}
        <div className="w-6 h-1 rounded-full" style={{ backgroundColor: t.accent, opacity: 0.4, marginRight: 0, marginLeft: 'auto' }} />
      </div>
    </SlideFrame>
  )
}

function MinimalContent({ slide, t, slideCount, context }: { slide: PostSlide; t: TemplateConfig; slideCount: number; context?: CarouselRendererContext }) {
  return (
    <SlideFrame slide={slide} slideCount={slideCount} accent={t.accent} textMuted={t.textMuted} context={context}>
      <div className="flex-1 flex flex-col px-8 py-6 gap-4" style={PERSIAN_FONT}>
        <div className="flex justify-start">
          <span className="text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: `${t.accent}18`, color: t.accent, border: `1.5px solid ${t.accent}` }}>
            {toPersianNum(slide.slideNumber)}
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-3">
          <div className="flex gap-3 items-start justify-end">
            <h2 className="text-xl font-bold flex-1" style={{ color: t.text, lineHeight: 1.6 }}>
              {slide.headline}
            </h2>
            <div className="w-1 rounded-full shrink-0 mt-1" style={{ backgroundColor: t.accent, height: '2rem' }} />
          </div>

          <div className="h-px w-full" style={{ backgroundColor: t.border }} />

          <p className={`text-sm ${getBodyLineClampClass(SLIDE_LAYOUT_META.content.bodyLines)}`} style={{ color: t.textMuted, lineHeight: 1.9 }}>
            {slide.body}
          </p>
        </div>
      </div>
    </SlideFrame>
  )
}

function ModernCover({ slide, t, slideCount, context }: { slide: PostSlide; t: TemplateConfig; slideCount: number; context?: CarouselRendererContext }) {
  return (
    <SlideFrame slide={slide} slideCount={slideCount} accent={t.accent} textMuted={t.textMuted} context={context}>
      <div className="flex-1 flex flex-col justify-end px-7 pb-8 pt-6 gap-4" style={PERSIAN_FONT}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(to bottom, transparent 30%, ${t.bg}cc 100%)` }} />

        <div className="relative z-10 flex flex-col gap-4">
          <div className="self-end px-3 py-1 rounded text-xs font-bold" style={{ backgroundColor: `${t.accent}22`, color: t.accent, border: `1px solid ${t.accent}44` }}>
            ✦ {getSlideLabel(slide.type)}
          </div>

          <h1 className="text-3xl font-black" style={{ color: t.text, lineHeight: 1.5 }}>
            {slide.headline}
          </h1>

          {slide.body && (
            <p className="text-sm line-clamp-4" style={{ color: t.textMuted, lineHeight: 1.9 }}>
              {slide.body}
            </p>
          )}

          <div className="h-px w-full" style={{ background: `linear-gradient(to left, ${t.accent}88, transparent)` }} />
        </div>
      </div>
    </SlideFrame>
  )
}

function ModernContent({ slide, t, slideCount, context }: { slide: PostSlide; t: TemplateConfig; slideCount: number; context?: CarouselRendererContext }) {
  return (
    <SlideFrame slide={slide} slideCount={slideCount} accent={t.accent} textMuted={t.textMuted} context={context}>
      <div className="flex-1 flex flex-col px-6 py-5 gap-3" style={PERSIAN_FONT}>
        <div className="flex-1 flex flex-col rounded-xl p-5 gap-4" style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}>
          <div className="flex items-center justify-between">
            <div className="h-px flex-1" style={{ background: `linear-gradient(to right, transparent, ${t.accent}66)` }} />
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full mr-2" style={{ backgroundColor: t.accent, color: t.accentText }}>
              {toPersianNum(slide.slideNumber)}
            </span>
          </div>

          <h2 className="text-lg font-bold" style={{ color: t.surfaceText, lineHeight: 1.65 }}>
            {slide.headline}
          </h2>

          <div className="h-px" style={{ backgroundColor: t.border }} />

          <p className={`text-sm ${getBodyLineClampClass(SLIDE_LAYOUT_META.content.bodyLines)}`} style={{ color: t.textMuted, lineHeight: 1.9 }}>
            {slide.body}
          </p>
        </div>
      </div>
    </SlideFrame>
  )
}

function MagazineCover({ slide, t, slideCount, context }: { slide: PostSlide; t: TemplateConfig; slideCount: number; context?: CarouselRendererContext }) {
  return (
    <SlideFrame slide={slide} slideCount={slideCount} accent={t.accent} textMuted={t.textMuted} context={context}>
      <div className="flex-1 flex flex-col px-7 py-6 gap-4" style={PERSIAN_FONT}>
        <div className="flex justify-end">
          <span className="text-6xl font-black leading-none select-none" style={{ color: t.accent, opacity: 0.12 }} aria-hidden>
            {toPersianNum(slide.slideNumber)}
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-4 -mt-8">
          <div className="h-1 w-16 rounded-full self-end" style={{ backgroundColor: t.accent }} />
          <h1 className="text-3xl font-black" style={{ color: t.text, lineHeight: 1.5 }}>
            {slide.headline}
          </h1>
          {slide.body && (
            <p className="text-sm line-clamp-4" style={{ color: t.textMuted, lineHeight: 1.9 }}>
              {slide.body}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 justify-end">
          <div className="h-px flex-1" style={{ backgroundColor: t.border }} />
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.accent }} />
        </div>
      </div>
    </SlideFrame>
  )
}

function MagazineContent({ slide, t, slideCount, context }: { slide: PostSlide; t: TemplateConfig; slideCount: number; context?: CarouselRendererContext }) {
  return (
    <SlideFrame slide={slide} slideCount={slideCount} accent={t.accent} textMuted={t.textMuted} context={context}>
      <div className="flex-1 flex flex-col px-7 py-5 gap-4" style={PERSIAN_FONT}>
        <div className="flex justify-start">
          <span
            className="text-xs font-bold px-3 py-1"
            style={{
              backgroundColor: t.accent,
              color: t.accentText,
              clipPath: 'polygon(0 0, 100% 0, 92% 100%, 0 100%)',
              paddingRight: '1.25rem',
            }}
          >
            {toPersianNum(slide.slideNumber)}
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-3">
          <h2 className="text-xl font-black" style={{ color: t.text, lineHeight: 1.55 }}>
            {slide.headline}
          </h2>
          <div className="h-0.5 w-10 self-end rounded-full" style={{ backgroundColor: t.accent }} />
          <p className={`text-sm ${getBodyLineClampClass(SLIDE_LAYOUT_META.content.bodyLines)}`} style={{ color: t.textMuted, lineHeight: 1.9 }}>
            {slide.body}
          </p>
        </div>
      </div>
    </SlideFrame>
  )
}

function QuoteSlide({ slide, t, slideCount, context }: { slide: PostSlide; t: TemplateConfig; slideCount: number; context?: CarouselRendererContext }) {
  return (
    <SlideFrame slide={slide} slideCount={slideCount} accent={t.accent} textMuted={t.textMuted} context={context}>
      <div className="flex-1 flex flex-col justify-center px-8 py-6 gap-5" style={{ ...PERSIAN_FONT, textAlign: 'center' }}>
        <div className="text-6xl font-black leading-none select-none" style={{ color: t.accent, opacity: 0.25, fontFamily: 'Georgia, serif', direction: 'ltr' }} aria-hidden>
          ❝
        </div>

        <p className="text-lg font-semibold line-clamp-5" style={{ color: t.text, lineHeight: 1.9, textAlign: 'center' }}>
          {slide.body}
        </p>

        {slide.headline && (
          <p className="text-xs font-medium" style={{ color: t.textMuted, textAlign: 'center' }}>
            — {slide.headline}
          </p>
        )}

        <div className="flex items-center gap-2 justify-center">
          <div className="h-px w-8" style={{ backgroundColor: t.accent, opacity: 0.5 }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.accent }} />
          <div className="h-px w-8" style={{ backgroundColor: t.accent, opacity: 0.5 }} />
        </div>
      </div>
    </SlideFrame>
  )
}

function CTASlide({ slide, t, slideCount, context }: { slide: PostSlide; t: TemplateConfig; slideCount: number; context?: CarouselRendererContext }) {
  return (
    <SlideFrame slide={slide} slideCount={slideCount} accent={t.accent} textMuted={t.textMuted} context={context}>
      <div className="flex-1 flex flex-col justify-center px-8 py-6 gap-5" style={PERSIAN_FONT}>
        <div className="flex justify-end">
          <div className="h-1 w-12 rounded-full" style={{ backgroundColor: t.accent }} />
        </div>

        <h2 className="text-2xl font-black" style={{ color: t.text, lineHeight: 1.55 }}>
          {slide.headline}
        </h2>

        {slide.body && (
          <p className="text-sm line-clamp-5" style={{ color: t.textMuted, lineHeight: 1.9 }}>
            {slide.body}
          </p>
        )}

        <div className="flex justify-end mt-2">
          <div
            className="px-6 py-2.5 rounded-full text-sm font-bold shadow-lg max-w-full truncate"
            style={{ backgroundColor: t.accent, color: t.accentText, boxShadow: `0 4px 20px ${t.accent}55` }}
          >
            {context?.post?.cta || slide.headline}
          </div>
        </div>
      </div>
    </SlideFrame>
  )
}

function SourceSlide({ slide, t, slideCount, context }: { slide: PostSlide; t: TemplateConfig; slideCount: number; context?: CarouselRendererContext }) {
  return (
    <SlideFrame slide={slide} slideCount={slideCount} accent={t.accent} textMuted={t.textMuted} context={context}>
      <div className="flex-1 flex flex-col justify-center px-7 py-6 gap-4" style={PERSIAN_FONT}>
        <div className="flex items-center gap-2 justify-end">
          <span className="text-sm font-bold" style={{ color: t.accent }}>منابع</span>
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.accent }} />
        </div>

        <div className="h-px" style={{ backgroundColor: t.border }} />

        <p className="text-xs leading-loose line-clamp-6" style={{ color: t.textMuted, lineHeight: 2 }}>
          {slide.body}
        </p>
      </div>
    </SlideFrame>
  )
}

function ProgressDots({ current, total, accent, textColor }: { current: number; total: number; accent: string; textColor: string }) {
  if (total <= 1) return null
  const dots = Math.min(total, 9)
  return (
    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20">
      {Array.from({ length: dots }).map((_, i) => {
        const isActive = i === current - 1
        return (
          <div
            key={i}
            className="rounded-full transition-all"
            style={{
              width: isActive ? 16 : 6,
              height: 6,
              backgroundColor: isActive ? accent : textColor,
              opacity: isActive ? 1 : 0.25,
            }}
          />
        )
      })}
    </div>
  )
}

export function CarouselRenderer({
  slide,
  template = 'modern',
  className,
  slideCount = 1,
  context,
}: CarouselRendererProps) {
  const t = TEMPLATES[template] ?? TEMPLATES.modern
  const bgStyle: CSSProperties = t.bgGradient ? { background: t.bgGradient } : { backgroundColor: t.bg }
  const imageOverlayStyle = getImageOverlayStyle(slide)

  function renderSlideContent() {
    const sharedProps = { slide, t, slideCount, context }

    if (slide.type === 'quote') return <QuoteSlide {...sharedProps} />
    if (slide.type === 'cta') return <CTASlide {...sharedProps} />
    if (slide.type === 'source') return <SourceSlide {...sharedProps} />

    switch (template) {
      case 'editorial':
        return slide.type === 'cover' ? <EditorialCover {...sharedProps} /> : <EditorialContent {...sharedProps} />
      case 'historical':
        return slide.type === 'cover' ? <HistoricalCover {...sharedProps} /> : <HistoricalContent {...sharedProps} />
      case 'minimal':
        return slide.type === 'cover' ? <MinimalCover {...sharedProps} /> : <MinimalContent {...sharedProps} />
      case 'magazine':
        return slide.type === 'cover' ? <MagazineCover {...sharedProps} /> : <MagazineContent {...sharedProps} />
      case 'modern':
      default:
        return slide.type === 'cover' ? <ModernCover {...sharedProps} /> : <ModernContent {...sharedProps} />
    }
  }

  return (
    <div className={cn('relative w-full aspect-[4/5] rounded-[28px] overflow-hidden shadow-xl flex flex-col isolate', className)} style={{ ...bgStyle, color: t.text }} dir="rtl">
      <div className="absolute inset-[10px] rounded-[22px] border z-0" style={{ borderColor: t.border, opacity: 0.9 }} aria-hidden />

      {imageOverlayStyle && (
        <div className="absolute inset-0 z-0 opacity-20" style={imageOverlayStyle} aria-hidden />
      )}

      {t.isDark && (
        <div className="absolute bottom-0 left-0 right-0 h-28 z-10 pointer-events-none" style={{ background: `linear-gradient(to top, ${t.bg}ee, transparent)` }} aria-hidden />
      )}

      <div className="absolute inset-x-0 top-0 h-24 z-10 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.08), transparent)' }} aria-hidden />

      <div className="relative z-10 flex-1 flex flex-col">{renderSlideContent()}</div>

      <ProgressDots current={slide.slideNumber} total={slideCount} accent={t.accent} textColor={t.text} />
    </div>
  )
}
