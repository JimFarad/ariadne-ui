import { CrudPage } from '@/components/forms/CrudPage'
import { StatusBadge } from '@/components/StatusBadge'
import { formatMoney } from '@/lib/utils'

type Row = Record<string, unknown>

const STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'void', label: 'Void' },
]

export function InvoicesPage() {
  return (
    <CrudPage<Row>
      title="Invoices"
      noun="Invoice"
      description="Invoices with payment status."
      path={(e) => `/v1/workspaces/${e}/invoices`}
      rowKey={(r) => String(r.id)}
      columns={[
        { key: 'invoice_number', header: 'Number', cell: (r) => <span className="font-medium">{String(r.invoice_number ?? r.id ?? '')}</span> },
        { key: 'vendor', header: 'Vendor', cell: (r) => <span>{String(r.vendor_name ?? r.vendor ?? '—')}</span> },
        { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={String(r.status ?? '')} /> },
        { key: 'gross_amount', header: 'Total', cell: (r) => formatMoney(String(r.gross_amount ?? ''), String(r.currency ?? 'EUR')) },
        { key: 'due_date', header: 'Due', cell: (r) => <span className="text-xs text-muted-foreground">{String(r.due_date ?? '—')}</span> },
      ]}
      fields={[
        { name: 'invoice_number', label: 'Invoice number', required: true },
        { name: 'vendor', label: 'Vendor id (optional)' },
        { name: 'customer', label: 'Customer' },
        { name: 'status', label: 'Status', type: 'select', options: STATUSES },
        { name: 'currency', label: 'Currency', defaultValue: 'EUR' },
        { name: 'net_amount', label: 'Net amount', type: 'number' },
        { name: 'tax_amount', label: 'Tax amount', type: 'number' },
        { name: 'gross_amount', label: 'Gross amount', type: 'number' },
        { name: 'issue_date', label: 'Issue date', placeholder: 'YYYY-MM-DD' },
        { name: 'due_date', label: 'Due date', placeholder: 'YYYY-MM-DD' },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ]}
      emptyTitle="No invoices"
    />
  )
}
