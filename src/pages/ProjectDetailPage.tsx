import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { StatusBadge } from '@/components/StatusBadge'
import { ConfirmDialog } from '@/components/forms/ConfirmDialog'
import { LoadingSpinner } from '@/components/ui/spinner'
import { ErrorState } from '@/components/data/ErrorState'
import { useWorkspace } from '@/context/WorkspaceContext'
import { api, ApiError } from '@/lib/api/client'
import { formatDate } from '@/lib/utils'
import type { Milestone, Project, Task } from '@/types/api'

const TASK_STATUSES = ['todo', 'in_progress', 'done']
const PROJECT_STATUSES = ['planned', 'active', 'completed', 'cancelled']

function taskAssignee(task: Task): string {
  if (!task.assignee) return '—'
  if (typeof task.assignee === 'object') return task.assignee.name ?? task.assignee.id
  return String(task.assignee)
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { activeEntityId } = useWorkspace()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [taskDialog, setTaskDialog] = useState(false)
  const [milestoneDialog, setMilestoneDialog] = useState(false)
  const [editingProject, setEditingProject] = useState(false)
  const [deletingProject, setDeletingProject] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deletingTask, setDeletingTask] = useState<Task | null>(null)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [deletingMilestone, setDeletingMilestone] = useState<Milestone | null>(null)

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
    void queryClient.invalidateQueries({ queryKey: ['ws', activeEntityId, 'projects'] })
  }

  const deleteProjectMutation = useMutation({
    mutationFn: () => api.delete(`/v1/workspaces/${activeEntityId}/projects/${id}`),
    onSuccess: () => {
      setDeletingProject(false)
      void queryClient.invalidateQueries({ queryKey: ['ws', activeEntityId, 'projects'] })
      navigate('/projects')
    },
  })

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => api.delete(`/v1/workspaces/${activeEntityId}/projects/${id}/tasks/${taskId}`),
    onSuccess: () => {
      setDeletingTask(null)
      invalidate()
    },
  })

  const deleteMilestoneMutation = useMutation({
    mutationFn: (milestoneId: string) => api.delete(`/v1/workspaces/${activeEntityId}/projects/${id}/milestones/${milestoneId}`),
    onSuccess: () => {
      setDeletingMilestone(null)
      invalidate()
    },
  })

  const project = projectQuery.data
  if (projectQuery.isLoading) return <LoadingSpinner />
  if (projectQuery.error || !project) return <ErrorState error={projectQuery.error} onRetry={() => projectQuery.refetch()} />

  const progress = project.progress

  return (
    <div>
      <PageHeader
        title={project.name}
        description={project.description || undefined}
        breadcrumbs={[{ label: 'Projects', href: '/projects' }, { label: project.name }]}
        actions={
          <>
            <Button variant="outline" onClick={() => setEditingProject(true)}>
              <Pencil /> Edit
            </Button>
            <Button variant="outline" className="text-destructive" onClick={() => setDeletingProject(true)}>
              <Trash2 /> Delete
            </Button>
            <Link to="/projects">
              <Button variant="outline"><ArrowLeft /> Back</Button>
            </Link>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <StatusBadge status={String(project.status ?? '')} />
        {progress ? (
          <span className="text-xs text-muted-foreground">
            {progress.tasks_done ?? 0}/{progress.tasks_total ?? 0} tasks done
            {progress.percent != null ? ` · ${progress.percent}%` : ''}
          </span>
        ) : null}
        {project.due_date ? <span className="text-xs text-muted-foreground">due {formatDate(project.due_date)}</span> : null}
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
                      {task.assignee ? <p className="text-xs text-muted-foreground">assigned to {taskAssignee(task)}</p> : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <StatusBadge status={String(task.status ?? '')} />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label="Task actions"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setEditingTask(task)}><Pencil /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setDeletingTask(task)} className="text-destructive"><Trash2 /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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
                    <div className="min-w-0">
                      <span className="truncate text-sm font-medium">{m.name}</span>
                      {m.completed_at ? <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">completed</span> : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <span className="text-xs text-muted-foreground">{formatDate(m.due_date)}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label="Milestone actions"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setEditingMilestone(m)}><Pencil /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setDeletingMilestone(m)} className="text-destructive"><Trash2 /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {taskDialog && <TaskDialog projectId={id!} onOpenChange={setTaskDialog} onSaved={invalidate} />}
      {milestoneDialog && <MilestoneDialog projectId={id!} onOpenChange={setMilestoneDialog} onSaved={invalidate} />}
      {editingProject && <EditProjectDialog project={project} onOpenChange={setEditingProject} onSaved={invalidate} />}
      {editingTask && <EditTaskDialog projectId={id!} task={editingTask} onOpenChange={(open) => !open && setEditingTask(null)} onSaved={invalidate} />}
      {editingMilestone && <EditMilestoneDialog projectId={id!} milestone={editingMilestone} onOpenChange={(open) => !open && setEditingMilestone(null)} onSaved={invalidate} />}

      <ConfirmDialog
        open={deletingProject}
        onOpenChange={setDeletingProject}
        title="Delete project"
        description={`Delete project ${project.name}?`}
        confirmLabel="Delete"
        destructive
        loading={deleteProjectMutation.isPending}
        onConfirm={() => deleteProjectMutation.mutate()}
      />
      <ConfirmDialog
        open={deletingTask !== null}
        onOpenChange={(open) => !open && setDeletingTask(null)}
        title="Delete task"
        description={`Delete task ${deletingTask?.name ?? ''}?`}
        confirmLabel="Delete"
        destructive
        loading={deleteTaskMutation.isPending}
        onConfirm={() => deletingTask && deleteTaskMutation.mutate(deletingTask.id)}
      />
      <ConfirmDialog
        open={deletingMilestone !== null}
        onOpenChange={(open) => !open && setDeletingMilestone(null)}
        title="Delete milestone"
        description={`Delete milestone ${deletingMilestone?.name ?? ''}?`}
        confirmLabel="Delete"
        destructive
        loading={deleteMilestoneMutation.isPending}
        onConfirm={() => deletingMilestone && deleteMilestoneMutation.mutate(deletingMilestone.id)}
      />
    </div>
  )
}

function EditProjectDialog({ project, onOpenChange, onSaved }: { project: Project; onOpenChange: (o: boolean) => void; onSaved: () => void }) {
  const { activeEntityId } = useWorkspace()
  const [name, setName] = useState(project.name)
  const [status, setStatus] = useState(String(project.status ?? 'planned'))
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => api.patch(`/v1/workspaces/${activeEntityId}/projects/${project.id}`, { name, status }),
    onSuccess: () => { onOpenChange(false); onSaved() },
    onError: (err) => setError(err instanceof ApiError ? err.detail : 'Unable to update project.'),
  })

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Edit project</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="ep-name">Name</Label>
            <Input id="ep-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROJECT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditTaskDialog({ projectId, task, onOpenChange, onSaved }: { projectId: string; task: Task; onOpenChange: (o: boolean) => void; onSaved: () => void }) {
  const { activeEntityId } = useWorkspace()
  const [name, setName] = useState(task.name ?? '')
  const [status, setStatus] = useState(String(task.status ?? 'todo'))
  const [dueDate, setDueDate] = useState(task.due_date ?? '')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      api.patch(`/v1/workspaces/${activeEntityId}/projects/${projectId}/tasks/${task.id}`, {
        name,
        status,
        due_date: dueDate || null,
      }),
    onSuccess: () => { onOpenChange(false); onSaved() },
    onError: (err) => setError(err instanceof ApiError ? err.detail : 'Unable to update task.'),
  })

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Edit task</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="et-name">Name</Label>
            <Input id="et-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="et-due">Due date</Label>
              <Input id="et-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditMilestoneDialog({ projectId, milestone, onOpenChange, onSaved }: { projectId: string; milestone: Milestone; onOpenChange: (o: boolean) => void; onSaved: () => void }) {
  const { activeEntityId } = useWorkspace()
  const [name, setName] = useState(milestone.name ?? '')
  const [dueDate, setDueDate] = useState(milestone.due_date ?? '')
  const [completed, setCompleted] = useState(!!milestone.completed_at)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      api.patch(`/v1/workspaces/${activeEntityId}/projects/${projectId}/milestones/${milestone.id}`, {
        name,
        due_date: dueDate || null,
        completed_at: completed ? new Date().toISOString() : null,
      }),
    onSuccess: () => { onOpenChange(false); onSaved() },
    onError: (err) => setError(err instanceof ApiError ? err.detail : 'Unable to update milestone.'),
  })

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Edit milestone</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="em-name">Name</Label>
            <Input id="em-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="em-due">Due date</Label>
            <Input id="em-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={completed} onChange={(e) => setCompleted(e.target.checked)} className="h-4 w-4" />
            Completed
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
