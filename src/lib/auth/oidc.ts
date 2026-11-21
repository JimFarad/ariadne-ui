/** PKCE + SOLARIS OIDC helpers (browser only). */

export interface DiscoveryDocument {
  issuer: string
  authorization_endpoint: string
  token_endpoint: string
  userinfo_endpoint: string
  end_session_endpoint?: string
  jwks_uri: string
  scopes_supported?: string[]
  code_challenge_methods_supported?: string[]
}

export interface TokenSet {
  access_token: string
  id_token?: string
  refresh_token?: string
  token_type?: string
  expires_in?: number
}

export const oidcConfig = {
  get discoveryUrl() {
    return import.meta.env.VITE_OIDC_DISCOVERY_URL || ''
  },
  get clientId() {
    return import.meta.env.VITE_OIDC_CLIENT_ID || ''
  },
  get redirectUri() {
    return import.meta.env.VITE_OIDC_REDIRECT_URI || `${window.location.origin}/auth/callback`
  },
  get postLogoutRedirectUri() {
    return import.meta.env.VITE_OIDC_POST_LOGOUT_REDIRECT_URI || window.location.origin
  },
  get scopes() {
    return (import.meta.env.VITE_OIDC_SCOPES || 'openid profile email').trim()
  },
}

const OIDC_STATE_KEY = 'ariadne.oidc.state'
const DISCOVERY_CACHE_KEY = 'ariadne.oidc.discovery'
const DISCOVERY_TTL_MS = 24 * 60 * 60 * 1000 // discovery documents rarely change

interface CachedDiscovery {
  document: DiscoveryDocument
  fetched_at: number
}

let discoveryPromise: Promise<DiscoveryDocument> | null = null
let discoveryMemo: DiscoveryDocument | null = null

function readCachedDiscovery(): DiscoveryDocument | null {
  try {
    const raw = localStorage.getItem(DISCOVERY_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedDiscovery
    if (!parsed?.document?.token_endpoint) return null
    if (Date.now() - parsed.fetched_at > DISCOVERY_TTL_MS) return null
    return parsed.document
  } catch {
    return null
  }
}

function writeCachedDiscovery(doc: DiscoveryDocument) {
  try {
    localStorage.setItem(DISCOVERY_CACHE_KEY, JSON.stringify({ document: doc, fetched_at: Date.now() }))
  } catch {
    // Storage may be unavailable; the in-memory memo still avoids refetches this session.
  }
}

export function clearDiscoveryCache() {
  discoveryMemo = null
  try {
    localStorage.removeItem(DISCOVERY_CACHE_KEY)
  } catch {
    // ignore
  }
}

function fetchDiscovery(): Promise<DiscoveryDocument> {
  return fetch(oidcConfig.discoveryUrl, { headers: { Accept: 'application/json' } }).then((res) => {
    if (!res.ok) throw new Error(`OIDC discovery failed: ${res.status}`)
    return res.json() as Promise<DiscoveryDocument>
  })
}

/**
 * Resolve the OIDC discovery document, preferring the persisted cache so a
 * page reload doesn't re-fetch it. The document is only fetched when there is
 * no cached copy or the cached copy has expired.
 */
export function getDiscovery(): Promise<DiscoveryDocument> {
  if (discoveryMemo) return Promise.resolve(discoveryMemo)

  if (!discoveryPromise) {
    const cached = readCachedDiscovery()
    if (cached) {
      discoveryMemo = cached
      return Promise.resolve(cached)
    }

    discoveryPromise = fetchDiscovery()
      .then((doc) => {
        discoveryMemo = doc
        writeCachedDiscovery(doc)
        return doc
      })
      .finally(() => {
        discoveryPromise = null
      })
  }

  return discoveryPromise
}

function randomString(bytes = 32): string {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  let out = ''
  for (const b of arr) out += String.fromCharCode(b)
  return btoa(out).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function generateCodeVerifier(): string {
  return randomString(48)
}

export async function codeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

interface StoredOidcState {
  state: string
  nonce: string
  verifier: string
}

function storeOidcState(state: StoredOidcState) {
  sessionStorage.setItem(OIDC_STATE_KEY, JSON.stringify(state))
}

export function readOidcState(): StoredOidcState | null {
  const raw = sessionStorage.getItem(OIDC_STATE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredOidcState
  } catch {
    return null
  }
}

export function clearOidcState() {
  sessionStorage.removeItem(OIDC_STATE_KEY)
}

export async function startLogin(): Promise<void> {
  const doc = await getDiscovery()
  const state = randomString(24)
  const nonce = randomString(24)
  const verifier = generateCodeVerifier()
  const challenge = await codeChallenge(verifier)

  storeOidcState({ state, nonce, verifier })

  const params = new URLSearchParams({
    client_id: oidcConfig.clientId,
    redirect_uri: oidcConfig.redirectUri,
    response_type: 'code',
    scope: oidcConfig.scopes,
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })

  window.location.assign(`${doc.authorization_endpoint}?${params.toString()}`)
}

async function postToken(body: URLSearchParams): Promise<TokenSet> {
  const doc = await getDiscovery()
  const res = await fetch(doc.token_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body,
  })
  if (!res.ok) {
    // A 404/410 suggests the cached discovery document is stale (endpoint
    // moved). Bust the cache and retry once against fresh discovery.
    if (res.status === 404 || res.status === 410) {
      clearDiscoveryCache()
      const fresh = await getDiscovery()
      const retry = await fetch(fresh.token_endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        body,
      })
      if (retry.ok) return (await retry.json()) as TokenSet
      const retryText = await retry.text().catch(() => '')
      throw new Error(`Token exchange failed (${retry.status}): ${retryText.slice(0, 300)}`)
    }
    const text = await res.text().catch(() => '')
    throw new Error(`Token exchange failed (${res.status}): ${text.slice(0, 300)}`)
  }
  return (await res.json()) as TokenSet
}

export async function exchangeCode(code: string, verifier: string): Promise<TokenSet> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: oidcConfig.redirectUri,
    client_id: oidcConfig.clientId,
    code_verifier: verifier,
  })
  return postToken(body)
}

export async function refreshTokens(refreshToken: string): Promise<TokenSet> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: oidcConfig.clientId,
  })
  return postToken(body)
}

export async function logoutRedirect(idTokenHint?: string): Promise<void> {
  try {
    const doc = await getDiscovery()
    if (!doc.end_session_endpoint) return
    const params = new URLSearchParams({
      client_id: oidcConfig.clientId,
      post_logout_redirect_uri: oidcConfig.postLogoutRedirectUri,
    })
    if (idTokenHint) params.set('id_token_hint', idTokenHint)
    window.location.assign(`${doc.end_session_endpoint}?${params.toString()}`)
  } catch {
    // Fall through: local logout is still performed by the caller.
  }
}
