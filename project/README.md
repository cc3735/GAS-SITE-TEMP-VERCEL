# AI Operating System (SaaS Platform)

A modern, multi-tenant SaaS platform designed to orchestrate AI agents, manage projects, track customer relationships (CRM), and automate marketing workflows. Built with React, TypeScript, Tailwind CSS, and Supabase.

## 🚀 Project Status: Functional MVP

This application has evolved from a prototype to a fully functional MVP. All core modules are connected to a live Supabase backend.

| Feature | Status | Data Source | Description |
|---------|--------|-------------|-------------|
| **Authentication** | ✅ Live | Supabase Auth | Google OAuth & Email/Password support with session management. |
| **Multi-Tenancy** | ✅ Live | `organizations` table | Data isolation enforced via Row Level Security (RLS) policies. |
| **Dashboard** | ✅ Live | Aggregated Data | Real-time stats and activity feed from all modules. |
| **AI Agents** | ✅ Live | `ai_agents` table | Create and configure AI agents. Includes a **Playground** to simulate execution. |
| **Projects** | ✅ Live | `projects` table | Full project management with custom fields for budget & tech stack. |
| **CRM** | ✅ Live | `contacts` table | Contact management with custom fields for company data & notes. |
| **Marketing** | ✅ Live | `campaigns` table | Create and schedule email/SMS campaigns. |
| **Social Media** | ✅ Live | `social_media_posts` | Schedule and track social media content. |

## 🛠 Tech Stack

- **Frontend:** React 18, Vite, TypeScript
- **Styling:** Tailwind CSS, Lucide React (Icons)
- **Backend:** Supabase (PostgreSQL, Auth, Realtime)
- **State Management:** React Context API + Custom Hooks
- **UX Enhancements:**
    - **Toast Notifications:** Non-blocking success/error feedback.
    - **Command Palette:** `Cmd+K` / `Ctrl+K` global navigation and actions.
    - **Agent Playground:** Simulated terminal environment for testing AI agents.

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- A Supabase project (Create one at [database.new](https://database.new))

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd project
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env` file in the `project/` root with your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Database Setup (Migrations):**
    Run the SQL scripts in the `supabase/migrations/` folder in your Supabase SQL Editor in the following order:
    1.  `20251114035228_create_multi_tenant_foundation.sql`
    2.  `20251114035325_create_project_management_schema.sql`
    3.  `20251114035415_create_crm_schema.sql`
    4.  `20251114035511_create_ai_agents_mcp_schema.sql`
    5.  `20251114035624_create_marketing_social_media_schema.sql`
    6.  `20251115011435_add_missing_foreign_key_indexes.sql`
    7.  `20251115011556_optimize_rls_policies_auth_functions.sql`
    8.  `20251115011625_fix_function_search_path_mutability.sql`
    9.  `20251119000000_enhance_projects_schema.sql` (Crucial: Adds custom fields & budget)
    10. `20251119010000_create_rag_schema.sql` (Adds vector support for RAG)

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

## 🧩 Project Architecture

### Directory Structure
```
src/
├── components/         # Reusable UI components (Modals, Layouts, ChatBot)
│   ├── AgentPlaygroundModal.tsx  # AI Simulation UI
│   └── CommandPalette.tsx        # Global Search (Cmd+K)
├── contexts/           # Global State
│   ├── AuthContext.tsx         # User session
│   ├── OrganizationContext.tsx # Current workspace/tenant
│   └── ToastContext.tsx        # Notification system
├── hooks/              # Data Logic (Supabase connections)
│   ├── useAgents.ts
│   ├── useProjects.ts
│   ├── useContacts.ts
│   └── useCampaigns.ts
│   └── useSocial.ts
├── lib/                # Infrastructure
│   ├── supabase.ts     # Supabase client configuration
│   └── emailService.ts # Modular Email Provider Pattern
└── pages/              # Main Application Views
    ├── Dashboard.tsx   # Overview & Quick Actions
```

### Key Design Patterns

- **Multi-Tenancy:** Every database query filters by `organization_id`. This is enforced in the React hooks (`useProjects`, `useContacts`, etc.) to ensure users only see data relevant to their current organization.
- **Custom Fields via JSONB:** To allow flexibility without constant schema migrations, specific features (like Project details or Contact notes) use a `custom_fields` JSONB column in PostgreSQL. This allows the frontend to store arbitrary structured data.
- **Optimistic UI:** The application is designed to feel fast. While most hooks wait for the DB response, the UI provides immediate feedback via Toast notifications.

## 🤖 AI Agent Playground

The **Agent Playground** (`src/components/AgentPlaygroundModal.tsx`) is a simulation environment.
- **How to use:** Go to the "AI Agents" page and click "Run" on any agent card.
- **Functionality:** It mimics a real AI execution lifecycle (Context Analysis -> Model Query -> Output Generation) with a streaming log interface.
- **Customization:** You can modify the `handleRun` function to connect to a real LLM endpoint (e.g., OpenAI API via Supabase Edge Functions) in the future.

## ⌨️ Command Palette

Press `Cmd+K` (Mac) or `Ctrl+K` (Windows) anywhere in the application to open the global command menu.
- **Navigation:** Quickly jump between Dashboard, CRM, Projects, etc.
- **Actions:** Trigger "Create New Project" or "Add Contact" from any screen.

## 🐛 Known Limitations & Future Roadmap

1.  **Vector Database (RAG):** The database schema (`document_embeddings` table) is set up for vector search. The current ChatBot implementation uses a "Client-Side RAG" fallback (searching loaded project data) to answer questions without needing an OpenAI API key immediately. To enable full RAG, deploy an Edge Function to generate embeddings using the `vector` extension.
2.  **Email Sending:** The app includes a modular `EmailService`. By default, it uses a `ConsoleEmailProvider` for development (logs to console). To send real emails, deploy the provided `send-email` Edge Function (`supabase/functions/send-email`) and configure your Resend API Key.
3.  **Company Lookup:** The CRM creates contacts with a text-based Company Name. A future enhancement should link this to the `companies` relational table for better data integrity.
