import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useWorkspace } from '@/context/WorkspaceContext'
import { api, ApiError } from '@/lib/api/client'
import { StatusBadge } from '@/components/StatusBadge'
import { formatDateTime, shortId } from '@/lib/utils'
import type { Member } from '@/types/api'

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')
}

export function MembersPage() {
  const { activeEntityId } = useWorkspace()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState('')
  const [role, setRole] = useState('')
  const [error, setError] = useState<string | null>(null)

  const membersQuery = useQuery({
    queryKey: ['ws', activeEntityId, 'members'],
    queryFn: () => api.get<Member[]>(`/v1/workspaces/${activeEntityId}/members`),
    enabled: !!activeEntityId,
  })

  const members = membersQuery.data ?? []
  const knownRoles = Array.from(new Set(members.flatMap((m) => m.roles?.map((r) => r.id) ?? [])))

  const addMutation = useMutation({
    mutationFn: () =>
      api.post(`/v1/workspaces/${activeEntityId}/members`, {
        user,
        role: role || undefined,
      }),
    onSuccess: () => {
      setOpen(false)
      setUser('')
      setRole('')
      setError(null)
      void queryClient.invalidateQueries({ queryKey: ['ws', activeEntityId, 'members'] })
    },
    onError: (err) => setError(err instanceof ApiError ? err.detail : 'Unable to add member.'),
  })

  return (
    <div>
      <PageHeader
        title="Members"
        description="People with access to this workspace."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus />
            Add member
          </Button>
        }
      />

      <div className="space-y-2">
        {members.length === 0 && !membersQuery.isLoading && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">No members yet.</CardContent>
          </Card>
        )}
        {members.map((member) => (
          <Card key={member.id}>
            <CardContent className="flex items-center justify-between gap-4 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="h-9 w-9">
                  {member.user.avatar_url && <AvatarImage src={member.user.avatar_url} alt={member.user.name} />}
                  <AvatarFallback className="bg-accent text-xs">{initials(member.user.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{member.user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.user.email ?? shortId(member.user.id)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <div className="hidden gap-1 sm:flex">
                  {member.roles?.map((r) => <Badge key={r.id} variant="neutral">{r.name}</Badge>)}
                </div>
                <StatusBadge status={member.status} />
                <span className="hidden text-xs text-muted-foreground md:inline">
                  joined {formatDateTime(member.joined_at)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add member</DialogTitle>
            <DialogDescription>Invite a user by email or public id.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="member-user">User (email or id)</Label>
              <Input id="member-user" value={user} onChange={(e) => setUser(e.target.value)} placeholder="name@example.com" />
            </div>
            {knownRoles.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="member-role">Role (optional)</Label>
                <Input id="member-role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role public id" />
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate()} disabled={!user.trim() || addMutation.isPending}>
              {addMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
