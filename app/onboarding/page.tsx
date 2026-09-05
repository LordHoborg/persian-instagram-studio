'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setOnboardingComplete, updateBrandProfile } from '@/lib/db'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'

type OnboardingAnswers = {
  pageTopic: string
  targetAudience: string
  preferredTopics: string
  writingStyle: string
  avoidedTopics: string
  visualStyle: string
  goal: string
}

const steps: Array<{ field: keyof OnboardingAnswers; label: string; placeholder: string }> = [
  { field: 'pageTopic', label: 'پیج شما درباره چیست؟', placeholder: 'مثلاً تاریخ و فرهنگ ایران' },
  { field: 'targetAudience', label: 'مخاطب اصلی شما کیست؟', placeholder: 'مثلاً جوانان ۱۸ تا ۳۵ سال' },
  { field: 'preferredTopics', label: 'چه موضوعاتی را بیشتر دوست دارید؟', placeholder: 'تاریخ، علم، فرهنگ...' },
  { field: 'writingStyle', label: 'چه لحن نوشتاری می‌خواهید؟', placeholder: 'محاوره‌ای، رسمی، طناز...' },
  { field: 'avoidedTopics', label: 'چه چیزهایی نباید در محتوا باشد؟', placeholder: 'سیاست روز، مباحث جنجالی...' },
  { field: 'visualStyle', label: 'چه سبک تصویری را ترجیح می‌دهید؟', placeholder: 'مینیمال، کلاسیک، مدرن...' },
  { field: 'goal', label: 'هدفتان از این پیج چیست؟', placeholder: 'آموزش، سرگرمی، برند شخصی...' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<OnboardingAnswers>({
    pageTopic: '',
    targetAudience: '',
    preferredTopics: '',
    writingStyle: '',
    avoidedTopics: '',
    visualStyle: '',
    goal: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleNext = () => {
    if (step < steps.length - 1) setStep(step + 1)
    else handleComplete()
  }

  const handleComplete = async () => {
    if (submitting) return
    setSubmitting(true)
    setError('')
    try {
      await updateBrandProfile({
        pageTopic: answers.pageTopic,
        targetAudience: answers.targetAudience,
        writingStyle: answers.writingStyle,
        visualStyle: answers.visualStyle,
        preferredTopics: answers.preferredTopics.split(/[،,]/).map(s => s.trim()).filter(Boolean),
        avoidedTopics: answers.avoidedTopics.split(/[،,]/).map(s => s.trim()).filter(Boolean),
        customInstructions: answers.goal,
      })
      await setOnboardingComplete(true)
      router.push('/')
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'ذخیره اطلاعات ناموفق بود')
      setSubmitting(false)
    }
  }

  const current = steps[step]

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface-50 dark:bg-surface-950">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-primary-500' : 'bg-surface-200'}`} />
            ))}
          </div>
          <CardTitle>خوش آمدید</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-surface-500">مرحله {step + 1} از {steps.length}</p>
          <div>
            <label className="text-sm font-medium text-surface-900 dark:text-white mb-2 block">{current.label}</label>
            <Textarea value={answers[current.field]} onChange={(e) => setAnswers({ ...answers, [current.field]: e.target.value })} placeholder={current.placeholder} rows={3} />
          </div>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            {step > 0 && <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">قبلی</Button>}
            <Button onClick={handleNext} loading={submitting} disabled={submitting} className="flex-1">{step === steps.length - 1 ? 'شروع کنید' : 'بعدی'}</Button>
          </div>
          <button disabled={submitting} onClick={handleComplete} className="w-full text-center text-sm text-surface-400 hover:text-surface-600 pt-2 disabled:opacity-50">فعلاً رد کردن راه‌اندازی اولیه</button>
        </CardContent>
      </Card>
    </div>
  )
}
