import React from 'react'
import { cn } from '@/lib/utils'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'flex w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:bg-surface-900 dark:border-surface-700 dark:text-white resize-y min-h-[80px]',
          className
        )}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'
