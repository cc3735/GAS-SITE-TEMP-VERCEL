import React, { useState } from 'react';
import { X, Plus, Upload, Link, FileText, Image, Video, Trash2, Code, Zap } from 'lucide-react';
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

interface AgentConfig {
  name: string;
  description: string;
  agentType: string;
  aiModel: string;
  mcpServerIds: string[];
  temperature: number;
  maxTokens: number;
  referenceLinks: ReferenceLink[];
  uploadedFiles: UploadedFile[];
  promptTemplate: string;
  memorySize: number;
}

interface EnhancedAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: AgentConfig) => Promise<void>;
}

const agentTypes = [
  {
    id: 'content_generation',
    name: 'Content Generation',
    description: 'Create blog posts, social media content, emails',
    icon: '✏️',
    color: 'bg-purple-100 text-purple-800'
  },
  {
    id: 'voice',
    name: 'Voice Agent',
    description: 'Handle phone calls with real-time speech processing',
    icon: '📞',
    color: 'bg-green-100 text-green-800'
  },
  {
    id: 'operating',
    name: 'Operating Agent',
    description: 'Knowledgeable assistant for entire operations',
    icon: '🧠',
    color: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'social_media',
    name: 'Social Media Bot',
    description: 'Automate posting and content curation',
    icon: '📱',
    color: 'bg-pink-100 text-pink-800'
  },
  {
    id: 'lead_qualification',
    name: 'Lead Qualification',
    description: 'Automatically score and qualify leads',
    icon: '🎯',
    color: 'bg-orange-100 text-orange-800'
  }
];

const EnhancedAgentModal: React.FC<EnhancedAgentModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const { servers: mcpServers } = useMCPServers();
  const [creationMethod, setCreationMethod] = useState<'wizard' | 'json' | 'n8n'>('wizard');
  const [jsonConfig, setJsonConfig] = useState('');
  const [n8nUrl, setN8nUrl] = useState('');
  const [n8nApiKey, setN8nApiKey] = useState('');

  const [config, setConfig] = useState<AgentConfig>({
    name: '',
    description: '',
    agentType: '',
    aiModel: 'gemini',
    mcpServerIds: [],
    temperature: 0.7,
    maxTokens: 2000,
    referenceLinks: [],
    uploadedFiles: [],
    promptTemplate: '',
    memorySize: 1000
  });

  const [newLink, setNewLink] = useState({ url: '', title: '', description: '' });
  const [uploading, setUploading] = useState(false);

  const handleSave = async () => {
    if (!config.name.trim() || !config.agentType) return;

    try {
      await onSave(config);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Failed to create agent:', error);
    }
  };

  const resetForm = () => {
    setConfig({
      name: '',
      description: '',
      agentType: '',
      aiModel: 'gemini',
      mcpServerIds: [],
      temperature: 0.7,
      maxTokens: 2000,
      referenceLinks: [],
      uploadedFiles: [],
      promptTemplate: '',
      memorySize: 1000
    });
    setNewLink({ url: '', title: '', description: '' });
    setCreationMethod('wizard');
    setJsonConfig('');
    setN8nUrl('');
    setN8nApiKey('');
  };

  const handleJsonImport = () => {
    try {
      const parsedConfig = JSON.parse(jsonConfig);
      setConfig({
        ...config,
        ...parsedConfig,
        referenceLinks: parsedConfig.referenceLinks || [],
        uploadedFiles: parsedConfig.uploadedFiles || []
      });
    } catch (error) {
      alert('Invalid JSON configuration');
    }
  };

  const addReferenceLink = () => {
    if (!newLink.url.trim() || !newLink.title.trim()) return;

    setConfig({
      ...config,
      referenceLinks: [...config.referenceLinks, {
        id: Date.now().toString(),
        ...newLink
      }]
    });
    setNewLink({ url: '', title: '', description: '' });
  };

  const removeReferenceLink = (id: string) => {
    setConfig({
      ...config,
      referenceLinks: config.referenceLinks.filter(link => link.id !== id)
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
        url: `https://storage.example.com/${file.name}` // Mock URL
      };

      setConfig(prev => ({
        ...prev,
        uploadedFiles: [...prev.uploadedFiles, uploadedFile]
      }));
    }
    setUploading(false);
  };

  const removeUploadedFile = (id: string) => {
    setConfig({
      ...config,
      uploadedFiles: config.uploadedFiles.filter(file => file.id !== id)
    });
  };

  const connectN8n = async () => {
    if (!n8nUrl.trim() || !n8nApiKey.trim()) return;

    // Mock n8n connection - in real implementation, this would verify connection
    alert(`Connected to n8n instance at ${n8nUrl}`);
    setCreationMethod('wizard');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Create AI Agent</h2>
          <button
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Creation Method Selection */}
          <div className="w-80 border-r border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Creation Method</h3>
            <div className="space-y-3">
              <button
                onClick={() => setCreationMethod('wizard')}
                className={`w-full p-4 border-2 rounded-lg text-left transition ${
                  creationMethod === 'wizard'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900">Wizard Setup</div>
                    <div className="text-sm text-gray-600">Step-by-step configuration</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setCreationMethod('json')}
                className={`w-full p-4 border-2 rounded-lg text-left transition ${
                  creationMethod === 'json'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Code className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium text-gray-900">JSON Config</div>
                    <div className="text-sm text-gray-600">Import agent configuration</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setCreationMethod('n8n')}
                className={`w-full p-4 border-2 rounded-lg text-left transition ${
                  creationMethod === 'n8n'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="font-medium text-gray-900">n8n Integration</div>
                    <div className="text-sm text-gray-600">Connect workflow automation</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {creationMethod === 'wizard' && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agent Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={config.name}
                      onChange={(e) => setConfig({ ...config, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                      placeholder="My AI Assistant"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agent Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={config.agentType}
                      onChange={(e) => setConfig({ ...config, agentType: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    >
                      <option value="">Select agent type</option>
                      {agentTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={config.description}
                    onChange={(e) => setConfig({ ...config, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
                    placeholder="Describe what this agent does..."
                  />
                </div>

                {/* AI Model & Settings */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      AI Model
                    </label>
                    <select
                      value={config.aiModel}
                      onChange={(e) => setConfig({ ...config, aiModel: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    >
                      <option value="gemini">🤖 Google Gemini</option>
                      <option value="gpt-4">🧠 GPT-4</option>
                      <option value="claude">📚 Claude</option>
                      <option value="gpt-3.5">⚡ GPT-3.5 Turbo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Temperature
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={config.temperature}
                      onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                    <span className="text-sm text-gray-600">{config.temperature}</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Tokens
                    </label>
                    <input
                      type="number"
                      value={config.maxTokens}
                      onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                      min="100"
                      max="4000"
                    />
                  </div>
                </div>

                {/* MCP Servers */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Connected MCP Servers
                  </label>
                  <div className="space-y-2 mb-4">
                    {mcpServers.map(server => (
                      <div key={server.id} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id={server.id}
                          checked={config.mcpServerIds.includes(server.id)}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setConfig({
                              ...config,
                              mcpServerIds: isChecked
                                ? [...config.mcpServerIds, server.id]
                                : config.mcpServerIds.filter(id => id !== server.id)
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

                {/* Reference Links */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference Links
                  </label>
                  <div className="space-y-2">
                    {config.referenceLinks.map(link => (
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
                        <button
                          onClick={() => removeReferenceLink(link.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
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
                      <Plus className="w-4 h-4" />
                      Add Link
                    </button>
                  </div>
                </div>

                {/* File Uploads */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Knowledge Base (Upload Files)
                  </label>
                  <div className="space-y-2">
                    {config.uploadedFiles.map(file => (
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
                        <button
                          onClick={() => removeUploadedFile(file.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                      onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-600 transition cursor-pointer"
                    >
                      <Upload className={`w-4 h-4 ${uploading ? 'animate-spin' : ''}`} />
                      {uploading ? 'Uploading...' : 'Upload Files (Docs, Images, Videos)'}
                    </label>
                  </div>
                </div>
              </div>
            )}

            {creationMethod === 'json' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Import JSON Configuration</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Paste a JSON configuration to import an agent setup. This is useful for sharing agent configurations or backing up agents.
                  </p>
                  <textarea
                    value={jsonConfig}
                    onChange={(e) => setJsonConfig(e.target.value)}
                    rows={15}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none font-mono text-sm"
                    placeholder="Paste your JSON agent configuration here..."
                  />
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={handleJsonImport}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                    >
                      Import Configuration
                    </button>
                    <button
                      onClick={() => setJsonConfig(JSON.stringify(config, null, 2))}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                      Export Current Config
                    </button>
                  </div>
                </div>
              </div>
            )}

            {creationMethod === 'n8n' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect to n8n Workflow</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Connect your GAS OS agent to an n8n workflow for automated data processing and integration capabilities.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        n8n Instance URL
                      </label>
                      <input
                        type="url"
                        value={n8nUrl}
                        onChange={(e) => setN8nUrl(e.target.value)}
                        placeholder="https://your-n8n-instance.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        API Key
                      </label>
                      <input
                        type="password"
                        value={n8nApiKey}
                        onChange={(e) => setN8nApiKey(e.target.value)}
                        placeholder="Your n8n API key"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                      />
                    </div>
                    <button
                      onClick={connectN8n}
                      disabled={!n8nUrl.trim() || !n8nApiKey.trim()}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition disabled:opacity-50"
                    >
                      Connect to n8n
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!config.name.trim() || !config.agentType}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Agent
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAgentModal;
