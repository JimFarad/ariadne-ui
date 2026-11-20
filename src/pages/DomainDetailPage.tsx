import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DataTable, type Column } from '@/components/data/DataTable'
import { StatusBadge } from '@/components/StatusBadge'
import { ConfirmDialog } from '@/components/forms/ConfirmDialog'
import { LoadingSpinner } from '@/components/ui/spinner'
import { ErrorState } from '@/components/data/ErrorState'
import { useWorkspace } from '@/context/WorkspaceContext'
import { api, ApiError } from '@/lib/api/client'
import { formatDate } from '@/lib/utils'
import type { DnsCheckReport, DnsRecord, Domain } from '@/types/api'

const RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA']

export function DomainDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { activeEntityId } = useWorkspace()
  const queryClient = useQueryClient()
  const [recordDialog, setRecordDialog] = useState(false)
  const [editingRecord, setEditingRecord] = useState<DnsRecord | null>(null)
  const [deletingRecord, setDeletingRecord] = useState<DnsRecord | null>(null)

  const domainQuery = useQuery({
    queryKey: ['ws', activeEntityId, 'domains', id],
    queryFn: () => api.get<Domain>(`/v1/workspaces/${activeEntityId}/domains/${id}`),
    enabled: !!activeEntityId && !!id,
  })
  const recordsQuery = useQuery({
    queryKey: ['ws', activeEntityId, 'domains', id, 'records'],
    queryFn: () => api.get<DnsRecord[]>(`/v1/workspaces/${activeEntityId}/domains/${id}/records`),
    enabled: !!activeEntityId && !!id,
  })
  const checkMutation = useMutation({
    mutationFn: () => api.post<DnsCheckReport>(`/v1/workspaces/${activeEntityId}/domains/${id}/check-dns`),
  })

  const deleteMutation = useMutation({
    mutationFn: (recordId: string) => api.delete(`/v1/workspaces/${activeEntityId}/domains/${id}/records/${recordId}`),
    onSuccess: () => {
      setDeletingRecord(null)
      void queryClient.invalidateQueries({ queryKey: ['ws', activeEntityId, 'domains', id, 'records'] })
    },
  })

  const invalidateRecords = () => void queryClient.invalidateQueries({ queryKey: ['ws', activeEntityId, 'domains', id, 'records'] })

  const domain = domainQuery.data
  const report = checkMutation.data

  const columns: Column<DnsRecord>[] = [
    { key: 'type', header: 'Type', cell: (r) => <span className="font-mono text-xs">{r.type}</span> },
    { key: 'name', header: 'Name', cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
    { key: 'value', header: 'Value', cell: (r) => <span className="break-all font-mono text-xs">{r.value}</span> },
    { key: 'ttl', header: 'TTL', cell: (r) => <span>{r.ttl ?? '—'}</span> },
    {
      key: '__actions',
      header: '',
      cell: (r) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => { setEditingRecord(r); setRecordDialog(true) }} aria-label="Edit">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => setDeletingRecord(r)} aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  if (domainQuery.isLoading) return <LoadingSpinner />
  if (domainQuery.error || !domain) return <ErrorState error={domainQuery.error} onRetry={() => domainQuery.refetch()} />

  return (
    <div>
      <PageHeader
        title={domain.name}
        description={domain.registrar ? `Registrar: ${domain.registrar}` : 'Domain inventory'}
        breadcrumbs={[{ label: 'Domains & DNS', href: '/domains' }, { label: domain.name }]}
        actions={
          <>
            <Link to="/domains">
              <Button variant="outline"><ArrowLeft /> Back</Button>
            </Link>
            <Button variant="outline" onClick={() => checkMutation.mutate()} disabled={checkMutation.isPending}>
              <RefreshCw className={checkMutation.isPending ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              Check DNS
            </Button>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <StatusBadge status={String(domain.status ?? '')} />
        {domain.expires_at && <span className="text-sm text-muted-foreground">expires {formatDate(String(domain.expires_at))}</span>}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Domain details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            <Detail label="Registrar" value={domain.registrar} />
            <Detail label="Provider" value={domain.provider} />
            <Detail label="Expires" value={domain.expires_at ? formatDate(String(domain.expires_at)) : undefined} />
            <Detail label="Registered" value={domain.registered_at ? formatDate(String(domain.registered_at)) : undefined} />
            <Detail label="Auto-renew" value={domain.auto_renew ? 'Enabled' : 'Disabled'} />
            <Detail label="Transfer lock" value={domain.transfer_lock ? 'Locked' : 'Unlocked'} />
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">Nameservers</p>
              {(domain.nameservers ?? []).length > 0 ? (
                <ul className="mt-1 space-y-0.5">
                  {domain.nameservers!.map((ns, i) => (
                    <li key={i} className="font-mono text-xs">{ns}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">—</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {report && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>DNS drift report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ReportSection title="Matched" records={report.matched} />
            <ReportSection title="Missing (in inventory, not resolving)" records={report.missing} />
            <ReportSection title="Unexpected (resolving, not in inventory)" records={report.unexpected} />
          </CardContent>
        </Card>
      )}

      <PageHeader
        title="DNS records"
        actions={
          <Button onClick={() => { setEditingRecord(null); setRecordDialog(true) }}>
            <Plus /> Add record
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={recordsQuery.data ?? []}
        rowKey={(r) => r.id}
        loading={recordsQuery.isLoading}
        error={recordsQuery.error}
        onRetry={recordsQuery.refetch}
        emptyTitle="No records"
        emptyDescription="Add a DNS record."
      />

      {recordDialog && (
        <RecordFormDialog
          domainId={id!}
          editing={editingRecord}
          onOpenChange={(open) => { setRecordDialog(open); if (!open) setEditingRecord(null) }}
          onSaved={invalidateRecords}
        />
      )}

      <ConfirmDialog
        open={deletingRecord !== null}
        onOpenChange={(open) => !open && setDeletingRecord(null)}
        title="Delete record"
        description={`Delete ${deletingRecord?.type} record ${deletingRecord?.name}?`}
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deletingRecord && deleteMutation.mutate(deletingRecord.id)}
      />
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value || '—'}</p>
    </div>
  )
}

function ReportSection({ title, records }: { title: string; records?: DnsRecord[] }) {
  return (
    <div>
      <p className="mb-1 text-sm font-medium">{title} ({records?.length ?? 0})</p>
      {!records || records.length === 0 ? (
        <p className="text-sm text-muted-foreground">None.</p>
      ) : (
        <ul className="space-y-1">
          {records.map((r, i) => (
            <li key={i} className="font-mono text-xs text-muted-foreground">
              {r.type} {r.name} → {r.value}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function RecordFormDialog({
  domainId,
  editing,
  onOpenChange,
  onSaved,
}: {
  domainId: string
  editing: DnsRecord | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const { activeEntityId } = useWorkspace()
  const [type, setType] = useState(editing?.type ?? 'A')
  const [name, setName] = useState(editing?.name ?? '')
  const [value, setValue] = useState(editing?.value ?? '')
  const [ttl, setTtl] = useState(editing?.ttl != null ? String(editing.ttl) : '3600')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => {
      const payload = { type, name, value, ttl: ttl ? Number(ttl) : undefined }
      return editing
        ? api.patch(`/v1/workspaces/${activeEntityId}/domains/${domainId}/records/${editing.id}`, payload)
        : api.post(`/v1/workspaces/${activeEntityId}/domains/${domainId}/records`, payload)
    },
    onSuccess: () => { onOpenChange(false); onSaved() },
    onError: (err) => setError(err instanceof ApiError ? err.detail : 'Unable to save record.'),
  })

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit record' : 'Add record'}</DialogTitle>
          <DialogDescription>DNS record details.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RECORD_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rec-ttl">TTL</Label>
              <Input id="rec-ttl" type="number" value={ttl} onChange={(e) => setTtl(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rec-name">Name</Label>
            <Input id="rec-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="@" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rec-value">Value</Label>
            <Input id="rec-value" value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!value.trim() || mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
