import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, CheckCircle2, LayoutGrid, TrendingUp, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AppCount {
  app_id: string;
  count: number;
}

interface RecentClient {
  id: string;
  email: string;
  full_name: string | null;
  subscription_tier: string | null;
  created_at: string;
}

const APP_LABELS: Record<string, string> = {
  legalflow: 'LegalFlow',
  courseflow: 'CourseFlow',
  foodtruck: 'FoodTruck',
  buildflow: 'BuildFlow',
  keysflow: 'KeysFlow',
};

export default function OSDashboard() {
  const [totalClients, setTotalClients] = useState<number | null>(null);
  const [activeSubscriptions, setActiveSubscriptions] = useState<number | null>(null);
  const [appCounts, setAppCounts] = useState<AppCount[]>([]);
  const [recentClients, setRecentClients] = useState<RecentClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [profilesRes, subsRes, recentRes] = await Promise.all([
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
        supabase
          .from('user_app_subscriptions')
          .select('app_id')
          .eq('status', 'active'),
        supabase
          .from('user_profiles')
          .select('id, email, full_name, subscription_tier, created_at')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      setTotalClients(profilesRes.count ?? 0);

      // Count per app
      const counts: Record<string, number> = {};
      (subsRes.data ?? []).forEach((row: { app_id: string }) => {
        counts[row.app_id] = (counts[row.app_id] ?? 0) + 1;
      });
      setActiveSubscriptions(subsRes.data?.length ?? 0);
      setAppCounts(
        Object.entries(counts).map(([app_id, count]) => ({ app_id, count }))
          .sort((a, b) => b.count - a.count)
      );

      setRecentClients((recentRes.data ?? []) as RecentClient[]);
      setIsLoading(false);
    }
    load();
  }, []);

  const stats = [
    { label: 'Total Clients', value: totalClients, icon: Users, color: 'text-blue-400' },
    { label: 'Active Subscriptions', value: activeSubscriptions, icon: CheckCircle2, color: 'text-green-400' },
    { label: 'Apps Offered', value: Object.keys(APP_LABELS).length, icon: LayoutGrid, color: 'text-purple-400' },
    { label: 'Avg Apps / Client', value: totalClients ? ((activeSubscriptions ?? 0) / totalClients).toFixed(1) : '—', icon: TrendingUp, color: 'text-yellow-400' },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1 text-sm">Overview of all GAS clients and services.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-3xl font-bold text-white">
              {isLoading ? <span className="text-gray-600">—</span> : value ?? '—'}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* App breakdown */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-white">Subscribers by App</h2>
            <Link to="/os/apps" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 rounded bg-gray-800 animate-pulse" />
              ))}
            </div>
          ) : appCounts.length === 0 ? (
            <p className="text-sm text-gray-500">No active subscriptions yet.</p>
          ) : (
            <div className="space-y-3">
              {appCounts.map(({ app_id, count }) => {
                const max = appCounts[0].count;
                return (
                  <div key={app_id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-300">{APP_LABELS[app_id] ?? app_id}</span>
                      <span className="text-gray-400 font-medium">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-800">
                      <div
                        className="h-1.5 rounded-full bg-primary-500 transition-all"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent signups */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-white">Recent Signups</h2>
            <Link to="/os/clients" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 rounded bg-gray-800 animate-pulse" />
              ))}
            </div>
          ) : recentClients.length === 0 ? (
            <p className="text-sm text-gray-500">No clients yet.</p>
          ) : (
            <div className="divide-y divide-gray-800">
              {recentClients.map((client) => (
                <Link
                  key={client.id}
                  to={`/os/clients/${client.id}`}
                  className="flex items-center justify-between py-2.5 hover:opacity-80 group"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate group-hover:text-primary-400 transition-colors">
                      {client.full_name || client.email}
                    </p>
                    {client.full_name && (
                      <p className="text-xs text-gray-500 truncate">{client.email}</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 flex-shrink-0 ml-4">
                    {new Date(client.created_at).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
