import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Plus, X, Trash2 } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  address: string;
  day: string;
  hours: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function FoodTruckLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', day: 'Monday', hours: '11:00 AM - 8:00 PM' });

  const handleAdd = () => {
    if (!form.name.trim() || !form.address.trim()) return;
    setLocations(prev => [...prev, { id: crypto.randomUUID(), ...form }]);
    setForm({ name: '', address: '', day: 'Monday', hours: '11:00 AM - 8:00 PM' });
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
            <h1 className="text-2xl font-bold text-slate-900">Location Schedule</h1>
            <p className="mt-1 text-sm text-slate-500">Plan your weekly route and operating hours.</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition">
            <Plus className="w-4 h-4" /> Add Location
          </button>
        </div>
      </div>

      {locations.length > 0 ? (
        <div className="space-y-3">
          {DAYS.map(day => {
            const dayLocs = locations.filter(l => l.day === day);
            if (dayLocs.length === 0) return null;
            return (
              <div key={day} className="bg-white rounded-2xl border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-900 mb-2">{day}</h3>
                {dayLocs.map(loc => (
                  <div key={loc.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{loc.name}</p>
                        <p className="text-xs text-slate-500">{loc.address} · {loc.hours}</p>
                      </div>
                    </div>
                    <button onClick={() => setLocations(prev => prev.filter(l => l.id !== loc.id))} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No locations scheduled. Add your first stop to plan your week.</p>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Add Location</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Location Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="Downtown Plaza" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Address *</label>
                <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="123 Main St" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Day</label>
                  <select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Hours</label>
                  <input type="text" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={handleAdd} disabled={!form.name.trim() || !form.address.trim()} className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
