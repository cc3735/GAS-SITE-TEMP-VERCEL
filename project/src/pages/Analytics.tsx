import { BarChart3, TrendingUp, Users, CheckCircle, DollarSign } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { useContacts } from '../hooks/useContacts';
import { useCampaigns } from '../hooks/useCampaigns';

export default function Analytics() {
  const { projects } = useProjects();
  const { contacts } = useContacts();
  const { campaigns } = useCampaigns();

  // Calculate metrics
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const newContacts = contacts.filter(c => {
     const date = new Date(c.created_at);
     const now = new Date();
     return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">+12%</span>
          </div>
          <h3 className="text-sm text-gray-500 font-medium">Total Project Budget</h3>
          <p className="text-2xl font-bold text-gray-900">${totalBudget.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">{completedProjects}/{projects.length}</span>
          </div>
          <h3 className="text-sm text-gray-500 font-medium">Completed Projects</h3>
          <p className="text-2xl font-bold text-gray-900">{completedProjects}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">+{newContacts} this month</span>
          </div>
          <h3 className="text-sm text-gray-500 font-medium">Total Contacts</h3>
          <p className="text-2xl font-bold text-gray-900">{contacts.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
             <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded">{activeCampaigns} active</span>
          </div>
          <h3 className="text-sm text-gray-500 font-medium">Marketing Reach</h3>
          <p className="text-2xl font-bold text-gray-900">{(contacts.length * 0.8).toFixed(0)} <span className="text-sm font-normal text-gray-400">est.</span></p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-600">Detailed charts and reporting features are coming in the next update.</p>
      </div>
    </div>
  );
}
