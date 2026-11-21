/**
 * Shared API types, mirroring the ARIADNE JSON API surface under /v1.
 * Public ids (ent_…, usr_…, dom_…) are opaque strings.
 */

export interface Envelope<T> {
  data: T
  meta?: PaginationMeta
  links?: PaginationLinks
}

export interface PaginationMeta {
  pagination?: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

export interface PaginationLinks {
  self?: string
  next?: string | null
  last?: string | null
}

export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  code?: string
  request_id?: string
  errors?: Array<{ field: string; message: string }>
}

export interface User {
  id: string
  name: string
  email: string | null
  avatar_url?: string | null
}

export interface EntityOwner {
  id: string
  name: string
}

export interface Entity {
  id: string
  type: 'personal' | 'organization' | 'client' | string
  name: string
  description?: string | null
  image?: string | null
  metadata?: Record<string, unknown> | null
  owner?: EntityOwner
  created_at?: string
  updated_at?: string
}

export interface Realm {
  id: string
  name: string
  slug: string
  description?: string | null
}

export interface AuthMe {
  id: string
  name: string
  email: string | null
  avatar_url?: string | null
  entity: Entity | null
  realm: Realm | null
}

export interface Member {
  id: string
  status: string
  joined_at?: string
  user: { id: string; name: string; email?: string | null; avatar_url?: string | null }
  roles?: Role[]
}

export interface Role {
  id: string
  name: string
}

export interface RealmRole {
  id?: string
  user?: { id: string; name?: string }
  role?: { id: string; name?: string } | Role
  realm?: { id: string; name?: string } | Realm
}

export interface ModuleInfo {
  id: string
  slug: string
  name: string
  version?: string
  description?: string
  state?: string
}

export interface EntityModule {
  id: string
  slug: string
  name: string
  enabled: boolean
}

export interface Capability {
  id: string
  slug: string
  provider: string | null
  resource_type: string
  operation: string
  access_type: string
  risk_level: string
  permission: string
  status: string
}

export interface Notification {
  id: string
  category?: string | null
  severity?: string | null
  title?: string | null
  body?: string | null
  read_at?: string | null
  expires_at?: string | null
  created_at?: string
  [key: string]: unknown
}

export interface NotificationCategory {
  slug: string
  label: string
}

export interface NotificationPreferences {
  categories: NotificationCategory[]
  enabled: string[]
  [key: string]: unknown
}

export interface UserPreferencesResource {
  preferences: Record<string, unknown>
}

export interface DashboardEntitySummary {
  members: number
  realms: number
  provider_connections: number
  provider_accounts: number
  provider_resources: number
  [key: string]: unknown
}

export interface DashboardEvent {
  id: string
  action?: string | null
  message?: string | null
  description?: string | null
  user?: string | null
  ip_address?: string | null
  created_at?: string
  [key: string]: unknown
}

export interface DashboardSync {
  id: string
  status?: string
  started_at?: string
  finished_at?: string
  [key: string]: unknown
}

export interface DashboardProvider {
  id: string
  provider?: string
  name?: string
  health?: string
  [key: string]: unknown
}

export interface DashboardData {
  modules?: ModuleInfo[]
  entities?: Entity[]
  entity?: {
    id: string
    name: string
    type: string
    summary?: DashboardEntitySummary
    providers?: DashboardProvider[]
    recent_syncs?: DashboardSync[]
    recent_events?: DashboardEvent[]
    [key: string]: unknown
  } | null
  [key: string]: unknown
}

/* Infrastructure */

export type InfrastructureType = 'server' | 'vps' | 'host' | 'vm' | 'container' | string
export type InfrastructureStatus = 'online' | 'offline' | 'maintenance' | 'unknown' | string

export interface IpAddress {
  address: string
  type?: string
}

export interface SshKey {
  name?: string
  public_key?: string
}

export interface InfrastructureLocation {
  code?: string | null
  city?: string | null
  country?: string | null
  name?: string | null
  description?: string | null
}

export interface InfrastructureResource {
  id: string
  type: InfrastructureType
  kind?: 'compute' | 'network' | 'edge' | string
  name: string
  status: InfrastructureStatus
  location?: InfrastructureLocation | string | null
  external_id?: string | null
  provider?: string | null
  realm_id?: string | null
  metadata?: Record<string, unknown> | null
  routes?: Array<Record<string, unknown>> | null
  ip_addresses?: Array<string | IpAddress> | null
  ssh_keys?: Array<string | SshKey> | null
  monthly_cost?: string | number | null
  currency?: string | null
  created_at?: string
  updated_at?: string
}

/* Domains & DNS */

export interface Domain {
  id: string
  name: string
  registrar?: string | null
  expires_at?: string | null
  registered_at?: string | null
  renewal_at?: string | null
  status?: string
  auto_renew?: boolean
  transfer_lock?: boolean
  nameservers?: string[] | null
  notes?: string | null
  provider?: string | null
  realm_id?: string | null
  metadata?: Record<string, unknown>
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface DnsRecord {
  id: string
  type: string
  name: string
  value: string
  ttl?: number | null
  priority?: number | null
  comment?: string | null
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface DnsCheckReport {
  domain?: string
  checked_at?: string
  matched?: number
  live?: DnsRecord[]
  missing?: DnsRecord[]
  unexpected?: DnsRecord[]
  [key: string]: unknown
}

export interface DnsDelegation {
  id: string
  pattern: string
  target_entity_id?: string | null
  created_at?: string
  [key: string]: unknown
}

/* Monitoring */

export interface MonitoringCheck {
  id: string
  name: string
  type?: string
  target?: string
  status?: string
  enabled?: boolean
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

/* Incidents */

export interface Incident {
  id: string
  title: string
  description?: string | null
  severity?: string
  status?: string
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface IncidentUpdate {
  id: string
  content?: string | null
  message?: string | null
  status?: string
  severity?: string
  created_at?: string
  [key: string]: unknown
}

/* Applications / services */

export interface Service {
  id: string
  name: string
  type?: string
  status?: string
  description?: string | null
  provider?: string | null
  metadata?: Record<string, unknown> | null
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

/* Projects */

export interface Project {
  id: string
  name: string
  description?: string | null
  status?: string
  start_date?: string | null
  due_date?: string | null
  progress?: { tasks_total?: number; tasks_done?: number; percent?: number }
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface Task {
  id: string
  title?: string
  name?: string
  description?: string | null
  status?: string
  assignee?: { id: string; name?: string } | string | null
  due_date?: string | null
  position?: number
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface Milestone {
  id: string
  name?: string
  title?: string
  due_date?: string | null
  completed_at?: string | null
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

/* Security */

export interface SecurityFinding {
  id: string
  title?: string
  severity?: string
  cvss_score?: number | string | null
  cvss?: number | string | null
  status?: string
  source?: string | null
  external_id?: string | null
  description?: string | null
  remediation?: string | null
  assignee?: string | null
  due_date?: string | null
  resolved_at?: string | null
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

/* Finance */

export interface Vendor {
  id: string
  name: string
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface Invoice {
  id: string
  invoice_number?: string | null
  number?: string
  vendor?: string | null
  vendor_name?: string | null
  customer?: string | null
  issue_date?: string | null
  due_date?: string | null
  net_amount?: string | number | null
  tax_amount?: string | number | null
  gross_amount?: string | number | null
  amount?: string | number | null
  currency?: string | null
  status?: string
  notes?: string | null
  due_at?: string | null
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface Expense {
  id: string
  description?: string | null
  vendor?: string | null
  date?: string | null
  amount?: string | number | null
  tax_amount?: string | number | null
  currency?: string | null
  status?: string
  category?: string | null
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface Budget {
  id: string
  name?: string
  amount?: string | number | null
  currency?: string | null
  period?: string | null
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface Transaction {
  id: string
  type?: string
  description?: string | null
  currency?: string | null
  amount?: string | number | null
  net_amount?: string | number | null
  status?: string
  occurred_at?: string | null
  provider?: string | null
  metadata?: Record<string, unknown> | null
  [key: string]: unknown
}

export interface InvoiceIntakeConfig {
  id: string
  name?: string
  description?: string | null
  scope_module?: string | null
  provider_slug?: string | null
  category?: string | null
  purpose?: string | null
  trust_policy_mode?: string
  max_attachment_mb?: number
  allowed_file_types?: string[]
  status?: string
  revoked_at?: string | null
  address?: string | null
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface InvoiceIntakeSender {
  id: string
  kind?: 'address' | 'domain' | string
  value?: string
  [key: string]: unknown
}

export interface InvoiceIntakeMessage {
  id: string
  config_id?: string | null
  transport?: string
  from_address?: string | null
  from_name?: string | null
  status?: string
  disposition?: string | null
  spam_score?: number | null
  auth_results?: unknown
  subject?: string | null
  received_at?: string
  processed_at?: string | null
  error?: string | null
  attachment_count?: number
  attachments?: Array<{ id: string; filename?: string; mime_type?: string; size_bytes?: number; scanned?: boolean }>
  created_at?: string
  [key: string]: unknown
}

/* Providers */

export interface ProviderCredentialField {
  key: string
  label: string
  type: 'text' | 'password' | 'textarea'
  required?: boolean
  hint?: string
  placeholder?: string
}

export interface ProviderCredentialSchema {
  fields: ProviderCredentialField[]
  note?: string
}

export interface ProviderCredentialSchemaResource {
  id: string
  slug: string
  name: string
  credential_schema: ProviderCredentialSchema
}

export interface Provider {
  id?: string
  slug: string
  name: string
  category?: string
  regions?: Array<{ slug: string; name: string }>
  status?: string
  [key: string]: unknown
}

export interface ProviderConnection {
  id: string
  provider?: { slug: string; name: string } | string | null
  name?: string
  status?: string
  health?: string | null
  realm_id?: string | null
  region?: string | null
  webhook?: { enabled: boolean; token: string; path: string; url: string } | null
  last_checked_at?: string | null
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface ProviderResource {
  id: string
  provider: string
  type: string
  external_id?: string | null
  name?: string | null
  metadata?: Record<string, unknown>
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface ProviderSync {
  id: string
  provider?: string
  status?: string
  created_at?: string
  [key: string]: unknown
}

export interface ProviderAccount {
  id: string
  name?: string
  provider?: string | null
  external_id?: string | null
  realm_id?: string | null
  shared?: boolean
  owner_entity_id?: string | null
  created_at?: string
  [key: string]: unknown
}

export interface ProviderAccountAssignment {
  id: string
  entity_id?: string | null
  realm_id?: string | null
  [key: string]: unknown
}

/* Misc modules */

export interface DocumentItem {
  id: string
  name?: string
  title?: string
  type?: string
  content?: string | null
  tags?: string[]
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface DocumentGrant {
  id: string
  entity_id?: string | null
  realm_id?: string | null
  [key: string]: unknown
}

export interface AutomationRule {
  id: string
  name?: string
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface Backup {
  id: string
  name?: string
  status?: string
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface Asset {
  id: string
  name?: string
  type?: string
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface Contact {
  id: string
  name?: string
  email?: string | null
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface Campaign {
  id: string
  name?: string
  status?: string
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface Communication {
  id: string
  subject?: string | null
  created_at?: string
  [key: string]: unknown
}

export interface MailAccount {
  id: string
  email?: string
  name?: string
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface EmailSender {
  id: string
  name?: string
  email?: string
  domain?: string
  spf_status?: string | null
  dkim_status?: string | null
  dns_checked_at?: string | null
  provider?: string | null
  created_at?: string
  [key: string]: unknown
}

export interface EmailTemplate {
  id: string
  name?: string
  subject?: string | null
  body?: string | null
  created_at?: string
  [key: string]: unknown
}

export interface EmailDelivery {
  id: string
  subject?: string | null
  recipient?: string | null
  sender?: string | null
  template?: string | null
  status?: string
  provider_message_id?: string | null
  error?: string | null
  sent_at?: string | null
  created_at?: string
  [key: string]: unknown
}

export interface DeliveryEvent {
  id?: string
  type?: string
  occurred_at?: string
  metadata?: Record<string, unknown>
  [key: string]: unknown
}

export interface ApiToken {
  id: string
  name?: string
  token?: string
  created_at?: string
  expires_at?: string | null
  [key: string]: unknown
}

export interface StoragePolicy {
  disk?: string
  max_attachment_mb?: number
  allowed_file_types?: string[]
  retention_days?: number | null
}

export interface ReportSummary {
  id?: string
  name?: string
  infrastructure?: { total?: number; online?: number; [key: string]: unknown }
  domains?: { total?: number; expiring_soon?: number; [key: string]: unknown }
  monitoring?: { total?: number; enabled?: number; down?: number; [key: string]: unknown }
  finance?: {
    invoices?: number
    invoices_total?: number | string
    expenses?: number
    expenses_total?: number | string
    budgets?: number
    budgets_total?: number | string
    [key: string]: unknown
  }
  members?: number
  provider_connections?: number
  [key: string]: unknown
}

export interface IotDevice {
  id: string
  name?: string
  type?: string
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export type PowerAction = 'start' | 'stop' | 'restart'

export interface AuditLog {
  id: string
  action?: string
  message?: string | null
  user?: string | null
  ip_address?: string | null
  created_at?: string
  [key: string]: unknown
}

export interface ScimConfig {
  enabled?: boolean
  token_set?: boolean
  created_at?: string | null
  [key: string]: unknown
}
