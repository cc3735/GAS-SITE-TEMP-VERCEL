import { useState } from 'react';
import { useOrganization } from '../contexts/OrganizationContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Users, FolderKanban, Mail, Bot, TrendingUp, Clock, Building2, Plus, X, Loader2 } from 'lucide-react';
import { useCompanies } from '../hooks/useCompanies';
import { useContacts } from '../hooks/useContacts';
import { useProjects } from '../hooks/useProjects';
import { useCampaigns } from '../hooks/useCampaigns';
import { useAgents } from '../hooks/useAgents';
import { useToast } from '../contexts/ToastContext';
import ProjectFormModal from '../components/ProjectFormModal';

export default function Dashboard() {
  const { currentOrganization, organizations, loading: orgLoading, refetchOrganizations } = useOrganization();
  const { user } = useAuth();
  const { createCompany } = useCompanies();
  const { contacts } = useContacts();
  const { projects, createProject } = useProjects();
  const { campaigns, createCampaign } = useCampaigns();
  const { agents } = useAgents();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [showNewCompany, setShowNewCompany] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewContact, setShowNewContact] = useState(false);
  const [showNewCampaign, setShowNewCampaign] = useState(false);

  const [creating, setCreating] = useState(false);
  const [projectCreating, setProjectCreating] = useState(false);
  const [contactCreating, setContactCreating] = useState(false);
  const [campaignCreating, setCampaignCreating] = useState(false);
  const [orgCreating, setOrgCreating] = useState(false);

  const [companyFormData, setCompanyFormData] = useState({
    name: '',
    domain: '',
    industry: '',
    website: '',
    phone: '',
    description: '',
  });

  const [projectFormData, setProjectFormData] = useState({
    name: '',
    description: '',
    estimated_completion: '',
    tools_used: [] as string[],
    proposed_tech: [] as string[],
    project_details: '',
    cost_to_operate: null as number | null,
    gas_fee: null as number | null,
    budget: null as number | null,
    priority: 'medium' as string,
  });

  const [contactFormData, setContactFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    title: '',
    company_name: '',
    notes: '',
  });

  const [campaignFormData, setCampaignFormData] = useState({
    name: '',
    subject: '',
    description: '',
    audience: 'all',
    sendDate: '',
    campaign_type: 'email' as const
  });

  const [orgFormData, setOrgFormData] = useState({
    name: '',
    slug: '',
  });

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyFormData.name.trim()) return;

    setCreating(true);
    try {
      await createCompany(companyFormData);
      setCompanyFormData({
        name: '',
        domain: '',
        industry: '',
        website: '',
        phone: '',
        description: '',
      });
      setShowNewCompany(false);
      addToast('success', 'Company created successfully!');
    } catch (error) {
      console.error('Failed to create company:', error);
      addToast('error', 'Failed to create company');
    } finally {
      setCreating(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleOrgNameChange = (name: string) => {
    setOrgFormData({
      name,
      slug: generateSlug(name),
    });
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setOrgCreating(true);
    try {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgFormData.name,
          slug: orgFormData.slug,
          subscription_tier: 'free',
          subscription_status: 'trial',
        })
        .select()
        .single();

      if (orgError) throw orgError;

      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: 'owner',
          joined_at: new Date().toISOString(),
        });

      if (memberError) throw memberError;

      const { error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          organization_id: org.id,
          name: 'General',
          description: 'Default workspace',
          is_default: true,
          created_by: user.id,
        });

      if (workspaceError) throw workspaceError;

      await refetchOrganizations();
      addToast('success', 'Organization created successfully!');
    } catch (error: any) {
      console.error('Error creating organization:', error);
      addToast('error', error.message || 'Failed to create organization');
    } finally {
      setOrgCreating(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignFormData.name || !campaignFormData.subject) return;
    
    setCampaignCreating(true);
    try {
      await createCampaign({
        name: campaignFormData.name,
        description: campaignFormData.description,
        campaign_type: campaignFormData.campaign_type,
        scheduled_at: campaignFormData.sendDate ? new Date(campaignFormData.sendDate).toISOString() : undefined,
        settings: { subject: campaignFormData.subject, audience: campaignFormData.audience }
      });
      setCampaignFormData({ name: '', subject: '', description: '', audience: 'all', sendDate: '', campaign_type: 'email' });
      setShowNewCampaign(false);
      addToast('success', 'Campaign created successfully!');
    } catch (error) {
      console.error('Failed to create campaign:', error);
      addToast('error', 'Failed to create campaign');
    } finally {
      setCampaignCreating(false);
    }
  };

  // Loading state while checking organizations
  if (orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Normal dashboard for existing users (or demo mode)

  // Calculate real stats
  const stats = [
    { 
      name: 'Active Projects', 
      value: projects.filter(p => p.status === 'active' || p.status === 'in_progress').length.toString(), 
      icon: FolderKanban, 
      change: `${projects.length} total`, 
      trend: 'neutral' 
    },
    { 
      name: 'Total Contacts', 
      value: contacts.length.toString(), 
      icon: Users, 
      change: 'All time', 
      trend: 'up' 
    },
    { 
      name: 'Campaigns Running', 
      value: campaigns.filter(c => c.status === 'active' || c.status === 'scheduled').length.toString(), 
      icon: Mail, 
      change: `${campaigns.length} total`, 
      trend: 'neutral' 
    },
    { 
      name: 'AI Agents Active', 
      value: agents.filter(a => a.status === 'active').length.toString(), 
      icon: Bot, 
      change: `${agents.length} configured`, 
      trend: 'up' 
    },
  ];

  // Aggregate and sort recent activity from all sources
  const getAllActivity = () => {
    const activity = [
      ...projects.map(p => ({
        action: 'New Project',
        details: p.name,
        time: new Date(p.created_at),
        type: 'project'
      })),
      ...contacts.map(c => ({
        action: 'New Contact',
        details: `${c.first_name} ${c.last_name || ''}`,
        time: new Date(c.created_at),
        type: 'contact'
      })),
      ...campaigns.map(c => ({
        action: 'Campaign Created',
        details: c.name,
        time: new Date(c.created_at),
        type: 'campaign'
      })),
      ...agents.map(a => ({
        action: 'Agent Configured',
        details: a.name,
        time: new Date(a.created_at || new Date().toISOString()),
        type: 'agent'
      }))
    ];

    return activity
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, 5)
      .map(item => ({
        ...item,
        time: item.time.toLocaleDateString() + ' ' + item.time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      }));
  };

  const recentActivity = getAllActivity();

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back to {currentOrganization?.name || 'Demo Organization'}
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
            <button
              onClick={() => setShowNewProject(true)}
              className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition group"
            >
              <FolderKanban className="w-8 h-8 text-gray-600 group-hover:text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">New Project</span>
            </button>
            <button
              onClick={() => setShowNewContact(true)}
              className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition group"
            >
              <Users className="w-8 h-8 text-gray-600 group-hover:text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Add Contact</span>
            </button>
            <button
              onClick={() => setShowNewCampaign(true)}
              className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition group"
            >
              <Mail className="w-8 h-8 text-gray-600 group-hover:text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">New Campaign</span>
            </button>
            <button
              onClick={() => setShowNewCompany(true)}
              className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition group"
            >
              <Building2 className="w-8 h-8 text-gray-600 group-hover:text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Add Company</span>
            </button>
          </div>
        </div>
      </div>

      {showNewCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create New Company</h2>
              <button
                onClick={() => setShowNewCompany(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={companyFormData.name}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  placeholder="Acme Corporation"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Domain</label>
                  <input
                    type="text"
                    value={companyFormData.domain}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, domain: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder="acme.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                  <input
                    type="text"
                    value={companyFormData.industry}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, industry: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder="Software"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input
                    type="url"
                    value={companyFormData.website}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, website: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder="https://acme.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={companyFormData.phone}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={companyFormData.description}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  placeholder="Brief description of the company..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewCompany(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !companyFormData.name.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Project Modal */}
      <ProjectFormModal
        isOpen={showNewProject}
        onClose={() => setShowNewProject(false)}
        onSubmit={(projectData) => createProject(projectData).then(() => {})}
        submitButtonText="Create Project & Go to Projects"
      />

      {/* New Contact Modal */}
      {showNewContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create New Contact</h2>
              <button
                onClick={() => setShowNewContact(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={contactFormData.first_name}
                    onChange={(e) => setContactFormData({ ...contactFormData, first_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={contactFormData.last_name}
                    onChange={(e) => setContactFormData({ ...contactFormData, last_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={contactFormData.email}
                    onChange={(e) => setContactFormData({ ...contactFormData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={contactFormData.phone}
                    onChange={(e) => setContactFormData({ ...contactFormData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={contactFormData.title}
                    onChange={(e) => setContactFormData({ ...contactFormData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder="CEO"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    value={contactFormData.company_name}
                    onChange={(e) => setContactFormData({ ...contactFormData, company_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder="Acme Corp"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={contactFormData.notes}
                  onChange={(e) => setContactFormData({ ...contactFormData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
                  placeholder="Additional notes about this contact..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewContact(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={contactCreating || !contactFormData.first_name.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {contactCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Contact & Go to CRM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Campaign Modal */}
      {showNewCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create New Marketing Campaign</h2>
              <button
                onClick={() => setShowNewCampaign(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateCampaign} className="space-y-6">
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={campaignFormData.name}
                  onChange={(e) => setCampaignFormData({ ...campaignFormData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  placeholder="e.g., Summer Sale"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Line <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={campaignFormData.subject}
                  onChange={(e) => setCampaignFormData({ ...campaignFormData, subject: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  placeholder="Subject..."
                  required
                />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={campaignFormData.description}
                    onChange={(e) => setCampaignFormData({ ...campaignFormData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                    rows={3}
                  />
              </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date (Optional)</label>
                  <input
                    type="date"
                    value={campaignFormData.sendDate}
                    onChange={(e) => setCampaignFormData({ ...campaignFormData, sendDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewCampaign(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={campaignCreating || !campaignFormData.name}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center justify-center gap-2"
                >
                   {campaignCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
