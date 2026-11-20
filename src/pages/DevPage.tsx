import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import { useWorkspace } from '@/context/WorkspaceContext'
import { getApiContext, getLastDiagnostic, onDiagnostic, type RequestDiagnostic } from '@/lib/api/client'
import { getAccessToken } from '@/lib/auth/session'
import { formatDateTime } from '@/lib/utils'

const isDev = import.meta.env.DEV || (import.meta.env.VITE_APP_ENV || '') === 'development'

function DiagnosticRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="break-all text-right font-mono text-xs">{value}</span>
    </div>
  )
}

export function DevPage() {
  const { status, user } = useAuth()
  const { activeEntityId, activeRealmId, modules } = useWorkspace()
  const [diagnostic, setDiagnostic] = useState<RequestDiagnostic | null>(getLastDiagnostic())

  useEffect(() => onDiagnostic(() => setDiagnostic(getLastDiagnostic())), [])

  if (!isDev) {
    return (
      <div>
        <PageHeader title="Developer diagnostics" />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Diagnostics are only available in development mode.
          </CardContent>
        </Card>
      </div>
    )
  }

  const ctx = getApiContext()
  const enabledModules = modules.filter((m) => m.enabled).map((m) => m.slug)

  return (
    <div>
      <PageHeader title="Developer diagnostics" description="Live API client state (dev only). No secrets are shown." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Session</CardTitle>
          </CardHeader>
          <CardContent>
            <DiagnosticRow label="API base URL" value={import.meta.env.VITE_API_BASE_URL || 'http://localhost:8801'} />
            <DiagnosticRow label="Auth status" value={status} />
            <DiagnosticRow label="User" value={user ? `${user.name} (${user.email ?? 'no email'})` : '—'} />
            <DiagnosticRow label="Access token" value={getAccessToken() ? 'present (in memory)' : 'absent'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workspace context</CardTitle>
          </CardHeader>
          <CardContent>
            <DiagnosticRow label="Workspace id" value={activeEntityId ?? '—'} />
            <DiagnosticRow label="Realm id" value={activeRealmId ?? '—'} />
            <DiagnosticRow label="Timezone" value={ctx.timezone} />
            <DiagnosticRow label="Enabled modules" value={enabledModules.length ? `${enabledModules.length} enabled` : '—'} />
            {enabledModules.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {enabledModules.slice(0, 24).map((slug) => (
                  <Badge key={slug} variant="neutral">{slug}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Last request</CardTitle>
          </CardHeader>
          <CardContent>
            {diagnostic ? (
              <>
                <DiagnosticRow label="Method" value={diagnostic.method} />
                <DiagnosticRow label="URL" value={diagnostic.url} />
                <DiagnosticRow label="Status" value={diagnostic.status ?? '—'} />
                <DiagnosticRow label="Duration" value={diagnostic.durationMs != null ? `${diagnostic.durationMs} ms` : '—'} />
                <DiagnosticRow label="Request ID" value={diagnostic.requestId ?? '—'} />
                <DiagnosticRow label="Error code" value={diagnostic.errorCode ?? '—'} />
                <DiagnosticRow label="At" value={formatDateTime(diagnostic.at)} />
              </>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">No requests yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
