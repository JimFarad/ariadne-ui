import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/spinner'
import { ErrorState } from '@/components/data/ErrorState'
import { useWorkspace } from '@/context/WorkspaceContext'
import { api, ApiError } from '@/lib/api/client'
import type { DocumentGrant, DocumentItem } from '@/types/api'

export function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { activeEntityId, workspaces } = useWorkspace()
  const queryClient = useQueryClient()
  const [entity, setEntity] = useState('')
  const [error, setError] = useState<string | null>(null)

  const documentQuery = useQuery({
    queryKey: ['ws', activeEntityId, 'documents', id],
    queryFn: () => api.get<DocumentItem>(`/v1/workspaces/${activeEntityId}/documents/${id}`),
    enabled: !!activeEntityId && !!id,
  })
  const grantsQuery = useQuery({
    queryKey: ['ws', activeEntityId, 'documents', id, 'grants'],
    queryFn: () => api.get<DocumentGrant[]>(`/v1/workspaces/${activeEntityId}/documents/${id}/grants`),
    enabled: !!activeEntityId && !!id,
  })

  const invalidateGrants = () => void queryClient.invalidateQueries({ queryKey: ['ws', activeEntityId, 'documents', id, 'grants'] })

  const addGrant = useMutation({
    mutationFn: () => api.post(`/v1/workspaces/${activeEntityId}/documents/${id}/grants`, { entity }),
    onSuccess: () => {
      setEntity('')
      setError(null)
      invalidateGrants()
    },
    onError: (err) => setError(err instanceof ApiError ? err.detail : 'Unable to grant access.'),
  })

  const revokeGrant = useMutation({
    mutationFn: (grantId: string) => api.delete(`/v1/workspaces/${activeEntityId}/documents/${id}/grants/${grantId}`),
    onSuccess: invalidateGrants,
  })

  const document = documentQuery.data
  if (documentQuery.isLoading) return <LoadingSpinner />
  if (documentQuery.error || !document) return <ErrorState error={documentQuery.error} onRetry={() => documentQuery.refetch()} />

  const targets = workspaces.filter((w) => w.id !== activeEntityId)
  const entityName = (entityId: string | null | undefined) =>
    workspaces.find((w) => w.id === entityId)?.name ?? entityId ?? '—'

  return (
    <div>
      <PageHeader
        title={document.title ?? document.name ?? 'Document'}
        breadcrumbs={[{ label: 'Documents', href: '/documents' }, { label: document.title ?? 'document' }]}
        actions={
          <Link to="/documents">
            <Button variant="outline"><ArrowLeft /> Back</Button>
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded bg-secondary px-2 py-0.5 font-mono text-xs">{document.type ?? '—'}</span>
        {(document.tags ?? []).map((t, i) => (
          <Badge key={i} variant="neutral">{t}</Badge>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Content</CardTitle></CardHeader>
          <CardContent>
            {document.content ? (
              <pre className="whitespace-pre-wrap font-sans text-sm">{document.content}</pre>
            ) : (
              <p className="text-sm text-muted-foreground">No content.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Access grants
              <span className="text-xs font-normal text-muted-foreground">share with other workspaces</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(grantsQuery.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Not shared with any workspace.</p>
            ) : (
              <ul className="divide-y divide-border">
                {(grantsQuery.data ?? []).map((g) => (
                  <li key={g.id} className="flex items-center justify-between gap-3 py-2">
                    <span className="font-mono text-xs">{entityName(g.entity_id)}</span>
                    <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => revokeGrant.mutate(g.id)} aria-label="Revoke">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <div className="space-y-1.5">
              <Label>Grant access to</Label>
              <Select value={entity} onValueChange={setEntity}>
                <SelectTrigger><SelectValue placeholder="Select workspace" /></SelectTrigger>
                <SelectContent>
                  {targets.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button onClick={() => addGrant.mutate()} disabled={!entity || addGrant.isPending}>
              {addGrant.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <Plus /> Grant
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
