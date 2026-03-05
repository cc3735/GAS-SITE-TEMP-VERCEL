import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  RefreshCw,
  Loader2,
  AlertCircle,
  TrendingUp,
  Landmark,
  ArrowUpDown,
} from 'lucide-react';
import financeFlowApi, { type ZohoReport } from '../../../lib/financeFlowApi';

type ReportTab = 'profit-loss' | 'balance-sheet' | 'cash-flow';

const TABS: { id: ReportTab; label: string; icon: typeof TrendingUp }[] = [
  { id: 'profit-loss', label: 'Profit & Loss', icon: TrendingUp },
  { id: 'balance-sheet', label: 'Balance Sheet', icon: Landmark },
  { id: 'cash-flow', label: 'Cash Flow', icon: ArrowUpDown },
];

export default function FinanceFlowReports() {
  const [activeTab, setActiveTab] = useState<ReportTab>('profit-loss');
  const [report, setReport] = useState<ZohoReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Date range
  const now = new Date();
  const [fromDate, setFromDate] = useState(`${now.getFullYear()}-01-01`);
  const [toDate, setToDate] = useState(now.toISOString().split('T')[0]);

  // Check Zoho status on mount
  useEffect(() => {
    financeFlowApi.zohoBooks.getStatus().then((res) => {
      if (res.success && res.data) {
        setConfigured(res.data.configured);
        setLastSync(res.data.lastSync);
      } else {
        setConfigured(false);
      }
      setIsLoading(false);
    });
  }, []);

  // Load report when tab or dates change
  useEffect(() => {
    if (configured !== true) return;
    loadReport();
  }, [activeTab, configured]);

  const loadReport = async () => {
    setIsLoading(true);
    setError(null);
    let res;
    try {
      switch (activeTab) {
        case 'profit-loss':
          res = await financeFlowApi.zohoBooks.profitAndLoss(fromDate, toDate);
          break;
        case 'balance-sheet':
          res = await financeFlowApi.zohoBooks.balanceSheet(toDate);
          break;
        case 'cash-flow':
          res = await financeFlowApi.zohoBooks.cashFlow(fromDate, toDate);
          break;
      }
      if (res.success && res.data) {
        setReport(res.data);
      } else {
        setError(res.error?.message ?? 'Failed to load report');
      }
    } catch {
      setError('Failed to load report');
    }
    setIsLoading(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    const res = await financeFlowApi.zohoBooks.sync('full');
    setSyncing(false);
    if (res.success && res.data) {
      setLastSync(new Date().toISOString());
      await loadReport();
    } else {
      alert(res.error?.message ?? 'Sync failed');
    }
  };

  // Not configured state
  if (configured === false) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Link
            to="/portal/financeflow"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            FinanceFlow
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-medium text-slate-900">Financial Reports</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <BarChart3 className="mx-auto w-12 h-12 text-slate-300" />
          <h2 className="mt-4 text-lg font-semibold text-slate-900">Connect Zoho Books</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
            Financial reports are powered by Zoho Books. Connect your Zoho Books account from the
            MCP catalog to view Profit & Loss, Balance Sheet, and Cash Flow reports.
          </p>
          <Link
            to="/os/mcp"
            className="mt-6 inline-flex items-center gap-2 btn-primary"
          >
            Go to MCP Catalog
          </Link>
        </div>
      </div>
    );
  }

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
        <span className="text-sm font-medium text-slate-900">Financial Reports</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financial Reports</h1>
          <p className="mt-1 text-sm text-slate-500">
            Reports synced from Zoho Books.
            {lastSync && (
              <span className="ml-1 text-slate-400">
                Last synced {new Date(lastSync).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Sync with Zoho
        </button>
      </div>

      {/* Date range */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-500">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-500">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
        <button
          onClick={loadReport}
          className="px-4 py-1.5 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 transition-colors"
        >
          Apply
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-slate-200">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === id
                ? 'border-cyan-600 text-cyan-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Report content */}
      <div className="bg-white rounded-2xl border border-slate-200">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-600 mx-auto" />
            <p className="mt-3 text-sm text-slate-500">Loading report...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <AlertCircle className="mx-auto w-10 h-10 text-red-300" />
            <p className="mt-3 font-medium text-slate-700">Failed to Load Report</p>
            <p className="mt-1 text-sm text-slate-500">{error}</p>
            <button onClick={loadReport} className="mt-4 btn-primary">
              Retry
            </button>
          </div>
        ) : report && report.rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  {Object.keys(report.rows[0]).map((key) => (
                    <th
                      key={key}
                      className="px-4 py-3 text-left font-medium text-slate-600 whitespace-nowrap"
                    >
                      {key.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.rows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="px-4 py-3 text-slate-700 whitespace-nowrap">
                        {typeof val === 'number'
                          ? `$${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                          : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <BarChart3 className="mx-auto w-10 h-10 text-slate-300" />
            <p className="mt-3 font-medium text-slate-700">No Data Available</p>
            <p className="mt-1 text-sm text-slate-500">
              Try syncing with Zoho Books or adjusting the date range.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
