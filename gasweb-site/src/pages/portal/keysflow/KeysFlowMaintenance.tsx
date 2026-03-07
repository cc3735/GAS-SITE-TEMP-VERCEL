import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Wrench, Plus, Search, X, Trash2 } from 'lucide-react';

interface Request {
  id: string;
  title: string;
  property: string;
  unit: string;
  tenant: string;
  priority: 'low' | 'medium' | 'high' | 'emergency';
  status: 'open' | 'in_progress' | 'completed';
  created_at: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-50 text-blue-700',
  high: 'bg-amber-50 text-amber-700',
  emergency: 'bg-red-50 text-red-700',
};
const STATUS_COLORS: Record<string, string> = {
  open: 'bg-amber-50 text-amber-700',
  in_progress: 'bg-blue-50 text-blue-700',
  completed: 'bg-green-50 text-green-700',
};

export default function KeysFlowMaintenance() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', property: '', unit: '', tenant: '', priority: 'medium' as Request['priority'] });

  const filtered = requests.filter(r => r.title.toLowerCase().includes(search.toLowerCase()) || r.property.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = () => {
    if (!form.title.trim()) return;
    setRequests(prev => [...prev, {
      id: crypto.randomUUID(), ...form, status: 'open' as const,
      created_at: new Date().toLocaleDateString(),
    }]);
    setForm({ title: '', property: '', unit: '', tenant: '', priority: 'medium' });
    setShowAdd(false);
  };

  const cycleStatus = (id: string) => {
    const order: Request['status'][] = ['open', 'in_progress', 'completed'];
    setRequests(prev => prev.map(r => {
      if (r.id !== id) return r;
      const idx = order.indexOf(r.status);
      return { ...r, status: order[(idx + 1) % order.length] };
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
            <h1 className="text-2xl font-bold text-slate-900">Maintenance</h1>
            <p className="mt-1 text-sm text-slate-500">Handle maintenance requests and work orders.</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition">
            <Plus className="w-4 h-4" /> New Request
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><p className="text-sm text-slate-500 mb-1">Total Requests</p><p className="text-2xl font-bold text-slate-900">{requests.length}</p></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><p className="text-sm text-slate-500 mb-1">Open</p><p className="text-2xl font-bold text-amber-600">{requests.filter(r => r.status === 'open').length}</p></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><p className="text-sm text-slate-500 mb-1">In Progress</p><p className="text-2xl font-bold text-blue-600">{requests.filter(r => r.status === 'in_progress').length}</p></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><p className="text-sm text-slate-500 mb-1">Completed</p><p className="text-2xl font-bold text-green-600">{requests.filter(r => r.status === 'completed').length}</p></div>
      </div>

      <div className="relative mb-6">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search requests..."
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
      </div>

      {filtered.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {filtered.map(r => (
            <div key={r.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">{r.title}</p>
                <p className="text-xs text-slate-500">{r.property}{r.unit ? ` · Unit ${r.unit}` : ''}{r.tenant ? ` · ${r.tenant}` : ''} · {r.created_at}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${PRIORITY_COLORS[r.priority]}`}>{r.priority}</span>
                <button onClick={() => cycleStatus(r.id)} className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[r.status]}`}>
                  {r.status.replace('_', ' ')}
                </button>
                <button onClick={() => setRequests(prev => prev.filter(x => x.id !== r.id))} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No maintenance requests. Create one when a tenant reports an issue.</p>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">New Maintenance Request</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Issue Title *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="Leaking faucet in kitchen" /></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Property</label>
                  <input type="text" value={form.property} onChange={(e) => setForm({ ...form, property: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="Sunset Apartments" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                  <input type="text" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="2B" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Tenant</label>
                  <input type="text" value={form.tenant} onChange={(e) => setForm({ ...form, tenant: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="Jane Doe" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Request['priority'] })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="emergency">Emergency</option>
                  </select></div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={handleAdd} disabled={!form.title.trim()} className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50">Submit Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
