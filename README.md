# ARIADNE — Web Application

The React frontend for the ARIADNE management & operations platform. It
authenticates against SOLARIS (OIDC + PKCE) and drives the ARIADNE JSON API
(`/v1`).

## Stack

- **React 19** + **TypeScript** + **Vite**
- **React Router** (data router) for routing
- **TanStack Query** for data fetching, caching, mutation and invalidation
- **Tailwind CSS v4** for styling, with a bespoke dark/light token system
- **Radix UI** primitives (dialog, dropdown, select, switch, tabs, tooltip, …)
- **Lucide** icons, **React Hook Form**, **Zod** (installed for validation where
  useful)

## Getting started

```bash
npm install
cp .env.example .env      # adjust if needed
npm run dev               # http://localhost:5173 (or next free port)
```

The frontend calls the ARIADNE API directly at `VITE_API_BASE_URL`
(default `http://localhost:8801`). CORS is `*` in the API's local
configuration.

## Configuration (`.env`)

Vite client variables are **public** and embedded in the bundle. Never put
secrets here.

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | ARIADNE API origin (no trailing slash). |
| `VITE_OIDC_DISCOVERY_URL` | SOLARIS `.well-known/openid-configuration`. |
| `VITE_OIDC_CLIENT_ID` | Public OIDC client id (safe in the SPA). |
| `VITE_OIDC_REDIRECT_URI` | OAuth redirect; defaults to `${origin}/auth/callback`. |
| `VITE_OIDC_SCOPES` | Space-separated scopes (`openid profile email`). |
| `VITE_OIDC_POST_LOGOUT_REDIRECT_URI` | Post-logout redirect (defaults to origin). |
| `VITE_APP_ENV` | Reported in the `Ariadne-Client-Environment` header. |

> The redirect URI must be registered with SOLARIS. If Vite picks a port other
> than `5173` (because it is busy), the callback origin changes — register the
> URI matching the origin you actually use, or set `VITE_OIDC_REDIRECT_URI`
> explicitly.

## Authentication

Authorization Code + PKCE against SOLARIS:

1. `startLogin()` generates `state`, `nonce` and a `code_verifier`, stores the
   PKCE state in `sessionStorage`, and redirects to the authorization endpoint.
2. The `/auth/callback` route verifies `state`, exchanges the code at the token
   endpoint, and stores the result.
3. The **access token** is kept in memory only; the **refresh token** is
   persisted in `localStorage`. Every API call attaches
   `Authorization: Bearer <access_token>`.
4. On `401` the client performs a **single-flight** refresh (one shared
   promise — concurrent 401s cannot trigger racing refreshes) and retries the
   request once. A failed refresh clears the session and drops to the login
   screen. There is no infinite retry: each request retries at most once.

## Architecture

```
src/
  components/
    layout/        AppShell, Sidebar, Topbar, SearchDialog, PageHeader
    ui/            design-system primitives (button, dialog, table, …)
    data/          DataTable, EmptyState, ErrorState
    forms/         CrudPage, ConfirmDialog, FormField
    ProtectedRoute.tsx
  context/
    AuthContext.tsx        session bootstrap, login/logout, user
    WorkspaceContext.tsx   workspaces, active entity/realm, enabled modules
    ThemeContext.tsx       dark/light theme
  hooks/
    usePaginatedList.ts    server-paginated list bound to the active workspace
  lib/
    api/client.ts          centralized fetch: auth + workspace headers, envelope,
                           RFC 9457 errors, 401 recovery, request diagnostics
    auth/oidc.ts           PKCE + SOLARIS discovery
    auth/session.ts        token lifecycle + single-flight refresh
    modules/registry.ts    navigation registry (module → nav group/icon/path)
    utils.ts
  pages/                   feature pages (code-split in production)
  types/api.ts             API types
```

### API client

All HTTP goes through `src/lib/api/client.ts` — pages never call `fetch`
directly. It injects:

- `Authorization: Bearer <access_token>`
- `Ariadne-Workspace` / `Ariadne-Realm` (from the active selection, always
  taken from API responses — never constructed)
- `Time-Zone`, `Accept: application/json`
- `Ariadne-Client-*` identification headers

It unwraps the `{ data }` envelope, returns `meta`/`links` for pagination, and
normalizes RFC 9457 problem details into `ApiError` (with `status`, `code`,
`detail`, `request_id`, `Retry-After` and field-level `errors` for 422s).

### Workspace & realm context

`WorkspaceContext` bootstraps from `GET /v1/workspaces`, resolves the active
workspace (persisted in `localStorage`, falling back to the first), fetches
entity modules and realms, and keeps the API client's context in sync. Query
keys embed the active entity id, so switching workspaces refetches all
workspace-scoped data and old data cannot leak into the new workspace.

### Dynamic module navigation

`src/lib/modules/registry.ts` maps every module slug to a nav group, icon and
path. The sidebar filters items by the active workspace's enabled modules
(`GET /v1/workspaces/{entity}/modules`); disabled modules disappear from
navigation and a disabled module's routes return `403` (handled as a real
authorization failure, not silently as "disabled"). Adding a module means
adding an entry to the registry — no shell changes.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server. |
| `npm run build` | Typecheck + production build. |
| `npm run preview` | Preview the production build. |
| `npm run typecheck` | TypeScript only. |
| `npm test` | Run Vitest once. |

## Testing

Vitest + Testing Library. Tests cover the PKCE code challenge (RFC 7636
vector), API error normalization, utility helpers and protected-route
behaviour. Run `npm test`.

## Deployment

The frontend is a static build and can be deployed independently of the
backend, provided the API and SOLARIS endpoints are reachable from the
browser:

```bash
npm run build      # outputs dist/
```

Serve `dist/` from any static host. Configure `VITE_API_BASE_URL` and the OIDC
variables at build time (they are baked into the bundle).

## Known limitations

- **SOLARIS redirect URI**: must be registered with the identity provider for
  the origin you run the app on.
- **No global search API**: the search entry point searches the local
  navigation; there is no backend global-search endpoint.
- **Documents grants** and **invoice-intake trusted senders** sub-resources are
  reachable via the API but not yet exposed as dedicated UI.
- **Machine-token / session-cookie auth** is supported by the API; the SPA uses
  the OIDC bearer-token flow.
- **Developer diagnostics** are available at `/dev` (dev builds only) via the
  account menu; they never display tokens or credentials.
