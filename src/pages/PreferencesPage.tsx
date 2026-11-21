import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePreferences } from '@/context/PreferencesContext'
import { useTheme } from '@/context/ThemeContext'
import { useWorkspace } from '@/context/WorkspaceContext'
import { ApiError } from '@/lib/api/client'

export function PreferencesPage() {
  const { preferences, favoriteEntityIds, updatePreferences, isLoading } = usePreferences()
  const { setTheme } = useTheme()
  const { workspaces } = useWorkspace()

  const [theme, setThemePref] = useState<string>('')
  const [language, setLanguage] = useState('')
  const [timeFormat, setTimeFormat] = useState('')
  const [dateFormat, setDateFormat] = useState('')
  const [defaultPage, setDefaultPage] = useState('')
  const [favorites, setFavorites] = useState<string[]>([])
  const [initialized, setInitialized] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // Sync local state once preferences have loaded.
  useEffect(() => {
    if (isLoading || initialized) return
    setThemePref(typeof preferences.theme === 'string' ? preferences.theme : '')
    setLanguage(typeof preferences.language === 'string' ? preferences.language : '')
    setTimeFormat(typeof preferences.time_format === 'string' ? preferences.time_format : '')
    setDateFormat(typeof preferences.date_format === 'string' ? preferences.date_format : '')
    setDefaultPage(typeof preferences.default_page === 'string' ? preferences.default_page : '')
    setFavorites(Array.isArray(preferences.favorite_entities) ? (preferences.favorite_entities as string[]) : [])
    setInitialized(true)
  }, [isLoading, initialized, preferences])

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]))
    setSaved(false)
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await updatePreferences({
        theme: theme || null,
        language: language || null,
        time_format: timeFormat || null,
        date_format: dateFormat || null,
        default_page: defaultPage || null,
        favorite_entities: favorites,
      })
      if (theme === 'light' || theme === 'dark') setTheme(theme)
      setSaved(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : 'Unable to save preferences.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="Preferences" description="Your personal platform settings." />

      <Card className="max-w-2xl">
        <CardHeader><CardTitle>General</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Theme</Label>
              <Select
                value={theme || 'system'}
                onValueChange={(v) => { setThemePref(v === 'system' ? '' : v); setSaved(false) }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-language">Language</Label>
              <Input id="pf-language" value={language} onChange={(e) => { setLanguage(e.target.value); setSaved(false) }} placeholder="en" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pf-date">Date format</Label>
              <Input id="pf-date" value={dateFormat} onChange={(e) => { setDateFormat(e.target.value); setSaved(false) }} placeholder="YYYY-MM-DD" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-time">Time format</Label>
              <Input id="pf-time" value={timeFormat} onChange={(e) => { setTimeFormat(e.target.value); setSaved(false) }} placeholder="HH:mm" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pf-default">Default page</Label>
            <Input id="pf-default" value={defaultPage} onChange={(e) => { setDefaultPage(e.target.value); setSaved(false) }} placeholder="/dashboard" />
            <p className="text-xs text-muted-foreground">Path to land on after signing in.</p>
          </div>

          <div className="space-y-2">
            <Label>Favorite workspaces</Label>
            {workspaces.length === 0 ? (
              <p className="text-sm text-muted-foreground">No workspaces yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {workspaces.map((ws) => {
                  const checked = favorites.includes(ws.id)
                  return (
                    <li key={ws.id} className="flex items-center justify-between gap-3 py-2">
                      <span className="truncate text-sm">{ws.name}</span>
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={checked}
                        onChange={() => toggleFavorite(ws.id)}
                      />
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {saved && <p className="text-sm text-emerald-600 dark:text-emerald-400">Saved.</p>}

          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save preferences
          </Button>
        </CardContent>
      </Card>

      <p className="mt-4 max-w-2xl text-xs text-muted-foreground">
        {favoriteEntityIds.size > 0
          ? `${favoriteEntityIds.size} favourite workspace${favoriteEntityIds.size === 1 ? '' : 's'} — shown first in the workspace switcher.`
          : 'Favourite workspaces are shown first in the workspace switcher.'}
      </p>
    </div>
  )
}
