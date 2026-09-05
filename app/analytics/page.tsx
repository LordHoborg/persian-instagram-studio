'use client'

import { useEffect, useState } from 'react'
import { getPosts } from '@/lib/db'
import { PostPackage } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatPersianNumber } from '@/lib/utils'
import { BarChart3, Eye, Heart, MessageCircle, Share2, Bookmark } from 'lucide-react'

export default function AnalyticsPage() {
  const [posts, setPosts] = useState<PostPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getPosts()
      .then(setPosts)
      .catch(reason => setError(reason instanceof Error ? reason.message : 'بارگذاری گزارش ناموفق بود'))
      .finally(() => setLoading(false))
  }, [])

  const published = posts.filter(p => p.status === 'published' && p.performanceMetrics)

  const totals = published.reduce((acc, p) => ({
    views: acc.views + (p.performanceMetrics?.views || 0),
    likes: acc.likes + (p.performanceMetrics?.likes || 0),
    comments: acc.comments + (p.performanceMetrics?.comments || 0),
    shares: acc.shares + (p.performanceMetrics?.shares || 0),
    saves: acc.saves + (p.performanceMetrics?.saves || 0),
  }), { views: 0, likes: 0, comments: 0, shares: 0, saves: 0 })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
        <BarChart3 size={24} className="text-primary-600" />
        آنالیز عملکرد
      </h1>

      {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {loading && <p role="status" className="text-center py-12 text-surface-500">در حال بارگذاری گزارش...</p>}

      {!loading && <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'بازدید', value: totals.views, icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'لایک', value: totals.likes, icon: Heart, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'کامنت', value: totals.comments, icon: MessageCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'اشتراک', value: totals.shares, icon: Share2, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'سیو', value: totals.saves, icon: Bookmark, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon size={18} className={stat.color} />
              </div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">{formatPersianNumber(stat.value)}</p>
              <p className="text-xs text-surface-500 mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>}

      {!loading && <Card>
        <CardHeader><CardTitle>پست‌های منتشر شده</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {published.map(post => (
              <div key={post.id} className="flex items-center gap-4 p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50">
                <div className="flex-1">
                  <p className="font-medium text-surface-900 dark:text-white text-sm">{post.title}</p>
                  <p className="text-xs text-surface-500 mt-0.5">{post.contentPillar}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-surface-600"><Eye size={14} /> {formatPersianNumber(post.performanceMetrics?.views || 0)}</span>
                  <span className="flex items-center gap-1 text-surface-600"><Heart size={14} /> {formatPersianNumber(post.performanceMetrics?.likes || 0)}</span>
                  <span className="flex items-center gap-1 text-surface-600"><Bookmark size={14} /> {formatPersianNumber(post.performanceMetrics?.saves || 0)}</span>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{post.performanceMetrics?.engagementRate || 0}%</span>
                </div>
              </div>
            ))}
            {published.length === 0 && <p className="text-center text-surface-400 py-8">هنوز پست منتشر شده‌ای با داده عملکرد وجود ندارد</p>}
          </div>
        </CardContent>
      </Card>}
    </div>
  )
}
