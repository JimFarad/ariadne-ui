import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Loader2, Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/data/DataTable'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { StatusBadge } from '@/components/StatusBadge'
import { usePaginatedList } from '@/hooks/usePaginatedList'
import { useWorkspace } from '@/context/WorkspaceContext'
import { api, ApiError } from '@/lib/api/client'
import { relativeTime } from '@/lib/utils'
import type { Incident } from '@/types/api'

const SEVERITIES = ['critical', 'warning', 'info', 'success']

export function IncidentsPage() {
  const { activeEntityId } = useWorkspace()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const list = usePaginatedList<Incident>((e) => `/v1/workspaces/${e}/incidents`)

  const columns: Column<Incident>[] = [
    {
      key: 'title',
      header: 'Title',
      cell: (r) => (
        <Link to={`/incidents/${r.id}`} className="font-medium hover:underline">
          {r.title}
        </Link>
      ),
    },
    { key: 'severity', header: 'Severity', cell: (r) => <StatusBadge status={String(r.severity ?? '')} /> },
    { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={String(r.status ?? '')} /> },
    { key: 'updated_at', header: 'Updated', cell: (r) => <span className="text-xs text-muted-foreground">{relativeTime(String(r.updated_at ?? ''))}</span> },
  ]

  return (
    <div>
      <PageHeader
        title="Incidents"
        description="Track and resolve operational incidents."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus />
            New incident
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={list.data}
        rowKey={(r) => r.id}
        loading={list.isLoading}
        error={list.error}
        onRetry={list.refetch}
        pagination={list.pagination?.pagination}
        onPageChange={list.setPage}
        emptyTitle="No incidents"
        emptyDescription="No active incidents."
      />

      <CreateIncidentDialog
        open={open}
        onOpenChange={setOpen}
        onCreated={() => void queryClient.invalidateQueries({ queryKey: ['ws', activeEntityId, `/v1/workspaces/${activeEntityId}/incidents`] })}
      />
    </div>
  )
}

function CreateIncidentDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}) {
  const { activeEntityId } = useWorkspace()
  const [title, setTitle] = useState('')
  const [severity, setSeverity] = useState('warning')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => api.post(`/v1/workspaces/${activeEntityId}/incidents`, { title, severity, description: description || null }),
    onSuccess: () => {
      onOpenChange(false)
      setTitle('')
      setDescription('')
      onCreated()
    },
    onError: (err) => setError(err instanceof ApiError ? err.detail : 'Unable to create incident.'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New incident</DialogTitle>
          <DialogDescription>Describe the incident and its severity.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="inc-title">Title</Label>
            <Input id="inc-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Severity</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inc-desc">Description</Label>
            <Textarea id="inc-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!title.trim() || mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
