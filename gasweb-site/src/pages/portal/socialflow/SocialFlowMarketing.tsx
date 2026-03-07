import { useState, useEffect } from 'react';
import { Plus, Mail, Share2, Calendar, Send, Target, Sparkles, Heart, ShoppingCart, X, TrendingUp, Users, Megaphone, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useOrganization } from '../../../contexts/OrganizationContext';
import { useAuth } from '../../../contexts/AuthContext';

type MarketingSubTab = 'campaigns' | 'social';

type CampaignTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ComponentType<any>;
  color: string;
  metrics: { estimatedOpens: string; estimatedClicks: string; sendTime: string };
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

const campaignTemplates: CampaignTemplate[] = [
  { id: 'welcome-series', name: 'Welcome Series', description: '5-email automated welcome flow', category: 'Onboarding', icon: Sparkles, color: 'bg-blue-500', metrics: { estimatedOpens: '35-45%', estimatedClicks: '8-12%', sendTime: 'Immediate + 3, 7, 14, 21 days' } },
  { id: 'product-launch', name: 'Product Launch', description: 'Build anticipation for new features', category: 'Announcements', icon: Target, color: 'bg-green-500', metrics: { estimatedOpens: '28-38%', estimatedClicks: '12-18%', sendTime: '2 weeks before, 1 week before, launch day' } },
  { id: 're-engagement', name: 'Re-engagement', description: 'Win back inactive subscribers', category: 'Nurture', icon: Heart, color: 'bg-purple-500', metrics: { estimatedOpens: '22-32%', estimatedClicks: '6-10%', sendTime: '30 days of inactivity' } },
  { id: 'promotional', name: 'Promotional Sale', description: 'Drive conversions with special offers', category: 'Sales', icon: ShoppingCart, color: 'bg-orange-500', metrics: { estimatedOpens: '40-50%', estimatedClicks: '15-25%', sendTime: 'Immediately after signup' } },
  { id: 'educational', name: 'Educational Content', description: 'Share valuable tips and resources', category: 'Content', icon: Send, color: 'bg-indigo-500', metrics: { estimatedOpens: '25-35%', estimatedClicks: '10-15%', sendTime: 'Weekly, Friday morning' } },
  { id: 'seasonal', name: 'Seasonal Campaign', description: 'Holiday and seasonal messaging', category: 'Events', icon: Calendar, color: 'bg-pink-500', metrics: { estimatedOpens: '30-40%', estimatedClicks: '12-18%', sendTime: 'Date-specific triggers' } },
];

export default function SocialFlowMarketing() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const [marketingSubTab, setMarketingSubTab] = useState<MarketingSubTab>('campaigns');
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [saving, setSaving] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: '', subject: '', description: '', audience: 'all', sendDate: '', templateId: '',
  });

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
      templateId: template.id,
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

  const statusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-slate-100 text-slate-600';
      case 'scheduled': return 'bg-blue-50 text-blue-600';
      case 'sending': return 'bg-yellow-50 text-yellow-700';
      case 'sent': return 'bg-green-50 text-green-600';
      case 'paused': return 'bg-orange-50 text-orange-600';
      case 'cancelled': return 'bg-red-50 text-red-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const activeCampaigns = campaigns.filter(c => c.status === 'scheduled' || c.status === 'sending');

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Marketing & Social</h1>
          <p className="text-slate-500 text-sm mt-1">Manage campaigns, marketing, and social media.</p>
        </div>
        {marketingSubTab === 'campaigns' && (
          <button onClick={() => setShowCampaignModal(true)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition">
            <Plus className="w-5 h-5" />
            New Campaign
          </button>
        )}
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex gap-4 mb-6">
        <button onClick={() => setMarketingSubTab('campaigns')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${marketingSubTab === 'campaigns' ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
          <Mail className="w-4 h-4" /> Campaigns & Marketing
        </button>
        <button onClick={() => setMarketingSubTab('social')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${marketingSubTab === 'social' ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
          <Share2 className="w-4 h-4" /> Social Media
        </button>
      </div>

      {/* Campaigns Sub-Tab */}
      {marketingSubTab === 'campaigns' && (
        <div>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center"><Mail className="w-6 h-6 text-blue-600" /></div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-sm font-medium text-slate-500 mb-1">Active Campaigns</h3>
              <p className="text-3xl font-bold text-slate-900 mb-2">{activeCampaigns.length}</p>
              <p className="text-sm text-slate-400">{campaigns.length} total</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center"><Users className="w-6 h-6 text-green-600" /></div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-sm font-medium text-slate-500 mb-1">Draft Campaigns</h3>
              <p className="text-3xl font-bold text-slate-900 mb-2">{campaigns.filter(c => c.status === 'draft').length}</p>
              <p className="text-sm text-slate-400">Ready to schedule</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center"><Megaphone className="w-6 h-6 text-purple-600" /></div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-sm font-medium text-slate-500 mb-1">Sent Campaigns</h3>
              <p className="text-3xl font-bold text-slate-900 mb-2">{campaigns.filter(c => c.status === 'sent').length}</p>
              <p className="text-sm text-slate-400">Completed</p>
            </div>
          </div>

          {/* Campaign List */}
          {loadingCampaigns ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : campaigns.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Your Campaigns</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {campaigns.map(campaign => (
                  <div key={campaign.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-medium text-slate-900 truncate">{campaign.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Subject: {campaign.subject}
                        {campaign.scheduled_at && ` · Scheduled: ${new Date(campaign.scheduled_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span className={`text-xs px-2 py-1 rounded capitalize ${statusColor(campaign.status)}`}>{campaign.status}</span>
                      <button onClick={() => handleDeleteCampaign(campaign.id)} className="text-slate-400 hover:text-red-500 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Templates */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Campaign Templates</h3>
                <p className="text-slate-500">Choose from proven campaign templates to get started</p>
              </div>
              <button onClick={() => setShowCampaignModal(true)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition">
                <Plus className="w-4 h-4" /> Custom Campaign
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaignTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <button key={template.id} onClick={() => handleTemplateSelect(template)}
                    className="group p-6 border-2 border-slate-200 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition text-left">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 ${template.color} rounded-lg flex items-center justify-center`}><Icon className="w-5 h-5 text-white" /></div>
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-1">{template.name}</h4>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{template.category}</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 mb-4">{template.description}</p>
                    <div className="space-y-2 text-xs text-slate-400">
                      <div className="flex justify-between"><span>Est. Opens:</span><span className="font-medium">{template.metrics.estimatedOpens}</span></div>
                      <div className="flex justify-between"><span>Est. Clicks:</span><span className="font-medium">{template.metrics.estimatedClicks}</span></div>
                      <div className="text-xs"><span>Send Timing:</span></div>
                      <div className="text-xs text-slate-400 mt-1">{template.metrics.sendTime}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Social Media Sub-Tab */}
      {marketingSubTab === 'social' && (
        <div>
          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            <div className="text-center">
              <Share2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Connect Social Media Accounts</h3>
              <p className="text-slate-500 mb-6">
                Connect your social media accounts to start posting and managing your social presence.
                Social posting integration is coming soon.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Creation Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {selectedTemplate ? `Create ${selectedTemplate.name} Campaign` : 'Create Custom Campaign'}
                </h2>
                {selectedTemplate && <p className="text-sm text-slate-500 mt-1">{selectedTemplate.description}</p>}
              </div>
              <button onClick={() => { setShowCampaignModal(false); setSelectedTemplate(null); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Campaign Name <span className="text-red-500">*</span></label>
                <input type="text" value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="Enter campaign name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Subject <span className="text-red-500">*</span></label>
                <input type="text" value={campaignForm.subject} onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="Enter email subject line" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Target Audience</label>
                  <select value={campaignForm.audience} onChange={(e) => setCampaignForm({ ...campaignForm, audience: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none">
                    <option value="all">All Subscribers</option>
                    <option value="active">Active Users</option>
                    <option value="inactive">Inactive Users</option>
                    <option value="new">New Subscribers</option>
                    <option value="leads">Lead Prospects</option>
                    <option value="customers">Existing Customers</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Send Date</label>
                  <input type="date" value={campaignForm.sendDate} onChange={(e) => setCampaignForm({ ...campaignForm, sendDate: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Campaign Description</label>
                <textarea value={campaignForm.description} onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })} rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none" placeholder="Describe the campaign goals and content..." />
              </div>
              {selectedTemplate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 ${selectedTemplate.color} rounded-lg flex items-center justify-center`}><selectedTemplate.icon className="w-4 h-4 text-white" /></div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{selectedTemplate.name} Template</h4>
                      <p className="text-sm text-slate-600">{selectedTemplate.category} campaign</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-slate-500">Estimated Opens:</span><p className="font-semibold text-slate-900">{selectedTemplate.metrics.estimatedOpens}</p></div>
                    <div><span className="text-slate-500">Estimated Clicks:</span><p className="font-semibold text-slate-900">{selectedTemplate.metrics.estimatedClicks}</p></div>
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => { setShowCampaignModal(false); setSelectedTemplate(null); }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition">Cancel</button>
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
