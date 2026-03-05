import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileSpreadsheet,
  Plus,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import financeFlowApi, {
  type Payable,
  type Receivable,
} from '../../../lib/financeFlowApi';

export default function FinanceFlowInvoicing() {
  const [payables, setPayables] = useState<Payable[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'receivable' | 'payable'>('receivable');

  useEffect(() => {
    Promise.all([
      financeFlowApi.accountsReceivable.list(),
      financeFlowApi.accountsPayable.list(),
    ])
      .then(([arRes, apRes]) => {
        if (arRes.success && arRes.data) setReceivables(arRes.data.receivables ?? []);
        if (apRes.success && apRes.data) setPayables(apRes.data.payables ?? []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const totalAR = receivables.reduce((s, r) => s + Number(r.amount) - Number(r.amount_paid), 0);
  const totalAP = payables.reduce((s, p) => s + Number(p.amount) - Number(p.amount_paid), 0);
  const overdueAP = payables.filter((p) => p.computedStatus === 'overdue').length;

  const fmt = (n: number) =>
    `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

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
        <span className="text-sm font-medium text-slate-900">Invoicing & Payments</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoicing & Payments</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage accounts receivable, accounts payable, and payment tracking.
          </p>
        </div>
        <button className="btn-primary inline-flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {activeTab === 'receivable' ? 'Create Invoice' : 'Add Bill'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            label: 'Outstanding Receivables',
            value: fmt(totalAR),
            icon: DollarSign,
            color: 'text-cyan-600',
          },
          {
            label: 'Outstanding Payables',
            value: fmt(totalAP),
            icon: Clock,
            color: 'text-amber-600',
          },
          {
            label: 'Overdue Bills',
            value: overdueAP,
            icon: AlertCircle,
            color: 'text-red-600',
          },
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

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('receivable')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'receivable'
              ? 'border-cyan-600 text-cyan-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Accounts Receivable ({receivables.length})
        </button>
        <button
          onClick={() => setActiveTab('payable')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'payable'
              ? 'border-cyan-600 text-cyan-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Accounts Payable ({payables.length})
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-200">
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-600 mx-auto" />
          </div>
        ) : activeTab === 'receivable' ? (
          receivables.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {receivables.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
                      <FileSpreadsheet className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {inv.client_name}
                        {inv.invoice_number && (
                          <span className="text-slate-400 ml-2 text-sm">
                            #{inv.invoice_number}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-slate-500">
                        Due {new Date(inv.due_date).toLocaleDateString()} &middot;{' '}
                        {inv.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-semibold text-slate-900">{fmt(Number(inv.amount))}</p>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <FileSpreadsheet className="mx-auto w-10 h-10 text-slate-300" />
              <p className="mt-3 font-medium text-slate-700">No Invoices Yet</p>
              <p className="mt-1 text-sm text-slate-500">
                Create your first invoice to start tracking payments.
              </p>
            </div>
          )
        ) : payables.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {payables.map((bill) => (
              <div
                key={bill.id}
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      bill.computedStatus === 'overdue' ? 'bg-red-50' : 'bg-amber-50'
                    }`}
                  >
                    {bill.computedStatus === 'overdue' ? (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{bill.vendor_name}</p>
                    <p className="text-sm text-slate-500">
                      Due {new Date(bill.due_date).toLocaleDateString()} &middot;{' '}
                      <span
                        className={
                          bill.computedStatus === 'overdue'
                            ? 'text-red-600 font-medium'
                            : ''
                        }
                      >
                        {bill.computedStatus}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{fmt(Number(bill.amount))}</p>
                    {bill.balanceDue > 0 && bill.balanceDue !== Number(bill.amount) && (
                      <p className="text-xs text-slate-500">
                        Balance: {fmt(bill.balanceDue)}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <CheckCircle2 className="mx-auto w-10 h-10 text-slate-300" />
            <p className="mt-3 font-medium text-slate-700">No Bills</p>
            <p className="mt-1 text-sm text-slate-500">
              You have no outstanding bills to pay.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
