import { useState } from 'react';
import { Mail, Share2, Plus, Calendar, Megaphone, Users, TrendingUp, X, Send, Target, Sparkles, Heart, ShoppingCart } from 'lucide-react';

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

export default function MarketingSocial() {
  const [activeTab, setActiveTab] = useState<TabType>('campaigns');
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    subject: '',
    description: '',
    audience: '',
    sendDate: '',
    templateId: ''
  });

  // Campaign templates data
  const campaignTemplates: CampaignTemplate[] = [
    {
      id: 'welcome-series',
      name: 'Welcome Series',
      description: '5-email automated welcome flow',
      category: 'Onboarding',
      icon: Sparkles,
      color: 'bg-blue-500',
      metrics: {
        estimatedOpens: '35-45%',
        estimatedClicks: '8-12%',
        sendTime: 'Immediate + 3, 7, 14, 21 days'
      }
    },
    {
      id: 'product-launch',
      name: 'Product Launch',
      description: 'Build anticipation for new features',
      category: 'Announcements',
      icon: Target,
      color: 'bg-green-500',
      metrics: {
        estimatedOpens: '28-38%',
        estimatedClicks: '12-18%',
        sendTime: '2 weeks before, 1 week before, launch day'
      }
    },
    {
      id: 're-engagement',
      name: 'Re-engagement',
      description: 'Win back inactive subscribers',
      category: 'Nurture',
      icon: Heart,
      color: 'bg-purple-500',
      metrics: {
        estimatedOpens: '22-32%',
        estimatedClicks: '6-10%',
        sendTime: '30 days of inactivity'
      }
    },
    {
      id: 'promotional',
      name: 'Promotional Sale',
      description: 'Drive conversions with special offers',
      category: 'Sales',
      icon: ShoppingCart,
      color: 'bg-orange-500',
      metrics: {
        estimatedOpens: '40-50%',
        estimatedClicks: '15-25%',
        sendTime: 'Immediately after signup'
      }
    },
    {
      id: 'educational',
      name: 'Educational Content',
      description: 'Share valuable tips and resources',
      category: 'Content',
      icon: Send,
      color: 'bg-indigo-500',
      metrics: {
        estimatedOpens: '25-35%',
        estimatedClicks: '10-15%',
        sendTime: 'Weekly, Friday morning'
      }
    },
    {
      id: 'seasonal',
      name: 'Seasonal Campaign',
      description: 'Holiday and seasonal messaging',
      category: 'Events',
      icon: Calendar,
      color: 'bg-pink-500',
      metrics: {
        estimatedOpens: '30-40%',
        estimatedClicks: '12-18%',
        sendTime: 'Date-specific triggers'
      }
    }
  ];

  const tabs = [
    { id: 'campaigns' as const, name: 'Campaigns & Marketing', icon: Mail },
    { id: 'social' as const, name: 'Social Media', icon: Share2 },
  ];

  const handleTemplateSelect = (template: CampaignTemplate) => {
    setSelectedTemplate(template);
    setCampaignForm({
      name: `${template.name} Campaign`,
      subject: `Default ${template.name} subject line`,
      description: template.description,
      audience: 'All subscribers',
      sendDate: new Date().toISOString().split('T')[0],
      templateId: template.id
    });
    setShowCampaignModal(true);
  };

  const handleCreateCampaign = () => {
    // Mock campaign creation
    alert(`Campaign "${campaignForm.name}" created using ${selectedTemplate?.name} template!`);
    setShowCampaignModal(false);
    setSelectedTemplate(null);
    setCampaignForm({
      name: '',
      subject: '',
      description: '',
      audience: '',
      sendDate: '',
      templateId: ''
    });
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Marketing & Social Media</h1>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon
                  className={`-ml-0.5 mr-2 h-5 w-5 ${
                    activeTab === tab.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'campaigns' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Marketing Campaigns</h2>
              <p className="text-sm text-gray-600">Create and manage email campaigns and marketing automation</p>
            </div>
            <button
              onClick={() => setShowCampaignModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              <Plus className="w-5 h-5" />
              New Campaign
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Active Campaigns</h3>
              <p className="text-3xl font-bold text-gray-900 mb-2">8</p>
              <p className="text-sm text-gray-500">+2 this week</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Recipients</h3>
              <p className="text-3xl font-bold text-gray-900 mb-2">15,247</p>
              <p className="text-sm text-gray-500">+1,423 this month</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Megaphone className="w-6 h-6 text-purple-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Average Open Rate</h3>
              <p className="text-3xl font-bold text-gray-900 mb-2">24.6%</p>
              <p className="text-sm text-gray-500">+2.1% from last campaign</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Campaign Templates</h3>
                <p className="text-gray-600">Choose from proven campaign templates to get started</p>
              </div>
              <button
                onClick={() => setShowCampaignModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
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
                    className="group p-6 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition text-left"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 ${template.color} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{template.name}</h4>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {template.category}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">{template.description}</p>

                    <div className="space-y-2 text-xs text-gray-500">
                      <div className="flex justify-between">
                        <span>Est. Opens:</span>
                        <span className="font-medium">{template.metrics.estimatedOpens}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Est. Clicks:</span>
                        <span className="font-medium">{template.metrics.estimatedClicks}</span>
                      </div>
                      <div className="text-xs">
                        <span>Send Timing:</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {template.metrics.sendTime}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'social' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Social Media Management</h2>
              <p className="text-sm text-gray-600">Schedule posts and manage social media accounts</p>
            </div>
            <button
              onClick={() => alert('Social posting coming soon!')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              <Plus className="w-5 h-5" />
              New Post
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-blue-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Posts This Week</h3>
              <p className="text-3xl font-bold text-gray-900 mb-2">12</p>
              <p className="text-sm text-gray-500">+3 vs last week</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Active Accounts</h3>
              <p className="text-3xl font-bold text-gray-900 mb-2">4</p>
              <p className="text-sm text-gray-500">Twitter, Facebook, Instagram</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Scheduled Posts</h3>
              <p className="text-3xl font-bold text-gray-900 mb-2">7</p>
              <p className="text-sm text-gray-500">Next post: Tomorrow 2:00 PM</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Avg. Engagement</h3>
              <p className="text-3xl font-bold text-gray-900 mb-2">14.7%</p>
              <p className="text-sm text-gray-500">+1.2% this week</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <Share2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Connect Social Media Accounts
              </h3>
              <p className="text-gray-600 mb-6">
                Connect your social media accounts to start posting and managing your social presence.
              </p>
              <div className="flex justify-center">
                <button
                  onClick={() => alert('Social account connection coming soon!')}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition"
                >
                  <Plus className="w-5 h-5" />
                  Connect Accounts
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Creation Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedTemplate ? `Create ${selectedTemplate.name} Campaign` : 'Create Custom Campaign'}
                </h2>
                {selectedTemplate && (
                  <p className="text-sm text-gray-600 mt-1">{selectedTemplate.description}</p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowCampaignModal(false);
                  setSelectedTemplate(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {/* Campaign Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder="Enter campaign name"
                    required
                  />
                </div>

                {/* Email Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={campaignForm.subject}
                    onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder="Enter email subject line"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Target Audience */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Audience
                    </label>
                    <select
                      value={campaignForm.audience}
                      onChange={(e) => setCampaignForm({ ...campaignForm, audience: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    >
                      <option value="all">All Subscribers</option>
                      <option value="active">Active Users</option>
                      <option value="inactive">Inactive Users</option>
                      <option value="new">New Subscribers</option>
                      <option value="leads">Lead Prospects</option>
                      <option value="customers">Existing Customers</option>
                    </select>
                  </div>

                  {/* Send Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Send Date
                    </label>
                    <input
                      type="date"
                      value={campaignForm.sendDate}
                      onChange={(e) => setCampaignForm({ ...campaignForm, sendDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Description
                  </label>
                  <textarea
                    value={campaignForm.description}
                    onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
                    placeholder="Describe the campaign goals and content..."
                  />
                </div>

                {/* Template Info */}
                {selectedTemplate && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-8 h-8 ${selectedTemplate.color} rounded-lg flex items-center justify-center`}>
                        <selectedTemplate.icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{selectedTemplate.name} Template</h4>
                        <p className="text-sm text-gray-600">{selectedTemplate.category} campaign</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Estimated Opens:</span>
                        <p className="font-semibold text-gray-900">{selectedTemplate.metrics.estimatedOpens}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Estimated Clicks:</span>
                        <p className="font-semibold text-gray-900">{selectedTemplate.metrics.estimatedClicks}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCampaignModal(false);
                    setSelectedTemplate(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateCampaign}
                  disabled={!campaignForm.name.trim() || !campaignForm.subject.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Create Campaign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
