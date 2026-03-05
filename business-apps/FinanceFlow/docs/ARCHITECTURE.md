# FinanceFlow Architecture

## System Overview

FinanceFlow is a standalone Express.js backend API providing financial services for the GAS platform. It was extracted from LegalFlow to establish a clean separation between legal and financial concerns.

```
┌─────────────────────────────────────────────────┐
│              gasweb-site (port 3000)             │
│         React Frontend (Vite + TypeScript)       │
│                                                  │
│  ┌──────────────┐     ┌───────────────────────┐  │
│  │ LegalFlow    │     │ FinanceFlow Pages      │  │
│  │ Pages        │     │ - Bookkeeping          │  │
│  │              │     │ - Tax Filing           │  │
│  │              │     │ - Invoicing (AP/AR)    │  │
│  │              │     │ - Inventory            │  │
│  └──────┬───────┘     └──────────┬────────────┘  │
│         │                        │               │
│  legalFlowApi.ts          financeFlowApi.ts      │
└─────────┼────────────────────────┼───────────────┘
          │                        │
    Vite Proxy               Vite Proxy
   /api/legalflow            /api/financeflow
          │                        │
          ▼                        ▼
┌─────────────────┐    ┌───────────────────────┐
│   LegalFlow     │    │     FinanceFlow       │
│   (port 3002)   │    │     (port 3003)       │
│                 │    │                       │
│   Express.js    │    │   Express.js          │
│   Legal APIs    │    │   Financial APIs      │
└────────┬────────┘    └──────────┬────────────┘
         │                        │
         └────────┬───────────────┘
                  │
                  ▼
         ┌────────────────┐
         │   Supabase     │
         │  (PostgreSQL)  │
         │   Shared DB    │
         └────────────────┘
```

## Request Flow

1. User navigates to a FinanceFlow page in the portal
2. Frontend page calls `financeFlowApi.ts` methods
3. API client gets Supabase session token from `AuthContext`
4. In dev: Vite proxy forwards `/api/financeflow/*` → `localhost:3003/api/*`
5. Express middleware validates the Bearer token via Supabase Auth
6. Route handler processes the request
7. Services interact with Supabase (PostgreSQL) for data
8. Response returned to frontend

## Authentication Flow

```
Frontend                    FinanceFlow API              Supabase
   │                             │                          │
   │  GET /api/tax/returns       │                          │
   │  Authorization: Bearer xxx  │                          │
   │────────────────────────────>│                          │
   │                             │  auth.getUser(token)     │
   │                             │─────────────────────────>│
   │                             │  { user }                │
   │                             │<─────────────────────────│
   │                             │                          │
   │                             │  (if Supabase fails)     │
   │                             │  jwt.verify(token)       │
   │                             │                          │
   │  { data: [...] }            │                          │
   │<────────────────────────────│                          │
```

The auth middleware:
1. Extracts Bearer token from Authorization header
2. Validates via `supabaseAdmin.auth.getUser(token)`
3. Falls back to custom JWT verification if Supabase auth fails
4. Attaches user info to `req.user` for route handlers

## Module Architecture

### Tax Filing Module

```
routes/tax/
├── returns.ts        → CRUD for tax returns
├── interview.ts      → AI-guided tax interview
├── documents.ts      → Tax document management
├── calculations.ts   → Tax liability calculations
├── calculator.ts     → Tax calculator tools
├── estimate.ts       → Quick tax estimates
├── e-filing.ts       → Federal e-filing submission
├── state-e-filing.ts → State e-filing submission
├── business.ts       → Business tax returns
└── prior-year.ts     → Prior year data import

services/tax/
├── tax-calculator.ts   → Tax calculation engine
├── form-generator.ts   → IRS form generation
├── refund-estimator.ts → Refund estimation
├── e-filing.ts         → E-filing service
└── deductions.ts       → Deduction analysis
```

### Bookkeeping Module

```
routes/bookkeeping/
├── bookkeeping.ts      → Transaction CRUD, accounts, summary
├── bank-statements.ts  → CSV/PDF import with OCR
└── ap-ar.ts            → Accounts payable/receivable

services/bookkeeping/
├── categorization.ts   → AI transaction categorization
└── statement-parser.ts → Bank statement parsing
```

### Accounting Module

```
routes/
└── accounting.ts       → Chart of accounts, journal entries
```

### Integration Modules

```
routes/integrations/
└── plaid.ts            → Plaid Link token, account linking

routes/ai/
└── tax-advisor.ts      → AI tax Q&A

services/integrations/
└── plaid.ts            → Plaid API client

services/ai/
├── openai-client.ts    → OpenAI API wrapper
└── tax-advisor.ts      → Tax advisor AI logic
```

## Database Schema

FinanceFlow uses shared Supabase tables. Key tables:

### Tax Tables
- `tax_returns` — Tax return records with status tracking
- `tax_documents` — W-2s, 1099s, and other tax documents
- `tax_calculations` — Computed tax results
- `e_filing_submissions` — E-filing submission records

### Bookkeeping Tables
- `transactions` — Income and expense records
- `linked_bank_accounts` — Plaid-linked bank accounts
- `transaction_categories` — Category definitions

### AP/AR Tables
- `accounts_payable` — Bills and vendor payments
- `accounts_receivable` — Invoices and client payments

### Accounting Tables
- `chart_of_accounts` — Account definitions
- `journal_entries` — Double-entry bookkeeping entries
- `journal_entry_items` — Individual debit/credit lines

## External Services

| Service | Purpose | Config Key |
|---------|---------|------------|
| **Supabase** | Database, Auth | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| **OpenAI** | AI Tax Advisor, categorization | `OPENAI_API_KEY` |
| **Plaid** | Bank account linking, transactions | `PLAID_CLIENT_ID`, `PLAID_SECRET` |
| **Stripe** | Payment processing | `STRIPE_SECRET_KEY` |
| **Google Cloud Vision** | OCR for receipts/statements | `GOOGLE_CLOUD_CREDENTIALS` |

## Middleware Stack

Request processing order:

1. **Helmet** — Security headers
2. **CORS** — Cross-origin configuration
3. **Body Parser** — JSON and URL-encoded parsing (10MB limit)
4. **Rate Limiter** — IP-based rate limiting
5. **Request Logger** — Debug logging of method + path
6. **Auth Middleware** — Token validation (per-route)
7. **Route Handler** — Business logic
8. **Error Handler** — Catches and formats errors

## Error Handling

All errors are caught by the global error handler and returned in a consistent format:

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error description",
    "code": "ERROR_CODE"
  }
}
```

Custom error classes in `utils/errors.ts`:
- `AppError` — Base error class
- `ValidationError` — 400 Bad Request
- `AuthenticationError` — 401 Unauthorized
- `NotFoundError` — 404 Not Found

Route handlers use `asyncHandler` wrapper from `middleware/async.ts` to catch async errors without try/catch boilerplate.

## Security

- **Encryption**: AES-256 for sensitive financial data (SSN, account numbers)
- **Auth**: Supabase JWT tokens, validated server-side
- **Rate Limiting**: Per-IP limits on all endpoints
- **CORS**: Restricted to allowed origins
- **Helmet**: Security headers (CSP, HSTS, etc.)
- **Input Validation**: Zod schemas for request validation

## Deployment

FinanceFlow is designed to be deployed as a standalone Node.js service. In production:

- Set `NODE_ENV=production`
- Configure `ALLOWED_ORIGINS` for CORS
- Use `PLAID_ENV=production` for live banking
- Set up proper encryption keys
- Configure rate limits for production load
