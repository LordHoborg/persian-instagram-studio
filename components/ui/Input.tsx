import React from 'react'
import { cn } from '@/lib/utils'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        suppressHydrationWarning
        className={cn(
          'flex w-full rounded-lg border border-surface-400 bg-white px-3 py-2 text-sm text-surface-900 caret-primary-700 placeholder:text-surface-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-surface-100 disabled:text-surface-600 dark:border-surface-600 dark:bg-surface-900 dark:text-surface-50 dark:caret-primary-300 dark:placeholder:text-surface-400 dark:disabled:bg-surface-800 dark:disabled:text-surface-300',
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'
