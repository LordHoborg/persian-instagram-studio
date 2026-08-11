'use client'

import { useState } from 'react'
import { Bell, Search, Moon, Sun, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function Header() {
  const [darkMode, setDarkMode] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const toggleDark = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-surface-950/80 backdrop-blur-md border-b border-surface-200 dark:border-surface-800">
      <div className="flex items-center justify-between h-16 px-4 lg:px-8">
        {/* Search */}
        <div className="flex items-center gap-4 flex-1">
          {searchOpen ? (
            <div className="relative w-full max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <Input
                placeholder="جستجو در پست‌ها..."
                className="pr-10"
                autoFocus
                onBlur={() => setSearchOpen(false)}
              />
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 text-surface-400 hover:text-surface-600 transition-colors"
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
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="relative p-2 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
            <Bell size={18} />
            <span className="absolute top-1.5 left-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <User size={16} className="text-primary-700" />
          </div>
        </div>
      </div>
    </header>
  )
}
