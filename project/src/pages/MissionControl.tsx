import React, { useState, useMemo } from 'react';
import AgentVisibility from '../components/AgentVisibility';
import UnifiedInbox from '../components/UnifiedInbox';
import MissionControlAnalytics from '../components/MissionControlAnalytics';
import { LayoutDashboard, Inbox, AlertTriangle, BarChart2, Bell, Shield, ArrowUpRight, ArrowDownRight, User } from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';
import { useDeals } from '../hooks/useDeals';
import { useContacts } from '../hooks/useContacts';
import { useAgents } from '../hooks/useAgents';
import { useUnifiedInbox } from '../hooks/useUnifiedInbox';

const MissionControl: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'command-center' | 'inbox' | 'attention' | 'analytics' | 'alerts'>('command-center');
  const { currentOrganization } = useOrganization();
  
  // Fetch Real Data
  const { deals } = useDeals();
  const { contacts } = useContacts();
  const { agents } = useAgents();
  // We need to pass default filters to useUnifiedInbox
  const { threads } = useUnifiedInbox(
    currentOrganization?.id || '', 
    { status: 'all', priority: 'all', channel: 'all', assignee: 'all' }, 
    '', 
    'newest'
  );

  // Calculate KPIs
  const kpis = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sales (Mock logic: sum value of 'won' deals. Real logic needs 'closed_at' timestamp check for "Today")
    // For now, we'll just sum ALL won deals to show *some* number, or filter by created_at if status is won
    const wonDeals = deals.filter(d => d.status === 'won');
    const totalSales = wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    
    // Active Conversations (Open status)
    const activeThreads = threads.filter(t => t.status === 'open').length;
    const urgentThreads = threads.filter(t => t.priority === 'urgent').length;

    // Leads (Contacts)
    const totalContacts = contacts.length;
    const newContactsToday = contacts.filter(c => new Date(c.created_at) >= today).length;

    // Agent Stats
    const activeAgents = agents.filter(a => a.status === 'active').length;

    return {
      totalSales,
      activeThreads,
      urgentThreads,
      totalContacts,
      newContactsToday,
      activeAgents
    };
  }, [deals, threads, contacts, agents]);

  // Needs Attention Items
  const attentionItems = useMemo(() => {
    const items = [];

    // Urgent Threads
    threads.filter(t => t.priority === 'urgent' || t.escalationQueue).forEach(t => {
      items.push({
        id: t.id,
        type: 'thread',
        title: `Urgent: ${t.customerName}`,
        description: t.lastMessage,
        time: t.lastMessageAt,
        priority: 'high'
      });
    });

    // Failed Agents
    agents.filter(a => a.status === 'error' || a.status === 'paused').forEach(a => {
      items.push({
        id: a.id,
        type: 'agent',
        title: `Agent Issue: ${a.name}`,
        description: `Agent is currently ${a.status}`,
        time: a.updated_at || new Date().toISOString(),
        priority: 'critical'
      });
    });

    return items;
  }, [threads, agents]);

  const tabs = [
    { id: 'command-center', label: 'Command Center', icon: <LayoutDashboard size={18} /> },
    { id: 'inbox', label: 'Unified Inbox', icon: <Inbox size={18} /> },
    { id: 'attention', label: 'Needs Attention', icon: <AlertTriangle size={18} />, count: attentionItems.length },
    { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={18} /> },
    { id: 'alerts', label: 'Alerts', icon: <Bell size={18} /> },
  ];

  const displayOrgId = currentOrganization?.id || 'mock-org-id';

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
                <span className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded border border-blue-900">{kpis.activeAgents} Agents Active</span>
            </div>
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
              <User size={16} />
            </div>
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
              {tab.count ? (
                <span className="ml-2 bg-red-500/20 text-red-400 text-xs px-1.5 py-0.5 rounded-full">{tab.count}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="p-6">
        {activeTab === 'command-center' && (
          <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                 {/* KPI Cards with Real Data */}
                 <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                     <p className="text-gray-500 text-xs uppercase tracking-wide">Total Sales (Won)</p>
                     <p className="text-2xl font-bold text-white">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(kpis.totalSales)}
                     </p>
                     <p className="text-xs text-green-400 mt-1 flex items-center">
                        <ArrowUpRight size={12} className="mr-1"/> Lifetime
                     </p>
                 </div>
                 <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                     <p className="text-gray-500 text-xs uppercase tracking-wide">Active Conversations</p>
                     <p className="text-2xl font-bold text-white">{kpis.activeThreads}</p>
                     <p className="text-xs text-blue-400 mt-1">{kpis.urgentThreads} require attention</p>
                 </div>
                 <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                     <p className="text-gray-500 text-xs uppercase tracking-wide">Avg Response Time</p>
                     <p className="text-2xl font-bold text-white">--</p>
                     <p className="text-xs text-gray-500 mt-1">Calculating...</p>
                 </div>
                 <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                     <p className="text-gray-500 text-xs uppercase tracking-wide">Total Leads</p>
                     <p className="text-2xl font-bold text-white">{kpis.totalContacts}</p>
                     <p className="text-xs text-green-400 mt-1">+{kpis.newContactsToday} today</p>
                 </div>
             </div>

             <section>
                 <h2 className="text-lg font-semibold text-white mb-4">Agent Status & Live Activity</h2>
                 <AgentVisibility organizationId={displayOrgId} />
             </section>
          </div>
        )}

        {activeTab === 'inbox' && (
            <div className="h-full">
                <UnifiedInbox organizationId={displayOrgId} />
            </div>
        )}

        {activeTab === 'attention' && (
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-white mb-4">Items Requiring Attention</h3>
                
                {attentionItems.length === 0 ? (
                  <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
                      <AlertTriangle size={48} className="mx-auto text-green-500 mb-4" />
                      <h3 className="text-xl font-medium text-white">All Clear</h3>
                      <p className="text-gray-400 mt-2">No urgent items in the queue. Good job!</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {attentionItems.map((item, idx) => (
                      <div key={idx} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex items-start justify-between hover:bg-gray-750 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-full ${item.priority === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            <AlertTriangle size={20} />
                          </div>
                          <div>
                            <h4 className="font-medium text-white">{item.title}</h4>
                            <p className="text-sm text-gray-400">{item.description}</p>
                            <span className="text-xs text-gray-500 mt-1 block">{new Date(item.time).toLocaleString()}</span>
                          </div>
                        </div>
                        <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-sm text-white rounded transition-colors">
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                )}
            </div>
        )}

        {activeTab === 'analytics' && (
            <div className="h-full">
                <MissionControlAnalytics />
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
