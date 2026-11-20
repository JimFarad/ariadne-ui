import type { InfrastructureLocation, IpAddress, SshKey } from '@/types/api'

const INFRA_TYPE_LABELS: Record<string, string> = {
  server: 'Server',
  vps: 'VPS',
  host: 'Host',
  vm: 'VM',
  container: 'Container',
  tunnel: 'Cloudflare Tunnel',
  worker: 'Cloudflare Worker',
  worker_domain: 'Worker domain',
  access_app: 'Access app',
}

/** Human-friendly label for an infrastructure resource type. */
export function infraTypeLabel(type: string): string {
  return INFRA_TYPE_LABELS[type] ?? type
}

/** Format an infrastructure `location` (string or object) for display. */
export function locationLabel(loc: InfrastructureLocation | string | null | undefined): string {
  if (!loc) return '—'
  if (typeof loc === 'string') return loc
  if (loc.name) return loc.name
  const parts = [loc.city, loc.country].filter(Boolean)
  return parts.join(', ') || loc.code || '—'
}

/** Normalize an IP address entry (string or {address,type}) to a string. */
export function ipAddressLabel(ip: string | IpAddress): string {
  if (typeof ip === 'string') return ip
  return ip.address ?? ''
}

/** Normalize an SSH key entry (string or {name,public_key}) to a string. */
export function sshKeyLabel(key: string | SshKey): string {
  if (typeof key === 'string') return key
  return key.public_key ?? key.name ?? ''
}

export function sshKeyName(key: string | SshKey): string {
  if (typeof key === 'string') return ''
  return key.name ?? ''
}
