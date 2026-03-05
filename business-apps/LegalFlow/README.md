# LegalFlow

AI-powered legal documents, trademark, business formation, and court filing platform.

## Overview

LegalFlow is a standalone Express.js backend API that provides legal services for the GAS platform. It handles document preparation, trademark search/filing, business formation, court filings, and child support calculations.

> **Note:** Financial services (tax filing, bookkeeping, AP/AR, accounting, Plaid) have been extracted into a separate [FinanceFlow](../FinanceFlow/) app.

**Port:** 3002 (dev)
**Frontend:** `gasweb-site/src/pages/portal/legalflow/`
**API Base:** `/api/*`

## Features

### Legal Documents
- 100+ customizable document templates
- AI-powered document generation and customization
- PDF generation and download
- Business formations (LLC, Corp, DBA)
- Estate planning (Wills, Trusts, POA)
- Contracts and agreements

### Trademark
- USPTO trademark search (real-time)
- Trademark application creation and tracking
- AI-guided trademark interview
- Application status monitoring

### Business Formation
- LLC, Corporation, DBA registration
- EIN application assistance
- State-specific requirements
- Operating agreements and bylaws

### Court Filings
- Filing creation and tracking
- AI-guided interview for court forms
- Court form generation
- Jurisdiction rules engine
- Filing checklists and deadlines

### Child Support Calculator
- All 50 states supported
- State-specific guidelines and rules
- Income-based calculations
- Deviation factor support

### Integrations
- **OpenAI** — AI document generation, trademark interview, filing assistance
- **Stripe** — Payment processing, subscriptions
- **DocuSign** — Document signing (via Supabase Edge Functions)

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 20+ |
| Framework | Express.js 4.x |
| Language | TypeScript (ES2022, NodeNext modules) |
| Database | Supabase (PostgreSQL) |
| AI | OpenAI GPT-4 Turbo |
| Auth | Supabase JWT + custom JWT fallback |
| Payments | Stripe |
| PDF | pdf-lib |

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase project (shared with other GAS apps)
- OpenAI API key

### Installation

```bash
cd business-apps/LegalFlow
cp env.example .env  # Fill in your credentials
npm install
npm run dev          # Starts on port 3002
```

### Environment Variables

See `env.example` for all required variables. Key ones:

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3002) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypasses RLS) |
| `OPENAI_API_KEY` | OpenAI API key for AI features |
| `STRIPE_SECRET_KEY` | Stripe secret key |

## API Endpoints

### Authentication
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/mfa/*` | MFA operations |

### Users
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users/profile` | Get user profile |
| GET | `/api/users/businesses` | List user's businesses |

### Legal Documents
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/legal/templates` | List document templates |
| GET | `/api/legal/templates/:id` | Get template details |
| GET | `/api/legal/documents` | List user's documents |
| POST | `/api/legal/documents` | Create document |
| GET | `/api/legal/documents/:id` | Get document |
| PUT | `/api/legal/documents/:id` | Update document |
| DELETE | `/api/legal/documents/:id` | Delete document |
| POST | `/api/legal/documents/:id/generate-pdf` | Generate PDF |
| POST | `/api/legal/documents/:id/ai-customize` | AI customization |

### Trademark
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/legal/trademark/search` | USPTO trademark search |
| GET | `/api/legal/trademark/applications` | List applications |
| POST | `/api/legal/trademark/applications` | Create application |
| GET | `/api/legal/trademark/applications/:id` | Get application |
| POST | `/api/legal/trademark/applications/:id/interview/start` | Start interview |
| POST | `/api/legal/trademark/applications/:id/interview/answer` | Answer question |

### Business Formation
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/legal/business` | Start business formation |
| GET | `/api/legal/business/:id` | Get formation status |

### Expanded Legal Services
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/legal/expanded/*` | Additional legal service endpoints |

### Court Filings
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/filing/start` | Start new filing |
| GET | `/api/filing/:id` | Get filing details |
| POST | `/api/filing/:id/interview` | Submit interview answer |
| POST | `/api/filing/:id/generate-forms` | Generate court forms |

### Child Support Calculator
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/child-support/calculate` | Calculate support |
| GET | `/api/child-support/guidelines/:state` | Get state guidelines |

### Payments & Subscriptions
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/payments/*` | Payment operations |
| GET | `/api/subscriptions/*` | Subscription management |

### Admin
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/data/*` | Data management (staff only) |
| GET | `/api/admin/technical/*` | Technical admin (staff only) |

### Collaboration
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/collaboration/*` | Collaboration portal |

## Authentication

All API endpoints (except `/health` and `/api/disclaimer`) require a Bearer token:

```
Authorization: Bearer <supabase_access_token>
```

The backend validates the token via Supabase Auth, then falls back to custom JWT verification.

## Frontend Integration

The frontend connects to this API via `gasweb-site/src/lib/legalFlowApi.ts`. In development, the Vite dev server proxies `/api/legalflow/*` to `localhost:3002`.

See `gasweb-site/vite.config.ts` for proxy configuration.

## Project Structure

```
src/
├── index.ts                    # Express app entry point
├── config/index.ts             # Environment configuration
├── routes/
│   ├── auth.ts                 # Authentication
│   ├── users.ts                # User management
│   ├── mfa.ts                  # Multi-factor auth
│   ├── legal/
│   │   ├── documents.ts        # Legal document CRUD
│   │   ├── templates.ts        # Document templates
│   │   ├── business-formation.ts # Business formation
│   │   ├── expanded-services.ts  # Additional legal services
│   │   └── trademark.ts        # Trademark search & applications
│   ├── filing/
│   │   ├── filings.ts          # Court filing management
│   │   └── interview.ts        # Filing interview
│   ├── child-support/
│   │   └── calculator.ts       # Child support calculator
│   ├── payments.ts             # Stripe payments
│   ├── subscriptions.ts        # Subscription management
│   ├── admin/
│   │   ├── data-management.ts  # Admin data tools
│   │   └── technical.ts        # Technical admin
│   └── collaboration/
│       └── portal.ts           # Collaboration portal
├── services/
│   ├── ai/                     # AI services (OpenAI)
│   ├── legal/                  # Legal document services
│   ├── filing/                 # Court filing services
│   ├── ocr/                    # Document OCR scanning
│   ├── pdf/                    # PDF generation
│   └── encryption.ts           # Data encryption
├── middleware/
│   ├── auth.ts                 # Supabase + JWT authentication
│   ├── error-handler.ts        # Error handling + async wrapper
│   └── rate-limit.ts           # Rate limiting
├── utils/
│   ├── supabase.ts             # Supabase client instances
│   ├── logger.ts               # Winston logger
│   ├── errors.ts               # Error classes
│   └── validation.ts           # Zod validation schemas
├── types/                      # TypeScript type definitions
└── lib/
    ├── openai.ts               # OpenAI client
    └── supabase.ts             # Re-exports supabase utils
```

## Related Apps

- **FinanceFlow** (`business-apps/FinanceFlow/`) — Tax filing, bookkeeping, AP/AR, accounting
- **Frontend** (`gasweb-site/`) — GAS client portal with LegalFlow pages

## Important Disclaimers

This platform provides document preparation services only.

- This is NOT legal advice
- Users should consult licensed attorneys for complex matters
- We are a document preparation service, not a law firm
- Laws vary by jurisdiction and change frequently

