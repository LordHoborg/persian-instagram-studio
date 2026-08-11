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

  useEffect(() => {
    Promise.all([getIntegrationStatus(), getBudget(), getAutomationSettings()]).then(
      ([i, b, a]) => { setIntegration(i); setBudget(b); setAutomation(a) }
    )
  }, [])

  const handleSave = async () => {
    if (budget) await updateBudget(budget)
    if (automation) await updateAutomationSettings(automation)
    alert('تنظیمات ذخیره شد')
  }

  if (!integration || !budget || !automation) return <div className="text-center py-20">در حال بارگذاری...</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
          <Settings size={24} className="text-surface-600" />
          تنظیمات
        </h1>
        <Button onClick={handleSave}>ذخیره</Button>
      </div>

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
                <p className="text-xs text-surface-500">GPT-4o, DALL-E 3</p>
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
            <Input type="number" value={budget.dailyBudget} onChange={(e) => setBudget({ ...budget, dailyBudget: parseFloat(e.target.value) })} />
          </div>
          <div>
            <label className="text-sm text-surface-500 mb-1 block">بودجه ماهانه ($)</label>
            <Input type="number" value={budget.monthlyBudget} onChange={(e) => setBudget({ ...budget, monthlyBudget: parseFloat(e.target.value) })} />
          </div>
          <div>
            <label className="text-sm text-surface-500 mb-1 block">حد تصویر در ماه</label>
            <Input type="number" value={budget.imageGenerationLimit} onChange={(e) => setBudget({ ...budget, imageGenerationLimit: parseInt(e.target.value) })} />
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
                onChange={(e) => setAutomation({ ...automation, [item.key]: e.target.checked })}
                className="w-5 h-5 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
