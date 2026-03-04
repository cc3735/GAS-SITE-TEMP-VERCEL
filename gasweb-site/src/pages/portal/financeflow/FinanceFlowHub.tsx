import { Link } from 'react-router-dom';
import {
  DollarSign,
  Calculator,
  FileSpreadsheet,
  Package,
  ArrowRight,
} from 'lucide-react';

const FEATURES = [
  {
    slug: 'bookkeeping',
    label: 'Bookkeeping & Accounting',
    description: 'Track income, expenses, AP/AR, bank transactions, chart of accounts, and journal entries.',
    icon: DollarSign,
    color: 'bg-teal-50',
    textColor: 'text-teal-600',
    dotColor: 'bg-teal-600',
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
    slug: 'invoicing',
    label: 'Invoicing & Payments',
    description: 'Create professional invoices, accept payments, and track accounts receivable.',
    icon: FileSpreadsheet,
    color: 'bg-cyan-50',
    textColor: 'text-cyan-600',
    dotColor: 'bg-cyan-600',
  },
  {
    slug: 'inventory',
    label: 'Inventory Management',
    description: 'Track stock levels, manage purchase orders, and sync with your POS system.',
    icon: Package,
    color: 'bg-amber-50',
    textColor: 'text-amber-600',
    dotColor: 'bg-amber-600',
  },
] as const;

export default function FinanceFlowHub() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">FinanceFlow</h1>
        <p className="mt-1 text-sm text-slate-500">
          AI-powered bookkeeping, tax, and financial tools for your business. Select a section to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map(({ slug, label, description, icon: Icon, color, textColor }) => (
          <Link
            key={slug}
            to={`/portal/financeflow/${slug}`}
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
