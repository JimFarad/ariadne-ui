import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/spinner'
import { ErrorState } from '@/components/data/ErrorState'
import { useWorkspace } from '@/context/WorkspaceContext'
import { api } from '@/lib/api/client'
import type { ReportSummary } from '@/types/api'

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function ReportsPage() {
  const { activeEntityId } = useWorkspace()

  const query = useQuery({
    queryKey: ['ws', activeEntityId, 'reports'],
    queryFn: () => api.get<ReportSummary>(`/v1/workspaces/${activeEntityId}/reports/summary`),
    enabled: !!activeEntityId,
  })

  const entries = Object.entries(query.data ?? {})

  return (
    <div>
      <PageHeader title="Reports" description="Workspace summary report." />
      {query.isLoading ? (
        <LoadingSpinner />
      ) : query.error ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">No report data.</CardContent>
        </Card>
      ) : (
        <Card className="max-w-2xl">
          <CardContent className="py-2">
            <dl className="divide-y divide-border">
              {entries.map(([key, value]) => (
                <div key={key} className="flex items-start justify-between gap-4 py-3">
                  <dt className="text-sm text-muted-foreground">{key.replace(/_/g, ' ')}</dt>
                  <dd className="break-all text-right font-mono text-sm">{formatValue(value)}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
