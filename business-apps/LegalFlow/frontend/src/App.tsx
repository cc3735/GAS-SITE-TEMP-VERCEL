import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';

// Layouts
import MainLayout from '@/components/layout/MainLayout';
import AuthLayout from '@/components/layout/AuthLayout';
import EmbeddedLayout from '@/components/layout/EmbeddedLayout';

// Detect embedded (iframe) mode — set by the index.html inline script
const isEmbedded = sessionStorage.getItem('embedded_mode') === 'true';

// Pages
import Landing from '@/pages/Landing';
import Bookkeeping from '@/pages/bookkeeping/Bookkeeping';
import BankAccounts from '@/pages/bookkeeping/BankAccounts';
import BankStatementUpload from '@/pages/bookkeeping/BankStatementUpload';
import Transactions from '@/pages/bookkeeping/Transactions';
import Reports from '@/pages/bookkeeping/Reports';
import ApAr from '@/pages/bookkeeping/ApAr';
import NotFound from '@/pages/NotFound';
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
import Businesses from '@/pages/Businesses';
import Settings from '@/pages/Settings';
import ChartOfAccounts from '@/pages/accounting/ChartOfAccounts';
import JournalEntries from '@/pages/accounting/JournalEntries';
import TrademarkDashboard from '@/pages/trademark/TrademarkDashboard';
import TrademarkSearch from '@/pages/trademark/TrademarkSearch';
import TrademarkApplication from '@/pages/trademark/TrademarkApplication';
import DocumentCreate from '@/pages/legal/DocumentCreate';

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
    if (isEmbedded) {
      return (
        <div className="flex min-h-screen items-center justify-center p-8 text-center">
          <p className="text-muted-foreground">
            Session expired. Please return to the GAS portal and sign in again.
          </p>
        </div>
      );
    }
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

          {/* Auth routes — show plain message when running embedded in the portal */}
          <Route element={<AuthLayout />}>
            <Route
              path="/login"
              element={
                isEmbedded ? (
                  <div className="flex min-h-screen items-center justify-center text-white">
                    Please sign in via the GAS Portal.
                  </div>
                ) : (
                  <Login />
                )
              }
            />
            <Route
              path="/register"
              element={
                isEmbedded ? (
                  <div className="flex min-h-screen items-center justify-center text-white">
                    Please register via the GAS Portal.
                  </div>
                ) : (
                  <Register />
                )
              }
            />
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

          {/* Protected routes — use minimal layout when embedded in portal */}
          <Route
            element={
              <ProtectedRoute>
                {isEmbedded ? <EmbeddedLayout /> : <MainLayout />}
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tax" element={<TaxDashboard />} />
            <Route path="/tax/:id" element={<TaxDashboard />} />
            <Route path="/tax/new" element={<TaxDashboard />} />
            <Route path="/legal" element={<LegalDashboard />} />
            <Route path="/legal/create" element={<DocumentCreate />} />
            <Route path="/legal/:id" element={<LegalDashboard />} />
            <Route path="/legal/new" element={<LegalDashboard />} />
            <Route path="/filing" element={<FilingDashboard />} />
            <Route path="/filing/:id" element={<FilingDashboard />} />
            <Route path="/filing/new" element={<FilingDashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/pricing" element={<Dashboard />} />

            {/* Bookkeeping Routes */}
            <Route path="/bookkeeping" element={<Bookkeeping />} />
            <Route path="/bookkeeping/accounts" element={<BankAccounts />} />
            <Route path="/bookkeeping/upload" element={<BankStatementUpload />} />
            <Route path="/bookkeeping/transactions" element={<Transactions />} />
            <Route path="/bookkeeping/reports" element={<Reports />} />
            <Route path="/bookkeeping/ap-ar" element={<ApAr />} />
            <Route path="/businesses" element={<Businesses />} />
            <Route path="/accounting/chart-of-accounts" element={<ChartOfAccounts />} />
            <Route path="/accounting/journal-entries" element={<JournalEntries />} />

            {/* Trademark Routes */}
            <Route path="/trademark" element={<TrademarkDashboard />} />
            <Route path="/trademark/search" element={<TrademarkSearch />} />
            <Route path="/trademark/apply/new" element={<TrademarkApplication />} />
            <Route path="/trademark/apply/:id" element={<TrademarkApplication />} />

          </Route>

          {/* Legal pages */}
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
