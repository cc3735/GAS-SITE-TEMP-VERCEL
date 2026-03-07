import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Plus, Search, X, Trash2, Phone, Mail } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  property: string;
  unit: string;
  move_in: string;
  status: 'active' | 'late' | 'notice';
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-50 text-green-700',
  late: 'bg-red-50 text-red-700',
  notice: 'bg-amber-50 text-amber-700',
};

export default function KeysFlowTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', property: '', unit: '', move_in: '' });

  const filtered = tenants.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.property.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = () => {
    if (!form.name.trim()) return;
    setTenants(prev => [...prev, { id: crypto.randomUUID(), ...form, status: 'active' as const }]);
    setForm({ name: '', email: '', phone: '', property: '', unit: '', move_in: '' });
    setShowAdd(false);
  };

  const cycleStatus = (id: string) => {
    const order: Tenant['status'][] = ['active', 'late', 'notice'];
    setTenants(prev => prev.map(t => {
      if (t.id !== id) return t;
      const idx = order.indexOf(t.status);
      return { ...t, status: order[(idx + 1) % order.length] };
    }));
  };

  return (
    <div>
      <div className="mb-6">
        <Link to="/portal/keysflow" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> KeysFlow
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tenants</h1>
            <p className="mt-1 text-sm text-slate-500">Track tenant information, contacts, and status.</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition">
            <Plus className="w-4 h-4" /> Add Tenant
          </button>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tenants..."
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(t => (
            <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-slate-900">{t.name}</h3>
                  <p className="text-xs text-slate-500">{t.property}{t.unit ? ` · Unit ${t.unit}` : ''}</p>
                </div>
                <button onClick={() => cycleStatus(t.id)} className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[t.status]}`}>
                  {t.status}
                </button>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 mb-1">
                {t.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {t.phone}</span>}
                {t.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {t.email}</span>}
              </div>
              {t.move_in && <p className="text-xs text-slate-400 mb-3">Move-in: {t.move_in}</p>}
              <div className="flex justify-end">
                <button onClick={() => setTenants(prev => prev.filter(x => x.id !== t.id))} className="text-slate-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No tenants yet. Add your first tenant to start tracking.</p>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Add Tenant</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Tenant Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="Jane Doe" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="jane@email.com" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="(555) 123-4567" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Property</label>
                  <input type="text" value={form.property} onChange={(e) => setForm({ ...form, property: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="Sunset Apartments" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                  <input type="text" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="2B" /></div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Move-in Date</label>
                <input type="date" value={form.move_in} onChange={(e) => setForm({ ...form, move_in: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={handleAdd} disabled={!form.name.trim()} className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50">Add Tenant</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
