import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Package, Plus, Search, X, Trash2, AlertTriangle } from 'lucide-react';

interface Material {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  cost_per_unit: number;
  supplier: string;
  reorder_level: number;
}

const CATEGORIES = ['Lumber', 'Concrete', 'Electrical', 'Plumbing', 'Hardware', 'Finishes', 'Other'];

export default function BuildFlowMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Lumber', quantity: '', unit: 'units', cost_per_unit: '', supplier: '', reorder_level: '' });

  const filtered = materials.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.category.toLowerCase().includes(search.toLowerCase()));
  const lowStock = materials.filter(m => m.quantity <= m.reorder_level);

  const handleAdd = () => {
    if (!form.name.trim()) return;
    setMaterials(prev => [...prev, {
      id: crypto.randomUUID(), name: form.name, category: form.category,
      quantity: parseFloat(form.quantity) || 0, unit: form.unit,
      cost_per_unit: parseFloat(form.cost_per_unit) || 0, supplier: form.supplier,
      reorder_level: parseFloat(form.reorder_level) || 5,
    }]);
    setForm({ name: '', category: 'Lumber', quantity: '', unit: 'units', cost_per_unit: '', supplier: '', reorder_level: '' });
    setShowAdd(false);
  };

  return (
    <div>
      <div className="mb-6">
        <Link to="/portal/buildflow" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> BuildFlow
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Materials</h1>
            <p className="mt-1 text-sm text-slate-500">Track building materials, costs, and suppliers.</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition">
            <Plus className="w-4 h-4" /> Add Material
          </button>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">{lowStock.length} material(s) at or below reorder level: {lowStock.map(m => m.name).join(', ')}</p>
        </div>
      )}

      <div className="relative mb-6">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search materials..."
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
      </div>

      {filtered.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {filtered.map(mat => (
            <div key={mat.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">{mat.name}</p>
                <p className="text-xs text-slate-500">{mat.category} · {mat.supplier || 'No supplier'} · ${mat.cost_per_unit.toFixed(2)}/{mat.unit}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold ${mat.quantity <= mat.reorder_level ? 'text-red-600' : 'text-slate-900'}`}>
                  {mat.quantity} {mat.unit}
                </span>
                <button onClick={() => setMaterials(prev => prev.filter(m => m.id !== mat.id))} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No materials tracked yet. Add your first material to get started.</p>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Add Material</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Material Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="2x4 Lumber" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
                  <input type="text" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="Home Depot" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                  <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="100" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="units">units</option><option value="ft">ft</option><option value="sqft">sqft</option><option value="lbs">lbs</option><option value="bags">bags</option><option value="sheets">sheets</option>
                  </select></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Reorder At</label>
                  <input type="number" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="10" /></div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Cost per Unit ($)</label>
                <input type="number" step="0.01" value={form.cost_per_unit} onChange={(e) => setForm({ ...form, cost_per_unit: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="3.49" /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={handleAdd} disabled={!form.name.trim()} className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50">Add Material</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
