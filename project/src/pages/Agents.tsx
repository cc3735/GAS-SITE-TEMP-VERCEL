import { useState } from 'react';
import { useAgents } from '../hooks/useAgents';
import { Bot, Plus, X, Loader2, Sparkles, MessageSquare, Phone, Zap, Share2, Activity, Edit, Power } from 'lucide-react';
import EnhancedAgentModal from '../components/EnhancedAgentModal';
import AgentManagementModal from '../components/AgentManagementModal';

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

export default function Agents() {
  const { agents, loading, createAgent, updateAgent, deleteAgent } = useAgents();
  const [showEnhancedModal, setShowEnhancedModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [showAgentManagement, setShowAgentManagement] = useState(false);

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
    return status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700';
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

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bot className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">AI Agents</h1>
        </div>
        <button
          onClick={() => setShowEnhancedModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          Create Agent
        </button>
      </div>

      {agents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No agents yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first AI agent to automate tasks and enhance productivity
          </p>
          <button
            onClick={() => setShowEnhancedModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition"
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
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${typeInfo.color} rounded-xl flex items-center justify-center`}>
                    <TypeIcon className="w-6 h-6 text-white" />
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(agent.status)}`}>
                    {agent.status}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">{agent.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{agent.description || typeInfo.description}</p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
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
    </div>
  );
}
