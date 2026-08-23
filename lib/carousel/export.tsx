import { readFile } from 'node:fs/promises'
import path from 'node:path'
import satori from 'satori'
import JSZip from 'jszip'
import { Resvg } from '@resvg/resvg-js'
import { PostPackage, PostSlide } from '@/types'
import { CarouselTemplateId } from '@/components/carousel/carouselMeta'

const EXPORT_WIDTH = 1080
const EXPORT_HEIGHT = 1350

const TEMPLATE_THEME: Record<CarouselTemplateId, {
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
}> = {
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

let cachedFont: Buffer | null = null

async function getVazirmatnFont() {
  if (cachedFont) return cachedFont
  const fontPath = path.join(process.cwd(), 'node_modules', '@fontsource', 'vazirmatn', 'files', 'vazirmatn-arabic-400-normal.woff')
  cachedFont = await readFile(fontPath)
  return cachedFont
}

function toPersianNum(n: number) {
  return n.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

function getSlideTypeLabel(type: PostSlide['type']) {
  switch (type) {
    case 'cover': return 'کاور'
    case 'content': return 'محتوایی'
    case 'quote': return 'نقل‌قول'
    case 'cta': return 'پایانی'
    case 'source': return 'منبع'
    default: return 'اسلاید'
  }
}

function getSlideFileLabel(slide: PostSlide) {
  switch (slide.type) {
    case 'cover': return 'cover'
    case 'cta': return 'final'
    case 'source': return 'sources'
    default: return 'slide'
  }
}

function getSlideEyebrow(slide: PostSlide, slideCount: number) {
  if (slide.type === 'cover') return `شروع روایت · ${toPersianNum(slideCount)} اسلاید`
  return `نکته کلیدی · ${getSlideTypeLabel(slide.type)}`
}

function getSlideFooter(slide: PostSlide, post: PostPackage, verifiedCount: number, templateLabel: string) {
  if (slide.type === 'cover') return post.topic || post.imageStyle || 'روایت تصویری فارسی'
  if (slide.type === 'cta') return post.cta || 'دعوت به تعامل با مخاطب'
  if (slide.type === 'source') return verifiedCount > 0 ? `${toPersianNum(verifiedCount)} منبع تأییدشده` : 'مرور منابع و ارجاعات'
  return slide.visualDirection || templateLabel || 'چیدمان ساختاریافته'
}

function splitLines(text: string, maxChars: number, maxLines: number) {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return []

  const words = normalized.split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length <= maxChars) {
      current = candidate
      continue
    }

    if (current) lines.push(current)
    current = word
    if (lines.length === maxLines) break
  }

  if (current && lines.length < maxLines) lines.push(current)

  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[.،,:؛!؟…-]+$/u, '')}…`
  }

  return lines
}

function renderTextBlock(lines: string[], options: { fontSize: number; lineHeight: number; color: string; weight?: number; align?: 'right' | 'center' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: options.lineHeight - options.fontSize, width: '100%' }}>
      {lines.map((line, index) => (
        <div
          key={`${line}-${index}`}
          style={{
            fontSize: options.fontSize,
            lineHeight: `${options.lineHeight}px`,
            color: options.color,
            fontWeight: options.weight ?? 400,
            textAlign: options.align ?? 'right',
            width: '100%',
          }}
        >
          {line}
        </div>
      ))}
    </div>
  )
}

function renderSlideBody(slide: PostSlide, post: PostPackage, template: CarouselTemplateId) {
  const theme = TEMPLATE_THEME[template]
  const verifiedCount = post.sources.filter(source => source.verificationStatus === 'verified').length
  const templateLabel = template
  const headlineLines = splitLines(slide.headline, slide.type === 'cover' ? 18 : 24, slide.type === 'cover' ? 3 : 3)
  const bodyLines = splitLines(slide.body, slide.type === 'quote' ? 24 : 30, slide.type === 'source' ? 8 : 6)

  const shell = (content: React.ReactNode) => (
    <div
      style={{
        width: EXPORT_WIDTH,
        height: EXPORT_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        background: theme.bgGradient ?? theme.bg,
        color: theme.text,
        fontFamily: 'Vazirmatn',
        direction: 'rtl',
        textAlign: 'right',
        padding: 40,
      }}
    >
      <div style={{ position: 'absolute', inset: 24, borderRadius: 56, border: `2px solid ${theme.border}` }} />
      <div style={{ position: 'absolute', top: 40, left: 48, right: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 24, color: theme.textMuted }}>
        <div style={{ maxWidth: 700, whiteSpace: 'nowrap', overflow: 'hidden' }}>{getSlideEyebrow(slide, post.slides.length)}</div>
        <div style={{ border: `2px solid ${theme.accent}88`, color: theme.accent, borderRadius: 999, padding: '10px 18px', fontWeight: 700 }}>
          {toPersianNum(slide.slideNumber)} / {toPersianNum(post.slides.length)}
        </div>
      </div>

      <div style={{ position: 'relative', display: 'flex', flex: 1, paddingTop: 110, paddingBottom: 110 }}>
        {content}
      </div>

      <div style={{ position: 'absolute', bottom: 40, left: 48, right: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 22, color: theme.textMuted }}>
        <div style={{ maxWidth: 760, whiteSpace: 'nowrap', overflow: 'hidden' }}>{getSlideFooter(slide, post, verifiedCount, templateLabel)}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: 999, background: theme.accent, opacity: 0.45 }} />
          <div style={{ width: 48, height: 10, borderRadius: 999, background: theme.accent }} />
        </div>
      </div>

      {post.slides.length > 1 && (
        <div style={{ position: 'absolute', bottom: 24, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 10 }}>
          {post.slides.map((_, index) => {
            const active = index === slide.slideNumber - 1
            return (
              <div
                key={index}
                style={{
                  width: active ? 36 : 14,
                  height: 14,
                  borderRadius: 999,
                  background: active ? theme.accent : theme.text,
                  opacity: active ? 1 : 0.25,
                }}
              />
            )
          })}
        </div>
      )}
    </div>
  )

  if (slide.type === 'quote') {
    return shell(
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 28, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 120, color: theme.accent, opacity: 0.25, lineHeight: 1 }}>❝</div>
        {renderTextBlock(bodyLines, { fontSize: 44, lineHeight: 76, color: theme.text, weight: 700, align: 'center' })}
        {slide.headline ? renderTextBlock([`— ${slide.headline}`], { fontSize: 24, lineHeight: 36, color: theme.textMuted, align: 'center' }) : null}
      </div>
    )
  }

  if (slide.type === 'cta') {
    return shell(
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 28, width: '100%' }}>
        <div style={{ width: 120, height: 12, borderRadius: 999, background: theme.accent, marginLeft: 'auto' }} />
        {renderTextBlock(headlineLines, { fontSize: 56, lineHeight: 88, color: theme.text, weight: 900 })}
        {renderTextBlock(bodyLines, { fontSize: 30, lineHeight: 56, color: theme.textMuted })}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <div style={{ background: theme.accent, color: theme.accentText, borderRadius: 999, padding: '18px 34px', fontSize: 28, fontWeight: 700 }}>
            {post.cta || slide.headline}
          </div>
        </div>
      </div>
    )
  }

  if (slide.type === 'source') {
    return shell(
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end', color: theme.accent, fontSize: 28, fontWeight: 700 }}>
          <div style={{ width: 10, height: 10, borderRadius: 999, background: theme.accent }} />
          <div>منابع</div>
        </div>
        <div style={{ height: 2, background: theme.border, width: '100%' }} />
        {renderTextBlock(bodyLines, { fontSize: 28, lineHeight: 52, color: theme.textMuted })}
      </div>
    )
  }

  if (template === 'historical') {
    return shell(
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: slide.type === 'cover' ? 'space-between' : 'center', gap: 24, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
          <div style={{ height: 2, flex: 1, background: theme.accent, opacity: 0.5 }} />
          <div style={{ color: theme.accent, fontSize: 24 }}>✦</div>
          <div style={{ height: 2, flex: 1, background: theme.accent, opacity: 0.5 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 24, textAlign: 'center' }}>
          <div style={{ width: 80, height: 2, background: theme.accent }} />
          {renderTextBlock(headlineLines, { fontSize: slide.type === 'cover' ? 54 : 44, lineHeight: slide.type === 'cover' ? 86 : 72, color: theme.text, weight: 800, align: 'center' })}
          {renderTextBlock(bodyLines, { fontSize: slide.type === 'cover' ? 24 : 28, lineHeight: slide.type === 'cover' ? 46 : 54, color: theme.textMuted, align: 'center' })}
          <div style={{ width: 80, height: 2, background: theme.accent }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
          <div style={{ height: 2, flex: 1, background: theme.accent, opacity: 0.5 }} />
          <div style={{ color: theme.accent, fontSize: 24 }}>✦</div>
          <div style={{ height: 2, flex: 1, background: theme.accent, opacity: 0.5 }} />
        </div>
      </div>
    )
  }

  if (template === 'minimal') {
    return shell(
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24, width: '100%' }}>
        <div style={{ width: 120, height: 12, borderRadius: 999, background: theme.accent, marginLeft: 'auto' }} />
        {renderTextBlock(headlineLines, { fontSize: slide.type === 'cover' ? 58 : 46, lineHeight: slide.type === 'cover' ? 88 : 72, color: theme.text, weight: 900 })}
        <div style={{ height: 2, background: theme.border, width: '100%' }} />
        {renderTextBlock(bodyLines, { fontSize: 28, lineHeight: 54, color: theme.textMuted })}
      </div>
    )
  }

  if (template === 'magazine') {
    return shell(
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: 120, fontWeight: 900, color: theme.accent, opacity: 0.12, lineHeight: 1 }}>{toPersianNum(slide.slideNumber)}</div>
        </div>
        <div style={{ width: 160, height: 12, borderRadius: 999, background: theme.accent, marginLeft: 'auto', marginTop: -40 }} />
        {renderTextBlock(headlineLines, { fontSize: slide.type === 'cover' ? 58 : 46, lineHeight: slide.type === 'cover' ? 88 : 72, color: theme.text, weight: 900 })}
        {renderTextBlock(bodyLines, { fontSize: 28, lineHeight: 54, color: theme.textMuted })}
      </div>
    )
  }

  if (template === 'editorial') {
    return shell(
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
          <div style={{ height: 2, flex: 1, background: `linear-gradient(to left, ${theme.accent}, transparent)` }} />
          <div style={{ width: 12, height: 12, borderRadius: 999, background: theme.accent }} />
        </div>
        {renderTextBlock(headlineLines, { fontSize: slide.type === 'cover' ? 58 : 46, lineHeight: slide.type === 'cover' ? 88 : 72, color: theme.text, weight: 900 })}
        {renderTextBlock(bodyLines, { fontSize: 28, lineHeight: 54, color: theme.textMuted, weight: slide.type === 'cover' ? 500 : 400 })}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
          <div style={{ height: 2, flex: 1, background: `linear-gradient(to left, ${theme.accent}, transparent)` }} />
          <div style={{ width: 10, height: 10, borderRadius: 999, background: theme.accent }} />
          <div style={{ width: 8, height: 8, borderRadius: 999, background: theme.accent, opacity: 0.5 }} />
        </div>
      </div>
    )
  }

  return shell(
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: slide.type === 'cover' ? 'flex-end' : 'center', gap: 24, width: '100%' }}>
      <div style={{ alignSelf: 'flex-end', padding: '10px 18px', borderRadius: 12, fontSize: 22, fontWeight: 700, color: theme.accent, border: `2px solid ${theme.accent}44`, background: `${theme.accent}22` }}>
        ✦ {getSlideTypeLabel(slide.type)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, borderRadius: 36, padding: 36, background: theme.surface, border: `2px solid ${theme.border}` }}>
        {renderTextBlock(headlineLines, { fontSize: slide.type === 'cover' ? 58 : 44, lineHeight: slide.type === 'cover' ? 88 : 70, color: theme.surfaceText, weight: 900 })}
        <div style={{ height: 2, background: theme.border, width: '100%' }} />
        {renderTextBlock(bodyLines, { fontSize: 28, lineHeight: 54, color: theme.textMuted })}
      </div>
    </div>
  )
}

export async function renderSlideToPng(post: PostPackage, slide: PostSlide, template: CarouselTemplateId) {
  const fontData = await getVazirmatnFont()
  const svg = await satori(renderSlideBody(slide, post, template), {
    width: EXPORT_WIDTH,
    height: EXPORT_HEIGHT,
    fonts: [
      {
        name: 'Vazirmatn',
        data: fontData,
        weight: 400,
        style: 'normal',
      },
    ],
  })

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: EXPORT_WIDTH,
    },
  })

  return resvg.render().asPng()
}

export async function exportCarousel(post: PostPackage, template: CarouselTemplateId) {
  const zip = new JSZip()
  const slides = [] as Array<{ fileName: string; dataUrl: string; slideNumber: number; type: PostSlide['type'] }>

  for (const slide of post.slides) {
    const png = await renderSlideToPng(post, slide, template)
    const fileName = `${String(slide.slideNumber).padStart(2, '0')}-${getSlideFileLabel(slide)}.png`
    zip.file(fileName, png)
    slides.push({
      fileName,
      dataUrl: `data:image/png;base64,${png.toString('base64')}`,
      slideNumber: slide.slideNumber,
      type: slide.type,
    })
  }

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

  return {
    width: EXPORT_WIDTH,
    height: EXPORT_HEIGHT,
    format: 'png',
    slides,
    zipBase64: zipBuffer.toString('base64'),
    zipFileName: `${post.id}-carousel-export.zip`,
  }
}
