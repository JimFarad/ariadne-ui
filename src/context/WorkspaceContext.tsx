import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, setApiContext } from '@/lib/api/client'
import { useAuth } from './AuthContext'
import type { Entity, EntityModule, Realm } from '@/types/api'

const ACTIVE_ENTITY_KEY = 'ariadne.active_entity'
const ACTIVE_REALM_KEY = 'ariadne.active_realm'

interface CreateWorkspaceInput {
  type: string
  name: string
  description?: string | null
}

interface WorkspaceState {
  workspaces: Entity[]
  workspacesLoading: boolean
  activeEntity: Entity | null
  activeEntityId: string | null
  activeRealmId: string | null
  realms: Realm[]
  realmsLoading: boolean
  modules: EntityModule[]
  modulesLoading: boolean
  enabledModuleSlugs: Set<string>
  isModuleEnabled: (slug: string) => boolean
  switchEntity: (id: string) => void
  switchRealm: (id: string | null) => void
  createWorkspace: (input: CreateWorkspaceInput) => Promise<Entity>
}

const WorkspaceContext = createContext<WorkspaceState | null>(null)

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStored(key: string, value: string | null) {
  try {
    if (value) localStorage.setItem(key, value)
    else localStorage.removeItem(key)
  } catch {
    /* noop */
  }
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const queryClient = useQueryClient()
  const [activeEntityId, setActiveEntityId] = useState<string | null>(() => readStored(ACTIVE_ENTITY_KEY))
  const [activeRealmId, setActiveRealmId] = useState<string | null>(() => readStored(ACTIVE_REALM_KEY))

  const authenticated = status === 'authenticated'

  const workspacesQuery = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => api.get<Entity[]>('/v1/workspaces'),
    enabled: authenticated,
    staleTime: 30_000,
  })

  const workspaces = workspacesQuery.data ?? []
  const activeEntity =
    workspaces.find((e) => e.id === activeEntityId) ?? workspaces[0] ?? null
  const entityId = activeEntity?.id ?? null

  // Keep the client context in sync with the resolved entity.
  useEffect(() => {
    setApiContext({ entityId, realmId: activeRealmId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId, activeRealmId])

  const modulesQuery = useQuery({
    queryKey: ['ws', entityId, 'modules'],
    queryFn: () => api.get<EntityModule[]>(`/v1/workspaces/${entityId}/modules`),
    enabled: authenticated && entityId !== null,
  })

  const realmsQuery = useQuery({
    queryKey: ['ws', entityId, 'realms'],
    queryFn: () => api.get<Realm[]>(`/v1/workspaces/${entityId}/realms`),
    enabled: authenticated && entityId !== null,
  })

  const modules = modulesQuery.data ?? []
  const enabledModuleSlugs = useMemo(
    () => new Set(modules.filter((m) => m.enabled).map((m) => m.slug)),
    [modules],
  )

  const switchEntity = useCallback(
    (id: string) => {
      setActiveEntityId(id)
      setActiveRealmId(null)
      setApiContext({ entityId: id, realmId: null })
      writeStored(ACTIVE_ENTITY_KEY, id)
      writeStored(ACTIVE_REALM_KEY, null)
      queryClient.removeQueries({ queryKey: ['ws'] })
    },
    [queryClient],
  )

  const switchRealm = useCallback(
    (id: string | null) => {
      setActiveRealmId(id)
      setApiContext({ realmId: id })
      writeStored(ACTIVE_REALM_KEY, id)
      queryClient.removeQueries({ queryKey: ['ws'] })
    },
    [queryClient],
  )

  const createWorkspace = useCallback(async (input: CreateWorkspaceInput) => {
    const created = await api.post<Entity>('/v1/workspaces', input)
    await queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    setActiveEntityId(created.id)
    setActiveRealmId(null)
    setApiContext({ entityId: created.id, realmId: null })
    writeStored(ACTIVE_ENTITY_KEY, created.id)
    writeStored(ACTIVE_REALM_KEY, null)
    queryClient.removeQueries({ queryKey: ['ws'] })
    return created
  }, [queryClient])

  const isModuleEnabled = useCallback((slug: string) => enabledModuleSlugs.has(slug), [enabledModuleSlugs])

  const value = useMemo<WorkspaceState>(
    () => ({
      workspaces,
      workspacesLoading: workspacesQuery.isLoading,
      activeEntity,
      activeEntityId: entityId,
      activeRealmId,
      realms: realmsQuery.data ?? [],
      realmsLoading: realmsQuery.isLoading,
      modules,
      modulesLoading: modulesQuery.isLoading,
      enabledModuleSlugs,
      isModuleEnabled,
      switchEntity,
      switchRealm,
      createWorkspace,
    }),
    [
      workspaces,
      workspacesQuery.isLoading,
      activeEntity,
      entityId,
      activeRealmId,
      realmsQuery.data,
      realmsQuery.isLoading,
      modules,
      modulesQuery.isLoading,
      enabledModuleSlugs,
      isModuleEnabled,
      switchEntity,
      switchRealm,
      createWorkspace,
    ],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace(): WorkspaceState {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}
