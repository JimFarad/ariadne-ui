import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, KeyRound, Loader2, Plus, Trash2 } from 'lucide-react'
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
import { ConfirmDialog } from '@/components/forms/ConfirmDialog'
import { LoadingSpinner } from '@/components/ui/spinner'
import { ErrorState } from '@/components/data/ErrorState'
import { EmptyState } from '@/components/data/EmptyState'
import { api, ApiError } from '@/lib/api/client'
import { formatDateTime } from '@/lib/utils'
import type { ApiToken } from '@/types/api'

interface CreatedToken {
  id: string
  name: string
  token: string
  expires_at?: string | null
}

export function TokensPage() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [created, setCreated] = useState<CreatedToken | null>(null)
  const [deleting, setDeleting] = useState<ApiToken | null>(null)
  const [copied, setCopied] = useState(false)

  const query = useQuery({
    queryKey: ['tokens'],
    queryFn: () => api.get<ApiToken[]>('/v1/tokens'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/tokens/${id}`),
    onSuccess: () => {
      setDeleting(null)
      void queryClient.invalidateQueries({ queryKey: ['tokens'] })
    },
  })

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div>
      <PageHeader
        title="API tokens"
        description="Machine-identity tokens for server-to-server access."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> New token
          </Button>
        }
      />

      {query.isLoading ? (
        <LoadingSpinner />
      ) : query.error ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (query.data ?? []).length === 0 ? (
        <EmptyState title="No tokens" description="Create a token for API access." />
      ) : (
        <div className="space-y-2">
          {(query.data ?? []).map((t) => (
            <Card key={t.id}>
              <CardContent className="flex items-center justify-between gap-4 py-3.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                    <p className="truncate text-sm font-medium">{t.name}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t.expires_at ? `expires ${formatDateTime(String(t.expires_at))}` : 'never expires'}
                    {t.last_used_at ? ` · last used ${formatDateTime(String(t.last_used_at))}` : ''}
                  </p>
                </div>
                <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => setDeleting(t)} aria-label="Revoke">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {createOpen && <CreateTokenDialog onOpenChange={setCreateOpen} onCreated={setCreated} />}

      <Dialog open={created !== null} onOpenChange={(open) => !open && setCreated(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Token created</DialogTitle>
            <DialogDescription>Copy this token now — it will not be shown again.</DialogDescription>
          </DialogHeader>
          {created && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input readOnly value={created.token} className="font-mono text-xs" />
                <Button variant="outline" size="icon" onClick={() => copy(created.token)} aria-label="Copy">
                  {copied ? <span className="text-xs">✓</span> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {created.name} · {created.expires_at ? `expires ${formatDateTime(created.expires_at)}` : 'never expires'}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setCreated(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Revoke token"
        description="Revoking a token immediately invalidates it."
        confirmLabel="Revoke"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  )
}

function CreateTokenDialog({
  onOpenChange,
  onCreated,
}: {
  onOpenChange: (o: boolean) => void
  onCreated: (token: CreatedToken) => void
}) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => api.post<CreatedToken>('/v1/tokens', { name, expires_at: expiresAt || null }),
    onSuccess: (token) => {
      onOpenChange(false)
      setName('')
      setExpiresAt('')
      void queryClient.invalidateQueries({ queryKey: ['tokens'] })
      onCreated(token)
    },
    onError: (err) => setError(err instanceof ApiError ? err.detail : 'Unable to create token.'),
  })

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create API token</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="tk-name">Name</Label>
            <Input id="tk-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tk-exp">Expires at (optional)</Label>
            <Input id="tk-exp" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
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
