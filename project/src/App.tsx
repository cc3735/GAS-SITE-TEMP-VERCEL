import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { OrganizationProvider, useOrganization } from './contexts/OrganizationContext';
import { ToastProvider } from './contexts/ToastContext';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import OrganizationSetup from './pages/OrganizationSetup';

import DashboardLayout from './components/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import CRM from './pages/CRM';
import MarketingSocial from './pages/MarketingSocial';
import Agents from './pages/Agents';

import MCP from './pages/MCP';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import BusinessApps from './pages/BusinessApps';
import AdminDashboard from './pages/AdminDashboard';
import MissionControl from './pages/MissionControl';
import CustomerProfile from './pages/CustomerProfile';
import IntakeDashboard from './pages/IntakeDashboard';
import NudgeCampaigns from './pages/NudgeCampaigns';
import Diagnostics from './pages/Diagnostics';
import WebOS from './pages/WebOS';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function OrganizationRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { currentOrganization, loading: orgLoading } = useOrganization();

  console.log('OrganizationRoute check:', {
    authLoading,
    orgLoading,
    user: user?.id,
    currentOrganization: currentOrganization?.id
  });

  if (authLoading || orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    console.log('No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (!currentOrganization) {
    console.log('User has no organization, redirecting to setup');
    return <Navigate to="/setup" replace />;
  }

  console.log('User has organization, continuing');
  return <>{children}</>;
}

import { useFacebookSDK } from './hooks/useFacebookSDK';

function App() {
  useFacebookSDK();

  return (
    <BrowserRouter>
      <AuthProvider>
        <OrganizationProvider>
          <ToastProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route
                path="/setup"
                element={
                  <ProtectedRoute>
                    <OrganizationSetup />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/webos"
                element={
                  <OrganizationRoute>
                    <WebOS />
                  </OrganizationRoute>
                }
              />

              <Route
                path="/"
                element={
                  <OrganizationRoute>
                    <DashboardLayout />
                  </OrganizationRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="projects" element={<Projects />} />
                <Route path="crm" element={<CRM />} />
                <Route path="marketing-social" element={<MarketingSocial />} />
                <Route path="agents" element={<Agents />} />
                <Route path="mcp" element={<MCP />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="business-apps" element={<BusinessApps />} />
                <Route path="mission-control" element={<MissionControl />} />
                <Route path="intake" element={<IntakeDashboard />} />
                <Route path="nudges" element={<NudgeCampaigns />} />
                <Route path="crm/customer/:id" element={<CustomerProfile />} />
                <Route path="diagnostics" element={<Diagnostics />} />
                <Route path="admin" element={<AdminDashboard />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </ToastProvider>
        </OrganizationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
