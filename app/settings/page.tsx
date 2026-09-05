'use client'

import { useEffect, useState } from 'react'
import { getIntegrationStatus, getBudget, getAutomationSettings, updateAutomationSettings, updateBudget } from '@/lib/db'
import { IntegrationStatus, CostBudget, AutomationSettings } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Settings, Instagram, Key, DollarSign, Bot } from 'lucide-react'

export default function SettingsPage() {
  const [integration, setIntegration] = useState<IntegrationStatus | null>(null)
  const [budget, setBudget] = useState<CostBudget | null>(null)
  const [automation, setAutomation] = useState<AutomationSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    Promise.all([getIntegrationStatus(), getBudget(), getAutomationSettings()])
      .then(([i, b, a]) => { setIntegration(i); setBudget(b); setAutomation(a) })
      .catch(reason => setLoadError(reason instanceof Error ? reason.message : 'بارگذاری تنظیمات ناموفق بود'))
  }, [])

  const handleSave = async () => {
    if (!budget || !automation || saving) return
    setSaving(true)
    setMessage(null)
    try {
      await Promise.all([updateBudget(budget), updateAutomationSettings(automation)])
      setMessage({ kind: 'success', text: 'تنظیمات ذخیره شد.' })
    } catch (reason: unknown) {
      setMessage({ kind: 'error', text: reason instanceof Error ? reason.message : 'ذخیره تنظیمات ناموفق بود.' })
    } finally {
      setSaving(false)
    }
  }

  if (loadError) return <p role="alert" className="mx-auto max-w-3xl rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</p>
  if (!integration || !budget || !automation) return <div className="text-center py-20">در حال بارگذاری...</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
          <Settings size={24} className="text-surface-600" />
          تنظیمات
        </h1>
        <Button onClick={handleSave} loading={saving} disabled={saving}>ذخیره</Button>
      </div>

      {message && (
        <p role="status" className={`rounded-lg px-4 py-3 text-sm ${message.kind === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key size={18} className="text-primary-600" />
            اتصال API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">AI</div>
              <div>
                <p className="text-sm font-medium">OpenAI</p>
                <p className="text-xs text-surface-500">GPT-5.6 و GPT Image</p>
              </div>
            </div>
            <Badge variant={integration.openai.configured ? 'success' : 'warning'}>
              {integration.openai.configured ? 'متصل' : 'متصل نیست'}
            </Badge>
          </div>
          <p className="text-xs text-surface-400">
            کلید API در فایل .env تنظیم شود. در حالت فعلی از Mock Provider استفاده می‌شود.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram size={18} className="text-pink-600" />
            اینستاگرام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50">
            <div className="flex items-center gap-3">
              <Instagram size={20} className="text-pink-600" />
              <div>
                <p className="text-sm font-medium">Instagram Graph API</p>
                <p className="text-xs text-surface-500">انتشار خودکار</p>
              </div>
            </div>
            <Badge variant={integration.instagram.connected ? 'success' : 'warning'}>
              {integration.instagram.connected ? 'متصل' : 'متصل نیست'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign size={18} className="text-emerald-600" />
            بودجه AI
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-surface-500 mb-1 block">بودجه روزانه ($)</label>
            <Input type="number" min={0} step="0.1" value={budget.dailyBudget} onChange={(e) => setBudget({ ...budget, dailyBudget: Number(e.target.value) })} />
          </div>
          <div>
            <label className="text-sm text-surface-500 mb-1 block">بودجه ماهانه ($)</label>
            <Input type="number" min={0} step="1" value={budget.monthlyBudget} onChange={(e) => setBudget({ ...budget, monthlyBudget: Number(e.target.value) })} />
          </div>
          <div>
            <label className="text-sm text-surface-500 mb-1 block">حد تصویر در ماه</label>
            <Input type="number" min={0} step="1" value={budget.imageGenerationLimit} onChange={(e) => setBudget({ ...budget, imageGenerationLimit: Number(e.target.value) })} />
          </div>
          <div>
            <label className="text-sm text-surface-500 mb-1 block">حداکثر تلاش مجدد</label>
            <Input type="number" min={0} max={10} step="1" value={budget.maxRetries} onChange={(e) => setBudget({ ...budget, maxRetries: Number(e.target.value) })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot size={18} className="text-purple-600" />
            اتوماسیون
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-surface-500 mb-1 block">ساعت پیشنهادی انتشار</label>
              <Input type="number" min={0} max={23} value={automation.suggestedHour} onChange={(e) => setAutomation({ ...automation, suggestedHour: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-sm text-surface-500 mb-1 block">تعداد پست روزانه</label>
              <Input type="number" min={1} max={10} value={automation.postsPerDay} onChange={(e) => setAutomation({ ...automation, postsPerDay: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <p className="text-sm text-surface-500 mb-2">روزهای انتشار</p>
            <div className="flex flex-wrap gap-2">
              {['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'].map(day => (
                <button
                  type="button"
                  key={day}
                  onClick={() => setAutomation({
                    ...automation,
                    publishDays: automation.publishDays.includes(day)
                      ? automation.publishDays.filter(item => item !== day)
                      : [...automation.publishDays, day],
                  })}
                  className={`rounded-lg px-3 py-1.5 text-sm ${automation.publishDays.includes(day) ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'bg-surface-100 text-surface-500 dark:bg-surface-800'}`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-surface-500 mb-2">فرمت‌های مجاز</p>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'carousel', label: 'کاروسل' },
                { id: 'single', label: 'تک‌تصویر' },
                { id: 'quote', label: 'نقل‌قول' },
                { id: 'reel', label: 'ریل' },
                { id: 'story', label: 'استوری' },
              ].map(format => (
                <button
                  type="button"
                  key={format.id}
                  onClick={() => setAutomation({
                    ...automation,
                    allowedFormats: automation.allowedFormats.includes(format.id)
                      ? automation.allowedFormats.filter(item => item !== format.id)
                      : [...automation.allowedFormats, format.id],
                  })}
                  className={`rounded-lg px-3 py-1.5 text-sm ${automation.allowedFormats.includes(format.id) ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'bg-surface-100 text-surface-500 dark:bg-surface-800'}`}
                >
                  {format.label}
                </button>
              ))}
            </div>
          </div>
          {[
            { key: 'autoGenerate', label: 'تولید خودکار محتوا' },
            { key: 'autoPublish', label: 'انتشار خودکار' },
            { key: 'requireApproval', label: 'نیاز به تأیید قبل از انتشار' },
          ].map((item) => (
            <label key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50 cursor-pointer">
              <span className="text-sm text-surface-700 dark:text-surface-300">{item.label}</span>
              <input
                type="checkbox"
                checked={automation[item.key as keyof AutomationSettings] as boolean}
                disabled={item.key === 'autoPublish' && !integration.instagram.connected}
                onChange={(e) => setAutomation({ ...automation, [item.key]: e.target.checked })}
                className="w-5 h-5 rounded border-surface-300 text-primary-600 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </label>
          ))}
          {!integration.instagram.connected && (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              انتشار خودکار تا زمان اتصال Instagram Graph API غیرفعال است.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
