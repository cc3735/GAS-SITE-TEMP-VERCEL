import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, AppWindow, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const NAV_ITEMS = [
  { to: '/os', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/os/clients', label: 'Clients', icon: Users, end: false },
  { to: '/os/apps', label: 'Apps', icon: AppWindow, end: false },
];

export default function OSLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-gray-950 text-white">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col bg-gray-900 border-r border-gray-800">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary-600 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">G</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-none">GAS Operating</p>
              <p className="text-xs text-gray-400 mt-0.5">System</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer: back to portal + sign out */}
        <div className="px-3 py-4 border-t border-gray-800 space-y-1">
          <NavLink
            to="/portal/apps"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
            Back to Portal
          </NavLink>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            Sign Out
          </button>
          <p className="px-3 pt-2 text-xs text-gray-600 truncate">{user?.email}</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
