import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Spinner({ className, size = 16 }: { className?: string; size?: number }) {
  return <Loader2 className={cn('animate-spin text-muted-foreground', className)} size={size} />
}

export function LoadingSpinner({ className, label = 'Loading…' }: { className?: string; label?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground', className)}>
      <Spinner size={18} />
      <span>{label}</span>
    </div>
  )
}
