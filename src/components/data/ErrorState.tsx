import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ApiError } from '@/lib/api/client'

export function ErrorState({ error, onRetry }: { error?: unknown; onRetry?: () => void }) {
  const apiError = error as ApiError | null
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border px-6 py-12 text-center">
      <div className="text-muted-foreground">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div className="max-w-md">
        <p className="text-sm font-medium">{apiError?.status === 403 ? 'You do not have access' : 'Something went wrong'}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {apiError?.status === 403
            ? 'This area requires a permission you do not currently hold.'
            : apiError?.detail || 'The request could not be completed.'}
        </p>
        {apiError?.requestId && (
          <p className="mt-2 font-mono text-xs text-muted-foreground/70">request_id: {apiError.requestId}</p>
        )}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
