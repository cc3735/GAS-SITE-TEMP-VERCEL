import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calculator,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  ArrowRight,
  Loader2,
  Send,
} from 'lucide-react';
import financeFlowApi, { type TaxReturn } from '../../../lib/financeFlowApi';

const STATUS_LABELS: Record<
  string,
  { label: string; color: string; bg: string; icon: typeof Clock }
> = {
  draft: { label: 'Draft', color: 'text-slate-700', bg: 'bg-slate-100', icon: FileText },
  in_progress: { label: 'In Progress', color: 'text-amber-700', bg: 'bg-amber-100', icon: Clock },
  ready_to_file: { label: 'Ready to File', color: 'text-blue-700', bg: 'bg-blue-100', icon: Send },
  filed: { label: 'Filed', color: 'text-purple-700', bg: 'bg-purple-100', icon: CheckCircle2 },
  accepted: { label: 'Accepted', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-100', icon: XCircle },
};

export default function FinanceFlowTax() {
  const [returns, setReturns] = useState<TaxReturn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    financeFlowApi.taxReturns
      .list()
      .then((res) => {
        if (res.success && res.data) {
          setReturns(Array.isArray(res.data) ? res.data : []);
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const handleNewReturn = async () => {
    setCreating(true);
    const res = await financeFlowApi.taxReturns.create({
      taxYear: new Date().getFullYear() - 1,
    });
    setCreating(false);
    if (res.success && res.data) {
      const listRes = await financeFlowApi.taxReturns.list();
      if (listRes.success && listRes.data) setReturns(Array.isArray(listRes.data) ? listRes.data : []);
    } else {
      alert(
        res.error?.message ??
          'Could not create tax return. Make sure the FinanceFlow backend is running.',
      );
    }
  };

  const total = returns.length;
  const filed = returns.filter((r) => r.status === 'filed' || r.status === 'accepted').length;
  const inProgress = returns.filter(
    (r) => r.status === 'draft' || r.status === 'in_progress',
  ).length;

  const fmt = (n?: number) =>
    n != null ? `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '\u2014';

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link
          to="/portal/financeflow"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          FinanceFlow
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-medium text-slate-900">Tax Filing</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tax Filing</h1>
          <p className="mt-1 text-sm text-slate-500">
            Prepare and file your federal and state tax returns with AI assistance.
          </p>
        </div>
        <button
          onClick={handleNewReturn}
          disabled={creating}
          className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
        >
          {creating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          New Tax Return
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Returns', value: total, icon: Calculator, color: 'text-green-600' },
          { label: 'In Progress', value: inProgress, icon: Clock, color: 'text-amber-600' },
          { label: 'Filed / Accepted', value: filed, icon: CheckCircle2, color: 'text-green-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{label}</p>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {isLoading ? '\u2014' : value}
            </p>
          </div>
        ))}
      </div>

      {/* Returns list */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="border-b border-slate-200 p-4">
          <h2 className="font-semibold text-slate-900">Tax Returns</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto" />
          </div>
        ) : returns.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {returns.map((ret) => {
              const badge = STATUS_LABELS[ret.status] ?? STATUS_LABELS.draft;
              const BadgeIcon = badge.icon;
              return (
                <div
                  key={ret.id}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                      <Calculator className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-900">
                          {ret.taxYear} Tax Return
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.bg} ${badge.color}`}
                        >
                          <BadgeIcon className="w-3 h-3" />
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">
                        {ret.filingStatus?.replace(/_/g, ' ') ?? 'Filing status TBD'}{' '}
                        &middot; Created{' '}
                        {new Date(ret.createdAt).toLocaleDateString()}
                      </p>
                      {ret.refundAmount != null && ret.refundAmount > 0 && (
                        <p className="text-sm text-green-600 font-medium mt-0.5">
                          Estimated refund: {fmt(ret.refundAmount)}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="flex-shrink-0 text-sm font-medium text-green-600">
                    {ret.status === 'draft' || ret.status === 'in_progress'
                      ? 'Continue'
                      : 'View'}
                    <ArrowRight className="inline w-4 h-4 ml-1" />
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Calculator className="mx-auto w-10 h-10 text-slate-300" />
            <p className="mt-3 font-medium text-slate-700">No Tax Returns Yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Start a new tax return for the current or prior year.
            </p>
            <button
              onClick={handleNewReturn}
              disabled={creating}
              className="mt-5 btn-primary inline-flex items-center gap-2 disabled:opacity-50"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Start Tax Return
            </button>
          </div>
        )}
      </div>

      {/* AI Tax Advisor Banner */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-gradient-to-r from-green-50 to-teal-50 p-6">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">AI Tax Advisor</h3>
            <p className="text-sm text-slate-500">
              Get instant answers to your tax questions
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          Ask questions like: "What deductions can I claim for my home office?" or "Should I itemize
          or take the standard deduction?"
        </p>
        <button className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors">
          Ask AI Tax Advisor
        </button>
      </div>
    </div>
  );
}
