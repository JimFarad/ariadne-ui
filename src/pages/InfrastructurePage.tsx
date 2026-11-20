import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Loader2, Plus, X } from 'lucide-react'
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
import { formatMoney } from '@/lib/utils'
import type { InfrastructureResource, IpAddress } from '@/types/api'

const TYPES = ['server', 'vps', 'host', 'vm', 'container']
const STATUSES = ['online', 'offline', 'maintenance', 'unknown']

export function InfrastructurePage() {
  const { activeEntityId } = useWorkspace()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<InfrastructureResource | null>(null)

  const list = usePaginatedList<InfrastructureResource>((e) => `/v1/workspaces/${e}/infrastructure`)

  const columns: Column<InfrastructureResource>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (r) => (
        <Link to={`/infrastructure/${r.id}`} className="font-medium hover:underline">
          {r.name}
        </Link>
      ),
    },
    { key: 'type', header: 'Type', cell: (r) => <span className="font-mono text-xs">{r.type}</span> },
    { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.status} /> },
    { key: 'provider', header: 'Provider', cell: (r) => <span>{r.provider ?? '—'}</span> },
    {
      key: 'ips',
      header: 'IP addresses',
      cell: (r) => (
        <span className="font-mono text-xs text-muted-foreground">
          {(r.ip_addresses ?? []).map((ip) => ip.address).join(', ') || '—'}
        </span>
      ),
    },
    { key: 'cost', header: 'Cost', cell: (r) => formatMoney(r.monthly_cost, r.currency) },
  ]

  const invalidate = () => {
    if (activeEntityId) queryClient.invalidateQueries({ queryKey: ['ws', activeEntityId, `/v1/workspaces/${activeEntityId}/infrastructure`] })
  }

  return (
    <div>
      <PageHeader
        title="Infrastructure"
        description="Servers, hosts, VMs and containers."
        actions={
          <Button
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
          >
            <Plus />
            Add resource
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
        emptyTitle="No infrastructure"
        emptyDescription="Add your first server or host."
      />

      {dialogOpen && (
        <InfrastructureFormDialog
          editing={editing}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) setEditing(null)
          }}
          onSaved={invalidate}
        />
      )}
    </div>
  )
}

function InfrastructureFormDialog({
  editing,
  onOpenChange,
  onSaved,
}: {
  editing: InfrastructureResource | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const { activeEntityId } = useWorkspace()
  const [type, setType] = useState(editing?.type ?? 'server')
  const [name, setName] = useState(editing?.name ?? '')
  const [status, setStatus] = useState(editing?.status ?? 'unknown')
  const [location, setLocation] = useState(editing?.location ?? '')
  const [provider, setProvider] = useState(editing?.provider ?? '')
  const [monthlyCost, setMonthlyCost] = useState(editing?.monthly_cost != null ? String(editing.monthly_cost) : '')
  const [currency, setCurrency] = useState(editing?.currency ?? 'EUR')
  const [ips, setIps] = useState<IpAddress[]>(editing?.ip_addresses ?? [{ address: '', type: 'private' }])
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        type,
        name,
        status,
        location: location || null,
        provider: provider || null,
        monthly_cost: monthlyCost ? Number(monthlyCost) : null,
        currency: currency || null,
        ip_addresses: ips.filter((ip) => ip.address.trim() !== ''),
      }
      return editing
        ? api.patch(`/v1/workspaces/${activeEntityId}/infrastructure/${editing.id}`, payload)
        : api.post(`/v1/workspaces/${activeEntityId}/infrastructure`, payload)
    },
    onSuccess: () => {
      onOpenChange(false)
      onSaved()
    },
    onError: (err) => setError(err instanceof ApiError ? err.detail : 'Unable to save.'),
  })

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit resource' : 'Add resource'}</DialogTitle>
          <DialogDescription>Describe a server, host, VM or container.</DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[60vh] gap-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
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
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inf-name">Name</Label>
            <Input id="inf-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="inf-loc">Location</Label>
              <Input id="inf-loc" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inf-provider">Provider</Label>
              <Input id="inf-provider" value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="hetzner" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="inf-cost">Monthly cost</Label>
              <Input id="inf-cost" type="number" step="any" value={monthlyCost} onChange={(e) => setMonthlyCost(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inf-currency">Currency</Label>
              <Input id="inf-currency" value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="EUR" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>IP addresses</Label>
            {ips.map((ip, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={ip.address}
                  onChange={(e) => setIps((prev) => prev.map((p, j) => (j === i ? { ...p, address: e.target.value } : p)))}
                  placeholder="10.0.0.5"
                />
                <Select
                  value={ip.type}
                  onValueChange={(v) => setIps((prev) => prev.map((p, j) => (j === i ? { ...p, type: v } : p)))}
                >
                  <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">public</SelectItem>
                    <SelectItem value="private">private</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon-sm" onClick={() => setIps((prev) => prev.filter((_, j) => j !== i))} aria-label="Remove">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setIps((prev) => [...prev, { address: '', type: 'private' }])}>
              <Plus /> Add IP
            </Button>
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
