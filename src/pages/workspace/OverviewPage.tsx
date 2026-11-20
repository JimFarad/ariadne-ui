import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Check, Loader2, Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
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
import { useWorkspace } from '@/context/WorkspaceContext'
import { ApiError } from '@/lib/api/client'
import { formatDateTime, shortId } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { Entity } from '@/types/api'

export function WorkspaceOverviewPage() {
  const { workspaces, workspacesLoading, activeEntity, switchEntity, createWorkspace } = useWorkspace()
  const [createOpen, setCreateOpen] = useState(false)
  const [type, setType] = useState('organization')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: () => createWorkspace({ type, name, description: description || null }),
    onSuccess: () => {
      setCreateOpen(false)
      setName('')
      setDescription('')
      setError(null)
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.detail : 'Unable to create workspace.')
    },
  })

  return (
    <div>
      <PageHeader
        title="Workspaces"
        description="Manage the workspaces you belong to."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus />
            New workspace
          </Button>
        }
      />

      {activeEntity && (
        <Card className="mb-6">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent">
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">{activeEntity.name}</p>
                <p className="text-xs text-muted-foreground">
                  {activeEntity.type} · {shortId(activeEntity.id)}
                </p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {activeEntity.owner ? `Owner: ${activeEntity.owner.name}` : ''}
              {activeEntity.created_at ? ` · created ${formatDateTime(activeEntity.created_at)}` : ''}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {workspacesLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : workspaces.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            You don't belong to any workspaces yet.
          </p>
        ) : (
          workspaces.map((ws: Entity) => (
            <Card key={ws.id}>
              <CardContent className="flex items-center justify-between gap-4 py-3.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{ws.name}</p>
                    <Badge variant="neutral">{ws.type}</Badge>
                    {ws.id === activeEntity?.id && <Badge variant="default">Active</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {ws.owner ? `${ws.owner.name} · ` : ''}
                    {shortId(ws.id)}
                  </p>
                </div>
                {ws.id !== activeEntity?.id && (
                  <Button variant="outline" size="sm" onClick={() => switchEntity(ws.id)}>
                    Switch
                  </Button>
                )}
                {ws.id === activeEntity?.id && <Check className="h-4 w-4 text-primary" />}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create workspace</DialogTitle>
            <DialogDescription>A workspace is a top-level container for your operational data.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ws-type">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="ws-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="organization">Organization</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ws-name">Name</Label>
              <Input id="ws-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Inc" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ws-desc">Description</Label>
              <Input id="ws-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!name.trim() || createMutation.isPending}
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
