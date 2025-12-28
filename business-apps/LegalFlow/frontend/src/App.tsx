import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';

// Layouts
import MainLayout from '@/components/layout/MainLayout';
import AuthLayout from '@/components/layout/AuthLayout';

// Pages
import Landing from '@/pages/Landing';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import Dashboard from '@/pages/Dashboard';
import TaxDashboard from '@/pages/tax/TaxDashboard';
import LegalDashboard from '@/pages/legal/LegalDashboard';
import FilingDashboard from '@/pages/filing/FilingDashboard';
import ChildSupportCalculator from '@/pages/child-support/Calculator';
import Disclaimer from '@/pages/Disclaimer';
import Privacy from '@/pages/Privacy';
import Terms from '@/pages/Terms';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public landing page */}
          <Route path="/" element={<Landing />} />

          {/* Auth routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Public child support calculator */}
          <Route 
            path="/child-support" 
            element={
              <div className="min-h-screen bg-background">
                <nav className="sticky top-0 z-50 border-b bg-background">
                  <div className="mx-auto max-w-7xl px-6 py-4">
                    <div className="flex items-center justify-between">
                      <a href="/" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                          LF
                        </div>
                        <span className="text-lg font-semibold">LegalFlow</span>
                      </a>
                      <div className="flex items-center gap-4">
                        <a href="/login" className="text-muted-foreground hover:text-foreground">
                          Sign In
                        </a>
                        <a
                          href="/register"
                          className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90"
                        >
                          Get Started
                        </a>
                      </div>
                    </div>
                  </div>
                </nav>
                <main className="mx-auto max-w-7xl px-6 py-8">
                  <ChildSupportCalculator />
                </main>
              </div>
            } 
          />

          {/* Protected routes */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tax" element={<TaxDashboard />} />
            <Route path="/tax/:id" element={<TaxDashboard />} />
            <Route path="/tax/new" element={<TaxDashboard />} />
            <Route path="/legal" element={<LegalDashboard />} />
            <Route path="/legal/:id" element={<LegalDashboard />} />
            <Route path="/legal/new" element={<LegalDashboard />} />
            <Route path="/filing" element={<FilingDashboard />} />
            <Route path="/filing/:id" element={<FilingDashboard />} />
            <Route path="/filing/new" element={<FilingDashboard />} />
            <Route path="/settings" element={<Dashboard />} />
            <Route path="/pricing" element={<Dashboard />} />
          </Route>

          {/* Legal pages */}
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
