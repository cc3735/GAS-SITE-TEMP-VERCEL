import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Plus, ExternalLink, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import AddAppsModal, { ALL_APPS, INDIVIDUAL_PRICE } from '../../components/AddAppsModal';

interface Subscription {
  app_id: string;
  plan: string;
  status: string;
}

export default function MyApps() {
  const { user } = useAuth();
  const { refreshSubscriptions } = useOutletContext<{ refreshSubscriptions: () => void }>();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchSubs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_app_subscriptions')
      .select('app_id, plan, status')
      .eq('user_id', user.id);
    setSubscriptions(data || []);
    setIsLoading(false);
    refreshSubscriptions();
  };

  useEffect(() => { fetchSubs(); }, [user]);

  const getSubscription = (appId: string) =>
    subscriptions.find((s) => s.app_id === appId && s.status === 'active');

  const allSubscribed = ALL_APPS.every((a) => !!getSubscription(a.id));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Apps</h1>
          <p className="mt-1 text-slate-500 text-sm">Launch and manage your active applications.</p>
        </div>
        {!allSubscribed && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add More Apps
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse h-44" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ALL_APPS.map((app) => {
            const sub = getSubscription(app.id);
            const Icon = app.icon;
            const isActive = !!sub;

            return (
              <div
                key={app.id}
                className={`bg-white rounded-2xl border p-6 flex flex-col gap-4 transition-all duration-200 ${
                  isActive
                    ? 'border-slate-200 hover:shadow-md hover:-translate-y-0.5'
                    : 'border-slate-200 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 ${app.lightColor} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${app.textColor}`} />
                  </div>
                  {isActive ? (
                    <span className="text-xs font-medium bg-green-50 text-green-700 px-2 py-1 rounded-full capitalize">
                      Active · {sub.plan}
                    </span>
                  ) : (
                    <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2 py-1 rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Not subscribed
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  <h2 className="font-semibold text-slate-900">{app.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{app.description}</p>
                </div>

                {isActive ? (
                  <div className="flex items-center justify-between">
                    {app.internalRoute ? (
                      <Link
                        to={app.internalRoute}
                        className={`inline-flex items-center gap-1.5 text-sm font-medium ${app.textColor} hover:underline`}
                      >
                        Open app <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1.5 text-sm font-medium ${app.textColor} hover:underline`}
                      >
                        Open app <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <Link
                      to={`/portal/overview#${app.id}`}
                      className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      Learn more
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-700">{INDIVIDUAL_PRICE}</span>
                      <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                    </div>
                    <Link
                      to={`/portal/overview#${app.id}`}
                      className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      Learn more
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <AddAppsModal
          onClose={() => setShowModal(false)}
          onSubscribed={fetchSubs}
        />
      )}
    </div>
  );
}
