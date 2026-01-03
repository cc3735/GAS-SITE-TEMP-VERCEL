import { useState } from 'react';
import { useIntakeDashboard, useNudgeCampaigns } from '../hooks/useIntakeNudge';
import { 
  Activity, 
  Users, 
  Ghost, 
  CheckCircle, 
  ArrowRight, 
  Zap, 
  Clock, 
  Mail, 
  MessageSquare, 
  Play, 
  Pause, 
  Edit, 
  Trash2,
  Magnet,
  Target
} from 'lucide-react';

type TabType = 'intake' | 'nudge';

export default function LeadEngagement() {
  const [activeTab, setActiveTab] = useState<TabType>('intake');
  
  const tabs = [
    { id: 'intake' as TabType, name: 'Lead Intake', icon: Magnet },
    { id: 'nudge' as TabType, name: 'Nudge Campaigns', icon: Zap },
  ];

  return (
    <div className="p-8 bg-page min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-primary">Lead Engagement</h1>
        </div>
        <p className="text-secondary">Capture, classify, and re-engage leads with intelligent automation.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface border border-border rounded-lg p-1 mb-8 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'text-secondary hover:text-primary hover:bg-surface-hover'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'intake' && <LeadIntakeContent />}
      {activeTab === 'nudge' && <NudgeCampaignsContent />}
    </div>
  );
}

function LeadIntakeContent() {
  const { events, stats, loading } = useIntakeDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-surface p-6 rounded-xl shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
              <Users size={24} />
            </div>
            <span className="text-sm font-medium text-secondary">Total Leads</span>
          </div>
          <p className="text-3xl font-bold text-primary">{stats.totalLeads}</p>
        </div>
        <div className="bg-surface p-6 rounded-xl shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
              <Activity size={24} />
            </div>
            <span className="text-sm font-medium text-secondary">High Intent</span>
          </div>
          <p className="text-3xl font-bold text-primary">{stats.highIntent}</p>
        </div>
        <div className="bg-surface p-6 rounded-xl shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600">
              <Ghost size={24} />
            </div>
            <span className="text-sm font-medium text-secondary">Ghosting</span>
          </div>
          <p className="text-3xl font-bold text-primary">{stats.ghosting}</p>
        </div>
        <div className="bg-surface p-6 rounded-xl shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600">
              <CheckCircle size={24} />
            </div>
            <span className="text-sm font-medium text-secondary">Converted</span>
          </div>
          <p className="text-3xl font-bold text-primary">{stats.converted}</p>
        </div>
      </div>

      {/* Live Feed */}
      <div className="bg-surface rounded-xl shadow-sm border border-border">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-semibold text-primary">Live Intake Feed</h2>
          <span className="text-xs font-medium text-green-600 flex items-center bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Live
          </span>
        </div>
        <div className="divide-y divide-border">
          {events.length === 0 ? (
            <div className="p-12 text-center text-secondary">
              <Magnet className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No intake events yet. Leads will appear here as they come in.</p>
            </div>
          ) : (
            events.map(event => (
              <div key={event.id} className="p-6 hover:bg-surface-hover transition-colors flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white
                    ${event.intentCategory === 'high_value' ? 'bg-purple-600' : 
                      event.intentCategory === 'engaged' ? 'bg-blue-600' : 'bg-gray-400'}`}>
                    {event.intentScore}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-primary capitalize">{event.eventType.replace('_', ' ')}</span>
                      <span className="text-xs px-2 py-0.5 bg-page text-secondary rounded capitalize">{event.source}</span>
                    </div>
                    <p className="text-sm text-secondary">Intent: <span className="capitalize">{event.intentCategory.replace('_', ' ')}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-subtle">
                    {new Date(event.createdAt).toLocaleTimeString()}
                  </span>
                  <button className="p-2 hover:bg-surface-hover rounded-full text-subtle hover:text-primary">
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function NudgeCampaignsContent() {
  const { campaigns, loading } = useNudgeCampaigns();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Campaign Button */}
      <div className="flex justify-end">
        <button className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-accent-foreground px-4 py-2 rounded-lg transition">
          <Zap size={18} />
          Create Campaign
        </button>
      </div>

      {/* Campaigns List */}
      <div className="grid grid-cols-1 gap-6">
        {campaigns.map(campaign => (
          <div key={campaign.id} className="bg-surface rounded-xl shadow-sm border border-border p-6 flex items-center justify-between">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${campaign.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-gray-100 dark:bg-gray-800 text-subtle'}`}>
                {campaign.channel === 'sms' ? <MessageSquare size={24} /> : <Mail size={24} />}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary">{campaign.name}</h3>
                <div className="flex items-center gap-4 text-sm text-secondary mt-1">
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> Delay: {campaign.delayHours}h
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap size={14} /> Trigger: {campaign.triggerState}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{campaign.totalSent}</p>
                <p className="text-xs text-secondary uppercase">Sent</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{campaign.totalConverted}</p>
                <p className="text-xs text-secondary uppercase">Converted</p>
              </div>
              <div className="w-px h-10 bg-border mx-4"></div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-subtle hover:text-accent hover:bg-accent-subtle rounded-lg transition">
                  <Edit size={18} />
                </button>
                <button className="p-2 text-subtle hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition">
                  <Trash2 size={18} />
                </button>
                <button className={`p-2 rounded-lg transition ${campaign.isActive ? 'text-green-600 bg-green-50 dark:bg-green-900/30' : 'text-subtle bg-surface-hover'}`}>
                  {campaign.isActive ? <Pause size={18} /> : <Play size={18} />}
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Create New Nudge Card */}
        <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-accent hover:bg-accent-subtle transition cursor-pointer group">
          <div className="w-12 h-12 bg-surface-hover rounded-full flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-accent-foreground text-subtle">
            <Zap size={24} />
          </div>
          <h3 className="text-lg font-medium text-primary mb-1">Create New Nudge</h3>
          <p className="text-sm text-secondary">Set up a new automated workflow</p>
        </div>
      </div>
    </div>
  );
}

