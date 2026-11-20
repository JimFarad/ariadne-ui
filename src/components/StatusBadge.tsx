import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const statusVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      tone: {
        success: 'border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
        warning: 'border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400',
        danger: 'border-transparent bg-red-500/15 text-red-600 dark:text-red-400',
        info: 'border-transparent bg-sky-500/15 text-sky-600 dark:text-sky-400',
        neutral: 'border-border bg-secondary text-secondary-foreground',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

/** Maps arbitrary API status strings to a tone. Only known values are colored. */
function toneForStatus(status: string | null | undefined): VariantProps<typeof statusVariants>['tone'] {
  const s = (status || '').toLowerCase()
  if (['online', 'active', 'enabled', 'paid', 'approved', 'resolved', 'healthy', 'up', 'implemented', 'completed', 'matched'].includes(s)) return 'success'
  if (['offline', 'disabled', 'failed', 'rejected', 'unhealthy', 'down', 'critical', 'overdue', 'unexpected', 'error'].includes(s)) return 'danger'
  if (['maintenance', 'pending', 'pending_review', 'draft', 'open', 'in_progress', 'warning', 'degraded', 'unknown', 'processing', 'investigating'].includes(s)) return 'warning'
  if (['missing', 'staging', 'detected'].includes(s)) return 'info'
  return 'neutral'
}

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string | null | undefined
  label?: string
  className?: string
}) {
  if (!status) return <span className="text-sm text-muted-foreground">—</span>
  const display = label ?? status.replace(/_/g, ' ')
  return (
    <span className={cn(statusVariants({ tone: toneForStatus(status) }), className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
      {display}
    </span>
  )
}

export { statusVariants, toneForStatus }
