import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppWindow, Users, CheckCircle2, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AppEntry {
  id: string;
  slug: string;
  display_name: string;
  description: string | null;
  is_active: boolean;
  pricing: { base_price?: number; billing_period?: string } | null;
  activeCount: number;
  totalCount: number;
}

// Fallback catalog in case business_apps table is empty
const FALLBACK_APPS = [
  { slug: 'legalflow', display_name: 'LegalFlow', description: 'AI-powered legal automation, contracts, tax filing, and trademark services.' },
  { slug: 'courseflow', display_name: 'CourseFlow', description: 'Create and sell online courses with a fully managed LMS.' },
  { slug: 'foodtruck', display_name: 'FoodTruck', description: 'Food truck ordering, operations, and location tracking.' },
  { slug: 'buildflow', display_name: 'BuildFlow', description: 'Construction project management and scheduling.' },
  { slug: 'keysflow', display_name: 'KeysFlow', description: 'Real estate automation and marketing tools.' },
];

export default function OSApps() {
  const [apps, setApps] = useState<AppEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [appsRes, subsRes] = await Promise.all([
        supabase.from('business_apps').select('id, slug, display_name, description, is_active, pricing'),
        supabase.from('user_app_subscriptions').select('app_id, status'),
      ]);

      // Build sub counts
      const activeCount: Record<string, number> = {};
      const totalCount: Record<string, number> = {};
      (subsRes.data ?? []).forEach((s: { app_id: string; status: string }) => {
        totalCount[s.app_id] = (totalCount[s.app_id] ?? 0) + 1;
        if (s.status === 'active') activeCount[s.app_id] = (activeCount[s.app_id] ?? 0) + 1;
      });

      let catalog = appsRes.data ?? [];

      // Fall back to static list if DB has no apps
      if (catalog.length === 0) {
        catalog = FALLBACK_APPS.map((a, i) => ({ ...a, id: String(i), is_active: true, pricing: null }));
      }

      setApps(
        catalog.map((a: { id: string; slug: string; display_name: string; description: string | null; is_active: boolean; pricing: { base_price?: number; billing_period?: string } | null }) => ({
          ...a,
          activeCount: activeCount[a.slug] ?? 0,
          totalCount: totalCount[a.slug] ?? 0,
        }))
      );
      setIsLoading(false);
    }
    load();
  }, []);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Apps</h1>
        <p className="text-gray-400 mt-1 text-sm">All products and services offered to clients.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-44 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {apps.map((app) => (
            <div key={app.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                    <AppWindow className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{app.display_name}</p>
                    {app.pricing?.base_price != null && (
                      <p className="text-xs text-gray-500">
                        ${app.pricing.base_price}/{app.pricing.billing_period ?? 'mo'}
                      </p>
                    )}
                  </div>
                </div>
                <span className={`flex-shrink-0 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                  app.is_active
                    ? 'bg-green-900/40 text-green-400 border border-green-700/30'
                    : 'bg-gray-800 text-gray-500 border border-gray-700'
                }`}>
                  <CheckCircle2 className="w-3 h-3" />
                  {app.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Description */}
              {app.description && (
                <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">{app.description}</p>
              )}

              {/* Stats */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                <div className="flex items-center gap-1.5 text-sm">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-white font-semibold">{app.activeCount}</span>
                  <span className="text-gray-500">active</span>
                  {app.totalCount > app.activeCount && (
                    <span className="text-gray-600">/ {app.totalCount} total</span>
                  )}
                </div>
                <Link
                  to={`/os/crm?tab=clients&app=${app.slug}`}
                  className="inline-flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300"
                >
                  View clients <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
