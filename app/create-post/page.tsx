'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { generatePost, generateIdeas } from '@/lib/aiService'
import { createPost } from '@/lib/db'
import { PostPackage } from '@/types'
import { Sparkles, Wand2, Lightbulb, Type, Link2 } from 'lucide-react'

export default function CreatePostPage() {
  const [mode, setMode] = useState<'auto' | 'topic' | 'idea' | 'inspiration'>('topic')
  const [input, setInput] = useState('')
  const [contentType, setContentType] = useState('carousel')
  const [loading, setLoading] = useState(false)
  const [ideas, setIdeas] = useState<string[]>([])
  const [generatedPost, setGeneratedPost] = useState<PostPackage | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const topic = mode === 'auto' ? 'یک موضوع جذاب از تاریخ ایران' : input
      const result = await generatePost(topic, contentType)
      setGeneratedPost(result.post)
      await createPost(result.post)
    } catch (e) {
      alert('خطا در تولید پست')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateIdeas = async () => {
    setLoading(true)
    try {
      const result = await generateIdeas()
      setIdeas(result.ideas)
    } catch (e) {
      alert('خطا در تولید ایده')
    } finally {
      setLoading(false)
    }
  }

  if (generatedPost) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">پیش‌نمایش پست</h1>
          <Link href={`/post/${generatedPost.id}`}>
            <Button>ادیت و بررسی نهایی</Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Badge>{generatedPost.contentPillar}</Badge>
              <Badge variant="info">{generatedPost.contentType}</Badge>
            </div>
            <h2 className="text-xl font-bold">{generatedPost.title}</h2>
            <p className="text-surface-600 dark:text-surface-400">{generatedPost.hook}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {generatedPost.slides.map((slide, i) => (
                <div key={i} className="aspect-[4/5] bg-surface-100 dark:bg-surface-800 rounded-lg p-3 flex flex-col justify-center text-center">
                  <span className="text-xs text-surface-400 mb-1">اسلاید {i + 1}</span>
                  <p className="text-sm font-medium line-clamp-3">{slide.headline}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
              <p className="text-sm text-surface-500">هزینه تقریبی: ${generatedPost.estimatedCost.total.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-surface-900 dark:text-white">ساخت پست جدید</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          { id: 'auto', label: 'خودکار', icon: Wand2, desc: 'خودت یک موضوع خوب انتخاب کن' },
          { id: 'topic', label: 'موضوع', icon: Type, desc: 'موضوع مشخص وارد کن' },
          { id: 'idea', label: 'ایده خام', icon: Lightbulb, desc: 'ایده ناقص بده، AI کاملش کند' },
          { id: 'inspiration', label: 'الهام', icon: Link2, desc: 'متن یا لینک بده' },
        ] as const).map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`p-4 rounded-xl border text-right transition-all ${
              mode === m.id
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-surface-200 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800'
            }`}
          >
            <m.icon size={20} className={mode === m.id ? 'text-primary-600' : 'text-surface-400'} />
            <p className="font-medium mt-2 text-surface-900 dark:text-white">{m.label}</p>
            <p className="text-xs text-surface-500 mt-1">{m.desc}</p>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ورودی محتوا</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === 'auto' && (
            <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <p className="text-sm text-primary-800 dark:text-primary-300">
                AI بر اساس مغز محتوا و پست‌های قبلی، بهترین موضوع را انتخاب و تولید می‌کند.
              </p>
            </div>
          )}

          {mode !== 'auto' && (
            <Textarea
              placeholder={
                mode === 'topic'
                  ? 'مثلاً: تهران در دوره قاجار'
                  : mode === 'idea'
                  ? 'ایده خود را بنویسید...'
                  : 'متن، URL یا یادداشت خود را اینجا بگذارید...'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={4}
            />
          )}

          <div className="flex items-center gap-4">
            <div className="w-40">
              <label className="text-sm text-surface-500 mb-1 block">فرمت</label>
              <Select
                options={[
                  { value: 'carousel', label: 'کاروسل' },
                  { value: 'single', label: 'تک تصویر' },
                  { value: 'quote', label: 'نقل قول' },
                  { value: 'story', label: 'استوری' },
                  { value: 'reel', label: 'ریل' },
                ]}
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleGenerate} loading={loading} className="gap-2">
              <Sparkles size={18} />
              تولید پست
            </Button>
            <Button variant="outline" onClick={handleGenerateIdeas} loading={loading}>
              <Lightbulb size={18} className="ml-1" />
              ایده بده
            </Button>
          </div>
        </CardContent>
      </Card>

      {ideas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>ایده‌های پیشنهادی</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ideas.map((idea, i) => (
              <button
                key={i}
                onClick={() => { setInput(idea); setMode('topic') }}
                className="w-full text-right p-3 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors flex items-center gap-3"
              >
                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm text-surface-700 dark:text-surface-300">{idea}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
