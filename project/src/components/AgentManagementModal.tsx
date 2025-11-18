import React, { useState, useEffect } from 'react';
import { X, Edit, Settings, FileText, Image, Video, Link, Trash2, Power, Play, Pause, Save } from 'lucide-react';
import { useMCPServers } from '../hooks/useMCPServers';

interface ReferenceLink {
  id: string;
  url: string;
  title: string;
  description?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  type: 'document' | 'image' | 'video';
  size: number;
  url: string;
}

interface AgentData {
  id: string;
  name: string;
  description: string | null;
  agent_type: string;
  status: string | null;
  configuration: any;
  knowledge_base: any;
  performance_metrics: any;
}

interface AgentManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AgentData | null;
  onSave: (agentId: string, updates: Partial<AgentData>) => Promise<void>;
  onDelete: (agentId: string) => Promise<void>;
}

const AgentManagementModal: React.FC<AgentManagementModalProps> = ({
  isOpen,
  onClose,
  agent,
  onSave,
  onDelete
}) => {
  const { servers: mcpServers } = useMCPServers();
  const [activeTab, setActiveTab] = useState<'overview' | 'configuration' | 'resources'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    agent_type: '',
    status: 'active',
    aiModel: 'gemini',
    temperature: 0.7,
    maxTokens: 2000,
    mcpServerIds: [] as string[],
    referenceLinks: [] as ReferenceLink[],
    uploadedFiles: [] as UploadedFile[],
    promptTemplate: ''
  });

  const [newLink, setNewLink] = useState({ url: '', title: '', description: '' });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name || '',
        description: agent.description || '',
        agent_type: agent.agent_type || '',
        status: agent.status || 'active',
        aiModel: agent.configuration?.aiModel || 'gemini',
        temperature: agent.configuration?.temperature || 0.7,
        maxTokens: agent.configuration?.maxTokens || 2000,
        mcpServerIds: agent.configuration?.mcpServerIds || [],
        referenceLinks: agent.knowledge_base?.referenceLinks || [],
        uploadedFiles: agent.knowledge_base?.uploadedFiles || [],
        promptTemplate: agent.knowledge_base?.promptTemplate || ''
      });
    }
  }, [agent]);

  const handleSave = async () => {
    if (!agent) return;

    try {
      const updates: Partial<AgentData> = {
        name: formData.name,
        description: formData.description,
        agent_type: formData.agent_type,
        status: formData.status,
        configuration: {
          aiModel: formData.aiModel,
          temperature: formData.temperature,
          maxTokens: formData.maxTokens,
          mcpServerIds: formData.mcpServerIds
        },
        knowledge_base: {
          referenceLinks: formData.referenceLinks,
          uploadedFiles: formData.uploadedFiles,
          promptTemplate: formData.promptTemplate,
          memorySize: 1000
        }
      };

      await onSave(agent.id, updates);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update agent:', error);
    }
  };

  const handleToggleStatus = async () => {
    if (!agent) return;

    const newStatus = formData.status === 'active' ? 'inactive' : 'active';
    setFormData({ ...formData, status: newStatus });

    try {
      await onSave(agent.id, { status: newStatus });
    } catch (error) {
      // Revert on error
      setFormData({ ...formData, status: formData.status });
    }
  };

  const addReferenceLink = () => {
    if (!newLink.url.trim() || !newLink.title.trim()) return;

    setFormData({
      ...formData,
      referenceLinks: [...formData.referenceLinks, {
        id: Date.now().toString(),
        ...newLink
      }]
    });
    setNewLink({ url: '', title: '', description: '' });
  };

  const removeReferenceLink = (id: string) => {
    setFormData({
      ...formData,
      referenceLinks: formData.referenceLinks.filter(link => link.id !== id)
    });
  };

  const removeUploadedFile = (id: string) => {
    setFormData({
      ...formData,
      uploadedFiles: formData.uploadedFiles.filter(file => file.id !== id)
    });
  };

  const handleFileUpload = async (files: FileList) => {
    setUploading(true);
    // Mock file upload - in real implementation, this would upload to cloud storage
    for (let file of Array.from(files)) {
      const fileType = file.type.startsWith('image/') ? 'image' :
                      file.type.startsWith('video/') ? 'video' : 'document';

      const uploadedFile: UploadedFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: fileType,
        size: file.size,
        url: `https://storage.example.com/${file.name}`
      };

      setFormData(prev => ({
        ...prev,
        uploadedFiles: [...prev.uploadedFiles, uploadedFile]
      }));
    }
    setUploading(false);
  };

  const handleDeleteAgent = async () => {
    if (!agent || !window.confirm('Are you sure you want to delete this agent? This action cannot be undone.')) return;

    try {
      await onDelete(agent.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete agent:', error);
    }
  };

  if (!isOpen || !agent) return null;

  const getAgentTypeInfo = (type: string) => {
    const types = {
      'content_generation': { name: 'Content Generation', icon: '✏️', color: 'bg-purple-100 text-purple-800' },
      'voice': { name: 'Voice Agent', icon: '📞', color: 'bg-green-100 text-green-800' },
      'operating': { name: 'Operating Agent', icon: '🧠', color: 'bg-blue-100 text-blue-800' },
      'social_media': { name: 'Social Media Bot', icon: '📱', color: 'bg-pink-100 text-pink-800' },
      'lead_qualification': { name: 'Lead Qualification', icon: '🎯', color: 'bg-orange-100 text-orange-800' }
    };
    return types[type as keyof typeof types] || types.content_generation;
  };

  const agentTypeInfo = getAgentTypeInfo(agent.agent_type);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 bg-gradient-to-br rounded-xl flex items-center justify-center text-2xl`}>
              {agentTypeInfo.icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{agent.name}</h2>
              <p className="text-sm text-gray-600">{agentTypeInfo.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Status Toggle */}
            <button
              onClick={handleToggleStatus}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition ${
                formData.status === 'active'
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {formData.status === 'active' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {formData.status === 'active' ? 'Active' : 'Inactive'}
            </button>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 text-gray-600 hover:text-gray-800 transition"
            >
              <Edit className="w-5 h-5" />
            </button>

            <button
              onClick={() => onClose()}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-140px)]">
          {/* Sidebar Navigation */}
          <div className="w-64 border-r border-gray-200 p-6">
            <nav className="space-y-2">
              {[
                { id: 'overview', label: 'Overview', icon: Settings },
                { id: 'configuration', label: 'Configuration', icon: Settings },
                { id: 'resources', label: 'Resources & Knowledge', icon: FileText }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${
                      activeTab === tab.id
                        ? 'bg-blue-50 border-r-2 border-blue-600 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {isEditing && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleDeleteAgent}
                  className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Agent
                </button>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                        />
                      ) : (
                        <p className="text-gray-900">{agent.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                      <p className="text-gray-900">{agentTypeInfo.name}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      {isEditing ? (
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
                        />
                      ) : (
                        <p className="text-gray-900">{agent.description || 'No description provided'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{agent.performance_metrics?.tasks_completed || 0}</div>
                      <div className="text-sm text-gray-600">Tasks Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{agent.performance_metrics?.success_rate || 0}%</div>
                      <div className="text-sm text-gray-600">Success Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{agent.performance_metrics?.tokens_used || 0}</div>
                      <div className="text-sm text-gray-600">Tokens Used</div>
                    </div>
                  </div>
                </div>

                {/* Connected MCP Servers */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Connected MCP Servers</h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.mcpServerIds.length > 0 ? (
                      formData.mcpServerIds.map(serverId => {
                        const server = mcpServers.find(s => s.id === serverId);
                        return (
                          <span key={serverId} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                            {server?.name || 'Unknown Server'}
                          </span>
                        );
                      })
                    ) : (
                      <p className="text-gray-500">No MCP servers connected</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'configuration' && (
              <div className="space-y-6">
                {/* AI Model Settings */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Model Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">AI Model</label>
                      {isEditing ? (
                        <select
                          value={formData.aiModel}
                          onChange={(e) => setFormData({ ...formData, aiModel: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                        >
                          <option value="gemini">🤖 Google Gemini</option>
                          <option value="gpt-4">🧠 GPT-4</option>
                          <option value="claude">📚 Claude</option>
                          <option value="gpt-3.5">⚡ GPT-3.5 Turbo</option>
                        </select>
                      ) : (
                        <p className="text-gray-900">{formData.aiModel}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Temperature</label>
                      {isEditing ? (
                        <div>
                          <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={formData.temperature}
                            onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                            className="w-full"
                          />
                          <span className="text-sm text-gray-600 block mt-1">{formData.temperature}</span>
                        </div>
                      ) : (
                        <p className="text-gray-900">{formData.temperature}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Tokens</label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={formData.maxTokens}
                          onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) })}
                          min="100"
                          max="4000"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                        />
                      ) : (
                        <p className="text-gray-900">{formData.maxTokens}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* MCP Servers */}
                {isEditing && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Connected MCP Servers</h3>
                    <div className="space-y-3">
                      {mcpServers.map(server => (
                        <div key={server.id} className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id={server.id}
                            checked={formData.mcpServerIds.includes(server.id)}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              setFormData({
                                ...formData,
                                mcpServerIds: isChecked
                                  ? [...formData.mcpServerIds, server.id]
                                  : formData.mcpServerIds.filter(id => id !== server.id)
                              });
                            }}
                            className="w-4 h-4 text-blue-600"
                          />
                          <label htmlFor={server.id} className="text-sm">
                            <span className="font-medium">{server.name}</span>
                            <span className="text-gray-600 ml-2">({server.server_type})</span>
                          </label>
                        </div>
                      ))}
                      {mcpServers.length === 0 && (
                        <p className="text-sm text-gray-500">No MCP servers available. Add servers from the MCP page.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="space-y-6">
                {/* Prompt Template */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Prompt Template</h3>
                  {isEditing ? (
                    <textarea
                      value={formData.promptTemplate}
                      onChange={(e) => setFormData({ ...formData, promptTemplate: e.target.value })}
                      rows={8}
                      placeholder="Enter your custom prompt template... Use {input} for user input, {context} for additional context, etc."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none font-mono text-sm"
                    />
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-wrap font-mono text-sm">
                        {formData.promptTemplate || 'No custom prompt template set'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Reference Links */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Reference Links</h3>
                  <div className="space-y-3">
                    {formData.referenceLinks.map(link => (
                      <div key={link.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Link className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline truncate">
                              {link.title}
                            </a>
                          </div>
                          {link.description && (
                            <p className="text-sm text-gray-600 mt-1">{link.description}</p>
                          )}
                        </div>
                        {isEditing && (
                          <button
                            onClick={() => removeReferenceLink(link.id)}
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {formData.referenceLinks.length === 0 && (
                      <p className="text-gray-500 text-sm">No reference links added yet</p>
                    )}
                    {isEditing && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                        <input
                          type="url"
                          placeholder="https://..."
                          value={newLink.url}
                          onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Link title"
                          value={newLink.title}
                          onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                        />
                        <button
                          onClick={addReferenceLink}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
                        >
                          <Link className="w-4 h-4" />
                          Add Link
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Uploaded Files */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Knowledge Base Files</h3>
                  <div className="space-y-3">
                    {formData.uploadedFiles.map(file => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {file.type === 'image' && <Image className="w-4 h-4 text-green-600" />}
                          {file.type === 'video' && <Video className="w-4 h-4 text-blue-600" />}
                          {file.type === 'document' && <FileText className="w-4 h-4 text-red-600" />}
                          <span className="font-medium">{file.name}</span>
                          <span className="text-sm text-gray-500">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        {isEditing && (
                          <button
                            onClick={() => removeUploadedFile(file.id)}
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {formData.uploadedFiles.length === 0 && (
                      <p className="text-gray-500 text-sm">No files uploaded yet</p>
                    )}
                    {isEditing && (
                      <div className="mt-4">
                        <input
                          type="file"
                          multiple
                          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                          className="hidden"
                          id="resource-upload"
                        />
                        <label
                          htmlFor="resource-upload"
                          className={`inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-600 transition cursor-pointer ${
                            uploading ? 'opacity-50 cursor-wait' : ''
                          }`}
                        >
                          {uploading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <FileText className="w-4 h-4" />
                              Add More Files
                            </>
                          )}
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {isEditing && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <button
              onClick={() => {
                setIsEditing(false);
                // Reset form data to original agent data
                if (agent) {
                  setFormData({
                    name: agent.name || '',
                    description: agent.description || '',
                    agent_type: agent.agent_type || '',
                    status: agent.status || 'active',
                    aiModel: agent.configuration?.aiModel || 'gemini',
                    temperature: agent.configuration?.temperature || 0.7,
                    maxTokens: agent.configuration?.maxTokens || 2000,
                    mcpServerIds: agent.configuration?.mcpServerIds || [],
                    referenceLinks: agent.knowledge_base?.referenceLinks || [],
                    uploadedFiles: agent.knowledge_base?.uploadedFiles || [],
                    promptTemplate: agent.knowledge_base?.promptTemplate || ''
                  });
                }
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentManagementModal;
