'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getPostById, updatePost } from '@/lib/db'
import { PostPackage, PostSlide } from '@/types'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Textarea } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
import { CarouselRenderer } from '@/components/carousel/CarouselRenderer'
import { getStatusLabel, getStatusColor, getContentTypeLabel } from '@/lib/utils'
import { ArrowLeft, Check, Calendar, RotateCcw, ChevronRight, ChevronLeft } from 'lucide-react'

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [post, setPost] = useState<PostPackage | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSlide, setActiveSlide] = useState(0)
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    const load = async () => {
      const p = await getPostById(params.id as string)
      if (p) setPost(p)
      setLoading(false)
    }
    load()
  }, [params.id])

  const handleUpdate = async (updates: Partial<PostPackage>) => {
    if (!post) return
    const updated = await updatePost(post.id, updates)
    if (updated) setPost(updated)
  }

  const handleUpdateSlide = (index: number, updates: Partial<PostSlide>) => {
    if (!post) return
    const newSlides = [...post.slides]
    newSlides[index] = { ...newSlides[index], ...updates }
    handleUpdate({ slides: newSlides })
  }

  const handleApprove = () => handleUpdate({ status: 'approved' })
  const handleSchedule = () => handleUpdate({ status: 'scheduled', scheduledAt: new Date(Date.now() + 86400000).toISOString() })

  if (loading) return <div className="text-center py-20 text-surface-500">در حال بارگذاری...</div>
  if (!post) return <div className="text-center py-20 text-surface-500">پست یافت نشد</div>

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-surface-500 hover:text-surface-800">
          <ArrowLeft size={18} />
          بازگشت
        </button>
        <div className="flex items-center gap-3">
          <Badge className={getStatusColor(post.status)}>{getStatusLabel(post.status)}</Badge>
          <Badge variant="info">{getContentTypeLabel(post.contentType)}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <div className="relative">
                <CarouselRenderer slide={post.slides[activeSlide]} template={post.imageStyle} />
                {post.slides.length > 1 && (
                  <>
                    <button onClick={() => setActiveSlide(Math.max(0, activeSlide - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 dark:bg-black/70 flex items-center justify-center shadow">
                      <ChevronLeft size={16} />
                    </button>
                    <button onClick={() => setActiveSlide(Math.min(post.slides.length - 1, activeSlide + 1))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 dark:bg-black/70 flex items-center justify-center shadow">
                      <ChevronRight size={16} />
                    </button>
                  </>
                )}
              </div>
              <div className="flex justify-center gap-1.5 mt-3">
                {post.slides.map((_, i) => (
                  <button key={i} onClick={() => setActiveSlide(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${i === activeSlide ? 'bg-primary-500' : 'bg-surface-300'}`} />
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 flex-wrap">
            {post.status === 'generated' && (
              <Button onClick={handleApprove} className="gap-2"><Check size={16} /> تأیید</Button>
            )}
            {post.status === 'approved' && (
              <Button onClick={handleSchedule} className="gap-2"><Calendar size={16} /> زمان‌بندی</Button>
            )}
            <Button variant="outline" onClick={() => setEditMode(!editMode)}>
              <RotateCcw size={16} className="ml-1" />
              {editMode ? 'پایان ویرایش' : 'ویرایش'}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>اطلاعات پست</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-surface-500 mb-1 block">عنوان</label>
                {editMode ? (
                  <Input value={post.title} onChange={(e) => handleUpdate({ title: e.target.value })} />
                ) : (
                  <p className="font-medium text-surface-900 dark:text-white">{post.title}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-surface-500 mb-1 block">Hook</label>
                {editMode ? (
                  <Textarea value={post.hook} onChange={(e) => handleUpdate({ hook: e.target.value })} rows={2} />
                ) : (
                  <p className="text-surface-700 dark:text-surface-300">{post.hook}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-surface-500 mb-1 block">کپشن</label>
                {editMode ? (
                  <Textarea value={post.caption} onChange={(e) => handleUpdate({ caption: e.target.value })} rows={4} />
                ) : (
                  <p className="text-sm text-surface-600 dark:text-surface-400 whitespace-pre-line">{post.caption}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-surface-500 mb-1 block">هشتگ‌ها</label>
                <p className="text-sm text-primary-600">{post.hashtags.join(' ')}</p>
              </div>
              <div className="pt-2 border-t border-surface-100 dark:border-surface-800">
                <p className="text-xs text-surface-400">هزینه تقریبی تولید: ${post.estimatedCost.total.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>

          {editMode && (
            <Card>
              <CardHeader><CardTitle>ویرایش اسلاید {activeSlide + 1}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input value={post.slides[activeSlide].headline}
                  onChange={(e) => handleUpdateSlide(activeSlide, { headline: e.target.value })} placeholder="تیتر اسلاید" />
                <Textarea value={post.slides[activeSlide].body}
                  onChange={(e) => handleUpdateSlide(activeSlide, { body: e.target.value })} placeholder="متن اسلاید" rows={3} />
                <Input value={post.slides[activeSlide].imagePrompt}
                  onChange={(e) => handleUpdateSlide(activeSlide, { imagePrompt: e.target.value })} placeholder="پرامپت تصویر" />
              </CardContent>
            </Card>
          )}

          {post.qualityScore && (
            <Card>
              <CardHeader><CardTitle>امتیاز کیفیت</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(post.qualityScore).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-surface-600 dark:text-surface-400">
                      {key === 'hook' && 'Hook'}
                      {key === 'clarity' && 'وضوح'}
                      {key === 'originality' && 'اصالت'}
                      {key === 'persianNaturalness' && 'روانی فارسی'}
                      {key === 'factualConfidence' && 'اعتماد به facts'}
                      {key === 'visualConsistency' && 'هماهنگی بصری'}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-surface-200 dark:bg-surface-700 rounded-full h-1.5">
                        <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${(value as number) * 10}%` }} />
                      </div>
                      <span className="text-xs text-surface-500 w-6">{value}/10</span>
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
