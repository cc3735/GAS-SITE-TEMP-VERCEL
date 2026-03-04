# GAS Platform

> **GasWeb.info** — AI-powered business automation platform.

## Active Project

**`gasweb-site/`** is the unified application containing:

- **Public Website** — Marketing pages at `/`, `/services`, `/education`, `/case-studies`, `/contact`
- **GAS OS** — Internal operating system at `/os` (staff only, requires Google auth)
- **GAS Client Portal** — Client-facing portal at `/portal` (requires auth)

### Quick Start

```bash
cd gasweb-site
npm install
npm run dev    # Starts on http://localhost:3000
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Supabase (PostgreSQL + Edge Functions) |
| Auth | Supabase Auth (Google OAuth) |
| Deployment | Vercel |

### Key Routes

| Route | Description |
|-------|-------------|
| `/` | Home page |
| `/portal` | Client Portal (redirects to `/portal/apps`) |
| `/portal/apps` | My Apps |
| `/portal/crm` | Portal CRM |
| `/portal/projects` | Portal Projects |
| `/portal/settings` | Account settings |
| `/os` | GAS OS Dashboard (staff only) |
| `/os/agents` | AI Agents |
| `/os/mcp` | MCP Servers |
| `/os/clients` | Client Management |
| `/os/crm` | CRM |
| `/os/projects` | Projects |
| `/os/marketing` | Marketing |
| `/os/analytics` | Analytics |
| `/os/settings` | OS Settings |
| `/os/login` | GAS OS login |

## Other Directories

| Directory | Description |
|-----------|-------------|
| `supabase/` | Supabase config and database migrations |
| `_archive/` | Archived older project versions (reference only — do not run) |

## Environment Variables

Create `gasweb-site/.env`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

Built by the GAS Team
