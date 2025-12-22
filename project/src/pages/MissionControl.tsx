import React, { useState } from 'react';
import AgentVisibility from '../components/AgentVisibility';
import UnifiedInbox from '../components/UnifiedInbox';
import { LayoutDashboard, Inbox, AlertTriangle, BarChart2, Bell, Shield } from 'lucide-react';

const MissionControl: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'command-center' | 'inbox' | 'attention' | 'analytics' | 'alerts'>('command-center');
  const organizationId = 'org_mock_id'; // This would come from auth context

  const tabs = [
    { id: 'command-center', label: 'Command Center', icon: <LayoutDashboard size={18} /> },
    { id: 'inbox', label: 'Unified Inbox', icon: <Inbox size={18} /> },
    { id: 'attention', label: 'Needs Attention', icon: <AlertTriangle size={18} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={18} /> },
    { id: 'alerts', label: 'Alerts', icon: <Bell size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100">
      {/* Header */}
      <header className="bg-[#1a1a1a] border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="text-blue-500" size={24} />
          <h1 className="text-xl font-bold tracking-tight">Neuro-Ops BOS <span className="text-gray-500 font-normal">| Mission Control</span></h1>
        </div>
        <div className="flex items-center space-x-4">
            <div className="flex space-x-1 text-xs">
                <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded border border-green-900">System Online</span>
                <span className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded border border-blue-900">3 Agents Active</span>
            </div>
            <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="px-6 border-b border-gray-800 bg-[#1f1f1f]">
        <div className="flex space-x-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? 'border-blue-500 text-blue-400' 
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-700'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="p-6">
        {activeTab === 'command-center' && (
          <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                 {/* Quick KPIs */}
                 <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                     <p className="text-gray-500 text-xs uppercase tracking-wide">Today's Sales</p>
                     <p className="text-2xl font-bold text-white">$1,245.00</p>
                     <p className="text-xs text-green-400 mt-1 flex items-center">↑ 12% vs yesterday</p>
                 </div>
                 <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                     <p className="text-gray-500 text-xs uppercase tracking-wide">Active Conversations</p>
                     <p className="text-2xl font-bold text-white">8</p>
                     <p className="text-xs text-blue-400 mt-1">3 require attention</p>
                 </div>
                 <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                     <p className="text-gray-500 text-xs uppercase tracking-wide">Avg Response Time</p>
                     <p className="text-2xl font-bold text-white">1.2s</p>
                     <p className="text-xs text-green-400 mt-1">↓ 0.3s improvement</p>
                 </div>
                 <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                     <p className="text-gray-500 text-xs uppercase tracking-wide">Total Leads</p>
                     <p className="text-2xl font-bold text-white">142</p>
                     <p className="text-xs text-gray-400 mt-1">+12 today</p>
                 </div>
             </div>

             <section>
                 <h2 className="text-lg font-semibold text-white mb-4">Agent Status & Live Activity</h2>
                 <AgentVisibility organizationId={organizationId} />
             </section>
          </div>
        )}

        {activeTab === 'inbox' && (
            <div className="h-full">
                <UnifiedInbox organizationId={organizationId} />
            </div>
        )}

        {activeTab === 'attention' && (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
                <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" />
                <h3 className="text-xl font-medium text-white">Escalation Queue</h3>
                <p className="text-gray-400 mt-2">No active escalations. Good job!</p>
            </div>
        )}

        {activeTab === 'analytics' && (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
                <BarChart2 size={48} className="mx-auto text-purple-500 mb-4" />
                <h3 className="text-xl font-medium text-white">Historical Analytics</h3>
                <p className="text-gray-400 mt-2">Charts and trends will appear here.</p>
            </div>
        )}

        {activeTab === 'alerts' && (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
                <Bell size={48} className="mx-auto text-red-500 mb-4" />
                <h3 className="text-xl font-medium text-white">Alert Center</h3>
                <p className="text-gray-400 mt-2">System health and notifications.</p>
            </div>
        )}
      </main>
    </div>
  );
};

export default MissionControl;
