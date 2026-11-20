import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useWorkspace } from '@/context/WorkspaceContext'
import { api, ApiError } from '@/lib/api/client'
import type { StoragePolicy } from '@/types/api'

export function StoragePolicyPage() {
  const { activeEntityId } = useWorkspace()
  const queryClient = useQueryClient()
  const [disk, setDisk] = useState('local')
  const [maxAttachmentMb, setMaxAttachmentMb] = useState('10')
  const [allowedFileTypes, setAllowedFileTypes] = useState('')
  const [retentionDays, setRetentionDays] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const policyQuery = useQuery({
    queryKey: ['ws', activeEntityId, 'storage-policy'],
    queryFn: () => api.get<StoragePolicy>(`/v1/workspaces/${activeEntityId}/storage-policy`),
    enabled: !!activeEntityId,
  })

  useEffect(() => {
    const policy = policyQuery.data
    if (policy) {
      setDisk(policy.disk ?? 'local')
      setMaxAttachmentMb(policy.max_attachment_mb != null ? String(policy.max_attachment_mb) : '10')
      setAllowedFileTypes((policy.allowed_file_types ?? []).join(', '))
      setRetentionDays(policy.retention_days != null ? String(policy.retention_days) : '')
    }
  }, [policyQuery.data])

  const saveMutation = useMutation({
    mutationFn: () =>
      api.put(`/v1/workspaces/${activeEntityId}/storage-policy`, {
        disk,
        max_attachment_mb: maxAttachmentMb ? Number(maxAttachmentMb) : undefined,
        allowed_file_types: allowedFileTypes
          ? allowedFileTypes.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
        retention_days: retentionDays ? Number(retentionDays) : undefined,
      }),
    onSuccess: () => {
      setSaved(true)
      setError(null)
      setTimeout(() => setSaved(false), 2500)
      void queryClient.invalidateQueries({ queryKey: ['ws', activeEntityId, 'storage-policy'] })
    },
    onError: (err) => setError(err instanceof ApiError ? err.detail : 'Unable to save.'),
  })

  return (
    <div>
      <PageHeader
        title="Storage policy"
        description="Per-workspace storage settings used for attachments and documents."
      />

      <Card className="max-w-xl">
        <CardContent className="space-y-4 py-5">
          <div className="space-y-1.5">
            <Label htmlFor="sp-disk">Disk</Label>
            <Input id="sp-disk" value={disk} onChange={(e) => setDisk(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sp-max">Max attachment size (MB)</Label>
            <Input id="sp-max" type="number" value={maxAttachmentMb} onChange={(e) => setMaxAttachmentMb(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sp-types">Allowed file types (comma separated)</Label>
            <Input id="sp-types" value={allowedFileTypes} onChange={(e) => setAllowedFileTypes(e.target.value)} placeholder="pdf, jpg, png" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sp-retention">Retention days (optional)</Label>
            <Input id="sp-retention" type="number" value={retentionDays} onChange={(e) => setRetentionDays(e.target.value)} placeholder="Leave empty for no limit" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {saved && <p className="text-sm text-emerald-600 dark:text-emerald-400">Saved.</p>}
          <div>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save policy
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
