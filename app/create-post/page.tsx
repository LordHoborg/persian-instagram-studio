export type CreatePostMode = 'auto' | 'topic' | 'idea' | 'inspiration'

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
  const [mode, setMode] = useState<CreatePostMode>('topic')
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

  const getModeDescription = (mode: CreatePostMode) => {
    switch (mode) {
      case 'auto':
        return {
          title: 'ساخت خودکار پست',
          subtitle: 'AI بر اساس محتوای شما و اطلاعات قبلی، بهترین پست را انتخاب و تولید می‌کند',
          iconColor: 'text-purple-600',
          bgColor: 'bg-purple-50 dark:bg-purple-950/20',
          borderColor: 'border-purple-200 dark:border-purple-800',
        }
      case 'topic':
        return {
          title: 'تولید پست با موضوع خاص',
          subtitle: 'شما موضوع پست را مشخص کنید و اجازه دهید AI آن را توسعه دهد',
          iconColor: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-950/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
        }
      case 'idea':
        return {
          title: 'توسعه ایده ناقص',
          subtitle: 'ایده‌های اولیه خود را وارد کنید، AI آن‌ها را کامل و غنی می‌کند',
          iconColor: 'text-amber-600',
          bgColor: 'bg-amber-50 dark:bg-amber-950/20',
          borderColor: 'border-amber-200 dark:border-amber-800',
        }
      case 'inspiration':
        return {
          title: 'الهام و منبع',
          subtitle: 'متن، لینک یا منبع الهام خود را وارد کنید',
          iconColor: 'text-emerald-600',
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
          borderColor: 'border-emerald-200 dark:border-emerald-800',
        }
      default:
        return {
          title: 'ساخت پست',
          subtitle: '',
          iconColor: 'text-surface-600',
          bgColor: 'bg-surface-50 dark:bg-surface-900',
          borderColor: 'border-surface-200 dark:border-surface-800',
        }
    }
  }

  const modeInfo = getModeDescription(mode)
  const isInputRequired = mode !== 'auto' && !input.trim()

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-surface-900 dark:text-white">ساخت پست جدید</h1>
        <p className="text-surface-600 dark:text-surface-400">پنچ روش برای تولید محتوای هوشمند انتخاب کنید</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { id: 'auto', label: 'خودکار', icon: Wand2, desc: 'AI بر اساس محتوای شما و اطلاعات قبلی، بهترین پست را بسازد', placeholder: 'مثلاً: "برنامه‌های بازنویسی شورای انقلاب" (اتوماتیک، بدون نیاز به ورودی)' },
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

      <Card className="border-2 border-surface-200 dark:border-surface-800">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${modeInfo.bgColor} ${modeInfo.borderColor} border`}>                <Sparkles size={20} className={modeInfo.iconColor} />
            </div>
            <div>
              <CardTitle className="text-xl">{modeInfo.title}</CardTitle>
              <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">{modeInfo.subtitle}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {mode === 'auto' ? (
            <div className="p-6 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center shrink-0 mt-1">
                  <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m-4 0H8v4h1m1-4h.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">AI بر اساس مغز محتوای شما تولید می‌کند</h4>
                  <p className="text-sm text-purple-800 dark:text-purple-400 leading-relaxed">
                    AI بر اساس پروفایل برند، ستون‌های محتوایی و یادگیری‌های قبلی، بهترین پست را برای شما انتخاب و تولید می‌کند. این روش کاملاً خودکار است.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Textarea
                  placeholder={mode === 'topic' ? 'مثلاً: تهران در دوره قاجار' : mode === 'idea' ? 'ایده خود را بنویسید...' : 'متن، URL یا یادداشت خود را اینجا بگذارید...'}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={mode === 'inspiration' ? 5 : 4}
                  className="text-base leading-relaxed pr-12"
                />
                <div className="absolute left-3 bottom-3 text-surface-400 pointer-events-none">
                  {mode === 'topic' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 5 1.253m0-13V20m0 4.477c1.163-.31 2.618-.89 4-1.253m0-13V6.253v13C18.168 18.477 18.754 18 19.5 18s2.332.477 5 1.253m0-13V20m0 4.477c-1.163-.31-2.618-.89-4-1.253"></path>
                    </svg>
                  )}
                  {mode === 'idea' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 4.81a6 6 0 106.732 9.183L20 21l3-3-9.183-9.183a6 6 0 10-8.466 8.466L5 18l3-3 9.183-9.183z"></path>
                    </svg>
                  )}
                  {mode === 'inspiration' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.18a1 1 0 00-1.414-.404l-3.828 3.828a3 3 0 00-.707 1.07L8 14l5 5 1.414-1.414a3 3 0 00-.707-1.07l-3.828-3.828a1 1 0 00-.404-1.414z"></path>
                    </svg>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-surface-700 dark:text-surface-300">قالب محتوا:</label>
                  <Select
                    options={[
                      { value: 'carousel', label: 'کاروسل (توصیف جدولی)' },
                      { value: 'single', label: 'تک تصویر (مستقل)' },
                      { value: 'quote', label: 'نقل قول (متن بینوایی)' },
                      { value: 'story', label: 'استوری (روایت)' },
                      { value: 'reel', label: 'ریل (ویدئو)' },
                    ]}
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="w-36"
                  />
                </div>

                <div className="text-xs text-surface-500 dark:text-surface-400 bg-surface-50 dark:bg-surface-900 px-3 py-1 rounded-full">
                  {mode === 'topic' && 'موضوع خاص'}
                  {mode === 'idea' && 'ایده ناقص'}
                  {mode === 'inspiration' && 'الهام و منبع'}
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-surface-200 dark:border-surface-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isInputRequired ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                <span className={`text-sm ${isInputRequired ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{isInputRequired
                    ? 'ورودی مورد نیاز است'
                    : mode === 'auto'
                    ? 'آماده برای تولید'
                    : 'ورودی آماده است'}</span>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleGenerateIdeas}
                  loading={loading}
                  variant="outline"
                  className="gap-2 px-6"
                  disabled={loading}
                >
                  <Lightbulb size={18} className="text-amber-600" />
                  <span className="font-medium">ایده بده</span>
                </Button>
                <Button
                  onClick={handleGenerate}
                  loading={loading}
                  className="gap-2 px-8 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={loading || isInputRequired}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 ml-1" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 4 0 9.373 0 12h4zm2 6L21 5l-4 4H6v2h12l-3 3-1-1 4 4-1-1-3-3z"></path>
                      </svg>
                      در حال تولید...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      تولید پست
                    </>
                  )}
                </Button>
              </div>
            </div>

            {mode !== 'auto' && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m-4 0H8v4h1m1-4h.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-1">آیا مطمئن هستید؟</p>
                    <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                      حالت {mode === 'topic' ? 'موضوع خاص' : mode === 'idea' ? 'ایده ناقص' : 'الهام و منبع'} پست را انتخاب کرده‌اید. AI این ورودی را با مغز محتوای شما ترکیب و پستی غنی تولید می‌کند.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {ideas.length > 0 && (
        <Card className="border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                <Lightbulb size={20} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle>ایده‌های پیشنهادی (زیر ۵ ایده)</CardTitle>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">برای هر ایده کلیک کنید تا به عنوان موضوع مورد نظر شما انتخاب شود</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ideas.slice(0, 5).map((idea, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(idea); setMode('topic') }}
                  className="text-right p-4 rounded-xl bg-white dark:bg-surface-950/50 border border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-amber-200 dark:group-hover:bg-amber-800 transition-colors">
                      <span className="text-sm font-bold text-amber-700 dark:text-amber-300">{i + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-surface-800 dark:text-surface-200 leading-relaxed group-hover:text-amber-900 dark:group-hover:text-amber-200 transition-colors">
                        {idea}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-amber-400 group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5-5 5M6 17h12"></path>
                    </svg>
                  </div>
                </button>
              ))}
            </div>
            {ideas.length > 5 && (
              <div className="mt-4 text-center">
                <p className="text-xs text-amber-600 dark:text-amber-500">و {ideas.length - 5} ایده دیگر ...</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}