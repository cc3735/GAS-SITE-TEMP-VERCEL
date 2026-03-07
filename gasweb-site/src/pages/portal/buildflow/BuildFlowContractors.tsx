import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, HardHat, Plus, Search, X, Trash2, Phone, Mail } from 'lucide-react';

interface Contractor {
  id: string;
  name: string;
  trade: string;
  phone: string;
  email: string;
  rate: number;
  status: 'available' | 'on_job' | 'unavailable';
}

const TRADES = ['General', 'Electrical', 'Plumbing', 'HVAC', 'Carpentry', 'Roofing', 'Painting', 'Masonry', 'Landscaping', 'Other'];
const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-50 text-green-700',
  on_job: 'bg-blue-50 text-blue-700',
  unavailable: 'bg-slate-100 text-slate-600',
};

export default function BuildFlowContractors() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', trade: 'General', phone: '', email: '', rate: '' });

  const filtered = contractors.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.trade.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = () => {
    if (!form.name.trim()) return;
    setContractors(prev => [...prev, {
      id: crypto.randomUUID(), name: form.name, trade: form.trade,
      phone: form.phone, email: form.email, rate: parseFloat(form.rate) || 0, status: 'available',
    }]);
    setForm({ name: '', trade: 'General', phone: '', email: '', rate: '' });
    setShowAdd(false);
  };

  const cycleStatus = (id: string) => {
    const order: Contractor['status'][] = ['available', 'on_job', 'unavailable'];
    setContractors(prev => prev.map(c => {
      if (c.id !== id) return c;
      const idx = order.indexOf(c.status);
      return { ...c, status: order[(idx + 1) % order.length] };
    }));
  };

  return (
    <div>
      <div className="mb-6">
        <Link to="/portal/buildflow" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> BuildFlow
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Contractors</h1>
            <p className="mt-1 text-sm text-slate-500">Manage subcontractors, crews, and assignments.</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition">
            <Plus className="w-4 h-4" /> Add Contractor
          </button>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contractors..."
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-slate-900">{c.name}</h3>
                  <p className="text-xs text-slate-500">{c.trade} · ${c.rate}/hr</p>
                </div>
                <button onClick={() => cycleStatus(c.id)} className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[c.status]}`}>
                  {c.status.replace('_', ' ')}
                </button>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}</span>}
                {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {c.email}</span>}
              </div>
              <div className="flex justify-end">
                <button onClick={() => setContractors(prev => prev.filter(x => x.id !== c.id))} className="text-slate-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <HardHat className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No contractors added yet. Build your team by adding subcontractors.</p>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Add Contractor</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="Mike's Electric" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Trade</label>
                  <select value={form.trade} onChange={(e) => setForm({ ...form, trade: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
                    {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Rate ($/hr)</label>
                  <input type="number" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="75" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="(555) 123-4567" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="mike@electric.com" /></div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={handleAdd} disabled={!form.name.trim()} className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50">Add Contractor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
