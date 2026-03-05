import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  ArrowRight,
  Loader2,
  Landmark,
  RefreshCw,
} from 'lucide-react';
import financeFlowApi, {
  type Transaction,
  type LinkedAccount,
} from '../../../lib/financeFlowApi';

export default function FinanceFlowBookkeeping() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [summary, setSummary] = useState<{ income: number; expenses: number; net: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    Promise.all([
      financeFlowApi.bookkeeping.listTransactions(),
      financeFlowApi.bookkeeping.listAccounts(),
      financeFlowApi.bookkeeping.summary(),
    ])
      .then(([txRes, accRes, sumRes]) => {
        if (txRes.success && txRes.data) setTransactions(txRes.data.transactions ?? []);
        if (accRes.success && accRes.data) setAccounts(Array.isArray(accRes.data) ? accRes.data : []);
        if (sumRes.success && sumRes.data) setSummary(sumRes.data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const filteredTx = transactions.filter(
    (t) =>
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.category ?? '').toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const fmt = (n?: number) =>
    n != null ? `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00';

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
        <span className="text-sm font-medium text-slate-900">Bookkeeping</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bookkeeping & Accounting</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track income, expenses, and manage your bank connections.
          </p>
        </div>
        <button className="btn-primary inline-flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Transaction
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            label: 'Income',
            value: fmt(summary?.income),
            icon: TrendingUp,
            color: 'text-green-600',
          },
          {
            label: 'Expenses',
            value: fmt(summary?.expenses),
            icon: TrendingDown,
            color: 'text-red-600',
          },
          {
            label: 'Net',
            value: fmt(summary?.net),
            icon: DollarSign,
            color: 'text-teal-600',
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transactions */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200">
            <div className="border-b border-slate-200 p-4 flex items-center gap-4">
              <h2 className="font-semibold text-slate-900">Transactions</h2>
              <div className="flex-1 max-w-sm ml-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-4 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
              </div>
            ) : filteredTx.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {filteredTx.slice(0, 20).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          tx.type === 'income'
                            ? 'bg-green-50'
                            : 'bg-red-50'
                        }`}
                      >
                        {tx.type === 'income' ? (
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{tx.description}</p>
                        <p className="text-sm text-slate-500">
                          {tx.category ?? 'Uncategorized'} &middot;{' '}
                          {new Date(tx.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`font-semibold ${
                        tx.type === 'income'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {fmt(tx.amount)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <DollarSign className="mx-auto w-10 h-10 text-slate-300" />
                <p className="mt-3 font-medium text-slate-700">No Transactions Yet</p>
                <p className="mt-1 text-sm text-slate-500">
                  Link a bank account or add transactions manually to get started.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Linked Accounts</h2>

          {isLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600 mx-auto" />
            </div>
          ) : accounts.length > 0 ? (
            <div className="space-y-3">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                      <Landmark className="w-5 h-5 text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {acc.institutionName}
                      </p>
                      <p className="text-xs text-slate-500">
                        Last synced: {new Date(acc.lastSync).toLocaleDateString()}
                      </p>
                    </div>
                    <button className="text-teal-600 hover:text-teal-700">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-6 text-center">
              <Landmark className="mx-auto w-8 h-8 text-slate-300" />
              <p className="mt-2 text-sm font-medium text-slate-700">
                No bank accounts linked
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Connect your bank via Plaid to auto-import transactions.
              </p>
              <button className="mt-3 btn-primary text-sm inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Link Account
              </button>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1">
            <Link
              to="/portal/financeflow/invoicing"
              className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              AP / AR
              <ArrowRight className="w-4 h-4 ml-auto text-slate-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
