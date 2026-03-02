import { useState, useEffect } from 'react';
import { CheckCircle2, ExternalLink, Plus, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import AddAppsModal, { ALL_APPS, INDIVIDUAL_PRICE, BUNDLE_PRICE } from '../../components/AddAppsModal';

interface AppDetail {
  id: string;
  tagline: string;
  longDescription: string;
  features: string[];
  useCases: string[];
}

const APP_DETAILS: AppDetail[] = [
  {
    id: 'legalflow',
    tagline: 'AI-powered legal automation for small businesses',
    longDescription:
      'LegalFlow brings enterprise-grade legal tools to small businesses. Draft contracts, manage compliance deadlines, and handle tax filings with AI assistance — without needing a full-time attorney on retainer. Spend less time on paperwork and more time running your business.',
    features: [
      'AI contract & document drafting',
      'Template library (NDAs, MSAs, SoWs)',
      'Tax filing assistance',
      'Compliance deadline tracking',
      'E-signature workflows',
      'Legal deadline reminders',
    ],
    useCases: [
      'Draft and send NDAs or service agreements in minutes',
      'Track regulatory filing deadlines automatically',
      'Manage client contracts from creation to signature',
      'Stay compliant with local and federal requirements',
    ],
  },
  {
    id: 'courseflow',
    tagline: 'Build and sell online courses without the tech headache',
    longDescription:
      "CourseFlow gives you everything you need to create, host, and sell online courses to your audience. From video hosting and student progress tracking to payment processing and certificate generation — it's your all-in-one course platform, ready to launch in hours.",
    features: [
      'Drag-and-drop course builder',
      'Video hosting & streaming',
      'Student enrollment management',
      'Payment processing (one-time & subscription)',
      'Progress tracking & quizzes',
      'Branded certificates of completion',
    ],
    useCases: [
      'Package your expertise into a monetisable online course',
      'Sell subscriptions or one-time course access',
      'Track student progress and engagement',
      'Build a scalable recurring revenue stream',
    ],
  },
  {
    id: 'foodtruck',
    tagline: 'Run your food truck like a pro',
    longDescription:
      'FoodTruck simplifies every aspect of your mobile food business — from online ordering and location scheduling to inventory tracking and customer loyalty. Whether you run one truck or a fleet, FoodTruck gives you the operational tools to grow without the chaos.',
    features: [
      'Online pre-ordering system',
      'Schedule & route planning',
      'Inventory & ingredient tracking',
      'Customer loyalty program',
      'Sales analytics dashboard',
      'Social media location updates',
    ],
    useCases: [
      'Accept pre-orders and reduce wait times',
      'Plan efficient daily routes across multiple stops',
      'Track ingredient inventory to avoid overbuying',
      'Build a loyal customer base with rewards',
    ],
  },
  {
    id: 'buildflow',
    tagline: 'Keep every construction project on time and on budget',
    longDescription:
      'BuildFlow is the project management platform built for contractors and builders. Manage jobs, clients, subcontractors, and documents all in one place — so nothing falls through the cracks. From the first estimate to the final walkthrough, BuildFlow keeps everyone aligned.',
    features: [
      'Project timeline & milestone management',
      'Client portal with approval workflows',
      'Subcontractor coordination & scheduling',
      'Permit & document tracking',
      'Budget and change order tracking',
      'Photo documentation by job phase',
    ],
    useCases: [
      'Manage multiple job sites from a single dashboard',
      'Share real-time progress updates with clients',
      'Track change orders and keep budgets accurate',
      'Keep all permits, docs, and photos organised by project',
    ],
  },
  {
    id: 'keysflow',
    tagline: 'Close more deals with less paperwork',
    longDescription:
      'KeysFlow automates the repetitive parts of real estate — from listing management and lead follow-up to document collection and closing checklists. Whether you\'re an independent agent or managing a team, KeysFlow frees you up to focus on what matters: building relationships and closing deals.',
    features: [
      'Listing management & MLS sync',
      'Automated lead follow-up sequences',
      'Document workflow & e-signature collection',
      'Closing checklist & task automation',
      'CRM with pipeline visibility',
      'Client communication portal',
    ],
    useCases: [
      'Never miss a follow-up with automated lead nurturing',
      'Manage listings and leads in one unified workspace',
      'Speed up document collection with automated requests',
      'Track every deal from first contact to closed',
    ],
  },
];

export default function Overview() {
  const { user } = useAuth();
  const [activeSubs, setActiveSubs] = useState<{ app_id: string }[]>([]);
  const [showModal, setShowModal] = useState(false);

  const fetchSubs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_app_subscriptions')
      .select('app_id')
      .eq('user_id', user.id)
      .eq('status', 'active');
    setActiveSubs(data || []);
  };

  useEffect(() => { fetchSubs(); }, [user]);

  const isSubscribed = (appId: string) => activeSubs.some((s) => s.app_id === appId);
  const allSubscribed = ALL_APPS.every((a) => isSubscribed(a.id));

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-slate-900">GAS App Suite</h1>
        <p className="mt-2 text-slate-500 text-sm leading-relaxed">
          Every app in the GAS suite is purpose-built for a specific industry. Subscribe to the
          apps that fit your business — or get the full bundle and unlock everything at once.
        </p>

        {/* Bundle callout */}
        {!allSubscribed && (
          <div className="mt-5 flex items-center justify-between gap-4 bg-primary-50 border border-primary-200 rounded-2xl px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">All Apps Bundle</p>
                <p className="text-xs text-primary-700">
                  All {ALL_APPS.length} apps for {BUNDLE_PRICE} — save ${ALL_APPS.length * 25 - 100}/month
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary text-sm whitespace-nowrap flex-shrink-0"
            >
              Get Bundle →
            </button>
          </div>
        )}
      </div>

      {/* App sections */}
      <div className="space-y-10">
        {ALL_APPS.map((app) => {
          const detail = APP_DETAILS.find((d) => d.id === app.id);
          if (!detail) return null;
          const Icon = app.icon;
          const subscribed = isSubscribed(app.id);

          return (
            <section
              key={app.id}
              id={app.id}
              className={`bg-white rounded-2xl border p-6 scroll-mt-8 ${
                subscribed ? 'border-slate-200' : 'border-slate-200'
              }`}
            >
              {/* App header */}
              <div className="flex items-start gap-4 mb-5">
                <div className={`w-12 h-12 ${app.lightColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-6 h-6 ${app.textColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-slate-900">{app.name}</h2>
                    {subscribed && (
                      <span className="text-xs font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className={`text-sm font-medium mt-0.5 ${app.textColor}`}>{detail.tagline}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  {subscribed ? (
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 text-sm font-medium ${app.textColor} hover:underline`}
                    >
                      Open app <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{INDIVIDUAL_PRICE}</p>
                      <button
                        onClick={() => setShowModal(true)}
                        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                      >
                        <Plus className="w-3 h-3" /> Add this app
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                {detail.longDescription}
              </p>

              {/* Features + Use Cases */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    Key Features
                  </h3>
                  <ul className="space-y-2">
                    {detail.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-600">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    What You Can Do
                  </h3>
                  <ul className="space-y-2">
                    {detail.useCases.map((u) => (
                      <li key={u} className="flex items-start gap-2">
                        <div className={`w-4 h-4 ${app.lightColor} rounded flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${app.dotColor}`} />
                        </div>
                        <span className="text-sm text-slate-600">{u}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </section>
          );
        })}
      </div>

      {/* Bottom CTA */}
      {!allSubscribed && (
        <div className="mt-10 text-center">
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Apps to Your Portal
          </button>
          <p className="mt-2 text-xs text-slate-400">
            Bundle all {ALL_APPS.length} apps for just {BUNDLE_PRICE}/month
          </p>
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
