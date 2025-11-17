import { useState } from 'react';
import { Mail, Share2, Plus, Calendar, Megaphone, Users, TrendingUp } from 'lucide-react';

type TabType = 'campaigns' | 'social';

export default function MarketingSocial() {
  const [activeTab, setActiveTab] = useState<TabType>('campaigns');

  const tabs = [
    { id: 'campaigns' as const, name: 'Campaigns & Marketing', icon: Mail },
    { id: 'social' as const, name: 'Social Media', icon: Share2 },
  ];

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
              onClick={() => alert('Campaign creation coming soon!')}
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

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Campaign Templates</h3>
            <p className="text-gray-600 mb-6">Choose from proven campaign templates to get started</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-600 transition group">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 transition">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">Welcome Series</h4>
                  <p className="text-sm text-gray-600">5-email welcome flow</p>
                </div>
              </button>
              <button className="p-4 border-2 border-dashed border-green-300 rounded-lg hover:border-green-600 transition group">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-green-200 transition">
                    <Mail className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">Product Launch</h4>
                  <p className="text-sm text-gray-600">Pre-launch campaign</p>
                </div>
              </button>
              <button className="p-4 border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-600 transition group">
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200 transition">
                    <Mail className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">Re-engagement</h4>
                  <p className="text-sm text-gray-600">Win back inactive users</p>
                </div>
              </button>
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
    </div>
  );
}
