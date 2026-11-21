import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useWorkspace } from '@/context/WorkspaceContext'
import { api, ApiError } from '@/lib/api/client'
import { formatDateTime } from '@/lib/utils'
import type { ScimConfig } from '@/types/api'

export function ScimConfigPage() {
  const { activeEntityId } = useWorkspace()
  const queryClient = useQueryClient()
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [token, setToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const query = useQuery({
    queryKey: ['ws', activeEntityId, 'scim'],
    queryFn: () => api.get<ScimConfig>(`/v1/workspaces/${activeEntityId}/scim`),
    enabled: !!activeEntityId,
  })

  const config = query.data
  const effectiveEnabled = enabled ?? config?.enabled ?? false

  const mutation = useMutation({
    mutationFn: () =>
      api.put<ScimConfig>(`/v1/workspaces/${activeEntityId}/scim`, {
        enabled: effectiveEnabled,
        token: token || undefined,
      }),
    onSuccess: () => {
      setSaved(true)
      setError(null)
      setToken('')
      void queryClient.invalidateQueries({ queryKey: ['ws', activeEntityId, 'scim'] })
    },
    onError: (err) => setError(err instanceof ApiError ? err.detail : 'Unable to save SCIM configuration.'),
  })

  return (
    <div>
      <PageHeader
        title="SCIM provisioning"
        description="SOLARIS (Authentik) SCIM 2.0 user/group provisioning for this workspace."
      />

      <Card className="max-w-xl">
        <CardContent className="space-y-5 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Provisioning enabled</p>
              <p className="text-xs text-muted-foreground">Allow SOLARIS to sync users and groups via SCIM.</p>
            </div>
            <Switch checked={effectiveEnabled} onCheckedChange={(v) => { setEnabled(v); setSaved(false) }} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="scim-token">Bearer token</Label>
            <Input
              id="scim-token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={config?.token_set ? 'Set a new token to rotate' : 'Enter a static bearer token (min 32 chars)'}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              {config?.token_set
                ? 'A token is configured. Enter a new one to rotate it.'
                : 'The token is hashed at rest and never returned.'}
              {config?.created_at ? ` Configured ${formatDateTime(config.created_at)}.` : ''}
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {saved && <p className="text-sm text-emerald-600 dark:text-emerald-400">Saved.</p>}

          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
