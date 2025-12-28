# LegalFlow Architecture Guide

## System Overview

LegalFlow is built as a modern full-stack application with a focus on security, scalability, and maintainability.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │           React 18 + TypeScript + Vite                   │    │
│  │   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │    │
│  │   │   Tax    │ │  Legal   │ │  Filing  │ │ Support  │   │    │
│  │   │  Module  │ │  Module  │ │  Module  │ │   Calc   │   │    │
│  │   └──────────┘ └──────────┘ └──────────┘ └──────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS / REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │           Node.js 20 + Express + TypeScript              │    │
│  │   ┌──────────────────────────────────────────────────┐  │    │
│  │   │                  Middleware                       │  │    │
│  │   │  Auth │ Rate Limit │ Validation │ Error Handler  │  │    │
│  │   └──────────────────────────────────────────────────┘  │    │
│  │   ┌──────────────────────────────────────────────────┐  │    │
│  │   │                   Routes                          │  │    │
│  │   │  /auth │ /tax │ /legal │ /filing │ /child-support│  │    │
│  │   └──────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│    SUPABASE     │ │     OPENAI      │ │     STRIPE      │
│  ┌───────────┐  │ │  ┌───────────┐  │ │  ┌───────────┐  │
│  │ PostgreSQL│  │ │  │  GPT-4    │  │ │  │ Payments  │  │
│  │   Auth    │  │ │  │  API      │  │ │  │ Subscript │  │
│  │  Storage  │  │ │  └───────────┘  │ │  └───────────┘  │
│  └───────────┘  │ │                 │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Backend Architecture

### Directory Structure

```
src/
├── config/
│   └── index.ts          # Centralized configuration
├── middleware/
│   ├── auth.ts           # JWT authentication
│   ├── rate-limit.ts     # Rate limiting
│   └── error-handler.ts  # Global error handling
├── routes/
│   ├── auth.ts           # Authentication endpoints
│   ├── users.ts          # User management
│   ├── tax/              # Tax module routes
│   │   ├── returns.ts
│   │   ├── interview.ts
│   │   ├── documents.ts
│   │   └── calculations.ts
│   ├── legal/            # Legal documents routes
│   │   ├── documents.ts
│   │   ├── templates.ts
│   │   └── business-formation.ts
│   ├── filing/           # Legal filing routes
│   │   ├── filings.ts
│   │   └── interview.ts
│   ├── child-support/    # Child support calculator
│   │   └── calculator.ts
│   ├── payments.ts       # Stripe payments
│   └── subscriptions.ts  # Subscription management
├── services/
│   ├── ai/
│   │   └── openai-client.ts  # AI integration
│   ├── encryption.ts     # Data encryption
│   └── pdf/
│       └── pdf-generator.ts  # PDF generation
├── types/
│   ├── database.ts       # Database types
│   ├── tax.ts
│   ├── legal.ts
│   ├── filing.ts
│   └── child-support.ts
└── utils/
    ├── errors.ts         # Custom error classes
    ├── logger.ts         # Winston logging
    ├── supabase.ts       # Supabase client
    └── validation.ts     # Zod schemas
```

### Request Flow

1. **Request arrives** at Express server
2. **Rate limiting** checks request frequency
3. **Authentication** validates JWT token
4. **Validation** checks request body with Zod
5. **Route handler** processes business logic
6. **Services** interact with external APIs (Supabase, OpenAI, Stripe)
7. **Response** sent to client

### Authentication Flow

```
Client                      Server                     Supabase
  │                            │                          │
  │  POST /auth/signup         │                          │
  │ ──────────────────────────>│                          │
  │                            │  Create User             │
  │                            │ ────────────────────────>│
  │                            │                          │
  │                            │  User Created            │
  │                            │ <────────────────────────│
  │                            │                          │
  │                            │  Create Profile          │
  │                            │ ────────────────────────>│
  │                            │                          │
  │  { user, token }           │                          │
  │ <──────────────────────────│                          │
  │                            │                          │
```

## Frontend Architecture

### Directory Structure

```
frontend/src/
├── components/
│   └── layout/
│       ├── MainLayout.tsx    # Authenticated layout
│       └── AuthLayout.tsx    # Public layout
├── pages/
│   ├── Landing.tsx           # Public landing page
│   ├── Dashboard.tsx         # Main dashboard
│   ├── auth/
│   │   ├── Login.tsx
│   │   └── Register.tsx
│   ├── tax/
│   │   └── TaxDashboard.tsx
│   ├── legal/
│   │   └── LegalDashboard.tsx
│   ├── filing/
│   │   └── FilingDashboard.tsx
│   ├── child-support/
│   │   └── Calculator.tsx
│   ├── Disclaimer.tsx
│   ├── Privacy.tsx
│   └── Terms.tsx
├── lib/
│   ├── api.ts               # API client
│   └── store.ts             # Zustand state management
├── App.tsx                  # Main app with routing
├── main.tsx                 # Entry point
└── index.css                # Global styles
```

### State Management

Using Zustand for lightweight state management:

```typescript
// Authentication state
const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (email, password) => { ... },
      logout: () => { ... },
    }),
    { name: 'auth-storage' }
  )
);
```

### API Client

Centralized API client with automatic token handling:

```typescript
class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  async request<T>(endpoint: string, options: RequestInit) {
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
    };
    return fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  }
}
```

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `user_profiles` | User account information |
| `tax_returns` | Tax filing data |
| `tax_documents` | Uploaded tax documents |
| `legal_documents` | Created legal documents |
| `legal_templates` | Document templates |
| `legal_filings` | Court filing records |
| `court_forms` | Generated court forms |
| `jurisdiction_rules` | State/county rules |
| `child_support_calculations` | Calculator history |
| `subscriptions` | User subscriptions |
| `transactions` | Payment history |
| `ai_usage_logs` | AI API usage tracking |

### Row Level Security (RLS)

All user data tables have RLS enabled:

```sql
-- Users can only access their own data
CREATE POLICY "Users can view own data" ON tax_returns
  FOR SELECT USING (auth.uid() = user_id);
```

## Security Architecture

### Data Protection

1. **Encryption at Rest**: AES-256 for sensitive fields (SSN, etc.)
2. **Encryption in Transit**: TLS 1.3 for all connections
3. **Key Management**: Environment variables for secrets

### Authentication

1. **JWT Tokens**: Short-lived access tokens (1 hour)
2. **Refresh Tokens**: Secure token rotation
3. **Rate Limiting**: Prevent brute force attacks

### Access Control

1. **Role-Based Access**: user, admin, expert roles
2. **Subscription Tiers**: Feature gating by tier
3. **RLS Policies**: Database-level access control

## AI Integration

### OpenAI Usage

```typescript
// AI client with usage tracking
export async function generate(
  prompt: string,
  systemPrompt: string,
  options: {
    userId: string;
    serviceType: string;
    serviceId?: string;
  }
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
  });
  
  // Track usage for billing
  await trackUsage(options.userId, response.usage);
  
  return response.choices[0].message.content;
}
```

### AI Features

| Feature | Module | Purpose |
|---------|--------|---------|
| Tax Interview | Tax | Guide users through tax questions |
| Tax Suggestions | Tax | Recommend deductions/credits |
| Document Generation | Legal | Create legal documents from input |
| Document Review | Legal | Check for completeness/issues |
| Form Population | Filing | Auto-fill court forms |

## Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────────────────────────────┐
│                     VERCEL / RAILWAY                         │
│  ┌─────────────────────┐    ┌─────────────────────┐        │
│  │   Frontend (Vercel) │    │   Backend (Railway) │        │
│  │   - Static hosting  │    │   - Node.js server  │        │
│  │   - CDN             │    │   - Auto-scaling    │        │
│  └─────────────────────┘    └─────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│    SUPABASE     │ │     OPENAI      │ │     STRIPE      │
│   (Managed)     │ │   (API)         │ │   (Managed)     │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Environment Variables

```env
# Backend
PORT=3002
NODE_ENV=production
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
OPENAI_API_KEY=sk-xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
JWT_SECRET=xxx
ENCRYPTION_KEY=xxx

# Frontend
VITE_API_URL=https://api.legalflow.com
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

## Performance Considerations

### Caching Strategy

1. **API Responses**: Cache static data (templates, guidelines)
2. **Frontend**: TanStack Query with stale-while-revalidate
3. **Database**: Supabase connection pooling

### Optimization

1. **Code Splitting**: Lazy load routes/modules
2. **Image Optimization**: Next-gen formats (WebP)
3. **Bundle Size**: Tree shaking, minimal dependencies

## Scalability

### Horizontal Scaling

- Stateless API design for load balancing
- Supabase handles database scaling
- CDN for static assets

### Vertical Scaling

- Railway auto-scaling for CPU/memory
- Connection pooling for database

## Monitoring

### Logging

```typescript
// Winston logger with structured logs
logger.info('Tax return created', {
  userId: req.user.id,
  taxYear: 2024,
  status: 'draft'
});
```

### Metrics

- API response times
- Error rates
- AI usage costs
- User activity

## Future Considerations

1. **Microservices**: Split modules into separate services
2. **Real-time**: WebSocket for filing status updates
3. **Mobile App**: React Native client
4. **Multi-tenancy**: White-label support

