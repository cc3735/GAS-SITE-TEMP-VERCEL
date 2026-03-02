import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

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
import Settings from './pages/portal/Settings';
import Profile from './pages/portal/settings/Profile';
import Billing from './pages/portal/settings/Billing';
import Notifications from './pages/portal/settings/Notifications';
import Security from './pages/portal/settings/Security';
import NotFound from './pages/NotFound';

// Redirect already-authenticated users away from auth pages
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Navigate to="/portal" replace />;
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
          <Route path="/portal" element={<ProtectedRoute><Portal /></ProtectedRoute>}>
            <Route index element={<Navigate to="/portal/apps" replace />} />
            <Route path="apps" element={<MyApps />} />
            <Route path="settings" element={<Settings />}>
              <Route index element={<Navigate to="/portal/settings/profile" replace />} />
              <Route path="profile" element={<Profile />} />
              <Route path="billing" element={<Billing />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="security" element={<Security />} />
            </Route>
          </Route>

          {/* Main layout wrapper */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="services" element={<Services />} />
            <Route path="education" element={<Education />} />
            <Route path="case-studies" element={<CaseStudies />} />
            <Route path="contact" element={<Contact />} />
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
