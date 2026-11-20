import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '@/lib/api/client'
import {
  clearSession,
  completeLogin,
  getAccessToken,
  getIdToken,
  hasSession,
  refreshSession,
  setSessionExpiredHandler,
} from '@/lib/auth/session'
import { logoutRedirect, startLogin } from '@/lib/auth/oidc'
import type { AuthMe, User } from '@/types/api'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthState {
  status: AuthStatus
  user: User | null
  login: () => Promise<void>
  logout: () => Promise<void>
  completeCallback: (code: string, verifier: string) => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    let cancelled = false

    setSessionExpiredHandler(() => {
      setUser(null)
      setStatus('unauthenticated')
    })

    async function bootstrap() {
      if (!hasSession()) {
        if (!cancelled) setStatus('unauthenticated')
        return
      }
      try {
        if (!getAccessToken()) await refreshSession()
        const me = await api.get<AuthMe>('/v1/auth/me')
        if (cancelled) return
        setUser({
          id: me.id,
          name: me.name,
          email: me.email,
          avatar_url: me.avatar_url,
        })
        setStatus('authenticated')
      } catch {
        if (!cancelled) {
          clearSession()
          setUser(null)
          setStatus('unauthenticated')
        }
      }
    }

    bootstrap()
    return () => {
      cancelled = true
      setSessionExpiredHandler(null)
    }
  }, [])

  const login = useCallback(async () => {
    await startLogin()
  }, [])

  const logout = useCallback(async () => {
    const idTokenHint = getIdToken() ?? undefined
    clearSession()
    setUser(null)
    setStatus('unauthenticated')
    await logoutRedirect(idTokenHint)
  }, [])

  const completeCallback = useCallback(async (code: string, verifier: string) => {
    await completeLogin(code, verifier)
    const me = await api.get<AuthMe>('/v1/auth/me')
    setUser({
      id: me.id,
      name: me.name,
      email: me.email,
      avatar_url: me.avatar_url,
    })
    setStatus('authenticated')
  }, [])

  const value = useMemo(
    () => ({ status, user, login, logout, completeCallback }),
    [status, user, login, logout, completeCallback],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
