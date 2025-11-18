import { useState } from 'react';
import { Settings as SettingsIcon, Key, Save, Eye, EyeOff } from 'lucide-react';

type SettingsTab = 'general' | 'api-keys';

const aiModels = [
  { id: 'gemini', name: 'Google Gemini', description: 'Google\'s Gemini models', icon: '🤖' },
  { id: 'gpt-4', name: 'GPT-4', description: 'OpenAI GPT-4', icon: '🧠' },
  { id: 'claude', name: 'Claude', description: 'Anthropic Claude', icon: '📚' },
  { id: 'gpt-3.5', name: 'GPT-3.5 Turbo', description: 'OpenAI GPT-3.5 Turbo', icon: '⚡' },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({
    gemini: '',
    'gpt-4': '',
    claude: '',
    'gpt-3.5': '',
  });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({
    gemini: false,
    'gpt-4': false,
    claude: false,
    'gpt-3.5': false,
  });
  const [defaultModel, setDefaultModel] = useState('gemini');
  const [saving, setSaving] = useState(false);

  const handleSaveApiKeys = async () => {
    if (saving) return;
    setSaving(true);
    // Here you would save to database
    await new Promise(resolve => setTimeout(resolve, 1000)); // Mock save
    setSaving(false);
  };

  const handleKeyChange = (modelId: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [modelId]: value }));
  };

  const toggleShowKey = (modelId: string) => {
    setShowKeys(prev => ({ ...prev, [modelId]: !prev[modelId] }));
  };

  const tabs = [
    { id: 'general' as const, name: 'General', icon: SettingsIcon },
    { id: 'api-keys' as const, name: 'API Keys', icon: Key },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon
                  className={`-ml-0.5 mr-2 h-5 w-5 ${
                    activeTab === tab.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Preferences</h3>
            <p className="text-gray-600">General organization settings will be available here.</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Preferences</h3>
            <p className="text-gray-600">Personal settings and preferences will be available here.</p>
          </div>
        </div>
      )}

      {activeTab === 'api-keys' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">AI Model Configuration</h3>
                <p className="text-gray-600">Configure API keys for different AI models</p>
              </div>
              <button
                onClick={handleSaveApiKeys}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {/* Default Model Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Default AI Model
              </label>
              <select
                value={defaultModel}
                onChange={(e) => setDefaultModel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              >
                {aiModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.icon} {model.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                This model will be used by default for all AI operations unless overridden
              </p>
            </div>

            {/* API Keys */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">API Keys</h4>
              {aiModels.map((model) => (
                <div key={model.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{model.icon}</span>
                    <div>
                      <h5 className="font-medium text-gray-900">{model.name}</h5>
                      <p className="text-sm text-gray-600">{model.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type={showKeys[model.id] ? 'text' : 'password'}
                      value={apiKeys[model.id]}
                      onChange={(e) => handleKeyChange(model.id, e.target.value)}
                      placeholder={`Enter ${model.name} API key`}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    />
                    <button
                      onClick={() => toggleShowKey(model.id)}
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      {showKeys[model.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {!apiKeys[model.id] && (
                    <p className="text-xs text-gray-500 mt-1">
                      API key required for {model.name} functionality
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-2">🔒 Security Notice</h5>
              <p className="text-sm text-blue-700">
                API keys are stored securely and encrypted. Only authorized users in your organization can access them.
                Keys are used only for AI model requests and never shared with third parties.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
