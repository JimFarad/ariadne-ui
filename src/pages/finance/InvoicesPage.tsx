import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
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
import { ConfirmDialog } from '@/components/forms/ConfirmDialog'
import { useWorkspace } from '@/context/WorkspaceContext'
import { api, ApiError } from '@/lib/api/client'
import { formatMoney } from '@/lib/utils'
import type { Invoice, Vendor } from '@/types/api'

const STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'void', label: 'Void' },
]

export function InvoicesPage() {
  const { activeEntityId } = useWorkspace()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Invoice | null>(null)
  const [deleting, setDeleting] = useState<Invoice | null>(null)

  const invoicesQuery = useQuery({
    queryKey: ['ws', activeEntityId, 'invoices'],
    queryFn: () => api.get<Invoice[]>(`/v1/workspaces/${activeEntityId}/invoices`),
    enabled: !!activeEntityId,
  })
  const vendorsQuery = useQuery({
    queryKey: ['ws', activeEntityId, 'vendors'],
    queryFn: () => api.get<Vendor[]>(`/v1/workspaces/${activeEntityId}/vendors`),
    enabled: !!activeEntityId,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/workspaces/${activeEntityId}/invoices/${id}`),
    onSuccess: () => {
      setDeleting(null)
      void queryClient.invalidateQueries({ queryKey: ['ws', activeEntityId, 'invoices'] })
    },
  })

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['ws', activeEntityId, 'invoices'] })

  const columns: Column<Invoice>[] = [
    { key: 'invoice_number', header: 'Number', cell: (r) => <span className="font-medium">{r.invoice_number ?? r.id}</span> },
    { key: 'vendor', header: 'Vendor', cell: (r) => <span>{r.vendor ?? '—'}</span> },
    { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={String(r.status ?? '')} /> },
    { key: 'gross_amount', header: 'Total', cell: (r) => formatMoney(r.gross_amount, r.currency) },
    { key: 'due_date', header: 'Due', cell: (r) => <span className="text-xs text-muted-foreground">{r.due_date ?? '—'}</span> },
    {
      key: '__actions',
      header: '',
      cell: (r) => (
        <div className="flex gap-1">
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
        title="Invoices"
        description="Invoices with payment status."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> New invoice
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={invoicesQuery.data ?? []}
        rowKey={(r) => r.id}
        loading={invoicesQuery.isLoading}
        error={invoicesQuery.error}
        onRetry={invoicesQuery.refetch}
        emptyTitle="No invoices"
        emptyDescription="Create your first invoice."
      />

      {createOpen && (
        <CreateInvoiceDialog
          vendors={vendorsQuery.data ?? []}
          onOpenChange={setCreateOpen}
          onSaved={invalidate}
        />
      )}

      {editing && (
        <EditInvoiceDialog
          invoice={editing}
          onOpenChange={(open) => !open && setEditing(null)}
          onSaved={invalidate}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete invoice"
        description={`Delete invoice ${deleting?.invoice_number ?? ''}?`}
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  )
}

function CreateInvoiceDialog({
  vendors,
  onOpenChange,
  onSaved,
}: {
  vendors: Vendor[]
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const { activeEntityId } = useWorkspace()
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [vendor, setVendor] = useState('')
  const [customer, setCustomer] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [netAmount, setNetAmount] = useState('')
  const [taxAmount, setTaxAmount] = useState('')
  const [grossAmount, setGrossAmount] = useState('')
  const [status, setStatus] = useState('draft')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      api.post(`/v1/workspaces/${activeEntityId}/invoices`, {
        invoice_number: invoiceNumber,
        vendor: vendor || null,
        customer: customer || null,
        issue_date: issueDate || null,
        due_date: dueDate || null,
        currency,
        net_amount: netAmount ? Number(netAmount) : 0,
        tax_amount: taxAmount ? Number(taxAmount) : 0,
        gross_amount: grossAmount ? Number(grossAmount) : 0,
        status,
        notes: notes || null,
      }),
    onSuccess: () => {
      onOpenChange(false)
      onSaved()
    },
    onError: (err) => setError(err instanceof ApiError ? err.detail : 'Unable to create invoice.'),
  })

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New invoice</DialogTitle>
          <DialogDescription>Only status, due date and notes can be changed after creation.</DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[60vh] gap-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="inv-number">Invoice number</Label>
              <Input id="inv-number" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Vendor</Label>
              <Select value={vendor} onValueChange={setVendor}>
                <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="inv-customer">Customer</Label>
              <Input id="inv-customer" value={customer} onChange={(e) => setCustomer(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="inv-net">Net</Label>
              <Input id="inv-net" type="number" step="any" value={netAmount} onChange={(e) => setNetAmount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-tax">Tax</Label>
              <Input id="inv-tax" type="number" step="any" value={taxAmount} onChange={(e) => setTaxAmount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-gross">Gross</Label>
              <Input id="inv-gross" type="number" step="any" value={grossAmount} onChange={(e) => setGrossAmount(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="inv-currency">Currency</Label>
              <Input id="inv-currency" value={currency} onChange={(e) => setCurrency(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-issue">Issue date</Label>
              <Input id="inv-issue" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-due">Due date</Label>
              <Input id="inv-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inv-notes">Notes</Label>
            <Textarea id="inv-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!invoiceNumber.trim() || mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditInvoiceDialog({
  invoice,
  onOpenChange,
  onSaved,
}: {
  invoice: Invoice
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const { activeEntityId } = useWorkspace()
  const [status, setStatus] = useState(String(invoice.status ?? 'draft'))
  const [dueDate, setDueDate] = useState(invoice.due_date ?? '')
  const [notes, setNotes] = useState(invoice.notes ?? '')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      api.patch(`/v1/workspaces/${activeEntityId}/invoices/${invoice.id}`, {
        status,
        due_date: dueDate || null,
        notes: notes || null,
      }),
    onSuccess: () => {
      onOpenChange(false)
      onSaved()
    },
    onError: (err) => setError(err instanceof ApiError ? err.detail : 'Unable to update invoice.'),
  })

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update invoice</DialogTitle>
          <DialogDescription>{invoice.invoice_number}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-edit-due">Due date</Label>
            <Input id="inv-edit-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-edit-notes">Notes</Label>
            <Textarea id="inv-edit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
