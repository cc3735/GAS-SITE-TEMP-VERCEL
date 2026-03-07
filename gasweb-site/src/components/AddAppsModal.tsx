import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, BookOpen, Truck, Building2, Key, X, Sparkles, Receipt, Share2, UserCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const INDIVIDUAL_PRICE = '$25/mo';
export const BUNDLE_PRICE = '$150/mo';

export interface AppDef {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  lightColor: string;
  textColor: string;
  dotColor: string;
  url: string;
  internalRoute?: string;
}

export const ALL_APPS: AppDef[] = [
  {
    id: 'legalflow',
    name: 'LegalFlow',
    description: 'AI-powered legal documents, trademark filing, and business compliance.',
    icon: Scale,
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    dotColor: 'bg-blue-600',
    url: 'http://localhost:5173',
    internalRoute: '/portal/legalflow',
  },
  {
    id: 'financeflow',
    name: 'FinanceFlow',
    description: 'AI-powered bookkeeping, tax filing, invoicing, and inventory management.',
    icon: Receipt,
    lightColor: 'bg-teal-50',
    textColor: 'text-teal-600',
    dotColor: 'bg-teal-600',
    url: 'http://localhost:5173',
    internalRoute: '/portal/financeflow',
  },
  {
    id: 'socialflow',
    name: 'SocialFlow',
    description: 'Unified messaging, marketing campaigns, and social media management.',
    icon: Share2,
    lightColor: 'bg-pink-50',
    textColor: 'text-pink-600',
    dotColor: 'bg-pink-600',
    url: '#',
    internalRoute: '/portal/socialflow',
  },
  {
    id: 'hrflow',
    name: 'HRFlow',
    description: 'HR management, payroll processing, and employee onboarding.',
    icon: UserCheck,
    lightColor: 'bg-rose-50',
    textColor: 'text-rose-600',
    dotColor: 'bg-rose-600',
    url: '#',
    internalRoute: '/portal/hrflow',
  },
  {
    id: 'courseflow',
    name: 'CourseFlow',
    description: 'Create, manage, and sell online courses to your audience.',
    icon: BookOpen,
    lightColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    dotColor: 'bg-emerald-600',
    url: '#',
    internalRoute: '/portal/courseflow',
  },
  {
    id: 'foodtruck',
    name: 'FoodTruck',
    description: 'Ordering, scheduling, and operations for food truck businesses.',
    icon: Truck,
    lightColor: 'bg-orange-50',
    textColor: 'text-orange-600',
    dotColor: 'bg-orange-600',
    url: '#',
    internalRoute: '/portal/foodtruck',
  },
  {
    id: 'buildflow',
    name: 'BuildFlow',
    description: 'Project management and client portal for construction businesses.',
    icon: Building2,
    lightColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    dotColor: 'bg-yellow-700',
    url: '#',
    internalRoute: '/portal/buildflow',
  },
  {
    id: 'keysflow',
    name: 'KeysFlow',
    description: 'Real estate automation — listings, leads, and document workflows.',
    icon: Key,
    lightColor: 'bg-purple-50',
    textColor: 'text-purple-600',
    dotColor: 'bg-purple-600',
    url: '#',
    internalRoute: '/portal/keysflow',
  },
];

interface ActiveSub {
  app_id: string;
  status: string;
}

interface Props {
  onClose: () => void;
  onSubscribed?: () => void;
}

export default function AddAppsModal({ onClose, onSubscribed }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSubs, setActiveSubs] = useState<ActiveSub[]>([]);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const fetchActiveSubs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_app_subscriptions')
      .select('app_id, status')
      .eq('user_id', user.id)
      .eq('status', 'active');
    setActiveSubs(data || []);
  };

  useEffect(() => { fetchActiveSubs(); }, [user]);

  const isSubscribed = (appId: string) =>
    activeSubs.some((s) => s.app_id === appId);

  const unsubscribedApps = ALL_APPS.filter((a) => !isSubscribed(a.id));
  const allSubscribed = unsubscribedApps.length === 0;

  const handleSubscribeIndividual = async (app: AppDef) => {
    if (!user) return;
    setSubscribing(app.id);
    await supabase.from('user_app_subscriptions').upsert(
      { user_id: user.id, app_id: app.id, plan: 'individual', status: 'active' },
      { onConflict: 'user_id,app_id' }
    );
    await fetchActiveSubs();
    await onSubscribed?.();
    setSubscribing(null);
    onClose();
    if (app.internalRoute) {
      navigate(app.internalRoute);
    }
  };

  const handleSubscribeBundle = async () => {
    if (!user) return;
    setSubscribing('bundle');
    const rows = unsubscribedApps.map((app) => ({
      user_id: user.id,
      app_id: app.id,
      plan: 'bundle',
      status: 'active',
    }));
    if (rows.length > 0) {
      await supabase.from('user_app_subscriptions').upsert(rows, { onConflict: 'user_id,app_id' });
    }
    await fetchActiveSubs();
    onSubscribed?.();
    setSubscribing(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Add More Apps</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          {/* Bundle card */}
          {!allSubscribed && (
            <div className="rounded-2xl border-2 border-primary-200 bg-primary-50/40 p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">All Apps Bundle</p>
                    <p className="text-xs text-primary-700 font-medium">
                      Save ${ALL_APPS.length * 25 - 150}/month vs individual
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xl font-bold text-slate-900">{BUNDLE_PRICE}</p>
                  <p className="text-xs text-slate-400">per month</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {ALL_APPS.map((app) => {
                  const Icon = app.icon;
                  const alreadyHas = isSubscribed(app.id);
                  return (
                    <span
                      key={app.id}
                      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                        alreadyHas
                          ? 'bg-green-50 text-green-700'
                          : 'bg-white border border-primary-200 text-primary-700'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {app.name}
                      {alreadyHas && ' ✓'}
                    </span>
                  );
                })}
              </div>

              <button
                onClick={handleSubscribeBundle}
                disabled={subscribing === 'bundle'}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {subscribing === 'bundle' ? 'Activating…' : 'Get Bundle →'}
              </button>
            </div>
          )}

          {/* Divider */}
          {unsubscribedApps.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-slate-200" />
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                or add apps individually
              </span>
              <div className="flex-1 border-t border-slate-200" />
            </div>
          )}

          {/* À la carte list */}
          {unsubscribedApps.length > 0 ? (
            <div className="space-y-3">
              {unsubscribedApps.map((app) => {
                const Icon = app.icon;
                return (
                  <div
                    key={app.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-primary-200 hover:bg-primary-50/20 transition-colors"
                  >
                    <div className={`w-10 h-10 ${app.lightColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${app.textColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm">{app.name}</p>
                      <p className="text-xs text-slate-500 truncate">{app.description}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm font-semibold text-slate-700">{INDIVIDUAL_PRICE}</span>
                      <button
                        onClick={() => handleSubscribeIndividual(app)}
                        disabled={subscribing === app.id}
                        className="btn-primary text-sm disabled:opacity-60 min-w-[52px]"
                      >
                        {subscribing === app.id ? '…' : 'Add'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-4">
              You're subscribed to all available apps!
            </p>
          )}
        </div>

        <div className="px-6 pb-5 pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-400 text-center">
            Questions? Contact us at{' '}
            <a href="mailto:contact@gasweb.info" className="text-primary-600 hover:underline">
              contact@gasweb.info
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
