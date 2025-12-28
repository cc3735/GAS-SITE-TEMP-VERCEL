# LegalFlow - AI-Powered Legal & Tax Platform

> **Comprehensive web-based platform** combining TurboTax-style tax filing, LegalZoom-style legal document services, and AI-powered legal filing automation.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18.x-61dafb)](https://reactjs.org/)

---

## Overview

LegalFlow provides three core modules:

1. **Tax Filing (TurboTax Clone)** - AI-guided tax preparation and e-filing
2. **Legal Documents (LegalZoom Clone)** - Business formations, estate planning, contracts
3. **Legal Filing Automation** - Court filings, child support calculator, jurisdiction rules

---

## Quick Start

### Backend

```bash
# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your credentials

# Start development server
npm run dev  # Runs on port 3002
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev  # Runs on port 5173
```

---

## Project Structure

```
LegalFlow/
├── src/                          # Backend source code
│   ├── index.ts                  # Express app entry point
│   ├── config/                   # Configuration
│   ├── routes/                   # API routes
│   │   ├── auth.ts
│   │   ├── tax/
│   │   ├── legal/
│   │   ├── filing/
│   │   └── child-support/
│   ├── services/                 # Business logic
│   │   ├── ai/
│   │   ├── tax/
│   │   ├── legal/
│   │   ├── filing/
│   │   └── child-support/
│   ├── middleware/               # Express middleware
│   ├── types/                    # TypeScript types
│   └── utils/                    # Utilities
├── frontend/                     # React frontend
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── lib/
├── migrations/                   # Database migrations
└── docs/                         # Documentation
```

---

## API Modules

### Tax Filing
- `POST /api/tax/returns` - Create tax return
- `POST /api/tax/interview/start` - Start AI interview
- `GET /api/tax/returns/:id/refund-estimate` - Get refund estimate

### Legal Documents
- `GET /api/legal/templates` - List document templates
- `POST /api/legal/documents` - Create document
- `POST /api/legal/documents/:id/generate-pdf` - Generate PDF

### Legal Filing Automation
- `POST /api/filing/start` - Start new filing
- `POST /api/filing/:id/interview` - Submit interview answer
- `POST /api/filing/:id/generate-forms` - Generate court forms

### Child Support Calculator
- `POST /api/child-support/calculate` - Calculate support
- `GET /api/child-support/guidelines/:state` - Get state guidelines

---

## Features

### Tax Module
- AI-guided interview process
- Form 1040 and common schedules
- Real-time refund estimates
- W-2/1099 document import
- E-filing support

### Legal Documents Module
- 100+ customizable templates
- Business formations (LLC, Corp, DBA)
- Estate planning (Wills, Trusts)
- AI document review
- DocuSign integration

### Legal Filing Automation
- Child support calculator (all 50 states)
- Court form generation
- Jurisdiction rules engine
- Filing checklists and deadlines
- E-filing integration

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Node.js 20 + Express + TypeScript |
| Frontend | React 18 + Vite + TypeScript |
| Database | Supabase (PostgreSQL) |
| AI | OpenAI GPT-4 |
| Payments | Stripe |
| PDF Generation | pdf-lib |
| Authentication | Supabase Auth |

---

## Security & Compliance

- AES-256 encryption for sensitive data (SSN, etc.)
- TLS for all data in transit
- GDPR-inspired data handling
- State bar compliant (document preparation service)
- Prominent legal disclaimers

---

## Important Disclaimers

⚠️ **This platform provides document preparation services only.**

- This is NOT legal advice
- This is NOT tax advice
- Users should consult licensed professionals for complex matters
- We are a document preparation service, not a law firm

---

## Documentation

- [Architecture Guide](docs/ARCHITECTURE.md)
- [API Reference](docs/API_REFERENCE.md)
- [Setup Guide](docs/SETUP_GUIDE.md)
- [Security Guide](docs/SECURITY.md)
- [Compliance Guide](docs/COMPLIANCE.md)

---

## License

MIT

