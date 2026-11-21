import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, Bug, Check, ChevronsUpDown, LogOut, Moon, Search, Sun, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/context/AuthContext'
import { useWorkspace } from '@/context/WorkspaceContext'
import { useTheme } from '@/context/ThemeContext'
import { SearchDialog } from './SearchDialog'
import { api } from '@/lib/api/client'
import { cn, relativeTime } from '@/lib/utils'
import type { Notification } from '@/types/api'

function NotificationsDropdown() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<Notification[]>('/v1/notifications'),
    staleTime: 30_000,
  })

  const markAll = useMutation({
    mutationFn: () => api.post('/v1/notifications/read-all'),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markRead = useMutation({
    mutationFn: (id: string) => api.post(`/v1/notifications/${id}/read`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const notifications = query.data ?? []
  const unreadCount = notifications.filter((n) => !n.read_at).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[340px]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <button
              type="button"
              className="text-xs font-normal text-muted-foreground hover:text-foreground"
              onClick={() => markAll.mutate()}
            >
              Mark all read
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">You're all caught up.</div>
        ) : (
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.slice(0, 8).map((n) => {
              const isUnread = !n.read_at
              return (
                <DropdownMenuItem key={n.id} className="items-start gap-2" onSelect={() => isUnread && markRead.mutate(n.id)}>
                  <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', isUnread ? 'bg-primary' : 'bg-transparent')} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{n.title}</span>
                    {n.body && <span className="block truncate text-xs text-muted-foreground">{n.body}</span>}
                    <span className="block text-xs text-muted-foreground/70">{relativeTime(n.created_at)}</span>
                  </span>
                </DropdownMenuItem>
              )
            })}
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/notifications')}>
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function Topbar({ onOpenMobileNav, leftSlot }: { onOpenMobileNav: () => void; leftSlot?: ReactNode }) {
  const { user, logout } = useAuth()
  const { workspaces, activeEntity, activeEntityId, realms, activeRealmId, switchEntity, switchRealm } = useWorkspace()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur sm:px-6">
      {leftSlot}

      {/* Workspace switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="max-w-[220px] gap-2">
            <span className="truncate font-medium">{activeEntity?.name ?? 'Select workspace'}</span>
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[240px]">
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          {workspaces.map((ws) => (
            <DropdownMenuItem key={ws.id} onSelect={() => switchEntity(ws.id)}>
              <span className="flex-1 truncate">{ws.name}</span>
              {ws.id === activeEntityId && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => navigate('/workspace')}>
            Manage workspaces
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Realm selector */}
      {realms.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="max-w-[180px] gap-2">
              <span className="truncate text-muted-foreground">
                {realms.find((r) => r.id === activeRealmId)?.name ?? 'All realms'}
              </span>
              <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            <DropdownMenuItem onSelect={() => switchRealm(null)}>
              <span className="flex-1">All realms</span>
              {!activeRealmId && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
            {realms.map((realm) => (
              <DropdownMenuItem key={realm.id} onSelect={() => switchRealm(realm.id)}>
                <span className="flex-1 truncate">{realm.name}</span>
                {realm.id === activeRealmId && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <div className="flex-1" />

      {/* Search */}
      <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} aria-label="Search">
        <Search className="h-[18px] w-[18px]" />
      </Button>

      {/* Notifications */}
      <NotificationsDropdown />

      {/* Theme toggle */}
      <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
        {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
      </Button>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account">
            <Avatar className="h-7 w-7">
              {user?.avatar_url ? <AvatarImage src={user.avatar_url} alt={user.name} /> : null}
              <AvatarFallback className="bg-accent text-xs">{user ? initials(user.name) : <User className="h-3.5 w-3.5" />}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[220px]">
          <DropdownMenuLabel>
            <span className={cn('block truncate text-sm font-medium text-foreground')}>{user?.name ?? 'Signed in'}</span>
            {user?.email && <span className="block truncate text-xs font-normal text-muted-foreground">{user.email}</span>}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(import.meta.env.DEV || (import.meta.env.VITE_APP_ENV || '') === 'development') && (
            <DropdownMenuItem onSelect={() => navigate('/dev')}>
              <Bug />
              Developer diagnostics
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => void logout()}>
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  )
}
