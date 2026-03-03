import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  LayoutGrid,
  TrendingUp,
  ArrowRight,
  FolderKanban,
  Mail,
  Bot,
  Building2,
  Clock,
  Plus,
  X,
  Loader2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCompanies } from '../../hooks/useCompanies';
import { useContacts } from '../../hooks/useContacts';
import { useProjects } from '../../hooks/useProjects';
import ProjectFormModal from '../../components/os/ProjectFormModal';

interface AppCount {
  app_id: string;
  count: number;
}

interface RecentClient {
  id: string;
  email: string;
  full_name: string | null;
  subscription_tier: string | null;
  created_at: string;
}

const APP_LABELS: Record<string, string> = {
  legalflow: 'LegalFlow',
  courseflow: 'CourseFlow',
  foodtruck: 'FoodTruck',
  buildflow: 'BuildFlow',
  keysflow: 'KeysFlow',
};

export default function OSDashboard() {
  const { currentOrganization, loading: orgLoading, refetchOrganizations } = useOrganization();
  const { user } = useAuth();
  const { createCompany } = useCompanies();
  const { contacts } = useContacts();
  const { createProject } = useProjects();
  const navigate = useNavigate();

  // GAS Admin stats
  const [totalClients, setTotalClients] = useState<number | null>(null);
  const [activeSubscriptions, setActiveSubscriptions] = useState<number | null>(null);
  const [appCounts, setAppCounts] = useState<AppCount[]>([]);
  const [recentClients, setRecentClients] = useState<RecentClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Quick action modals
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewContact, setShowNewContact] = useState(false);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [showNewCompany, setShowNewCompany] = useState(false);

  const [creating, setCreating] = useState(false);
  const [orgCreating, setOrgCreating] = useState(false);

  const [companyFormData, setCompanyFormData] = useState({
    name: '', domain: '', industry: '', website: '', phone: '', description: '',
  });

  const [contactFormData, setContactFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '', title: '', company_name: '', notes: '',
  });

  const [orgFormData, setOrgFormData] = useState({ name: '', slug: '' });

  useEffect(() => {
    async function load() {
      const [profilesRes, subsRes, recentRes] = await Promise.all([
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('user_app_subscriptions').select('app_id').eq('status', 'active'),
        supabase.from('user_profiles')
          .select('id, email, full_name, subscription_tier, created_at')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      setTotalClients(profilesRes.count ?? 0);

      const counts: Record<string, number> = {};
      (subsRes.data ?? []).forEach((row: { app_id: string }) => {
        counts[row.app_id] = (counts[row.app_id] ?? 0) + 1;
      });
      setActiveSubscriptions(subsRes.data?.length ?? 0);
      setAppCounts(
        Object.entries(counts).map(([app_id, count]) => ({ app_id, count }))
          .sort((a, b) => b.count - a.count)
      );

      setRecentClients((recentRes.data ?? []) as RecentClient[]);
      setIsLoading(false);
    }
    load();
  }, []);

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleOrgNameChange = (name: string) => {
    setOrgFormData({ name, slug: generateSlug(name) });
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setOrgCreating(true);
    try {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: orgFormData.name, slug: orgFormData.slug, subscription_tier: 'free', subscription_status: 'trial' })
        .select().single();
      if (orgError) throw orgError;

      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({ organization_id: org.id, user_id: user.id, role: 'owner', joined_at: new Date().toISOString() });
      if (memberError) throw memberError;

      const { error: workspaceError } = await supabase
        .from('workspaces')
        .insert({ organization_id: org.id, name: 'General', description: 'Default workspace', is_default: true, created_by: user.id });
      if (workspaceError) throw workspaceError;

      await refetchOrganizations();
    } catch (error: any) {
      console.error('Error creating organization:', error);
      alert(error.message || 'Failed to create organization');
    } finally {
      setOrgCreating(false);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyFormData.name.trim()) return;
    setCreating(true);
    try {
      await createCompany(companyFormData);
      setCompanyFormData({ name: '', domain: '', industry: '', website: '', phone: '', description: '' });
      setShowNewCompany(false);
    } catch (error) {
      console.error('Failed to create company:', error);
    } finally {
      setCreating(false);
    }
  };

  // Loading state
  if (orgLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
      </div>
    );
  }

  // Organization setup for new users
  if (!currentOrganization) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-primary-600/20 rounded-xl flex items-center justify-center mb-4">
                <Building2 className="w-8 h-8 text-primary-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Create Your Organization</h1>
              <p className="text-gray-400 text-center">
                Set up your workspace to get started
              </p>
            </div>

            <form onSubmit={handleCreateOrganization} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Organization Name
                </label>
                <input
                  type="text"
                  required
                  value={orgFormData.name}
                  onChange={(e) => handleOrgNameChange(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="Acme Inc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  URL Identifier
                </label>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">app.com/</span>
                  <input
                    type="text"
                    required
                    value={orgFormData.slug}
                    onChange={(e) => setOrgFormData({ ...orgFormData, slug: e.target.value })}
                    className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="acme-inc"
                    pattern="[a-z0-9-]+"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Only lowercase letters, numbers, and hyphens
                </p>
              </div>

              <button
                type="submit"
                disabled={orgCreating || !orgFormData.name || !orgFormData.slug}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {orgCreating ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Creating...</>
                ) : (
                  'Create Organization'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard stats
  const gasStats = [
    { label: 'Total Clients', value: totalClients, icon: Users, color: 'text-blue-400' },
    { label: 'Active Subscriptions', value: activeSubscriptions, icon: CheckCircle2, color: 'text-green-400' },
    { label: 'Apps Offered', value: Object.keys(APP_LABELS).length, icon: LayoutGrid, color: 'text-purple-400' },
    { label: 'Avg Apps / Client', value: totalClients ? ((activeSubscriptions ?? 0) / totalClients).toFixed(1) : '—', icon: TrendingUp, color: 'text-yellow-400' },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back to {currentOrganization?.name}
        </h1>
        <p className="text-gray-400 mt-1 text-sm">Here's what's happening with your business today.</p>
      </div>

      {/* GAS Admin Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {gasStats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-3xl font-bold text-white">
              {isLoading ? <span className="text-gray-600">—</span> : value ?? '—'}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setShowNewProject(true)}
            className="flex flex-col items-center justify-center p-4 border-2 border-gray-700 rounded-lg hover:border-primary-600 hover:bg-primary-600/10 transition group"
          >
            <FolderKanban className="w-7 h-7 text-gray-500 group-hover:text-primary-400 mb-2" />
            <span className="text-sm font-medium text-gray-400 group-hover:text-primary-400">New Project</span>
          </button>
          <button
            onClick={() => setShowNewContact(true)}
            className="flex flex-col items-center justify-center p-4 border-2 border-gray-700 rounded-lg hover:border-primary-600 hover:bg-primary-600/10 transition group"
          >
            <Users className="w-7 h-7 text-gray-500 group-hover:text-primary-400 mb-2" />
            <span className="text-sm font-medium text-gray-400 group-hover:text-primary-400">Add Contact</span>
          </button>
          <button
            onClick={() => setShowNewCampaign(true)}
            className="flex flex-col items-center justify-center p-4 border-2 border-gray-700 rounded-lg hover:border-primary-600 hover:bg-primary-600/10 transition group"
          >
            <Mail className="w-7 h-7 text-gray-500 group-hover:text-primary-400 mb-2" />
            <span className="text-sm font-medium text-gray-400 group-hover:text-primary-400">New Campaign</span>
          </button>
          <button
            onClick={() => setShowNewCompany(true)}
            className="flex flex-col items-center justify-center p-4 border-2 border-gray-700 rounded-lg hover:border-primary-600 hover:bg-primary-600/10 transition group"
          >
            <Building2 className="w-7 h-7 text-gray-500 group-hover:text-primary-400 mb-2" />
            <span className="text-sm font-medium text-gray-400 group-hover:text-primary-400">Add Company</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscribers by App */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-white">Subscribers by App</h2>
            <Link to="/os/apps" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 rounded bg-gray-800 animate-pulse" />
              ))}
            </div>
          ) : appCounts.length === 0 ? (
            <p className="text-sm text-gray-500">No active subscriptions yet.</p>
          ) : (
            <div className="space-y-3">
              {appCounts.map(({ app_id, count }) => {
                const max = appCounts[0].count;
                return (
                  <div key={app_id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-300">{APP_LABELS[app_id] ?? app_id}</span>
                      <span className="text-gray-400 font-medium">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-800">
                      <div
                        className="h-1.5 rounded-full bg-primary-500 transition-all"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Signups */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-white">Recent Signups</h2>
            <Link to="/os/clients" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 rounded bg-gray-800 animate-pulse" />
              ))}
            </div>
          ) : recentClients.length === 0 ? (
            <p className="text-sm text-gray-500">No clients yet.</p>
          ) : (
            <div className="divide-y divide-gray-800">
              {recentClients.map((client) => (
                <Link
                  key={client.id}
                  to={`/os/clients/${client.id}`}
                  className="flex items-center justify-between py-2.5 hover:opacity-80 group"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate group-hover:text-primary-400 transition-colors">
                      {client.full_name || client.email}
                    </p>
                    {client.full_name && (
                      <p className="text-xs text-gray-500 truncate">{client.email}</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 flex-shrink-0 ml-4">
                    {new Date(client.created_at).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Company Modal */}
      {showNewCompany && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Create New Company</h2>
              <button onClick={() => setShowNewCompany(false)} className="text-gray-400 hover:text-gray-300">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Company Name <span className="text-red-400">*</span></label>
                <input type="text" required value={companyFormData.name} onChange={(e) => setCompanyFormData({ ...companyFormData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="Acme Corporation" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Domain</label>
                  <input type="text" value={companyFormData.domain} onChange={(e) => setCompanyFormData({ ...companyFormData, domain: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="acme.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Industry</label>
                  <input type="text" value={companyFormData.industry} onChange={(e) => setCompanyFormData({ ...companyFormData, industry: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="Software" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
                  <input type="url" value={companyFormData.website} onChange={(e) => setCompanyFormData({ ...companyFormData, website: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="https://acme.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                  <input type="tel" value={companyFormData.phone} onChange={(e) => setCompanyFormData({ ...companyFormData, phone: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="+1 (555) 123-4567" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea value={companyFormData.description} onChange={(e) => setCompanyFormData({ ...companyFormData, description: e.target.value })} rows={3}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none" placeholder="Brief description..." />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowNewCompany(false)}
                  className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition">Cancel</button>
                <button type="submit" disabled={creating || !companyFormData.name.trim()}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Create New Contact</h2>
              <button onClick={() => setShowNewContact(false)} className="text-gray-400 hover:text-gray-300">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">First Name <span className="text-red-400">*</span></label>
                  <input type="text" required value={contactFormData.first_name} onChange={(e) => setContactFormData({ ...contactFormData, first_name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="John" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                  <input type="text" value={contactFormData.last_name} onChange={(e) => setContactFormData({ ...contactFormData, last_name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="Doe" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <input type="email" value={contactFormData.email} onChange={(e) => setContactFormData({ ...contactFormData, email: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                  <input type="tel" value={contactFormData.phone} onChange={(e) => setContactFormData({ ...contactFormData, phone: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="+1 (555) 123-4567" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                  <input type="text" value={contactFormData.title} onChange={(e) => setContactFormData({ ...contactFormData, title: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="CEO" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Company</label>
                  <input type="text" value={contactFormData.company_name} onChange={(e) => setContactFormData({ ...contactFormData, company_name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="Acme Corp" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                <textarea value={contactFormData.notes} onChange={(e) => setContactFormData({ ...contactFormData, notes: e.target.value })} rows={3}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none" placeholder="Additional notes..." />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowNewContact(false)}
                  className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition">Cancel</button>
                <button type="button" onClick={() => { navigate('/os/crm'); setShowNewContact(false); }}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition flex items-center justify-center gap-2">
                  Go to CRM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Campaign Modal */}
      {showNewCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Create New Campaign</h2>
              <button onClick={() => setShowNewCampaign(false)} className="text-gray-400 hover:text-gray-300">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg mb-6">
              <p className="text-sm text-yellow-400">
                Head to the Marketing & Social page to create campaigns with templates, audience targeting, and scheduling.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowNewCampaign(false)}
                className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition">Cancel</button>
              <button onClick={() => { navigate('/os/marketing'); setShowNewCampaign(false); }}
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition">
                Go to Marketing & Social
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
