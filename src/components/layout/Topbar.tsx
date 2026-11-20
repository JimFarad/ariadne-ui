import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { cn } from '@/lib/utils'

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
      <Button variant="ghost" size="icon" onClick={() => navigate('/notifications')} aria-label="Notifications">
        <Bell className="h-[18px] w-[18px]" />
      </Button>

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
