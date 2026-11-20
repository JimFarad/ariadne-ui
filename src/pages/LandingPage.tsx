import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { BrandMark } from '@/components/BrandMark'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { FullPageSpinner } from '@/components/ProtectedRoute'
import { Navigate } from 'react-router-dom'

const FEATURES = [
  { title: 'Workspaces', description: 'Organize every system under one roof.' },
  { title: 'Providers', description: 'One normalized inventory across vendors.' },
  { title: 'Operations', description: 'Infrastructure, incidents and finance.' },
]

export function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      {/* Subtle thread motif */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-[0.35]"
        viewBox="0 0 1200 600"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          d="M-40 480 C 220 520, 320 120, 640 180 S 1100 460, 1240 260"
          stroke="var(--border)"
          strokeWidth="1"
        />
        <path
          d="M-40 520 C 260 560, 380 200, 700 250 S 1150 500, 1240 320"
          stroke="var(--border)"
          strokeWidth="1"
          opacity="0.5"
        />
      </svg>

      <div className="flex w-full max-w-md flex-col items-center text-center">
        <div className="mb-8 flex flex-col items-center gap-4">
          <BrandMark className="h-11 w-11" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">ARIADNE</h1>
            <p className="mt-2 text-balance text-sm leading-relaxed text-muted-foreground">
              The self-hosted management &amp; operations platform for navigating
              complex systems.
            </p>
          </div>
        </div>

        <Button asChild size="lg" className="w-full sm:w-auto sm:min-w-[220px]">
          <Link to="/login">
            Sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          Authentication is handled by SOLARIS.
        </p>

        <div className="mt-12 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-lg border border-border bg-card/50 p-4">
              <p className="text-sm font-medium">{feature.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
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
