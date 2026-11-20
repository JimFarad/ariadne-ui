/**
 * Centralized API client.
 *
 * All HTTP calls to the ARIADNE API go through here. The client injects
 * authentication and workspace context headers, unwraps the `{ data }`
 * envelope, and normalizes RFC 9457 problem details into `ApiError`.
 */
import { getAccessToken, refreshSession, hasSession } from '@/lib/auth/session'
import type { Envelope, ProblemDetails } from '@/types/api'
import { toQueryString } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* Workspace / realm / timezone context                                */
/* ------------------------------------------------------------------ */

export interface ApiContext {
  entityId: string | null
  realmId: string | null
  timezone: string
}

let apiContext: ApiContext = {
  entityId: null,
  realmId: null,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
}

export function setApiContext(next: Partial<ApiContext>) {
  apiContext = { ...apiContext, ...next }
}

export function getApiContext(): ApiContext {
  return apiContext
}

/* ------------------------------------------------------------------ */
/* Errors                                                              */
/* ------------------------------------------------------------------ */

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly detail: string
  readonly requestId: string | null
  readonly retryAfter: number | null
  readonly fieldErrors: Array<{ field: string; message: string }>

  constructor(problem: ProblemDetails, status: number, headers: Headers) {
    super(problem.detail || problem.title || `Request failed (${status})`)
    this.name = 'ApiError'
    this.status = status
    this.code = problem.code || 'unknown'
    this.detail = problem.detail || problem.title || ''
    this.requestId = problem.request_id || headers.get('request-id') || headers.get('Request-ID') || null
    this.retryAfter = Number(headers.get('retry-after') || 0) || null
    this.fieldErrors = problem.errors || []
  }

  get isUnauthorized() {
    return this.status === 401
  }

  get isForbidden() {
    return this.status === 403
  }

  get isNotFound() {
    return this.status === 404
  }

  get isRateLimited() {
    return this.status === 429
  }

  get isValidation() {
    return this.status === 422
  }
}

/* ------------------------------------------------------------------ */
/* Diagnostics (last request)                                          */
/* ------------------------------------------------------------------ */

export interface RequestDiagnostic {
  method: string
  url: string
  status: number | null
  durationMs: number | null
  requestId: string | null
  errorCode: string | null
  at: string
}

let lastDiagnostic: RequestDiagnostic | null = null
const diagnosticsListeners = new Set<() => void>()

export function getLastDiagnostic(): RequestDiagnostic | null {
  return lastDiagnostic
}

export function onDiagnostic(listener: () => void): () => void {
  diagnosticsListeners.add(listener)
  return () => diagnosticsListeners.delete(listener)
}

function emitDiagnostic() {
  for (const listener of diagnosticsListeners) listener()
}

/* ------------------------------------------------------------------ */
/* Request plumbing                                                    */
/* ------------------------------------------------------------------ */

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8801').replace(/\/$/, '')

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | boolean | null | undefined>
  headers?: Record<string, string>
  /** Retry once after a 401 + token refresh (default true). */
  retryAuth?: boolean
  /** Signal for request cancellation. */
  signal?: AbortSignal
  /** Skip Content-Type JSON (e.g. FormData body). */
  rawBody?: boolean
}

async function buildUrl(path: string, query?: RequestOptions['query']): Promise<string> {
  const base = path.startsWith('http') ? path : `${API_BASE_URL}${path}`
  return `${base}${query ? toQueryString(query) : ''}`
}

async function runFetch<T>(path: string, options: RequestOptions): Promise<Envelope<T>> {
  const method = options.method || 'GET'
  const url = await buildUrl(path, options.query)
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  }

  const token = getAccessToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const ctx = apiContext
  if (ctx.entityId) headers['Ariadne-Workspace'] = ctx.entityId
  if (ctx.realmId) headers['Ariadne-Realm'] = ctx.realmId
  if (ctx.timezone) headers['Time-Zone'] = ctx.timezone

  headers['Ariadne-Client-Name'] = 'ariadne-ui'
  headers['Ariadne-Client-Platform'] = 'web'
  headers['Ariadne-Client-Environment'] = import.meta.env.VITE_APP_ENV || 'development'

  let body: BodyInit | undefined
  if (options.body !== undefined) {
    if (options.rawBody) {
      body = options.body as BodyInit
    } else {
      headers['Content-Type'] = 'application/json'
      body = JSON.stringify(options.body)
    }
  }

  const started = performance.now()
  const res = await fetch(url, { method, headers, body, signal: options.signal })

  const requestId = res.headers.get('request-id') || res.headers.get('Request-ID')

  // Recover from an expired access token: refresh once, then retry.
  if (res.status === 401 && options.retryAuth !== false && hasSession()) {
    try {
      await refreshSession()
      const retried = await runFetch<T>(path, { ...options, retryAuth: false })
      return retried
    } catch {
      // Session unrecoverable; fall through and surface the original 401.
    }
  }

  const contentType = res.headers.get('content-type') || ''
  const isJson = contentType.includes('json')

  if (!res.ok) {
    let problem: ProblemDetails = {}
    if (isJson) {
      try {
        problem = (await res.json()) as ProblemDetails
      } catch {
        /* non-JSON error body */
      }
    }
    const error = new ApiError(problem, res.status, res.headers)
    lastDiagnostic = {
      method,
      url,
      status: res.status,
      durationMs: Math.round(performance.now() - started),
      requestId,
      errorCode: error.code,
      at: new Date().toISOString(),
    }
    emitDiagnostic()
    throw error
  }

  if (res.status === 204) {
    lastDiagnostic = {
      method,
      url,
      status: 204,
      durationMs: Math.round(performance.now() - started),
      requestId,
      errorCode: null,
      at: new Date().toISOString(),
    }
    emitDiagnostic()
    return { data: undefined as T }
  }

  const json = isJson ? ((await res.json()) as Envelope<T>) : ({ data: undefined as T } as Envelope<T>)

  lastDiagnostic = {
    method,
    url,
    status: res.status,
    durationMs: Math.round(performance.now() - started),
    requestId,
    errorCode: null,
    at: new Date().toISOString(),
  }
  emitDiagnostic()

  return json
}

/** Unwrap the `data` envelope. */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const envelope = await runFetch<T>(path, options)
  return envelope.data
}

/** Return the full envelope (data + meta + links) — for paginated lists. */
export async function apiEnvelope<T>(path: string, options: RequestOptions = {}): Promise<Envelope<T>> {
  return runFetch<T>(path, options)
}

export const api = {
  get: <T>(path: string, options: RequestOptions = {}) => apiFetch<T>(path, { ...options, method: 'GET' }),
  getEnvelope: <T>(path: string, options: RequestOptions = {}) => apiEnvelope<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options: RequestOptions = {}) => apiFetch<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options: RequestOptions = {}) => apiFetch<T>(path, { ...options, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, options: RequestOptions = {}) => apiFetch<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options: RequestOptions = {}) => apiFetch<T>(path, { ...options, method: 'DELETE' }),
}

/** Resolve a pagination `next`/`self` link (relative or absolute). */
export function resolveLink(link: string | null | undefined): string | null {
  if (!link) return null
  if (link.startsWith('http')) {
    // Strip the API base so the client re-applies auth/context headers.
    const base = API_BASE_URL
    if (link.startsWith(base)) return link.slice(base.length)
    return link
  }
  return link
}
