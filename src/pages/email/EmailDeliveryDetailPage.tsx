import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2, Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { StatusBadge } from '@/components/StatusBadge'
import { LoadingSpinner } from '@/components/ui/spinner'
import { ErrorState } from '@/components/data/ErrorState'
import { useWorkspace } from '@/context/WorkspaceContext'
import { api, ApiError } from '@/lib/api/client'
import { formatDateTime } from '@/lib/utils'
import type { DeliveryEvent, EmailDelivery } from '@/types/api'

const EVENT_TYPES = ['sent', 'delivered', 'bounced', 'opened', 'clicked', 'spam', 'complaint']

export function EmailDeliveryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { activeEntityId } = useWorkspace()
  const queryClient = useQueryClient()
  const [addEvent, setAddEvent] = useState(false)

  const deliveryQuery = useQuery({
    queryKey: ['ws', activeEntityId, 'email-deliveries', id],
    queryFn: () => api.get<EmailDelivery>(`/v1/workspaces/${activeEntityId}/email-deliveries/${id}`),
    enabled: !!activeEntityId && !!id,
  })
  const eventsQuery = useQuery({
    queryKey: ['ws', activeEntityId, 'email-deliveries', id, 'events'],
    queryFn: () => api.get<DeliveryEvent[]>(`/v1/workspaces/${activeEntityId}/email-deliveries/${id}/events`),
    enabled: !!activeEntityId && !!id,
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['ws', activeEntityId, 'email-deliveries', id] })
  }

  const delivery = deliveryQuery.data

  if (deliveryQuery.isLoading) return <LoadingSpinner />
  if (deliveryQuery.error || !delivery) return <ErrorState error={deliveryQuery.error} onRetry={() => deliveryQuery.refetch()} />

  return (
    <div>
      <PageHeader
        title={delivery.subject || '(no subject)'}
        breadcrumbs={[{ label: 'Email delivery', href: '/email/deliveries' }, { label: delivery.subject ?? 'delivery' }]}
        actions={
          <Link to="/email/deliveries">
            <Button variant="outline"><ArrowLeft /> Back</Button>
          </Link>
        }
      />

      <Card className="mb-6">
        <CardContent className="grid gap-x-8 gap-y-3 py-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <StatusBadge status={String(delivery.status ?? '')} />
            </div>
            <p className="text-sm text-muted-foreground">from {delivery.sender ?? '—'}</p>
            <p className="text-sm text-muted-foreground">to {delivery.recipient ?? '—'}</p>
            {delivery.sent_at ? <p className="text-sm text-muted-foreground">sent {formatDateTime(delivery.sent_at)}</p> : null}
            {delivery.error ? <p className="text-sm text-destructive">{delivery.error}</p> : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Events
            <Button variant="outline" size="sm" onClick={() => setAddEvent(true)}><Plus /> Add event</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(eventsQuery.data ?? []).length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No events recorded.</p>
          ) : (
            <ul className="divide-y divide-border">
              {(eventsQuery.data ?? []).map((e, i) => (
                <li key={e.id ?? i} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <span className="font-mono text-xs">{String(e.type ?? 'event')}</span>
                    {e.metadata && Object.keys(e.metadata).length > 0 && (
                      <span className="ml-2 text-xs text-muted-foreground">{JSON.stringify(e.metadata)}</span>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(e.occurred_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {addEvent && (
        <AddEventDialog deliveryId={id!} onOpenChange={setAddEvent} onSaved={invalidate} />
      )}
    </div>
  )
}

function AddEventDialog({ deliveryId, onOpenChange, onSaved }: { deliveryId: string; onOpenChange: (o: boolean) => void; onSaved: () => void }) {
  const { activeEntityId } = useWorkspace()
  const [type, setType] = useState('delivered')
  const [occurredAt, setOccurredAt] = useState('')
  const [metadata, setMetadata] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => {
      let parsed: unknown
      if (metadata.trim() !== '') {
        try {
          parsed = JSON.parse(metadata)
        } catch {
          throw new Error('Metadata must be valid JSON.')
        }
      }
      return api.post(`/v1/workspaces/${activeEntityId}/email-deliveries/${deliveryId}/events`, {
        type,
        occurred_at: occurredAt || null,
        metadata: parsed,
      })
    },
    onSuccess: () => { onOpenChange(false); onSaved() },
    onError: (err) => setError(err instanceof ApiError ? err.detail : err instanceof Error ? err.message : 'Unable to add event.'),
  })

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Add event</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ev-occurred">Occurred at (optional)</Label>
            <Input id="ev-occurred" type="datetime-local" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ev-meta">Metadata (JSON, optional)</Label>
            <Textarea id="ev-meta" value={metadata} onChange={(e) => setMetadata(e.target.value)} rows={3} className="font-mono text-xs" placeholder='{ "ip": "203.0.113.7" }' />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
