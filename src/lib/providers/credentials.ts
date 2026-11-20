/**
 * Credential field schemas per provider, sourced from the backend's
 * `docs/providers.md` research register and driver implementations.
 *
 * The ARIADNE API exposes the provider catalogue (`GET /v1/providers`) with
 * `regions`, but does not expose credential field schemas — so the schema is
 * maintained here and used to render the connection form per provider.
 */

export interface CredentialField {
  key: string
  label: string
  type: 'text' | 'password' | 'textarea'
  required?: boolean
  hint?: string
  placeholder?: string
}

export interface ProviderCredentialSchema {
  fields: CredentialField[]
  note?: string
  /** Advanced free-form config keys (sent under `config`, not credentials). */
  configHint?: string
}

const oauth = (): CredentialField[] => [
  { key: 'client_id', label: 'Client ID', type: 'text', required: true },
  { key: 'client_secret', label: 'Client secret', type: 'password', required: true },
  { key: 'refresh_token', label: 'Refresh token', type: 'password', required: true },
]

export const PROVIDER_CREDENTIALS: Record<string, ProviderCredentialSchema> = {
  cloudflare: {
    note: 'Bearer API token against api.cloudflare.com.',
    fields: [
      { key: 'api_token', label: 'API token', type: 'password', required: true },
      { key: 'account_id', label: 'Account ID (optional)', type: 'text', hint: 'Required for account-scoped resources: tunnels, Workers, registrar domains.' },
    ],
  },
  bunny: {
    note: 'The Bunny.net API AccessKey.',
    fields: [{ key: 'access_key', label: 'Access key', type: 'password', required: true }],
  },
  hetzner: {
    note: 'Bearer API token against api.hetzner.cloud.',
    fields: [{ key: 'api_token', label: 'API token', type: 'password', required: true }],
  },
  stripe: {
    note: 'Read-only — no money movement.',
    fields: [{ key: 'secret_key', label: 'Secret key', type: 'password', required: true }],
  },
  github: {
    note: 'Personal access token.',
    fields: [{ key: 'access_token', label: 'Access token (PAT)', type: 'password', required: true }],
  },
  ovhcloud: {
    note: 'Consumer key signing against the selected region endpoint.',
    fields: [
      { key: 'application_key', label: 'Application key', type: 'text', required: true },
      { key: 'application_secret', label: 'Application secret', type: 'password', required: true },
      { key: 'consumer_key', label: 'Consumer key', type: 'password', required: true },
    ],
  },
  'oracle-cloud': {
    note: 'OCI v1 request signing.',
    fields: [
      { key: 'user_ocid', label: 'User OCID', type: 'text', required: true },
      { key: 'tenancy_ocid', label: 'Tenancy OCID', type: 'text', required: true },
      { key: 'fingerprint', label: 'Key fingerprint', type: 'text', required: true },
      { key: 'private_key', label: 'Private key (PEM)', type: 'textarea', required: true },
    ],
  },
  wise: {
    note: 'Use an API token, or OAuth client credentials for statements.',
    fields: [
      { key: 'api_token', label: 'API token', type: 'password', hint: 'Preferred for profiles and accounts.' },
      { key: 'client_id', label: 'Client ID (OAuth, optional)', type: 'text' },
      { key: 'client_secret', label: 'Client secret (OAuth, optional)', type: 'password' },
      { key: 'refresh_token', label: 'Refresh token (OAuth, optional)', type: 'password' },
    ],
  },
  zoho: {
    note: 'Zoho Subscriptions (OAuth2).',
    fields: oauth(),
  },
  'zoho-mail': {
    note: 'Mail accounts and groups (OAuth2).',
    fields: oauth(),
  },
  zeptomail: {
    note: 'Zoho CPaaS management API (OAuth2).',
    fields: oauth(),
  },
  mailchimp: {
    note: 'The datacenter prefix is chosen via the region selector.',
    fields: [{ key: 'api_key', label: 'API key', type: 'password', required: true }],
  },
  emnify: {
    note: 'Application-token authentication.',
    fields: [{ key: 'application_token', label: 'Application token', type: 'password', required: true }],
  },
}

export function schemaForProvider(slug: string): ProviderCredentialSchema | null {
  return PROVIDER_CREDENTIALS[slug] ?? null
}
