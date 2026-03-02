import { useState, useEffect } from 'react';
import { Scale, BookOpen, Truck, Building2, Key, Plus } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import AddAppsModal from '../../../components/AddAppsModal';

const APP_META: Record<string, { name: string; icon: React.ElementType; color: string }> = {
  legalflow:  { name: 'LegalFlow',  icon: Scale,      color: 'text-blue-600 bg-blue-50' },
  courseflow: { name: 'CourseFlow', icon: BookOpen,    color: 'text-emerald-600 bg-emerald-50' },
  foodtruck:  { name: 'FoodTruck',  icon: Truck,       color: 'text-orange-600 bg-orange-50' },
  buildflow:  { name: 'BuildFlow',  icon: Building2,   color: 'text-yellow-600 bg-yellow-50' },
  keysflow:   { name: 'KeysFlow',   icon: Key,         color: 'text-purple-600 bg-purple-50' },
};

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-50 text-green-700',
  trial:     'bg-blue-50 text-blue-700',
  cancelled: 'bg-red-50 text-red-600',
};

interface Subscription {
  id: string;
  app_id: string;
  plan: string;
  status: string;
  subscribed_at: string;
  expires_at: string | null;
}

export default function Billing() {
  const { user } = useAuth();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchSubs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_app_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('subscribed_at', { ascending: false });
    setSubs(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchSubs(); }, [user]);

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this subscription? You will lose access at the end of the billing period.')) return;
    setCancelling(id);
    await supabase
      .from('user_app_subscriptions')
      .update({ status: 'cancelled' })
      .eq('id', id);
    await fetchSubs();
    setCancelling(null);
  };

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-slate-900">Active Subscriptions</h2>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <Plus className="w-4 h-4" /> Add More Apps
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : subs.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-slate-500 mb-4">You don't have any active subscriptions yet.</p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Browse Apps
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {subs.map((sub) => {
              const meta = APP_META[sub.app_id] || { name: sub.app_id, icon: Scale, color: 'text-slate-600 bg-slate-100' };
              const Icon = meta.icon;
              const [iconColor, bgColor] = meta.color.split(' ');

              return (
                <div key={sub.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className={`w-10 h-10 ${bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900 text-sm">{meta.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[sub.status] || 'bg-slate-100 text-slate-500'}`}>
                        {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Plan: <span className="font-medium">{sub.plan}</span>
                      {' · '}
                      Since {new Date(sub.subscribed_at).toLocaleDateString()}
                      {sub.expires_at && ` · Expires ${new Date(sub.expires_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  {sub.status === 'active' && (
                    <button
                      onClick={() => handleCancel(sub.id)}
                      disabled={cancelling === sub.id}
                      className="text-xs text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      {cancelling === sub.id ? 'Cancelling…' : 'Cancel'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
        <h3 className="font-medium text-slate-700 text-sm mb-1">Billing Questions?</h3>
        <p className="text-xs text-slate-500">
          Contact us at{' '}
          <a href="mailto:contact@gasweb.info" className="text-primary-600 hover:underline">
            contact@gasweb.info
          </a>{' '}
          for invoices, refunds, or plan changes.
        </p>
      </section>

      {showModal && (
        <AddAppsModal
          onClose={() => setShowModal(false)}
          onSubscribed={fetchSubs}
        />
      )}
    </div>
  );
}
