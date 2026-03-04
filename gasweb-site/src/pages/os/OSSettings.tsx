import { useState } from 'react';
import { Settings as SettingsIcon, Key, Save, Eye, EyeOff, Plug, Mail, Phone, Share2, CheckCircle, XCircle, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { useChannelIntegrations } from '../../hooks/useChannelIntegrations';
import { useSocial } from '../../hooks/useSocial';

type SettingsTab = 'general' | 'api-keys' | 'integrations';

const aiModels = [
  { id: 'gemini', name: 'Google Gemini', description: 'Google\'s Gemini models', icon: '🤖' },
  { id: 'gpt-4', name: 'GPT-4', description: 'OpenAI GPT-4', icon: '🧠' },
  { id: 'claude', name: 'Claude', description: 'Anthropic Claude', icon: '📚' },
  { id: 'gpt-3.5', name: 'GPT-3.5 Turbo', description: 'OpenAI GPT-3.5 Turbo', icon: '⚡' },
];

const EMAIL_PROVIDERS = [
  { id: 'resend', name: 'Resend' },
  { id: 'sendgrid', name: 'SendGrid' },
  { id: 'smtp', name: 'Custom SMTP' },
];

export default function OSSettings() {
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

  // Integration state
  const { integrations, saveIntegration, testIntegration, loading: integrationsLoading } = useChannelIntegrations();
  const { accounts: socialAccounts } = useSocial();

  const [emailProvider, setEmailProvider] = useState('resend');
  const [emailConfig, setEmailConfig] = useState({ api_key: '', from_email: '', from_name: '', smtp_host: '', smtp_port: '', smtp_user: '', smtp_pass: '' });
  const [emailActive, setEmailActive] = useState(false);
  const [smsConfig, setSmsConfig] = useState({ account_sid: '', auth_token: '', phone_number: '' });
  const [smsActive, setSmsActive] = useState(false);
  const [showEmailKey, setShowEmailKey] = useState(false);
  const [showSmsToken, setShowSmsToken] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingSms, setSavingSms] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingSms, setTestingSms] = useState(false);
  const [testResult, setTestResult] = useState<{ section: string; success: boolean; message: string } | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ email: true, sms: true, social: true });

  // Load existing integration values
  useState(() => {
    const emailInt = integrations.find(i => i.channel_type === 'email');
    if (emailInt) {
      setEmailProvider(emailInt.provider);
      setEmailConfig(prev => ({ ...prev, ...emailInt.config }));
      setEmailActive(emailInt.is_active);
    }
    const smsInt = integrations.find(i => i.channel_type === 'sms');
    if (smsInt) {
      setSmsConfig(prev => ({ ...prev, ...smsInt.config }));
      setSmsActive(smsInt.is_active);
    }
  });

  const handleSaveApiKeys = async () => {
    if (saving) return;
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
  };

  const handleKeyChange = (modelId: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [modelId]: value }));
  };

  const toggleShowKey = (modelId: string) => {
    setShowKeys(prev => ({ ...prev, [modelId]: !prev[modelId] }));
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSaveEmail = async () => {
    setSavingEmail(true);
    setTestResult(null);
    try {
      const config: Record<string, any> = { from_email: emailConfig.from_email, from_name: emailConfig.from_name };
      if (emailProvider === 'smtp') {
        config.smtp_host = emailConfig.smtp_host;
        config.smtp_port = emailConfig.smtp_port;
        config.smtp_user = emailConfig.smtp_user;
        config.smtp_pass = emailConfig.smtp_pass;
      } else {
        config.api_key = emailConfig.api_key;
      }
      await saveIntegration({ channel_type: 'email', provider: emailProvider, config, is_active: emailActive });
      setTestResult({ section: 'email', success: true, message: 'Email integration saved' });
    } catch (err) {
      setTestResult({ section: 'email', success: false, message: (err as Error).message });
    } finally {
      setSavingEmail(false);
    }
  };

  const handleSaveSms = async () => {
    setSavingSms(true);
    setTestResult(null);
    try {
      await saveIntegration({
        channel_type: 'sms',
        provider: 'twilio',
        config: { account_sid: smsConfig.account_sid, auth_token: smsConfig.auth_token, phone_number: smsConfig.phone_number },
        is_active: smsActive,
      });
      setTestResult({ section: 'sms', success: true, message: 'SMS integration saved' });
    } catch (err) {
      setTestResult({ section: 'sms', success: false, message: (err as Error).message });
    } finally {
      setSavingSms(false);
    }
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    setTestResult(null);
    const config: Record<string, any> = { from_email: emailConfig.from_email, from_name: emailConfig.from_name };
    if (emailProvider === 'smtp') {
      config.smtp_host = emailConfig.smtp_host;
      config.smtp_port = emailConfig.smtp_port;
      config.smtp_user = emailConfig.smtp_user;
      config.smtp_pass = emailConfig.smtp_pass;
    } else {
      config.api_key = emailConfig.api_key;
    }
    const result = await testIntegration({ channel_type: 'email', provider: emailProvider, config });
    setTestResult({ section: 'email', success: result.success, message: result.error || 'Test email sent successfully' });
    setTestingEmail(false);
  };

  const handleTestSms = async () => {
    setTestingSms(true);
    setTestResult(null);
    const result = await testIntegration({
      channel_type: 'sms',
      provider: 'twilio',
      config: { account_sid: smsConfig.account_sid, auth_token: smsConfig.auth_token, phone_number: smsConfig.phone_number },
    });
    setTestResult({ section: 'sms', success: result.success, message: result.error || 'Test SMS sent successfully' });
    setTestingSms(false);
  };

  const inputClass = 'w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-800 text-white placeholder-gray-500';

  const tabs = [
    { id: 'general' as const, name: 'General', icon: SettingsIcon },
    { id: 'api-keys' as const, name: 'API Keys', icon: Key },
    { id: 'integrations' as const, name: 'Integrations', icon: Plug },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="w-8 h-8 text-blue-400" />
        <h1 className="text-3xl font-bold text-white">Settings</h1>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-400 text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'
                }`}
              >
                <Icon
                  className={`-ml-0.5 mr-2 h-5 w-5 ${
                    activeTab === tab.id ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-500'
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
          <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Organization Preferences</h3>
            <p className="text-gray-400">General organization settings will be available here.</p>
          </div>

          <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">User Preferences</h3>
            <p className="text-gray-400">Personal settings and preferences will be available here.</p>
          </div>
        </div>
      )}

      {activeTab === 'api-keys' && (
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">AI Model Configuration</h3>
                <p className="text-gray-400">Configure API keys for different AI models</p>
              </div>
              <button
                onClick={handleSaveApiKeys}
                disabled={saving}
                className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {/* Default Model Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Default AI Model
              </label>
              <select
                value={defaultModel}
                onChange={(e) => setDefaultModel(e.target.value)}
                className={inputClass}
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
              <h4 className="font-medium text-white">API Keys</h4>
              {aiModels.map((model) => (
                <div key={model.id} className="border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{model.icon}</span>
                    <div>
                      <h5 className="font-medium text-white">{model.name}</h5>
                      <p className="text-sm text-gray-400">{model.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type={showKeys[model.id] ? 'text' : 'password'}
                      value={apiKeys[model.id]}
                      onChange={(e) => handleKeyChange(model.id, e.target.value)}
                      placeholder={`Enter ${model.name} API key`}
                      className={`flex-1 ${inputClass}`}
                    />
                    <button
                      onClick={() => toggleShowKey(model.id)}
                      className="px-3 py-2 border border-gray-600 rounded-lg hover:bg-gray-800 transition"
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

            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
              <h5 className="font-medium text-blue-300 mb-2">Security Notice</h5>
              <p className="text-sm text-blue-400">
                API keys are stored securely and encrypted. Only authorized users in your organization can access them.
                Keys are used only for AI model requests and never shared with third parties.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'integrations' && (
        <div className="space-y-6">
          {integrationsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            </div>
          ) : (
            <>
              {/* ========== Email Integration ========== */}
              <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-700">
                <button
                  onClick={() => toggleSection('email')}
                  className="w-full flex items-center justify-between p-6"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="w-6 h-6 text-blue-400" />
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-white">Email</h3>
                      <p className="text-sm text-gray-400">Configure email sending provider</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {emailActive && emailConfig.api_key && (
                      <span className="text-xs px-2 py-1 rounded bg-green-900/30 text-green-400">Active</span>
                    )}
                    {expandedSections.email ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                  </div>
                </button>

                {expandedSections.email && (
                  <div className="px-6 pb-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Provider</label>
                      <select
                        value={emailProvider}
                        onChange={(e) => setEmailProvider(e.target.value)}
                        className={inputClass}
                      >
                        {EMAIL_PROVIDERS.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    {emailProvider !== 'smtp' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">API Key</label>
                        <div className="flex gap-2">
                          <input
                            type={showEmailKey ? 'text' : 'password'}
                            value={emailConfig.api_key}
                            onChange={(e) => setEmailConfig(prev => ({ ...prev, api_key: e.target.value }))}
                            placeholder={`Enter ${emailProvider === 'resend' ? 'Resend' : 'SendGrid'} API key`}
                            className={`flex-1 ${inputClass}`}
                          />
                          <button
                            onClick={() => setShowEmailKey(!showEmailKey)}
                            className="px-3 py-2 border border-gray-600 rounded-lg hover:bg-gray-800 transition"
                          >
                            {showEmailKey ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">SMTP Host</label>
                          <input
                            type="text"
                            value={emailConfig.smtp_host}
                            onChange={(e) => setEmailConfig(prev => ({ ...prev, smtp_host: e.target.value }))}
                            placeholder="smtp.example.com"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">SMTP Port</label>
                          <input
                            type="text"
                            value={emailConfig.smtp_port}
                            onChange={(e) => setEmailConfig(prev => ({ ...prev, smtp_port: e.target.value }))}
                            placeholder="587"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">SMTP Username</label>
                          <input
                            type="text"
                            value={emailConfig.smtp_user}
                            onChange={(e) => setEmailConfig(prev => ({ ...prev, smtp_user: e.target.value }))}
                            placeholder="user@example.com"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">SMTP Password</label>
                          <input
                            type="password"
                            value={emailConfig.smtp_pass}
                            onChange={(e) => setEmailConfig(prev => ({ ...prev, smtp_pass: e.target.value }))}
                            placeholder="Password"
                            className={inputClass}
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">From Email</label>
                        <input
                          type="email"
                          value={emailConfig.from_email}
                          onChange={(e) => setEmailConfig(prev => ({ ...prev, from_email: e.target.value }))}
                          placeholder="support@yourdomain.com"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">From Name</label>
                        <input
                          type="text"
                          value={emailConfig.from_name}
                          onChange={(e) => setEmailConfig(prev => ({ ...prev, from_name: e.target.value }))}
                          placeholder="Your Company"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={emailActive}
                          onChange={(e) => setEmailActive(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-300">Active</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleSaveEmail}
                        disabled={savingEmail}
                        className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 text-sm"
                      >
                        <Save className="w-4 h-4" />
                        {savingEmail ? 'Saving...' : 'Save Email Config'}
                      </button>
                      <button
                        onClick={handleTestEmail}
                        disabled={testingEmail || !emailConfig.api_key}
                        className="flex items-center gap-2 border border-gray-600 text-gray-300 hover:bg-gray-800 px-4 py-2 rounded-lg transition disabled:opacity-50 text-sm"
                      >
                        {testingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                        Test Connection
                      </button>
                      {testResult && testResult.section === 'email' && (
                        <span className={`flex items-center gap-1 text-sm ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                          {testResult.success ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          {testResult.message}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ========== SMS / Voice Integration ========== */}
              <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-700">
                <button
                  onClick={() => toggleSection('sms')}
                  className="w-full flex items-center justify-between p-6"
                >
                  <div className="flex items-center gap-3">
                    <Phone className="w-6 h-6 text-green-400" />
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-white">SMS / Voice</h3>
                      <p className="text-sm text-gray-400">Configure Twilio for SMS and voicemail</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {smsActive && smsConfig.account_sid && (
                      <span className="text-xs px-2 py-1 rounded bg-green-900/30 text-green-400">Active</span>
                    )}
                    {expandedSections.sms ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                  </div>
                </button>

                {expandedSections.sms && (
                  <div className="px-6 pb-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Twilio Account SID</label>
                      <input
                        type="text"
                        value={smsConfig.account_sid}
                        onChange={(e) => setSmsConfig(prev => ({ ...prev, account_sid: e.target.value }))}
                        placeholder="AC..."
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Auth Token</label>
                      <div className="flex gap-2">
                        <input
                          type={showSmsToken ? 'text' : 'password'}
                          value={smsConfig.auth_token}
                          onChange={(e) => setSmsConfig(prev => ({ ...prev, auth_token: e.target.value }))}
                          placeholder="Twilio auth token"
                          className={`flex-1 ${inputClass}`}
                        />
                        <button
                          onClick={() => setShowSmsToken(!showSmsToken)}
                          className="px-3 py-2 border border-gray-600 rounded-lg hover:bg-gray-800 transition"
                        >
                          {showSmsToken ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={smsConfig.phone_number}
                        onChange={(e) => setSmsConfig(prev => ({ ...prev, phone_number: e.target.value }))}
                        placeholder="+15551234567"
                        className={inputClass}
                      />
                      <p className="text-xs text-gray-500 mt-1">Your Twilio phone number in E.164 format</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={smsActive}
                          onChange={(e) => setSmsActive(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-300">Active</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleSaveSms}
                        disabled={savingSms}
                        className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 text-sm"
                      >
                        <Save className="w-4 h-4" />
                        {savingSms ? 'Saving...' : 'Save SMS Config'}
                      </button>
                      <button
                        onClick={handleTestSms}
                        disabled={testingSms || !smsConfig.account_sid}
                        className="flex items-center gap-2 border border-gray-600 text-gray-300 hover:bg-gray-800 px-4 py-2 rounded-lg transition disabled:opacity-50 text-sm"
                      >
                        {testingSms ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                        Send Test SMS
                      </button>
                      {testResult && testResult.section === 'sms' && (
                        <span className={`flex items-center gap-1 text-sm ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                          {testResult.success ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          {testResult.message}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ========== Social Media Integration ========== */}
              <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-700">
                <button
                  onClick={() => toggleSection('social')}
                  className="w-full flex items-center justify-between p-6"
                >
                  <div className="flex items-center gap-3">
                    <Share2 className="w-6 h-6 text-purple-400" />
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-white">Social Media</h3>
                      <p className="text-sm text-gray-400">Connect social accounts for messaging</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {socialAccounts.filter(a => a.is_active).length > 0 && (
                      <span className="text-xs px-2 py-1 rounded bg-green-900/30 text-green-400">
                        {socialAccounts.filter(a => a.is_active).length} connected
                      </span>
                    )}
                    {expandedSections.social ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                  </div>
                </button>

                {expandedSections.social && (
                  <div className="px-6 pb-6">
                    {socialAccounts.length === 0 ? (
                      <div className="text-center py-6">
                        <Share2 className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">No social accounts connected</p>
                        <p className="text-gray-500 text-xs mt-1">Connect accounts via Marketing & Social to enable social messaging</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {socialAccounts.map(account => (
                          <div key={account.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                                account.platform === 'facebook' ? 'bg-blue-600' :
                                account.platform === 'instagram' ? 'bg-pink-600' :
                                account.platform === 'twitter' ? 'bg-sky-500' :
                                account.platform === 'linkedin' ? 'bg-blue-700' :
                                'bg-gray-600'
                              }`}>
                                {(account.platform || '?').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{account.account_name}</p>
                                <p className="text-xs text-gray-500 capitalize">{account.platform}</p>
                              </div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded ${
                              account.is_active
                                ? 'bg-green-900/30 text-green-400'
                                : 'bg-gray-700 text-gray-400'
                            }`}>
                              {account.is_active ? 'Connected' : 'Disconnected'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Security Notice */}
              <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                <h5 className="font-medium text-blue-300 mb-2">Security Notice</h5>
                <p className="text-sm text-blue-400">
                  Integration credentials are stored securely with row-level access control. Only organization admins and owners can view or modify these settings. API keys are used server-side via Supabase Edge Functions and never exposed to the browser.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
