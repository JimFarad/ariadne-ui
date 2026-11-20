import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2, Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { StatusBadge } from '@/components/StatusBadge'
import { LoadingSpinner } from '@/components/ui/spinner'
import { ErrorState } from '@/components/data/ErrorState'
import { useWorkspace } from '@/context/WorkspaceContext'
import { api, ApiError } from '@/lib/api/client'
import type { Milestone, Project, Task } from '@/types/api'

const TASK_STATUSES = ['todo', 'in_progress', 'done']

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { activeEntityId } = useWorkspace()
  const queryClient = useQueryClient()
  const [taskDialog, setTaskDialog] = useState(false)
  const [milestoneDialog, setMilestoneDialog] = useState(false)

  const projectQuery = useQuery({
    queryKey: ['ws', activeEntityId, 'projects', id],
    queryFn: () => api.get<Project>(`/v1/workspaces/${activeEntityId}/projects/${id}`),
    enabled: !!activeEntityId && !!id,
  })
  const tasksQuery = useQuery({
    queryKey: ['ws', activeEntityId, 'projects', id, 'tasks'],
    queryFn: () => api.get<Task[]>(`/v1/workspaces/${activeEntityId}/projects/${id}/tasks`),
    enabled: !!activeEntityId && !!id,
  })
  const milestonesQuery = useQuery({
    queryKey: ['ws', activeEntityId, 'projects', id, 'milestones'],
    queryFn: () => api.get<Milestone[]>(`/v1/workspaces/${activeEntityId}/projects/${id}/milestones`),
    enabled: !!activeEntityId && !!id,
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['ws', activeEntityId, 'projects', id] })
  }

  const project = projectQuery.data
  if (projectQuery.isLoading) return <LoadingSpinner />
  if (projectQuery.error || !project) return <ErrorState error={projectQuery.error} onRetry={() => projectQuery.refetch()} />

  return (
    <div>
      <PageHeader
        title={project.name}
        description={project.description || undefined}
        breadcrumbs={[{ label: 'Projects', href: '/projects' }, { label: project.name }]}
        actions={
          <Link to="/projects">
            <Button variant="outline"><ArrowLeft /> Back</Button>
          </Link>
        }
      />

      <div className="mb-6">
        <StatusBadge status={String(project.status ?? '')} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Tasks
              <Button variant="outline" size="sm" onClick={() => setTaskDialog(true)}><Plus /> Add task</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(tasksQuery.data ?? []).length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No tasks.</p>
            ) : (
              <ul className="divide-y divide-border">
                {(tasksQuery.data ?? []).map((task) => (
                  <li key={task.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{task.name}</p>
                      {task.assignee && <p className="text-xs text-muted-foreground">assigned to {String(task.assignee)}</p>}
                    </div>
                    <StatusBadge status={String(task.status ?? '')} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Milestones
              <Button variant="outline" size="sm" onClick={() => setMilestoneDialog(true)}><Plus /> Add milestone</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(milestonesQuery.data ?? []).length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No milestones.</p>
            ) : (
              <ul className="divide-y divide-border">
                {(milestonesQuery.data ?? []).map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="truncate text-sm font-medium">{m.name}</span>
                    <span className="text-xs text-muted-foreground">{String(m.due_date ?? '—')}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {taskDialog && (
        <TaskDialog projectId={id!} onOpenChange={setTaskDialog} onSaved={invalidate} />
      )}
      {milestoneDialog && (
        <MilestoneDialog projectId={id!} onOpenChange={setMilestoneDialog} onSaved={invalidate} />
      )}
    </div>
  )
}

function TaskDialog({ projectId, onOpenChange, onSaved }: { projectId: string; onOpenChange: (o: boolean) => void; onSaved: () => void }) {
  const { activeEntityId } = useWorkspace()
  const [name, setName] = useState('')
  const [status, setStatus] = useState('todo')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => api.post(`/v1/workspaces/${activeEntityId}/projects/${projectId}/tasks`, { name, status }),
    onSuccess: () => { onOpenChange(false); onSaved() },
    onError: (err) => setError(err instanceof ApiError ? err.detail : 'Unable to add task.'),
  })

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Add task</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="task-name">Name</Label>
            <Input id="task-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TASK_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function MilestoneDialog({ projectId, onOpenChange, onSaved }: { projectId: string; onOpenChange: (o: boolean) => void; onSaved: () => void }) {
  const { activeEntityId } = useWorkspace()
  const [name, setName] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => api.post(`/v1/workspaces/${activeEntityId}/projects/${projectId}/milestones`, { name, due_date: dueDate || null }),
    onSuccess: () => { onOpenChange(false); onSaved() },
    onError: (err) => setError(err instanceof ApiError ? err.detail : 'Unable to add milestone.'),
  })

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Add milestone</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="ms-name">Name</Label>
            <Input id="ms-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ms-due">Due date</Label>
            <Input id="ms-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
