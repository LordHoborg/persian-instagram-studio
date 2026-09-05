'use client'

import { useEffect, useState } from 'react'
import { getBrandProfile, getPillars, updateBrandProfile, updatePillars } from '@/lib/db'
import { BrandProfile, ContentPillar } from '@/types'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Brain, Plus, GripVertical } from 'lucide-react'

export default function ContentBrainPage() {
  const [profile, setProfile] = useState<BrandProfile | null>(null)
  const [pillars, setPillars] = useState<ContentPillar[]>([])
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [p, pl] = await Promise.all([getBrandProfile(), getPillars()])
        setProfile(p)
        setPillars(pl)
      } catch (reason: unknown) {
        setError(reason instanceof Error ? reason.message : 'بارگذاری مغز محتوا ناموفق بود')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    if (!profile || saving) return
    setSaving(true)
    setError('')
    try {
      await updateBrandProfile(profile)
      await updatePillars(pillars)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'ذخیره مغز محتوا ناموفق بود')
    } finally {
      setSaving(false)
    }
  }

  const updatePillar = (id: string, updates: Partial<ContentPillar>) => {
    setPillars(pillars.map(p => p.id === id ? { ...p, ...updates } : p))
  }

  const addPillar = () => {
    const newPillar: ContentPillar = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'ستون جدید',
      description: '',
      weight: 10,
      enabled: true,
      color: '#6366f1',
    }
    setPillars([...pillars, newPillar])
  }

  if (loading) return <div className="text-center py-20 text-surface-500">در حال بارگذاری...</div>
  if (!profile) return <p role="alert" className="mx-auto max-w-4xl rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error || 'پروفایل محتوا در دسترس نیست'}</p>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <Brain size={24} className="text-primary-600" />
            مغز محتوا
          </h1>
          <p className="text-surface-500 mt-1">ترجیحات و شخصیت محتوایی شما</p>
        </div>
        <Button onClick={handleSave} loading={saving} disabled={saving}>{saved ? 'ذخیره شد!' : 'ذخیره تغییرات'}</Button>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <Card>
        <CardHeader><CardTitle>پروفایل برند</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-surface-500 mb-1 block">پیج درباره چیست؟</label>
            <Input value={profile.pageTopic} onChange={(e) => setProfile({ ...profile, pageTopic: e.target.value })} />
          </div>
          <div>
            <label className="text-sm text-surface-500 mb-1 block">مخاطب اصلی</label>
            <Input value={profile.targetAudience} onChange={(e) => setProfile({ ...profile, targetAudience: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-surface-500 mb-1 block">سبک نگارش</label>
            <Textarea value={profile.writingStyle} onChange={(e) => setProfile({ ...profile, writingStyle: e.target.value })} rows={2} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-surface-500 mb-1 block">سبک بصری</label>
            <Input value={profile.visualStyle} onChange={(e) => setProfile({ ...profile, visualStyle: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-surface-500 mb-1 block">قوانین زبان فارسی</label>
            <Textarea value={profile.persianLanguageRules} onChange={(e) => setProfile({ ...profile, persianLanguageRules: e.target.value })} rows={2} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-surface-500 mb-1 block">دستورالعمل‌های شخصی</label>
            <Textarea value={profile.customInstructions} onChange={(e) => setProfile({ ...profile, customInstructions: e.target.value })} rows={4} placeholder="هر دستورالعمل خاصی که می‌خواهید AI رعایت کند..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>ستون‌های محتوا</CardTitle>
          <Button size="sm" variant="outline" onClick={addPillar} className="gap-1">
            <Plus size={14} /> افزودن
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {pillars.map((pillar) => (
            <div key={pillar.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50">
              <GripVertical size={16} className="text-surface-400 shrink-0" />
              <input type="color" value={pillar.color} onChange={(e) => updatePillar(pillar.id, { color: e.target.value })} className="w-8 h-8 rounded cursor-pointer shrink-0" />
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input value={pillar.name} onChange={(e) => updatePillar(pillar.id, { name: e.target.value })} className="text-sm" />
                <Input value={pillar.description} onChange={(e) => updatePillar(pillar.id, { description: e.target.value })} placeholder="توضیح" className="text-sm" />
                <div className="flex items-center gap-2">
                  <input type="range" min={0} max={100} value={pillar.weight} onChange={(e) => updatePillar(pillar.id, { weight: parseInt(e.target.value) })} className="flex-1" />
                  <span className="text-xs text-surface-500 w-8">{pillar.weight}%</span>
                </div>
              </div>
              <button onClick={() => updatePillar(pillar.id, { enabled: !pillar.enabled })}
                className={`px-2 py-1 rounded text-xs font-medium ${pillar.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-200 text-surface-500'}`}>
                {pillar.enabled ? 'فعال' : 'غیرفعال'}
              </button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
