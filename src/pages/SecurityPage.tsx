import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Loader2, Plus, Upload } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/data/DataTable'
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
import { usePaginatedList } from '@/hooks/usePaginatedList'
import { useWorkspace } from '@/context/WorkspaceContext'
import { api, ApiError } from '@/lib/api/client'
import type { SecurityFinding } from '@/types/api'

const SEVERITIES = ['critical', 'warning', 'info', 'success']
const STATUSES = ['open', 'in_progress', 'resolved', 'ignored']

export function SecurityPage() {
  const { activeEntityId } = useWorkspace()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const list = usePaginatedList<SecurityFinding>((e) => `/v1/workspaces/${e}/security-findings`)

  const columns: Column<SecurityFinding>[] = [
    { key: 'title', header: 'Title', cell: (r) => <span className="font-medium">{String(r.title ?? '')}</span> },
    { key: 'severity', header: 'Severity', cell: (r) => <StatusBadge status={String(r.severity ?? '')} /> },
    { key: 'cvss', header: 'CVSS', cell: (r) => <span className="font-mono text-xs">{r.cvss ?? '—'}</span> },
    { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={String(r.status ?? '')} /> },
  ]

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['ws', activeEntityId, `/v1/workspaces/${activeEntityId}/security-findings`] })

  return (
    <div>
      <PageHeader
        title="Security findings"
        description="Vulnerabilities and security issues."
        actions={
          <>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload /> Import
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus /> Add finding
            </Button>
          </>
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
        emptyTitle="No findings"
      />

      {createOpen && <CreateFindingDialog onOpenChange={setCreateOpen} onSaved={invalidate} />}
      {importOpen && <ImportDialog onOpenChange={setImportOpen} onSaved={invalidate} />}
    </div>
  )
}

function CreateFindingDialog({ onOpenChange, onSaved }: { onOpenChange: (o: boolean) => void; onSaved: () => void }) {
  const { activeEntityId } = useWorkspace()
  const [title, setTitle] = useState('')
  const [severity, setSeverity] = useState('warning')
  const [cvss, setCvss] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      api.post(`/v1/workspaces/${activeEntityId}/security-findings`, {
        title,
        severity,
        description: description || null,
        cvss_score: cvss ? Number(cvss) : null,
      }),
    onSuccess: () => { onOpenChange(false); onSaved() },
    onError: (err) => setError(err instanceof ApiError ? err.detail : 'Unable to create finding.'),
  })

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add finding</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="sf-title">Title</Label>
            <Input id="sf-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Severity</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sf-cvss">CVSS score</Label>
              <Input id="sf-cvss" type="number" step="any" value={cvss} onChange={(e) => setCvss(e.target.value)} placeholder="0–10" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sf-desc">Description</Label>
            <Textarea id="sf-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!title.trim() || mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ImportDialog({ onOpenChange, onSaved }: { onOpenChange: (o: boolean) => void; onSaved: () => void }) {
  const { activeEntityId } = useWorkspace()
  const [source, setSource] = useState('')
  const [json, setJson] = useState('[\n  { "external_id": "SCAN-1", "title": "Example finding", "severity": "warning" }\n]')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => {
      let findings: unknown[]
      try {
        findings = JSON.parse(json)
      } catch {
        throw new Error('Findings must be valid JSON.')
      }
      return api.post<{ created: number; skipped: number }>(`/v1/workspaces/${activeEntityId}/security-findings/import`, {
        source,
        findings,
      })
    },
    onSuccess: (r) => {
      setResult(`Created ${r.created}, skipped ${r.skipped}.`)
      onSaved()
    },
    onError: (err) => setError(err instanceof ApiError ? err.detail : err instanceof Error ? err.message : 'Import failed.'),
  })

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import findings</DialogTitle>
          <DialogDescription>Paste a JSON array of findings from a scanner.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="imp-source">Source</Label>
            <Input id="imp-source" value={source} onChange={(e) => setSource(e.target.value)} placeholder="scanner name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="imp-json">Findings (JSON array)</Label>
            <Textarea id="imp-json" value={json} onChange={(e) => setJson(e.target.value)} rows={8} className="font-mono text-xs" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {result && <p className="text-sm text-emerald-600 dark:text-emerald-400">{result}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={() => mutation.mutate()} disabled={!source.trim() || mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
