import React, { useState, useMemo, useCallback } from 'react';
import { 
  LayoutDashboard, 
  Inbox, 
  AlertTriangle, 
  BarChart2, 
  Bell, 
  Shield, 
  ArrowUpRight, 
  User,
  Activity,
  MoreHorizontal,
  Pause,
  Settings,
  MessageSquare,
  Phone,
  Mail,
  Instagram,
  Search,
  Filter,
  AlertCircle,
  Server,
  CheckCircle
} from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';
import { useMCPServers } from '../hooks/useMCPServers';
import MissionControlAnalytics from '../components/MissionControlAnalytics';

// ============================================================
// Types
// ============================================================
type TabId = 'command-center' | 'inbox' | 'attention' | 'analytics' | 'alerts';

interface AgentCard {
  id: string;
  name: string;
  status: 'active' | 'processing' | 'idle' | 'error';
  statusContext: string;
  successRate: number;
  avgTime: number;
  costPerMsg: number;
  csat: number;
}

interface ThreadItem {
  id: string;
  customerName: string;
  lastMessage: string;
  lastMessageAt: string;
  channel: 'sms' | 'email' | 'voice' | 'instagram' | 'facebook';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'assigned' | 'resolved';
  unreadCount: number;
  escalationQueue?: boolean;
}

interface AttentionItem {
  id: string;
  type: 'thread' | 'agent';
  title: string;
  description: string;
  time: string;
  priority: 'high' | 'critical';
}

// ============================================================
// Mock Data (Static)
// ============================================================
const MOCK_AGENTS: AgentCard[] = [
  {
    id: '1',
    name: 'Voice Agent - Alpha',
    status: 'active',
    statusContext: 'Talking - 2:34',
    successRate: 98.5,
    avgTime: 1.2,
    costPerMsg: 0.15,
    csat: 9.2,
  },
  {
    id: '2',
    name: 'Chatbot - Beta',
    status: 'processing',
    statusContext: 'Handling 3 conversations',
    successRate: 95,
    avgTime: 0.8,
    costPerMsg: 0.05,
    csat: 8.8,
  },
  {
    id: '3',
    name: 'Support Bot',
    status: 'idle',
    statusContext: 'Waiting for tickets',
    successRate: 99,
    avgTime: 0.5,
    costPerMsg: 0.02,
    csat: 9.5,
  },
];

const MOCK_THREADS: ThreadItem[] = [
  {
    id: '1',
    customerName: 'Alice Johnson',
    lastMessage: 'I need help with my order #12345',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    channel: 'sms',
    priority: 'high',
    status: 'open',
    unreadCount: 1,
  },
  {
    id: '2',
    customerName: 'Bob Smith',
    lastMessage: 'Thanks for the update!',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    channel: 'email',
    priority: 'medium',
    status: 'resolved',
    unreadCount: 0,
  },
  {
    id: '3',
    customerName: 'Charlie Brown',
    lastMessage: 'Can I speak to a human?',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    channel: 'voice',
    priority: 'urgent',
    status: 'assigned',
    unreadCount: 2,
    escalationQueue: true,
  },
];

// ============================================================
// Sub-Components
// ============================================================

// KPI Card Component
const KPICard: React.FC<{
  label: string;
  value: string | number;
  subtext: string;
  subtextColor?: string;
}> = ({ label, value, subtext, subtextColor = 'text-green-500' }) => (
  <div className="bg-surface p-4 rounded-lg border border-border shadow-sm">
    <p className="text-subtle text-xs uppercase tracking-wide">{label}</p>
    <p className="text-2xl font-bold text-primary">{value}</p>
    <p className={`text-xs mt-1 flex items-center ${subtextColor}`}>
      <ArrowUpRight size={12} className="mr-1" /> {subtext}
    </p>
  </div>
);

// Agent Card Component
const AgentCardComponent: React.FC<{ agent: AgentCard }> = ({ agent }) => {
  const statusColor = {
    active: 'bg-green-500',
    processing: 'bg-yellow-500',
    error: 'bg-red-500',
    idle: 'bg-gray-400',
  }[agent.status];

  return (
    <div className="bg-surface rounded-lg p-4 border border-border shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${statusColor}`} />
          <div>
            <h3 className="font-semibold text-primary">{agent.name}</h3>
            <p className="text-xs text-secondary">{agent.statusContext}</p>
          </div>
        </div>
        <button className="text-secondary hover:text-primary transition-colors">
          <MoreHorizontal size={16} />
        </button>
      </div>

      {agent.status === 'active' && (
        <div className="mb-4">
          <div className="h-1 bg-surface-hover rounded-full overflow-hidden">
            <div className="h-full bg-green-500 animate-pulse w-2/3" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-surface-hover p-2 rounded">
          <p className="text-subtle">Success Rate</p>
          <p className="font-medium text-green-500">{agent.successRate}%</p>
        </div>
        <div className="bg-surface-hover p-2 rounded">
          <p className="text-subtle">Avg Time</p>
          <p className="font-medium text-primary">{agent.avgTime}s</p>
        </div>
        <div className="bg-surface-hover p-2 rounded">
          <p className="text-subtle">Cost/Msg</p>
          <p className="font-medium text-primary">${agent.costPerMsg}</p>
        </div>
        <div className="bg-surface-hover p-2 rounded">
          <p className="text-subtle">CSAT</p>
          <p className="font-medium text-purple-500">{agent.csat}</p>
        </div>
      </div>

      <div className="mt-4 flex space-x-2">
        <button className="flex-1 bg-surface-hover hover:bg-border text-xs py-1.5 rounded text-primary flex items-center justify-center space-x-1 transition-colors border border-border">
          <Pause size={12} /> <span>Pause</span>
        </button>
        <button className="flex-1 bg-surface-hover hover:bg-border text-xs py-1.5 rounded text-primary flex items-center justify-center space-x-1 transition-colors border border-border">
          <Settings size={12} /> <span>Config</span>
        </button>
      </div>
    </div>
  );
};

// MCP Servers Section Component
const MCPServersSection: React.FC = () => {
  const { servers, loading, toggleServer } = useMCPServers();

  if (loading) {
    return (
      <div className="bg-surface rounded-lg border border-border p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-primary mb-4 flex items-center">
          <Server size={16} className="mr-2 text-accent" /> MCP Servers
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
        </div>
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className="bg-surface rounded-lg border border-border p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-primary mb-4 flex items-center">
          <Server size={16} className="mr-2 text-accent" /> MCP Servers
        </h3>
        <div className="text-center py-6 text-secondary">
          <Server size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No MCP servers configured for your organization.</p>
          <p className="text-xs text-subtle mt-1">Contact your administrator to set up servers.</p>
        </div>
      </div>
    );
  }

  const getHealthColor = (status: string) => {
    return status === 'healthy' ? 'text-green-500' : 'text-red-500';
  };

  const HealthIcon = ({ status }: { status: string }) => {
    return status === 'healthy' 
      ? <CheckCircle size={14} className="text-green-500" />
      : <AlertCircle size={14} className="text-red-500" />;
  };

  return (
    <div className="bg-surface rounded-lg border border-border p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-primary mb-4 flex items-center">
        <Server size={16} className="mr-2 text-accent" /> MCP Servers
      </h3>
      <div className="space-y-3">
        {servers.map((server) => (
          <div 
            key={server.id} 
            className="flex items-center justify-between p-3 bg-surface-hover rounded-lg border border-border"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Server size={14} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-primary text-sm">{server.name}</span>
                  <HealthIcon status={server.health_status} />
                </div>
                <span className="text-xs text-subtle">{server.server_type}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-0.5 rounded ${
                server.status === 'active' 
                  ? 'bg-green-500/10 text-green-600' 
                  : 'bg-gray-500/10 text-gray-500'
              }`}>
                {server.status}
              </span>
              <button
                onClick={() => toggleServer(server.id)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  server.is_enabled !== false ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
                title={server.is_enabled !== false ? 'Disable server' : 'Enable server'}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    server.is_enabled !== false ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Command Center Tab Content
const CommandCenterTab: React.FC = () => {
  const activeAgents = MOCK_AGENTS.filter(a => a.status === 'active' || a.status === 'processing').length;
  const activeThreads = MOCK_THREADS.filter(t => t.status === 'open').length;
  const urgentThreads = MOCK_THREADS.filter(t => t.priority === 'urgent').length;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard label="Total Sales (Won)" value="$0.00" subtext="Lifetime" />
        <KPICard 
          label="Active Conversations" 
          value={activeThreads} 
          subtext={`${urgentThreads} require attention`}
          subtextColor="text-accent"
        />
        <KPICard 
          label="Avg Response Time" 
          value="--" 
          subtext="Calculating..."
          subtextColor="text-subtle"
        />
        <KPICard label="Total Leads" value="0" subtext="+0 today" />
      </div>

      {/* Agent Status Section */}
      <section>
        <h2 className="text-lg font-semibold text-primary mb-4">Agent Status & Live Activity</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {MOCK_AGENTS.map(agent => (
            <AgentCardComponent key={agent.id} agent={agent} />
          ))}
        </div>
      </section>

      {/* MCP Servers Section */}
      <MCPServersSection />

      {/* Live Interactions */}
      <div className="bg-surface rounded-lg border border-border p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-primary mb-3 flex items-center">
          <Activity size={16} className="mr-2 text-accent" /> Live Interactions
        </h3>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="bg-surface-hover p-3 rounded text-sm border-l-2 border-green-500">
              <div className="flex justify-between text-xs text-subtle mb-1">
                <span>Agent Alpha vs. Customer #{100 + i}</span>
                <span>Just now</span>
              </div>
              <p className="text-secondary">
                "I can definitely help you with that refund. Could you please confirm your order number?"
              </p>
              <button className="mt-2 text-accent hover:text-accent-hover text-xs">
                Take Over Conversation
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Unified Inbox Tab Content
const UnifiedInboxTab: React.FC = () => {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedThread = MOCK_THREADS.find(t => t.id === selectedThreadId);

  const getChannelIcon = (channel: string) => {
    const icons: Record<string, React.ReactNode> = {
      sms: <MessageSquare size={16} className="text-green-500" />,
      email: <Mail size={16} className="text-accent" />,
      voice: <Phone size={16} className="text-purple-500" />,
      instagram: <Instagram size={16} className="text-pink-500" />,
    };
    return icons[channel] || <MessageSquare size={16} />;
  };

  const channels = [
    { id: 'all', label: 'All Messages', icon: <User size={18} />, count: 12 },
    { id: 'sms', label: 'SMS', icon: <MessageSquare size={18} />, count: 5 },
    { id: 'email', label: 'Email', icon: <Mail size={18} />, count: 2 },
    { id: 'social', label: 'Social', icon: <Instagram size={18} />, count: 4 },
    { id: 'voice', label: 'Voice', icon: <Phone size={18} />, count: 1 },
  ];

  return (
    <div className="flex h-[600px] bg-page border border-border rounded-lg overflow-hidden shadow-sm">
      {/* Left Sidebar - Channels */}
      <div className="w-16 md:w-64 bg-surface border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-primary font-semibold hidden md:block">Inbox</h2>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {channels.map(item => (
            <button
              key={item.id}
              className="w-full flex items-center p-3 text-secondary hover:bg-surface-hover hover:text-primary transition-colors"
            >
              <span className="mx-auto md:mx-0">{item.icon}</span>
              <span className="ml-3 hidden md:block text-sm font-medium flex-1 text-left">{item.label}</span>
              {item.count > 0 && (
                <span className="hidden md:flex items-center justify-center w-5 h-5 text-xs font-bold bg-accent text-white rounded-full">
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Middle Column - Thread List */}
      <div className="w-80 md:w-96 bg-surface/50 border-r border-border flex flex-col">
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-subtle" />
            <input
              type="text"
              placeholder="Search messages..."
              className="w-full bg-surface text-sm text-primary pl-9 pr-3 py-2 rounded border border-border focus:outline-none focus:border-accent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-secondary">
            <span>Sort by: recent</span>
            <button className="flex items-center hover:text-primary">
              <Filter size={12} className="mr-1" /> Filter
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {MOCK_THREADS.map(thread => (
            <div
              key={thread.id}
              onClick={() => setSelectedThreadId(thread.id)}
              className={`p-4 border-b border-border cursor-pointer hover:bg-surface-hover transition-colors ${
                selectedThreadId === thread.id ? 'bg-surface-hover border-l-2 border-l-accent' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-primary truncate pr-2">{thread.customerName}</span>
                <span className="text-xs text-subtle whitespace-nowrap">
                  {new Date(thread.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex items-center text-xs text-secondary mb-1 space-x-2">
                {getChannelIcon(thread.channel)}
                {thread.priority === 'urgent' && (
                  <span className="text-red-500 flex items-center">
                    <AlertCircle size={10} className="mr-1" /> Urgent
                  </span>
                )}
                {thread.status === 'assigned' && <span className="text-accent">Assigned</span>}
              </div>
              <p className="text-sm text-secondary truncate">{thread.lastMessage}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column - Conversation View */}
      <div className="flex-1 bg-page flex flex-col">
        {selectedThread ? (
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-border flex justify-between items-center bg-surface">
              <div>
                <h3 className="text-lg font-semibold text-primary">{selectedThread.customerName}</h3>
                <div className="flex items-center gap-2 text-xs text-secondary">
                  {getChannelIcon(selectedThread.channel)}
                  <span className="capitalize">via {selectedThread.channel}</span>
                </div>
              </div>
              <button className="px-3 py-1 bg-accent hover:bg-accent-hover text-white text-sm rounded transition-colors">
                Resolve Thread
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-page">
              <div className="flex justify-start">
                <div className="max-w-[70%] bg-surface border border-border rounded-2xl rounded-tl-none p-3 text-primary shadow-sm">
                  <p className="text-sm">{selectedThread.lastMessage}</p>
                  <span className="text-[10px] text-subtle block mt-1">
                    {new Date(selectedThread.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-surface">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Type a reply..."
                  className="flex-1 bg-surface border border-border rounded-lg p-3 text-primary text-sm focus:outline-none focus:border-accent"
                />
                <button className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent-hover transition-colors font-medium text-sm">
                  Send
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-subtle flex-col bg-page">
            <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4 border border-border">
              <MessageSquare size={32} className="opacity-50" />
            </div>
            <p className="font-medium">Select a conversation to start messaging</p>
            <p className="text-sm opacity-60 mt-1">Choose a thread from the list on the left</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Needs Attention Tab Content
const NeedsAttentionTab: React.FC = () => {
  const attentionItems: AttentionItem[] = useMemo(() => {
    const items: AttentionItem[] = [];
    
    MOCK_THREADS.filter(t => t.priority === 'urgent' || t.escalationQueue).forEach(t => {
      items.push({
        id: t.id,
        type: 'thread',
        title: `Urgent: ${t.customerName}`,
        description: t.lastMessage,
        time: t.lastMessageAt,
        priority: 'high',
      });
    });

    return items;
  }, []);

  if (attentionItems.length === 0) {
    return (
      <div className="bg-surface rounded-lg border border-border p-12 text-center shadow-sm">
        <AlertTriangle size={48} className="mx-auto text-green-500 mb-4" />
        <h3 className="text-xl font-medium text-primary">All Clear</h3>
        <p className="text-secondary mt-2">No urgent items in the queue. Good job!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-primary mb-4">Items Requiring Attention</h3>
      <div className="grid gap-4">
        {attentionItems.map((item) => (
          <div
            key={item.id}
            className="bg-surface p-4 rounded-lg border border-border flex items-start justify-between hover:bg-surface-hover transition-colors shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div
                className={`p-2 rounded-full ${
                  item.priority === 'critical' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                }`}
              >
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="font-medium text-primary">{item.title}</h4>
                <p className="text-sm text-secondary">{item.description}</p>
                <span className="text-xs text-subtle mt-1 block">
                  {new Date(item.time).toLocaleString()}
                </span>
              </div>
            </div>
            <button className="px-3 py-1 bg-surface-hover hover:bg-border text-sm text-primary rounded border border-border transition-colors">
              View
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Alerts Tab Content
const AlertsTab: React.FC = () => (
  <div className="bg-surface rounded-lg border border-border p-12 text-center shadow-sm">
    <Bell size={48} className="mx-auto text-red-500 mb-4" />
    <h3 className="text-xl font-medium text-primary">Alert Center</h3>
    <p className="text-secondary mt-2">System health and notifications.</p>
  </div>
);

// ============================================================
// Main Component
// ============================================================
const MissionControl: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('command-center');
  const { currentOrganization } = useOrganization();

  const activeAgents = MOCK_AGENTS.filter(a => a.status === 'active' || a.status === 'processing').length;
  const attentionCount = MOCK_THREADS.filter(t => t.priority === 'urgent' || t.escalationQueue).length;

  const tabs = [
    { id: 'command-center' as TabId, label: 'Command Center', icon: <LayoutDashboard size={18} /> },
    { id: 'inbox' as TabId, label: 'Unified Inbox', icon: <Inbox size={18} /> },
    { id: 'attention' as TabId, label: 'Needs Attention', icon: <AlertTriangle size={18} />, count: attentionCount },
    { id: 'analytics' as TabId, label: 'Analytics', icon: <BarChart2 size={18} /> },
    { id: 'alerts' as TabId, label: 'Alerts', icon: <Bell size={18} /> },
  ];

  const handleTabChange = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'command-center':
        return <CommandCenterTab />;
      case 'inbox':
        return <UnifiedInboxTab />;
      case 'attention':
        return <NeedsAttentionTab />;
      case 'analytics':
        return <MissionControlAnalytics />;
      case 'alerts':
        return <AlertsTab />;
      default:
        return <CommandCenterTab />;
    }
  };

  return (
    <div className="min-h-screen bg-page text-primary transition-colors duration-200">
      {/* Header */}
      <header className="bg-surface border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-2">
          <Shield className="text-accent" size={24} />
          <h1 className="text-xl font-bold tracking-tight text-primary">
            Neuro-Ops BOS <span className="text-subtle font-normal">| Mission Control</span>
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex space-x-1 text-xs">
            <span className="px-2 py-1 bg-green-500/10 text-green-600 rounded border border-green-500/20">
              System Online
            </span>
            <span className="px-2 py-1 bg-accent-subtle text-accent-text rounded border border-accent/20">
              {activeAgents} Agents Active
            </span>
          </div>
          <div className="w-8 h-8 bg-surface-hover rounded-full flex items-center justify-center text-secondary border border-border">
            <User size={16} />
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="px-6 border-b border-border bg-surface/50 backdrop-blur-sm sticky top-[65px] z-10">
        <div className="flex space-x-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-secondary hover:text-primary hover:border-border-strong'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count ? (
                <span className="ml-2 bg-red-500/10 text-red-500 text-xs px-1.5 py-0.5 rounded-full">
                  {tab.count}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="p-6">{renderTabContent()}</main>
    </div>
  );
};

export default MissionControl;
