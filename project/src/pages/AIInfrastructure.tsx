import { useState } from 'react';
import { useAgents } from '../hooks/useAgents';
import { useMCPServers } from '../hooks/useMCPServers';
import { usePermissions } from '../hooks/usePermissions';
import { 
  Bot, 
  Plus, 
  X, 
  Loader2, 
  Sparkles, 
  MessageSquare, 
  Phone, 
  Zap, 
  Share2, 
  Activity, 
  Play,
  Server, 
  Cloud, 
  Code, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Settings,
  Copy,
  Eye,
  Edit,
  Power,
  Cpu,
  Lock
} from 'lucide-react';
import EnhancedAgentModal from '../components/EnhancedAgentModal';
import AgentManagementModal from '../components/AgentManagementModal';
import AgentPlaygroundModal from '../components/AgentPlaygroundModal';

type TabType = 'agents' | 'coding' | 'mcp';

const agentTypes = [
  {
    id: 'content_generation',
    name: 'Content Generation',
    description: 'Create blog posts, social media content, emails, and more',
    icon: Sparkles,
    color: 'from-purple-600 to-purple-700',
  },
  {
    id: 'voice',
    name: 'Voice Agent',
    description: 'Handle phone calls with real-time speech processing',
    icon: Phone,
    color: 'from-green-600 to-green-700',
  },
  {
    id: 'operating',
    name: 'Operating Agent',
    description: 'Knowledgeable assistant for entire company/project operations',
    icon: Zap,
    color: 'from-blue-600 to-blue-700',
  },
  {
    id: 'social_media',
    name: 'Social Media Bot',
    description: 'Automate posting, engagement, and content curation',
    icon: Share2,
    color: 'from-pink-600 to-pink-700',
  },
  {
    id: 'lead_qualification',
    name: 'Lead Qualification',
    description: 'Automatically score and qualify leads based on criteria',
    icon: MessageSquare,
    color: 'from-orange-600 to-orange-700',
  },
];

const serverTypes = [
  {
    id: 'hosted',
    name: 'Hosted Server',
    description: 'Create and deploy a custom MCP server in the cloud',
    icon: Cloud,
  },
  {
    id: 'external',
    name: 'External Server',
    description: 'Connect to an existing MCP server via URL',
    icon: Server,
  },
  {
    id: 'custom',
    name: 'Custom Server',
    description: 'Build a custom server with TypeScript, Python, or .NET',
    icon: Code,
  },
];

export default function AIInfrastructure() {
  const [activeTab, setActiveTab] = useState<TabType>('agents');
  const permissions = usePermissions();

  const tabs = [
    { id: 'agents' as TabType, name: 'AI Agents', icon: Bot },
    { id: 'coding' as TabType, name: 'Codes', icon: Code },
    { id: 'mcp' as TabType, name: 'MCP Servers', icon: Server },
  ];

  return (
    <div className="p-6 lg:p-8 bg-page min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-primary">AI Infrastructure</h1>
        </div>
        <p className="text-secondary">Manage AI agents, custom codes, and MCP server connections.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface border border-border rounded-lg p-1 mb-6 w-fit">
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
      {activeTab === 'agents' && <AgentsTabContent />}
      {activeTab === 'coding' && <CodingTabContent />}
      {activeTab === 'mcp' && <MCPTabContent canConfigure={permissions.canConfigureMcpServers} />}
    </div>
  );
}

function AgentsTabContent() {
  const { agents, loading, createAgent, updateAgent, deleteAgent } = useAgents();
  const [showEnhancedModal, setShowEnhancedModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [showAgentManagement, setShowAgentManagement] = useState(false);
  const [showPlayground, setShowPlayground] = useState(false);
  const [playgroundAgent, setPlaygroundAgent] = useState<any>(null);

  const handleCreateAgent = async (config: any) => {
    try {
      await createAgent({
        name: config.name,
        description: config.description,
        agent_type: config.agentType,
        configuration: {
          aiModel: config.aiModel,
          mcpServerIds: config.mcpServerIds,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          referenceLinks: config.referenceLinks,
          uploadedFiles: config.uploadedFiles,
          promptTemplate: config.promptTemplate,
          memorySize: config.memorySize
        }
      });
    } catch (error) {
      console.error('Failed to create agent:', error);
      throw error;
    }
  };

  const getAgentTypeInfo = (type: string) => {
    return agentTypes.find(t => t.id === type) || agentTypes[0];
  };

  const getStatusColor = (status: string | null) => {
    return status === 'active' 
      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400';
  };

  const handleAgentClick = (agent: any) => {
    setSelectedAgent(agent);
    setShowAgentManagement(true);
  };

  const handleUpdateAgent = async (agentId: string, updates: any) => {
    try {
      await updateAgent(agentId, updates);
      setShowAgentManagement(false);
    } catch (error) {
      console.error('Failed to update agent:', error);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    try {
      await deleteAgent(agentId);
      setShowAgentManagement(false);
    } catch (error) {
      console.error('Failed to delete agent:', error);
    }
  };

  const handleRunAgent = (e: React.MouseEvent, agent: any) => {
    e.stopPropagation();
    setPlaygroundAgent(agent);
    setShowPlayground(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowEnhancedModal(true)}
          className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-accent-foreground px-4 py-2 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          Create Agent
        </button>
      </div>

      {agents.length === 0 ? (
        <div className="bg-surface rounded-xl shadow-sm border border-border p-12 text-center">
          <Bot className="w-16 h-16 text-subtle mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-primary mb-2">No agents yet</h3>
          <p className="text-secondary mb-6">
            Create your first AI agent to automate tasks and enhance productivity
          </p>
          <button
            onClick={() => setShowEnhancedModal(true)}
            className="bg-accent hover:bg-accent-hover text-accent-foreground px-6 py-3 rounded-lg transition"
          >
            Create Your First Agent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => {
            const typeInfo = getAgentTypeInfo(agent.agent_type);
            const TypeIcon = typeInfo.icon;

            return (
              <div
                key={agent.id}
                onClick={() => handleAgentClick(agent)}
                className="bg-surface rounded-xl shadow-sm border border-border p-6 hover:shadow-md transition cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${typeInfo.color} rounded-xl flex items-center justify-center`}>
                    <TypeIcon className="w-6 h-6 text-white" />
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(agent.status)}`}>
                    {agent.status}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-primary mb-2">{agent.name}</h3>
                <p className="text-sm text-secondary mb-4">{agent.description || typeInfo.description}</p>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-secondary">
                    <Activity className="w-4 h-4" />
                    <span>{agent.performance_metrics?.tasks_completed || 0} tasks</span>
                  </div>
                  <button
                    onClick={(e) => handleRunAgent(e, agent)}
                    className="flex items-center gap-1 text-xs font-medium bg-accent-subtle text-accent px-2 py-1 rounded hover:bg-accent hover:text-accent-foreground transition"
                  >
                    <Play className="w-3 h-3" /> Run
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <EnhancedAgentModal
        isOpen={showEnhancedModal}
        onClose={() => setShowEnhancedModal(false)}
        onSave={handleCreateAgent}
      />

      <AgentManagementModal
        isOpen={showAgentManagement}
        onClose={() => setShowAgentManagement(false)}
        agent={selectedAgent}
        onSave={handleUpdateAgent}
        onDelete={handleDeleteAgent}
      />

      <AgentPlaygroundModal
        isOpen={showPlayground}
        onClose={() => setShowPlayground(false)}
        agent={playgroundAgent}
      />
    </>
  );
}

function CodingTabContent() {
  return (
    <div className="space-y-6">
      <div className="bg-surface rounded-xl shadow-sm border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-primary">Company Codes & Scripts</h2>
            <p className="text-sm text-secondary">Customized codes and automation scripts for your organization</p>
          </div>
          <button className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-accent-foreground px-4 py-2 rounded-lg transition">
            <Plus className="w-4 h-4" />
            New Code
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CodeCard
            title="CRM Integration Script"
            description="Syncs customer data across all platforms automatically"
            language="JavaScript"
            icon={Code}
            color="from-blue-600 to-blue-700"
            lastUpdated="Nov 18"
          />
          <CodeCard
            title="Data Processing Pipeline"
            description="Processes incoming data and generates business insights"
            language="Python"
            icon={FileText}
            color="from-green-600 to-green-700"
            lastUpdated="Nov 17"
          />
          <CodeCard
            title="Analytics Queries"
            description="Custom database queries for company-specific reporting"
            language="SQL"
            icon={Settings}
            color="from-purple-600 to-purple-700"
            lastUpdated="Nov 16"
          />
          <CodeCard
            title="Webhook Integrations"
            description="Custom webhook handlers for third-party service integrations"
            language="API"
            icon={Zap}
            color="from-red-600 to-red-700"
            lastUpdated="Nov 15"
          />
          <CodeCard
            title="AI Workflow Scripts"
            description="Custom scripts for AI agent automation and processing"
            language="Agent"
            icon={Bot}
            color="from-indigo-600 to-indigo-700"
            lastUpdated="Nov 14"
          />

          <div className="bg-gradient-to-br from-accent-subtle to-surface border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center text-center hover:border-accent transition">
            <Code className="w-12 h-12 text-subtle mb-2" />
            <h4 className="font-medium text-primary mb-1">Add Custom Code</h4>
            <p className="text-sm text-secondary mb-3">Create company-specific scripts and automation</p>
            <button className="text-accent text-sm hover:underline font-medium">
              + Create Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CodeCard({ title, description, language, icon: Icon, color, lastUpdated }: {
  title: string;
  description: string;
  language: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  lastUpdated: string;
}) {
  const languageColors: Record<string, string> = {
    'JavaScript': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    'Python': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    'SQL': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
    'API': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    'Agent': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  };

  return (
    <div className="bg-surface-hover rounded-lg border border-border p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 bg-gradient-to-br ${color} rounded-lg flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className={`text-xs px-2 py-1 rounded ${languageColors[language] || 'bg-gray-100 text-gray-700'}`}>
          {language}
        </span>
      </div>
      <h3 className="font-medium text-primary mb-2">{title}</h3>
      <p className="text-sm text-secondary mb-3">{description}</p>
      <div className="flex items-center justify-between text-xs text-subtle">
        <span>Last updated: {lastUpdated}</span>
        <div className="flex gap-1">
          <button className="text-accent hover:text-accent-hover p-1" title="View Code">
            <Eye className="w-3 h-3" />
          </button>
          <button className="text-accent hover:text-accent-hover p-1" title="Copy Code">
            <Copy className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function MCPTabContent({ canConfigure }: { canConfigure: boolean }) {
  const { servers, loading, createServer, toggleServer } = useMCPServers();
  const [showNewServer, setShowNewServer] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    endpoint_url: '',
  });

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !selectedType) return;

    setCreating(true);
    try {
      await createServer({
        name: formData.name,
        description: formData.description,
        server_type: selectedType,
        endpoint_url: formData.endpoint_url || undefined,
      });
      setFormData({ name: '', description: '', endpoint_url: '' });
      setSelectedType(null);
      setShowNewServer(false);
    } catch (error) {
      console.error('Failed to create MCP server:', error);
    } finally {
      setCreating(false);
    }
  };

  const getHealthIcon = (status: string) => {
    return status === 'healthy' ? CheckCircle : AlertCircle;
  };

  const getHealthColor = (status: string) => {
    return status === 'healthy' ? 'text-green-600' : 'text-red-600';
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <>
      {/* Permission Notice for Non-Admins */}
      {!canConfigure && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-800 dark:text-amber-200">View-Only Access</h4>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              You can view and toggle MCP servers, but only GAS administrators can add or configure servers.
              Use the toggle switches to enable or disable servers for your organization.
            </p>
          </div>
        </div>
      )}

      {/* Add Server Button (GAS Admin Only) */}
      {canConfigure && (
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowNewServer(true)}
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-accent-foreground px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            Add Server
          </button>
        </div>
      )}

      {servers.length === 0 ? (
        <div className="bg-surface rounded-xl shadow-sm border border-border p-12 text-center">
          <Server className="w-16 h-16 text-subtle mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-primary mb-2">No MCP servers yet</h3>
          <p className="text-secondary mb-6">
            {canConfigure 
              ? 'Connect or create MCP servers to extend your AI capabilities with custom tools and resources'
              : 'No MCP servers have been configured for your organization yet. Contact your GAS administrator to set up servers.'}
          </p>
          {canConfigure && (
            <button
              onClick={() => setShowNewServer(true)}
              className="bg-accent hover:bg-accent-hover text-accent-foreground px-6 py-3 rounded-lg transition"
            >
              Add Your First Server
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servers.map((server) => {
            const HealthIcon = getHealthIcon(server.health_status);
            const healthColor = getHealthColor(server.health_status);

            return (
              <div
                key={server.id}
                className="bg-surface rounded-xl shadow-sm border border-border p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                    <Server className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    <HealthIcon className={`w-5 h-5 ${healthColor}`} />
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(server.status)}`}>
                      {server.status}
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-primary mb-2">{server.name}</h3>
                <p className="text-sm text-secondary mb-4">{server.description || `${server.server_type} server`}</p>

                <div className="space-y-2 pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary">Type</span>
                    <span className="font-medium text-primary">{server.server_type}</span>
                  </div>
                  {server.endpoint_url && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-secondary">Endpoint</span>
                      <span className="font-mono text-xs text-primary truncate max-w-[150px]">
                        {server.endpoint_url}
                      </span>
                    </div>
                  )}
                </div>

                {/* Toggle Switch for All Users */}
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-sm text-secondary">Server Enabled</span>
                  <button
                    onClick={() => toggleServer?.(server.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      server.is_enabled !== false ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        server.is_enabled !== false ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Configure Button (GAS Admin Only) */}
                {canConfigure && (
                  <button className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-accent hover:bg-accent-subtle rounded-lg transition">
                    <Settings className="w-4 h-4" />
                    Configure
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New Server Modal (GAS Admin Only) */}
      {showNewServer && canConfigure && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto border border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-primary">Add MCP Server</h2>
              <button
                onClick={() => {
                  setShowNewServer(false);
                  setSelectedType(null);
                }}
                className="text-subtle hover:text-primary"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateServer} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-primary mb-3">
                  Server Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {serverTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setSelectedType(type.id)}
                        className={`p-4 border-2 rounded-lg text-left transition ${
                          selectedType === type.id
                            ? 'border-accent bg-accent-subtle'
                            : 'border-border hover:border-accent/50'
                        }`}
                      >
                        <div className="flex flex-col items-center text-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-primary mb-1">{type.name}</h4>
                            <p className="text-sm text-secondary">{type.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Server Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-border bg-surface text-primary rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                  placeholder="My MCP Server"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-border bg-surface text-primary rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none resize-none"
                  placeholder="Describe what this server provides..."
                />
              </div>

              {selectedType === 'external' && (
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Endpoint URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    required={selectedType === 'external'}
                    value={formData.endpoint_url}
                    onChange={(e) => setFormData({ ...formData, endpoint_url: e.target.value })}
                    className="w-full px-4 py-2 border border-border bg-surface text-primary rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                    placeholder="https://api.example.com/mcp"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewServer(false);
                    setSelectedType(null);
                  }}
                  className="flex-1 px-4 py-2 border border-border text-secondary rounded-lg hover:bg-surface-hover transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !formData.name.trim() || !selectedType}
                  className="flex-1 px-4 py-2 bg-accent hover:bg-accent-hover text-accent-foreground rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Server'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

