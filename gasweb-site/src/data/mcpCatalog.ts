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
  category: 'productivity' | 'crm' | 'marketing' | 'communication' | 'finance' | 'ai' | 'developer' | 'hr' | 'legal' | 'infrastructure';
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
  hr: { label: 'HR & Payroll', color: 'bg-rose-600' },
  legal: { label: 'Legal & Compliance', color: 'bg-indigo-600' },
  infrastructure: { label: 'Hosting & Domains', color: 'bg-slate-600' },
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

  // ── Tier 1: Core Finance ─────────────────────────────────────────
  {
    id: 'quickbooks',
    name: 'QuickBooks Online',
    description: 'Full QuickBooks Online integration. Sync invoices, expenses, payroll, and financial reports with your FinanceFlow dashboard.',
    category: 'finance',
    github_url: 'https://github.com/intuit/quickbooks-mcp-server',
    is_official: false,
    icon: 'BookOpen',
    tier: 1,
    config_fields: [
      { key: 'client_id', label: 'QuickBooks Client ID', type: 'text', required: true },
      { key: 'client_secret', label: 'QuickBooks Client Secret', type: 'password', required: true },
      { key: 'realm_id', label: 'Company ID (Realm ID)', type: 'text', placeholder: '1234567890', required: true },
    ],
  },
  {
    id: 'zoho-books',
    name: 'Zoho Books',
    description: 'Full accounting engine integration. Sync invoices, bills, chart of accounts, and pull P&L, Balance Sheet, and Cash Flow reports into FinanceFlow.',
    category: 'finance',
    github_url: 'https://github.com/nicholasgriffintn/zoho-mcp-server',
    is_official: false,
    icon: 'BookOpen',
    tier: 1,
    config_fields: [
      { key: 'client_id', label: 'Zoho Client ID', type: 'text', required: true },
      { key: 'client_secret', label: 'Zoho Client Secret', type: 'password', required: true },
      { key: 'refresh_token', label: 'Zoho Refresh Token', type: 'password', required: true },
      { key: 'organization_id', label: 'Organization ID', type: 'text', required: true },
      { key: 'domain', label: 'Zoho Domain', type: 'select', required: true, options: [{ value: 'com', label: 'zoho.com (US)' }, { value: 'eu', label: 'zoho.eu (EU)' }, { value: 'in', label: 'zoho.in (India)' }] },
    ],
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing and subscription management. Create charges, manage customers, handle invoices, and track revenue.',
    category: 'finance',
    github_url: 'https://github.com/stripe/agent-toolkit',
    is_official: true,
    icon: 'Wallet',
    tier: 1,
    config_fields: [
      { key: 'secret_key', label: 'Stripe Secret Key', type: 'password', placeholder: 'sk_live_...', required: true },
    ],
  },

  // ── Tier 2: CRM & Sales (additional) ────────────────────────────
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Full CRM, marketing, and sales hub. Manage contacts, deals, email campaigns, and marketing automation from one platform.',
    category: 'crm',
    github_url: 'https://github.com/HubSpot/mcp-server',
    is_official: false,
    icon: 'Target',
    tier: 2,
    config_fields: [
      { key: 'access_token', label: 'HubSpot Private App Token', type: 'password', placeholder: 'pat-...', required: true },
    ],
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Enterprise CRM integration. Access accounts, contacts, opportunities, and reports from the world\'s leading CRM platform.',
    category: 'crm',
    github_url: 'https://github.com/salesforce/mcp-server',
    is_official: false,
    icon: 'Cloud',
    tier: 2,
    config_fields: [
      { key: 'instance_url', label: 'Salesforce Instance URL', type: 'url', placeholder: 'https://yourorg.my.salesforce.com', required: true },
      { key: 'client_id', label: 'Connected App Client ID', type: 'text', required: true },
      { key: 'client_secret', label: 'Connected App Client Secret', type: 'password', required: true },
    ],
  },

  // ── Tier 2: Finance (additional) ────────────────────────────────
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'PayPal payment processing. Send and receive payments, manage invoices, and track transaction history.',
    category: 'finance',
    github_url: 'https://github.com/paypal/agent-toolkit',
    is_official: true,
    icon: 'DollarSign',
    tier: 2,
    config_fields: [
      { key: 'client_id', label: 'PayPal Client ID', type: 'text', required: true },
      { key: 'client_secret', label: 'PayPal Client Secret', type: 'password', required: true },
      { key: 'environment', label: 'Environment', type: 'select', required: true, options: [{ value: 'sandbox', label: 'Sandbox' }, { value: 'production', label: 'Production' }] },
    ],
  },
  {
    id: 'avalara',
    name: 'Avalara AvaTax',
    description: 'Automated tax compliance and calculation. Calculate sales tax, manage exemptions, and file returns across jurisdictions.',
    category: 'finance',
    github_url: 'https://github.com/avalara/mcp-server',
    is_official: false,
    icon: 'Calculator',
    tier: 2,
    config_fields: [
      { key: 'account_id', label: 'Avalara Account ID', type: 'text', required: true },
      { key: 'license_key', label: 'Avalara License Key', type: 'password', required: true },
      { key: 'environment', label: 'Environment', type: 'select', required: true, options: [{ value: 'sandbox', label: 'Sandbox' }, { value: 'production', label: 'Production' }] },
    ],
  },

  // ── Tier 2: Marketing (additional) ──────────────────────────────
  {
    id: 'klaviyo',
    name: 'Klaviyo',
    description: 'Email and SMS marketing automation. Build customer segments, design campaigns, and track engagement metrics.',
    category: 'marketing',
    github_url: 'https://github.com/klaviyo/mcp-server',
    is_official: false,
    icon: 'Zap',
    tier: 2,
    config_fields: [
      { key: 'api_key', label: 'Klaviyo Private API Key', type: 'password', placeholder: 'pk_...', required: true },
    ],
  },

  // ── Tier 2: Productivity (additional) ───────────────────────────
  {
    id: 'asana',
    name: 'Asana',
    description: 'Project and task management. Create tasks, manage projects, track milestones, and coordinate team workflows.',
    category: 'productivity',
    github_url: 'https://github.com/asana/mcp-server',
    is_official: false,
    icon: 'ListTodo',
    tier: 2,
    config_fields: [
      { key: 'access_token', label: 'Asana Personal Access Token', type: 'password', placeholder: '1/...', required: true },
    ],
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Issue tracking and agile project management. Create and manage issues, sprints, boards, and project backlogs.',
    category: 'productivity',
    github_url: 'https://github.com/atlassian/mcp-server-jira',
    is_official: false,
    icon: 'Bug',
    tier: 2,
    config_fields: [
      { key: 'instance_url', label: 'Jira Instance URL', type: 'url', placeholder: 'https://yourorg.atlassian.net', required: true },
      { key: 'email', label: 'Atlassian Email', type: 'text', required: true },
      { key: 'api_token', label: 'Atlassian API Token', type: 'password', required: true },
    ],
  },

  // ── Tier 2: HR ──────────────────────────────────────────────────
  {
    id: 'bamboohr',
    name: 'BambooHR',
    description: 'HR and people management. Access employee records, manage time-off requests, run reports, and streamline onboarding.',
    category: 'hr',
    github_url: 'https://github.com/BambooHR/mcp-server',
    is_official: false,
    icon: 'UserCheck',
    tier: 2,
    config_fields: [
      { key: 'subdomain', label: 'BambooHR Subdomain', type: 'text', placeholder: 'yourcompany', required: true },
      { key: 'api_key', label: 'BambooHR API Key', type: 'password', required: true },
    ],
  },

  // ── Tier 1: Legal & Compliance ───────────────────────────────────
  {
    id: 'zoho-sign',
    name: 'Zoho Sign',
    description: 'E-signature and document signing. Send documents for signature, track signing status, and download signed PDFs.',
    category: 'legal',
    github_url: 'https://github.com/nicholasgriffintn/zoho-mcp-server',
    is_official: false,
    icon: 'PenTool',
    tier: 1,
    config_fields: [
      { key: 'client_id', label: 'Zoho Client ID', type: 'text', required: true },
      { key: 'client_secret', label: 'Zoho Client Secret', type: 'password', required: true },
      { key: 'refresh_token', label: 'Zoho Refresh Token', type: 'password', required: true },
      { key: 'domain', label: 'Zoho Domain', type: 'select', required: true, options: [{ value: 'com', label: 'zoho.com (US)' }, { value: 'eu', label: 'zoho.eu (EU)' }, { value: 'in', label: 'zoho.in (India)' }] },
    ],
  },

  // ── Tier 1: Hosting & Domains ──────────────────────────────────
  {
    id: 'hostinger',
    name: 'Hostinger',
    description: 'Domain registration, DNS management, and web hosting. Automate domain setup, DNS records, and hosting provisioning for clients.',
    category: 'infrastructure',
    github_url: 'https://github.com/jpollock/hostinger-mcp',
    is_official: false,
    icon: 'Globe',
    tier: 1,
    config_fields: [
      { key: 'api_token', label: 'Hostinger API Token', type: 'password', placeholder: 'Bearer token from Hostinger', required: true },
    ],
  },

  // ── Tier 2: Legal (additional) ─────────────────────────────────
  {
    id: 'zoho-crm',
    name: 'Zoho CRM',
    description: 'Zoho CRM integration. Manage leads, contacts, deals, and accounts across the Zoho ecosystem.',
    category: 'crm',
    github_url: 'https://github.com/nicholasgriffintn/zoho-mcp-server',
    is_official: false,
    icon: 'UserPlus',
    tier: 2,
    config_fields: [
      { key: 'client_id', label: 'Zoho Client ID', type: 'text', required: true },
      { key: 'client_secret', label: 'Zoho Client Secret', type: 'password', required: true },
      { key: 'refresh_token', label: 'Zoho Refresh Token', type: 'password', required: true },
    ],
  },
  {
    id: 'pandadoc',
    name: 'PandaDoc',
    description: 'Document automation and e-signatures. Create proposals, contracts, and quotes with templates and collect signatures.',
    category: 'legal',
    github_url: 'https://github.com/PandaDoc/mcp-server',
    is_official: false,
    icon: 'FileSignature',
    tier: 2,
    config_fields: [
      { key: 'api_key', label: 'PandaDoc API Key', type: 'password', placeholder: 'your-api-key', required: true },
    ],
  },
  {
    id: 'uspto-patent',
    name: 'USPTO Patent Search',
    description: 'Search the US Patent and Trademark Office database. Find existing patents, trademarks, and check availability for filings.',
    category: 'legal',
    github_url: 'https://github.com/devinbarry/patent-mcp-server',
    is_official: false,
    icon: 'Search',
    tier: 2,
    config_fields: [],
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
