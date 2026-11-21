import { PageHeader } from '@/components/layout/PageHeader'
import { NotificationPreferencesPanel } from '@/components/notifications/NotificationPreferencesPanel'
import { useWorkspace } from '@/context/WorkspaceContext'

export function NotificationPreferencesPage() {
  const { activeEntityId } = useWorkspace()

  return (
    <div>
      <PageHeader
        title="Notification preferences"
        description="Per-workspace notification categories. Empty overrides fall back to your global defaults."
      />
      {activeEntityId ? (
        <NotificationPreferencesPanel entityId={activeEntityId} />
      ) : (
        <p className="text-sm text-muted-foreground">Select a workspace to configure its notifications.</p>
      )}
    </div>
  )
}
