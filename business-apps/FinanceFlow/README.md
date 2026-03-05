# FinanceFlow

AI-powered tax filing, bookkeeping, accounting, and financial management platform.

## Overview

FinanceFlow is a standalone Express.js backend API that provides financial services for the GAS platform. It was extracted from LegalFlow to create a clean separation between legal and financial services.

**Port:** 3003 (dev)
**Frontend:** `gasweb-site/src/pages/portal/financeflow/`
**API Base:** `/api/*`

## Features

### Tax Filing
- AI-powered tax interview and preparation
- Federal and state tax return creation
- Tax calculations and estimates
- E-filing submission (IRS and state agencies)
- Prior year import
- Business tax returns
- AI Tax Advisor for real-time guidance

### Bookkeeping
- Transaction tracking and categorization
- Bank account linking via Plaid
- Bank statement import (CSV/PDF with OCR)
- Income and expense summaries
- AI-powered transaction categorization

### Accounts Payable / Receivable
- Invoice creation and tracking
- Bill management and payment tracking
- Overdue detection
- Balance tracking

### Accounting
- Chart of accounts management
- Journal entries (double-entry bookkeeping)
- Financial reports

### Integrations
- **Plaid** — Bank account linking, transaction sync, tax document import
- **Stripe** — Payment processing, subscriptions
- **OpenAI** — AI Tax Advisor, transaction categorization
- **Google Cloud Vision** — OCR for receipts and bank statements

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express.js 4.x
- **Language:** TypeScript (ES2022, NodeNext modules)
- **Database:** Supabase (PostgreSQL)
- **AI:** OpenAI GPT-4 Turbo
- **Auth:** Supabase JWT + custom JWT fallback
- **Banking:** Plaid API
- **Payments:** Stripe

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase project (shared with other GAS apps)
- OpenAI API key
- Plaid API credentials (sandbox for dev)

### Installation

```bash
cd business-apps/FinanceFlow
cp .env.example .env  # Fill in your credentials
npm install
npm run dev            # Starts on port 3003
```

### Environment Variables

See `.env.example` for all required variables. Key ones:

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3003) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypasses RLS) |
| `OPENAI_API_KEY` | OpenAI API key for AI features |
| `PLAID_CLIENT_ID` | Plaid client ID |
| `PLAID_SECRET` | Plaid secret key |
| `PLAID_ENV` | Plaid environment (sandbox/development/production) |

## API Endpoints

### Tax Returns
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/tax/returns` | List user's tax returns |
| POST | `/api/tax/returns` | Create new tax return |
| GET | `/api/tax/returns/:id` | Get specific return |
| PUT | `/api/tax/returns/:id` | Update return |
| DELETE | `/api/tax/returns/:id` | Delete return |

### Tax Interview
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/tax/interview/:id/start` | Start AI tax interview |
| POST | `/api/tax/interview/:id/answer` | Answer interview question |
| GET | `/api/tax/interview/:id/status` | Get interview progress |

### Tax Calculations & Filing
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/tax/calculations/:id` | Calculate tax for return |
| POST | `/api/tax/estimate` | Quick tax estimate |
| POST | `/api/tax/e-filing/:id/submit` | Submit federal e-file |
| GET | `/api/tax/e-filing/:id/status` | Check e-file status |
| POST | `/api/tax/state/:id/submit` | Submit state e-file |
| GET | `/api/tax/calculator` | Tax calculator tools |
| POST | `/api/tax/business` | Business tax operations |
| GET | `/api/tax/prior-year` | Prior year import |

### Bookkeeping
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/bookkeeping/transactions` | List transactions |
| POST | `/api/bookkeeping/transactions` | Create transaction |
| GET | `/api/bookkeeping/accounts` | List linked bank accounts |
| POST | `/api/bookkeeping/accounts/:id/sync` | Sync bank account |
| GET | `/api/bookkeeping/summary` | Income/expense summary |
| POST | `/api/bookkeeping/statements/import` | Import bank statement |

### Accounts Payable / Receivable
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/bookkeeping/ap` | List payables |
| POST | `/api/bookkeeping/ap` | Create payable |
| PUT | `/api/bookkeeping/ap/:id` | Update payable |
| POST | `/api/bookkeeping/ap/:id/pay` | Record payment |
| GET | `/api/bookkeeping/ar` | List receivables |
| POST | `/api/bookkeeping/ar` | Create receivable |
| PUT | `/api/bookkeeping/ar/:id` | Update receivable |
| POST | `/api/bookkeeping/ar/:id/payment` | Record payment |

### Accounting
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/accounting/:businessId/accounts` | Chart of accounts |
| POST | `/api/accounting/:businessId/accounts` | Create account |
| GET | `/api/accounting/:businessId/journal-entries` | Journal entries |
| POST | `/api/accounting/:businessId/journal-entries` | Create entry |

### Plaid Integration
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/plaid/create-link-token` | Create Plaid Link token |
| POST | `/api/plaid/exchange-public-token` | Exchange public token |
| GET | `/api/plaid/accounts` | Get linked accounts |

### AI Tax Advisor
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/ai/tax-advisor/ask` | Ask tax question |
| GET | `/api/ai/tax-advisor/suggestions/:returnId` | Get suggestions |

## Authentication

All API endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <supabase_access_token>
```

The backend validates the token via Supabase Auth, then falls back to custom JWT verification. The authenticated user's profile and subscription tier determine feature access.

## Frontend Integration

The frontend connects to this API via `gasweb-site/src/lib/financeFlowApi.ts`. In development, the Vite dev server proxies `/api/financeflow/*` to `localhost:3003`.

See `gasweb-site/vite.config.ts` for proxy configuration.

## Project Structure

```
src/
├── index.ts                    # Express app entry point
├── config/index.ts             # Environment configuration
├── routes/
│   ├── tax/                    # Tax filing routes (10 files)
│   ├── bookkeeping/            # Bookkeeping routes (3 files)
│   ├── accounting.ts           # Chart of accounts, journal entries
│   ├── integrations/plaid.ts   # Plaid bank integration
│   └── ai/tax-advisor.ts       # AI tax advisor
├── services/
│   ├── tax/                    # Tax calculation services
│   ├── bookkeeping/            # Statement parsing, categorization
│   ├── integrations/plaid.ts   # Plaid service layer
│   ├── ai/                     # AI services (OpenAI)
│   ├── ocr/                    # Document OCR scanning
│   ├── pdf/                    # PDF generation
│   ├── data-ingestion/         # Tax data ingestion (IRS/state)
│   └── encryption.ts           # Data encryption for SSN/financial data
├── middleware/
│   ├── auth.ts                 # Supabase + JWT authentication
│   ├── error-handler.ts        # Error handling + async wrapper
│   └── rate-limit.ts           # Rate limiting
├── utils/
│   ├── supabase.ts             # Supabase client instances
│   ├── logger.ts               # Winston logger
│   ├── errors.ts               # Error classes
│   └── validation.ts           # Zod validation schemas
├── types/
│   ├── tax.ts                  # Tax-specific types
│   └── database.ts             # Supabase database types
└── lib/
    ├── openai.ts               # OpenAI client
    └── supabase.ts             # Re-exports supabase utils
```

## Related Apps

- **LegalFlow** (`business-apps/LegalFlow/`) — Legal documents, trademarks, court filings
- **Frontend** (`gasweb-site/`) — GAS client portal with FinanceFlow pages
