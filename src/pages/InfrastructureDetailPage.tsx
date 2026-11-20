import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2, Power } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/StatusBadge'
import { ConfirmDialog } from '@/components/forms/ConfirmDialog'
import { LoadingSpinner } from '@/components/ui/spinner'
import { ErrorState } from '@/components/data/ErrorState'
import { useWorkspace } from '@/context/WorkspaceContext'
import { api, ApiError } from '@/lib/api/client'
import { formatDateTime, formatMoney, shortId } from '@/lib/utils'
import type { InfrastructureResource, PowerAction } from '@/types/api'

const POWER_ACTIONS: Array<{ action: PowerAction; label: string }> = [
  { action: 'start', label: 'Start' },
  { action: 'restart', label: 'Restart' },
  { action: 'stop', label: 'Shutdown' },
]

export function InfrastructureDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { activeEntityId } = useWorkspace()
  const queryClient = useQueryClient()
  const [pendingAction, setPendingAction] = useState<PowerAction | null>(null)
  const [actionResult, setActionResult] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['ws', activeEntityId, 'infrastructure', id],
    queryFn: () => api.get<InfrastructureResource>(`/v1/workspaces/${activeEntityId}/infrastructure/${id}`),
    enabled: !!activeEntityId && !!id,
  })

  const powerMutation = useMutation({
    mutationFn: (action: PowerAction) =>
      api.post<{ action: string; status: string }>(`/v1/workspaces/${activeEntityId}/infrastructure/${id}/power`, { action }),
    onSuccess: (result) => {
      setPendingAction(null)
      setActionResult(`${result.action} → ${result.status}`)
      void queryClient.invalidateQueries({ queryKey: ['ws', activeEntityId, 'infrastructure'] })
    },
    onError: () => setPendingAction(null),
  })

  const resource = query.data

  if (query.isLoading) return <LoadingSpinner />
  if (query.error || !resource) return <ErrorState error={query.error} onRetry={() => query.refetch()} />

  return (
    <div>
      <PageHeader
        title={resource.name}
        description={`${resource.type} · ${shortId(resource.id)}`}
        breadcrumbs={[
          { label: 'Infrastructure', href: '/infrastructure' },
          { label: resource.name },
        ]}
        actions={
          <>
            <Link to="/infrastructure">
              <Button variant="outline">
                <ArrowLeft /> Back
              </Button>
            </Link>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={resource.status} />
        <span className="text-sm text-muted-foreground">
          {resource.provider ? `provider: ${resource.provider} · ` : ''}
          updated {formatDateTime(resource.updated_at)}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Power</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {POWER_ACTIONS.map(({ action, label }) => (
                <Button
                  key={action}
                  variant={action === 'stop' ? 'destructive' : 'default'}
                  onClick={() => setPendingAction(action)}
                  disabled={powerMutation.isPending}
                >
                  <Power className="h-4 w-4" />
                  {label}
                </Button>
              ))}
            </div>
            {actionResult && <p className="mt-3 text-sm text-muted-foreground">Power action applied: {actionResult}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="Location" value={resource.location} />
            <DetailRow label="Provider" value={resource.provider} />
            <DetailRow label="Monthly cost" value={formatMoney(resource.monthly_cost, resource.currency)} />
            <DetailRow label="Currency" value={resource.currency} />
            <DetailRow label="Created" value={formatDateTime(resource.created_at)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>IP addresses</CardTitle>
          </CardHeader>
          <CardContent>
            {(resource.ip_addresses ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">None.</p>
            ) : (
              <ul className="space-y-1.5">
                {resource.ip_addresses!.map((ip, i) => (
                  <li key={i} className="flex items-center justify-between font-mono text-xs">
                    <span>{ip.address}</span>
                    <span className="text-muted-foreground">{ip.type}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SSH keys</CardTitle>
          </CardHeader>
          <CardContent>
            {(resource.ssh_keys ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">None.</p>
            ) : (
              <ul className="space-y-1.5">
                {resource.ssh_keys!.map((key, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium">{key.name}</span>
                    <span className="ml-2 break-all font-mono text-xs text-muted-foreground">{key.public_key}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={pendingAction !== null}
        onOpenChange={(open) => !open && setPendingAction(null)}
        title={`Confirm ${pendingAction}`}
        description={
          pendingAction === 'stop'
            ? 'Shutting down a resource is potentially destructive and may interrupt services.'
            : `This will ${pendingAction} the resource.`
        }
        confirmLabel={pendingAction === 'stop' ? 'Shutdown' : pendingAction === 'restart' ? 'Restart' : 'Start'}
        destructive={pendingAction === 'stop'}
        loading={powerMutation.isPending}
        onConfirm={() => pendingAction && powerMutation.mutate(pendingAction)}
      />
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value || '—'}</span>
    </div>
  )
}
