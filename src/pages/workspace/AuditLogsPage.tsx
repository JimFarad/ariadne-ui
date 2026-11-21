import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/data/DataTable'
import { Input } from '@/components/ui/input'
import { useWorkspace } from '@/context/WorkspaceContext'
import { api } from '@/lib/api/client'
import { formatDateTime } from '@/lib/utils'
import type { AuditLog } from '@/types/api'

export function AuditLogsPage() {
  const { activeEntityId } = useWorkspace()
  const [actionFilter, setActionFilter] = useState('')

  const query = useQuery({
    queryKey: ['ws', activeEntityId, 'audit-logs', actionFilter],
    queryFn: () =>
      api.get<AuditLog[]>(`/v1/workspaces/${activeEntityId}/audit-logs`, {
        query: { action: actionFilter || undefined },
      }),
    enabled: !!activeEntityId,
  })

  const columns: Column<AuditLog>[] = [
    { key: 'action', header: 'Action', cell: (r) => <span className="font-mono text-xs">{String(r.action ?? '—')}</span> },
    { key: 'message', header: 'Message', cell: (r) => <span className="text-sm">{r.message ?? '—'}</span> },
    { key: 'user', header: 'User', cell: (r) => <span className="text-xs text-muted-foreground">{r.user ?? '—'}</span> },
    { key: 'ip', header: 'IP', cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.ip_address ?? '—'}</span> },
    { key: 'created_at', header: 'When', cell: (r) => <span className="text-xs text-muted-foreground">{formatDateTime(r.created_at)}</span> },
  ]

  return (
    <div>
      <PageHeader title="Audit logs" description="Recent administrative actions for this workspace." />

      <div className="mb-4 max-w-sm">
        <Input
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          placeholder="Filter by action…"
        />
      </div>

      <DataTable
        columns={columns}
        data={query.data ?? []}
        rowKey={(r) => r.id}
        loading={query.isLoading}
        error={query.error}
        onRetry={query.refetch}
        emptyTitle="No audit logs"
      />
    </div>
  )
}
