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
import { formatDate } from '@/lib/utils'
import type { Domain } from '@/types/api'

export function DomainsPage() {
  const { activeEntityId } = useWorkspace()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const list = usePaginatedList<Domain>((e) => `/v1/workspaces/${e}/domains`)

  const columns: Column<Domain>[] = [
    {
      key: 'name',
      header: 'Domain',
      cell: (r) => (
        <Link to={`/domains/${r.id}`} className="font-medium hover:underline">
          {r.name}
        </Link>
      ),
    },
    { key: 'registrar', header: 'Registrar', cell: (r) => <span>{r.registrar ?? '—'}</span> },
    { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={String(r.status ?? '')} /> },
    { key: 'expires_at', header: 'Expires', cell: (r) => formatDate(String(r.expires_at ?? '')) },
  ]

  return (
    <div>
      <PageHeader
        title="Domains & DNS"
        description="Domain inventory and DNS records."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus />
            Add domain
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
        emptyTitle="No domains"
        emptyDescription="Add a domain to start managing DNS."
      />

      <CreateDomainDialog
        open={open}
        onOpenChange={setOpen}
        onCreated={() => {
          void queryClient.invalidateQueries({ queryKey: ['ws', activeEntityId, `/v1/workspaces/${activeEntityId}/domains`] })
        }}
      />
    </div>
  )
}

function CreateDomainDialog({
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
  const [registrar, setRegistrar] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      api.post(`/v1/workspaces/${activeEntityId}/domains`, {
        name,
        registrar: registrar || null,
      }),
    onSuccess: () => {
      onOpenChange(false)
      setName('')
      setRegistrar('')
      onCreated()
    },
    onError: (err) => setError(err instanceof ApiError ? err.detail : 'Unable to add domain.'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add domain</DialogTitle>
          <DialogDescription>Add a domain to the inventory.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="dom-name">Domain name</Label>
            <Input id="dom-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="example.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dom-reg">Registrar (optional)</Label>
            <Input id="dom-reg" value={registrar} onChange={(e) => setRegistrar(e.target.value)} />
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
