import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  AppWindow,
  ArchiveRestore,
  AtSign,
  BarChart3,
  Bell,
  Blocks,
  Building2,
  Cable,
  Contact,
  Cpu,
  FileText,
  FolderKanban,
  Globe,
  HardDrive,
  Home,
  Inbox,
  KeyRound,
  Layers,
  LayoutGrid,
  LayoutTemplate,
  Mail,
  Megaphone,
  MessageSquare,
  Package,
  Receipt,
  ReceiptText,
  Send,
  Server,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Store,
  Users,
  Wallet,
  Workflow,
} from 'lucide-react'

export interface NavChild {
  label: string
  path: string
  icon: LucideIcon
  /** Entity module slug that gates this child (omit = always available). */
  module?: string
}

export interface NavItem {
  label: string
  icon: LucideIcon
  path?: string
  module?: string
  children?: NavChild[]
}

export interface NavSection {
  id: string
  label: string
  items: NavItem[]
}

/**
 * Central navigation registry. New modules slot in here without touching the
 * shell. `module` is the entity-module slug — when the active workspace has
 * that module disabled, the item is hidden from navigation.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'global',
    label: '',
    items: [
      { label: 'Home', path: '/dashboard', icon: Home },
      { label: 'Notifications', path: '/notifications', icon: Bell },
    ],
  },
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      { label: 'Overview', path: '/workspace', icon: LayoutGrid },
      { label: 'Members', path: '/workspace/members', icon: Users },
      { label: 'Realms', path: '/workspace/realms', icon: Layers },
      { label: 'Realm roles', path: '/workspace/realm-roles', icon: ShieldCheck },
      { label: 'Modules', path: '/workspace/modules', icon: Blocks },
      { label: 'Storage policy', path: '/workspace/storage-policy', icon: HardDrive },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      { label: 'Services', path: '/services', icon: AppWindow, module: 'applications' },
      { label: 'Infrastructure', path: '/infrastructure', icon: Server, module: 'infrastructure' },
      { label: 'Incidents', path: '/incidents', icon: Siren, module: 'incidents' },
      { label: 'Monitoring', path: '/monitoring', icon: Activity, module: 'monitoring' },
      { label: 'Backups', path: '/backups', icon: ArchiveRestore, module: 'backups' },
    ],
  },
  {
    id: 'network',
    label: 'Network',
    items: [
      { label: 'Domains & DNS', path: '/domains', icon: Globe, module: 'domains' },
      {
        label: 'Providers',
        icon: Cable,
        children: [
          { label: 'Connections', path: '/providers/connections', icon: Cable },
          { label: 'Resources', path: '/providers/resources', icon: Server },
          { label: 'Accounts', path: '/providers/accounts', icon: Building2 },
          { label: 'Sync history', path: '/providers/syncs', icon: Activity },
        ],
      },
    ],
  },
  {
    id: 'engineering',
    label: 'Engineering',
    items: [
      { label: 'Projects', path: '/projects', icon: FolderKanban, module: 'projects' },
      { label: 'Documents', path: '/documents', icon: FileText, module: 'docs' },
      { label: 'Automation', path: '/automation', icon: Workflow, module: 'automation' },
    ],
  },
  {
    id: 'security',
    label: 'Security',
    items: [{ label: 'Findings', path: '/security', icon: ShieldAlert, module: 'security' }],
  },
  {
    id: 'finance',
    label: 'Finance',
    items: [
      {
        label: 'Finance',
        icon: Wallet,
        module: 'finance',
        children: [
          { label: 'Vendors', path: '/finance/vendors', icon: Store, module: 'finance' },
          { label: 'Invoices', path: '/finance/invoices', icon: ReceiptText, module: 'finance' },
          { label: 'Expenses', path: '/finance/expenses', icon: Receipt, module: 'finance' },
          { label: 'Budgets', path: '/finance/budgets', icon: Wallet, module: 'finance' },
          { label: 'Invoice intake', path: '/finance/intake', icon: Inbox, module: 'finance' },
        ],
      },
    ],
  },
  {
    id: 'communications',
    label: 'Communications',
    items: [
      {
        label: 'Email delivery',
        icon: Mail,
        module: 'email-delivery',
        children: [
          { label: 'Senders', path: '/email/senders', icon: Send, module: 'email-delivery' },
          { label: 'Templates', path: '/email/templates', icon: LayoutTemplate, module: 'email-delivery' },
          { label: 'Deliveries', path: '/email/deliveries', icon: Inbox, module: 'email-delivery' },
        ],
      },
      { label: 'Mail accounts', path: '/mail-accounts', icon: AtSign, module: 'email-admin' },
      { label: 'Communications', path: '/communications', icon: MessageSquare, module: 'communications' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    items: [
      { label: 'Assets', path: '/assets', icon: Package, module: 'assets' },
      { label: 'IoT devices', path: '/iot', icon: Cpu, module: 'iot' },
      { label: 'Contacts', path: '/contacts', icon: Contact, module: 'contacts' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    items: [{ label: 'Campaigns', path: '/campaigns', icon: Megaphone, module: 'marketing' }],
  },
  {
    id: 'admin',
    label: 'Administration',
    items: [
      { label: 'Reports', path: '/reports', icon: BarChart3, module: 'reports' },
      { label: 'API tokens', path: '/tokens', icon: KeyRound },
    ],
  },
]

/** Human-friendly labels for known module slugs (used in module settings). */
export const MODULE_LABELS: Record<string, string> = {
  identity: 'Identity and access',
  infrastructure: 'Infrastructure',
  domains: 'Domains & DNS',
  monitoring: 'Monitoring',
  notifications: 'Notifications',
  'email-delivery': 'Email delivery',
  finance: 'Finance',
  reports: 'Reports',
  communications: 'Communications',
  'email-admin': 'Mail accounts',
  iot: 'IoT devices',
  applications: 'Applications and services',
  incidents: 'Incidents',
  backups: 'Backups',
  security: 'Security findings',
  projects: 'Projects',
  docs: 'Documents',
  automation: 'Automation',
  assets: 'Assets',
  contacts: 'Contacts',
  marketing: 'Marketing',
  core: 'Core',
}
