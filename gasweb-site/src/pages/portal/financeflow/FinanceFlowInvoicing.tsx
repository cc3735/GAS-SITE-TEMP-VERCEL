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
  Send,
  CreditCard,
  X,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import financeFlowApi, {
  type Payable,
  type Receivable,
} from '../../../lib/financeFlowApi';

// ── Modal wrapper ────────────────────────────────────────────────────
function Modal({ open, onClose, title, children }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function FinanceFlowInvoicing() {
  const [payables, setPayables] = useState<Payable[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'receivable' | 'payable'>('receivable');

  // Create modals
  const [showCreateAR, setShowCreateAR] = useState(false);
  const [showCreateAP, setShowCreateAP] = useState(false);
  const [creating, setCreating] = useState(false);

  // Payment modals
  const [paymentTarget, setPaymentTarget] = useState<{ type: 'ap' | 'ar'; id: string; name: string; balance: number } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Stripe
  const [sendingInvoice, setSendingInvoice] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Zoho sync
  const [zohoConfigured, setZohoConfigured] = useState(false);
  const [zohoSyncing, setZohoSyncing] = useState(false);
  const [zohoLastSync, setZohoLastSync] = useState<string | null>(null);

  // Create AR form
  const [arForm, setArForm] = useState({ clientName: '', amount: '', dueDate: '', invoiceNumber: '', description: '' });
  // Create AP form
  const [apForm, setApForm] = useState({ vendorName: '', amount: '', dueDate: '', invoiceNumber: '', description: '' });

  const reload = async () => {
    const [arRes, apRes] = await Promise.all([
      financeFlowApi.accountsReceivable.list(),
      financeFlowApi.accountsPayable.list(),
    ]);
    if (arRes.success && arRes.data) setReceivables(arRes.data.receivables ?? []);
    if (apRes.success && apRes.data) setPayables(apRes.data.payables ?? []);
  };

  useEffect(() => {
    reload().finally(() => setIsLoading(false));
    financeFlowApi.zohoBooks.getStatus().then((res) => {
      if (res.success && res.data) {
        setZohoConfigured(res.data.configured);
        setZohoLastSync(res.data.lastSync);
      }
    });
  }, []);

  const totalAR = receivables.reduce((s, r) => s + Number(r.amount) - Number(r.amount_paid), 0);
  const totalAP = payables.reduce((s, p) => s + Number(p.amount) - Number(p.amount_paid), 0);
  const overdueAP = payables.filter((p) => p.computedStatus === 'overdue').length;

  const fmt = (n: number) =>
    `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  // ── Handlers ─────────────────────────────────────────────────────
  const handleCreateAR = async () => {
    if (!arForm.clientName || !arForm.amount) return;
    setCreating(true);
    const res = await financeFlowApi.accountsReceivable.create({
      clientName: arForm.clientName,
      amount: Number(arForm.amount),
      dueDate: arForm.dueDate || undefined,
      invoiceNumber: arForm.invoiceNumber || undefined,
      description: arForm.description || undefined,
    });
    setCreating(false);
    if (res.success) {
      setShowCreateAR(false);
      setArForm({ clientName: '', amount: '', dueDate: '', invoiceNumber: '', description: '' });
      await reload();
    } else {
      alert(res.error?.message ?? 'Failed to create invoice.');
    }
  };

  const handleCreateAP = async () => {
    if (!apForm.vendorName || !apForm.amount) return;
    setCreating(true);
    const res = await financeFlowApi.accountsPayable.create({
      vendorName: apForm.vendorName,
      amount: Number(apForm.amount),
      dueDate: apForm.dueDate || undefined,
      invoiceNumber: apForm.invoiceNumber || undefined,
      description: apForm.description || undefined,
    });
    setCreating(false);
    if (res.success) {
      setShowCreateAP(false);
      setApForm({ vendorName: '', amount: '', dueDate: '', invoiceNumber: '', description: '' });
      await reload();
    } else {
      alert(res.error?.message ?? 'Failed to add bill.');
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentTarget || !paymentAmount) return;
    setSubmittingPayment(true);
    const amount = Number(paymentAmount);
    let res;
    if (paymentTarget.type === 'ap') {
      res = await financeFlowApi.accountsPayable.markPaid(paymentTarget.id, { amount, notes: paymentNotes || undefined });
    } else {
      res = await financeFlowApi.accountsReceivable.recordPayment(paymentTarget.id, { amount, notes: paymentNotes || undefined });
    }
    setSubmittingPayment(false);
    if (res.success) {
      setPaymentTarget(null);
      setPaymentAmount('');
      setPaymentNotes('');
      await reload();
    } else {
      alert(res.error?.message ?? 'Failed to record payment.');
    }
  };

  const handleZohoSync = async () => {
    setZohoSyncing(true);
    const res = await financeFlowApi.zohoBooks.sync('full');
    setZohoSyncing(false);
    if (res.success) {
      setZohoLastSync(new Date().toISOString());
      await reload();
    } else {
      alert(res.error?.message ?? 'Zoho sync failed.');
    }
  };

  const handleSendInvoice = async (arId: string) => {
    setSendingInvoice(arId);
    const res = await financeFlowApi.stripe.createPaymentLink(arId);
    setSendingInvoice(null);
    if (res.success && res.data?.paymentLinkUrl) {
      await navigator.clipboard.writeText(res.data.paymentLinkUrl);
      setCopiedLink(arId);
      setTimeout(() => setCopiedLink(null), 3000);
      await reload();
    } else {
      alert(res.error?.message ?? 'Failed to generate payment link. Is Stripe configured?');
    }
  };

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
        <button
          onClick={() => activeTab === 'receivable' ? setShowCreateAR(true) : setShowCreateAP(true)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {activeTab === 'receivable' ? 'Create Invoice' : 'Add Bill'}
        </button>
      </div>

      {/* Zoho Sync Bar */}
      {zohoConfigured && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 mb-6">
          <p className="text-sm text-slate-600">
            Zoho Books connected
            {zohoLastSync && (
              <span className="text-slate-400 ml-1">
                &middot; Last synced {new Date(zohoLastSync).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </span>
            )}
          </p>
          <button
            onClick={handleZohoSync}
            disabled={zohoSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            {zohoSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Sync
          </button>
        </div>
      )}

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
              {receivables.map((inv) => {
                const balance = Number(inv.amount) - Number(inv.amount_paid);
                const isPaid = inv.status === 'paid';
                return (
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
                          {inv.due_date ? `Due ${new Date(inv.due_date).toLocaleDateString()}` : 'No due date'} &middot;{' '}
                          <span className={isPaid ? 'text-green-600 font-medium' : ''}>{inv.status}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {!isPaid && (
                        <>
                          <button
                            onClick={() => handleSendInvoice(inv.id)}
                            disabled={sendingInvoice === inv.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-50 text-cyan-700 hover:bg-cyan-100 transition-colors disabled:opacity-50"
                            title="Generate payment link & copy to clipboard"
                          >
                            {sendingInvoice === inv.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : copiedLink === inv.id ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : inv.payment_link_url ? (
                              <Copy className="w-3.5 h-3.5" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                            {copiedLink === inv.id ? 'Copied!' : inv.payment_link_url ? 'Copy Link' : 'Send Invoice'}
                          </button>
                          <button
                            onClick={() => setPaymentTarget({ type: 'ar', id: inv.id, name: inv.client_name, balance })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Record Payment
                          </button>
                        </>
                      )}
                      <div className="text-right min-w-[80px]">
                        <p className="font-semibold text-slate-900">{fmt(Number(inv.amount))}</p>
                        {balance > 0 && balance !== Number(inv.amount) && (
                          <p className="text-xs text-slate-500">Due: {fmt(balance)}</p>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <FileSpreadsheet className="mx-auto w-10 h-10 text-slate-300" />
              <p className="mt-3 font-medium text-slate-700">No Invoices Yet</p>
              <p className="mt-1 text-sm text-slate-500">
                Create your first invoice to start tracking payments.
              </p>
              <button
                onClick={() => setShowCreateAR(true)}
                className="mt-4 btn-primary inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Invoice
              </button>
            </div>
          )
        ) : payables.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {payables.map((bill) => {
              const isPaid = bill.status === 'paid';
              return (
                <div
                  key={bill.id}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        bill.computedStatus === 'overdue' ? 'bg-red-50' : isPaid ? 'bg-green-50' : 'bg-amber-50'
                      }`}
                    >
                      {isPaid ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : bill.computedStatus === 'overdue' ? (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{bill.vendor_name}</p>
                      <p className="text-sm text-slate-500">
                        {bill.due_date ? `Due ${new Date(bill.due_date).toLocaleDateString()}` : 'No due date'} &middot;{' '}
                        <span
                          className={
                            bill.computedStatus === 'overdue'
                              ? 'text-red-600 font-medium'
                              : isPaid ? 'text-green-600 font-medium' : ''
                          }
                        >
                          {bill.computedStatus}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {!isPaid && (
                      <button
                        onClick={() => setPaymentTarget({ type: 'ap', id: bill.id, name: bill.vendor_name, balance: bill.balanceDue })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Mark Paid
                      </button>
                    )}
                    <div className="text-right min-w-[80px]">
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
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <CheckCircle2 className="mx-auto w-10 h-10 text-slate-300" />
            <p className="mt-3 font-medium text-slate-700">No Bills</p>
            <p className="mt-1 text-sm text-slate-500">
              You have no outstanding bills to pay.
            </p>
            <button
              onClick={() => setShowCreateAP(true)}
              className="mt-4 btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Bill
            </button>
          </div>
        )}
      </div>

      {/* ── Create Invoice Modal ──────────────────────────────────────── */}
      <Modal open={showCreateAR} onClose={() => setShowCreateAR(false)} title="Create Invoice">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Client Name *</label>
            <input
              type="text"
              value={arForm.clientName}
              onChange={(e) => setArForm((f) => ({ ...f, clientName: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount *</label>
              <input
                type="number"
                step="0.01"
                value={arForm.amount}
                onChange={(e) => setArForm((f) => ({ ...f, amount: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                value={arForm.dueDate}
                onChange={(e) => setArForm((f) => ({ ...f, dueDate: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Invoice Number</label>
            <input
              type="text"
              value={arForm.invoiceNumber}
              onChange={(e) => setArForm((f) => ({ ...f, invoiceNumber: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <input
              type="text"
              value={arForm.description}
              onChange={(e) => setArForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowCreateAR(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">
              Cancel
            </button>
            <button
              onClick={handleCreateAR}
              disabled={creating || !arForm.clientName || !arForm.amount}
              className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
            >
              {creating && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Invoice
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Add Bill Modal ────────────────────────────────────────────── */}
      <Modal open={showCreateAP} onClose={() => setShowCreateAP(false)} title="Add Bill">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Vendor Name *</label>
            <input
              type="text"
              value={apForm.vendorName}
              onChange={(e) => setApForm((f) => ({ ...f, vendorName: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount *</label>
              <input
                type="number"
                step="0.01"
                value={apForm.amount}
                onChange={(e) => setApForm((f) => ({ ...f, amount: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                value={apForm.dueDate}
                onChange={(e) => setApForm((f) => ({ ...f, dueDate: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Invoice Number</label>
            <input
              type="text"
              value={apForm.invoiceNumber}
              onChange={(e) => setApForm((f) => ({ ...f, invoiceNumber: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <input
              type="text"
              value={apForm.description}
              onChange={(e) => setApForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowCreateAP(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">
              Cancel
            </button>
            <button
              onClick={handleCreateAP}
              disabled={creating || !apForm.vendorName || !apForm.amount}
              className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
            >
              {creating && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Bill
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Record Payment Modal ──────────────────────────────────────── */}
      <Modal
        open={!!paymentTarget}
        onClose={() => { setPaymentTarget(null); setPaymentAmount(''); setPaymentNotes(''); }}
        title={paymentTarget?.type === 'ap' ? `Pay ${paymentTarget?.name}` : `Record Payment from ${paymentTarget?.name}`}
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            Balance due: <span className="font-semibold text-slate-900">{fmt(paymentTarget?.balance ?? 0)}</span>
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Payment Amount *</label>
            <input
              type="number"
              step="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder={paymentTarget?.balance?.toFixed(2)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <input
              type="text"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => { setPaymentTarget(null); setPaymentAmount(''); setPaymentNotes(''); }}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              onClick={handleRecordPayment}
              disabled={submittingPayment || !paymentAmount || Number(paymentAmount) <= 0}
              className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
            >
              {submittingPayment && <Loader2 className="w-4 h-4 animate-spin" />}
              {paymentTarget?.type === 'ap' ? 'Record Payment' : 'Record Payment'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
