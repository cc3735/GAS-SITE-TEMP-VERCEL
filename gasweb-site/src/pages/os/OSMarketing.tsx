import { useState, useEffect } from 'react';
import { Mail, Share2, Plus, Calendar, Megaphone, Users, TrendingUp, X, Send, Target, Sparkles, Heart, ShoppingCart, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useAuth } from '../../contexts/AuthContext';

type TabType = 'campaigns' | 'social';

type CampaignTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ComponentType<any>;
  color: string;
  metrics: {
    estimatedOpens: string;
    estimatedClicks: string;
    sendTime: string;
  };
};

interface Campaign {
  id: string;
  name: string;
  subject: string;
  description: string | null;
  audience: string;
  template_id: string | null;
  status: string;
  scheduled_at: string | null;
  created_at: string;
}

export default function OSMarketing() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('campaigns');
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [saving, setSaving] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    subject: '',
    description: '',
    audience: 'all',
    sendDate: '',
    templateId: ''
  });

  const campaignTemplates: CampaignTemplate[] = [
    { id: 'welcome-series', name: 'Welcome Series', description: '5-email automated welcome flow', category: 'Onboarding', icon: Sparkles, color: 'bg-blue-500', metrics: { estimatedOpens: '35-45%', estimatedClicks: '8-12%', sendTime: 'Immediate + 3, 7, 14, 21 days' } },
    { id: 'product-launch', name: 'Product Launch', description: 'Build anticipation for new features', category: 'Announcements', icon: Target, color: 'bg-green-500', metrics: { estimatedOpens: '28-38%', estimatedClicks: '12-18%', sendTime: '2 weeks before, 1 week before, launch day' } },
    { id: 're-engagement', name: 'Re-engagement', description: 'Win back inactive subscribers', category: 'Nurture', icon: Heart, color: 'bg-purple-500', metrics: { estimatedOpens: '22-32%', estimatedClicks: '6-10%', sendTime: '30 days of inactivity' } },
    { id: 'promotional', name: 'Promotional Sale', description: 'Drive conversions with special offers', category: 'Sales', icon: ShoppingCart, color: 'bg-orange-500', metrics: { estimatedOpens: '40-50%', estimatedClicks: '15-25%', sendTime: 'Immediately after signup' } },
    { id: 'educational', name: 'Educational Content', description: 'Share valuable tips and resources', category: 'Content', icon: Send, color: 'bg-indigo-500', metrics: { estimatedOpens: '25-35%', estimatedClicks: '10-15%', sendTime: 'Weekly, Friday morning' } },
    { id: 'seasonal', name: 'Seasonal Campaign', description: 'Holiday and seasonal messaging', category: 'Events', icon: Calendar, color: 'bg-pink-500', metrics: { estimatedOpens: '30-40%', estimatedClicks: '12-18%', sendTime: 'Date-specific triggers' } },
  ];

  const tabs = [
    { id: 'campaigns' as const, name: 'Campaigns & Marketing', icon: Mail },
    { id: 'social' as const, name: 'Social Media', icon: Share2 },
  ];

  useEffect(() => {
    if (currentOrganization) fetchCampaigns();
  }, [currentOrganization]);

  const fetchCampaigns = async () => {
    if (!currentOrganization) return;
    setLoadingCampaigns(true);
    const { data } = await supabase
      .from('marketing_campaigns')
      .select('*')
      .eq('organization_id', currentOrganization.id)
      .order('created_at', { ascending: false });
    setCampaigns(data ?? []);
    setLoadingCampaigns(false);
  };

  const handleTemplateSelect = (template: CampaignTemplate) => {
    setSelectedTemplate(template);
    setCampaignForm({
      name: `${template.name} Campaign`,
      subject: `Default ${template.name} subject line`,
      description: template.description,
      audience: 'all',
      sendDate: new Date().toISOString().split('T')[0],
      templateId: template.id
    });
    setShowCampaignModal(true);
  };

  const handleCreateCampaign = async () => {
    if (!currentOrganization || !user || saving) return;
    setSaving(true);
    const { error } = await supabase.from('marketing_campaigns').insert({
      organization_id: currentOrganization.id,
      created_by: user.id,
      name: campaignForm.name.trim(),
      subject: campaignForm.subject.trim(),
      description: campaignForm.description || null,
      audience: campaignForm.audience,
      template_id: campaignForm.templateId || null,
      status: campaignForm.sendDate ? 'scheduled' : 'draft',
      scheduled_at: campaignForm.sendDate ? new Date(campaignForm.sendDate).toISOString() : null,
    });
    setSaving(false);
    if (error) {
      console.error('Failed to create campaign:', error);
      return;
    }
    setShowCampaignModal(false);
    setSelectedTemplate(null);
    setCampaignForm({ name: '', subject: '', description: '', audience: 'all', sendDate: '', templateId: '' });
    fetchCampaigns();
  };

  const handleDeleteCampaign = async (id: string) => {
    await supabase.from('marketing_campaigns').delete().eq('id', id);
    setCampaigns(prev => prev.filter(c => c.id !== id));
  };

  const handleStatusChange = async (id: string, status: string) => {
    await supabase.from('marketing_campaigns').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  const activeCampaigns = campaigns.filter(c => c.status === 'scheduled' || c.status === 'sending');

  const statusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-700 text-gray-300';
      case 'scheduled': return 'bg-blue-900/30 text-blue-400';
      case 'sending': return 'bg-yellow-900/30 text-yellow-400';
      case 'sent': return 'bg-green-900/30 text-green-400';
      case 'paused': return 'bg-orange-900/30 text-orange-400';
      case 'cancelled': return 'bg-red-900/30 text-red-400';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="w-8 h-8 text-primary-400" />
        <h1 className="text-3xl font-bold text-white">Marketing & Social Media</h1>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'
                }`}
              >
                <Icon className={`-ml-0.5 mr-2 h-5 w-5 ${activeTab === tab.id ? 'text-primary-400' : 'text-gray-400 group-hover:text-gray-500'}`} />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Marketing Campaigns</h2>
              <p className="text-sm text-gray-400">Create and manage email campaigns and marketing automation</p>
            </div>
            <button
              onClick={() => setShowCampaignModal(true)}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
            >
              <Plus className="w-5 h-5" />
              New Campaign
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-primary-400" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Active Campaigns</h3>
              <p className="text-3xl font-bold text-white mb-2">{activeCampaigns.length}</p>
              <p className="text-sm text-gray-500">{campaigns.length} total</p>
            </div>

            <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-900/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-400" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Draft Campaigns</h3>
              <p className="text-3xl font-bold text-white mb-2">{campaigns.filter(c => c.status === 'draft').length}</p>
              <p className="text-sm text-gray-500">Ready to schedule</p>
            </div>

            <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Megaphone className="w-6 h-6 text-purple-400" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Sent Campaigns</h3>
              <p className="text-3xl font-bold text-white mb-2">{campaigns.filter(c => c.status === 'sent').length}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </div>

          {/* Campaign List */}
          {loadingCampaigns ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            </div>
          ) : campaigns.length > 0 ? (
            <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">Your Campaigns</h3>
              </div>
              <div className="divide-y divide-gray-800">
                {campaigns.map(campaign => (
                  <div key={campaign.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-medium text-white truncate">{campaign.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Subject: {campaign.subject}
                        {campaign.scheduled_at && ` · Scheduled: ${new Date(campaign.scheduled_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span className={`text-xs px-2 py-1 rounded capitalize ${statusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                      <select
                        value={campaign.status}
                        onChange={(e) => handleStatusChange(campaign.id, e.target.value)}
                        className="text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-300"
                      >
                        <option value="draft">Draft</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="paused">Paused</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="sent">Sent</option>
                      </select>
                      <button
                        onClick={() => handleDeleteCampaign(campaign.id)}
                        className="text-gray-500 hover:text-red-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Campaign Templates */}
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Campaign Templates</h3>
                <p className="text-gray-400">Choose from proven campaign templates to get started</p>
              </div>
              <button
                onClick={() => setShowCampaignModal(true)}
                className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
              >
                <Plus className="w-4 h-4" />
                Custom Campaign
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaignTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className="group p-6 border-2 border-gray-700 rounded-lg hover:border-primary-600 hover:bg-primary-900/20 transition text-left"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 ${template.color} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-1">{template.name}</h4>
                        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">{template.category}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">{template.description}</p>
                    <div className="space-y-2 text-xs text-gray-500">
                      <div className="flex justify-between">
                        <span>Est. Opens:</span>
                        <span className="font-medium">{template.metrics.estimatedOpens}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Est. Clicks:</span>
                        <span className="font-medium">{template.metrics.estimatedClicks}</span>
                      </div>
                      <div className="text-xs"><span>Send Timing:</span></div>
                      <div className="text-xs text-gray-500 mt-1">{template.metrics.sendTime}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Social Media Tab */}
      {activeTab === 'social' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Social Media Management</h2>
              <p className="text-sm text-gray-400">Schedule posts and manage social media accounts</p>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-700 p-8">
            <div className="text-center">
              <Share2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Connect Social Media Accounts</h3>
              <p className="text-gray-400 mb-6">
                Connect your social media accounts to start posting and managing your social presence.
                Social posting integration is coming soon.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Creation Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {selectedTemplate ? `Create ${selectedTemplate.name} Campaign` : 'Create Custom Campaign'}
                </h2>
                {selectedTemplate && <p className="text-sm text-gray-400 mt-1">{selectedTemplate.description}</p>}
              </div>
              <button onClick={() => { setShowCampaignModal(false); setSelectedTemplate(null); }} className="text-gray-400 hover:text-gray-300">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Campaign Name <span className="text-red-500">*</span></label>
                  <input type="text" value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-800 text-white placeholder-gray-500" placeholder="Enter campaign name" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email Subject <span className="text-red-500">*</span></label>
                  <input type="text" value={campaignForm.subject} onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-800 text-white placeholder-gray-500" placeholder="Enter email subject line" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Target Audience</label>
                    <select value={campaignForm.audience} onChange={(e) => setCampaignForm({ ...campaignForm, audience: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-800 text-white">
                      <option value="all">All Subscribers</option>
                      <option value="active">Active Users</option>
                      <option value="inactive">Inactive Users</option>
                      <option value="new">New Subscribers</option>
                      <option value="leads">Lead Prospects</option>
                      <option value="customers">Existing Customers</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Send Date</label>
                    <input type="date" value={campaignForm.sendDate} onChange={(e) => setCampaignForm({ ...campaignForm, sendDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-800 text-white placeholder-gray-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Campaign Description</label>
                  <textarea value={campaignForm.description} onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })} rows={3}
                    className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none bg-gray-800 text-white placeholder-gray-500" placeholder="Describe the campaign goals and content..." />
                </div>

                {selectedTemplate && (
                  <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-8 h-8 ${selectedTemplate.color} rounded-lg flex items-center justify-center`}>
                        <selectedTemplate.icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{selectedTemplate.name} Template</h4>
                        <p className="text-sm text-gray-400">{selectedTemplate.category} campaign</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Estimated Opens:</span>
                        <p className="font-semibold text-white">{selectedTemplate.metrics.estimatedOpens}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Estimated Clicks:</span>
                        <p className="font-semibold text-white">{selectedTemplate.metrics.estimatedClicks}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-700 mt-6">
                <button type="button" onClick={() => { setShowCampaignModal(false); setSelectedTemplate(null); }}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition">Cancel</button>
                <button type="button" onClick={handleCreateCampaign}
                  disabled={!campaignForm.name.trim() || !campaignForm.subject.trim() || saving}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {saving ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
