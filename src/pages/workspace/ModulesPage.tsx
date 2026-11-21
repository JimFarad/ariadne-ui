import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useWorkspace } from '@/context/WorkspaceContext'
import { api } from '@/lib/api/client'
import { MODULE_LABELS } from '@/lib/modules/registry'
import type { Capability, EntityModule } from '@/types/api'

export function ModulesPage() {
  const { activeEntityId } = useWorkspace()
  const queryClient = useQueryClient()
  const [capabilitiesFor, setCapabilitiesFor] = useState<string | null>(null)

  const modulesQuery = useQuery({
    queryKey: ['ws', activeEntityId, 'modules'],
    queryFn: () => api.get<EntityModule[]>(`/v1/workspaces/${activeEntityId}/modules`),
    enabled: !!activeEntityId,
  })

  const capabilitiesQuery = useQuery({
    queryKey: ['module-capabilities', capabilitiesFor],
    queryFn: () => api.get<Capability[]>(`/v1/modules/${capabilitiesFor}/capabilities`),
    enabled: !!capabilitiesFor,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ slug, enabled }: { slug: string; enabled: boolean }) =>
      api.patch(`/v1/workspaces/${activeEntityId}/modules/${slug}`, { enabled }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ws', activeEntityId, 'modules'] })
      void queryClient.invalidateQueries({ queryKey: ['ws'] })
    },
  })

  const modules = modulesQuery.data ?? []

  return (
    <div>
      <PageHeader
        title="Modules"
        description="Enable or disable modules for this workspace. Disabled modules are hidden from navigation."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {modules.map((mod) => {
          const pending = toggleMutation.isPending && toggleMutation.variables?.slug === mod.slug
          return (
            <Card key={mod.id}>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{mod.name}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">{mod.slug}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {MODULE_LABELS[mod.slug] ?? ''}
                  </p>
                  <button
                    type="button"
                    className="mt-1 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                    onClick={() => setCapabilitiesFor(mod.slug)}
                  >
                    View capabilities
                  </button>
                </div>
                <Switch
                  checked={mod.enabled}
                  disabled={pending}
                  onCheckedChange={(enabled) => toggleMutation.mutate({ slug: mod.slug, enabled })}
                  aria-label={`Toggle ${mod.name}`}
                />
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={capabilitiesFor !== null} onOpenChange={(open) => !open && setCapabilitiesFor(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Capabilities — {capabilitiesFor}</DialogTitle>
            <DialogDescription>Registered capabilities for this module.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {capabilitiesQuery.isLoading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Loading…</p>
            ) : (capabilitiesQuery.data ?? []).length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No capabilities.</p>
            ) : (
              <ul className="divide-y divide-border">
                {(capabilitiesQuery.data ?? []).map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="font-mono text-xs">{c.slug}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.resource_type} · {c.operation} · {c.access_type}
                        {c.provider ? ` · provider ${c.provider}` : ''}
                      </p>
                    </div>
                    <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">L{c.risk_level}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
