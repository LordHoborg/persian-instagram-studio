'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getPosts } from '@/lib/db'
import { PostPackage } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { getStatusLabel, getStatusColor, getContentTypeLabel, formatDate, formatPersianNumber } from '@/lib/utils'
import { Search, Eye } from 'lucide-react'

export default function ArchivePage() {
  const [posts, setPosts] = useState<PostPackage[]>([])
  const [filter, setFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => { getPosts().then(setPosts) }, [])

  const filtered = posts.filter(p => {
    const matchesSearch = p.title.includes(filter) || p.topic.includes(filter) || p.caption.includes(filter)
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statuses = ['all', 'idea', 'draft', 'generated', 'review', 'approved', 'scheduled', 'published', 'archived']

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">آرشیو محتوا</h1>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <Input placeholder="جستجو..." value={filter} onChange={(e) => setFilter(e.target.value)} className="pr-10 w-64" />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {statuses.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              statusFilter === s ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-400'
            }`}>
            {s === 'all' ? 'همه' : getStatusLabel(s)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(post => (
          <Card key={post.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Badge className={getStatusColor(post.status)}>{getStatusLabel(post.status)}</Badge>
                <span className="text-xs text-surface-400">{getContentTypeLabel(post.contentType)}</span>
              </div>
              <h3 className="font-semibold text-surface-900 dark:text-white line-clamp-2">{post.title}</h3>
              <p className="text-sm text-surface-500 line-clamp-2">{post.hook}</p>
              <div className="flex items-center justify-between text-xs text-surface-400 pt-2 border-t border-surface-100 dark:border-surface-800">
                <span>{post.contentPillar}</span>
                <span>{formatDate(post.createdAt)}</span>
              </div>
              <Link href={`/post/${post.id}`}>
                <button className="w-full mt-2 py-2 rounded-lg border border-surface-200 dark:border-surface-700 text-sm text-surface-600 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors flex items-center justify-center gap-2">
                  <Eye size={14} /> مشاهده
                </button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && <p className="text-center py-20 text-surface-400">پستی یافت نشد</p>}
    </div>
  )
}
