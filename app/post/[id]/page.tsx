'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { getPostById } from '@/lib/db'
import { PostPackage, PostSlide } from '@/types'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Textarea } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
import { CarouselRenderer } from '@/components/carousel/CarouselRenderer'
import { CAROUSEL_TEMPLATES, CarouselTemplateId } from '@/components/carousel/carouselMeta'
import { getStatusLabel, getStatusColor, getContentTypeLabel, cn } from '@/lib/utils'
import {
  Check,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Loader2,
  Edit3,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FileText,
  LayoutTemplate,
  ScanSearch,
  Download,
  Images,
} from 'lucide-react'

function toPersianNum(n: number): string {
  return n.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

function getSlideTypeLabel(type: PostSlide['type']) {
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

function getVerificationMeta(status: string) {
  switch (status) {
    case 'verified':
      return {
        label: 'تأییدشده',
        className: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
        icon: ShieldCheck,
      }
    case 'questionable':
      return {
        label: 'نیازمند بررسی',
        className: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
        icon: AlertTriangle,
      }
    default:
      return {
        label: 'تأییدنشده',
        className: 'bg-surface-100 text-surface-600 border border-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:border-surface-700',
        icon: FileText,
      }
  }
}

const SLIDE_TYPE_ICONS: Record<PostSlide['type'], string> = {
  cover: '🎯',
  content: '📝',
  quote: '❝',
  cta: '📣',
  source: '🔗',
}

const QUALITY_SCORE_LABELS: Record<string, string> = {
  hook: 'Hook',
  clarity: 'وضوح',
  originality: 'اصالت',
  persianNaturalness: 'روانی فارسی',
  factualConfidence: 'اعتماد به facts',
  visualConsistency: 'هماهنگی بصری',
}

async function responseError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null) as { error?: string } | null
  return body?.error ?? fallback
}

type PostUpdatePayload = Partial<Omit<PostPackage, 'slides' | 'sources' | 'versionHistory'>> & {
  slides?: Array<Omit<PostSlide, 'id' | 'renderedHtml'>>
}

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const stripRef = useRef<HTMLDivElement>(null)

  const [post, setPost] = useState<PostPackage | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSlide, setActiveSlide] = useState(0)
  const [editMode, setEditMode] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState<CarouselTemplateId>('modern')
  const [rewriteInstruction, setRewriteInstruction] = useState('')
  const [rewriteOpen, setRewriteOpen] = useState(false)
  const [rewriteLoading, setRewriteLoading] = useState(false)
  const [rewriteError, setRewriteError] = useState('')
  const [hookLoading, setHookLoading] = useState(false)
  const [hookError, setHookError] = useState('')
  const [exportLoading, setExportLoading] = useState(false)
  const [exportError, setExportError] = useState('')
  const [exportedSlides, setExportedSlides] = useState<Array<{ fileName: string; dataUrl: string; slideNumber: number; type: PostSlide['type'] }>>([])
  const [exportZipName, setExportZipName] = useState('')
  const [exportZipBase64, setExportZipBase64] = useState('')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [saveError, setSaveError] = useState('')
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const p = await getPostById(params.id as string)
        if (p) {
          setPost(p)
          setEditMode(new URLSearchParams(window.location.search).get('edit') === 'true')
          const knownTemplates = CAROUSEL_TEMPLATES.map(template => template.id)
          setActiveTemplate(
            knownTemplates.includes(p.imageStyle as CarouselTemplateId)
              ? (p.imageStyle as CarouselTemplateId)
              : 'modern'
          )
        }
      } catch (reason: unknown) {
        setLoadError(reason instanceof Error ? reason.message : 'بارگذاری پست ناموفق بود')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])

  useEffect(() => {
    if (!stripRef.current) return
    const thumb = stripRef.current.children[activeSlide] as HTMLElement | undefined
    thumb?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [activeSlide])

  const handleUpdateSlide = (index: number, updates: Partial<PostSlide>) => {
    setPost(prev => prev ? { ...prev, slides: prev.slides.map((s, i) => i === index ? { ...s, ...updates } : s) } : null)
    setSaveState('idle')
  }

  const persistPostUpdates = async (updates: PostUpdatePayload) => {
    if (!post) return false
    setSaveError('')
    const response = await fetch('/api/post/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: post.id, updates }),
    })
    if (!response.ok) throw new Error(await responseError(response, 'ذخیره تغییرات ناموفق بود'))
    return true
  }

  const handleSaveEdits = async () => {
    if (!post || saveState === 'saving') return
    setSaveState('saving')
    setSaveError('')
    try {
      await persistPostUpdates({
        title: post.title,
        hook: post.hook,
        caption: post.caption,
        slides: post.slides.map(slide => ({
          slideNumber: slide.slideNumber,
          type: slide.type,
          headline: slide.headline,
          body: slide.body,
          visualDirection: slide.visualDirection,
          imagePrompt: slide.imagePrompt,
          imageAssetId: slide.imageAssetId,
        })),
      })
      setEditMode(false)
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2_000)
    } catch (reason: unknown) {
      setSaveError(reason instanceof Error ? reason.message : 'ذخیره تغییرات ناموفق بود')
      setSaveState('idle')
    }
  }

  const handleApprove = async () => {
    try {
      await persistPostUpdates({ status: 'approved' })
      setPost(previous => previous ? { ...previous, status: 'approved' } : null)
    } catch (reason: unknown) {
      setSaveError(reason instanceof Error ? reason.message : 'تأیید پست ناموفق بود')
    }
  }

  const handleSchedule = async () => {
    const scheduledAt = new Date(Date.now() + 86_400_000).toISOString()
    try {
      await persistPostUpdates({ status: 'scheduled', scheduledAt })
      setPost(previous => previous ? { ...previous, status: 'scheduled', scheduledAt } : null)
    } catch (reason: unknown) {
      setSaveError(reason instanceof Error ? reason.message : 'زمان‌بندی پست ناموفق بود')
    }
  }

  const handleRewriteSlide = async () => {
    if (!post || !rewriteInstruction.trim()) return
    setRewriteLoading(true)
    setRewriteError('')
    try {
      const res = await fetch('/api/rewrite-slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, slideIndex: activeSlide, instruction: rewriteInstruction }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'خطا در بازنویسی')
      const data = await res.json()
      const newSlides = [...post.slides]
      newSlides[activeSlide] = data.slide
      setPost({ ...post, slides: newSlides })
      setRewriteInstruction('')
      setRewriteOpen(false)
    } catch (err: unknown) {
      setRewriteError(err instanceof Error ? err.message : 'خطا در بازنویسی اسلاید')
    } finally {
      setRewriteLoading(false)
    }
  }

  const handleImproveHook = async () => {
    if (!post) return
    setHookLoading(true)
    setHookError('')
    try {
      const res = await fetch('/api/improve-hook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, currentHook: post.hook, topic: post.topic }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'خطا در بهبود Hook')
      const data = await res.json()
      setPost({ ...post, hook: data.hook })
    } catch (err: unknown) {
      setHookError(err instanceof Error ? err.message : 'خطا در بهبود Hook')
    } finally {
      setHookLoading(false)
    }
  }

  const handleExportCarousel = async () => {
    if (!post) return
    setExportLoading(true)
    setExportError('')
    setExportedSlides([])
    setExportZipBase64('')
    setExportZipName('')

    try {
      const res = await fetch('/api/export-carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, template: activeTemplate }),
      })

      if (!res.ok) throw new Error((await res.json()).error ?? 'خطا در خروجی گرفتن')

      const data = await res.json()
      setExportedSlides(data.slides ?? [])
      setExportZipBase64(data.zipBase64 ?? '')
      setExportZipName(data.zipFileName ?? `${post.id}-carousel-export.zip`)
    } catch (err: unknown) {
      setExportError(err instanceof Error ? err.message : 'خطا در خروجی گرفتن از کاروسل')
    } finally {
      setExportLoading(false)
    }
  }

  const handleDownloadZip = () => {
    if (!exportZipBase64 || !exportZipName) return
    const link = document.createElement('a')
    link.href = `data:application/zip;base64,${exportZipBase64}`
    link.download = exportZipName
    link.click()
  }

  const handleDownloadSlide = (fileName: string, dataUrl: string) => {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = fileName
    link.click()
  }

  const verifiedSources = useMemo(
    () => post?.sources.filter(source => source.verificationStatus === 'verified') ?? [],
    [post]
  )
  const unverifiedSources = useMemo(
    () => post?.sources.filter(source => source.verificationStatus !== 'verified') ?? [],
    [post]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-surface-500">
        <Loader2 className="animate-spin ml-2" size={20} />
        در حال بارگذاری...
      </div>
    )
  }

  if (!post) return <div role={loadError ? 'alert' : undefined} className="text-center py-20 text-surface-500">{loadError || 'پست یافت نشد'}</div>

  const currentSlide = post.slides[activeSlide]

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12" dir="rtl">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-surface-500 hover:text-surface-800 dark:hover:text-surface-200 transition-colors"
        >
          <ArrowRight size={18} />
          بازگشت
        </button>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <Badge className={getStatusColor(post.status)}>{getStatusLabel(post.status)}</Badge>
          <Badge variant="info">{getContentTypeLabel(post.contentType)}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-6 items-start">
        <div className="space-y-4 lg:sticky lg:top-6">
          <Card className="overflow-hidden">
            <CardContent className="p-4 sm:p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-surface-500 mb-1">پیش‌نمایش واقعی اسلاید</p>
                  <h1 className="text-lg font-bold text-surface-900 dark:text-white leading-relaxed">{post.title}</h1>
                </div>
                <div className="text-left">
                  <p className="text-xs text-surface-500">اسلاید فعال</p>
                  <p className="text-sm font-semibold text-surface-900 dark:text-white">
                    {toPersianNum(activeSlide + 1)} از {toPersianNum(post.slides.length)}
                  </p>
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-[430px]">
                <CarouselRenderer
                  slide={currentSlide}
                  template={activeTemplate}
                  slideCount={post.slides.length}
                  context={{
                    post: {
                      title: post.title,
                      topic: post.topic,
                      cta: post.cta,
                      imageStyle: post.imageStyle,
                    },
                    sourceMeta: {
                      verifiedCount: verifiedSources.length,
                    },
                    themeMeta: {
                      label: CAROUSEL_TEMPLATES.find(template => template.id === activeTemplate)?.label,
                    },
                  }}
                />

                {post.slides.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveSlide(i => Math.max(0, i - 1))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-black/70 flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                      aria-label="اسلاید قبلی"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={() => setActiveSlide(i => Math.min(post.slides.length - 1, i + 1))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-black/70 flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                      aria-label="اسلاید بعدی"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-surface-500">نوار اسلایدها</p>
                  <p className="text-sm text-surface-700 dark:text-surface-300">برای جابه‌جایی و بررسی تراکم متن هر اسلاید</p>
                </div>
                <Badge>{toPersianNum(post.slides.length)} اسلاید</Badge>
              </div>

              <div ref={stripRef} className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-surface-300">
                {post.slides.map((slide, i) => (
                  <button
                    key={slide.id}
                    onClick={() => setActiveSlide(i)}
                    className={cn(
                      'flex-shrink-0 w-28 rounded-2xl border p-3 text-right transition-all',
                      i === activeSlide
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-md'
                        : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 hover:border-surface-400'
                    )}
                    title={`اسلاید ${toPersianNum(i + 1)} — ${slide.type}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg leading-none">{SLIDE_TYPE_ICONS[slide.type] ?? '📄'}</span>
                      <span className="text-[11px] text-surface-500">{toPersianNum(i + 1)}</span>
                    </div>
                    <p className="text-xs font-semibold text-surface-900 dark:text-white line-clamp-2 leading-5">
                      {slide.headline}
                    </p>
                      <p className="mt-1 text-[11px] text-surface-500 line-clamp-2 leading-5">
                        {slide.type !== 'cover' ? getSlideTypeLabel(slide.type) : ''}
                      </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-surface-700 dark:text-surface-300">
                <LayoutTemplate size={16} />
                <p className="text-sm font-semibold">قالب‌های قابل استفاده</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CAROUSEL_TEMPLATES.map(template => (
                  <button
                    key={template.id}
                    onClick={() => setActiveTemplate(template.id)}
                    className={cn(
                      'rounded-xl border px-3 py-3 text-right transition-all',
                      activeTemplate === template.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-sm'
                        : 'border-surface-200 dark:border-surface-700 hover:border-surface-400'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: template.color }} />
                      <span className="text-[11px] text-surface-500">{template.id}</span>
                    </div>
                    <p className="text-sm font-semibold text-surface-900 dark:text-white">{template.label}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleExportCarousel} className="gap-2" disabled={exportLoading}>
              {exportLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {exportLoading ? 'در حال خروجی گرفتن...' : 'Export Carousel'}
            </Button>
            {post.status === 'generated' && (
              <Button onClick={handleApprove} className="gap-2">
                <Check size={16} /> تأیید
              </Button>
            )}
            {post.status === 'approved' && (
              <Button onClick={handleSchedule} className="gap-2">
                <Calendar size={16} /> زمان‌بندی
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => editMode ? handleSaveEdits() : setEditMode(true)}
              loading={saveState === 'saving'}
              disabled={saveState === 'saving'}
              className="gap-2"
            >
              <Edit3 size={16} />
              {editMode ? 'ذخیره تغییرات' : saveState === 'saved' ? 'ذخیره شد' : 'ویرایش'}
            </Button>
          </div>
          {saveError && <p role="alert" className="text-sm text-red-600">{saveError}</p>}

          {(exportLoading || exportError || exportedSlides.length > 0) && (
            <Card>
              <CardHeader><CardTitle>خروجی کاروسل</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {exportLoading && (
                  <div className="rounded-xl border border-primary-200 bg-primary-50 dark:border-primary-900 dark:bg-primary-950/20 p-4">
                    <div className="flex items-center gap-2 text-primary-700 dark:text-primary-300 mb-2">
                      <Loader2 size={16} className="animate-spin" />
                      <span className="font-medium">در حال رندر اسلایدها در ابعاد ۱۰۸۰×۱۳۵۰</span>
                    </div>
                    <p className="text-sm text-primary-700/80 dark:text-primary-300/80">بسته به تعداد اسلایدها چند لحظه زمان می‌برد.</p>
                  </div>
                )}

                {exportError && <p className="text-sm text-red-500">{exportError}</p>}

                {exportedSlides.length > 0 && (
                  <>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-sm font-semibold text-surface-900 dark:text-white">پیش‌نمایش خروجی</p>
                        <p className="text-xs text-surface-500 mt-1">PNG با ابعاد ثابت ۱۰۸۰×۱۳۵۰ برای هر اسلاید</p>
                      </div>
                      <Button variant="outline" onClick={handleDownloadZip} className="gap-2">
                        <Images size={16} /> دانلود ZIP
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {exportedSlides.map(slide => (
                        <div key={slide.fileName} className="rounded-2xl border border-surface-200 dark:border-surface-800 p-3 space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-surface-900 dark:text-white">{slide.fileName}</p>
                              <p className="text-xs text-surface-500 mt-1">
                                {slide.type !== 'cover' ? getSlideTypeLabel(slide.type) : ''}
                              </p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => handleDownloadSlide(slide.fileName, slide.dataUrl)} className="gap-1.5">
                              <Download size={14} /> PNG
                            </Button>
                          </div>
                          <Image
                            src={slide.dataUrl}
                            alt={slide.fileName}
                            width={1080}
                            height={1350}
                            unoptimized
                            className="w-full rounded-xl border border-surface-200 dark:border-surface-700"
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>اطلاعات پست</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div>
                <label className="text-sm text-surface-500 mb-1 block">عنوان</label>
                {editMode ? (
                  <Input value={post.title} onChange={e => { setPost({ ...post, title: e.target.value }); setSaveState('idle') }} />
                ) : (
                  <p className="font-medium text-surface-900 dark:text-white leading-relaxed">{post.title}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1 gap-3">
                  <label className="text-sm text-surface-500">Hook</label>
                  <button
                    onClick={handleImproveHook}
                    disabled={hookLoading}
                    className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 disabled:opacity-50 transition-colors font-medium"
                  >
                    {hookLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    بهبود ✨
                  </button>
                </div>
                {hookError && <p className="text-xs text-red-500 mb-1">{hookError}</p>}
                {editMode ? (
                  <Textarea value={post.hook} onChange={e => { setPost({ ...post, hook: e.target.value }); setSaveState('idle') }} rows={2} />
                ) : (
                  <p className="text-surface-700 dark:text-surface-300 text-sm leading-relaxed">{post.hook}</p>
                )}
              </div>

              <div>
                <label className="text-sm text-surface-500 mb-1 block">کپشن</label>
                {editMode ? (
                  <Textarea value={post.caption} onChange={e => { setPost({ ...post, caption: e.target.value }); setSaveState('idle') }} rows={5} />
                ) : (
                  <p className="text-sm text-surface-600 dark:text-surface-400 whitespace-pre-line leading-8">{post.caption}</p>
                )}
              </div>

              <div>
                <label className="text-sm text-surface-500 mb-1 block">هشتگ‌ها</label>
                <p className="text-sm text-primary-600 dark:text-primary-400 leading-8">{post.hashtags.join(' ')}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-surface-100 dark:border-surface-800">
                <div className="rounded-xl bg-surface-50 dark:bg-surface-900 p-3">
                  <p className="text-xs text-surface-500 mb-1">موضوع</p>
                  <p className="text-sm font-medium text-surface-900 dark:text-white">{post.topic}</p>
                </div>
                <div className="rounded-xl bg-surface-50 dark:bg-surface-900 p-3">
                  <p className="text-xs text-surface-500 mb-1">سبک تصویری</p>
                  <p className="text-sm font-medium text-surface-900 dark:text-white">{post.imageStyle}</p>
                </div>
                <div className="rounded-xl bg-surface-50 dark:bg-surface-900 p-3">
                  <p className="text-xs text-surface-500 mb-1">هزینه تقریبی</p>
                  <p className="text-sm font-medium text-surface-900 dark:text-white">${post.estimatedCost.total.toFixed(4)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ویرایش اسلاید {toPersianNum(activeSlide + 1)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-50 dark:bg-surface-900 p-3">
                <div>
                  <p className="text-sm font-semibold text-surface-900 dark:text-white">{currentSlide.headline}</p>
                  <p className="text-xs text-surface-500 mt-1">
                    {currentSlide.type !== 'cover' ? getSlideTypeLabel(currentSlide.type) : ''}
                  </p>
                </div>
                <div className="text-2xl">{SLIDE_TYPE_ICONS[currentSlide.type] ?? '📄'}</div>
              </div>

              <div>
                <label className="text-xs text-surface-500 mb-1 block">تیتر</label>
                <Input
                  value={currentSlide.headline}
                  onChange={e => handleUpdateSlide(activeSlide, { headline: e.target.value })}
                  placeholder="تیتر اسلاید"
                />
              </div>

              <div>
                <label className="text-xs text-surface-500 mb-1 block">متن</label>
                <Textarea
                  value={currentSlide.body}
                  onChange={e => handleUpdateSlide(activeSlide, { body: e.target.value })}
                  placeholder="متن اسلاید"
                  rows={5}
                />
              </div>

              <div>
                <label className="text-xs text-surface-500 mb-1 block">جهت بصری</label>
                <Textarea
                  value={currentSlide.visualDirection}
                  onChange={e => handleUpdateSlide(activeSlide, { visualDirection: e.target.value })}
                  placeholder="توضیح چیدمان و حس بصری"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-xs text-surface-500 mb-1 block">پرامپت تصویر</label>
                <Textarea
                  value={currentSlide.imagePrompt}
                  onChange={e => handleUpdateSlide(activeSlide, { imagePrompt: e.target.value })}
                  placeholder="پرامپت تصویر"
                  rows={3}
                />
              </div>

              <div className="rounded-xl border border-surface-200 dark:border-surface-800 p-3 space-y-3">
                <div className="flex items-center gap-2 text-surface-700 dark:text-surface-300">
                  <ScanSearch size={16} />
                  <p className="text-sm font-semibold">بازنویسی همین اسلاید</p>
                </div>

                {!rewriteOpen ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRewriteOpen(true)
                      setRewriteError('')
                    }}
                    className="gap-2 w-full justify-center"
                  >
                    <Sparkles size={14} />
                    AI بازنویسی
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs text-surface-500 block">دستورالعمل بازنویسی</label>
                    <Input
                      value={rewriteInstruction}
                      onChange={e => setRewriteInstruction(e.target.value)}
                      placeholder="مثلاً: کوتاه‌تر کن، رسمی‌تر کن، تیتر را تیزتر کن"
                      onKeyDown={e => e.key === 'Enter' && handleRewriteSlide()}
                      autoFocus
                    />
                    {rewriteError && <p className="text-xs text-red-500">{rewriteError}</p>}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleRewriteSlide}
                        loading={rewriteLoading}
                        disabled={!rewriteInstruction.trim()}
                        className="gap-1.5 flex-1"
                      >
                        {rewriteLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                        بازنویسی
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setRewriteOpen(false)
                          setRewriteInstruction('')
                          setRewriteError('')
                        }}
                      >
                        لغو
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>منابع تحقیق</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/20 p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">منابع تأییدشده</p>
                    <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80">این بخش در اولویت نمایش قرار می‌گیرد.</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    {toPersianNum(verifiedSources.length)} مورد
                  </Badge>
                </div>

                <div className="space-y-3">
                  {verifiedSources.length > 0 ? verifiedSources.map(source => {
                    const meta = getVerificationMeta(source.verificationStatus)
                    const Icon = meta.icon
                    return (
                      <div key={source.id} className="rounded-xl bg-white/80 dark:bg-surface-950/40 border border-emerald-100 dark:border-emerald-900/60 p-3">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <p className="text-sm font-semibold text-surface-900 dark:text-white leading-6">{source.title}</p>
                            <p className="text-xs text-surface-500 mt-1">{source.publisher || 'ناشر نامشخص'}{source.date ? ` · ${source.date}` : ''}</p>
                          </div>
                          <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium', meta.className)}>
                            <Icon size={12} /> {meta.label}
                          </span>
                        </div>
                        {source.url && (
                          <a href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline">
                            مشاهده منبع
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    )
                  }) : (
                    <p className="text-sm text-surface-500">منبع تأییدشده‌ای برای این پست ثبت نشده است.</p>
                  )}
                </div>
              </div>

              {unverifiedSources.length > 0 && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-surface-900 dark:text-white">منابع مدل یا تأییدنشده</p>
                    <p className="text-xs text-surface-500 mt-1">این موارد جدا از منابع تأییدشده نمایش داده می‌شوند تا هم‌ارز تلقی نشوند.</p>
                  </div>
                  <div className="space-y-2">
                    {unverifiedSources.map(source => {
                      const meta = getVerificationMeta(source.verificationStatus)
                      const Icon = meta.icon
                      return (
                        <div key={source.id} className="rounded-xl border border-surface-200 dark:border-surface-800 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-surface-900 dark:text-white leading-6">{source.title}</p>
                              <p className="text-xs text-surface-500 mt-1">{source.publisher || 'ناشر نامشخص'}{source.date ? ` · ${source.date}` : ''}</p>
                            </div>
                            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium', meta.className)}>
                              <Icon size={12} /> {meta.label}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {post.qualityScore && (
            <Card>
              <CardHeader><CardTitle>امتیاز کیفیت</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(post.qualityScore).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-surface-600 dark:text-surface-400 shrink-0">
                      {QUALITY_SCORE_LABELS[key] ?? key}
                    </span>
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex-1 bg-surface-200 dark:bg-surface-700 rounded-full h-1.5">
                        <div className="bg-primary-500 h-1.5 rounded-full transition-all" style={{ width: `${(value as number) * 10}%` }} />
                      </div>
                      <span className="text-xs text-surface-500 w-8 text-left">{value}/۱۰</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function ArrowRight({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}
