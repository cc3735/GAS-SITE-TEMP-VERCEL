import { useOrganization } from '../contexts/OrganizationContext';
import { Users, FolderKanban, Mail, Bot, TrendingUp, Clock } from 'lucide-react';

export default function Dashboard() {
  const { currentOrganization } = useOrganization();

  const stats = [
    { name: 'Active Projects', value: '12', icon: FolderKanban, change: '+2 this week', trend: 'up' },
    { name: 'Total Contacts', value: '2,847', icon: Users, change: '+124 this month', trend: 'up' },
    { name: 'Campaigns Running', value: '8', icon: Mail, change: '3 scheduled', trend: 'neutral' },
    { name: 'AI Agents Active', value: '5', icon: Bot, change: '2,431 tasks completed', trend: 'up' },
  ];

  const recentActivity = [
    { action: 'New contact added', details: 'John Doe via Landing Page', time: '5 minutes ago' },
    { action: 'Task completed', details: 'Design homepage mockup', time: '1 hour ago' },
    { action: 'Campaign sent', details: 'Monthly Newsletter - 2,431 recipients', time: '3 hours ago' },
    { action: 'Deal won', details: 'Enterprise Plan - $15,000', time: '5 hours ago' },
    { action: 'AI Agent executed', details: 'Content generation for blog post', time: '6 hours ago' },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back to {currentOrganization?.name}
        </h1>
        <p className="text-gray-600">Here's what's happening with your business today</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                {stat.trend === 'up' && (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                )}
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.name}</h3>
              <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.change}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.details}</p>
                  <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition group">
              <FolderKanban className="w-8 h-8 text-gray-600 group-hover:text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">New Project</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition group">
              <Users className="w-8 h-8 text-gray-600 group-hover:text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Add Contact</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition group">
              <Mail className="w-8 h-8 text-gray-600 group-hover:text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">New Campaign</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition group">
              <Bot className="w-8 h-8 text-gray-600 group-hover:text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Create Agent</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
