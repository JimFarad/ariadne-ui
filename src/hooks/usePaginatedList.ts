import { useCallback, useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { useWorkspace } from '@/context/WorkspaceContext'
import type { Envelope } from '@/types/api'

export interface PageState<T> {
  data: T[]
  pagination: Envelope<T>['meta'] | null
  isLoading: boolean
  isFetching: boolean
  error: unknown
  page: number
  setPage: (page: number) => void
  filters: Record<string, string>
  setFilter: (key: string, value: string) => void
  refetch: () => void
}

/**
 * Server-paginated list, scoped to the active workspace. The query key is
 * derived from the resolved path (not the function identity), so passing an
 * inline path builder is safe. Switching workspaces refetches automatically.
 */
export function usePaginatedList<T>(
  path: (entityId: string) => string,
  initialFilters: Record<string, string> = {},
): PageState<T> {
  const { activeEntityId } = useWorkspace()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<Record<string, string>>(initialFilters)

  const entityId = activeEntityId
  const resolvedPath = useMemo(() => (entityId ? path(entityId) : null), [entityId, path])

  const query = useQuery<Envelope<T[]>>({
    queryKey: ['ws', entityId, resolvedPath, page, filters],
    queryFn: () =>
      api.getEnvelope<T[]>(resolvedPath!, {
        query: { page, ...filters },
      }),
    enabled: !!resolvedPath,
    placeholderData: keepPreviousData,
  })

  const setFilter = useCallback((key: string, value: string) => {
    setPage(1)
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  return {
    data: query.data?.data ?? [],
    pagination: query.data?.meta ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    page,
    setPage,
    filters,
    setFilter,
    refetch: query.refetch,
  }
}
