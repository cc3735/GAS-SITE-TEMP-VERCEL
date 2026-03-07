import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home, Plus, Search, X, Trash2 } from 'lucide-react';

interface Property {
  id: string;
  name: string;
  address: string;
  type: string;
  units: number;
  status: 'available' | 'occupied' | 'maintenance';
  rent: number;
}

const TYPES = ['Single Family', 'Multi-Family', 'Apartment', 'Condo', 'Townhouse', 'Commercial', 'Other'];
const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-50 text-green-700',
  occupied: 'bg-blue-50 text-blue-700',
  maintenance: 'bg-amber-50 text-amber-700',
};

export default function KeysFlowProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', type: 'Single Family', units: '1', rent: '' });

  const filtered = properties.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.address.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = () => {
    if (!form.name.trim()) return;
    setProperties(prev => [...prev, {
      id: crypto.randomUUID(), name: form.name, address: form.address,
      type: form.type, units: parseInt(form.units) || 1,
      status: 'available', rent: parseFloat(form.rent) || 0,
    }]);
    setForm({ name: '', address: '', type: 'Single Family', units: '1', rent: '' });
    setShowAdd(false);
  };

  const cycleStatus = (id: string) => {
    const order: Property['status'][] = ['available', 'occupied', 'maintenance'];
    setProperties(prev => prev.map(p => {
      if (p.id !== id) return p;
      const idx = order.indexOf(p.status);
      return { ...p, status: order[(idx + 1) % order.length] };
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
            <h1 className="text-2xl font-bold text-slate-900">Properties</h1>
            <p className="mt-1 text-sm text-slate-500">Manage your property listings and availability.</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition">
            <Plus className="w-4 h-4" /> Add Property
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><p className="text-sm text-slate-500 mb-1">Total Properties</p><p className="text-2xl font-bold text-slate-900">{properties.length}</p></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><p className="text-sm text-slate-500 mb-1">Available</p><p className="text-2xl font-bold text-green-600">{properties.filter(p => p.status === 'available').length}</p></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><p className="text-sm text-slate-500 mb-1">Occupied</p><p className="text-2xl font-bold text-blue-600">{properties.filter(p => p.status === 'occupied').length}</p></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><p className="text-sm text-slate-500 mb-1">Monthly Revenue</p><p className="text-2xl font-bold text-slate-900">${properties.filter(p => p.status === 'occupied').reduce((s, p) => s + p.rent, 0).toLocaleString()}</p></div>
      </div>

      <div className="relative mb-6">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search properties..."
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-slate-900">{p.name}</h3>
                  <p className="text-xs text-slate-500">{p.address}</p>
                </div>
                <button onClick={() => cycleStatus(p.id)} className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[p.status]}`}>
                  {p.status}
                </button>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
                <span>{p.type} · {p.units} unit{p.units !== 1 ? 's' : ''}</span>
                <span className="font-semibold text-slate-900">${p.rent.toLocaleString()}/mo</span>
              </div>
              <div className="flex justify-end">
                <button onClick={() => setProperties(prev => prev.filter(x => x.id !== p.id))} className="text-slate-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Home className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No properties yet. Add your first property to start managing your portfolio.</p>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Add Property</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Property Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="Sunset Apartments" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="123 Main St, City, ST 12345" /></div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Units</label>
                  <input type="number" value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="1" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Rent ($/mo)</label>
                  <input type="number" value={form.rent} onChange={(e) => setForm({ ...form, rent: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="1500" /></div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={handleAdd} disabled={!form.name.trim()} className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50">Add Property</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
