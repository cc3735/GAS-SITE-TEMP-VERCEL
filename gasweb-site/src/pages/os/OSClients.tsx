import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ChevronRight, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ClientRow {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  subscription_tier: string | null;
  subscription_status: string | null;
  created_at: string;
  app_count?: number;
  app_ids?: string[];
}

const APP_LABELS: Record<string, string> = {
  legalflow: 'LegalFlow',
  courseflow: 'CourseFlow',
  foodtruck: 'FoodTruck',
  buildflow: 'BuildFlow',
  keysflow: 'KeysFlow',
};

const APP_OPTIONS = Object.entries(APP_LABELS).map(([id, label]) => ({ id, label }));

export default function OSClients() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const filterApp = searchParams.get('app') ?? '';

  useEffect(() => {
    async function load() {
      setIsLoading(true);

      // Fetch all profiles
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, phone, subscription_tier, subscription_status, created_at')
        .order('created_at', { ascending: false });

      // Fetch all active subscriptions
      const { data: subs } = await supabase
        .from('user_app_subscriptions')
        .select('user_id, app_id')
        .eq('status', 'active');

      // Map subscriptions to clients
      const subMap: Record<string, string[]> = {};
      (subs ?? []).forEach((s: { user_id: string; app_id: string }) => {
        if (!subMap[s.user_id]) subMap[s.user_id] = [];
        subMap[s.user_id].push(s.app_id);
      });

      const rows: ClientRow[] = (profiles ?? []).map((p: ClientRow) => ({
        ...p,
        app_ids: subMap[p.id] ?? [],
        app_count: (subMap[p.id] ?? []).length,
      }));

      setClients(rows);
      setIsLoading(false);
    }
    load();
  }, []);

  const filtered = clients.filter((c) => {
    const matchesSearch =
      !search ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.full_name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesApp = !filterApp || (c.app_ids ?? []).includes(filterApp);
    return matchesSearch && matchesApp;
  });

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-gray-400 mt-1 text-sm">
            {isLoading ? '…' : `${filtered.length} client${filtered.length !== 1 ? 's' : ''}`}
            {filterApp ? ` with ${APP_LABELS[filterApp] ?? filterApp}` : ''}
          </p>
        </div>
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
          onChange={(e) => {
            const v = e.target.value;
            if (v) setSearchParams({ app: v });
            else setSearchParams({});
          }}
          className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All apps</option>
          {APP_OPTIONS.map(({ id, label }) => (
            <option key={id} value={id}>{label}</option>
          ))}
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
            <Users className="mx-auto w-10 h-10 text-gray-700 mb-3" />
            <p className="text-gray-500 text-sm">No clients found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-medium">Client</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-medium hidden md:table-cell">Apps</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-medium hidden lg:table-cell">Tier</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-medium hidden lg:table-cell">Joined</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map((client) => (
                <tr key={client.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-white font-medium truncate max-w-[200px]">
                      {client.full_name || client.email}
                    </p>
                    {client.full_name && (
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">{client.email}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(client.app_ids ?? []).length === 0 ? (
                        <span className="text-gray-600 text-xs">None</span>
                      ) : (
                        (client.app_ids ?? []).map((appId) => (
                          <span
                            key={appId}
                            className="inline-block px-2 py-0.5 rounded-full text-xs bg-primary-900/50 text-primary-300 border border-primary-700/30"
                          >
                            {APP_LABELS[appId] ?? appId}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <span className="capitalize text-gray-400 text-xs">
                      {client.subscription_tier ?? 'free'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell text-gray-500 text-xs">
                    {new Date(client.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      to={`/os/clients/${client.id}`}
                      className="inline-flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300"
                    >
                      View <ChevronRight className="w-3 h-3" />
                    </Link>
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
