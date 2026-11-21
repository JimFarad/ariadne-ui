import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Activity, ArrowRight, Cable, Layers, Loader2 } from 'lucide-react'
import { BrandMark } from '@/components/BrandMark'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { FullPageSpinner } from '@/components/ProtectedRoute'

const FEATURES = [
  {
    icon: Layers,
    title: 'Workspaces & realms',
    description: 'Every domain, server, project and invoice lives inside a workspace you control.',
  },
  {
    icon: Cable,
    title: 'Unified providers',
    description: 'Cloudflare, Hetzner, Stripe and more — normalized into one calm inventory.',
  },
  {
    icon: Activity,
    title: 'Live operations',
    description: 'Infrastructure, incidents, monitoring and finance in a single surface.',
  },
]

export function LandingPage() {
  const { login } = useAuth()
  const [signingIn, setSigningIn] = useState(false)

  const handleSignIn = async () => {
    setSigningIn(true)
    try {
      await login()
    } catch {
      setSigningIn(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Background: subtle thread motif */}
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

      {/* Top bar */}
      <header className="flex h-16 items-center justify-between px-6 sm:px-10">
        <div className="flex items-center gap-2.5">
          <BrandMark className="h-7 w-7" />
          <span className="text-[15px] font-semibold tracking-tight">ARIADNE</span>
        </div>
        <Button variant="outline" size="sm" onClick={handleSignIn} disabled={signingIn}>
          {signingIn && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign in
        </Button>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Navigate complex systems with clarity.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
            ARIADNE is the self-hosted management &amp; operations platform that
            ties your workspaces, providers and operations into one calm,
            precise surface.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" onClick={handleSignIn} disabled={signingIn} className="min-w-[220px]">
              {signingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Sign in with SOLARIS
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Authentication is handled by SOLARIS via OpenID Connect.
          </p>
        </div>

        {/* Feature cards */}
        <div className="mx-auto mt-20 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border border-border bg-card/60 p-5 text-left transition-colors hover:border-primary/40"
            >
              <feature.icon className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-medium">{feature.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="flex flex-col items-center justify-center gap-1 border-t border-border px-6 py-5 text-xs text-muted-foreground sm:flex-row sm:gap-2">
        <span>© {new Date().getFullYear()} Ariadne. All rights reserved.</span>
        <span className="hidden sm:inline">·</span>
        <span>Powered by Mak Corporation</span>
      </footer>
    </div>
  )
}

/** Public home route: landing page for guests, dashboard for signed-in users. */
export function HomeRoute() {
  const { status } = useAuth()

  if (status === 'loading') return <FullPageSpinner />
  if (status === 'authenticated') return <Navigate to="/dashboard" replace />
  return <LandingPage />
}
