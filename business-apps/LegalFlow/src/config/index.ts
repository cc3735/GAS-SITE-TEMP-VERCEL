import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3002', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },

  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
  },

  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },

  // Google Cloud (for OCR)
  googleCloud: {
    keyFile: process.env.GOOGLE_CLOUD_KEY_FILE || '',
    credentials: process.env.GOOGLE_CLOUD_CREDENTIALS || '',
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // Encryption
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'default-encryption-key-32chars!',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },

  // Pricing Tiers (legal services only — tax/financial tiers are in FinanceFlow)
  pricing: {
    tiers: {
      free: {
        name: 'Free',
        legalDocsPerMonth: 0,
        childSupportCalcsPerMonth: 5,
        aiFeatures: false,
      },
      basic: {
        name: 'Basic',
        monthlyPrice: 19,
        legalDocsPerMonth: 5,
        childSupportCalcsPerMonth: -1, // unlimited
        aiFeatures: true,
      },
      premium: {
        name: 'Premium',
        monthlyPrice: 49,
        legalDocsPerMonth: -1,
        childSupportCalcsPerMonth: -1,
        aiFeatures: true,
        prioritySupport: true,
      },
      pro: {
        name: 'Pro',
        attorneyConsultation: true,
      },
    },
  },

  // Supported States for Legal Filing
  supportedStates: {
    childSupport: ['CA', 'TX', 'FL', 'NY', 'IL'],
    legalFiling: ['CA', 'TX', 'FL'],
  },

  // Trademark APIs
  trademark: {
    uspto: {
      apiUrl: process.env.USPTO_API_URL || 'https://tsdrapi.uspto.gov',
      apiKey: process.env.USPTO_API_KEY || '',
    },
    trademarknow: {
      apiUrl: process.env.TRADEMARKNOW_API_URL || 'https://api.trademarknow.com',
      apiKey: process.env.TRADEMARKNOW_API_KEY || '',
    },
    corsearch: {
      apiUrl: process.env.CORSEARCH_API_URL || 'https://api.corsearch.com',
      apiKey: process.env.CORSEARCH_API_KEY || '',
    },
  },
} as const;

export type Config = typeof config;

