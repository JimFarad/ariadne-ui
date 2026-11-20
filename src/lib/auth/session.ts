/**
 * Session token lifecycle.
 *
 * The OIDC access token is short-lived and kept in memory only (never in
 * localStorage). The refresh token is persisted so the session survives page
 * reloads; refresh is single-flight to avoid concurrent refresh races.
 */
import { exchangeCode, refreshTokens, type TokenSet } from './oidc'

const REFRESH_KEY = 'ariadne.refresh_token'

let accessToken: string | null = null
let idToken: string | null = null
let refreshPromise: Promise<string> | null = null

/** Invoked by the auth layer when the session can no longer be recovered. */
let onSessionExpired: (() => void) | null = null

export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler
}

export function getAccessToken(): string | null {
  return accessToken
}

export function getIdToken(): string | null {
  return idToken
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_KEY)
  } catch {
    return null
  }
}

function setRefreshToken(value: string | null) {
  try {
    if (value) localStorage.setItem(REFRESH_KEY, value)
    else localStorage.removeItem(REFRESH_KEY)
  } catch {
    // Storage may be unavailable (private mode); the session just won't persist.
  }
}

export function applyTokenSet(tokens: TokenSet) {
  accessToken = tokens.access_token || null
  idToken = tokens.id_token || null
  if (tokens.refresh_token) setRefreshToken(tokens.refresh_token)
}

export function hasSession(): boolean {
  return getAccessToken() !== null || getRefreshToken() !== null
}

export function clearSession() {
  accessToken = null
  idToken = null
  setRefreshToken(null)
  refreshPromise = null
}

export async function completeLogin(code: string, verifier: string): Promise<void> {
  const tokens = await exchangeCode(code, verifier)
  if (!tokens.access_token) throw new Error('Identity provider did not return an access_token.')
  applyTokenSet(tokens)
}

/** Single-flight refresh. Resolves to the new access token, or rejects. */
export async function refreshSession(): Promise<string> {
  const existing = getRefreshToken()
  if (!existing) throw new Error('No refresh token available.')

  const run = () =>
    refreshTokens(existing)
      .then((tokens) => {
        if (!tokens.access_token) throw new Error('Identity provider did not return an access_token.')
        applyTokenSet(tokens)
        return tokens.access_token
      })
      .catch((err) => {
        clearSession()
        onSessionExpired?.()
        throw err
      })
      .finally(() => {
        refreshPromise = null
      })

  if (!refreshPromise) {
    refreshPromise = run()
  }

  return refreshPromise
}
