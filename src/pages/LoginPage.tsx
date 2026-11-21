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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      {/* Background: subtle thread motif (matches the landing page) */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full text-border"
        viewBox="0 0 1200 800"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <path d="M-40 220 C 220 260, 340 60, 620 120 S 1050 300, 1240 180" stroke="currentColor" strokeWidth="1" opacity="0.7" />
        <path d="M-40 260 C 260 300, 400 120, 680 180 S 1100 360, 1240 240" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <path d="M-40 300 C 300 340, 460 180, 740 240 S 1150 420, 1240 300" stroke="currentColor" strokeWidth="1" opacity="0.25" />
      </svg>

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
