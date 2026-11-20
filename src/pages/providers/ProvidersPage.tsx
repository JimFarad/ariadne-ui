import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
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
import { LoadingSpinner } from '@/components/ui/spinner'
import { ErrorState } from '@/components/data/ErrorState'
import { EmptyState } from '@/components/data/EmptyState'
import { useWorkspace } from '@/context/WorkspaceContext'
import { api, ApiError } from '@/lib/api/client'
import { fetchCredentialSchema } from '@/lib/providers/credentials'
import { formatDateTime } from '@/lib/utils'
import type { Provider } from '@/types/api'

type Row = Record<string, unknown> & { id: string }

/* ------------------------------------------------------------------ */
/* Connections                                                        */
/* ------------------------------------------------------------------ */
export function ConnectionsPage() {
  const { activeEntityId } = useWorkspace()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)

  const query = useQuery({
    queryKey: ['ws', activeEntityId, 'provider-connections'],
    queryFn: () => api.get<Row[]>(`/v1/workspaces/${activeEntityId}/provider-connections`),
    enabled: !!activeEntityId,
  })
  const providersQuery = useQuery({
    queryKey: ['providers'],
    queryFn: () => api.get<Provider[]>('/v1/providers'),
    enabled: !!activeEntityId,
  })

  const syncMutation = useMutation({
    mutationFn: (id: string) => api.post(`/v1/workspaces/${activeEntityId}/provider-connections/${id}/sync`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['ws', activeEntityId, 'provider-connections'] }),
  })

  return (
    <div>
      <PageHeader
        title="Provider connections"
        description="Connected external providers."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> Connect provider
          </Button>
        }
      />

      {query.isLoading ? (
        <LoadingSpinner />
      ) : query.error ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (query.data ?? []).length === 0 ? (
        <EmptyState title="No connections" description="Connect your first provider." />
      ) : (
        <div className="space-y-2">
          {(query.data ?? []).map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center justify-between gap-4 py-3.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{String(c.name ?? '')}</p>
                    <StatusBadge status={String(c.status ?? '')} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {c.provider && typeof c.provider === 'object' && c.provider !== null
                      ? String((c.provider as Record<string, unknown>).name ?? (c.provider as Record<string, unknown>).slug)
                      : String(c.provider ?? '')}
                    {c.region ? ` · region ${String(c.region)}` : ''}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => syncMutation.mutate(c.id)} disabled={syncMutation.isPending}>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Sync
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {createOpen && (
        <CreateConnectionDialog
          providers={providersQuery.data ?? []}
          onOpenChange={setCreateOpen}
          onSaved={() => void queryClient.invalidateQueries({ queryKey: ['ws', activeEntityId, 'provider-connections'] })}
        />
      )}
    </div>
  )
}

function CreateConnectionDialog({
  providers,
  onOpenChange,
  onSaved,
}: {
  providers: Provider[]
  onOpenChange: (o: boolean) => void
  onSaved: () => void
}) {
  const { activeEntityId } = useWorkspace()
  const [provider, setProvider] = useState('')
  const [name, setName] = useState('')
  const [region, setRegion] = useState('')
  const [credValues, setCredValues] = useState<Record<string, string>>({})
  const [advancedConfig, setAdvancedConfig] = useState('')
  const [error, setError] = useState<string | null>(null)

  const selectedProvider = providers.find((p) => p.slug === provider) ?? null

  const schemaQuery = useQuery({
    queryKey: ['provider-credential-schema', provider],
    queryFn: () => fetchCredentialSchema(provider),
    enabled: !!provider,
    staleTime: 60_000,
  })

  const schema = schemaQuery.data?.credential_schema ?? null
  const schemaLoading = !!provider && schemaQuery.isLoading

  const setCred = (key: string, value: string) => {
    setCredValues((prev) => ({ ...prev, [key]: value }))
  }

  const mutation = useMutation({
    mutationFn: () => {
      const credentials: Record<string, string> = {}
      for (const [key, value] of Object.entries(credValues)) {
        if (value !== '') credentials[key] = value
      }

      let config: Record<string, unknown> | undefined
      if (advancedConfig.trim() !== '') {
        try {
          config = JSON.parse(advancedConfig)
        } catch {
          throw new Error('Advanced config must be valid JSON.')
        }
      }

      return api.post(`/v1/workspaces/${activeEntityId}/provider-connections`, {
        provider,
        name,
        region: region || null,
        credentials,
        config,
      })
    },
    onSuccess: () => { onOpenChange(false); onSaved() },
    onError: (err) => setError(err instanceof ApiError ? err.detail : err instanceof Error ? err.message : 'Connection failed.'),
  })

  const requiredMissing = schema?.fields.some((f) => f.required && !credValues[f.key]?.trim()) ?? false

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect provider</DialogTitle>
          <DialogDescription>Credentials are encrypted at rest and never returned by the API.</DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[60vh] gap-4 overflow-y-auto">
          <div className="space-y-1.5">
            <Label>Provider</Label>
            <Select
              value={provider}
              onValueChange={(slug) => {
                setProvider(slug)
                setRegion('')
                setCredValues({})
              }}
            >
              <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.slug} value={p.slug}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pc-name">Name</Label>
            <Input id="pc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Cloudflare account" />
          </div>

          {selectedProvider && (selectedProvider.regions ?? []).length > 0 && (
            <div className="space-y-1.5">
              <Label>Region</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                <SelectContent>
                  {selectedProvider.regions!.map((r) => (
                    <SelectItem key={r.slug} value={r.slug}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {schemaLoading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading credential fields…
            </p>
          )}

          {schemaQuery.isError && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <p>Could not load credential fields for this provider.</p>
              <button type="button" className="mt-1 underline underline-offset-2" onClick={() => schemaQuery.refetch()}>
                Retry
              </button>
            </div>
          )}

          {schema && (
            <>
              {schema.note && <p className="text-xs text-muted-foreground">{schema.note}</p>}
              {schema.fields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label htmlFor={`cred-${field.key}`}>
                    {field.label}
                    {field.required && <span className="ml-0.5 text-destructive">*</span>}
                  </Label>
                  {field.type === 'textarea' ? (
                    <Textarea
                      id={`cred-${field.key}`}
                      value={credValues[field.key] ?? ''}
                      onChange={(e) => setCred(field.key, e.target.value)}
                      rows={4}
                      className="font-mono text-xs"
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <Input
                      id={`cred-${field.key}`}
                      type={field.type === 'password' ? 'password' : 'text'}
                      value={credValues[field.key] ?? ''}
                      onChange={(e) => setCred(field.key, e.target.value)}
                      autoComplete="off"
                      placeholder={field.placeholder}
                    />
                  )}
                  {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
                </div>
              ))}
            </>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="pc-config">Advanced config (JSON, optional)</Label>
            <Textarea
              id="pc-config"
              value={advancedConfig}
              onChange={(e) => setAdvancedConfig(e.target.value)}
              rows={2}
              className="font-mono text-xs"
              placeholder={'{\n  "account_id": "…"\n}'}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!provider || !name.trim() || requiredMissing || mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Connect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */
/* Resources (unified inventory)                                      */
/* ------------------------------------------------------------------ */
export function ResourcesPage() {
  const { activeEntityId } = useWorkspace()
  const [filter, setFilter] = useState('')

  const query = useQuery({
    queryKey: ['ws', activeEntityId, 'provider-resources'],
    queryFn: () => api.get<Row[]>(`/v1/workspaces/${activeEntityId}/provider-resources`),
    enabled: !!activeEntityId,
  })

  const resources = query.data ?? []
  const providers = useMemo(() => Array.from(new Set(resources.map((r) => String(r.provider ?? '')))).filter(Boolean), [resources])
  const types = useMemo(() => Array.from(new Set(resources.map((r) => String(r.type ?? '')))).filter(Boolean), [resources])

  const filtered = filter
    ? resources.filter((r) => String(r.provider ?? '') === filter || String(r.type ?? '') === filter)
    : resources

  return (
    <div>
      <PageHeader title="Provider resources" description="Unified inventory across connected providers." />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Filter by provider or type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All resources</SelectItem>
            {providers.map((p) => <SelectItem key={`p:${p}`} value={p}>provider: {p}</SelectItem>)}
            {types.map((t) => <SelectItem key={`t:${t}`} value={t}>type: {t}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} resources</span>
      </div>

      {query.isLoading ? (
        <LoadingSpinner />
      ) : query.error ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No resources" description="Sync a provider connection to populate the inventory." />
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex items-center justify-between gap-4 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{String(r.name ?? r.external_id ?? '')}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {String(r.external_id ?? '')}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-xs">{String(r.provider ?? '')}</span>
                  <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-xs">{String(r.type ?? '')}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Accounts                                                           */
/* ------------------------------------------------------------------ */
export function AccountsPage() {
  const { activeEntityId } = useWorkspace()

  const query = useQuery({
    queryKey: ['ws', activeEntityId, 'provider-accounts'],
    queryFn: () => api.get<Row[]>(`/v1/workspaces/${activeEntityId}/provider-accounts`),
    enabled: !!activeEntityId,
  })

  return (
    <div>
      <PageHeader title="Provider accounts" description="Shared provider accounts." />
      {query.isLoading ? (
        <LoadingSpinner />
      ) : query.error ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (query.data ?? []).length === 0 ? (
        <EmptyState title="No accounts" />
      ) : (
        <div className="space-y-2">
          {(query.data ?? []).map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-center justify-between gap-4 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{String(a.name ?? a.id)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{String(a.provider ?? '')}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Sync history                                                       */
/* ------------------------------------------------------------------ */
export function SyncsPage() {
  const { activeEntityId } = useWorkspace()

  const query = useQuery({
    queryKey: ['ws', activeEntityId, 'provider-syncs'],
    queryFn: () => api.get<Row[]>(`/v1/workspaces/${activeEntityId}/provider-syncs`),
    enabled: !!activeEntityId,
  })

  return (
    <div>
      <PageHeader title="Sync history" description="Provider synchronization runs." />
      {query.isLoading ? (
        <LoadingSpinner />
      ) : query.error ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (query.data ?? []).length === 0 ? (
        <EmptyState title="No syncs" />
      ) : (
        <div className="space-y-2">
          {(query.data ?? []).map((s) => (
            <Card key={s.id}>
              <CardContent className="flex items-center justify-between gap-4 py-3.5">
                <div className="flex items-center gap-2">
                  <StatusBadge status={String(s.status ?? '')} />
                  <span className="text-sm text-muted-foreground">
                    {formatDateTime(String(s.started_at ?? ''))}
                    {s.finished_at ? ` → ${formatDateTime(String(s.finished_at))}` : ''}
                  </span>
                </div>
                {s.error ? <span className="truncate text-xs text-destructive">{String(s.error)}</span> : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
