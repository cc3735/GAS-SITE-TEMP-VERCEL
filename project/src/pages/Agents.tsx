import { useState } from 'react';
import { useAgents } from '../hooks/useAgents';
import { Bot, Plus, X, Loader2, Sparkles, MessageSquare, Phone, Zap, Share2, Activity } from 'lucide-react';

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
  const { agents, loading, createAgent } = useAgents();
  const [showNewAgent, setShowNewAgent] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !selectedType) return;

    setCreating(true);
    try {
      await createAgent({
        name: formData.name,
        description: formData.description,
        agent_type: selectedType,
      });
      setFormData({ name: '', description: '' });
      setSelectedType(null);
      setShowNewAgent(false);
    } catch (error) {
      console.error('Failed to create agent:', error);
    } finally {
      setCreating(false);
    }
  };

  const getAgentTypeInfo = (type: string) => {
    return agentTypes.find(t => t.id === type) || agentTypes[0];
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700';
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
          onClick={() => setShowNewAgent(true)}
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
            onClick={() => setShowNewAgent(true)}
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
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition cursor-pointer"
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

      {showNewAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create New AI Agent</h2>
              <button
                onClick={() => {
                  setShowNewAgent(false);
                  setSelectedType(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateAgent} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Agent Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {agentTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setSelectedType(type.id)}
                        className={`p-4 border-2 rounded-lg text-left transition ${
                          selectedType === type.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 bg-gradient-to-br ${type.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 mb-1">{type.name}</h4>
                            <p className="text-sm text-gray-600">{type.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  placeholder="My Content Generator"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
                  placeholder="Describe what this agent does..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewAgent(false);
                    setSelectedType(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !formData.name.trim() || !selectedType}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
