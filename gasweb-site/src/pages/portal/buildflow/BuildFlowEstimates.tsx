import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calculator, Plus, Search, X, Trash2 } from 'lucide-react';

interface Estimate {
  id: string;
  project_name: string;
  client_name: string;
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'declined';
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  sent: 'bg-blue-50 text-blue-700',
  accepted: 'bg-green-50 text-green-700',
  declined: 'bg-red-50 text-red-700',
};

export default function BuildFlowEstimates() {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ project_name: '', client_name: '', total: '' });

  const filtered = estimates.filter(e =>
    e.project_name.toLowerCase().includes(search.toLowerCase()) ||
    e.client_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!form.project_name.trim()) return;
    setEstimates(prev => [...prev, {
      id: crypto.randomUUID(),
      project_name: form.project_name,
      client_name: form.client_name,
      total: parseFloat(form.total) || 0,
      status: 'draft',
      created_at: new Date().toLocaleDateString(),
    }]);
    setForm({ project_name: '', client_name: '', total: '' });
    setShowAdd(false);
  };

  const cycleStatus = (id: string) => {
    const order: Estimate['status'][] = ['draft', 'sent', 'accepted', 'declined'];
    setEstimates(prev => prev.map(e => {
      if (e.id !== id) return e;
      const idx = order.indexOf(e.status);
      return { ...e, status: order[(idx + 1) % order.length] };
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
            <h1 className="text-2xl font-bold text-slate-900">Estimates & Bids</h1>
            <p className="mt-1 text-sm text-slate-500">Create and track project estimates and proposals.</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition">
            <Plus className="w-4 h-4" /> New Estimate
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><p className="text-sm text-slate-500 mb-1">Total</p><p className="text-2xl font-bold text-slate-900">{estimates.length}</p></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><p className="text-sm text-slate-500 mb-1">Drafts</p><p className="text-2xl font-bold text-slate-900">{estimates.filter(e => e.status === 'draft').length}</p></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><p className="text-sm text-slate-500 mb-1">Accepted</p><p className="text-2xl font-bold text-green-600">{estimates.filter(e => e.status === 'accepted').length}</p></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><p className="text-sm text-slate-500 mb-1">Total Value</p><p className="text-2xl font-bold text-slate-900">${estimates.reduce((s, e) => s + e.total, 0).toLocaleString()}</p></div>
      </div>

      <div className="relative mb-6">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search estimates..."
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
      </div>

      {filtered.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {filtered.map(est => (
            <div key={est.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">{est.project_name}</p>
                <p className="text-xs text-slate-500">{est.client_name} · {est.created_at}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-900">${est.total.toLocaleString()}</span>
                <button onClick={() => cycleStatus(est.id)} className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[est.status]}`}>
                  {est.status}
                </button>
                <button onClick={() => setEstimates(prev => prev.filter(e => e.id !== est.id))} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Calculator className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No estimates yet. Create your first project estimate.</p>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">New Estimate</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Project Name *</label>
                <input type="text" value={form.project_name} onChange={(e) => setForm({ ...form, project_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="Kitchen Renovation" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Client Name</label>
                <input type="text" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="John Smith" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Estimated Total ($)</label>
                <input type="number" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="25000" /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={handleAdd} disabled={!form.project_name.trim()} className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50">Create Estimate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
