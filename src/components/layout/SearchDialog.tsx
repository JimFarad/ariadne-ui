import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { NAV_SECTIONS } from '@/lib/modules/registry'
import { useWorkspace } from '@/context/WorkspaceContext'

interface SearchEntry {
  label: string
  path: string
}

export function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { enabledModuleSlugs } = useWorkspace()

  const entries = useMemo<SearchEntry[]>(() => {
    const out: SearchEntry[] = []
    for (const section of NAV_SECTIONS) {
      for (const item of section.items) {
        if (item.module && !enabledModuleSlugs.has(item.module)) continue
        if (item.children) {
          for (const child of item.children) {
            if (child.module && !enabledModuleSlugs.has(child.module)) continue
            out.push({ label: `${item.label} — ${child.label}`, path: child.path })
          }
        } else if (item.path) {
          out.push({ label: item.label, path: item.path })
        }
      }
    }
    return out
  }, [enabledModuleSlugs])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return entries.slice(0, 8)
    return entries.filter((e) => e.label.toLowerCase().includes(q)).slice(0, 8)
  }, [entries, query])

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open)
      if (!open) setQuery('')
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Navigate</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages…"
            className="pl-8"
          />
        </div>
        <div className="max-h-72 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-1 py-6 text-center text-sm text-muted-foreground">No pages match.</p>
          ) : (
            <div className="space-y-0.5">
              {filtered.map((entry) => (
                <button
                  key={entry.path}
                  onClick={() => {
                    onOpenChange(false)
                    navigate(entry.path)
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-accent"
                >
                  <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                  {entry.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function useSearchDialog() {
  const [open, setOpen] = useState(false)
  return { open, setOpen }
}

export { Check }
