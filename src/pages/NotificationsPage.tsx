import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BellOff, CheckCheck, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api/client'
import { formatDateTime, relativeTime } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/spinner'
import { ErrorState } from '@/components/data/ErrorState'
import { EmptyState } from '@/components/data/EmptyState'
import type { Notification } from '@/types/api'

export function NotificationsPage() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<Notification[]>('/v1/notifications'),
  })

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['notifications'] })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.post(`/v1/notifications/${id}/read`),
    onSuccess: invalidate,
  })

  const markAllMutation = useMutation({
    mutationFn: () => api.post('/v1/notifications/read-all'),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/notifications/${id}`),
    onSuccess: invalidate,
  })

  const notifications = query.data ?? []
  const unreadCount = notifications.filter((n) => !n.read_at).length

  return (
    <div>
      <PageHeader
        title="Notifications"
        description={`${unreadCount} unread`}
        actions={
          unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllMutation.mutate()}>
              <CheckCheck />
              Mark all read
            </Button>
          )
        }
      />

      {query.isLoading ? (
        <LoadingSpinner />
      ) : query.error ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : notifications.length === 0 ? (
        <EmptyState icon={<BellOff className="h-6 w-6" />} title="No notifications" description="You're all caught up." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const unread = !n.read_at
            return (
              <Card key={n.id} className={unread ? 'border-primary/30' : undefined}>
                <CardContent className="flex items-start justify-between gap-4 py-3.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                      <p className="truncate text-sm font-medium">{n.title}</p>
                      {n.severity && <Badge variant="neutral">{n.severity}</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground/70" title={formatDateTime(n.created_at)}>
                      {relativeTime(n.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {unread && (
                      <Button variant="ghost" size="icon-sm" onClick={() => markReadMutation.mutate(n.id)} aria-label="Mark read">
                        <CheckCheck className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon-sm" onClick={() => deleteMutation.mutate(n.id)} aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
