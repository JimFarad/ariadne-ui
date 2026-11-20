import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BrandMark } from '@/components/BrandMark'
import { useAuth } from '@/context/AuthContext'

export function LoginPage() {
  const { status, login } = useAuth()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    document.title = 'Sign in — ARIADNE'
  }, [])

  if (status === 'authenticated') return <Navigate to="/dashboard" replace />

  const handleLogin = async () => {
    setSubmitting(true)
    try {
      await login()
    } catch {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <BrandMark className="h-10 w-10" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">ARIADNE</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Management &amp; operations platform
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <Button className="w-full" size="lg" onClick={handleLogin} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Continue with SOLARIS
          </Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Authentication is handled by SOLARIS via OpenID Connect.
          </p>
        </div>
      </div>
    </div>
  )
}
