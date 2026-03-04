import { Link } from 'react-router-dom';
import {
  MessageCircle,
  Megaphone,
  ArrowRight,
} from 'lucide-react';

const FEATURES = [
  {
    slug: 'messaging',
    label: 'Unified Messaging',
    description: 'Send and receive messages across email, SMS, and social channels from one inbox.',
    icon: MessageCircle,
    color: 'bg-pink-50',
    textColor: 'text-pink-600',
    dotColor: 'bg-pink-600',
  },
  {
    slug: 'marketing',
    label: 'Marketing & Social',
    description: 'Create campaigns, schedule posts, and track engagement across all your social platforms.',
    icon: Megaphone,
    color: 'bg-violet-50',
    textColor: 'text-violet-600',
    dotColor: 'bg-violet-600',
  },
] as const;

export default function SocialFlowHub() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">SocialFlow</h1>
        <p className="mt-1 text-sm text-slate-500">
          Unified messaging and marketing tools for your business. Select a section to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {FEATURES.map(({ slug, label, description, icon: Icon, color, textColor }) => (
          <Link
            key={slug}
            to={`/portal/socialflow/${slug}`}
            className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${textColor}`} />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-slate-900">{label}</h2>
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            </div>
            <div className={`flex items-center gap-1.5 text-sm font-medium ${textColor}`}>
              Open <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
