import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Inbox, Loader2, Plus, RotateCw, Trash2, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusBadge } from '@/components/StatusBadge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/ui/spinner'
import { useWorkspace } from '@/context/WorkspaceContext'
import { api, ApiError } from '@/lib/api/client'
import { formatDateTime } from '@/lib/utils'
import type { InvoiceIntakeConfig, InvoiceIntakeMessage, InvoiceIntakeSender } from '@/types/api'

export function IntakePage() {
  const { activeEntityId } = useWorkspace()
  const queryClient = useQueryClient()
  const [createConfig, setCreateConfig] = useState(false)
  const [editingConfig, setEditingConfig] = useState<InvoiceIntakeConfig | null>(null)
  const [sendersFor, setSendersFor] = useState<InvoiceIntakeConfig | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<InvoiceIntakeMessage | null>(null)
  const messagesQuery = useQuery({
    queryKey: ['ws', activeEntityId, 'invoice-intake-messages'],
    queryFn: () => api.get<InvoiceIntakeMessage[]>(`/v1/workspaces/${activeEntityId}/invoice-intake-messages`),
    enabled: !!activeEntityId,
  })
  const configsQuery = useQuery({
    queryKey: ['ws', activeEntityId, 'invoice-intake-configs'],
    queryFn: () => api.get<InvoiceIntakeConfig[]>(`/v1/workspaces/${activeEntityId}/invoice-intake-configs`),
    enabled: !!activeEntityId,
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['ws', activeEntityId, 'invoice-intake-messages'] })
    void queryClient.invalidateQueries({ queryKey: ['ws', activeEntityId, 'invoice-intake-configs'] })
  }

  const messageAction = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'release' | 'reject' | 'retry' }) =>
      api.post(`/v1/workspaces/${activeEntityId}/invoice-intake-messages/${id}/${action}`),
    onSuccess: () => {
      setSelectedMessage(null)
      invalidate()
    },
  })

  const rotateConfig = useMutation({
    mutationFn: (id: string) => api.post(`/v1/workspaces/${activeEntityId}/invoice-intake-configs/${id}/rotate`),
    onSuccess: invalidate,
  })

  const revokeConfig = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/workspaces/${activeEntityId}/invoice-intake-configs/${id}`),
    onSuccess: invalidate,
  })

  return (
    <div>
      <PageHeader title="Invoice intake" description="Inbound invoice routing and review." />

      <Tabs defaultValue="messages">
        <TabsList>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="configs">Configurations</TabsTrigger>
        </TabsList>

        <TabsContent value="messages">
          {messagesQuery.isLoading ? (
            <LoadingSpinner />
          ) : (messagesQuery.data ?? []).length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No intake messages.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {(messagesQuery.data ?? []).map((m) => (
                <Card key={m.id}>
                  <CardContent className="flex items-center justify-between gap-4 py-3.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Inbox className="h-4 w-4 text-muted-foreground" />
                        <p className="truncate text-sm font-medium">{String(m.subject ?? '(no subject)')}</p>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        from {String(m.from_address ?? '—')} · {formatDateTime(String(m.received_at ?? ''))}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusBadge status={String(m.status ?? '')} />
                      <Button variant="outline" size="sm" onClick={() => setSelectedMessage(m)}>
                        Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="configs">
          <div className="mb-3">
            <Button onClick={() => setCreateConfig(true)}>
              <Plus /> New configuration
            </Button>
          </div>
          <div className="space-y-2">
            {(configsQuery.data ?? []).map((c) => (
              <Card key={c.id}>
                <CardContent className="flex items-center justify-between gap-4 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{String(c.name ?? '')}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {String(c.category ?? '')} · {String(c.purpose ?? '')}
                    </p>
                    {c.address && <p className="mt-1 font-mono text-xs text-muted-foreground">{String(c.address)}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={String(c.status ?? '')} />
                    <Button variant="outline" size="sm" onClick={() => setSendersFor(c)}>
                      Senders
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditingConfig(c)}>
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => rotateConfig.mutate(c.id)}>
                      <RotateCw className="h-3.5 w-3.5" /> Rotate
                    </Button>
                    <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => revokeConfig.mutate(c.id)} aria-label="Revoke">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(configsQuery.data ?? []).length === 0 && !configsQuery.isLoading && (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  No intake configurations.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {createConfig && <CreateConfigDialog onOpenChange={setCreateConfig} onSaved={invalidate} />}
      {editingConfig && (
        <EditConfigDialog config={editingConfig} onOpenChange={(open) => !open && setEditingConfig(null)} onSaved={invalidate} />
      )}
      {sendersFor && (
        <SendersDialog config={sendersFor} onOpenChange={(open) => !open && setSendersFor(null)} />
      )}

      <Dialog open={selectedMessage !== null} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{String(selectedMessage?.subject ?? '(no subject)')}</DialogTitle>
            <DialogDescription>from {String(selectedMessage?.from_address ?? '—')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={String(selectedMessage?.status ?? '')} />
              <Badge variant="neutral">transport: {String(selectedMessage?.transport ?? '—')}</Badge>
              <Badge variant="neutral">{String(selectedMessage?.attachment_count ?? 0)} attachments</Badge>
            </div>
            {selectedMessage?.error ? <p className="text-xs text-destructive">{String(selectedMessage.error)}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => selectedMessage && messageAction.mutate({ id: selectedMessage.id, action: 'reject' })}>
              Reject
            </Button>
            <Button variant="outline" onClick={() => selectedMessage && messageAction.mutate({ id: selectedMessage.id, action: 'retry' })}>
              Retry
            </Button>
            <Button
              onClick={() => selectedMessage && messageAction.mutate({ id: selectedMessage.id, action: 'release' })}
              disabled={messageAction.isPending}
            >
              {messageAction.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Release
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CreateConfigDialog({ onOpenChange, onSaved }: { onOpenChange: (o: boolean) => void; onSaved: () => void }) {
  const { activeEntityId } = useWorkspace()
  const [name, setName] = useState('')
  const [purpose, setPurpose] = useState('')
  const [category, setCategory] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => api.post(`/v1/workspaces/${activeEntityId}/invoice-intake-configs`, { name, purpose: purpose || null, category: category || null }),
    onSuccess: () => { onOpenChange(false); onSaved() },
    onError: (err) => setError(err instanceof ApiError ? err.detail : 'Unable to create configuration.'),
  })

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New intake configuration</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="ic-name">Name</Label>
            <Input id="ic-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ic-purpose">Purpose</Label>
            <Input id="ic-purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ic-category">Category</Label>
            <Input id="ic-category" value={category} onChange={(e) => setCategory(e.target.value)} />
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

function EditConfigDialog({
  config,
  onOpenChange,
  onSaved,
}: {
  config: InvoiceIntakeConfig
  onOpenChange: (o: boolean) => void
  onSaved: () => void
}) {
  const { activeEntityId } = useWorkspace()
  const [name, setName] = useState(config.name ?? '')
  const [description, setDescription] = useState(config.description ?? '')
  const [category, setCategory] = useState(config.category ?? '')
  const [purpose, setPurpose] = useState(config.purpose ?? '')
  const [trustPolicyMode, setTrustPolicyMode] = useState(config.trust_policy_mode ?? 'permissive')
  const [maxAttachmentMb, setMaxAttachmentMb] = useState(config.max_attachment_mb != null ? String(config.max_attachment_mb) : '25')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      api.patch(`/v1/workspaces/${activeEntityId}/invoice-intake-configs/${config.id}`, {
        name,
        description: description || null,
        category: category || null,
        purpose: purpose || null,
        trust_policy_mode: trustPolicyMode,
        max_attachment_mb: maxAttachmentMb ? Number(maxAttachmentMb) : undefined,
      }),
    onSuccess: () => { onOpenChange(false); onSaved() },
    onError: (err) => setError(err instanceof ApiError ? err.detail : 'Unable to update configuration.'),
  })

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Edit configuration</DialogTitle></DialogHeader>
        <div className="grid max-h-[60vh] gap-4 overflow-y-auto">
          <div className="space-y-1.5">
            <Label htmlFor="ecf-name">Name</Label>
            <Input id="ecf-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ecf-desc">Description</Label>
            <Input id="ecf-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ecf-cat">Category</Label>
              <Input id="ecf-cat" value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ecf-purpose">Purpose</Label>
              <Input id="ecf-purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Trust policy</Label>
              <Select value={trustPolicyMode} onValueChange={setTrustPolicyMode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="permissive">Permissive</SelectItem>
                  <SelectItem value="strict">Strict</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ecf-max">Max attachment (MB)</Label>
              <Input id="ecf-max" type="number" min={1} max={100} value={maxAttachmentMb} onChange={(e) => setMaxAttachmentMb(e.target.value)} />
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

function SendersDialog({
  config,
  onOpenChange,
}: {
  config: InvoiceIntakeConfig
  onOpenChange: (o: boolean) => void
}) {
  const { activeEntityId } = useWorkspace()
  const queryClient = useQueryClient()
  const [kind, setKind] = useState('address')
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const sendersKey = ['ws', activeEntityId, 'invoice-intake-configs', config.id, 'senders']

  const sendersQuery = useQuery({
    queryKey: sendersKey,
    queryFn: () => api.get<InvoiceIntakeSender[]>(`/v1/workspaces/${activeEntityId}/invoice-intake-configs/${config.id}/senders`),
    enabled: !!activeEntityId && !!config.id,
  })

  const addMutation = useMutation({
    mutationFn: () => api.post(`/v1/workspaces/${activeEntityId}/invoice-intake-configs/${config.id}/senders`, { kind, value }),
    onSuccess: () => {
      setValue('')
      setError(null)
      void queryClient.invalidateQueries({ queryKey: sendersKey })
    },
    onError: (err) => setError(err instanceof ApiError ? err.detail : 'Unable to add sender.'),
  })

  const removeMutation = useMutation({
    mutationFn: (senderId: string) => api.delete(`/v1/workspaces/${activeEntityId}/invoice-intake-configs/${config.id}/senders/${senderId}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: sendersKey }),
  })

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Trusted senders</DialogTitle>
          <DialogDescription>Allowlist senders for {String(config.name ?? '')}.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-2">
            {(sendersQuery.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No trusted senders.</p>
            ) : (
              <ul className="divide-y divide-border">
                {(sendersQuery.data ?? []).map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <span className="font-mono text-xs">{String(s.value ?? '')}</span>
                      <span className="ml-2 rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">{String(s.kind ?? '')}</span>
                    </div>
                    <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => removeMutation.mutate(s.id)} aria-label="Remove sender">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Kind</Label>
              <Select value={kind} onValueChange={setKind}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="address">Address</SelectItem>
                  <SelectItem value="domain">Domain</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="is-value">Value</Label>
              <Input id="is-value" value={value} onChange={(e) => setValue(e.target.value)} placeholder="billing@example.com" />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={() => addMutation.mutate()} disabled={!value.trim() || addMutation.isPending}>
            {addMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
