import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPersianNumber(num: number): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return num.toString().replace(/\d/g, (w) => persianDigits[+w])
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('fa-IR', options || { year: 'numeric', month: 'long', day: 'numeric' })
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'امروز'
  if (diffDays === 1) return 'دیروز'
  if (diffDays < 7) return `${formatPersianNumber(diffDays)} روز پیش`
  if (diffDays < 30) return `${formatPersianNumber(Math.floor(diffDays / 7))} هفته پیش`
  return `${formatPersianNumber(Math.floor(diffDays / 30))} ماه پیش`
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function estimateTextCost(inputTokens: number, outputTokens: number, model: string = 'gpt-4'): number {
  const rates: Record<string, { input: number; output: number }> = {
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4o': { input: 0.005, output: 0.015 },
    'gpt-3.5': { input: 0.0005, output: 0.0015 },
  }
  const rate = rates[model] || rates['gpt-4o']
  return (inputTokens / 1_000_000) * rate.input + (outputTokens / 1_000_000) * rate.output
}

export function estimateImageCost(count: number, size: string = '1024x1024'): number {
  const rates: Record<string, number> = {
    '1024x1024': 0.04,
    '1024x1536': 0.08,
    '1536x1024': 0.08,
  }
  return count * (rates[size] ?? rates['1024x1024'])
}

export function getContentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    single: 'تک تصویر',
    carousel: 'کاروسل',
    quote: 'نقل قول',
    story: 'استوری',
    reel: 'ریل',
  }
  return labels[type] || type
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    idea: 'ایده',
    draft: 'پیش‌نویس',
    generated: 'تولید شده',
    review: 'در بررسی',
    approved: 'تایید شده',
    scheduled: 'زمان‌بندی شده',
    published: 'منتشر شده',
    archived: 'بایگانی',
  }
  return labels[status] || status
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    idea: 'bg-surface-200 text-surface-700',
    draft: 'bg-amber-100 text-amber-800',
    generated: 'bg-blue-100 text-blue-800',
    review: 'bg-purple-100 text-purple-800',
    approved: 'bg-emerald-100 text-emerald-800',
    scheduled: 'bg-primary-100 text-primary-800',
    published: 'bg-green-100 text-green-800',
    archived: 'bg-surface-200 text-surface-500',
  }
  return colors[status] || 'bg-surface-200 text-surface-700'
}
