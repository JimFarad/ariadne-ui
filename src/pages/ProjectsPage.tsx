import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Loader2, Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/data/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import type { Project } from '@/types/api'

const STATUSES = ['planned', 'active', 'completed', 'cancelled']

export function ProjectsPage() {
  const { activeEntityId } = useWorkspace()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const list = usePaginatedList<Project>((e) => `/v1/workspaces/${e}/projects`)

  const columns: Column<Project>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (r) => (
        <Link to={`/projects/${r.id}`} className="font-medium hover:underline">
          {r.name}
        </Link>
      ),
    },
    { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={String(r.status ?? '')} /> },
    { key: 'due_date', header: 'Due', cell: (r) => <span className="text-xs text-muted-foreground">{String(r.due_date ?? '—')}</span> },
  ]

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Projects with tasks and milestones."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus />
            New project
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
        emptyTitle="No projects"
      />

      <CreateProjectDialog
        open={open}
        onOpenChange={setOpen}
        onCreated={() => void queryClient.invalidateQueries({ queryKey: ['ws', activeEntityId, `/v1/workspaces/${activeEntityId}/projects`] })}
      />
    </div>
  )
}

function CreateProjectDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}) {
  const { activeEntityId } = useWorkspace()
  const [name, setName] = useState('')
  const [status, setStatus] = useState('planned')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => api.post(`/v1/workspaces/${activeEntityId}/projects`, { name, status, description: description || null }),
    onSuccess: () => { onOpenChange(false); setName(''); setDescription(''); onCreated() },
    onError: (err) => setError(err instanceof ApiError ? err.detail : 'Unable to create project.'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="prj-name">Name</Label>
            <Input id="prj-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prj-desc">Description</Label>
            <Input id="prj-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
