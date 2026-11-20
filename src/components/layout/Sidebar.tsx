import { NavLink, useLocation } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_SECTIONS, type NavChild, type NavItem } from '@/lib/modules/registry'
import { useWorkspace } from '@/context/WorkspaceContext'
import { BrandMark, Wordmark } from '@/components/BrandMark'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  onNavigate?: () => void
}

function isPathActive(path: string, locationPath: string): boolean {
  if (path === '/') return locationPath === '/'
  return locationPath === path || locationPath.startsWith(`${path}/`)
}

export function Sidebar({ collapsed, onToggleCollapse, onNavigate }: SidebarProps) {
  const { enabledModuleSlugs } = useWorkspace()
  const location = useLocation()

  const visible = (item: NavItem | NavChild): boolean =>
    !item.module || enabledModuleSlugs.has(item.module)

  const sections = NAV_SECTIONS.map((section) => {
    const items = section.items
      .map((item) => {
        if (item.children) {
          const children = item.children.filter(visible)
          if (children.length === 0) return null
          if (item.module && !enabledModuleSlugs.has(item.module)) return null
          return { ...item, children }
        }
        return visible(item) ? item : null
      })
      .filter((item): item is NavItem => item !== null)
    return { ...section, items }
  }).filter((section) => section.items.length > 0)

  const renderLink = (to: string, icon: React.ReactNode, label: string, nested = false) => (
    <NavLink
      key={to}
      to={to}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
          nested ? 'pl-9' : '',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
          collapsed && 'justify-center px-0',
        )
      }
    >
      {icon}
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  )

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-full flex-col">
        <div className={cn('flex h-14 items-center gap-2.5 border-b border-border px-4', collapsed && 'justify-center px-0')}>
          <BrandMark />
          <Wordmark collapsed={collapsed} />
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Primary">
          {sections.map((section) => (
            <div key={section.id}>
              {section.label && !collapsed && (
                <p className="mb-1.5 px-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  if (item.children) {
                    const childActive = item.children.some((c) => isPathActive(c.path, location.pathname))
                    const firstChild = item.children[0]
                    if (collapsed) {
                      const Icon = item.icon
                      return renderLink(firstChild.path, <Icon className="h-[18px] w-[18px]" />, item.label)
                    }
                    return (
                      <div key={item.label}>
                        <div
                          className={cn(
                            'flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground',
                            childActive && 'text-foreground',
                          )}
                        >
                          <item.icon className="h-[18px] w-[18px]" />
                          <span className="truncate">{item.label}</span>
                        </div>
                        <div className="mt-0.5 space-y-0.5">
                          {item.children.map((child) => {
                            const Icon = child.icon
                            return renderLink(child.path, <Icon className="h-4 w-4" />, child.label, true)
                          })}
                        </div>
                      </div>
                    )
                  }
                  const Icon = item.icon
                  return item.path ? renderLink(item.path, <Icon className="h-[18px] w-[18px]" />, item.label) : null
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-2">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-full" onClick={onToggleCollapse} aria-label="Expand sidebar">
                  <PanelLeftOpen className="h-[18px] w-[18px]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand sidebar</TooltipContent>
            </Tooltip>
          ) : (
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={onToggleCollapse}>
              <PanelLeftClose className="h-[18px] w-[18px]" />
              Collapse
            </Button>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
