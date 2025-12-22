import React from 'react';
import { useIntakeDashboard } from '../hooks/useIntakeNudge';
import { Activity, Users, Ghost, CheckCircle, ArrowRight } from 'lucide-react';

export default function IntakeDashboard() {
  const { events, stats, loading } = useIntakeDashboard();

  if (loading) return <div className="p-8">Loading Intake Engine...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Intake Engine</h1>
        <p className="text-gray-600">Real-time lead capture and intent classification.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg text-blue-600"><Users size={24} /></div>
                <span className="text-sm font-medium text-gray-500">Total Leads</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalLeads}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-lg text-purple-600"><Activity size={24} /></div>
                <span className="text-sm font-medium text-gray-500">High Intent</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.highIntent}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-lg text-orange-600"><Ghost size={24} /></div>
                <span className="text-sm font-medium text-gray-500">Ghosting</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.ghosting}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-lg text-green-600"><CheckCircle size={24} /></div>
                <span className="text-sm font-medium text-gray-500">Converted</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.converted}</p>
        </div>
      </div>

      {/* Live Feed */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Live Intake Feed</h2>
            <span className="text-xs font-medium text-green-600 flex items-center bg-green-50 px-2 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Live
            </span>
        </div>
        <div className="divide-y divide-gray-100">
            {events.map(event => (
                <div key={event.id} className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white
                            ${event.intentCategory === 'high_value' ? 'bg-purple-600' : 
                              event.intentCategory === 'engaged' ? 'bg-blue-600' : 'bg-gray-400'}`}>
                            {event.intentScore}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-gray-900 capitalize">{event.eventType.replace('_', ' ')}</span>
                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded capitalize">{event.source}</span>
                            </div>
                            <p className="text-sm text-gray-500">Intent: <span className="capitalize">{event.intentCategory.replace('_', ' ')}</span></p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-400">
                            {new Date(event.createdAt).toLocaleTimeString()}
                        </span>
                        <button className="p-2 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600">
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
