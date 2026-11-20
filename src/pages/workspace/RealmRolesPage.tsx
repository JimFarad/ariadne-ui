import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/forms/ConfirmDialog'
import { useWorkspace } from '@/context/WorkspaceContext'
import { api, ApiError } from '@/lib/api/client'
import { shortId } from '@/lib/utils'
import type { Member, Realm, RealmRole } from '@/types/api'

interface Grant {
  user: string
  role: string
  realm: string
}

export function RealmRolesPage() {
  const { activeEntityId } = useWorkspace()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState('')
  const [role, setRole] = useState('')
  const [realm, setRealm] = useState('')
  const [revoking, setRevoking] = useState<Grant | null>(null)
  const [error, setError] = useState<string | null>(null)

  const grantsQuery = useQuery({
    queryKey: ['ws', activeEntityId, 'realm-roles'],
    queryFn: () => api.get<RealmRole[]>(`/v1/workspaces/${activeEntityId}/realm-roles`),
    enabled: !!activeEntityId,
  })
  const membersQuery = useQuery({
    queryKey: ['ws', activeEntityId, 'members'],
    queryFn: () => api.get<Member[]>(`/v1/workspaces/${activeEntityId}/members`),
    enabled: !!activeEntityId,
  })
  const realmsQuery = useQuery({
    queryKey: ['ws', activeEntityId, 'realms'],
    queryFn: () => api.get<Realm[]>(`/v1/workspaces/${activeEntityId}/realms`),
    enabled: !!activeEntityId,
  })

  const members = membersQuery.data ?? []
  const realms = realmsQuery.data ?? []

  const roleNames = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of members) for (const r of m.roles ?? []) map.set(r.id, r.name)
    return map
  }, [members])

  const userName = (id: string) => members.find((m) => m.user.id === id)?.user.name ?? shortId(id)
  const realmName = (id: string) => realms.find((r) => r.id === id)?.name ?? shortId(id)
  const roleName = (id: string) => roleNames.get(id) ?? shortId(id)

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['ws', activeEntityId, 'realm-roles'] })

  const grantMutation = useMutation({
    mutationFn: () => api.post(`/v1/workspaces/${activeEntityId}/realm-roles`, { user, role, realm }),
    onSuccess: () => {
      setOpen(false)
      setUser('')
      setRole('')
      setRealm('')
      setError(null)
      invalidate()
    },
    onError: (err) => setError(err instanceof ApiError ? err.detail : 'Unable to grant role.'),
  })

  const revokeMutation = useMutation({
    mutationFn: (grant: Grant) =>
      api.delete(`/v1/workspaces/${activeEntityId}/realm-roles`, {
        query: { user: grant.user, role: grant.role, realm: grant.realm },
      }),
    onSuccess: () => {
      setRevoking(null)
      invalidate()
    },
    onError: () => setRevoking(null),
  })

  const grants = grantsQuery.data ?? []

  return (
    <div>
      <PageHeader
        title="Realm roles"
        description="Roles granted to users within a specific realm."
        actions={
          <Button onClick={() => setOpen(true)} disabled={members.length === 0 || realms.length === 0}>
            <Plus />
            Grant role
          </Button>
        }
      />

      <div className="space-y-2">
        {grants.length === 0 && !grantsQuery.isLoading && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">No realm-scoped grants yet.</CardContent>
          </Card>
        )}
        {grants.map((grant, i) => (
          <Card key={`${grant.user}-${grant.role}-${grant.realm}-${i}`}>
            <CardContent className="flex items-center justify-between gap-4 py-3.5">
              <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{userName(String(grant.user))}</span>
                <span className="text-muted-foreground">is</span>
                <Badge variant="neutral">{roleName(String(grant.role))}</Badge>
                <span className="text-muted-foreground">in</span>
                <Badge variant="outline">{realmName(String(grant.realm))}</Badge>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive"
                aria-label="Revoke"
                onClick={() => setRevoking({ user: String(grant.user), role: String(grant.role), realm: String(grant.realm) })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Grant realm role</DialogTitle>
            <DialogDescription>Assign a role to a user within a realm.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <span className="text-sm font-medium">User</span>
              <Select value={user} onValueChange={setUser}>
                <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.user.id} value={m.user.id}>{m.user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <span className="text-sm font-medium">Realm</span>
              <Select value={realm} onValueChange={setRealm}>
                <SelectTrigger><SelectValue placeholder="Select realm" /></SelectTrigger>
                <SelectContent>
                  {realms.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <span className="text-sm font-medium">Role</span>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {Array.from(roleNames.entries()).map(([id, label]) => (
                    <SelectItem key={id} value={id}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {roleNames.size === 0 && (
              <p className="text-xs text-muted-foreground">No roles are visible from member data yet.</p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => grantMutation.mutate()} disabled={!user || !role || !realm || grantMutation.isPending}>
              {grantMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Grant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={revoking !== null}
        onOpenChange={(open) => !open && setRevoking(null)}
        title="Revoke role"
        description="Remove this user's role in the realm."
        confirmLabel="Revoke"
        destructive
        loading={revokeMutation.isPending}
        onConfirm={() => revoking && revokeMutation.mutate(revoking)}
      />
    </div>
  )
}
