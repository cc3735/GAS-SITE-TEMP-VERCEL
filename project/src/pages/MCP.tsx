import { useState } from 'react';
import { useMCPServers } from '../hooks/useMCPServers';
import { Server, Plus, X, Loader2, Cloud, Code, Activity, CheckCircle, AlertCircle } from 'lucide-react';

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

export default function MCP() {
  const { servers, loading, createServer } = useMCPServers();
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
          <Server className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">MCP Servers</h1>
        </div>
        <button
          onClick={() => setShowNewServer(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          Add Server
        </button>
      </div>

      {servers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Server className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No MCP servers yet</h3>
          <p className="text-gray-600 mb-6">
            Connect or create MCP servers to extend your AI capabilities with custom tools and resources
          </p>
          <button
            onClick={() => setShowNewServer(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition"
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
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition cursor-pointer"
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

                <h3 className="text-lg font-semibold text-gray-900 mb-2">{server.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{server.description || `${server.server_type} server`}</p>

                <div className="space-y-2 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Type</span>
                    <span className="font-medium text-gray-900">{server.server_type}</span>
                  </div>
                  {server.endpoint_url && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Endpoint</span>
                      <span className="font-mono text-xs text-gray-900 truncate max-w-[150px]">
                        {server.endpoint_url}
                      </span>
                    </div>
                  )}
                  {server.version && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Version</span>
                      <span className="font-medium text-gray-900">{server.version}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showNewServer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add MCP Server</h2>
              <button
                onClick={() => {
                  setShowNewServer(false);
                  setSelectedType(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateServer} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
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
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex flex-col items-center text-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
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
                  Server Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  placeholder="My MCP Server"
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
                  placeholder="Describe what this server provides..."
                />
              </div>

              {selectedType === 'external' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Endpoint URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    required={selectedType === 'external'}
                    value={formData.endpoint_url}
                    onChange={(e) => setFormData({ ...formData, endpoint_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
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
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !formData.name.trim() || !selectedType}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Server'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
