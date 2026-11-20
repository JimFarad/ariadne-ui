import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { StatusBadge } from '@/components/StatusBadge'
import { LoadingSpinner } from '@/components/ui/spinner'
import { ErrorState } from '@/components/data/ErrorState'
import { EmptyState } from '@/components/data/EmptyState'
import { useWorkspace } from '@/context/WorkspaceContext'
import { api, ApiError } from '@/lib/api/client'
import { formatDateTime } from '@/lib/utils'
import type { EmailDelivery } from '@/types/api'

type Row = Record<string, unknown> & { id: string }

export function DeliveriesPage() {
  const { activeEntityId } = useWorkspace()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [selected, setSelected] = useState<Row | null>(null)

  const query = useQuery({
    queryKey: ['ws', activeEntityId, 'email-deliveries'],
    queryFn: () => api.get<EmailDelivery[]>(`/v1/workspaces/${activeEntityId}/email-deliveries`),
    enabled: !!activeEntityId,
  })
  const eventsQuery = useQuery({
    queryKey: ['ws', activeEntityId, 'email-deliveries', selected?.id, 'events'],
    queryFn: () => api.get<Row[]>(`/v1/workspaces/${activeEntityId}/email-deliveries/${selected!.id}/events`),
    enabled: !!activeEntityId && !!selected,
  })

  return (
    <div>
      <PageHeader
        title="Email deliveries"
        description="Outbound email delivery log."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> Send
          </Button>
        }
      />

      {query.isLoading ? (
        <LoadingSpinner />
      ) : query.error ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (query.data ?? []).length === 0 ? (
        <EmptyState title="No deliveries" />
      ) : (
        <div className="space-y-2">
          {(query.data ?? []).map((d) => (
            <Card key={d.id}>
              <CardContent className="flex items-center justify-between gap-4 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{String(d.subject ?? '(no subject)')}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    to {String(d.recipient ?? '—')} · {formatDateTime(String(d.created_at ?? ''))}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={String(d.status ?? '')} />
                  <Button variant="outline" size="sm" onClick={() => setSelected(d as unknown as Row)}>
                    Events
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {createOpen && (
        <CreateDeliveryDialog
          onOpenChange={setCreateOpen}
          onSaved={() => void queryClient.invalidateQueries({ queryKey: ['ws', activeEntityId, 'email-deliveries'] })}
        />
      )}

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delivery events</DialogTitle>
            <DialogDescription>{String(selected?.subject ?? '')}</DialogDescription>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto">
            {(eventsQuery.data ?? []).length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No events.</p>
            ) : (
              <ul className="divide-y divide-border">
                {(eventsQuery.data ?? []).map((e, i) => (
                  <li key={i} className="py-2 text-sm">
                    <span className="font-mono text-xs">{String(e.type ?? 'event')}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{formatDateTime(String(e.created_at ?? ''))}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CreateDeliveryDialog({ onOpenChange, onSaved }: { onOpenChange: (o: boolean) => void; onSaved: () => void }) {
  const { activeEntityId } = useWorkspace()
  const [sender, setSender] = useState('')
  const [recipient, setRecipient] = useState('')
  const [subject, setSubject] = useState('')
  const [template, setTemplate] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      api.post(`/v1/workspaces/${activeEntityId}/email-deliveries`, {
        sender,
        recipient,
        subject,
        template: template || undefined,
      }),
    onSuccess: () => { onOpenChange(false); onSaved() },
    onError: (err) => setError(err instanceof ApiError ? err.detail : 'Unable to send.'),
  })

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send email</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="ed-sender">Sender id</Label>
            <Input id="ed-sender" value={sender} onChange={(e) => setSender(e.target.value)} placeholder="Sender public id" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ed-recipient">Recipient</Label>
            <Input id="ed-recipient" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="name@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ed-subject">Subject</Label>
            <Input id="ed-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ed-template">Template id (optional)</Label>
            <Input id="ed-template" value={template} onChange={(e) => setTemplate(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!sender.trim() || !recipient.trim() || !subject.trim() || mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
