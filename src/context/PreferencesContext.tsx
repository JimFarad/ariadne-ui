import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { setDateTimePreferences, type DateFormatPref, type TimeFormatPref } from '@/lib/utils'
import { useAuth } from './AuthContext'
import { useTheme } from './ThemeContext'

/** Known user preference keys (the store also carries arbitrary keys). */
export interface Preferences {
  theme?: string
  language?: string
  time_format?: string
  date_format?: string
  default_page?: string
  favorite_entities?: string[]
  [key: string]: unknown
}

interface PreferencesState {
  preferences: Preferences
  favoriteEntityIds: Set<string>
  isLoading: boolean
  updatePreferences: (patch: Record<string, unknown>) => Promise<void>
}

const PreferencesContext = createContext<PreferencesState | null>(null)

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const { setTheme } = useTheme()
  const queryClient = useQueryClient()
  const authenticated = status === 'authenticated'

  const query = useQuery({
    queryKey: ['preferences'],
    queryFn: () => api.get<{ preferences: Record<string, unknown> }>('/v1/preferences'),
    enabled: authenticated,
    staleTime: 60_000,
  })

  const preferences = useMemo<Preferences>(() => (query.data?.preferences ?? {}) as Preferences, [query.data])

  // Apply a server-side theme preference when the session starts.
  useEffect(() => {
    const theme = preferences.theme
    if (theme === 'light' || theme === 'dark') setTheme(theme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences.theme])

  // Apply date/time presentation preferences globally.
  useEffect(() => {
    const timeFormat: TimeFormatPref = preferences.time_format === '12h' ? '12h' : '24h'
    const dateFormat: DateFormatPref =
      preferences.date_format === 'DD/MM/YYYY' ||
      preferences.date_format === 'DD-MM-YYYY' ||
      preferences.date_format === 'MMM D, YYYY'
        ? preferences.date_format
        : 'YYYY-MM-DD'
    setDateTimePreferences({ timeFormat, dateFormat })
  }, [preferences.time_format, preferences.date_format])

  const favoriteEntityIds = useMemo(() => {
    const list = preferences.favorite_entities ?? []
    return new Set(Array.isArray(list) ? list.filter((id): id is string => typeof id === 'string') : [])
  }, [preferences.favorite_entities])

  const updatePreferences = useCallback(
    async (patch: Record<string, unknown>) => {
      await api.put<{ preferences: Record<string, unknown> }>('/v1/preferences', { preferences: patch })
      await queryClient.invalidateQueries({ queryKey: ['preferences'] })
    },
    [queryClient],
  )

  const value = useMemo<PreferencesState>(
    () => ({ preferences, favoriteEntityIds, isLoading: query.isLoading, updatePreferences }),
    [preferences, favoriteEntityIds, query.isLoading, updatePreferences],
  )

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences(): PreferencesState {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider')
  return ctx
}
