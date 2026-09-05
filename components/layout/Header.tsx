'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, Search, Moon, Sun, User } from 'lucide-react'
import { Input } from '@/components/ui/Input'

export function Header() {
  const router = useRouter()
  const [darkMode, setDarkMode] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const stored = window.localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const enabled = stored ? stored === 'dark' : prefersDark
    document.documentElement.classList.toggle('dark', enabled)
    setDarkMode(enabled)
  }, [])

  const toggleDark = () => {
    const enabled = !darkMode
    setDarkMode(enabled)
    document.documentElement.classList.toggle('dark', enabled)
    window.localStorage.setItem('theme', enabled ? 'dark' : 'light')
  }

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalized = query.trim()
    router.push(normalized ? `/archive?q=${encodeURIComponent(normalized)}` : '/archive')
    setSearchOpen(false)
  }

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-surface-950/80 backdrop-blur-md border-b border-surface-200 dark:border-surface-800">
      <div className="flex items-center justify-between h-16 px-4 lg:px-8">
        {/* Search */}
        <div className="flex items-center gap-4 flex-1">
          {searchOpen ? (
            <form onSubmit={handleSearch} className="relative w-full max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <Input
                placeholder="جستجو در پست‌ها..."
                className="pr-10"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => event.key === 'Escape' && setSearchOpen(false)}
                autoFocus
                aria-label="جستجو در پست‌ها"
              />
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 text-surface-400 hover:text-surface-600 transition-colors"
              aria-label="باز کردن جستجو"
            >
              <Search size={18} />
              <span className="text-sm hidden sm:inline">جستجو...</span>
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDark}
            className="p-2 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            aria-label={darkMode ? 'فعال کردن حالت روشن' : 'فعال کردن حالت تیره'}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link href="/calendar" aria-label="رفتن به تقویم محتوا" className="relative p-2 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
            <Bell size={18} />
          </Link>
          <Link href="/settings" aria-label="رفتن به تنظیمات" className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <User size={16} className="text-primary-700" />
          </Link>
        </div>
      </div>
    </header>
  )
}
