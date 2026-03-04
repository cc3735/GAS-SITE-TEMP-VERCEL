export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url' | 'select';
  placeholder?: string;
  required: boolean;
  options?: { value: string; label: string }[];
}

export interface MCPCatalogEntry {
  id: string;
  name: string;
  description: string;
  category: 'productivity' | 'crm' | 'marketing' | 'communication' | 'finance' | 'ai' | 'developer';
  github_url: string;
  npm_package?: string;
  is_official: boolean;
  config_fields: ConfigField[];
  icon: string; // lucide icon name
  tier: 1 | 2 | 3;
}

export const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  productivity: { label: 'Productivity', color: 'bg-blue-600' },
  crm: { label: 'CRM & Sales', color: 'bg-green-600' },
  marketing: { label: 'Marketing', color: 'bg-pink-600' },
  communication: { label: 'Communication', color: 'bg-purple-600' },
  finance: { label: 'Finance', color: 'bg-yellow-600' },
  ai: { label: 'AI & Knowledge', color: 'bg-cyan-600' },
  developer: { label: 'Developer', color: 'bg-orange-600' },
};

export const mcpCatalog: MCPCatalogEntry[] = [
  // ── Tier 1: Core Business ─────────────────────────────────────────
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    description: 'Calendar, Gmail, Drive, Docs, Sheets — full Google Workspace integration for syncing meetings, emails, and documents.',
    category: 'productivity',
    github_url: 'https://github.com/taylorwilsdon/google_workspace_mcp',
    is_official: false,
    icon: 'Calendar',
    tier: 1,
    config_fields: [
      { key: 'client_id', label: 'Google OAuth Client ID', type: 'text', placeholder: 'xxxx.apps.googleusercontent.com', required: true },
      { key: 'client_secret', label: 'Google OAuth Client Secret', type: 'password', placeholder: 'GOCSPX-...', required: true },
      { key: 'redirect_uri', label: 'Redirect URI', type: 'url', placeholder: 'https://yourapp.com/auth/callback', required: true },
    ],
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Read and post messages, manage channels and threads. Connect your team communication to AI agents.',
    category: 'communication',
    github_url: 'https://github.com/korotovsky/slack-mcp-server',
    is_official: false,
    icon: 'MessageSquare',
    tier: 1,
    config_fields: [
      { key: 'bot_token', label: 'Slack Bot Token', type: 'password', placeholder: 'xoxb-...', required: true },
      { key: 'app_token', label: 'Slack App Token', type: 'password', placeholder: 'xapp-...', required: false },
    ],
  },
  {
    id: 'supabase',
    name: 'Supabase',
    description: 'Query and manage your Supabase database. Let AI agents access CRM data, run reports, and update records directly.',
    category: 'developer',
    github_url: 'https://github.com/supabase-community/supabase-mcp',
    is_official: true,
    icon: 'Database',
    tier: 1,
    config_fields: [
      { key: 'supabase_url', label: 'Supabase URL', type: 'url', placeholder: 'https://xxxx.supabase.co', required: true },
      { key: 'service_role_key', label: 'Service Role Key', type: 'password', placeholder: 'eyJ...', required: true },
    ],
  },
  {
    id: 'brave-search',
    name: 'Brave Search',
    description: 'Web search powered by Brave. AI agents can research leads, companies, competitors, and market trends.',
    category: 'ai',
    github_url: 'https://github.com/brave/brave-search-mcp-server',
    is_official: true,
    icon: 'Search',
    tier: 1,
    config_fields: [
      { key: 'api_key', label: 'Brave Search API Key', type: 'password', placeholder: 'BSA...', required: true },
    ],
  },

  // ── Tier 2: CRM & Sales ───────────────────────────────────────────
  {
    id: 'apollo-io',
    name: 'Apollo.io',
    description: 'B2B sales intelligence with access to 275M+ contacts. Enrich CRM contacts, find leads, and get company data.',
    category: 'crm',
    github_url: 'https://github.com/louis030195/apollo-io-mcp',
    is_official: false,
    icon: 'Users',
    tier: 2,
    config_fields: [
      { key: 'api_key', label: 'Apollo.io API Key', type: 'password', placeholder: 'apollo_...', required: true },
    ],
  },
  {
    id: 'tomba-io',
    name: 'Tomba.io',
    description: 'Email discovery, verification, and enrichment. Find decision-maker emails and verify contact data for your CRM.',
    category: 'crm',
    github_url: 'https://github.com/tomba-io/tomba-mcp-server',
    is_official: true,
    icon: 'Mail',
    tier: 2,
    config_fields: [
      { key: 'api_key', label: 'Tomba API Key', type: 'password', placeholder: 'ta_...', required: true },
      { key: 'secret', label: 'Tomba Secret', type: 'password', placeholder: 'ts_...', required: true },
    ],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Access LinkedIn profiles and connections. Social selling, lead research, and profile enrichment for your CRM.',
    category: 'crm',
    github_url: 'https://github.com/Linked-API/linkedapi-mcp',
    is_official: true,
    icon: 'Linkedin',
    tier: 2,
    config_fields: [
      { key: 'api_key', label: 'LinkedAPI Key', type: 'password', placeholder: 'la_...', required: true },
    ],
  },

  // ── Tier 2: Marketing & Ads ───────────────────────────────────────
  {
    id: 'meta-ads',
    name: 'Meta Ads',
    description: 'Facebook and Instagram ad management. Create campaigns, track performance, and optimize ad spend from your marketing dashboard.',
    category: 'marketing',
    github_url: 'https://github.com/pipeboard-co/meta-ads-mcp',
    is_official: false,
    icon: 'Megaphone',
    tier: 2,
    config_fields: [
      { key: 'access_token', label: 'Meta Access Token', type: 'password', placeholder: 'EAA...', required: true },
      { key: 'ad_account_id', label: 'Ad Account ID', type: 'text', placeholder: 'act_123456789', required: true },
    ],
  },
  {
    id: 'google-ads',
    name: 'Google Ads',
    description: 'Google Ads campaign management. Create search and display campaigns, track conversions, and manage budgets.',
    category: 'marketing',
    github_url: 'https://github.com/gomarble-ai/google-ads-mcp-server',
    is_official: false,
    icon: 'BarChart3',
    tier: 2,
    config_fields: [
      { key: 'developer_token', label: 'Developer Token', type: 'password', required: true },
      { key: 'client_id', label: 'OAuth Client ID', type: 'text', required: true },
      { key: 'client_secret', label: 'OAuth Client Secret', type: 'password', required: true },
      { key: 'refresh_token', label: 'Refresh Token', type: 'password', required: true },
      { key: 'customer_id', label: 'Customer ID', type: 'text', placeholder: '123-456-7890', required: true },
    ],
  },
  {
    id: 'tiktok-ads',
    name: 'TikTok Ads',
    description: 'TikTok advertising API. Create ad campaigns, track analytics, and manage creative assets for TikTok.',
    category: 'marketing',
    github_url: 'https://github.com/AdsMCP/tiktok-ads-mcp-server',
    is_official: false,
    icon: 'Video',
    tier: 2,
    config_fields: [
      { key: 'access_token', label: 'TikTok Access Token', type: 'password', required: true },
      { key: 'advertiser_id', label: 'Advertiser ID', type: 'text', required: true },
    ],
  },

  // ── Tier 2: Communication ─────────────────────────────────────────
  {
    id: 'courier',
    name: 'Courier',
    description: 'Multi-channel notification delivery — email, SMS, push, and in-app. Centralize all notification dispatch.',
    category: 'communication',
    github_url: 'https://github.com/trycourier/courier-mcp',
    is_official: true,
    icon: 'Bell',
    tier: 2,
    config_fields: [
      { key: 'api_key', label: 'Courier API Key', type: 'password', placeholder: 'pk_...', required: true },
    ],
  },
  {
    id: 'infobip',
    name: 'Infobip',
    description: 'SMS, WhatsApp, Viber, and RCS messaging. Reach customers on their preferred messaging platform.',
    category: 'communication',
    github_url: 'https://github.com/Infobip/mcp',
    is_official: true,
    icon: 'Phone',
    tier: 2,
    config_fields: [
      { key: 'api_key', label: 'Infobip API Key', type: 'password', required: true },
      { key: 'base_url', label: 'Base URL', type: 'url', placeholder: 'https://xxxx.api.infobip.com', required: true },
    ],
  },
  {
    id: 'whatsapp-business',
    name: 'WhatsApp Business',
    description: 'WhatsApp Business Platform by YCloud. Send and receive WhatsApp messages from your CRM messaging tab.',
    category: 'communication',
    github_url: 'https://github.com/YCloud-Developers/ycloud-whatsapp-mcp-server',
    is_official: false,
    icon: 'MessageCircle',
    tier: 2,
    config_fields: [
      { key: 'api_key', label: 'YCloud API Key', type: 'password', required: true },
    ],
  },

  // ── Tier 2: Finance ───────────────────────────────────────────────
  {
    id: 'xero',
    name: 'Xero',
    description: 'Accounting and invoicing integration. Sync billing data, create invoices, and track payments with Xero.',
    category: 'finance',
    github_url: 'https://github.com/XeroAPI/xero-mcp-server',
    is_official: true,
    icon: 'Receipt',
    tier: 2,
    config_fields: [
      { key: 'client_id', label: 'Xero Client ID', type: 'text', required: true },
      { key: 'client_secret', label: 'Xero Client Secret', type: 'password', required: true },
    ],
  },
  {
    id: 'chargebee',
    name: 'Chargebee',
    description: 'Subscription billing platform. Manage subscriptions, handle recurring billing, and track revenue.',
    category: 'finance',
    github_url: 'https://github.com/chargebee/mcp',
    is_official: true,
    icon: 'CreditCard',
    tier: 2,
    config_fields: [
      { key: 'api_key', label: 'Chargebee API Key', type: 'password', required: true },
      { key: 'site', label: 'Chargebee Site', type: 'text', placeholder: 'your-site', required: true },
    ],
  },

  // ── Tier 3: AI & Knowledge ────────────────────────────────────────
  {
    id: 'memory',
    name: 'Memory (Knowledge Graph)',
    description: 'Persistent knowledge graph for AI agents. Remember context, relationships, and facts across conversations.',
    category: 'ai',
    github_url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/memory',
    is_official: true,
    icon: 'Brain',
    tier: 3,
    config_fields: [],
  },
  {
    id: 'rag-docs',
    name: 'Ragie RAG',
    description: 'Document retrieval and knowledge base. Upload documents and let AI agents search and answer questions from them.',
    category: 'ai',
    github_url: 'https://github.com/ragieai/mcp-server',
    is_official: false,
    icon: 'FileSearch',
    tier: 3,
    config_fields: [
      { key: 'api_key', label: 'Ragie API Key', type: 'password', required: true },
    ],
  },
  {
    id: 'filesystem',
    name: 'Filesystem',
    description: 'Direct local file system access. AI agents can read, write, and manage project files and documents.',
    category: 'ai',
    github_url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem',
    is_official: true,
    icon: 'FolderOpen',
    tier: 3,
    config_fields: [
      { key: 'allowed_directories', label: 'Allowed Directories', type: 'text', placeholder: '/path/to/allowed/dir', required: true },
    ],
  },

  // ── Tier 3: Developer ─────────────────────────────────────────────
  {
    id: 'github',
    name: 'GitHub',
    description: 'GitHub repository management. Access repos, issues, PRs, and code for project management and development workflows.',
    category: 'developer',
    github_url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/github',
    is_official: true,
    icon: 'GitBranch',
    tier: 3,
    config_fields: [
      { key: 'personal_access_token', label: 'GitHub Personal Access Token', type: 'password', placeholder: 'ghp_...', required: true },
    ],
  },
];
