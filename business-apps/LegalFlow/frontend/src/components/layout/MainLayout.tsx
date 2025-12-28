import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/store';
import {
  FileText,
  Calculator,
  Scale,
  FolderOpen,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Tax Filing', href: '/tax', icon: FileText },
  { name: 'Legal Documents', href: '/legal', icon: Scale },
  { name: 'Legal Filings', href: '/filing', icon: FolderOpen },
  { name: 'Child Support Calculator', href: '/child-support', icon: Calculator },
];

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-card border-r transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                LF
              </div>
              <span className="text-lg font-semibold">LegalFlow</span>
            </Link>
            <button
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t p-4">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium truncate">
                    {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {user?.subscriptionTier || 'Free'} Plan
                  </p>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 rounded-lg border bg-card shadow-lg">
                  <Link
                    to="/settings"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setSidebarOpen(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-muted"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1" />
          
          {/* Subscription badge */}
          {user?.subscriptionTier === 'free' && (
            <Link
              to="/pricing"
              className="rounded-full bg-gradient-to-r from-primary to-teal-500 px-4 py-1.5 text-xs font-medium text-white hover:opacity-90"
            >
              Upgrade to Premium
            </Link>
          )}
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* Legal disclaimer footer */}
      <footer className="fixed bottom-0 right-0 left-0 lg:left-64 bg-muted/50 border-t px-4 py-2 text-center text-xs text-muted-foreground">
        <span className="font-medium">⚠️ Important:</span> LegalFlow provides document preparation services only. This is not legal or tax advice.
        <Link to="/disclaimer" className="ml-2 underline hover:text-foreground">
          Learn more
        </Link>
      </footer>
    </div>
  );
}

