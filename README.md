# GAS Platform

> **GasWeb.info** — AI-powered business automation platform.

## Terminology

| Term | Meaning |
|------|---------|
| **GAS** | GasWeb / GasWeb.info — the company and platform |
| **GAS OS** | Internal staff operating system — route prefix `/os` |
| **GCP** | **GAS Client Portal** (NOT Google Cloud Platform) — route prefix `/portal` |

## Architecture

Everything runs from **one project**: `gasweb-site/`. It is a single Vite + React + TypeScript application serving three sections on **port 3000**:

| Section | Routes | Auth Required | Who |
|---------|--------|---------------|-----|
| Public Website | `/`, `/services`, `/education`, `/case-studies`, `/contact` | No | Anyone |
| GAS Client Portal (GCP) | `/portal/*` | Yes (Google OAuth) | Authenticated users |
| GAS OS | `/os/*` | Yes (Google OAuth + `is_gas_staff`) | GAS staff only |

There is **only one dev server** to run. Do NOT run anything from `_archive/`.

## Quick Start

```bash
cd gasweb-site
npm install
npm run dev    # http://localhost:3000
```

### Gotchas

- **Google Drive shared storage** corrupts native Node binaries (Rollup, esbuild). Fix: `rm -rf node_modules && npm install`
- **`.env` required** — must exist at `gasweb-site/.env` with:
  ```env
  VITE_SUPABASE_URL=your_supabase_url
  VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
  ```
- **Port 3000** is configured in `gasweb-site/vite.config.ts` with auto-open enabled

## Authentication & Routing

### GAS Client Portal (GCP)
1. Navigate to `/login`
2. Sign in with Google OAuth (Supabase Auth)
3. Redirects to `/portal` → `/portal/apps`
4. Protected by `ProtectedRoute` component (checks `useAuth().user`)

### GAS OS
1. Navigate to `/os/login` (separate login page from portal)
2. Sign in with Google OAuth
3. `GasStaffRoute` checks `is_gas_staff` flag in `user_profiles` table
4. If staff → redirects to `/os` (the dashboard). If not staff → redirects to `/portal/apps`
5. **The OS dashboard is the index route at `/os`** — there is NO `/os/dashboard` route

### Route Reference

**Portal routes:**
| Route | Page |
|-------|------|
| `/portal` | Redirects to `/portal/apps` |
| `/portal/apps` | My Apps |
| `/portal/overview` | Overview |
| `/portal/crm` | Portal CRM |
| `/portal/projects` | Portal Projects |
| `/portal/settings` | Account Settings (profile, billing, notifications, security) |
| `/portal/legalflow` | LegalFlow Hub |

**OS routes:**
| Route | Page |
|-------|------|
| `/os` | Dashboard (index) |
| `/os/projects` | Projects |
| `/os/crm` | CRM |
| `/os/marketing` | Marketing |
| `/os/agents` | AI Agents |
| `/os/mcp` | MCP Servers |
| `/os/analytics` | Analytics |
| `/os/clients` | Client Management |
| `/os/clients/:id` | Client Detail |
| `/os/apps` | Apps |
| `/os/subscriptions` | Subscriptions |
| `/os/support-tickets` | Support Tickets |
| `/os/settings` | OS Settings |
| `/os/login` | OS Login |
| `/os/auth/callback` | OAuth Callback |

**Public routes:**
| Route | Page |
|-------|------|
| `/` | Home |
| `/services` | Services |
| `/education` | Education |
| `/case-studies` | Case Studies |
| `/contact` | Contact |
| `/links` or `/hub` | Landing Page |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Supabase (PostgreSQL + Edge Functions) |
| Auth | Supabase Auth (Google OAuth) |
| Deployment | Vercel |

## Repo Structure

```
GAS-SITE-TEMP-VERCEL/
├── gasweb-site/           # THE ACTIVE PROJECT — run this
│   ├── src/
│   │   ├── components/    # Shared + os/ + portal/ components
│   │   ├── contexts/      # AuthContext, OrganizationContext
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Supabase client, services
│   │   ├── pages/
│   │   │   ├── os/        # GAS OS pages (OSDashboard, OSAgents, etc.)
│   │   │   └── portal/    # GCP pages (MyApps, Overview, Settings, etc.)
│   │   └── App.tsx        # All routing defined here
│   ├── .env               # Supabase credentials (not in git)
│   └── vite.config.ts     # Port 3000, path aliases
│
├── supabase/              # Supabase config and migrations
│   ├── config.toml
│   └── migrations/
│
├── business-apps/         # Business app subdirectories
├── _archive/              # OLD projects — reference only, do NOT run
│   └── project/           # Former standalone GAS OS (has unmigrated
│                          # Edge Functions and features to port later)
│
├── .gitignore             # Excludes node_modules, .env, dist, _archive
└── README.md              # This file
```

## Important Notes for AI Agents

1. **Only run `gasweb-site/`** — all other project directories are archived or inactive
2. **GCP = GAS Client Portal**, not Google Cloud Platform
3. **OS dashboard route is `/os`**, not `/os/dashboard` — it's an index route
4. **OS requires staff flag** — the user must have `is_gas_staff = true` in the `user_profiles` Supabase table
5. **`_archive/project/`** contains unmigrated Supabase Edge Functions (e.g., `submit-contact-form`) and features (KanbanBoard, CommandPalette, LeadEngagement, etc.) that may be ported to `gasweb-site/` in the future
6. **If `npm install` fails** with code signature errors, delete `node_modules` and reinstall — Google Drive corrupts native binaries

---

Built by the GAS Team
