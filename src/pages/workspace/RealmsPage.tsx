import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useWorkspace } from '@/context/WorkspaceContext'
import { api, ApiError } from '@/lib/api/client'
import { shortId } from '@/lib/utils'
import type { Realm } from '@/types/api'

export function RealmsPage() {
  const { activeEntityId } = useWorkspace()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const realmsQuery = useQuery({
    queryKey: ['ws', activeEntityId, 'realms'],
    queryFn: () => api.get<Realm[]>(`/v1/workspaces/${activeEntityId}/realms`),
    enabled: !!activeEntityId,
  })

  const createMutation = useMutation({
    mutationFn: () =>
      api.post(`/v1/workspaces/${activeEntityId}/realms`, {
        name,
        slug: slug || undefined,
        description: description || undefined,
      }),
    onSuccess: () => {
      setOpen(false)
      setName('')
      setSlug('')
      setDescription('')
      setError(null)
      void queryClient.invalidateQueries({ queryKey: ['ws', activeEntityId, 'realms'] })
    },
    onError: (err) => setError(err instanceof ApiError ? err.detail : 'Unable to create realm.'),
  })

  return (
    <div>
      <PageHeader
        title="Realms"
        description="Sub-divisions of this workspace, e.g. Production vs Staging."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus />
            New realm
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(realmsQuery.data ?? []).map((realm) => (
          <Card key={realm.id}>
            <CardContent className="py-4">
              <p className="text-sm font-medium">{realm.name}</p>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">{realm.slug}</p>
              {realm.description && <p className="mt-2 text-sm text-muted-foreground">{realm.description}</p>}
              <p className="mt-3 font-mono text-[11px] text-muted-foreground/70">{shortId(realm.id)}</p>
            </CardContent>
          </Card>
        ))}
        {(realmsQuery.data ?? []).length === 0 && !realmsQuery.isLoading && (
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">No realms yet.</CardContent>
          </Card>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create realm</DialogTitle>
            <DialogDescription>Realms sub-divide a workspace.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="realm-name">Name</Label>
              <Input id="realm-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Production" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="realm-slug">Slug (optional)</Label>
              <Input id="realm-slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="production" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="realm-desc">Description</Label>
              <Textarea id="realm-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!name.trim() || createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
