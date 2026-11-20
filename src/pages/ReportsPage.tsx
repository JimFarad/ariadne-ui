import { useQuery } from '@tanstack/react-query'
import { Cable, FileText, Globe, Server, TrendingUp, Users } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/spinner'
import { ErrorState } from '@/components/data/ErrorState'
import { useWorkspace } from '@/context/WorkspaceContext'
import { api } from '@/lib/api/client'
import type { ReportSummary } from '@/types/api'

function Stat({ label, value }: { label: string; value: number | string | undefined }) {
  return (
    <div>
      <p className="text-xl font-semibold leading-none">{value ?? 0}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

export function ReportsPage() {
  const { activeEntityId } = useWorkspace()

  const query = useQuery({
    queryKey: ['ws', activeEntityId, 'reports'],
    queryFn: () => api.get<ReportSummary>(`/v1/workspaces/${activeEntityId}/reports/summary`),
    enabled: !!activeEntityId,
  })

  const summary = query.data

  return (
    <div>
      <PageHeader title="Reports" description="Workspace summary report." />

      {query.isLoading ? (
        <LoadingSpinner />
      ) : query.error ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : !summary ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">No report data.</CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <Users className="h-5 w-5 text-muted-foreground" />
                <Stat label="Members" value={summary.members} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <Cable className="h-5 w-5 text-muted-foreground" />
                <Stat label="Provider connections" value={summary.provider_connections} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <Server className="h-5 w-5 text-muted-foreground" />
                <Stat label="Infrastructure online" value={summary.infrastructure?.online} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <Stat label="Domains expiring soon" value={summary.domains?.expiring_soon} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Infrastructure</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Stat label="Total resources" value={summary.infrastructure?.total} />
                <Stat label="Online" value={summary.infrastructure?.online} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Domains</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Stat label="Total domains" value={summary.domains?.total} />
                <Stat label="Expiring soon" value={summary.domains?.expiring_soon} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monitoring</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                <Stat label="Total checks" value={summary.monitoring?.total} />
                <Stat label="Enabled" value={summary.monitoring?.enabled} />
                <Stat label="Down" value={summary.monitoring?.down} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Finance
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                <Stat label="Invoices" value={summary.finance?.invoices} />
                <Stat label="Expenses" value={summary.finance?.expenses} />
                <Stat label="Budgets" value={summary.finance?.budgets} />
              </CardContent>
            </Card>
          </div>

          {(summary.finance?.invoices_total != null ||
            summary.finance?.expenses_total != null ||
            summary.finance?.budgets_total != null) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  Totals
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Invoices</p>
                  <p className="font-medium">{String(summary.finance?.invoices_total ?? '—')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Expenses</p>
                  <p className="font-medium">{String(summary.finance?.expenses_total ?? '—')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Budgets</p>
                  <p className="font-medium">{String(summary.finance?.budgets_total ?? '—')}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
