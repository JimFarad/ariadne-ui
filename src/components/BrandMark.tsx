import { cn } from '@/lib/utils'

/**
 * ARIADNE brand mark — a single continuous thread forming an "A",
 * evoking the platform's "thread connecting systems" concept.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={cn('h-7 w-7', className)} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--primary)" />
      <path
        d="M9.5 23.5 16 7.5l6.5 16"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.6 17.2h6.8"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Wordmark({ collapsed }: { collapsed?: boolean }) {
  if (collapsed) return null
  return (
    <span className="text-[15px] font-semibold tracking-tight">
      ARIADNE
    </span>
  )
}
