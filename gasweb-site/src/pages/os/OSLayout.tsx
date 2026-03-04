import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Mail,
  Bot,
  Settings,
  AppWindow,
  LifeBuoy,
  LogOut,
  ChevronRight,
  ChevronDown,
  Building2,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import ChatBot from '../../components/os/ChatBot';

const MAIN_NAV = [
  { to: '/os', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/os/projects', label: 'Projects', icon: FolderKanban, end: false },
  { to: '/os/crm', label: 'CRM', icon: Users, end: false },
  { to: '/os/marketing', label: 'Marketing & Social', icon: Mail, end: false },
  { to: '/os/agents', label: 'AI & Automation', icon: Bot, end: false },
  { to: '/os/apps', label: 'App Catalog', icon: AppWindow, end: false },
  { to: '/os/support-tickets', label: 'Support Tickets', icon: LifeBuoy, end: false },
];

const BOTTOM_NAV = [
  { to: '/os/settings', label: 'Settings', icon: Settings, end: false },
];

export default function OSLayout() {
  const { user, signOut } = useAuth();
  const { organizations, currentOrganization, switchOrganization } = useOrganization();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/os/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-primary-600 text-white'
        : 'text-gray-400 hover:text-white hover:bg-gray-800'
    }`;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-800">
        <NavLink to="/os" end className="flex items-center gap-2 mb-4 cursor-pointer">
          <img src="/logo.png" alt="GAS-OS" className="h-16 w-auto brightness-0 invert" />
          <p className="text-sm font-semibold text-white leading-none">GAS-OS</p>
        </NavLink>

        {/* Organization Switcher */}
        <div className="relative">
          <button
            onClick={() => setOrgMenuOpen(!orgMenuOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="w-4 h-4 flex-shrink-0 text-gray-500" />
              <span className="truncate">{currentOrganization?.name || 'No organization'}</span>
            </div>
            <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${orgMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {orgMenuOpen && organizations.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg py-1 z-50">
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => {
                    switchOrganization(org.id);
                    setOrgMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition ${
                    currentOrganization?.id === org.id
                      ? 'bg-primary-600/20 text-primary-400'
                      : 'text-gray-300'
                  }`}
                >
                  {org.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {MAIN_NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={navLinkClass}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}

        {/* Settings Divider */}
        <div className="pt-3 border-t border-gray-800 mt-3">
          {BOTTOM_NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={navLinkClass}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer: user info + sign out */}
      <div className="px-3 py-4 border-t border-gray-800 space-y-2">
        <div className="flex items-center gap-3 px-3">
          <div className="w-8 h-8 bg-primary-600/30 rounded-full flex items-center justify-center text-primary-400 text-sm font-semibold flex-shrink-0">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.user_metadata?.full_name || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <NavLink
          to="/portal/apps"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
          Back to Portal
        </NavLink>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-900/20"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-gray-900 border-b border-gray-800 z-50 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-gray-400 hover:text-white"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="GAS-OS" className="h-12 w-auto brightness-0 invert" />
          <span className="font-semibold text-white text-sm">GAS-OS</span>
        </div>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-60 bg-gray-900 border-r border-gray-800 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 w-60 bg-gray-900 border-r border-gray-800 z-40 transform transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="pt-16">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:pl-60 min-h-screen">
        <div className="pt-16 lg:pt-0">
          <Outlet />
        </div>
      </main>

      {/* ChatBot */}
      <ChatBot />
    </div>
  );
}
