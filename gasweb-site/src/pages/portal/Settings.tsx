import { NavLink, Outlet, useOutletContext } from 'react-router-dom';
import { User, CreditCard, Bell, Shield } from 'lucide-react';

const tabs = [
  { to: '/portal/settings/profile', icon: User, label: 'Profile' },
  { to: '/portal/settings/billing', icon: CreditCard, label: 'Billing' },
  { to: '/portal/settings/notifications', icon: Bell, label: 'Notifications' },
  { to: '/portal/settings/security', icon: Shield, label: 'Security' },
];

export default function Settings() {
  const context = useOutletContext();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-slate-500 text-sm">Manage your account, billing, and preferences.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-slate-200 mb-8 overflow-x-auto">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </div>

      {/* Sub-page content */}
      <div className="max-w-2xl">
        <Outlet context={context} />
      </div>
    </div>
  );
}
