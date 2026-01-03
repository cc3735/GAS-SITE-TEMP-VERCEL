import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { usePermissions } from '../hooks/usePermissions';
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
  Plus,
  Crown,
  Eye,
  XCircle,
  Loader2,
} from 'lucide-react';
import ChatBot from './ChatBot';
import CommandPalette from './CommandPalette';
import { useTheme } from '../contexts/ThemeContext';
import { ErrorBoundary } from './ErrorBoundary';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  masterOnly?: boolean;
  requiresPermission?: keyof ReturnType<typeof usePermissions>;
}

const baseNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Mission Control', href: '/mission-control', icon: LayoutDashboard },
  { name: 'Intake Engine', href: '/intake', icon: Magnet },
  { name: 'Nudge Campaigns', href: '/nudges', icon: Zap },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'CRM', href: '/crm', icon: Users, requiresPermission: 'canViewCrm' },
  { name: 'Marketing & Social', href: '/marketing-social', icon: Mail },
  { name: 'AI Agents & Coding', href: '/agents', icon: Bot, requiresPermission: 'canViewAiAgents' },
  { name: 'MCP Servers', href: '/mcp', icon: Server, requiresPermission: 'canViewMcpServers' },
  { name: 'Business Apps', href: '/business-apps', icon: Boxes, requiresPermission: 'canViewBusinessApps' },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, requiresPermission: 'canViewAnalytics' },
  { name: 'Admin', href: '/admin', icon: Shield },
  { name: 'Settings', href: '/settings', icon: Settings },
];

// Master admin only navigation
const masterNavigation: NavItem[] = [
  { name: 'GAS Mission Control', href: '/gas/mission-control', icon: Crown, masterOnly: true },
  { name: 'GAS Settings', href: '/gas/settings', icon: Settings, masterOnly: true },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [createOrgError, setCreateOrgError] = useState<string | null>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { 
    organizations, 
    currentOrganization, 
    effectiveOrganization,
    switchOrganization, 
    createOrganization,
    impersonatedOrganizationId,
    setImpersonatedOrganization,
    isMasterContext,
    allOrganizations,
  } = useOrganization();
  const permissions = usePermissions();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    setCreatingOrg(true);
    setCreateOrgError(null);

    try {
      const org = await createOrganization(newOrgName.trim());
      if (org) {
        switchOrganization(org.id);
        setShowCreateOrgModal(false);
        setNewOrgName('');
      }
    } catch (error: any) {
      setCreateOrgError(error.message || 'Failed to create organization');
    } finally {
      setCreatingOrg(false);
    }
  };

  const handleExitImpersonation = () => {
    setImpersonatedOrganization(null);
    navigate('/gas/mission-control');
  };

  // Build navigation based on permissions
  const navigation = baseNavigation.filter(item => {
    // Hide "Mission Control" when in GAS organization (not impersonating)
    // GAS admins should use "GAS Mission Control" instead, which allows impersonation
    if (item.href === '/mission-control' && isMasterContext && !permissions.isImpersonating) {
      return false;
    }
    if (item.requiresPermission) {
      return permissions[item.requiresPermission] !== false;
    }
    return true;
  });

  // Add master navigation if user is master admin
  const fullNavigation = permissions.isMasterAdmin 
    ? [...masterNavigation, ...navigation]
    : navigation;

  return (
    <div className="min-h-screen bg-page text-primary transition-colors duration-200">
      {/* Impersonation Banner */}
      {permissions.isImpersonating && effectiveOrganization && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-black px-4 py-2 z-[60] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">
              Viewing as: <strong>{effectiveOrganization.name}</strong>
            </span>
          </div>
          <button
            onClick={handleExitImpersonation}
            className="flex items-center gap-1 px-3 py-1 bg-black/20 hover:bg-black/30 rounded text-sm font-medium transition"
          >
            <XCircle className="w-4 h-4" />
            Exit
          </button>
        </div>
      )}

      {/* Mobile header */}
      <div className={`lg:hidden fixed left-0 right-0 bg-surface border-b border-border z-50 px-4 py-3 flex items-center justify-between ${permissions.isImpersonating ? 'top-10' : 'top-0'}`}>
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

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-surface border-r border-border z-40 transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 ${permissions.isImpersonating ? 'pt-10' : ''}`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent-hover rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-primary">GAS OS</span>
              {isMasterContext && !permissions.isImpersonating && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 text-xs font-medium rounded">
                  ADMIN
                </span>
              )}
            </div>

            {/* Organization Selector */}
            <div className="relative">
              <button
                onClick={() => setOrgMenuOpen(!orgMenuOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-secondary bg-page hover:bg-surface-hover rounded-lg transition"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">
                    {effectiveOrganization?.name || currentOrganization?.name || 'No organization'}
                  </span>
                  {effectiveOrganization?.is_master && (
                    <Crown className="w-3 h-3 text-amber-500 flex-shrink-0" />
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${orgMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {orgMenuOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-lg shadow-lg py-1 z-50 max-h-64 overflow-y-auto">
                  {/* User's organizations */}
                  {organizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => {
                        switchOrganization(org.id);
                        setOrgMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-hover transition flex items-center justify-between ${
                        currentOrganization?.id === org.id ? 'bg-accent-subtle text-accent' : 'text-secondary'
                      }`}
                    >
                      <span className="truncate">{org.name}</span>
                      {org.is_master && <Crown className="w-3 h-3 text-amber-500" />}
                    </button>
                  ))}
                  
                  {/* Divider and Add Organization */}
                  <div className="border-t border-border my-1" />
                  <button
                    onClick={() => {
                      setOrgMenuOpen(false);
                      setShowCreateOrgModal(true);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-accent hover:bg-surface-hover transition flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Organization
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {fullNavigation.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-accent-subtle text-accent'
                      : item.masterOnly
                      ? 'text-amber-500 hover:bg-amber-500/10'
                      : 'text-secondary hover:bg-surface-hover'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                  {item.masterOnly && <Crown className="w-3 h-3 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
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

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className={`lg:pl-64 ${permissions.isImpersonating ? 'pt-10' : ''}`}>
        <div className={`${permissions.isImpersonating ? 'pt-16 lg:pt-0' : 'pt-16 lg:pt-0'}`}>
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </div>
      </div>

      {/* ChatBot */}
      <ChatBot />

      {/* Command Palette */}
      <CommandPalette />

      {/* Create Organization Modal */}
      {showCreateOrgModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="bg-surface rounded-xl shadow-xl max-w-md w-full p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-primary">Create Organization</h2>
              <button 
                onClick={() => {
                  setShowCreateOrgModal(false);
                  setNewOrgName('');
                  setCreateOrgError(null);
                }} 
                className="text-subtle hover:text-primary"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateOrganization}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-secondary mb-2">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="My Company"
                  className="w-full px-4 py-3 border border-border bg-surface text-primary rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                  autoFocus
                  disabled={creatingOrg}
                />
              </div>
              
              {createOrgError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                  {createOrgError}
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateOrgModal(false);
                    setNewOrgName('');
                    setCreateOrgError(null);
                  }}
                  className="flex-1 px-4 py-2 border border-border text-secondary rounded-lg hover:bg-surface-hover transition"
                  disabled={creatingOrg}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingOrg || !newOrgName.trim()}
                  className="flex-1 px-4 py-2 bg-accent hover:bg-accent-hover text-accent-foreground rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creatingOrg ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
