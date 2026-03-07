import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Plus, Search, X, Trash2 } from 'lucide-react';

interface Lease {
  id: string;
  tenant: string;
  property: string;
  unit: string;
  start_date: string;
  end_date: string;
  rent: number;
  status: 'active' | 'expiring' | 'expired' | 'renewed';
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-50 text-green-700',
  expiring: 'bg-amber-50 text-amber-700',
  expired: 'bg-red-50 text-red-700',
  renewed: 'bg-blue-50 text-blue-700',
};

export default function KeysFlowLeases() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ tenant: '', property: '', unit: '', start_date: '', end_date: '', rent: '' });

  const filtered = leases.filter(l => l.tenant.toLowerCase().includes(search.toLowerCase()) || l.property.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = () => {
    if (!form.tenant.trim() || !form.property.trim()) return;
    setLeases(prev => [...prev, {
      id: crypto.randomUUID(), tenant: form.tenant, property: form.property,
      unit: form.unit, start_date: form.start_date, end_date: form.end_date,
      rent: parseFloat(form.rent) || 0, status: 'active',
    }]);
    setForm({ tenant: '', property: '', unit: '', start_date: '', end_date: '', rent: '' });
    setShowAdd(false);
  };

  const cycleStatus = (id: string) => {
    const order: Lease['status'][] = ['active', 'expiring', 'expired', 'renewed'];
    setLeases(prev => prev.map(l => {
      if (l.id !== id) return l;
      const idx = order.indexOf(l.status);
      return { ...l, status: order[(idx + 1) % order.length] };
    }));
  };

  const totalMonthly = leases.filter(l => l.status === 'active' || l.status === 'renewed').reduce((s, l) => s + l.rent, 0);

  return (
    <div>
      <div className="mb-6">
        <Link to="/portal/keysflow" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> KeysFlow
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Leases</h1>
            <p className="mt-1 text-sm text-slate-500">Manage lease agreements, renewals, and rent schedules.</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition">
            <Plus className="w-4 h-4" /> New Lease
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><p className="text-sm text-slate-500 mb-1">Total Leases</p><p className="text-2xl font-bold text-slate-900">{leases.length}</p></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><p className="text-sm text-slate-500 mb-1">Active</p><p className="text-2xl font-bold text-green-600">{leases.filter(l => l.status === 'active').length}</p></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><p className="text-sm text-slate-500 mb-1">Expiring</p><p className="text-2xl font-bold text-amber-600">{leases.filter(l => l.status === 'expiring').length}</p></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><p className="text-sm text-slate-500 mb-1">Monthly Revenue</p><p className="text-2xl font-bold text-slate-900">${totalMonthly.toLocaleString()}</p></div>
      </div>

      <div className="relative mb-6">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search leases..."
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
      </div>

      {filtered.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {filtered.map(l => (
            <div key={l.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">{l.tenant}</p>
                <p className="text-xs text-slate-500">{l.property}{l.unit ? ` · Unit ${l.unit}` : ''} · {l.start_date} to {l.end_date}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-900">${l.rent.toLocaleString()}/mo</span>
                <button onClick={() => cycleStatus(l.id)} className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[l.status]}`}>
                  {l.status}
                </button>
                <button onClick={() => setLeases(prev => prev.filter(x => x.id !== l.id))} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No leases yet. Create your first lease agreement.</p>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">New Lease</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Tenant Name *</label>
                <input type="text" value={form.tenant} onChange={(e) => setForm({ ...form, tenant: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="Jane Doe" /></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Property *</label>
                  <input type="text" value={form.property} onChange={(e) => setForm({ ...form, property: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="Sunset Apartments" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                  <input type="text" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="2B" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                  <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                  <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Monthly Rent ($)</label>
                <input type="number" value={form.rent} onChange={(e) => setForm({ ...form, rent: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="1500" /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={handleAdd} disabled={!form.tenant.trim() || !form.property.trim()} className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50">Create Lease</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
