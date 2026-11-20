import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Building2, Cable, Layers, Server, Users } from 'lucide-react'
import { api } from '@/lib/api/client'
import { useWorkspace } from '@/context/WorkspaceContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/StatusBadge'
import { ErrorState } from '@/components/data/ErrorState'
import type { DashboardData } from '@/types/api'
import { formatDateTime, relativeTime } from '@/lib/utils'

interface SummaryTile {
  label: string
  value: number | string
  icon: typeof Users
  path: string
}

export function DashboardPage() {
  const { activeEntity, activeEntityId } = useWorkspace()

  const query = useQuery({
    queryKey: ['dashboard', activeEntityId],
    queryFn: () => api.get<DashboardData>('/v1/dashboard'),
    enabled: true,
  })

  const data = query.data
  const entity = data?.entity
  const summary = entity?.summary

  const tiles: SummaryTile[] = [
    { label: 'Members', value: summary?.members ?? 0, icon: Users, path: '/workspace/members' },
    { label: 'Realms', value: summary?.realms ?? 0, icon: Layers, path: '/workspace/realms' },
    { label: 'Provider connections', value: summary?.provider_connections ?? 0, icon: Cable, path: '/providers/connections' },
    { label: 'Provider resources', value: summary?.provider_resources ?? 0, icon: Server, path: '/providers/resources' },
  ]

  const events = entity?.recent_events ?? []
  const syncs = entity?.recent_syncs ?? []
  const providers = entity?.providers ?? []
  const modules = data?.modules ?? []

  return (
    <div>
      <PageHeader
        title={activeEntity ? activeEntity.name : 'Home'}
        description={activeEntity ? 'Platform overview for this workspace.' : 'Overview across your workspaces.'}
      />

      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : query.error ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : !activeEntity ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Building2 className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">No workspace selected</p>
            <p className="mt-1 text-sm text-muted-foreground">Create or select a workspace to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Restrained summary strip */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tiles.map((tile) => (
              <Link
                key={tile.label}
                to={tile.path}
                className="group flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <tile.icon className="h-5 w-5 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-lg font-semibold leading-none">{tile.value}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{tile.label}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Connected providers</CardTitle>
                </CardHeader>
                <CardContent>
                  {providers.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">No providers connected yet.</p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {providers.map((p) => (
                        <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{p.name ?? p.provider}</p>
                            <p className="truncate text-xs text-muted-foreground">{p.provider}</p>
                          </div>
                          <StatusBadge status={p.health} />
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {events.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">No recent activity.</p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {events.map((event) => (
                        <li key={event.id} className="flex items-center justify-between gap-3 py-2.5">
                          <div className="min-w-0">
                            <p className="truncate font-mono text-xs">{event.action}</p>
                            {event.description && (
                              <p className="truncate text-xs text-muted-foreground">{event.description}</p>
                            )}
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {relativeTime(event.created_at)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Provider syncs</CardTitle>
                </CardHeader>
                <CardContent>
                  {syncs.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">No syncs yet.</p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {syncs.map((sync) => (
                        <li key={sync.id} className="flex items-center justify-between gap-3 py-2.5">
                          <StatusBadge status={sync.status} />
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {formatDateTime(sync.finished_at ?? sync.started_at)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Modules</CardTitle>
                </CardHeader>
                <CardContent>
                  {modules.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">No modules reported.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {modules.slice(0, 14).map((mod) => (
                        <li key={mod.slug} className="flex items-center justify-between gap-2 text-sm">
                          <span className="truncate">{mod.name}</span>
                          <StatusBadge status={mod.state} />
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link
                    to="/workspace/modules"
                    className="mt-4 flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    Manage modules <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
