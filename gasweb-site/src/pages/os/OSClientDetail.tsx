import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Building2,
  AppWindow,
  CheckCircle2,
  XCircle,
  User,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ClientProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  subscription_tier: string | null;
  subscription_status: string | null;
  created_at: string;
  is_gas_staff: boolean;
}

interface AppSub {
  app_id: string;
  plan: string | null;
  status: string;
  created_at: string;
}

interface Business {
  id: string;
  name: string;
  industry: string | null;
  state_of_registration: string | null;
  ein: string | null;
}

const APP_LABELS: Record<string, string> = {
  legalflow: 'LegalFlow',
  courseflow: 'CourseFlow',
  foodtruck: 'FoodTruck',
  buildflow: 'BuildFlow',
  keysflow: 'KeysFlow',
};

export default function OSClientDetail() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [apps, setApps] = useState<AppSub[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const [profileRes, appsRes, bizRes] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('id, email, full_name, phone, subscription_tier, subscription_status, created_at, is_gas_staff')
          .eq('id', id)
          .single(),
        supabase
          .from('user_app_subscriptions')
          .select('app_id, plan, status, created_at')
          .eq('user_id', id)
          .order('created_at', { ascending: false }),
        supabase
          .from('user_businesses')
          .select('id, name, industry, state_of_registration, ein')
          .eq('user_id', id)
          .order('created_at', { ascending: false }),
      ]);

      if (profileRes.error || !profileRes.data) {
        setNotFound(true);
      } else {
        setProfile(profileRes.data as ClientProfile);
      }
      setApps((appsRes.data ?? []) as AppSub[]);
      setBusinesses((bizRes.data ?? []) as Business[]);
      setIsLoading(false);
    }
    load();
  }, [id]);

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-8 w-48 bg-gray-800 rounded animate-pulse" />
        <div className="h-40 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
        <div className="h-32 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="p-8 text-center">
        <User className="mx-auto w-12 h-12 text-gray-700 mb-3" />
        <p className="text-gray-400">Client not found.</p>
        <Link to="/os/crm?tab=clients" className="mt-4 inline-flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300">
          <ArrowLeft className="w-3 h-3" /> Back to Clients
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <Link to="/os/crm?tab=clients" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Clients
      </Link>

      {/* Profile card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-600/20 flex items-center justify-center flex-shrink-0">
            <User className="w-6 h-6 text-primary-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white">
              {profile.full_name || profile.email}
            </h1>
            {profile.full_name && (
              <p className="text-sm text-gray-400">{profile.email}</p>
            )}
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                profile.subscription_status === 'active'
                  ? 'bg-green-900/40 text-green-400 border border-green-700/30'
                  : 'bg-gray-800 text-gray-400 border border-gray-700'
              }`}>
                {profile.subscription_status === 'active'
                  ? <CheckCircle2 className="w-3 h-3" />
                  : <XCircle className="w-3 h-3" />}
                {profile.subscription_status ?? 'inactive'}
              </span>
              <span className="text-xs text-gray-500 capitalize">{profile.subscription_tier ?? 'free'} tier</span>
              {profile.is_gas_staff && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-900/40 text-yellow-400 border border-yellow-700/30">
                  GAS Staff
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 border-t border-gray-800">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="text-gray-300 truncate">{profile.email}</span>
          </div>
          {profile.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="text-gray-300">{profile.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="text-gray-400">
              Joined {new Date(profile.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Apps */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <AppWindow className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-white">Subscribed Apps</h2>
        </div>
        {apps.length === 0 ? (
          <p className="text-sm text-gray-500">No app subscriptions.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {apps.map((app) => (
              <div key={app.app_id} className="flex items-center justify-between bg-gray-800/60 border border-gray-700/50 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{APP_LABELS[app.app_id] ?? app.app_id}</p>
                  {app.plan && <p className="text-xs text-gray-500 capitalize">{app.plan} plan</p>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  app.status === 'active'
                    ? 'bg-green-900/40 text-green-400'
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Businesses */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-white">Registered Businesses</h2>
        </div>
        {businesses.length === 0 ? (
          <p className="text-sm text-gray-500">No businesses registered.</p>
        ) : (
          <div className="space-y-3">
            {businesses.map((biz) => (
              <div key={biz.id} className="flex items-center justify-between bg-gray-800/60 border border-gray-700/50 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{biz.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {biz.industry && <span className="text-xs text-gray-500">{biz.industry}</span>}
                    {biz.state_of_registration && (
                      <span className="text-xs text-gray-600">{biz.state_of_registration}</span>
                    )}
                  </div>
                </div>
                {biz.ein && (
                  <span className="text-xs text-gray-500 font-mono">EIN: {biz.ein}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
