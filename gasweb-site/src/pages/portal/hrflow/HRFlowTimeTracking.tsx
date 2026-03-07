import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, Play, Square, Plus } from 'lucide-react';

interface TimeEntry {
  id: string;
  employee: string;
  date: string;
  hours: number;
  description: string;
  project: string;
}

export default function HRFlowTimeTracking() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [tracking, setTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentDesc, setCurrentDesc] = useState('');
  const [currentProject, setCurrentProject] = useState('');

  const handleStart = () => {
    setTracking(true);
    setStartTime(new Date());
  };

  const handleStop = () => {
    if (!startTime) return;
    const hours = Math.round((Date.now() - startTime.getTime()) / 3600000 * 100) / 100;
    setEntries(prev => [...prev, {
      id: crypto.randomUUID(),
      employee: 'You',
      date: new Date().toISOString().split('T')[0],
      hours: Math.max(hours, 0.01),
      description: currentDesc || 'Untitled',
      project: currentProject || 'General',
    }]);
    setTracking(false);
    setStartTime(null);
    setCurrentDesc('');
    setCurrentProject('');
  };

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);

  return (
    <div>
      <div className="mb-6">
        <Link to="/portal/hrflow" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> HRFlow
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Time Tracking</h1>
        <p className="mt-1 text-sm text-slate-500">Track hours, manage timesheets, and monitor attendance.</p>
      </div>

      {/* Timer */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-4">
          <input type="text" value={currentDesc} onChange={(e) => setCurrentDesc(e.target.value)}
            placeholder="What are you working on?" className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
          <input type="text" value={currentProject} onChange={(e) => setCurrentProject(e.target.value)}
            placeholder="Project" className="w-40 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
          {tracking ? (
            <button onClick={handleStop} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition">
              <Square className="w-4 h-4" /> Stop
            </button>
          ) : (
            <button onClick={handleStart} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition">
              <Play className="w-4 h-4" /> Start
            </button>
          )}
        </div>
        {tracking && startTime && (
          <p className="mt-3 text-sm text-green-600 font-medium">Timer running since {startTime.toLocaleTimeString()}</p>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500 mb-1">Today's Hours</p>
          <p className="text-2xl font-bold text-slate-900">{entries.filter(e => e.date === new Date().toISOString().split('T')[0]).reduce((s, e) => s + e.hours, 0).toFixed(1)}h</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500 mb-1">Total Entries</p>
          <p className="text-2xl font-bold text-slate-900">{entries.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500 mb-1">Total Hours</p>
          <p className="text-2xl font-bold text-slate-900">{totalHours.toFixed(1)}h</p>
        </div>
      </div>

      {/* Entries */}
      {entries.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          <div className="px-4 py-3 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">Time Entries</h3>
          </div>
          {entries.map(entry => (
            <div key={entry.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">{entry.description}</p>
                <p className="text-xs text-slate-500">{entry.project} · {entry.date}</p>
              </div>
              <span className="text-sm font-semibold text-slate-700">{entry.hours.toFixed(2)}h</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No time entries yet. Start tracking to see your hours here.</p>
        </div>
      )}
    </div>
  );
}
