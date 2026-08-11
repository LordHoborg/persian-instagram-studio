'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  PenTool,
  Brain,
  Archive,
  CalendarDays,
  BarChart3,
  Settings,
  Sparkles,
  Instagram,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/', label: 'داشبورد', icon: LayoutDashboard },
  { href: '/create-post', label: 'ساخت پست', icon: PenTool },
  { href: '/content-brain', label: 'مغز محتوا', icon: Brain },
  { href: '/archive', label: 'آرشیو', icon: Archive },
  { href: '/calendar', label: 'تقویم', icon: CalendarDays },
  { href: '/analytics', label: 'آنالیز', icon: BarChart3 },
  { href: '/settings', label: 'تنظیمات', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-white dark:bg-surface-900 rounded-lg shadow-md border border-surface-200"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-40 w-64 bg-white dark:bg-surface-950 border-l border-surface-200 dark:border-surface-800 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen',
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-5 border-b border-surface-100 dark:border-surface-800">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-surface-900 dark:text-white leading-tight">استودیو محتوا</h1>
                <p className="text-xs text-surface-500">هوش مصنوعی فارسی</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-white'
                  )}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Instagram Status */}
          <div className="px-4 py-4 border-t border-surface-100 dark:border-surface-800">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-50 dark:bg-surface-900">
              <Instagram size={18} className="text-surface-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-surface-700 dark:text-surface-300 truncate">Instagram</p>
                <p className="text-[10px] text-surface-400">متصل نیست</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-red-400" />
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}
