import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { readOidcState, clearOidcState } from '@/lib/auth/oidc'

export function CallbackPage() {
  const { completeCallback } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const errorParam = params.get('error')

    async function run() {
      if (errorParam) {
        setError(`Sign-in failed: ${params.get('error_description') || errorParam}`)
        return
      }
      if (!code) {
        setError('No authorization code was returned by the identity provider.')
        return
      }
      const stored = readOidcState()
      if (!stored || stored.state !== state) {
        setError('The sign-in state did not match. Please try again.')
        return
      }
      clearOidcState()
      try {
        await completeCallback(code, stored.verifier)
        navigate('/', { replace: true })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to complete sign-in.')
      }
    }

    run()
  }, [completeCallback, navigate])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      {error ? (
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 text-center shadow-sm">
          <div className="mb-3 flex justify-center text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="text-base font-semibold">Sign-in failed</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button className="mt-5 w-full" onClick={() => navigate('/login', { replace: true })}>
            Back to sign in
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
          <Spinner size={22} />
          <span>Completing sign-in…</span>
        </div>
      )}
    </div>
  )
}
