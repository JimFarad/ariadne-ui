# ARIADNE API — verified surface snapshot

> Captured from the **live API** (`http://localhost:8801`) on **2026-11-20**,
> against workspace `ent_01m7wcgrvmxepw9ea0kkfbqtgd` with a real SOLARIS access
> token. This file lives in the UI repo so it can be diffed against the
> backend's hand-written `docs/` (in `maknet-ariadne-api`). The live API is the
> source of truth; where this snapshot disagrees with the prose docs, trust this.

## Endpoints that changed / deserve attention

### `GET /v1/providers/{provider}/credential-schema`

New. Returns the ordered credential fields for a provider:

```json
{
  "data": {
    "id": "prv_01…",
    "slug": "cloudflare",
    "name": "Cloudflare",
    "credential_schema": {
      "note": "Bearer API token against api.cloudflare.com.",
      "fields": [
        { "key": "api_token", "label": "API token", "type": "password", "required": true, "hint": "…" },
        { "key": "account_id", "label": "Account ID", "type": "text", "required": false, "hint": "…" }
      ]
    }
  }
}
```

Field `type` ∈ `text | password | textarea`. `404 provider_not_found` for an
unknown slug. The catalogue (`GET /v1/providers`) stays lean and does **not**
inline the schema.

### `GET /v1/dashboard`

`data.entity` sub-shapes:

```jsonc
{
  "entity": {
    "summary": { "members": 1, "realms": 3, "provider_connections": 5, "provider_accounts": 5, "provider_resources": 1520 },
    "providers": [ { "id": "pcn_…", "provider": "cloudflare", "name": "Cloudflare Mak", "health": "healthy" } ],
    "recent_syncs": [ { "id": "psn_…", "status": "succeeded", "finished_at": "…" } ],
    "recent_events": [ { "id": "aud_…", "action": "provider.connection.created", "description": null, "created_at": "…" } ]
  }
}
```

> The older prose docs did not specify these — the UI previously rendered
> `"Event"`/`"Sync"` because it expected `event.type` / `sync.provider`.

### `GET /v1/workspaces/{entity}/infrastructure`

```jsonc
{
  "id": "inf_…",
  "type": "server",
  "name": "ubuntu-4gb-nbg1-2",
  "status": "online",
  "location": { "code": "nbg1", "city": "Nuremberg", "country": "DE", "name": "Nuremberg, DE", "description": "Nuremberg DC Park 1" },
  "external_id": "40921660",
  "provider": "hetzner",
  "realm_id": null,
  "metadata": { "server_type": "cx33", "cores": 4, "memory_gb": 8, "disk_gb": 80, "public_ipv4": "159.69.82.140", "…": "…" },
  "ip_addresses": ["159.69.82.140"],
  "ssh_keys": null,
  "monthly_cost": "8.49",
  "currency": "EUR"
}
```

> `location` is an **object**, and `ip_addresses` are **plain strings** — the
> older docs showed `location: null` and `ip_addresses: [{address,type}]`.

Infrastructure `type` is an enum that now also includes the Cloudflare edge
resource kinds: `tunnel`, `worker`, `worker_domain`, and `access_app` (in
addition to the classic server kinds like `server`/`vps`/`vm`/`container`).
Their Cloudflare-specific fields arrive in `metadata` and are surfaced by the
UI's generic metadata rendering.

### `GET /v1/workspaces/{entity}/domains`

```jsonc
{
  "id": "dom_…",
  "name": "appoploo.com",
  "registrar": "Cloudflare",
  "status": "active",
  "expires_at": "…",
  "registered_at": null,
  "renewal_at": null,
  "nameservers": ["bella.ns.cloudflare.com", "watson.ns.cloudflare.com"],
  "auto_renew": true,
  "transfer_lock": true,
  "notes": null,
  "provider": "cloudflare",
  "realm_id": null,
  "metadata": { "…": "…" },
  "created_at": "…"
}
```

`GET …/domains/{domain}/records` returns:

```jsonc
{ "id": "…", "type": "A", "name": "…", "value": "…", "ttl": 3600, "priority": null, "comment": null }
```

Record types: `A, AAAA, CNAME, MX, TXT, NS, SRV, CAA, PTR`. Only `MX`/`SRV`
carry `priority`. There is **no** `proxied` field on domain records (Cloudflare
proxying lives in provider-resource metadata, not the domain-records API).

### `POST …/domains/{domain}/check-dns`

```jsonc
{
  "domain": "appoploo.com",
  "checked_at": "…",
  "matched": 12,           // number, not a list
  "live": [ { "type": "A", "name": "…", "value": "…" } ],      // resolving now
  "missing": [ { "type": "MX", "name": "…", "value": "…" } ],  // in inventory, not resolving
  "unexpected": [ { "type": "TXT", "name": "…", "value": "…" } ] // resolving, not in inventory
}
```

> `matched` is a **count** and `live` holds the matched records — the older
> shape had `matched` as a record array.

### DNS delegation

```
GET    /v1/workspaces/{entity}/domains/{domain}/delegations
POST   /v1/workspaces/{entity}/domains/{domain}/delegations          { "pattern": "*._domainkey", "entity": "ent_…" }
DELETE /v1/workspaces/{entity}/domains/{domain}/delegations/{delegation}
```

Delegation objects: `{ id, pattern, target_entity_id, created_at }`. `pattern`
is an exact name or wildcard (`*.sub`); `target_entity_id` is the workspace the
matching records are delegated to.

### `GET /v1/workspaces/{entity}/reports/summary`

```jsonc
{
  "id": "ent_…",
  "name": "Appoploo PC",
  "infrastructure": { "total": 1, "online": 1 },
  "domains": { "total": 8, "expiring_soon": 0 },
  "monitoring": { "total": 0, "enabled": 0, "down": 0 },
  "finance": { "invoices": 0, "invoices_total": 0, "expenses": 0, "expenses_total": 0, "budgets": 0, "budgets_total": 0 },
  "members": 1,
  "provider_connections": 5
}
```

### Provider endpoints

- `GET …/provider-connections` → `{ id, provider: { slug, name }, name, status, health, realm_id, region, last_checked_at, created_at }`
- `GET …/provider-accounts` → `{ id, provider: "<slug string>", external_id, name, realm_id }`
- `GET …/provider-resources` → `{ id, provider: "<slug string>", type, external_id, name, metadata }`
- `GET …/provider-syncs` → `{ id, status, started_at, finished_at, error }`

> Note `provider` is an **object** on connections, but a **string slug** on
> accounts and resources.

### Applications / services (GitHub mirror)

`GET …/services` returns `{ id, name, type, status, description, provider (slug), metadata }`.
GitHub repositories and organizations are mirrored here as `type=repository` /
`type=organization`, with `metadata.language`, `metadata.html_url` and
`metadata.private`. Issues and pull requests stay in `provider-resources` only.

### Finance serialize shapes

- Vendor: `{ id, name, email, website }`
- Invoice: `{ id, invoice_number, vendor (name), customer, issue_date, due_date, currency, net_amount, tax_amount, gross_amount, status, notes }`
- Expense: `{ id, vendor (name), date, currency, amount, tax_amount, description, status }`
- Budget: `{ id, name, period, currency, amount, spent }`
- Transaction: `{ id, type, description, currency, amount, net_amount, status, occurred_at, provider (slug), metadata }`

`PATCH /invoices/{id}` accepts **only** `status`, `due_date`, `notes`.

### `GET /v1/workspaces/{entity}/transactions`

Money movement mirrored from Stripe into a finance ledger. Filters: `?type=`
and `?status=` (exact match). Types: `charge`, `balance_transaction`,
`payment_intent`, `payout`, `refund`, `dispute`. Amounts are in **major units**
(euros/dollars, converted from cents); balance transactions can be negative
(fees).

### `GET /v1/status` (authenticated diagnostics)

```jsonc
{ "status": "…", "version": "…", "build": "…", "api_version": "…", "environment": "…", "installation_id": "…", "modules": 22 }
```

## Known permission gaps (as of this snapshot)

For the test user (Owner role), these returned `403` despite enabled modules:

- `GET /v1/workspaces/{entity}/storage-policy`
- `GET /v1/workspaces/{entity}/invoice-intake-configs`
- `GET /v1/workspaces/{entity}/invoice-intake-messages`
