import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAgents } from '../../hooks/useAgents';
import { useMCPServers } from '../../hooks/useMCPServers';
import { Bot, Plus, X, Loader2, Sparkles, MessageSquare, Phone, Zap, Share2, Activity, Edit, Power, Code, FileText, Settings, Copy, Eye, Server, Cloud, CheckCircle, AlertCircle } from 'lucide-react';
import EnhancedAgentModal from '../../components/os/EnhancedAgentModal';
import AgentManagementModal from '../../components/os/AgentManagementModal';

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

export default function OSAgents() {
  const { agents, loading, createAgent, updateAgent, deleteAgent } = useAgents();
  const { servers, loading: mcpLoading, createServer } = useMCPServers();

  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialTab = tabParam === 'mcp' ? 'mcp' : tabParam === 'coding' ? 'coding' : 'agents';
  const [activeTab, setActiveTab] = useState<'agents' | 'coding' | 'mcp'>(initialTab);

  // Agent state
  const [showEnhancedModal, setShowEnhancedModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [showAgentManagement, setShowAgentManagement] = useState(false);

  // MCP state
  const [showNewServer, setShowNewServer] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [creatingServer, setCreatingServer] = useState(false);
  const [editingServer, setEditingServer] = useState<any>(null);
  const [showEditServer, setShowEditServer] = useState(false);
  const [serverFormData, setServerFormData] = useState({ name: '', description: '', endpoint_url: '' });
  const [editServerFormData, setEditServerFormData] = useState({ name: '', description: '', endpoint_url: '' });

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
          memorySize: config.memorySize,
        },
      });
    } catch (error) {
      console.error('Failed to create agent:', error);
      throw error;
    }
  };

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverFormData.name.trim() || !selectedType) return;
    setCreatingServer(true);
    try {
      await createServer({
        name: serverFormData.name,
        description: serverFormData.description,
        server_type: selectedType,
        endpoint_url: serverFormData.endpoint_url || undefined,
      });
      setServerFormData({ name: '', description: '', endpoint_url: '' });
      setSelectedType(null);
      setShowNewServer(false);
    } catch (error) {
      console.error('Failed to create MCP server:', error);
    } finally {
      setCreatingServer(false);
    }
  };

  const getAgentTypeInfo = (type: string) => {
    return agentTypes.find((t) => t.id === type) || agentTypes[0];
  };

  const getStatusColor = (status: string | null) => {
    return status === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-gray-800 text-gray-400';
  };

  const getHealthIcon = (status: string) => {
    return status === 'healthy' ? CheckCircle : AlertCircle;
  };

  const getHealthColor = (status: string) => {
    return status === 'healthy' ? 'text-green-400' : 'text-red-400';
  };

  const getServerStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-gray-800 text-gray-400';
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

  if (loading && mcpLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bot className="w-8 h-8 text-primary-400" />
          <h1 className="text-3xl font-bold text-white">AI & Automation</h1>
        </div>
        {activeTab === 'agents' && (
          <button
            onClick={() => setShowEnhancedModal(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            Create Agent
          </button>
        )}
        {activeTab === 'mcp' && (
          <button
            onClick={() => setShowNewServer(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            Add Server
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('agents')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'agents'
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              <Bot className="w-4 h-4 inline mr-2" />
              AI Agents
            </button>
            <button
              onClick={() => setActiveTab('coding')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'coding'
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              <Code className="w-4 h-4 inline mr-2" />
              Codes
            </button>
            <button
              onClick={() => setActiveTab('mcp')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'mcp'
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              <Server className="w-4 h-4 inline mr-2" />
              MCP Servers
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'agents' && (
        <>
          {agents.length === 0 ? (
            <div className="bg-gray-900 rounded-xl border border-gray-700 p-12 text-center">
              <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No agents yet</h3>
              <p className="text-gray-400 mb-6">
                Create your first AI agent to automate tasks and enhance productivity
              </p>
              <button
                onClick={() => setShowEnhancedModal(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition"
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
                    className="bg-gray-900 rounded-xl border border-gray-700 p-6 hover:border-gray-600 transition cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${typeInfo.color} rounded-xl flex items-center justify-center`}>
                        <TypeIcon className="w-6 h-6 text-white" />
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(agent.status)}`}>
                        {agent.status}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-2">{agent.name}</h3>
                    <p className="text-sm text-gray-400 mb-4">{agent.description || typeInfo.description}</p>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Activity className="w-4 h-4" />
                        <span>{agent.performance_metrics?.tasks_completed || 0} tasks</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {agent.performance_metrics?.success_rate || 0}% success
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'coding' && (
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">Company Codes & Scripts</h2>
                <p className="text-sm text-gray-400">Customized codes and automation scripts for your organization</p>
              </div>
              <button className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition">
                <Plus className="w-4 h-4" />
                New Code
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <Code className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs px-2 py-1 bg-green-900/30 text-green-400 rounded">JavaScript</span>
                </div>
                <h3 className="font-medium text-white mb-2">CRM Integration Script</h3>
                <p className="text-sm text-gray-400 mb-3">Syncs customer data across all platforms automatically</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Last updated: Nov 18</span>
                  <div className="flex gap-1">
                    <button className="text-primary-400 hover:text-blue-300 p-1" title="View Code"><Eye className="w-3 h-3" /></button>
                    <button className="text-primary-400 hover:text-blue-300 p-1" title="Copy Code"><Copy className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs px-2 py-1 bg-purple-900/30 text-purple-400 rounded">Python</span>
                </div>
                <h3 className="font-medium text-white mb-2">Data Processing Pipeline</h3>
                <p className="text-sm text-gray-400 mb-3">Processes incoming data and generates business insights</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Last updated: Nov 17</span>
                  <div className="flex gap-1">
                    <button className="text-primary-400 hover:text-blue-300 p-1" title="View Code"><Eye className="w-3 h-3" /></button>
                    <button className="text-primary-400 hover:text-blue-300 p-1" title="Copy Code"><Copy className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs px-2 py-1 bg-orange-900/30 text-orange-400 rounded">SQL</span>
                </div>
                <h3 className="font-medium text-white mb-2">Analytics Queries</h3>
                <p className="text-sm text-gray-400 mb-3">Custom database queries for company-specific reporting</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Last updated: Nov 16</span>
                  <div className="flex gap-1">
                    <button className="text-primary-400 hover:text-blue-300 p-1" title="View Code"><Eye className="w-3 h-3" /></button>
                    <button className="text-primary-400 hover:text-blue-300 p-1" title="Copy Code"><Copy className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs px-2 py-1 bg-yellow-900/30 text-yellow-400 rounded">API</span>
                </div>
                <h3 className="font-medium text-white mb-2">Webhook Integrations</h3>
                <p className="text-sm text-gray-400 mb-3">Custom webhook handlers for third-party service integrations</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Last updated: Nov 15</span>
                  <div className="flex gap-1">
                    <button className="text-primary-400 hover:text-blue-300 p-1" title="View Code"><Eye className="w-3 h-3" /></button>
                    <button className="text-primary-400 hover:text-blue-300 p-1" title="Copy Code"><Copy className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs px-2 py-1 bg-blue-900/30 text-blue-400 rounded">Agent</span>
                </div>
                <h3 className="font-medium text-white mb-2">AI Workflow Scripts</h3>
                <p className="text-sm text-gray-400 mb-3">Custom scripts for AI agent automation and processing</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Last updated: Nov 14</span>
                  <div className="flex gap-1">
                    <button className="text-primary-400 hover:text-blue-300 p-1" title="View Code"><Eye className="w-3 h-3" /></button>
                    <button className="text-primary-400 hover:text-blue-300 p-1" title="Copy Code"><Copy className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border-2 border-dashed border-blue-700 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                <Code className="w-12 h-12 text-blue-400 mb-2" />
                <h4 className="font-medium text-white mb-1">Add Custom Code</h4>
                <p className="text-sm text-gray-400 mb-3">Create company-specific scripts and automation</p>
                <button className="text-primary-400 text-sm hover:text-blue-300 font-medium">
                  + Create Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'mcp' && (
        <>
          {servers.length === 0 ? (
            <div className="bg-gray-900 rounded-xl border border-gray-700 p-12 text-center">
              <Server className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No MCP servers yet</h3>
              <p className="text-gray-400 mb-6">
                Connect or create MCP servers to extend your AI capabilities with custom tools and resources
              </p>
              <button
                onClick={() => setShowNewServer(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition"
              >
                Add Your First Server
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {servers.map((server) => {
                const HealthIcon = getHealthIcon(server.health_status);
                const healthColor = getHealthColor(server.health_status);

                return (
                  <div
                    key={server.id}
                    onClick={() => {
                      setEditingServer(server);
                      setEditServerFormData({
                        name: server.name,
                        description: server.description || '',
                        endpoint_url: server.endpoint_url || '',
                      });
                      setShowEditServer(true);
                    }}
                    className="bg-gray-900 rounded-xl border border-gray-700 p-6 hover:border-gray-600 transition cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                        <Server className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        <HealthIcon className={`w-5 h-5 ${healthColor}`} />
                        <span className={`text-xs px-2 py-1 rounded ${getServerStatusColor(server.status)}`}>
                          {server.status}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-2">{server.name}</h3>
                    <p className="text-sm text-gray-400 mb-4">{server.description || `${server.server_type} server`}</p>

                    <div className="space-y-2 pt-4 border-t border-gray-700">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Type</span>
                        <span className="font-medium text-white">{server.server_type}</span>
                      </div>
                      {server.endpoint_url && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Endpoint</span>
                          <span className="font-mono text-xs text-white truncate max-w-[150px]">{server.endpoint_url}</span>
                        </div>
                      )}
                      {server.version && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Version</span>
                          <span className="font-medium text-white">{server.version}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Agent Modals */}
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

      {/* Add MCP Server Modal */}
      {showNewServer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Add MCP Server</h2>
              <button onClick={() => { setShowNewServer(false); setSelectedType(null); }} className="text-gray-400 hover:text-gray-300">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateServer} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
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
                            ? 'border-primary-600 bg-blue-900/20'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex flex-col items-center text-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-white mb-1">{type.name}</h4>
                            <p className="text-sm text-gray-400">{type.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Server Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={serverFormData.name}
                  onChange={(e) => setServerFormData({ ...serverFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-800 text-white placeholder-gray-500"
                  placeholder="My MCP Server"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={serverFormData.description}
                  onChange={(e) => setServerFormData({ ...serverFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none bg-gray-800 text-white placeholder-gray-500"
                  placeholder="Describe what this server provides..."
                />
              </div>

              {selectedType === 'external' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Endpoint URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    required={selectedType === 'external'}
                    value={serverFormData.endpoint_url}
                    onChange={(e) => setServerFormData({ ...serverFormData, endpoint_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-800 text-white placeholder-gray-500"
                    placeholder="https://api.example.com/mcp"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowNewServer(false); setSelectedType(null); }}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition">Cancel</button>
                <button type="submit" disabled={creatingServer || !serverFormData.name.trim() || !selectedType}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {creatingServer ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Server'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit MCP Server Modal */}
      {showEditServer && editingServer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Edit MCP Server</h2>
              <button onClick={() => { setShowEditServer(false); setEditingServer(null); }} className="text-gray-400 hover:text-gray-300">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
              <h3 className="font-medium text-blue-300 mb-2">{editingServer.name}</h3>
              <p className="text-sm text-blue-400">Configure server settings, endpoints, and connection details.</p>
            </div>

            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Server Name</label>
                <input type="text" value={editServerFormData.name}
                  onChange={(e) => setEditServerFormData({ ...editServerFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-800 text-white placeholder-gray-500"
                  placeholder="Server name" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea value={editServerFormData.description}
                  onChange={(e) => setEditServerFormData({ ...editServerFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none bg-gray-800 text-white placeholder-gray-500"
                  placeholder="Describe what this server provides..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Endpoint URL</label>
                <input type="url" value={editServerFormData.endpoint_url}
                  onChange={(e) => setEditServerFormData({ ...editServerFormData, endpoint_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-800 text-white placeholder-gray-500"
                  placeholder="https://api.example.com/mcp" />
                <p className="text-xs text-gray-500 mt-1">API endpoint for the MCP server connection</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Server Configuration</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Timeout (seconds)</label>
                    <input type="number"
                      className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-800 text-white placeholder-gray-500"
                      placeholder="30" min="5" max="300" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Max Retries</label>
                    <input type="number"
                      className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-800 text-white placeholder-gray-500"
                      placeholder="3" min="0" max="10" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Authentication</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">API Key</label>
                    <input type="password"
                      className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-800 text-white placeholder-gray-500"
                      placeholder="Authentication key" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Bearer Token</label>
                    <input type="password"
                      className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-800 text-white placeholder-gray-500"
                      placeholder="Bearer token" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowEditServer(false); setEditingServer(null); }}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition">Cancel</button>
                <button type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition flex items-center justify-center gap-2">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
