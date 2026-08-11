'use client'

import { useEffect, useState } from 'react'
import { getPosts } from '@/lib/db'
import { PostPackage } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { getStatusLabel, getStatusColor, formatPersianNumber } from '@/lib/utils'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'

export default function CalendarPage() {
  const [posts, setPosts] = useState<PostPackage[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => { getPosts().then(setPosts) }, [])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()

  const monthNames = ['ژانویه', 'فوریه', 'مارس', 'آوریل', 'می', 'ژوئن', 'ژوئیه', 'آگوست', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر']

  const getPostsForDay = (day: number) => {
    const dateStr = new Date(year, month, day).toDateString()
    return posts.filter(p => {
      const d = p.scheduledAt ? new Date(p.scheduledAt).toDateString() : new Date(p.createdAt).toDateString()
      return d === dateStr
    })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
          <CalendarDays size={24} className="text-primary-600" />
          تقویم محتوا
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800">
            <ChevronRight size={20} />
          </button>
          <span className="font-medium min-w-[120px] text-center">{monthNames[month]} {formatPersianNumber(year)}</span>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800">
            <ChevronLeft size={20} />
          </button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'].map(d => (
              <div key={d} className="text-xs font-medium text-surface-500 py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dayPosts = getPostsForDay(day)
              return (
                <div key={day} className={`aspect-square rounded-lg border border-surface-100 dark:border-surface-800 p-1.5 flex flex-col gap-1 transition-colors hover:bg-surface-50 dark:hover:bg-surface-800/50 ${
                  new Date().toDateString() === new Date(year, month, day).toDateString() ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200' : ''
                }`}>
                  <span className="text-xs font-medium text-surface-600 dark:text-surface-400">{formatPersianNumber(day)}</span>
                  <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
                    {dayPosts.slice(0, 2).map(post => (
                      <Link key={post.id} href={`/post/${post.id}`}>
                        <div className={`text-[10px] truncate px-1 py-0.5 rounded ${getStatusColor(post.status)}`} title={post.title}>
                          {post.title}
                        </div>
                      </Link>
                    ))}
                    {dayPosts.length > 2 && <span className="text-[10px] text-surface-400">+{formatPersianNumber(dayPosts.length - 2)}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
