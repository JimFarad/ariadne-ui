import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/data/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/StatusBadge'
import { ConfirmDialog } from '@/components/forms/ConfirmDialog'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useWorkspace } from '@/context/WorkspaceContext'
import { api, ApiError } from '@/lib/api/client'
import { formatDateTime } from '@/lib/utils'
import type { EmailSender } from '@/types/api'

function DnsBadge({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-xs text-muted-foreground">—</span>
  const ok = value === 'pass'
  return <span className={ok ? 'text-xs text-emerald-600 dark:text-emerald-400' : 'text-xs text-destructive'}>{value}</span>
}

export function SendersPage() {
  const { activeEntityId } = useWorkspace()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [deleting, setDeleting] = useState<EmailSender | null>(null)

  const query = useQuery({
    queryKey: ['ws', activeEntityId, 'email-senders'],
    queryFn: () => api.get<EmailSender[]>(`/v1/workspaces/${activeEntityId}/email-senders`),
    enabled: !!activeEntityId,
  })

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['ws', activeEntityId, 'email-senders'] })

  const checkDnsMutation = useMutation({
    mutationFn: (id: string) => api.post(`/v1/workspaces/${activeEntityId}/email-senders/${id}/check-dns`),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/workspaces/${activeEntityId}/email-senders/${id}`),
    onSuccess: () => {
      setDeleting(null)
      invalidate()
    },
  })

  const columns: Column<EmailSender>[] = [
    { key: 'name', header: 'Name', cell: (r) => <span className="font-medium">{r.name ?? '—'}</span> },
    { key: 'email', header: 'Email', cell: (r) => <span className="font-mono text-xs">{r.email ?? '—'}</span> },
    { key: 'domain', header: 'Domain', cell: (r) => String(r.domain ?? '—') },
    { key: 'spf', header: 'SPF', cell: (r) => <DnsBadge value={r.spf_status} /> },
    { key: 'dkim', header: 'DKIM', cell: (r) => <DnsBadge value={r.dkim_status} /> },
    { key: 'checked', header: 'Checked', cell: (r) => <span className="text-xs text-muted-foreground">{formatDateTime(r.dns_checked_at)}</span> },
    {
      key: '__actions',
      header: '',
      headerClassName: 'w-[110px]',
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button variant="outline" size="sm" onClick={() => checkDnsMutation.mutate(r.id)} disabled={checkDnsMutation.isPending} title="Run SPF/DKIM check">
            <RefreshCw className="h-3.5 w-3.5" /> Check DNS
          </Button>
          <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => setDeleting(r)} aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Email senders"
        description="Sender identities used for outbound email."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> Add sender
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={query.data ?? []}
        rowKey={(r) => r.id}
        loading={query.isLoading}
        error={query.error}
        onRetry={query.refetch}
        emptyTitle="No senders"
        emptyDescription="Add your first sender identity."
      />

      {createOpen && <CreateSenderDialog onOpenChange={setCreateOpen} onSaved={invalidate} />}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete sender"
        description={`Delete sender ${deleting?.email ?? ''}?`}
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  )
}

function CreateSenderDialog({ onOpenChange, onSaved }: { onOpenChange: (o: boolean) => void; onSaved: () => void }) {
  const { activeEntityId } = useWorkspace()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [domain, setDomain] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => api.post(`/v1/workspaces/${activeEntityId}/email-senders`, { name, email, domain: domain || undefined }),
    onSuccess: () => { onOpenChange(false); onSaved() },
    onError: (err) => setError(err instanceof ApiError ? err.detail : 'Unable to add sender.'),
  })

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Add sender</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="es-name">Name</Label>
            <Input id="es-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="es-email">Email</Label>
            <Input id="es-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="support@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="es-domain">Domain (optional)</Label>
            <Input id="es-domain" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!name.trim() || !email.trim() || mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
