import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOrganization } from '../contexts/OrganizationContext';
import {
  ChevronDown,
  LogOut,
  Building2,
  Sparkles,
  Home,
  FolderKanban,
  Users,
  Mail,
  Bot,
  Server,
  BarChart3,
  Settings,
  Menu,
  X,
  Boxes,
  Shield,
  LayoutDashboard,
  Magnet,
  Zap,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import ChatBot from './ChatBot';
import CommandPalette from './CommandPalette';
import { useTheme } from '../contexts/ThemeContext';
import { ErrorBoundary } from './ErrorBoundary';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Mission Control', href: '/mission-control', icon: LayoutDashboard },
  { name: 'Intake Engine', href: '/intake', icon: Magnet },
  { name: 'Nudge Campaigns', href: '/nudges', icon: Zap },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'CRM', href: '/crm', icon: Users },
  { name: 'Marketing & Social', href: '/marketing-social', icon: Mail },
  { name: 'AI Agents & Coding', href: '/agents', icon: Bot },
  { name: 'MCP Servers', href: '/mcp', icon: Server },
  { name: 'Business Apps', href: '/business-apps', icon: Boxes },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Admin', href: '/admin', icon: Shield },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { organizations, currentOrganization, switchOrganization } = useOrganization();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-page text-primary transition-colors duration-200">
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-surface border-b border-border z-50 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-secondary hover:text-primary"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-accent" />
          <span className="font-bold text-primary">GAS OS</span>
        </div>
      </div>

      <div
        className={`fixed inset-y-0 left-0 w-64 bg-surface border-r border-border z-40 transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent-hover rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-primary">GAS OS</span>
            </div>

            <div className="relative">
              <button
                onClick={() => setOrgMenuOpen(!orgMenuOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-secondary bg-page hover:bg-surface-hover rounded-lg transition"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{currentOrganization?.name || 'No organization'}</span>
                </div>
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              </button>

              {orgMenuOpen && organizations.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-lg shadow-lg py-1 z-50">
                  {organizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => {
                        switchOrganization(org.id);
                        setOrgMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-hover transition ${currentOrganization?.id === org.id ? 'bg-accent-subtle text-accent' : 'text-secondary'
                        }`}
                    >
                      {org.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive
                    ? 'bg-accent-subtle text-accent'
                    : 'text-secondary hover:bg-surface-hover'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border">
             <div className="flex bg-surface-hover p-1 rounded-lg mb-4">
               <button
                 onClick={() => setTheme('light')}
                 className={`flex-1 p-1 rounded-md flex justify-center ${theme === 'light' ? 'bg-surface shadow-sm text-accent' : 'text-subtle hover:text-secondary'}`}
                 title="Light Mode"
               >
                 <Sun className="w-4 h-4" />
               </button>
               <button
                 onClick={() => setTheme('dark')}
                 className={`flex-1 p-1 rounded-md flex justify-center ${theme === 'dark' ? 'bg-surface shadow-sm text-accent' : 'text-subtle hover:text-secondary'}`}
                 title="Dark Mode"
               >
                 <Moon className="w-4 h-4" />
               </button>
               <button
                 onClick={() => setTheme('neon')}
                 className={`flex-1 p-1 rounded-md flex justify-center ${theme === 'neon' ? 'bg-surface shadow-sm text-accent' : 'text-subtle hover:text-secondary'}`}
                 title="Neon Mode"
               >
                 <Zap className="w-4 h-4" />
               </button>
             </div>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-accent to-accent-hover rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary truncate">
                  {user?.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-xs text-subtle truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-500/10 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="lg:pl-64">
        <div className="pt-16 lg:pt-0">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </div>

      {/* ChatBot - Available on all pages */}
      <ChatBot />

      {/* Command Palette - Global shortcut Cmd+K */}
      <CommandPalette />
    </div>
  );
}
