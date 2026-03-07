import { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutGrid,
  User,
  Users,
  CreditCard,
  Bell,
  Shield,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Settings,
  Scale,
  FileText,
  Award,
  Briefcase,
  FolderKanban,
  Receipt,
  DollarSign,
  Calculator,
  FileSpreadsheet,
  Package,
  Share2,
  MessageCircle,
  Megaphone,
  Monitor,
  PenTool,
  Globe,
  BookOpen,
  HardHat,
  Home,
  Wrench,
  Clock,
  FileCheck,
  UtensilsCrossed,
  ShoppingCart,
  MapPin,
  Key,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import PortalChatBot from '../components/portal/PortalChatBot';

const appNavItems = [
  { to: '/portal/apps', icon: LayoutGrid, label: 'My Apps' },
  { to: '/portal/courses', icon: BookOpen, label: 'Education Hub' },
  { to: '/portal/crm', icon: Users, label: 'CRM' },
  { to: '/portal/projects', icon: FolderKanban, label: 'Projects' },
];

const settingsNavItems = [
  { to: '/portal/settings/profile', icon: User, label: 'Profile' },
  { to: '/portal/settings/billing', icon: CreditCard, label: 'Billing' },
  { to: '/portal/settings/notifications', icon: Bell, label: 'Notifications' },
  { to: '/portal/settings/security', icon: Shield, label: 'Security' },
];

const legalFlowNavItems = [
  { to: '/portal/legalflow',                  icon: LayoutGrid, label: 'Overview',          end: true },
  { to: '/portal/legalflow/businesses',       icon: Briefcase,  label: 'Businesses' },
  { to: '/portal/legalflow/legal',            icon: FileText,   label: 'Legal Documents' },
  { to: '/portal/legalflow/digital-presence', icon: Globe,      label: 'Digital Presence' },
  { to: '/portal/legalflow/trademark',        icon: Award,      label: 'Trademark' },
  { to: '/portal/legalflow/signing',          icon: PenTool,    label: 'Document Signing' },
];

const financeFlowNavItems = [
  { to: '/portal/financeflow',              icon: LayoutGrid,     label: 'Overview',                end: true },
  { to: '/portal/financeflow/bookkeeping',  icon: DollarSign,     label: 'Bookkeeping & Accounting' },
  { to: '/portal/financeflow/tax',          icon: Calculator,     label: 'Tax Filing' },
  { to: '/portal/financeflow/invoicing',    icon: FileSpreadsheet, label: 'Invoicing & Payments' },
  { to: '/portal/financeflow/inventory',    icon: Package,        label: 'Inventory Management' },
];

const socialFlowNavItems = [
  { to: '/portal/socialflow',            icon: LayoutGrid,    label: 'Overview',           end: true },
  { to: '/portal/socialflow/messaging',  icon: MessageCircle, label: 'Unified Messaging' },
  { to: '/portal/socialflow/marketing',  icon: Megaphone,     label: 'Marketing & Social' },
];

const hrFlowNavItems = [
  { to: '/portal/hrflow',                icon: LayoutGrid, label: 'Overview',        end: true },
  { to: '/portal/hrflow/employees',      icon: Users,      label: 'Employees' },
  { to: '/portal/hrflow/time-tracking',  icon: Clock,      label: 'Time Tracking' },
  { to: '/portal/hrflow/documents',      icon: FileCheck,  label: 'Documents' },
];

const courseFlowNavItems = [
  { to: '/portal/courseflow',            icon: LayoutGrid,    label: 'Overview',    end: true },
  { to: '/portal/courseflow/courses',    icon: BookOpen,      label: 'Courses' },
  { to: '/portal/courseflow/students',   icon: GraduationCap, label: 'Students' },
  { to: '/portal/courseflow/analytics',  icon: Calculator,    label: 'Analytics' },
];

const foodTruckNavItems = [
  { to: '/portal/foodtruck',            icon: LayoutGrid,       label: 'Overview',    end: true },
  { to: '/portal/foodtruck/menu',       icon: UtensilsCrossed,  label: 'Menu' },
  { to: '/portal/foodtruck/orders',     icon: ShoppingCart,     label: 'Orders' },
  { to: '/portal/foodtruck/locations',  icon: MapPin,           label: 'Locations' },
  { to: '/portal/foodtruck/inventory',  icon: Package,          label: 'Inventory' },
];

const buildFlowNavItems = [
  { to: '/portal/buildflow',              icon: LayoutGrid,     label: 'Overview',     end: true },
  { to: '/portal/buildflow/estimates',    icon: Calculator,     label: 'Estimates' },
  { to: '/portal/buildflow/materials',    icon: Package,        label: 'Materials' },
  { to: '/portal/buildflow/contractors',  icon: HardHat,        label: 'Contractors' },
  { to: '/portal/buildflow/permits',      icon: FileCheck,      label: 'Permits' },
];

const keysFlowNavItems = [
  { to: '/portal/keysflow',              icon: LayoutGrid, label: 'Overview',      end: true },
  { to: '/portal/keysflow/properties',   icon: Home,       label: 'Properties' },
  { to: '/portal/keysflow/tenants',      icon: Users,      label: 'Tenants' },
  { to: '/portal/keysflow/leases',       icon: FileText,   label: 'Leases' },
  { to: '/portal/keysflow/maintenance',  icon: Wrench,     label: 'Maintenance' },
];

interface SidebarContentProps {
  initials: string;
  user: { email?: string; user_metadata?: Record<string, unknown> };
  subscribedApps: Set<string>;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isLegalFlowOpen: boolean;
  setIsLegalFlowOpen: (open: boolean) => void;
  isFinanceFlowOpen: boolean;
  setIsFinanceFlowOpen: (open: boolean) => void;
  isSocialFlowOpen: boolean;
  setIsSocialFlowOpen: (open: boolean) => void;
  isHRFlowOpen: boolean;
  setIsHRFlowOpen: (open: boolean) => void;
  isCourseFlowOpen: boolean;
  setIsCourseFlowOpen: (open: boolean) => void;
  isFoodTruckOpen: boolean;
  setIsFoodTruckOpen: (open: boolean) => void;
  isBuildFlowOpen: boolean;
  setIsBuildFlowOpen: (open: boolean) => void;
  isKeysFlowOpen: boolean;
  setIsKeysFlowOpen: (open: boolean) => void;
  isGasStaff: boolean;
  handleSignOut: () => void;
}

function SidebarContent({
  initials, user, subscribedApps,
  isSettingsOpen, setIsSettingsOpen,
  isLegalFlowOpen, setIsLegalFlowOpen,
  isFinanceFlowOpen, setIsFinanceFlowOpen,
  isSocialFlowOpen, setIsSocialFlowOpen,
  isHRFlowOpen, setIsHRFlowOpen,
  isCourseFlowOpen, setIsCourseFlowOpen,
  isFoodTruckOpen, setIsFoodTruckOpen,
  isBuildFlowOpen, setIsBuildFlowOpen,
  isKeysFlowOpen, setIsKeysFlowOpen,
  isGasStaff,
  handleSignOut,
}: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-slate-200">
        <NavLink to="/portal/overview" className="flex items-center gap-2">
          <img src="/logo.png" alt="GAS" className="h-20 w-auto" />
          <span className="font-semibold text-slate-900 text-sm">GAS Client Portal</span>
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {appNavItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}

        {/* LegalFlow group — only if subscribed */}
        {subscribedApps.has('legalflow') && (
          <CollapsibleGroup
            icon={Scale}
            label="LegalFlow"
            isOpen={isLegalFlowOpen}
            onToggle={() => setIsLegalFlowOpen(!isLegalFlowOpen)}
            items={legalFlowNavItems}
          />
        )}

        {/* FinanceFlow group — only if subscribed */}
        {subscribedApps.has('financeflow') && (
          <CollapsibleGroup
            icon={Receipt}
            label="FinanceFlow"
            isOpen={isFinanceFlowOpen}
            onToggle={() => setIsFinanceFlowOpen(!isFinanceFlowOpen)}
            items={financeFlowNavItems}
          />
        )}

        {/* SocialFlow group — only if subscribed */}
        {subscribedApps.has('socialflow') && (
          <CollapsibleGroup
            icon={Share2}
            label="SocialFlow"
            isOpen={isSocialFlowOpen}
            onToggle={() => setIsSocialFlowOpen(!isSocialFlowOpen)}
            items={socialFlowNavItems}
          />
        )}

        {/* HRFlow group — only if subscribed */}
        {subscribedApps.has('hrflow') && (
          <CollapsibleGroup
            icon={Users}
            label="HRFlow"
            isOpen={isHRFlowOpen}
            onToggle={() => setIsHRFlowOpen(!isHRFlowOpen)}
            items={hrFlowNavItems}
          />
        )}

        {/* CourseFlow group — only if subscribed */}
        {subscribedApps.has('courseflow') && (
          <CollapsibleGroup
            icon={GraduationCap}
            label="CourseFlow"
            isOpen={isCourseFlowOpen}
            onToggle={() => setIsCourseFlowOpen(!isCourseFlowOpen)}
            items={courseFlowNavItems}
          />
        )}

        {/* FoodTruck group — only if subscribed */}
        {subscribedApps.has('foodtruck') && (
          <CollapsibleGroup
            icon={UtensilsCrossed}
            label="FoodTruck"
            isOpen={isFoodTruckOpen}
            onToggle={() => setIsFoodTruckOpen(!isFoodTruckOpen)}
            items={foodTruckNavItems}
          />
        )}

        {/* BuildFlow group — only if subscribed */}
        {subscribedApps.has('buildflow') && (
          <CollapsibleGroup
            icon={HardHat}
            label="BuildFlow"
            isOpen={isBuildFlowOpen}
            onToggle={() => setIsBuildFlowOpen(!isBuildFlowOpen)}
            items={buildFlowNavItems}
          />
        )}

        {/* KeysFlow group — only if subscribed */}
        {subscribedApps.has('keysflow') && (
          <CollapsibleGroup
            icon={Key}
            label="KeysFlow"
            isOpen={isKeysFlowOpen}
            onToggle={() => setIsKeysFlowOpen(!isKeysFlowOpen)}
            items={keysFlowNavItems}
          />
        )}

        {/* Settings group */}
        <CollapsibleGroup
          icon={Settings}
          label="Settings"
          isOpen={isSettingsOpen}
          onToggle={() => setIsSettingsOpen(!isSettingsOpen)}
          items={settingsNavItems}
          className="pt-2"
        />
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-slate-200">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-900 truncate">
              {(user.user_metadata?.full_name as string) || 'My Account'}
            </p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        </div>
        {isGasStaff && (
          <NavLink
            to="/os"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors"
          >
            <Monitor className="w-4 h-4" />
            Switch to OS
          </NavLink>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

function CollapsibleGroup({
  icon: Icon, label, isOpen, onToggle, items, className = 'pt-1',
}: {
  icon: React.ElementType;
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  items: { to: string; icon: React.ElementType; label: string; end?: boolean }[];
  className?: string;
}) {
  return (
    <div className={className}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 text-left">{label}</span>
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      {isOpen && (
        <div className="mt-1 ml-3 pl-4 border-l border-slate-200 space-y-1">
          {items.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </div>
      )}
    </div>
  );
}

function NavItem({ to, icon: Icon, label, end }: { to: string; icon: React.ElementType; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-primary-50 text-primary-700'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`
      }
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {label}
    </NavLink>
  );
}

export default function Portal() {
  const { user, signOut, isGasStaff } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(
    location.pathname.startsWith('/portal/settings')
  );
  const [isLegalFlowOpen, setIsLegalFlowOpen] = useState(
    location.pathname.startsWith('/portal/legalflow')
  );
  const [isFinanceFlowOpen, setIsFinanceFlowOpen] = useState(
    location.pathname.startsWith('/portal/financeflow')
  );
  const [isSocialFlowOpen, setIsSocialFlowOpen] = useState(
    location.pathname.startsWith('/portal/socialflow')
  );
  const [isHRFlowOpen, setIsHRFlowOpen] = useState(
    location.pathname.startsWith('/portal/hrflow')
  );
  const [isCourseFlowOpen, setIsCourseFlowOpen] = useState(
    location.pathname.startsWith('/portal/courseflow')
  );
  const [isFoodTruckOpen, setIsFoodTruckOpen] = useState(
    location.pathname.startsWith('/portal/foodtruck')
  );
  const [isBuildFlowOpen, setIsBuildFlowOpen] = useState(
    location.pathname.startsWith('/portal/buildflow')
  );
  const [isKeysFlowOpen, setIsKeysFlowOpen] = useState(
    location.pathname.startsWith('/portal/keysflow')
  );
  const [subscribedApps, setSubscribedApps] = useState<Set<string>>(new Set());

  const refreshSubscriptions = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_app_subscriptions')
      .select('app_id')
      .eq('user_id', user.id)
      .eq('status', 'active');
    setSubscribedApps(new Set((data ?? []).map((r: { app_id: string }) => r.app_id)));
  }, [user]);

  useEffect(() => { refreshSubscriptions(); }, [refreshSubscriptions]);

  // No more iframe routes — all app pages are native components
  const isFrameRoute = false;

  if (!user) return <Navigate to="/login" replace />;

  const initials = (user.user_metadata?.full_name as string | undefined)
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || user.email?.[0].toUpperCase() || '?';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const sidebarProps: SidebarContentProps = {
    initials,
    user,
    subscribedApps,
    isSettingsOpen,
    setIsSettingsOpen,
    isLegalFlowOpen,
    setIsLegalFlowOpen,
    isFinanceFlowOpen,
    setIsFinanceFlowOpen,
    isSocialFlowOpen,
    setIsSocialFlowOpen,
    isHRFlowOpen,
    setIsHRFlowOpen,
    isCourseFlowOpen,
    setIsCourseFlowOpen,
    isFoodTruckOpen,
    setIsFoodTruckOpen,
    isBuildFlowOpen,
    setIsBuildFlowOpen,
    isKeysFlowOpen,
    setIsKeysFlowOpen,
    isGasStaff,
    handleSignOut,
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-col bg-white border-r border-slate-200 fixed inset-y-0 left-0 z-30">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="relative w-64 bg-white flex flex-col shadow-xl">
            <div className="absolute top-3 right-3">
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <SidebarContent {...sidebarProps} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-20">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <img src="/logo.png" alt="GAS" className="h-16 w-auto" />
          <span className="font-semibold text-slate-900 text-sm">GAS Client Portal</span>
        </header>

        {/* Page content — strip padding when iframe fills the area */}
        <main className={`flex-1 ${isFrameRoute ? 'overflow-hidden p-4' : 'p-6 md:p-8'}`}>
          <Outlet context={{ refreshSubscriptions }} />
        </main>
      </div>

      {/* Support ChatBot */}
      <PortalChatBot />
    </div>
  );
}
