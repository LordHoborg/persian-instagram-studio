export const CAROUSEL_TEMPLATES = [
  { id: 'editorial', label: 'ادیتوریال', color: '#e94560' },
  { id: 'historical', label: 'تاریخی', color: '#c9a227' },
  { id: 'minimal', label: 'مینیمال', color: '#0ea5e9' },
  { id: 'modern', label: 'مدرن', color: '#38bdf8' },
  { id: 'magazine', label: 'مجله', color: '#dc2626' },
] as const

export type CarouselTemplateId = typeof CAROUSEL_TEMPLATES[number]['id']
