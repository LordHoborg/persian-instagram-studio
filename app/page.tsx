import Link from 'next/link'
import { getPosts, getPillars, getAIUsage, getPatterns } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatPersianNumber, getStatusLabel, getStatusColor, getContentTypeLabel } from '@/lib/utils'
import {
  Sparkles,
  PenTool,
  CalendarDays,
  Archive,
  TrendingUp,
  DollarSign,
  Clock,
  ArrowLeft,
  BarChart3,
  Lightbulb,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const posts = await getPosts()
  const pillars = await getPillars()
  const aiUsage = await getAIUsage()
  const patterns = await getPatterns()

  const todayPost = posts.find(p => {
    const d = new Date(p.createdAt)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  })

  const scheduledPosts = posts.filter(p => p.status === 'scheduled')
  const draftPosts = posts.filter(p => p.status === 'draft' || p.status === 'generated')
  const publishedPosts = posts.filter(p => p.status === 'published')

  const todayCost = aiUsage
    .filter(u => {
      const d = new Date(u.createdAt)
      const now = new Date()
      return d.toDateString() === now.toDateString()
    })
    .reduce((sum, u) => sum + u.totalCost, 0)

  const weekCost = aiUsage
    .filter(u => {
      const d = new Date(u.createdAt)
      const now = new Date()
      const diff = now.getTime() - d.getTime()
      return diff < 7 * 24 * 60 * 60 * 1000
    })
    .reduce((sum, u) => sum + u.totalCost, 0)

  const performancePosts = publishedPosts.filter(post => post.performanceMetrics)
  const totalEngagement = performancePosts.reduce((sum, p) => {
    return sum + (p.performanceMetrics?.engagementRate || 0)
  }, 0)
  const avgEngagement = performancePosts.length > 0 ? (totalEngagement / performancePosts.length).toFixed(1) : '0'

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">داشبورد</h1>
          <p className="text-surface-500 mt-1">{formatDate(new Date(), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <Link href="/create-post">
          <Button size="lg" className="gap-2">
            <Sparkles size={18} />
            ساخت پست امروز
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-surface-500">پست‌های امسال</p>
                <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">{formatPersianNumber(posts.length)}</p>
                <p className="text-xs text-surface-400 mt-2">{formatPersianNumber(draftPosts.length)} پیش‌نویس فعال</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                <PenTool size={20} className="text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-surface-500">منتشر شده</p>
                <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">{formatPersianNumber(publishedPosts.length)}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <CheckCircle2 size={20} className="text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-surface-500">نرخ تعامل</p>
                <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">{avgEngagement}%</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <TrendingUp size={20} className="text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-surface-500">هزینه امروز</p>
                <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">${todayCost.toFixed(2)}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <DollarSign size={20} className="text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-surface-400 mt-2">این هفته: ${weekCost.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Status + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Post */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock size={18} className="text-primary-600" />
              وضعیت امروز
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayPost ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(todayPost.status)}>{getStatusLabel(todayPost.status)}</Badge>
                  <span className="text-sm text-surface-500">{getContentTypeLabel(todayPost.contentType)}</span>
                </div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white">{todayPost.title}</h3>
                <p className="text-surface-600 dark:text-surface-400 text-sm line-clamp-2">{todayPost.hook}</p>
                <div className="flex gap-2">
                  <Link href={`/post/${todayPost.id}`}>
                    <Button variant="outline" size="sm">مشاهده</Button>
                  </Link>
                  <Link href={`/post/${todayPost.id}?edit=true`}>
                    <Button size="sm">ویرایش</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={28} className="text-surface-400" />
                </div>
                <p className="text-surface-500 mb-4">امروز هنوز پستی نساخته‌اید</p>
                <Link href="/create-post">
                  <Button>ساخت اولین پست امروز</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb size={18} className="text-amber-600" />
              ایده‌های سریع
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pillars.filter(p => p.enabled).slice(0, 4).map(pillar => (
              <Link
                key={pillar.id}
                href={`/create-post?pillar=${pillar.id}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors group"
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: pillar.color }}
                />
                <span className="text-sm font-medium text-surface-700 dark:text-surface-300 flex-1">{pillar.name}</span>
                <ArrowLeft size={14} className="text-surface-400 group-hover:text-surface-600 transition-colors" />
              </Link>
            ))}
            <Link href="/create-post">
              <Button variant="ghost" className="w-full text-sm">
                مشاهده همه ایده‌ها
                <ArrowLeft size={14} className="mr-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Posts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Archive size={18} className="text-surface-600" />
            پست‌های اخیر
          </CardTitle>
          <Link href="/archive">
            <Button variant="ghost" size="sm">مشاهده آرشیو</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {posts.slice(0, 5).map(post => (
              <div
                key={post.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-surface-400">{formatPersianNumber(post.slides.length)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-surface-900 dark:text-white truncate">{post.title}</h4>
                  <p className="text-xs text-surface-500 mt-0.5">{post.contentPillar} • {formatDate(post.createdAt)}</p>
                </div>
                <Badge className={getStatusColor(post.status)}>{getStatusLabel(post.status)}</Badge>
                <Link href={`/post/${post.id}`}>
                  <Button variant="ghost" size="sm">مشاهده</Button>
                </Link>
              </div>
            ))}
            {posts.length === 0 && (
              <p className="text-center text-surface-400 py-8">هنوز پستی وجود ندارد</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scheduled + Drafts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays size={18} className="text-primary-600" />
              زمان‌بندی شده
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scheduledPosts.length > 0 ? (
              <div className="space-y-3">
                {scheduledPosts.map(post => (
                  <div key={post.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50">
                    <div className="text-center min-w-[60px]">
                      <p className="text-xs text-surface-400">{post.scheduledAt ? formatDate(post.scheduledAt, { month: 'short', day: 'numeric' }) : ''}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{post.title}</p>
                    </div>
                    <Link href={`/post/${post.id}`}>
                      <Button variant="ghost" size="sm">مشاهده</Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-surface-400 py-6">پست زمان‌بندی شده‌ای وجود ندارد</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 size={18} className="text-purple-600" />
              الگوهای یادگرفته شده
            </CardTitle>
          </CardHeader>
          <CardContent>
            {patterns.length > 0 ? (
              <div className="space-y-3">
                {patterns.slice(0, 3).map(pattern => (
                  <div key={pattern.id} className="p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-surface-800 dark:text-surface-200">{pattern.pattern}</p>
                      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">{Math.round(pattern.confidence * 100)}%</span>
                    </div>
                    <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-1.5">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${pattern.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-surface-400 py-6">هنوز الگویی ثبت نشده</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
