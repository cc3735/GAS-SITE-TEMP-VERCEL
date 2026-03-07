import { useState, useEffect } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import { Plus, ExternalLink, Lock, ArrowRight, Trash2, CheckCircle2, Circle, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import AddAppsModal, { ALL_APPS, INDIVIDUAL_PRICE } from '../../components/AddAppsModal';
import { useComplianceChecklist, type ComplianceItem } from '../../hooks/useComplianceChecklist';

interface Subscription {
  id: string;
  app_id: string;
  plan: string;
  status: string;
}

const STATUS_CFG: Record<string, { label: string; icon: typeof Circle; color: string; bg: string }> = {
  pending: { label: 'Pending', icon: Circle, color: 'text-amber-600', bg: 'bg-amber-50' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
};

export default function MyApps() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { refreshSubscriptions } = useOutletContext<{ refreshSubscriptions: () => Promise<void> | void }>();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const { items: checklistItems, updateStatus } = useComplianceChecklist();

  const fetchSubs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_app_subscriptions')
      .select('id, app_id, plan, status')
      .eq('user_id', user.id);
    setSubscriptions(data || []);
    setIsLoading(false);
    await refreshSubscriptions();
  };

  const handleQuickSubscribe = async (app: typeof ALL_APPS[number]) => {
    if (!user) return;
    setSubscribing(app.id);
    await supabase.from('user_app_subscriptions').upsert(
      { user_id: user.id, app_id: app.id, plan: 'individual', status: 'active' },
      { onConflict: 'user_id,app_id' }
    );
    await fetchSubs();
    setSubscribing(null);
    if (app.internalRoute) {
      navigate(app.internalRoute);
    }
  };

  const handleRemove = async (sub: Subscription) => {
    if (!confirm(`Remove ${ALL_APPS.find((a) => a.id === sub.app_id)?.name ?? sub.app_id}? You can re-add it anytime.`)) return;
    setRemoving(sub.id);
    await supabase
      .from('user_app_subscriptions')
      .update({ status: 'cancelled' })
      .eq('id', sub.id);
    await fetchSubs();
    setRemoving(null);
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

      {/* Compliance Checklist */}
      {checklistItems.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-slate-900">Compliance Checklist</h2>
            <span className="text-xs font-medium text-slate-500">
              {checklistItems.filter((i) => i.status === 'completed').length}/{checklistItems.length} complete
            </span>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Items that need your attention to get your business fully set up.
          </p>
          <div className="space-y-2">
            {checklistItems.map((item) => {
              const cfg = STATUS_CFG[item.status] || STATUS_CFG.pending;
              const StatusIcon = cfg.icon;
              return (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                  <button
                    onClick={() =>
                      updateStatus(item.id, item.status === 'completed' ? 'pending' : 'completed')
                    }
                    className={`flex-shrink-0 ${cfg.color}`}
                    title={item.status === 'completed' ? 'Mark as pending' : 'Mark as completed'}
                  >
                    <StatusIcon className="w-5 h-5" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${item.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                    )}
                  </div>
                  {item.portal_link && item.status !== 'completed' && (
                    <Link
                      to={item.portal_link}
                      className="text-xs font-medium text-primary-600 hover:text-primary-700 flex-shrink-0"
                    >
                      Go &rarr;
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleRemove(sub)}
                        disabled={removing === sub.id}
                        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                        {removing === sub.id ? 'Removing…' : 'Remove'}
                      </button>
                      <Link
                        to={`/portal/overview#${app.id}`}
                        className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        Learn more
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-700">{INDIVIDUAL_PRICE}</span>
                      <button
                        onClick={() => handleQuickSubscribe(app)}
                        disabled={subscribing === app.id}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5" /> {subscribing === app.id ? 'Adding...' : 'Add'}
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
