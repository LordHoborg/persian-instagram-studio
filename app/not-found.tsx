import Link from 'next/link'
import { ArrowRight, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center">
      <div className="w-full rounded-2xl border border-surface-200 bg-white p-8 text-center shadow-sm dark:border-surface-800 dark:bg-surface-900">
        <SearchX className="mx-auto mb-4 text-surface-400" size={38} />
        <h1 className="text-xl font-bold text-surface-900 dark:text-white">صفحه یا محتوا پیدا نشد</h1>
        <p className="mt-2 text-sm leading-7 text-surface-500">ممکن است آدرس اشتباه باشد یا محتوا حذف شده باشد.</p>
        <Link href="/">
          <Button className="mt-6 gap-2">
            <ArrowRight size={16} /> بازگشت به داشبورد
          </Button>
        </Link>
      </div>
    </div>
  )
}
