import { CrudPage, type FieldDef } from '@/components/forms/CrudPage'
import { StatusBadge } from '@/components/StatusBadge'
import { formatDateTime, formatMoney } from '@/lib/utils'

type Row = Record<string, unknown>

const text = (name: string, label: string, extra: Partial<FieldDef> = {}): FieldDef => ({
  name,
  label,
  type: 'text',
  ...extra,
})

/* ------------------------------------------------------------------ */
/* Services (applications)                                            */
/* ------------------------------------------------------------------ */
export function ServicesPage() {
  return (
    <CrudPage<Row>
      title="Services"
      noun="Service"
      description="The application and service inventory."
      path={(e) => `/v1/workspaces/${e}/services`}
      rowKey={(r) => String(r.id)}
      columns={[
        { key: 'name', header: 'Name', cell: (r) => <span className="font-medium">{String(r.name ?? '')}</span> },
        { key: 'type', header: 'Type', cell: (r) => String(r.type ?? '—') },
        { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={String(r.status ?? '')} /> },
        { key: 'description', header: 'Description', cell: (r) => <span className="text-muted-foreground">{String(r.description ?? '') || '—'}</span> },
      ]}
      fields={[text('name', 'Name', { required: true }), text('type', 'Type'), text('status', 'Status'), { name: 'description', label: 'Description', type: 'textarea' }]}
      emptyTitle="No services"
      emptyDescription="Create your first service to start tracking applications."
    />
  )
}

/* ------------------------------------------------------------------ */
/* Backups                                                            */
/* ------------------------------------------------------------------ */
export function BackupsPage() {
  return (
    <CrudPage<Row>
      title="Backups"
      noun="Backup"
      description="Backup jobs and their status."
      path={(e) => `/v1/workspaces/${e}/backups`}
      rowKey={(r) => String(r.id)}
      columns={[
        { key: 'name', header: 'Name', cell: (r) => <span className="font-medium">{String(r.name ?? '')}</span> },
        { key: 'type', header: 'Type', cell: (r) => String(r.type ?? '—') },
        { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={String(r.status ?? '')} /> },
        { key: 'created_at', header: 'Created', cell: (r) => formatDateTime(String(r.created_at ?? '')) },
      ]}
      fields={[text('name', 'Name', { required: true }), text('type', 'Type'), text('status', 'Status'), text('destination', 'Destination'), { name: 'notes', label: 'Notes', type: 'textarea' }]}
      emptyTitle="No backups"
    />
  )
}

/* ------------------------------------------------------------------ */
/* Assets                                                             */
/* ------------------------------------------------------------------ */
export function AssetsPage() {
  return (
    <CrudPage<Row>
      title="Assets"
      noun="Asset"
      description="Hardware and software assets."
      path={(e) => `/v1/workspaces/${e}/assets`}
      rowKey={(r) => String(r.id)}
      columns={[
        { key: 'name', header: 'Name', cell: (r) => <span className="font-medium">{String(r.name ?? '')}</span> },
        { key: 'type', header: 'Type', cell: (r) => String(r.type ?? '—') },
        { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={String(r.status ?? '')} /> },
        { key: 'assigned_to', header: 'Assigned to', cell: (r) => String(r.assigned_to ?? '—') },
      ]}
      fields={[text('name', 'Name', { required: true }), text('type', 'Type'), text('status', 'Status'), text('serial_number', 'Serial number'), text('assigned_to', 'Assigned to'), text('location', 'Location')]}
      emptyTitle="No assets"
    />
  )
}

/* ------------------------------------------------------------------ */
/* IoT devices                                                        */
/* ------------------------------------------------------------------ */
export function IotPage() {
  return (
    <CrudPage<Row>
      title="IoT devices"
      noun="IoT device"
      description="Internet-connected devices."
      path={(e) => `/v1/workspaces/${e}/iot-devices`}
      rowKey={(r) => String(r.id)}
      columns={[
        { key: 'name', header: 'Name', cell: (r) => <span className="font-medium">{String(r.name ?? '')}</span> },
        { key: 'type', header: 'Type', cell: (r) => String(r.type ?? '—') },
        { key: 'identifier', header: 'Identifier', cell: (r) => <span className="font-mono text-xs">{String(r.identifier ?? '—')}</span> },
        { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={String(r.status ?? '')} /> },
      ]}
      fields={[text('name', 'Name', { required: true }), text('type', 'Type', { required: true }), text('identifier', 'Identifier'), text('status', 'Status')]}
      emptyTitle="No IoT devices"
    />
  )
}

/* ------------------------------------------------------------------ */
/* Contacts                                                           */
/* ------------------------------------------------------------------ */
export function ContactsPage() {
  return (
    <CrudPage<Row>
      title="Contacts"
      noun="Contact"
      description="Address book."
      path={(e) => `/v1/workspaces/${e}/contacts`}
      rowKey={(r) => String(r.id)}
      columns={[
        { key: 'name', header: 'Name', cell: (r) => <span className="font-medium">{String(r.name ?? '')}</span> },
        { key: 'email', header: 'Email', cell: (r) => String(r.email ?? '—') },
        { key: 'phone', header: 'Phone', cell: (r) => String(r.phone ?? '—') },
        { key: 'role', header: 'Role', cell: (r) => String(r.role ?? '—') },
      ]}
      fields={[text('name', 'Name', { required: true }), text('email', 'Email'), text('phone', 'Phone'), text('role', 'Role'), { name: 'notes', label: 'Notes', type: 'textarea' }]}
      emptyTitle="No contacts"
    />
  )
}

/* ------------------------------------------------------------------ */
/* Campaigns                                                          */
/* ------------------------------------------------------------------ */
export function CampaignsPage() {
  return (
    <CrudPage<Row>
      title="Campaigns"
      noun="Campaign"
      description="Marketing campaigns."
      path={(e) => `/v1/workspaces/${e}/campaigns`}
      rowKey={(r) => String(r.id)}
      columns={[
        { key: 'name', header: 'Name', cell: (r) => <span className="font-medium">{String(r.name ?? '')}</span> },
        { key: 'channel', header: 'Channel', cell: (r) => String(r.channel ?? '—') },
        { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={String(r.status ?? '')} /> },
        { key: 'budget', header: 'Budget', cell: (r) => (r.budget != null ? formatMoney(String(r.budget)) : '—') },
      ]}
      fields={[text('name', 'Name', { required: true }), text('channel', 'Channel'), text('status', 'Status'), { name: 'budget', label: 'Budget', type: 'number' }]}
      emptyTitle="No campaigns"
    />
  )
}

/* ------------------------------------------------------------------ */
/* Automation rules                                                   */
/* ------------------------------------------------------------------ */
export function AutomationPage() {
  return (
    <CrudPage<Row>
      title="Automation rules"
      noun="Automation rule"
      description="Rules that automate operational actions."
      path={(e) => `/v1/workspaces/${e}/automation-rules`}
      rowKey={(r) => String(r.id)}
      columns={[
        { key: 'name', header: 'Name', cell: (r) => <span className="font-medium">{String(r.name ?? '')}</span> },
        { key: 'trigger', header: 'Trigger', cell: (r) => <span className="font-mono text-xs">{String(r.trigger ?? '')}</span> },
        { key: 'action', header: 'Action', cell: (r) => <span className="font-mono text-xs">{String(r.action ?? '')}</span> },
        { key: 'enabled', header: 'Enabled', cell: (r) => <StatusBadge status={r.enabled ? 'enabled' : 'disabled'} /> },
      ]}
      fields={[text('name', 'Name', { required: true }), text('trigger', 'Trigger', { required: true }), text('condition', 'Condition'), text('action', 'Action', { required: true })]}
      emptyTitle="No automation rules"
    />
  )
}

/* ------------------------------------------------------------------ */
/* Documents                                                          */
/* ------------------------------------------------------------------ */
export function DocumentsPage() {
  return (
    <CrudPage<Row>
      title="Documents"
      noun="Document"
      description="Documents with access grants."
      path={(e) => `/v1/workspaces/${e}/documents`}
      rowKey={(r) => String(r.id)}
      columns={[
        { key: 'title', header: 'Title', cell: (r) => <span className="font-medium">{String(r.title ?? '')}</span> },
        { key: 'type', header: 'Type', cell: (r) => String(r.type ?? '—') },
        { key: 'created_at', header: 'Created', cell: (r) => formatDateTime(String(r.created_at ?? '')) },
      ]}
      fields={[text('title', 'Title', { required: true }), text('type', 'Type'), { name: 'content', label: 'Content', type: 'textarea' }]}
      emptyTitle="No documents"
    />
  )
}

/* ------------------------------------------------------------------ */
/* Mail accounts                                                      */
/* ------------------------------------------------------------------ */
export function MailAccountsPage() {
  return (
    <CrudPage<Row>
      title="Mail accounts"
      noun="Mail account"
      description="Mail accounts managed for this workspace."
      path={(e) => `/v1/workspaces/${e}/mail-accounts`}
      rowKey={(r) => String(r.id)}
      columns={[
        { key: 'email', header: 'Email', cell: (r) => <span className="font-medium">{String(r.email ?? '')}</span> },
        { key: 'domain', header: 'Domain', cell: (r) => String(r.domain ?? '—') },
        { key: 'provider', header: 'Provider', cell: (r) => String(r.provider ?? '—') },
        { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={String(r.status ?? '')} /> },
      ]}
      fields={[text('email', 'Email', { required: true }), text('domain', 'Domain', { required: true }), text('provider', 'Provider'), { name: 'status', label: 'Status', type: 'select', options: [{ value: 'active', label: 'Active' }, { value: 'disabled', label: 'Disabled' }] }]}
      emptyTitle="No mail accounts"
    />
  )
}

/* ------------------------------------------------------------------ */
/* Email senders                                                      */
/* ------------------------------------------------------------------ */
export function SendersPage() {
  return (
    <CrudPage<Row>
      title="Email senders"
      noun="Sender"
      description="Sender identities used for outbound email."
      path={(e) => `/v1/workspaces/${e}/email-senders`}
      rowKey={(r) => String(r.id)}
      canEdit={false}
      columns={[
        { key: 'name', header: 'Name', cell: (r) => <span className="font-medium">{String(r.name ?? '')}</span> },
        { key: 'email', header: 'Email', cell: (r) => String(r.email ?? '—') },
        { key: 'domain', header: 'Domain', cell: (r) => String(r.domain ?? '—') },
        { key: 'provider', header: 'Provider', cell: (r) => String(r.provider ?? '—') },
      ]}
      fields={[text('name', 'Name', { required: true }), text('email', 'Email', { required: true }), text('provider', 'Provider'), text('domain', 'Domain')]}
      emptyTitle="No senders"
    />
  )
}

/* ------------------------------------------------------------------ */
/* Email templates                                                    */
/* ------------------------------------------------------------------ */
export function TemplatesPage() {
  return (
    <CrudPage<Row>
      title="Email templates"
      noun="Template"
      description="Reusable email templates."
      path={(e) => `/v1/workspaces/${e}/email-templates`}
      rowKey={(r) => String(r.id)}
      canEdit={false}
      columns={[
        { key: 'name', header: 'Name', cell: (r) => <span className="font-medium">{String(r.name ?? '')}</span> },
        { key: 'subject', header: 'Subject', cell: (r) => String(r.subject ?? '—') },
      ]}
      fields={[text('name', 'Name', { required: true }), text('subject', 'Subject', { required: true }), { name: 'body', label: 'Body', type: 'textarea' }]}
      emptyTitle="No templates"
    />
  )
}

/* ------------------------------------------------------------------ */
/* Budgets                                                            */
/* ------------------------------------------------------------------ */
export function BudgetsPage() {
  return (
    <CrudPage<Row>
      title="Budgets"
      noun="Budget"
      description="Financial budgets."
      path={(e) => `/v1/workspaces/${e}/budgets`}
      rowKey={(r) => String(r.id)}
      columns={[
        { key: 'name', header: 'Name', cell: (r) => <span className="font-medium">{String(r.name ?? '')}</span> },
        { key: 'period', header: 'Period', cell: (r) => String(r.period ?? '—') },
        { key: 'amount', header: 'Amount', cell: (r) => formatMoney(String(r.amount ?? ''), String(r.currency ?? '')) },
      ]}
      fields={[text('name', 'Name', { required: true }), text('period', 'Period'), text('currency', 'Currency', { placeholder: 'EUR' }), { name: 'amount', label: 'Amount', type: 'number', required: true }]}
      emptyTitle="No budgets"
    />
  )
}

/* ------------------------------------------------------------------ */
/* Expenses                                                           */
/* ------------------------------------------------------------------ */
export function ExpensesPage() {
  return (
    <CrudPage<Row>
      title="Expenses"
      noun="Expense"
      description="Tracked expenses."
      path={(e) => `/v1/workspaces/${e}/expenses`}
      rowKey={(r) => String(r.id)}
      columns={[
        { key: 'description', header: 'Description', cell: (r) => <span className="font-medium">{String(r.description ?? r.id ?? '')}</span> },
        { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={String(r.status ?? '')} /> },
        { key: 'amount', header: 'Amount', cell: (r) => formatMoney(String(r.amount ?? ''), String(r.currency ?? '')) },
        { key: 'date', header: 'Date', cell: (r) => String(r.date ?? '—') },
      ]}
      fields={[text('description', 'Description'), text('vendor', 'Vendor'), text('date', 'Date', { placeholder: 'YYYY-MM-DD' }), text('currency', 'Currency', { placeholder: 'EUR' }), { name: 'amount', label: 'Amount', type: 'number', required: true }]}
      emptyTitle="No expenses"
    />
  )
}

/* ------------------------------------------------------------------ */
/* Vendors                                                            */
/* ------------------------------------------------------------------ */
export function VendorsPage() {
  return (
    <CrudPage<Row>
      title="Vendors"
      noun="Vendor"
      description="Vendors and suppliers."
      path={(e) => `/v1/workspaces/${e}/vendors`}
      rowKey={(r) => String(r.id)}
      canEdit={false}
      columns={[
        { key: 'name', header: 'Name', cell: (r) => <span className="font-medium">{String(r.name ?? '')}</span> },
        { key: 'email', header: 'Email', cell: (r) => String(r.email ?? '—') },
        { key: 'website', header: 'Website', cell: (r) => String(r.website ?? '—') },
      ]}
      fields={[text('name', 'Name', { required: true }), text('email', 'Email'), text('website', 'Website')]}
      emptyTitle="No vendors"
    />
  )
}

/* ------------------------------------------------------------------ */
/* Monitoring                                                         */
/* ------------------------------------------------------------------ */
export function MonitoringPage() {
  return (
    <CrudPage<Row>
      title="Monitoring"
      noun="Monitoring check"
      description="Uptime and health checks."
      path={(e) => `/v1/workspaces/${e}/monitoring-checks`}
      rowKey={(r) => String(r.id)}
      columns={[
        { key: 'name', header: 'Name', cell: (r) => <span className="font-medium">{String(r.name ?? '')}</span> },
        { key: 'type', header: 'Type', cell: (r) => <span className="font-mono text-xs">{String(r.type ?? '—')}</span> },
        { key: 'target', header: 'Target', cell: (r) => <span className="font-mono text-xs">{String(r.target ?? '—')}</span> },
        { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={String(r.status ?? '')} /> },
      ]}
      fields={[text('name', 'Name', { required: true }), text('type', 'Type', { required: true, placeholder: 'http' }), text('target', 'Target', { required: true }), { name: 'interval', label: 'Interval (s)', type: 'number' }, { name: 'timeout', label: 'Timeout (s)', type: 'number' }]}
      emptyTitle="No checks"
    />
  )
}

/* ------------------------------------------------------------------ */
/* Communications                                                     */
/* ------------------------------------------------------------------ */
export function CommunicationsPage() {
  return (
    <CrudPage<Row>
      title="Communications"
      noun="Communication"
      description="Outbound communication log."
      path={(e) => `/v1/workspaces/${e}/communications`}
      rowKey={(r) => String(r.id)}
      canEdit={false}
      canDelete={false}
      columns={[
        { key: 'channel', header: 'Channel', cell: (r) => <span className="font-mono text-xs">{String(r.channel ?? '')}</span> },
        { key: 'recipient', header: 'Recipient', cell: (r) => String(r.recipient ?? '—') },
        { key: 'subject', header: 'Subject', cell: (r) => <span className="font-medium">{String(r.subject ?? '')}</span> },
        { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={String(r.status ?? '')} /> },
      ]}
      fields={[text('channel', 'Channel', { required: true }), text('recipient', 'Recipient', { required: true }), text('subject', 'Subject', { required: true })]}
      emptyTitle="No communications"
    />
  )
}
