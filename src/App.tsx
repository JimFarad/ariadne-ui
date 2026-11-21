import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { ThemeProvider } from '@/context/ThemeContext'
import { AuthProvider } from '@/context/AuthContext'
import { WorkspaceProvider } from '@/context/WorkspaceContext'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute, FullPageSpinner } from '@/components/ProtectedRoute'
import { RouteError } from '@/components/RouteError'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LoginPage } from '@/pages/LoginPage'
import { CallbackPage } from '@/pages/CallbackPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { HomeRoute } from '@/pages/LandingPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { WorkspaceOverviewPage } from '@/pages/workspace/OverviewPage'
import { MembersPage } from '@/pages/workspace/MembersPage'
import { RealmsPage } from '@/pages/workspace/RealmsPage'
import { RealmRolesPage } from '@/pages/workspace/RealmRolesPage'
import { ModulesPage } from '@/pages/workspace/ModulesPage'
import { StoragePolicyPage } from '@/pages/workspace/StoragePolicyPage'
import { ScimConfigPage } from '@/pages/workspace/ScimConfigPage'
import { AuditLogsPage } from '@/pages/workspace/AuditLogsPage'

// Module pages are code-split so the initial shell stays lean.
const sm = (name: string) => lazy(() => import('@/pages/simple-modules').then((m) => ({ default: m[name as keyof typeof m] })))
const ServicesPage = sm('ServicesPage')
const BackupsPage = sm('BackupsPage')
const MonitoringPage = sm('MonitoringPage')
const AssetsPage = sm('AssetsPage')
const IotPage = sm('IotPage')
const ContactsPage = sm('ContactsPage')
const CampaignsPage = sm('CampaignsPage')
const AutomationPage = sm('AutomationPage')
const MailAccountsPage = sm('MailAccountsPage')
const TemplatesPage = sm('TemplatesPage')
const BudgetsPage = sm('BudgetsPage')
const VendorsPage = sm('VendorsPage')
const CommunicationsPage = sm('CommunicationsPage')

const InfrastructurePage = lazy(() => import('@/pages/InfrastructurePage').then((m) => ({ default: m.InfrastructurePage })))
const InfrastructureDetailPage = lazy(() => import('@/pages/InfrastructureDetailPage').then((m) => ({ default: m.InfrastructureDetailPage })))
const DomainsPage = lazy(() => import('@/pages/DomainsPage').then((m) => ({ default: m.DomainsPage })))
const DomainDetailPage = lazy(() => import('@/pages/DomainDetailPage').then((m) => ({ default: m.DomainDetailPage })))
const IncidentsPage = lazy(() => import('@/pages/IncidentsPage').then((m) => ({ default: m.IncidentsPage })))
const IncidentDetailPage = lazy(() => import('@/pages/IncidentDetailPage').then((m) => ({ default: m.IncidentDetailPage })))
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage })))
const ProjectDetailPage = lazy(() => import('@/pages/ProjectDetailPage').then((m) => ({ default: m.ProjectDetailPage })))
const DocumentsPage = lazy(() => import('@/pages/DocumentsPage').then((m) => ({ default: m.DocumentsPage })))
const DocumentDetailPage = lazy(() => import('@/pages/DocumentDetailPage').then((m) => ({ default: m.DocumentDetailPage })))
const SecurityPage = lazy(() => import('@/pages/SecurityPage').then((m) => ({ default: m.SecurityPage })))
const InvoicesPage = lazy(() => import('@/pages/finance/InvoicesPage').then((m) => ({ default: m.InvoicesPage })))
const ExpensesPage = lazy(() => import('@/pages/finance/ExpensesPage').then((m) => ({ default: m.ExpensesPage })))
const IntakePage = lazy(() => import('@/pages/finance/IntakePage').then((m) => ({ default: m.IntakePage })))
const TransactionsPage = lazy(() => import('@/pages/finance/TransactionsPage').then((m) => ({ default: m.TransactionsPage })))
const TokensPage = lazy(() => import('@/pages/TokensPage').then((m) => ({ default: m.TokensPage })))
const ReportsPage = lazy(() => import('@/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })))
const DeliveriesPage = lazy(() => import('@/pages/email/DeliveriesPage').then((m) => ({ default: m.DeliveriesPage })))
const EmailDeliveryDetailPage = lazy(() => import('@/pages/email/EmailDeliveryDetailPage').then((m) => ({ default: m.EmailDeliveryDetailPage })))
const SendersPage = lazy(() => import('@/pages/email/SendersPage').then((m) => ({ default: m.SendersPage })))
const ConnectionsPage = lazy(() => import('@/pages/providers/ProvidersPage').then((m) => ({ default: m.ConnectionsPage })))
const ResourcesPage = lazy(() => import('@/pages/providers/ProvidersPage').then((m) => ({ default: m.ResourcesPage })))
const AccountsPage = lazy(() => import('@/pages/providers/ProvidersPage').then((m) => ({ default: m.AccountsPage })))
const SyncsPage = lazy(() => import('@/pages/providers/ProvidersPage').then((m) => ({ default: m.SyncsPage })))

const DevPage = lazy(() => import('@/pages/DevPage').then((m) => ({ default: m.DevPage })))

const router = createBrowserRouter([
  { path: '/', element: <HomeRoute />, errorElement: <RouteError /> },
  { path: '/login', element: <LoginPage />, errorElement: <RouteError /> },
  { path: '/auth/callback', element: <CallbackPage />, errorElement: <RouteError /> },
  {
    element: <ProtectedRoute />,
    errorElement: <RouteError />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'notifications', element: <NotificationsPage /> },
          { path: 'workspace', element: <WorkspaceOverviewPage /> },
          { path: 'workspace/members', element: <MembersPage /> },
          { path: 'workspace/realms', element: <RealmsPage /> },
          { path: 'workspace/realm-roles', element: <RealmRolesPage /> },
          { path: 'workspace/modules', element: <ModulesPage /> },
          { path: 'workspace/storage-policy', element: <StoragePolicyPage /> },
          { path: 'workspace/scim', element: <ScimConfigPage /> },
          { path: 'workspace/audit-logs', element: <AuditLogsPage /> },
          { path: 'services', element: <ServicesPage /> },
          { path: 'infrastructure', element: <InfrastructurePage /> },
          { path: 'infrastructure/:id', element: <InfrastructureDetailPage /> },
          { path: 'incidents', element: <IncidentsPage /> },
          { path: 'incidents/:id', element: <IncidentDetailPage /> },
          { path: 'monitoring', element: <MonitoringPage /> },
          { path: 'backups', element: <BackupsPage /> },
          { path: 'domains', element: <DomainsPage /> },
          { path: 'domains/:id', element: <DomainDetailPage /> },
          { path: 'providers/connections', element: <ConnectionsPage /> },
          { path: 'providers/resources', element: <ResourcesPage /> },
          { path: 'providers/accounts', element: <AccountsPage /> },
          { path: 'providers/syncs', element: <SyncsPage /> },
          { path: 'projects', element: <ProjectsPage /> },
          { path: 'projects/:id', element: <ProjectDetailPage /> },
          { path: 'documents', element: <DocumentsPage /> },
          { path: 'documents/:id', element: <DocumentDetailPage /> },
          { path: 'automation', element: <AutomationPage /> },
          { path: 'security', element: <SecurityPage /> },
          { path: 'finance/vendors', element: <VendorsPage /> },
          { path: 'finance/invoices', element: <InvoicesPage /> },
          { path: 'finance/expenses', element: <ExpensesPage /> },
          { path: 'finance/budgets', element: <BudgetsPage /> },
          { path: 'finance/transactions', element: <TransactionsPage /> },
          { path: 'finance/intake', element: <IntakePage /> },
          { path: 'email/senders', element: <SendersPage /> },
          { path: 'email/templates', element: <TemplatesPage /> },
          { path: 'email/deliveries', element: <DeliveriesPage /> },
          { path: 'email/deliveries/:id', element: <EmailDeliveryDetailPage /> },
          { path: 'mail-accounts', element: <MailAccountsPage /> },
          { path: 'communications', element: <CommunicationsPage /> },
          { path: 'assets', element: <AssetsPage /> },
          { path: 'iot', element: <IotPage /> },
          { path: 'contacts', element: <ContactsPage /> },
          { path: 'campaigns', element: <CampaignsPage /> },
          { path: 'reports', element: <ReportsPage /> },
          { path: 'tokens', element: <TokensPage /> },
          {
            path: 'dev',
            element: (
              <Suspense fallback={<FullPageSpinner />}>
                <DevPage />
              </Suspense>
            ),
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

export function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <AuthProvider>
          <WorkspaceProvider>
            <RouterProvider router={router} />
          </WorkspaceProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  )
}
