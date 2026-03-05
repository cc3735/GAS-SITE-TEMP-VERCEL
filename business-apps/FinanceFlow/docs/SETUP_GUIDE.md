# FinanceFlow Setup Guide

## Prerequisites

- **Node.js 20+** — [Download](https://nodejs.org/)
- **npm** — Included with Node.js
- **Supabase project** — Shared with other GAS apps
- **OpenAI API key** — For AI Tax Advisor and transaction categorization
- **Plaid API credentials** — For bank account linking (sandbox for development)

Optional:
- **Stripe API key** — For payment processing
- **Google Cloud Vision credentials** — For OCR on receipts and bank statements

## Installation

```bash
# Navigate to FinanceFlow
cd business-apps/FinanceFlow

# Copy environment template
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm run dev
```

The server starts on **port 3003** by default.

## Environment Configuration

Edit `.env` with your credentials:

### Required

```env
# Server
PORT=3003
NODE_ENV=development

# Supabase (same credentials as gasweb-site)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-your-openai-key
```

### Plaid (for bank linking)

```env
PLAID_CLIENT_ID=your-plaid-client-id
PLAID_SECRET=your-plaid-sandbox-secret
PLAID_ENV=sandbox
```

Use `sandbox` for development. Plaid provides test credentials for the sandbox environment.

### Optional

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# JWT (for fallback auth)
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# Encryption (for sensitive data like SSN)
ENCRYPTION_KEY=your-32-char-key
ENCRYPTION_IV=your-16-char-iv

# Google Cloud Vision (for OCR)
GOOGLE_CLOUD_CREDENTIALS=path-to-credentials.json

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

## Frontend Integration

The frontend connects to FinanceFlow via a Vite dev proxy.

### Vite Proxy (already configured)

In `gasweb-site/vite.config.ts`:

```typescript
server: {
  proxy: {
    '/api/financeflow': {
      target: 'http://localhost:3003',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/financeflow/, '/api'),
    }
  }
}
```

### API Client

The frontend uses `gasweb-site/src/lib/financeFlowApi.ts` to call the backend. It automatically:

- Gets the Supabase session token
- Adds `Authorization: Bearer <token>` header
- Handles errors gracefully

### Environment Variable

Add to `gasweb-site/.env`:

```env
VITE_FINANCEFLOW_API_URL=http://localhost:3003/api
```

## Development Workflow

### Running Everything

```bash
# Terminal 1 — Frontend
cd gasweb-site
npm run dev           # http://localhost:3000

# Terminal 2 — FinanceFlow backend
cd business-apps/FinanceFlow
npm run dev           # http://localhost:3003
```

### Health Check

Verify the backend is running:

```bash
curl http://localhost:3003/health
```

Expected response:

```json
{
  "status": "healthy",
  "service": "FinanceFlow API",
  "version": "1.0.0"
}
```

### Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start dev server with hot reload |
| `build` | `npm run build` | Compile TypeScript |
| `start` | `npm start` | Run compiled JavaScript |
| `typecheck` | `npm run typecheck` | Run TypeScript type checking |

## Plaid Sandbox Testing

In sandbox mode, use these test credentials when linking bank accounts:

- **Username:** `user_good`
- **Password:** `pass_good`

This will simulate a successful bank connection with test transaction data.

See [Plaid Integration Guide](PLAID_INTEGRATION_GUIDE.md) for more details.

## Troubleshooting

### `npm install` fails with code signature errors

Google Drive shared storage can corrupt native Node.js binaries:

```bash
rm -rf node_modules
npm install
```

### Port 3003 already in use

Check what's using the port:

```bash
lsof -i :3003
```

Or change the port in `.env`:

```env
PORT=3004
```

### Supabase connection errors

Verify your Supabase credentials:

1. Check `SUPABASE_URL` matches your project URL
2. Check `SUPABASE_SERVICE_ROLE_KEY` is the **service role** key (not anon)
3. Ensure the Supabase project is running

### Auth token errors

FinanceFlow uses the same Supabase project as the frontend. Make sure:

1. You're logged into the portal (Google OAuth)
2. The session token is being passed correctly
3. The Supabase project URL matches between frontend and backend

## Database

FinanceFlow uses the shared Supabase PostgreSQL database. Tables are created via migrations.

To apply migrations:

```bash
# Using Supabase CLI from the project root
cd ../../supabase
supabase db push
```

See [Architecture Guide](ARCHITECTURE.md) for the database schema.
