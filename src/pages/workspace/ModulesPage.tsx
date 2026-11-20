import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useWorkspace } from '@/context/WorkspaceContext'
import { api } from '@/lib/api/client'
import { MODULE_LABELS } from '@/lib/modules/registry'
import type { EntityModule } from '@/types/api'

export function ModulesPage() {
  const { activeEntityId } = useWorkspace()
  const queryClient = useQueryClient()

  const modulesQuery = useQuery({
    queryKey: ['ws', activeEntityId, 'modules'],
    queryFn: () => api.get<EntityModule[]>(`/v1/workspaces/${activeEntityId}/modules`),
    enabled: !!activeEntityId,
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
    </div>
  )
}
