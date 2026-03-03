import { Link } from 'react-router-dom';
import {
  DollarSign,
  FileText,
  Award,
  Calculator,
  Briefcase,
  ArrowRight,
} from 'lucide-react';

const FEATURES = [
  {
    slug: 'bookkeeping',
    label: 'Bookkeeping & Accounting',
    description: 'Track income, expenses, AP/AR, bank transactions, chart of accounts, and journal entries.',
    icon: DollarSign,
    color: 'bg-blue-50',
    textColor: 'text-blue-600',
    dotColor: 'bg-blue-600',
  },
  {
    slug: 'legal',
    label: 'Legal Documents',
    description: 'Draft contracts, trusts, wills, and legal agreements with AI.',
    icon: FileText,
    color: 'bg-purple-50',
    textColor: 'text-purple-600',
    dotColor: 'bg-purple-600',
  },
  {
    slug: 'trademark',
    label: 'Trademark',
    description: 'Search existing marks and file trademark applications.',
    icon: Award,
    color: 'bg-orange-50',
    textColor: 'text-orange-600',
    dotColor: 'bg-orange-600',
  },
  {
    slug: 'tax',
    label: 'Tax Filing',
    description: 'Prepare and file federal and state tax returns.',
    icon: Calculator,
    color: 'bg-green-50',
    textColor: 'text-green-600',
    dotColor: 'bg-green-600',
  },
  {
    slug: 'businesses',
    label: 'Businesses',
    description: 'Manage your registered business entities and filings.',
    icon: Briefcase,
    color: 'bg-slate-100',
    textColor: 'text-slate-600',
    dotColor: 'bg-slate-600',
  },
] as const;

export default function LegalFlowHub() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">LegalFlow</h1>
        <p className="mt-1 text-sm text-slate-500">
          AI-powered legal, tax, and financial tools for your business. Select a section to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map(({ slug, label, description, icon: Icon, color, textColor }) => (
          <Link
            key={slug}
            to={`/portal/legalflow/${slug}`}
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
