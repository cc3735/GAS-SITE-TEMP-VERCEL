import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown,
  Shield,
  Building2,
  Users,
  Activity,
  TrendingUp,
  AlertTriangle,
  Eye,
  BarChart2,
  Boxes,
  Bot,
  Server,
  ChevronDown,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Mail,
  Plus,
  X,
  Loader2,
  Send,
  RefreshCw,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { useOrganization, Organization } from '../contexts/OrganizationContext';
import { usePermissions } from '../hooks/usePermissions';
import { useInvitations } from '../hooks/useInvitations';

// Mock data for demonstration - in production this would come from aggregated queries
const MOCK_ORG_STATS: Record<string, { agents: number; conversations: number; leads: number; revenue: number }> = {
  'b0000000-0000-0000-0000-000000000001': { agents: 3, conversations: 45, leads: 120, revenue: 15000 },
  'b0000000-0000-0000-0000-000000000002': { agents: 2, conversations: 89, leads: 230, revenue: 8500 },
  'b0000000-0000-0000-0000-000000000003': { agents: 4, conversations: 23, leads: 67, revenue: 42000 },
};

const MOCK_AGENT_STATUS = [
  { id: '1', name: 'Voice Agent Alpha', orgId: 'b0000000-0000-0000-0000-000000000001', orgName: 'Keys Open Doors', status: 'active', type: 'voice' },
  { id: '2', name: 'Chat Support Beta', orgId: 'b0000000-0000-0000-0000-000000000002', orgName: 'This is what I do BBW', status: 'active', type: 'chat' },
  { id: '3', name: 'Order Bot', orgId: 'b0000000-0000-0000-0000-000000000002', orgName: 'This is what I do BBW', status: 'processing', type: 'chat' },
  { id: '4', name: 'Project Assistant', orgId: 'b0000000-0000-0000-0000-000000000003', orgName: 'Concept Containers', status: 'idle', type: 'assistant' },
  { id: '5', name: 'Translation Bot', orgId: 'b0000000-0000-0000-0000-000000000003', orgName: 'Concept Containers', status: 'active', type: 'utility' },
];

interface OrgCardProps {
  org: Organization;
  stats: { agents: number; conversations: number; leads: number; revenue: number };
  onEnter: () => void;
  onViewDetails: () => void;
}

const OrgCard: React.FC<OrgCardProps> = ({ org, stats, onEnter, onViewDetails }) => {
  const statusColor = org.subscription_status === 'active' ? 'text-green-500' : 'text-yellow-500';
  
  return (
    <div className="bg-surface rounded-lg border border-border p-5 hover:border-accent/50 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-subtle rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-primary">{org.name}</h3>
            <p className="text-xs text-subtle">{org.slug}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 text-xs ${statusColor}`}>
          <CheckCircle className="w-3 h-3" />
          <span className="capitalize">{org.subscription_status}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-surface-hover rounded p-2">
          <p className="text-xs text-subtle">Agents</p>
          <p className="text-lg font-semibold text-primary">{stats.agents}</p>
        </div>
        <div className="bg-surface-hover rounded p-2">
          <p className="text-xs text-subtle">Conversations</p>
          <p className="text-lg font-semibold text-primary">{stats.conversations}</p>
        </div>
        <div className="bg-surface-hover rounded p-2">
          <p className="text-xs text-subtle">Leads</p>
          <p className="text-lg font-semibold text-primary">{stats.leads}</p>
        </div>
        <div className="bg-surface-hover rounded p-2">
          <p className="text-xs text-subtle">Revenue</p>
          <p className="text-lg font-semibold text-green-500">${stats.revenue.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onViewDetails}
          className="flex-1 px-3 py-2 bg-surface-hover hover:bg-border text-sm text-primary rounded border border-border transition flex items-center justify-center gap-2"
        >
          <BarChart2 className="w-4 h-4" />
          Details
        </button>
        <button
          onClick={onEnter}
          className="flex-1 px-3 py-2 bg-accent hover:bg-accent-hover text-accent-foreground text-sm rounded transition flex items-center justify-center gap-2"
        >
          <Eye className="w-4 h-4" />
          Enter Org
        </button>
      </div>
    </div>
  );
};

const AgentStatusRow: React.FC<{ agent: typeof MOCK_AGENT_STATUS[0] }> = ({ agent }) => {
  const statusStyles = {
    active: 'bg-green-500',
    processing: 'bg-yellow-500 animate-pulse',
    idle: 'bg-gray-400',
    error: 'bg-red-500',
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${statusStyles[agent.status as keyof typeof statusStyles] || statusStyles.idle}`} />
        <div>
          <p className="text-sm font-medium text-primary">{agent.name}</p>
          <p className="text-xs text-subtle">{agent.orgName}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 bg-surface-hover text-xs text-secondary rounded capitalize">
          {agent.type}
        </span>
        <span className={`px-2 py-0.5 text-xs rounded capitalize ${
          agent.status === 'active' ? 'bg-green-500/10 text-green-500' :
          agent.status === 'processing' ? 'bg-yellow-500/10 text-yellow-500' :
          'bg-gray-500/10 text-gray-500'
        }`}>
          {agent.status}
        </span>
      </div>
    </div>
  );
};

// Invitation Management Section Component
const InvitationSection: React.FC<{ tenantOrgs: Organization[] }> = ({ tenantOrgs }) => {
  const { invitations, loading, sendInvitation, cancelInvitation, resendInvitation } = useInvitations();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteOrgId, setInviteOrgId] = useState('');
  const [sending, setSending] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const pendingInvitations = invitations.filter(inv => !inv.accepted_at && new Date(inv.expires_at) > new Date());

  const handleSendInvitation = async () => {
    if (!inviteEmail || !inviteOrgId) return;
    
    setSending(true);
    setInviteError(null);
    
    const result = await sendInvitation(inviteEmail, inviteRole, inviteOrgId);
    
    if (result.success) {
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('member');
      setInviteOrgId('');
    } else {
      setInviteError(result.error || 'Failed to send invitation');
    }
    
    setSending(false);
  };

  return (
    <>
      <div className="bg-surface rounded-lg border border-border">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
            <Mail className="w-5 h-5 text-accent" />
            Invitations
          </h2>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-accent hover:bg-accent-hover text-accent-foreground text-sm rounded transition"
          >
            <UserPlus className="w-4 h-4" />
            Invite
          </button>
        </div>
        <div className="p-4 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-accent" />
            </div>
          ) : pendingInvitations.length > 0 ? (
            <div className="space-y-3">
              {pendingInvitations.slice(0, 5).map(inv => (
                <div key={inv.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-primary">{inv.email}</p>
                    <p className="text-xs text-subtle">
                      {inv.organization?.name} · <span className="capitalize">{inv.role}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => resendInvitation(inv.id)}
                      className="p-1.5 text-subtle hover:text-accent rounded hover:bg-surface-hover"
                      title="Resend"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => cancelInvitation(inv.id)}
                      className="p-1.5 text-subtle hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Cancel"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-subtle">
              <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No pending invitations</p>
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="bg-surface rounded-xl shadow-xl max-w-md w-full p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-primary">Invite User</h2>
              <button onClick={() => setShowInviteModal(false)} className="text-subtle hover:text-primary">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Organization</label>
                <select
                  value={inviteOrgId}
                  onChange={(e) => setInviteOrgId(e.target.value)}
                  className="w-full px-4 py-2 border border-border bg-surface text-primary rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                >
                  <option value="">Select organization...</option>
                  {tenantOrgs.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-4 py-2 border border-border bg-surface text-primary rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-2 border border-border bg-surface text-primary rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                >
                  <option value="viewer">Viewer</option>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
              </div>

              {inviteError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                  {inviteError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-border text-secondary rounded-lg hover:bg-surface-hover transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendInvitation}
                  disabled={sending || !inviteEmail || !inviteOrgId}
                  className="flex-1 px-4 py-2 bg-accent hover:bg-accent-hover text-accent-foreground rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Invitation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default function GasAdminMissionControl() {
  const navigate = useNavigate();
  const { allOrganizations, setImpersonatedOrganization, currentOrganization } = useOrganization();
  const permissions = usePermissions();
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [orgSelectorOpen, setOrgSelectorOpen] = useState(false);

  // Filter out master org from the list
  const tenantOrgs = useMemo(() => 
    allOrganizations.filter(org => !org.is_master),
    [allOrganizations]
  );

  // Get selected org or show all
  const displayedOrgs = selectedOrgId 
    ? tenantOrgs.filter(org => org.id === selectedOrgId)
    : tenantOrgs;

  // Aggregate stats
  const aggregateStats = useMemo(() => {
    const orgsToAggregate = selectedOrgId 
      ? tenantOrgs.filter(org => org.id === selectedOrgId)
      : tenantOrgs;
    
    return orgsToAggregate.reduce((acc, org) => {
      const stats = MOCK_ORG_STATS[org.id] || { agents: 0, conversations: 0, leads: 0, revenue: 0 };
      return {
        totalOrgs: acc.totalOrgs + 1,
        totalAgents: acc.totalAgents + stats.agents,
        totalConversations: acc.totalConversations + stats.conversations,
        totalLeads: acc.totalLeads + stats.leads,
        totalRevenue: acc.totalRevenue + stats.revenue,
      };
    }, { totalOrgs: 0, totalAgents: 0, totalConversations: 0, totalLeads: 0, totalRevenue: 0 });
  }, [tenantOrgs, selectedOrgId]);

  // Filter agents by selected org
  const displayedAgents = selectedOrgId
    ? MOCK_AGENT_STATUS.filter(a => a.orgId === selectedOrgId)
    : MOCK_AGENT_STATUS;

  const handleEnterOrg = (orgId: string) => {
    setImpersonatedOrganization(orgId);
    navigate('/dashboard');
  };

  // Redirect if not master admin
  if (!permissions.isMasterAdmin) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-primary mb-2">Access Denied</h1>
          <p className="text-secondary">You must be a GAS admin to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page">
      {/* Header */}
      <header className="bg-surface border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">GAS Global Mission Control</h1>
              <p className="text-sm text-subtle">Multi-tenant administration dashboard</p>
            </div>
          </div>

          {/* Organization Selector */}
          <div className="relative">
            <button
              onClick={() => setOrgSelectorOpen(!orgSelectorOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-surface-hover hover:bg-border rounded-lg border border-border transition"
            >
              <Building2 className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium text-primary">
                {selectedOrgId ? tenantOrgs.find(o => o.id === selectedOrgId)?.name : 'All Organizations'}
              </span>
              <ChevronDown className={`w-4 h-4 text-subtle transition-transform ${orgSelectorOpen ? 'rotate-180' : ''}`} />
            </button>

            {orgSelectorOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-surface border border-border rounded-lg shadow-lg py-1 z-50">
                <button
                  onClick={() => { setSelectedOrgId(null); setOrgSelectorOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-surface-hover transition ${!selectedOrgId ? 'bg-accent-subtle text-accent' : 'text-secondary'}`}
                >
                  All Organizations
                </button>
                <div className="border-t border-border my-1" />
                {tenantOrgs.map(org => (
                  <button
                    key={org.id}
                    onClick={() => { setSelectedOrgId(org.id); setOrgSelectorOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-surface-hover transition ${selectedOrgId === org.id ? 'bg-accent-subtle text-accent' : 'text-secondary'}`}
                  >
                    {org.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="p-6">
        {/* Aggregate KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-surface p-4 rounded-lg border border-border">
            <div className="flex items-center gap-2 text-subtle mb-1">
              <Building2 className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide">Organizations</span>
            </div>
            <p className="text-2xl font-bold text-primary">{aggregateStats.totalOrgs}</p>
          </div>
          <div className="bg-surface p-4 rounded-lg border border-border">
            <div className="flex items-center gap-2 text-subtle mb-1">
              <Bot className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide">Active Agents</span>
            </div>
            <p className="text-2xl font-bold text-primary">{aggregateStats.totalAgents}</p>
          </div>
          <div className="bg-surface p-4 rounded-lg border border-border">
            <div className="flex items-center gap-2 text-subtle mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide">Conversations</span>
            </div>
            <p className="text-2xl font-bold text-primary">{aggregateStats.totalConversations}</p>
          </div>
          <div className="bg-surface p-4 rounded-lg border border-border">
            <div className="flex items-center gap-2 text-subtle mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide">Total Leads</span>
            </div>
            <p className="text-2xl font-bold text-primary">{aggregateStats.totalLeads}</p>
          </div>
          <div className="bg-surface p-4 rounded-lg border border-border">
            <div className="flex items-center gap-2 text-subtle mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide">Total Revenue</span>
            </div>
            <p className="text-2xl font-bold text-green-500">${aggregateStats.totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Organization Cards */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-primary">
                {selectedOrgId ? 'Selected Organization' : 'All Organizations'}
              </h2>
              <span className="text-sm text-subtle">{displayedOrgs.length} organization(s)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedOrgs.map(org => (
                <OrgCard
                  key={org.id}
                  org={org}
                  stats={MOCK_ORG_STATS[org.id] || { agents: 0, conversations: 0, leads: 0, revenue: 0 }}
                  onEnter={() => handleEnterOrg(org.id)}
                  onViewDetails={() => setSelectedOrgId(org.id)}
                />
              ))}
              {displayedOrgs.length === 0 && (
                <div className="col-span-2 bg-surface rounded-lg border border-border p-12 text-center">
                  <Building2 className="w-12 h-12 text-subtle mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-primary mb-2">No Organizations</h3>
                  <p className="text-secondary">No tenant organizations have been created yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Agent Status Panel */}
          <div className="lg:col-span-1">
            <div className="bg-surface rounded-lg border border-border">
              <div className="p-4 border-b border-border">
                <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                  <Zap className="w-5 h-5 text-accent" />
                  Live Agent Status
                </h2>
                <p className="text-xs text-subtle mt-1">
                  {selectedOrgId ? 'Filtered by organization' : 'All organizations'}
                </p>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                {displayedAgents.length > 0 ? (
                  displayedAgents.map(agent => (
                    <AgentStatusRow key={agent.id} agent={agent} />
                  ))
                ) : (
                  <div className="text-center py-8 text-subtle">
                    <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No agents found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Invitations Section */}
            <div className="mt-4">
              <InvitationSection tenantOrgs={tenantOrgs} />
            </div>

            {/* Quick Actions */}
            <div className="mt-4 bg-surface rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold text-primary mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => navigate('/gas/settings')}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-surface-hover hover:bg-border text-sm text-primary rounded transition"
                >
                  <Shield className="w-4 h-4" />
                  Visibility Settings
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 bg-surface-hover hover:bg-border text-sm text-primary rounded transition">
                  <Boxes className="w-4 h-4" />
                  View All Business Apps
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 bg-surface-hover hover:bg-border text-sm text-primary rounded transition">
                  <Server className="w-4 h-4" />
                  MCP Server Status
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

