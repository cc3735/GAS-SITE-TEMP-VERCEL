import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, CreditCard } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SubscriptionRow {
  id: string;
  user_id: string;
  app_id: string;
  status: string;
  created_at: string;
  email: string;
  full_name: string | null;
}

const APP_LABELS: Record<string, string> = {
  legalflow: 'LegalFlow',
  financeflow: 'FinanceFlow',
  socialflow: 'SocialFlow',
  hrflow: 'HRFlow',
  courseflow: 'CourseFlow',
  foodtruck: 'FoodTruck',
  buildflow: 'BuildFlow',
  keysflow: 'KeysFlow',
};

const APP_OPTIONS = Object.entries(APP_LABELS).map(([id, label]) => ({ id, label }));

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-900/50 text-green-300 border-green-700/30',
  paused: 'bg-yellow-900/50 text-yellow-300 border-yellow-700/30',
  cancelled: 'bg-red-900/50 text-red-300 border-red-700/30',
};

export default function OSSubscriptions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const filterApp = searchParams.get('app') ?? '';
  const filterStatus = searchParams.get('status') ?? '';

  useEffect(() => {
    async function load() {
      setIsLoading(true);

      const { data: subs } = await supabase
        .from('user_app_subscriptions')
        .select('id, user_id, app_id, status, created_at')
        .order('created_at', { ascending: false });

      const userIds = [...new Set((subs ?? []).map((s: { user_id: string }) => s.user_id))];

      let profiles: { id: string; email: string; full_name: string | null }[] = [];
      if (userIds.length > 0) {
        const { data } = await supabase
          .from('user_profiles')
          .select('id, email, full_name')
          .in('id', userIds);
        profiles = (data ?? []) as typeof profiles;
      }

      const profileMap = new Map(profiles.map((p) => [p.id, p]));

      const rows: SubscriptionRow[] = (subs ?? []).map((s: { id: string; user_id: string; app_id: string; status: string; created_at: string }) => ({
        ...s,
        email: profileMap.get(s.user_id)?.email ?? 'Unknown',
        full_name: profileMap.get(s.user_id)?.full_name ?? null,
      }));

      setSubscriptions(rows);
      setIsLoading(false);
    }
    load();
  }, []);

  const filtered = subscriptions.filter((s) => {
    const matchesSearch =
      !search ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.full_name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesApp = !filterApp || s.app_id === filterApp;
    const matchesStatus = !filterStatus || s.status === filterStatus;
    return matchesSearch && matchesApp && matchesStatus;
  });

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Active Subscriptions</h1>
        <p className="text-gray-400 mt-1 text-sm">
          {isLoading ? '…' : `${filtered.length} subscription${filtered.length !== 1 ? 's' : ''}`}
          {filterApp ? ` for ${APP_LABELS[filterApp] ?? filterApp}` : ''}
          {filterStatus ? ` (${filterStatus})` : ''}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterApp}
          onChange={(e) => updateParams('app', e.target.value)}
          className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All apps</option>
          {APP_OPTIONS.map(({ id, label }) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => updateParams('status', e.target.value)}
          className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 rounded bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <CreditCard className="mx-auto w-10 h-10 text-gray-700 mb-3" />
            <p className="text-gray-500 text-sm">No subscriptions found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-medium">Client</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-medium">App</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-medium hidden md:table-cell">Status</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-medium hidden lg:table-cell">Subscribed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-white font-medium truncate max-w-[200px]">
                      {sub.full_name || sub.email}
                    </p>
                    {sub.full_name && (
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">{sub.email}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-primary-900/50 text-primary-300 border border-primary-700/30">
                      {APP_LABELS[sub.app_id] ?? sub.app_id}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs border capitalize ${STATUS_COLORS[sub.status] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell text-gray-500 text-xs">
                    {new Date(sub.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
