import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2, Plus, Send, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusBadge } from '@/components/StatusBadge'
import { LoadingSpinner } from '@/components/ui/spinner'
import { ErrorState } from '@/components/data/ErrorState'
import { useWorkspace } from '@/context/WorkspaceContext'
import { api, ApiError } from '@/lib/api/client'
import { formatDateTime } from '@/lib/utils'
import type { Incident, IncidentUpdate, Service } from '@/types/api'

const STATUSES = ['open', 'acknowledged', 'resolved']

export function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { activeEntityId } = useWorkspace()
  const queryClient = useQueryClient()
  const [update, setUpdate] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const incidentQuery = useQuery({
    queryKey: ['ws', activeEntityId, 'incidents', id],
    queryFn: () => api.get<Incident>(`/v1/workspaces/${activeEntityId}/incidents/${id}`),
    enabled: !!activeEntityId && !!id,
  })
  const updatesQuery = useQuery({
    queryKey: ['ws', activeEntityId, 'incidents', id, 'updates'],
    queryFn: () => api.get<IncidentUpdate[]>(`/v1/workspaces/${activeEntityId}/incidents/${id}/updates`),
    enabled: !!activeEntityId && !!id,
  })
  const servicesQuery = useQuery({
    queryKey: ['ws', activeEntityId, 'incidents', id, 'services'],
    queryFn: () => api.get<Service[]>(`/v1/workspaces/${activeEntityId}/incidents/${id}/services`),
    enabled: !!activeEntityId && !!id,
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['ws', activeEntityId, 'incidents', id] })
    void queryClient.invalidateQueries({ queryKey: ['ws', activeEntityId, 'incidents'] })
  }

  const updateMutation = useMutation({
    mutationFn: () =>
      api.post(`/v1/workspaces/${activeEntityId}/incidents/${id}/updates`, {
        content: update,
        status: newStatus || undefined,
      }),
    onSuccess: () => {
      setUpdate('')
      setNewStatus('')
      setError(null)
      invalidate()
    },
    onError: (err) => setError(err instanceof ApiError ? err.detail : 'Unable to post update.'),
  })

  const attachMutation = useMutation({
    mutationFn: () => api.post(`/v1/workspaces/${activeEntityId}/incidents/${id}/services`, { service: serviceId }),
    onSuccess: () => {
      setServiceId('')
      setError(null)
      invalidate()
    },
    onError: (err) => setError(err instanceof ApiError ? err.detail : 'Unable to attach service.'),
  })

  const detachMutation = useMutation({
    mutationFn: (serviceId: string) => api.delete(`/v1/workspaces/${activeEntityId}/incidents/${id}/services/${serviceId}`),
    onSuccess: () => invalidate(),
  })

  const incident = incidentQuery.data
  if (incidentQuery.isLoading) return <LoadingSpinner />
  if (incidentQuery.error || !incident) return <ErrorState error={incidentQuery.error} onRetry={() => incidentQuery.refetch()} />

  const updates = updatesQuery.data ?? []
  const services = servicesQuery.data ?? []

  return (
    <div>
      <PageHeader
        title={incident.title}
        description={incident.description || undefined}
        breadcrumbs={[{ label: 'Incidents', href: '/incidents' }, { label: incident.title }]}
        actions={
          <Link to="/incidents">
            <Button variant="outline"><ArrowLeft /> Back</Button>
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <StatusBadge status={String(incident.severity ?? '')} />
        <StatusBadge status={String(incident.status ?? '')} />
        <span className="text-xs text-muted-foreground">created {formatDateTime(incident.created_at)}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {updates.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No updates yet.</p>
              ) : (
                <ol className="relative space-y-4 border-l border-border pl-4">
                  {updates.map((u) => (
                    <li key={u.id} className="relative">
                      <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-border" />
                      <p className="text-sm">{u.content ?? u.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {u.status && <StatusBadge status={String(u.status)} />} {formatDateTime(u.created_at)}
                      </p>
                    </li>
                  ))}
                </ol>
              )}

              <div className="mt-5 space-y-2 border-t border-border pt-4">
                <Textarea value={update} onChange={(e) => setUpdate(e.target.value)} placeholder="Add an update…" />
                <div className="flex items-center gap-2">
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="New status (optional)" /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button onClick={() => updateMutation.mutate()} disabled={!update.trim() || updateMutation.isPending}>
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Post
                  </Button>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Linked services</CardTitle>
          </CardHeader>
          <CardContent>
            {services.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">No services linked.</p>
            ) : (
              <ul className="space-y-2">
                {services.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{s.name}</span>
                    <Button variant="ghost" size="icon-sm" onClick={() => detachMutation.mutate(s.id)} aria-label="Detach">
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex gap-2">
              <Input value={serviceId} onChange={(e) => setServiceId(e.target.value)} placeholder="Service public id" />
              <Button variant="outline" onClick={() => attachMutation.mutate()} disabled={!serviceId.trim() || attachMutation.isPending}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
