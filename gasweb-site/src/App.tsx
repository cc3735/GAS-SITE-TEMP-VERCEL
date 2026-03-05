import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { OrganizationProvider } from './contexts/OrganizationContext';

// Layout components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Page components
import Home from './pages/Home';
import Services from './pages/Services';
import Education from './pages/Education';
import CaseStudies from './pages/CaseStudies';
import LandingPage from './pages/LandingPage';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import Portal from './pages/Portal';
import MyApps from './pages/portal/MyApps';
import Overview from './pages/portal/Overview';
import Settings from './pages/portal/Settings';
import LegalFlowHub from './pages/portal/legalflow/LegalFlowHub';
import LegalFlowBusinesses from './pages/portal/legalflow/LegalFlowBusinesses';
import LegalFlowLegal from './pages/portal/legalflow/LegalFlowLegal';
import LegalFlowTrademark from './pages/portal/legalflow/LegalFlowTrademark';
import LegalFlowSigning from './pages/portal/legalflow/LegalFlowSigning';
import LegalFlowDigitalPresence from './pages/portal/legalflow/LegalFlowDigitalPresence';
import LegalFlowDocumentDetail from './pages/portal/legalflow/LegalFlowDocumentDetail';
import FinanceFlowHub from './pages/portal/financeflow/FinanceFlowHub';
import FinanceFlowBookkeeping from './pages/portal/financeflow/FinanceFlowBookkeeping';
import FinanceFlowTax from './pages/portal/financeflow/FinanceFlowTax';
import FinanceFlowInvoicing from './pages/portal/financeflow/FinanceFlowInvoicing';
import FinanceFlowInventory from './pages/portal/financeflow/FinanceFlowInventory';
import FinanceFlowReports from './pages/portal/financeflow/FinanceFlowReports';
import SocialFlowHub from './pages/portal/socialflow/SocialFlowHub';
import SocialFlowMessaging from './pages/portal/socialflow/SocialFlowMessaging';
import SocialFlowMarketing from './pages/portal/socialflow/SocialFlowMarketing';
import ClientIntake from './pages/portal/intake/ClientIntake';
import PortalCRM from './pages/portal/PortalCRM';
import PortalProjects from './pages/portal/PortalProjects';
import Profile from './pages/portal/settings/Profile';
import Billing from './pages/portal/settings/Billing';
import Notifications from './pages/portal/settings/Notifications';
import Security from './pages/portal/settings/Security';
import NotFound from './pages/NotFound';
import GasStaffRoute from './components/GasStaffRoute';
import OSLayout from './pages/os/OSLayout';
import OSDashboard from './pages/os/OSDashboard';
import OSClients from './pages/os/OSClients';
import OSClientDetail from './pages/os/OSClientDetail';
import OSApps from './pages/os/OSApps';
import OSLogin from './pages/os/OSLogin';
import OSAuthCallback from './pages/os/OSAuthCallback';
import OSProjects from './pages/os/OSProjects';
import OSCRM from './pages/os/OSCRM';
import OSMarketing from './pages/os/OSMarketing';
import OSAgents from './pages/os/OSAgents';
import OSMCP from './pages/os/OSMCP';
import OSAnalytics from './pages/os/OSAnalytics';
import OSSettings from './pages/os/OSSettings';
import OSSubscriptions from './pages/os/OSSubscriptions';
import OSSupportTickets from './pages/os/OSSupportTickets';

// Redirect already-authenticated users away from auth pages
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Navigate to="/portal" replace />;
  return <>{children}</>;
}

// Redirect already-authenticated users away from /os/login
function OSAuthRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Navigate to="/os" replace />;
  return <>{children}</>;
}

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Auth pages — standalone (no Layout) */}
          <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
          <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />

          {/* Protected portal — nested routes */}
          <Route path="/portal" element={<ProtectedRoute><OrganizationProvider><Portal /></OrganizationProvider></ProtectedRoute>}>
            <Route index element={<Navigate to="/portal/apps" replace />} />
            <Route path="apps" element={<MyApps />} />
            <Route path="intake" element={<ClientIntake />} />
            <Route path="overview" element={<Overview />} />
            <Route path="settings" element={<Settings />}>
              <Route index element={<Navigate to="/portal/settings/profile" replace />} />
              <Route path="profile" element={<Profile />} />
              <Route path="billing" element={<Billing />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="security" element={<Security />} />
            </Route>
            <Route path="legalflow" element={<LegalFlowHub />} />
            <Route path="legalflow/signing" element={<LegalFlowSigning />} />
            <Route path="legalflow/digital-presence" element={<LegalFlowDigitalPresence />} />
            <Route path="legalflow/businesses" element={<LegalFlowBusinesses />} />
            <Route path="legalflow/legal" element={<LegalFlowLegal />} />
            <Route path="legalflow/legal/:id" element={<LegalFlowDocumentDetail />} />
            <Route path="legalflow/trademark" element={<LegalFlowTrademark />} />
            <Route path="financeflow" element={<FinanceFlowHub />} />
            <Route path="financeflow/bookkeeping" element={<FinanceFlowBookkeeping />} />
            <Route path="financeflow/tax" element={<FinanceFlowTax />} />
            <Route path="financeflow/invoicing" element={<FinanceFlowInvoicing />} />
            <Route path="financeflow/inventory" element={<FinanceFlowInventory />} />
            <Route path="financeflow/reports" element={<FinanceFlowReports />} />
            <Route path="socialflow" element={<SocialFlowHub />} />
            <Route path="socialflow/messaging" element={<SocialFlowMessaging />} />
            <Route path="socialflow/marketing" element={<SocialFlowMarketing />} />
            <Route path="crm" element={<PortalCRM />} />
            <Route path="projects" element={<PortalProjects />} />
          </Route>

          {/* Main layout wrapper */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="services" element={<Services />} />
            <Route path="education" element={<Education />} />
            <Route path="case-studies" element={<CaseStudies />} />
            <Route path="contact" element={<Contact />} />
          </Route>

          {/* GAS-OS login — standalone, no layout */}
          <Route path="/os/login" element={<OSAuthRoute><OSLogin /></OSAuthRoute>} />

          {/* GAS-OS OAuth callback — standalone, handles mid-auth */}
          <Route path="/os/auth/callback" element={<OSAuthCallback />} />

          {/* GAS Operating System — staff only, org-scoped */}
          <Route path="/os" element={<GasStaffRoute><OrganizationProvider><OSLayout /></OrganizationProvider></GasStaffRoute>}>
            <Route index element={<OSDashboard />} />
            <Route path="projects" element={<OSProjects />} />
            <Route path="crm" element={<OSCRM />} />
            <Route path="marketing" element={<OSMarketing />} />
            <Route path="agents" element={<OSAgents />} />
            <Route path="mcp" element={<OSMCP />} />
            <Route path="analytics" element={<OSAnalytics />} />
            <Route path="clients" element={<OSClients />} />
            <Route path="clients/:id" element={<OSClientDetail />} />
            <Route path="apps" element={<OSApps />} />
            <Route path="subscriptions" element={<OSSubscriptions />} />
            <Route path="support-tickets" element={<OSSupportTickets />} />
            <Route path="settings" element={<OSSettings />} />
          </Route>

          {/* Landing page — standalone, no nav */}
          <Route path="/links" element={<LandingPage />} />
          <Route path="/hub" element={<LandingPage />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
