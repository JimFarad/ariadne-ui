import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'
import { api, ApiError } from '@/lib/api/client'
import type { NotificationPreferences } from '@/types/api'

/**
 * Toggle panel for notification categories. `entityId` null = global
 * defaults; otherwise the per-workspace override.
 */
export function NotificationPreferencesPanel({ entityId }: { entityId: string | null }) {
  const queryClient = useQueryClient()

  const path = entityId
    ? `/v1/workspaces/${entityId}/notification-preferences`
    : '/v1/notifications/preferences'

  const query = useQuery({
    queryKey: entityId ? ['ws', entityId, 'notification-preferences'] : ['notification-preferences'],
    queryFn: () => api.get<NotificationPreferences>(path),
    enabled: !entityId || !!entityId,
  })

  const mutation = useMutation({
    mutationFn: (enabled: string[]) => api.put<{ enabled: string[] }>(path, { categories: enabled }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: entityId ? ['ws', entityId, 'notification-preferences'] : ['notification-preferences'] })
    },
  })

  const categories = query.data?.categories ?? []
  const enabled = new Set(query.data?.enabled ?? [])

  const toggle = (category: string, on: boolean) => {
    const next = new Set(enabled)
    if (on) next.add(category)
    else next.delete(category)
    mutation.mutate(Array.from(next))
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>{entityId ? 'Workspace notifications' : 'Global notification preferences'}</CardTitle>
        <CardDescription>
          {entityId
            ? 'Overrides the global defaults for this workspace. Workspace events are delivered to subscribed members.'
            : 'Default categories you are subscribed to across all workspaces.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {query.isLoading ? (
          <p className="py-4 text-sm text-muted-foreground">Loading…</p>
        ) : categories.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">No categories available.</p>
        ) : (
          categories.map((category) => {
            const isOn = enabled.has(category.slug)
            return (
              <div key={category.slug} className="flex items-center justify-between gap-4 py-2">
                <div>
                  <p className="text-sm font-medium">{category.label}</p>
                  <p className="font-mono text-xs text-muted-foreground">{category.slug}</p>
                </div>
                <Switch
                  checked={isOn}
                  disabled={mutation.isPending}
                  onCheckedChange={(on) => toggle(category.slug, on)}
                  aria-label={`Toggle ${category.label}`}
                />
              </div>
            )
          })
        )}
        {mutation.isError && (
          <p className="py-2 text-sm text-destructive">
            {mutation.error instanceof ApiError ? mutation.error.detail : 'Unable to save preferences.'}
          </p>
        )}
        {mutation.isPending && (
          <p className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving…
          </p>
        )}
      </CardContent>
    </Card>
  )
}
