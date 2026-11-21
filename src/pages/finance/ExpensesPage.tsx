import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Loader2, Plus, Trash2, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/data/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/StatusBadge'
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
import { formatMoney } from '@/lib/utils'
import type { Expense } from '@/types/api'

export function ExpensesPage() {
  const { activeEntityId } = useWorkspace()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [deleting, setDeleting] = useState<Expense | null>(null)

  const query = useQuery({
    queryKey: ['ws', activeEntityId, 'expenses'],
    queryFn: () => api.get<Expense[]>(`/v1/workspaces/${activeEntityId}/expenses`),
    enabled: !!activeEntityId,
  })

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['ws', activeEntityId, 'expenses'] })

  const approveMutation = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      api.post(`/v1/workspaces/${activeEntityId}/expenses/${id}/approve`, { approved }),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/workspaces/${activeEntityId}/expenses/${id}`),
    onSuccess: () => {
      setDeleting(null)
      invalidate()
    },
  })

  const columns: Column<Expense>[] = [
    { key: 'description', header: 'Description', cell: (r) => <span className="font-medium">{r.description ?? '—'}</span> },
    { key: 'vendor', header: 'Vendor', cell: (r) => <span className="text-muted-foreground">{r.vendor ?? '—'}</span> },
    { key: 'amount', header: 'Amount', cell: (r) => formatMoney(r.amount, r.currency) },
    { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={String(r.status ?? '')} /> },
    { key: 'date', header: 'Date', cell: (r) => <span className="text-xs text-muted-foreground">{r.date ?? '—'}</span> },
    {
      key: '__actions',
      header: '',
      headerClassName: 'w-[130px]',
      cell: (r) => (
        <div className="flex justify-end gap-1">
          {String(r.status ?? '') === 'pending' && (
            <>
              <Button variant="outline" size="sm" onClick={() => approveMutation.mutate({ id: r.id, approved: true })} disabled={approveMutation.isPending}>
                <Check className="h-3.5 w-3.5" /> Approve
              </Button>
              <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => approveMutation.mutate({ id: r.id, approved: false })} aria-label="Reject">
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
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
        title="Expenses"
        description="Tracked expenses with approval."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> New expense
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
        emptyTitle="No expenses"
        emptyDescription="Create your first expense."
      />

      {createOpen && <CreateExpenseDialog onOpenChange={setCreateOpen} onSaved={invalidate} />}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete expense"
        description={`Delete expense ${deleting?.description ?? ''}?`}
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  )
}

function CreateExpenseDialog({ onOpenChange, onSaved }: { onOpenChange: (o: boolean) => void; onSaved: () => void }) {
  const { activeEntityId } = useWorkspace()
  const [description, setDescription] = useState('')
  const [vendor, setVendor] = useState('')
  const [date, setDate] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [amount, setAmount] = useState('')
  const [taxAmount, setTaxAmount] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      api.post(`/v1/workspaces/${activeEntityId}/expenses`, {
        description: description || null,
        vendor: vendor || null,
        date: date || null,
        currency,
        amount: Number(amount),
        tax_amount: taxAmount ? Number(taxAmount) : 0,
      }),
    onSuccess: () => { onOpenChange(false); onSaved() },
    onError: (err) => setError(err instanceof ApiError ? err.detail : 'Unable to create expense.'),
  })

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>New expense</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="ex-desc">Description</Label>
            <Input id="ex-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ex-vendor">Vendor id (optional)</Label>
              <Input id="ex-vendor" value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="vnd_…" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ex-date">Date</Label>
              <Input id="ex-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ex-currency">Currency</Label>
              <Input id="ex-currency" value={currency} onChange={(e) => setCurrency(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ex-amount">Amount</Label>
              <Input id="ex-amount" type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ex-tax">Tax</Label>
              <Input id="ex-tax" type="number" step="any" value={taxAmount} onChange={(e) => setTaxAmount(e.target.value)} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!amount.trim() || mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
