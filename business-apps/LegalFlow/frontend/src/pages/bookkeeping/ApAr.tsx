import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apArApi, type Payable, type Receivable } from '@/lib/api';
import {
  ArrowLeft,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

type ApStatus = Payable['status'];
type ArStatus = Receivable['status'];

const AP_STATUS: Record<string, { label: string; color: string }> = {
  open: { label: 'Open', color: 'bg-blue-100 text-blue-700' },
  partial: { label: 'Partial', color: 'bg-yellow-100 text-yellow-700' },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-700' },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700' },
  voided: { label: 'Voided', color: 'bg-slate-100 text-slate-500' },
};

const AR_STATUS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-600' },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700' },
  partial: { label: 'Partial', color: 'bg-yellow-100 text-yellow-700' },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-700' },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700' },
  written_off: { label: 'Written Off', color: 'bg-slate-100 text-slate-500' },
};

function StatusBadge({ status, map }: { status: string; map: typeof AP_STATUS }) {
  const cfg = map[status] ?? { label: status, color: 'bg-muted text-muted-foreground' };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function daysUntil(date: string | undefined) {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

// ──────────────────────────────────────────────────────────────────────────────
// Add Payable Form
// ──────────────────────────────────────────────────────────────────────────────

function AddPayableForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    vendorName: '', vendorEmail: '', invoiceNumber: '',
    description: '', amount: '', dueDate: '',
    issueDate: new Date().toISOString().split('T')[0],
    category: '', taxDeductible: false, notes: '',
  });

  const mutation = useMutation({
    mutationFn: () =>
      apArApi.createPayable({
        vendor_name: form.vendorName,
        vendor_email: form.vendorEmail || undefined,
        invoice_number: form.invoiceNumber || undefined,
        description: form.description || undefined,
        amount: Number(form.amount),
        amount_paid: 0,
        due_date: form.dueDate || undefined,
        issue_date: form.issueDate,
        status: 'open',
        category: form.category || undefined,
        tax_deductible: form.taxDeductible,
        notes: form.notes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payables'] });
      onClose();
    },
  });

  const set = (k: string, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
      className="rounded-xl border bg-card p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Add Payable</h3>
        <button type="button" onClick={onClose}><X className="h-4 w-4" /></button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1">Vendor Name *</label>
          <input required value={form.vendorName} onChange={(e) => set('vendorName', e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Vendor Email</label>
          <input type="email" value={form.vendorEmail} onChange={(e) => set('vendorEmail', e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Invoice # </label>
          <input value={form.invoiceNumber} onChange={(e) => set('invoiceNumber', e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Amount *</label>
          <input required type="number" min="0.01" step="0.01" value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Issue Date</label>
          <input type="date" value={form.issueDate} onChange={(e) => set('issueDate', e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Due Date</label>
          <input type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Category</label>
          <input value={form.category} onChange={(e) => set('category', e.target.value)}
            placeholder="e.g. Rent, Utilities"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        </div>
        <div className="flex items-center gap-2 pt-5">
          <input type="checkbox" id="td" checked={form.taxDeductible}
            onChange={(e) => set('taxDeductible', e.target.checked)}
            className="h-4 w-4 rounded" />
          <label htmlFor="td" className="text-sm cursor-pointer">Tax Deductible</label>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Notes</label>
        <textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose}
          className="rounded-lg border border-input px-4 py-2 text-sm hover:bg-muted">Cancel</button>
        <button type="submit" disabled={mutation.isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
          {mutation.isPending ? 'Saving…' : 'Add Payable'}
        </button>
      </div>
    </form>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Add Receivable Form
// ──────────────────────────────────────────────────────────────────────────────

function AddReceivableForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    clientName: '', clientEmail: '', invoiceNumber: '',
    description: '', amount: '', dueDate: '',
    issueDate: new Date().toISOString().split('T')[0],
    category: '', notes: '',
  });

  const mutation = useMutation({
    mutationFn: () =>
      apArApi.createReceivable({
        client_name: form.clientName,
        client_email: form.clientEmail || undefined,
        invoice_number: form.invoiceNumber || undefined,
        description: form.description || undefined,
        amount: Number(form.amount),
        amount_received: 0,
        due_date: form.dueDate || undefined,
        issue_date: form.issueDate,
        status: 'draft',
        category: form.category || undefined,
        notes: form.notes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['receivables'] });
      onClose();
    },
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
      className="rounded-xl border bg-card p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Add Invoice / Receivable</h3>
        <button type="button" onClick={onClose}><X className="h-4 w-4" /></button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1">Client Name *</label>
          <input required value={form.clientName} onChange={(e) => set('clientName', e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Client Email</label>
          <input type="email" value={form.clientEmail} onChange={(e) => set('clientEmail', e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Invoice #</label>
          <input value={form.invoiceNumber} onChange={(e) => set('invoiceNumber', e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Amount *</label>
          <input required type="number" min="0.01" step="0.01" value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Issue Date</label>
          <input type="date" value={form.issueDate} onChange={(e) => set('issueDate', e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Due Date</label>
          <input type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium mb-1">Description</label>
          <input value={form.description} onChange={(e) => set('description', e.target.value)}
            placeholder="Services rendered, products sold, etc."
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose}
          className="rounded-lg border border-input px-4 py-2 text-sm hover:bg-muted">Cancel</button>
        <button type="submit" disabled={mutation.isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
          {mutation.isPending ? 'Saving…' : 'Add Invoice'}
        </button>
      </div>
    </form>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Payables Tab
// ──────────────────────────────────────────────────────────────────────────────

function PayablesTab() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['payables'],
    queryFn: () => apArApi.listPayables(),
  });

  const payables: Payable[] = data?.data?.payables ?? [];

  const markPaid = useMutation({
    mutationFn: (id: string) =>
      apArApi.updatePayable(id, {
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0],
        amount_paid: payables.find((p) => p.id === id)?.amount ?? 0,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payables'] }),
  });

  const totalOutstanding = payables
    .filter((p) => p.status !== 'paid' && p.status !== 'voided')
    .reduce((s, p) => s + (p.balanceDue ?? Number(p.amount) - Number(p.amount_paid)), 0);
  const overdue = payables.filter((p) => (p.computedStatus || p.status) === 'overdue');
  const dueThisWeek = payables.filter((p) => {
    const d = daysUntil(p.due_date);
    return d !== null && d >= 0 && d <= 7 && p.status !== 'paid';
  });

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Outstanding', value: fmt(totalOutstanding), icon: DollarSign, color: 'text-primary' },
          { label: 'Overdue', value: `${overdue.length} bills`, icon: AlertCircle, color: 'text-red-500' },
          { label: 'Due This Week', value: `${dueThisWeek.length} bills`, icon: Calendar, color: 'text-yellow-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Add button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Bill
        </button>
      </div>

      {showAdd && <AddPayableForm onClose={() => setShowAdd(false)} />}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl border bg-muted" />)}
        </div>
      ) : payables.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <TrendingDown className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-muted-foreground">No bills recorded yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {payables.map((p) => {
            const status = (p.computedStatus || p.status) as ApStatus;
            const days = daysUntil(p.due_date);
            const isExpanded = expanded === p.id;
            return (
              <div key={p.id} className="rounded-xl border bg-card overflow-hidden">
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : p.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{p.vendor_name}</p>
                      <StatusBadge status={status} map={AP_STATUS} />
                      {p.invoice_number && (
                        <span className="text-xs text-muted-foreground">#{p.invoice_number}</span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                      {p.due_date && (
                        <span className={days !== null && days < 0 ? 'text-red-500 font-medium' : ''}>
                          Due {new Date(p.due_date).toLocaleDateString()}
                          {days !== null && (
                            <span className="ml-1">
                              ({days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d`})
                            </span>
                          )}
                        </span>
                      )}
                      {p.category && <span>{p.category}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-foreground">{fmt(Number(p.amount))}</p>
                    {p.amount_paid > 0 && (
                      <p className="text-xs text-muted-foreground">{fmt(Number(p.amount_paid))} paid</p>
                    )}
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>

                {isExpanded && (
                  <div className="border-t px-4 py-3 bg-muted/30 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-muted-foreground space-y-1">
                      {p.description && <p>{p.description}</p>}
                      {p.vendor_email && <p>📧 {p.vendor_email}</p>}
                      {p.tax_deductible && <p className="text-green-600 font-medium">✓ Tax deductible</p>}
                      {p.notes && <p className="italic">{p.notes}</p>}
                    </div>
                    {p.status !== 'paid' && p.status !== 'voided' && (
                      <button
                        onClick={() => markPaid.mutate(p.id)}
                        disabled={markPaid.isPending}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-60"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Mark Paid
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Receivables Tab
// ──────────────────────────────────────────────────────────────────────────────

function ReceivablesTab() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['receivables'],
    queryFn: () => apArApi.listReceivables(),
  });

  const receivables: Receivable[] = data?.data?.receivables ?? [];

  const markPaid = useMutation({
    mutationFn: (id: string) =>
      apArApi.updateReceivable(id, {
        status: 'paid',
        received_date: new Date().toISOString().split('T')[0],
        amount_received: receivables.find((r) => r.id === id)?.amount ?? 0,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['receivables'] }),
  });

  const markSent = useMutation({
    mutationFn: (id: string) => apArApi.updateReceivable(id, { status: 'sent' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['receivables'] }),
  });

  const totalOwed = receivables
    .filter((r) => !['paid', 'written_off'].includes(r.status))
    .reduce((s, r) => s + (r.balanceOwed ?? Number(r.amount) - Number(r.amount_received)), 0);
  const overdue = receivables.filter((r) => (r.computedStatus || r.status) === 'overdue');

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Owed', value: fmt(totalOwed), icon: DollarSign, color: 'text-green-600' },
          { label: 'Overdue', value: `${overdue.length} invoices`, icon: AlertCircle, color: 'text-red-500' },
          { label: 'Invoices', value: receivables.length, icon: TrendingUp, color: 'text-primary' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Add button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New Invoice
        </button>
      </div>

      {showAdd && <AddReceivableForm onClose={() => setShowAdd(false)} />}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl border bg-muted" />)}
        </div>
      ) : receivables.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <TrendingUp className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-muted-foreground">No invoices yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {receivables.map((r) => {
            const status = (r.computedStatus || r.status) as ArStatus;
            const days = daysUntil(r.due_date);
            const isExpanded = expanded === r.id;
            return (
              <div key={r.id} className="rounded-xl border bg-card overflow-hidden">
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : r.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{r.client_name}</p>
                      <StatusBadge status={status} map={AR_STATUS} />
                      {r.invoice_number && (
                        <span className="text-xs text-muted-foreground">#{r.invoice_number}</span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                      {r.due_date && (
                        <span className={days !== null && days < 0 ? 'text-red-500 font-medium' : ''}>
                          Due {new Date(r.due_date).toLocaleDateString()}
                          {days !== null && (
                            <span className="ml-1">
                              ({days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d`})
                            </span>
                          )}
                        </span>
                      )}
                      {r.description && <span className="truncate max-w-[200px]">{r.description}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-foreground">{fmt(Number(r.amount))}</p>
                    {r.amount_received > 0 && (
                      <p className="text-xs text-muted-foreground">{fmt(Number(r.amount_received))} received</p>
                    )}
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>

                {isExpanded && (
                  <div className="border-t px-4 py-3 bg-muted/30 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-muted-foreground space-y-1">
                      {r.client_email && <p>📧 {r.client_email}</p>}
                      {r.notes && <p className="italic">{r.notes}</p>}
                    </div>
                    <div className="flex gap-2">
                      {r.status === 'draft' && (
                        <button
                          onClick={() => markSent.mutate(r.id)}
                          disabled={markSent.isPending}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-60"
                        >
                          <Clock className="h-3 w-3" />
                          Mark Sent
                        </button>
                      )}
                      {!['paid', 'written_off'].includes(r.status) && (
                        <button
                          onClick={() => markPaid.mutate(r.id)}
                          disabled={markPaid.isPending}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-60"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Mark Received
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────────────────────────────────────

type Tab = 'payables' | 'receivables';

export default function ApAr() {
  const [tab, setTab] = useState<Tab>('payables');

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/bookkeeping" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Accounts Payable & Receivable</h1>
          <p className="text-sm text-muted-foreground">
            Track bills you owe (AP) and invoices your clients owe you (AR)
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg border bg-muted/40 p-1 w-fit gap-1">
        {(['payables', 'receivables'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-5 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-card shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'payables' ? 'Payables (AP)' : 'Receivables (AR)'}
          </button>
        ))}
      </div>

      {tab === 'payables' ? <PayablesTab /> : <ReceivablesTab />}
    </div>
  );
}
