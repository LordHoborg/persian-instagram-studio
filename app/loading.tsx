import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-surface-500" role="status" aria-live="polite">
      <Loader2 className="ml-2 animate-spin" size={20} />
      در حال بارگذاری...
    </div>
  )
}
