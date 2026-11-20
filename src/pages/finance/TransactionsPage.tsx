import { useMemo } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/data/DataTable'
import { StatusBadge } from '@/components/StatusBadge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePaginatedList } from '@/hooks/usePaginatedList'
import { formatDateTime, formatMoney } from '@/lib/utils'
import type { Transaction } from '@/types/api'

const TYPE_LABELS: Record<string, string> = {
  charge: 'Charge',
  balance_transaction: 'Balance transaction',
  payment_intent: 'Payment intent',
  payout: 'Payout',
  refund: 'Refund',
  dispute: 'Dispute',
}

const TYPES = Object.keys(TYPE_LABELS)

const STATUSES = [
  'succeeded',
  'pending',
  'failed',
  'canceled',
  'paid',
  'refunded',
  'available',
  'charge_refunded',
  'processing',
  'requires_capture',
]

function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type
}

/** Signed amount coloring for a money-movement ledger. */
function amountClass(amount: string | number | null | undefined): string {
  const num = typeof amount === 'string' ? Number(amount) : amount
  if (num == null || Number.isNaN(num)) return ''
  return num < 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'
}

export function TransactionsPage() {
  const list = usePaginatedList<Transaction>((e) => `/v1/workspaces/${e}/transactions`)

  const columns = useMemo<Column<Transaction>[]>(
    () => [
      {
        key: 'type',
        header: 'Type',
        cell: (r) => <span className="font-mono text-xs">{typeLabel(String(r.type ?? ''))}</span>,
      },
      {
        key: 'description',
        header: 'Description',
        cell: (r) => <span className="font-medium">{r.description || '—'}</span>,
      },
      {
        key: 'amount',
        header: 'Amount',
        headerClassName: 'text-right',
        className: 'text-right',
        cell: (r) => (
          <span className={`font-mono text-xs ${amountClass(r.amount)}`}>
            {formatMoney(r.amount, r.currency)}
          </span>
        ),
      },
      { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={String(r.status ?? '')} /> },
      { key: 'occurred_at', header: 'Date', cell: (r) => <span className="text-xs text-muted-foreground">{formatDateTime(r.occurred_at)}</span> },
      { key: 'provider', header: 'Provider', cell: (r) => <span className="text-xs text-muted-foreground">{r.provider ?? '—'}</span> },
    ],
    [],
  )

  const toolbar = (
    <>
      <Select
        value={list.filters.type || 'all'}
        onValueChange={(value) => list.setFilter('type', value === 'all' ? '' : value)}
      >
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {TYPES.map((t) => (
            <SelectItem key={t} value={t}>
              {typeLabel(t)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={list.filters.status || 'all'}
        onValueChange={(value) => list.setFilter('status', value === 'all' ? '' : value)}
      >
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="Money movement mirrored from connected providers (Stripe charges, payouts, refunds and balance activity)."
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
        toolbar={toolbar}
        emptyTitle="No transactions"
        emptyDescription="Sync a Stripe connection to mirror money movement here."
      />
    </div>
  )
}
