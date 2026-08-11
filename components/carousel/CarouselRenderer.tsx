'use client'

import { PostSlide } from '@/types'
import { cn } from '@/lib/utils'

interface CarouselRendererProps {
  slide: PostSlide
  template?: string
  className?: string
}

const templates: Record<string, { bg: string; text: string; accent: string; font: string }> = {
  editorial: { bg: '#1a1a2e', text: '#ffffff', accent: '#e94560', font: 'font-bold' },
  historical: { bg: '#3d2b1f', text: '#f4e4c1', accent: '#c9a227', font: 'font-serif' },
  minimal: { bg: '#fafafa', text: '#171717', accent: '#0ea5e9', font: 'font-medium' },
  modern: { bg: '#0f172a', text: '#f8fafc', accent: '#38bdf8', font: 'font-bold' },
  dark: { bg: '#000000', text: '#e5e5e5', accent: '#a3a3a3', font: 'font-medium' },
  magazine: { bg: '#ffffff', text: '#1a1a1a', accent: '#dc2626', font: 'font-serif' },
  quote: { bg: '#fef3c7', text: '#78350f', accent: '#b45309', font: 'font-serif' },
}

export function CarouselRenderer({ slide, template = 'modern', className }: CarouselRendererProps) {
  const t = templates[template] || templates.modern

  return (
    <div
      className={cn(
        'relative w-full aspect-[4/5] rounded-xl overflow-hidden shadow-lg flex flex-col p-6 text-center',
        className
      )}
      style={{ backgroundColor: t.bg, color: t.text }}
    >
      {slide.type === 'cover' && (
        <div className="flex-1 flex flex-col justify-center items-center gap-4">
          <div className="w-16 h-1 rounded-full mb-2" style={{ backgroundColor: t.accent }} />
          <h2 className={`text-2xl sm:text-3xl leading-relaxed ${t.font}`}>{slide.headline}</h2>
          <p className="text-sm opacity-80 mt-2">{slide.body}</p>
          <div className="w-16 h-1 rounded-full mt-4" style={{ backgroundColor: t.accent }} />
        </div>
      )}

      {slide.type === 'content' && (
        <div className="flex-1 flex flex-col justify-center items-center gap-4">
          <span className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full"
            style={{ backgroundColor: t.accent + '22', color: t.accent }}>
            {slide.slideNumber}
          </span>
          <h3 className={`text-xl sm:text-2xl leading-relaxed ${t.font}`}>{slide.headline}</h3>
          <p className="text-sm opacity-90 leading-loose mt-2">{slide.body}</p>
        </div>
      )}

      {slide.type === 'quote' && (
        <div className="flex-1 flex flex-col justify-center items-center gap-4 px-4">
          <span className="text-4xl opacity-30" style={{ color: t.accent }}>❝</span>
          <p className={`text-lg sm:text-xl leading-loose ${t.font}`}>{slide.body}</p>
          <p className="text-sm opacity-70 mt-2">— {slide.headline}</p>
        </div>
      )}

      {slide.type === 'cta' && (
        <div className="flex-1 flex flex-col justify-center items-center gap-4">
          <h3 className={`text-xl sm:text-2xl ${t.font}`}>{slide.headline}</h3>
          <p className="text-sm opacity-90">{slide.body}</p>
          <div className="mt-4 px-6 py-2 rounded-full text-sm font-medium"
            style={{ backgroundColor: t.accent, color: t.bg === '#ffffff' || t.bg === '#fafafa' ? '#ffffff' : t.bg }}>
            {slide.body}
          </div>
        </div>
      )}

      {slide.type === 'source' && (
        <div className="flex-1 flex flex-col justify-center items-start gap-3 text-right">
          <span className="text-xs opacity-60">منابع</span>
          <p className="text-sm leading-relaxed">{slide.body}</p>
        </div>
      )}

      <div className="absolute bottom-3 left-0 right-0 flex justify-center">
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full opacity-30" style={{ backgroundColor: t.text }} />
          ))}
        </div>
      </div>
    </div>
  )
}
