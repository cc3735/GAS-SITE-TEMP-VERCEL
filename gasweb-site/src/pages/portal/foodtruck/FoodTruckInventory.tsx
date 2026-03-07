import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Package, Plus, Search, X, AlertTriangle, Trash2 } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  reorder_level: number;
  cost: number;
}

export default function FoodTruckInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', quantity: '', unit: 'lbs', reorder_level: '', cost: '' });

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  const lowStock = items.filter(i => i.quantity <= i.reorder_level);

  const handleAdd = () => {
    if (!form.name.trim()) return;
    setItems(prev => [...prev, { id: crypto.randomUUID(), name: form.name, quantity: parseFloat(form.quantity) || 0, unit: form.unit, reorder_level: parseFloat(form.reorder_level) || 5, cost: parseFloat(form.cost) || 0 }]);
    setForm({ name: '', quantity: '', unit: 'lbs', reorder_level: '', cost: '' });
    setShowAdd(false);
  };

  return (
    <div>
      <div className="mb-6">
        <Link to="/portal/foodtruck" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> FoodTruck
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
            <p className="mt-1 text-sm text-slate-500">Track ingredient stock levels and costs.</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">{lowStock.length} item(s) at or below reorder level: {lowStock.map(i => i.name).join(', ')}</p>
        </div>
      )}

      <div className="relative mb-6">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search inventory..."
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
      </div>

      {filtered.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {filtered.map(item => (
            <div key={item.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-500">${item.cost.toFixed(2)}/{item.unit} · Reorder at {item.reorder_level} {item.unit}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold ${item.quantity <= item.reorder_level ? 'text-red-600' : 'text-slate-900'}`}>
                  {item.quantity} {item.unit}
                </span>
                <button onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No inventory items yet. Start tracking your ingredients and supplies.</p>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Add Inventory Item</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Item Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="Ground Beef" /></div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                  <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="50" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="lbs">lbs</option><option value="oz">oz</option><option value="gal">gal</option><option value="units">units</option><option value="cases">cases</option>
                  </select></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Reorder At</label>
                  <input type="number" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="10" /></div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Cost per Unit ($)</label>
                <input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="4.99" /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={handleAdd} disabled={!form.name.trim()} className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50">Add Item</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
