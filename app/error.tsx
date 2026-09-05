'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app-error]', error)
  }, [error])

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center">
      <div className="w-full rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm dark:border-red-900 dark:bg-surface-900">
        <AlertTriangle className="mx-auto mb-4 text-red-500" size={36} />
        <h1 className="text-xl font-bold text-surface-900 dark:text-white">بخشی از برنامه با خطا روبه‌رو شد</h1>
        <p className="mt-2 text-sm leading-7 text-surface-500">می‌توانید دوباره تلاش کنید. اگر خطا تکرار شد، لاگ سرور را بررسی کنید.</p>
        <Button onClick={reset} className="mt-6 gap-2">
          <RotateCcw size={16} /> تلاش دوباره
        </Button>
      </div>
    </div>
  )
}
