import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { ThemeProvider } from '@/context/ThemeContext'
import { AuthProvider } from '@/context/AuthContext'
import { WorkspaceProvider } from '@/context/WorkspaceContext'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute, FullPageSpinner } from '@/components/ProtectedRoute'
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
const DocumentsPage = sm('DocumentsPage')
const MailAccountsPage = sm('MailAccountsPage')
const SendersPage = sm('SendersPage')
const TemplatesPage = sm('TemplatesPage')
const BudgetsPage = sm('BudgetsPage')
const ExpensesPage = sm('ExpensesPage')
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
const SecurityPage = lazy(() => import('@/pages/SecurityPage').then((m) => ({ default: m.SecurityPage })))
const InvoicesPage = lazy(() => import('@/pages/finance/InvoicesPage').then((m) => ({ default: m.InvoicesPage })))
const IntakePage = lazy(() => import('@/pages/finance/IntakePage').then((m) => ({ default: m.IntakePage })))
const TokensPage = lazy(() => import('@/pages/TokensPage').then((m) => ({ default: m.TokensPage })))
const ReportsPage = lazy(() => import('@/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })))
const DeliveriesPage = lazy(() => import('@/pages/email/DeliveriesPage').then((m) => ({ default: m.DeliveriesPage })))
const ConnectionsPage = lazy(() => import('@/pages/providers/ProvidersPage').then((m) => ({ default: m.ConnectionsPage })))
const ResourcesPage = lazy(() => import('@/pages/providers/ProvidersPage').then((m) => ({ default: m.ResourcesPage })))
const AccountsPage = lazy(() => import('@/pages/providers/ProvidersPage').then((m) => ({ default: m.AccountsPage })))
const SyncsPage = lazy(() => import('@/pages/providers/ProvidersPage').then((m) => ({ default: m.SyncsPage })))

const DevPage = lazy(() => import('@/pages/DevPage').then((m) => ({ default: m.DevPage })))

const router = createBrowserRouter([
  { path: '/', element: <HomeRoute /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/auth/callback', element: <CallbackPage /> },
  {
    element: <ProtectedRoute />,
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
          { path: 'automation', element: <AutomationPage /> },
          { path: 'security', element: <SecurityPage /> },
          { path: 'finance/vendors', element: <VendorsPage /> },
          { path: 'finance/invoices', element: <InvoicesPage /> },
          { path: 'finance/expenses', element: <ExpensesPage /> },
          { path: 'finance/budgets', element: <BudgetsPage /> },
          { path: 'finance/intake', element: <IntakePage /> },
          { path: 'email/senders', element: <SendersPage /> },
          { path: 'email/templates', element: <TemplatesPage /> },
          { path: 'email/deliveries', element: <DeliveriesPage /> },
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
      <AuthProvider>
        <WorkspaceProvider>
          <RouterProvider router={router} />
        </WorkspaceProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
