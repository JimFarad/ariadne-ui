import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/data/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import type { DocumentItem } from '@/types/api'

export function DocumentsPage() {
  const { activeEntityId } = useWorkspace()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<DocumentItem | null>(null)
  const [deleting, setDeleting] = useState<DocumentItem | null>(null)

  const query = useQuery({
    queryKey: ['ws', activeEntityId, 'documents'],
    queryFn: () => api.get<DocumentItem[]>(`/v1/workspaces/${activeEntityId}/documents`),
    enabled: !!activeEntityId,
  })

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['ws', activeEntityId, 'documents'] })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/workspaces/${activeEntityId}/documents/${id}`),
    onSuccess: () => {
      setDeleting(null)
      invalidate()
    },
  })

  const columns: Column<DocumentItem>[] = [
    {
      key: 'title',
      header: 'Title',
      cell: (r) => (
        <Link to={`/documents/${r.id}`} className="font-medium hover:underline">
          {String(r.title ?? r.name ?? '')}
        </Link>
      ),
    },
    { key: 'type', header: 'Type', cell: (r) => <span className="font-mono text-xs">{String(r.type ?? '—')}</span> },
    { key: 'created_at', header: 'Created', cell: (r) => <span className="text-xs text-muted-foreground">{formatDateTime(r.created_at)}</span> },
    {
      key: '__actions',
      header: '',
      headerClassName: 'w-[110px]',
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => setEditing(r)} aria-label="Edit">
            <Pencil className="h-4 w-4" />
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
        title="Documents"
        description="Documents and runbooks with cross-workspace access grants."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> New document
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
        emptyTitle="No documents"
        emptyDescription="Create your first document."
      />

      {createOpen && <DocumentDialog editing={null} onOpenChange={setCreateOpen} onSaved={invalidate} />}
      {editing && <DocumentDialog editing={editing} onOpenChange={(open) => !open && setEditing(null)} onSaved={invalidate} />}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete document"
        description={`Delete document ${deleting?.title ?? ''}?`}
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  )
}

function DocumentDialog({
  editing,
  onOpenChange,
  onSaved,
}: {
  editing: DocumentItem | null
  onOpenChange: (o: boolean) => void
  onSaved: () => void
}) {
  const { activeEntityId } = useWorkspace()
  const [title, setTitle] = useState(editing?.title ?? '')
  const [type, setType] = useState(editing?.type ?? 'article')
  const [content, setContent] = useState(editing?.content ?? '')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => {
      const payload = editing
        ? { title, content: content || null }
        : { title, type, content: content || null }
      return editing
        ? api.patch(`/v1/workspaces/${activeEntityId}/documents/${editing.id}`, payload)
        : api.post(`/v1/workspaces/${activeEntityId}/documents`, payload)
    },
    onSuccess: () => { onOpenChange(false); onSaved() },
    onError: (err) => setError(err instanceof ApiError ? err.detail : 'Unable to save document.'),
  })

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{editing ? 'Edit document' : 'New document'}</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="doc-title">Title</Label>
            <Input id="doc-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          {!editing && (
            <div className="space-y-1.5">
              <Label htmlFor="doc-type">Type</Label>
              <Input id="doc-type" value={type} onChange={(e) => setType(e.target.value)} placeholder="article" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="doc-content">Content</Label>
            <Textarea id="doc-content" value={content} onChange={(e) => setContent(e.target.value)} rows={6} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!title.trim() || mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
