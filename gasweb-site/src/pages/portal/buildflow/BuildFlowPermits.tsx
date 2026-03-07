import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ClipboardCheck, Plus, Search, X, Trash2 } from 'lucide-react';

interface Permit {
  id: string;
  name: string;
  type: string;
  project: string;
  status: 'pending' | 'approved' | 'inspection_scheduled' | 'passed' | 'failed';
  submitted_date: string;
  inspection_date: string;
}

const TYPES = ['Building', 'Electrical', 'Plumbing', 'Mechanical', 'Demolition', 'Grading', 'Other'];
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-blue-50 text-blue-700',
  inspection_scheduled: 'bg-purple-50 text-purple-700',
  passed: 'bg-green-50 text-green-700',
  failed: 'bg-red-50 text-red-700',
};
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  inspection_scheduled: 'Inspection Scheduled',
  passed: 'Passed',
  failed: 'Failed',
};

export default function BuildFlowPermits() {
  const [permits, setPermits] = useState<Permit[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'Building', project: '', inspection_date: '' });

  const filtered = permits.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.project.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = () => {
    if (!form.name.trim()) return;
    setPermits(prev => [...prev, {
      id: crypto.randomUUID(), name: form.name, type: form.type,
      project: form.project, status: 'pending',
      submitted_date: new Date().toLocaleDateString(),
      inspection_date: form.inspection_date,
    }]);
    setForm({ name: '', type: 'Building', project: '', inspection_date: '' });
    setShowAdd(false);
  };

  const cycleStatus = (id: string) => {
    const order: Permit['status'][] = ['pending', 'approved', 'inspection_scheduled', 'passed', 'failed'];
    setPermits(prev => prev.map(p => {
      if (p.id !== id) return p;
      const idx = order.indexOf(p.status);
      return { ...p, status: order[(idx + 1) % order.length] };
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
            <h1 className="text-2xl font-bold text-slate-900">Permits & Inspections</h1>
            <p className="mt-1 text-sm text-slate-500">Track permits, schedule inspections, and manage compliance.</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition">
            <Plus className="w-4 h-4" /> New Permit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><p className="text-sm text-slate-500 mb-1">Total Permits</p><p className="text-2xl font-bold text-slate-900">{permits.length}</p></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><p className="text-sm text-slate-500 mb-1">Pending</p><p className="text-2xl font-bold text-amber-600">{permits.filter(p => p.status === 'pending').length}</p></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><p className="text-sm text-slate-500 mb-1">Inspections</p><p className="text-2xl font-bold text-purple-600">{permits.filter(p => p.status === 'inspection_scheduled').length}</p></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><p className="text-sm text-slate-500 mb-1">Passed</p><p className="text-2xl font-bold text-green-600">{permits.filter(p => p.status === 'passed').length}</p></div>
      </div>

      <div className="relative mb-6">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search permits..."
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
      </div>

      {filtered.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {filtered.map(p => (
            <div key={p.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">{p.name}</p>
                <p className="text-xs text-slate-500">{p.type} · {p.project || 'No project'} · Submitted {p.submitted_date}{p.inspection_date ? ` · Inspection ${p.inspection_date}` : ''}</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => cycleStatus(p.id)} className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[p.status]}`}>
                  {STATUS_LABELS[p.status]}
                </button>
                <button onClick={() => setPermits(prev => prev.filter(x => x.id !== p.id))} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No permits tracked yet. Add a permit to start managing compliance.</p>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">New Permit</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Permit Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="Building Permit #2024-001" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Project</label>
                  <input type="text" value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="Kitchen Reno" /></div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Inspection Date</label>
                <input type="date" value={form.inspection_date} onChange={(e) => setForm({ ...form, inspection_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={handleAdd} disabled={!form.name.trim()} className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50">Add Permit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
