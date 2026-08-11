import React from 'react'
import { cn } from '@/lib/utils'

export function Badge({ children, className, variant = 'default' }: { 
  children: React.ReactNode; 
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}) {
  const variants = {
    default: 'bg-surface-100 text-surface-700',
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-primary-100 text-primary-800',
  }

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}
