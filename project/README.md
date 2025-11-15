# AI Operating System - Multi-Tenant SaaS Platform

A comprehensive, production-ready multi-tenant SaaS platform built with React, TypeScript, Vite, and Supabase. This platform provides a complete suite of business management tools including project management, CRM, AI agents, marketing automation, and social media management.

## Features

### Core Infrastructure
- **Multi-tenant Architecture**: Fully isolated data per organization with Row Level Security (RLS)
- **Authentication**: Secure email/password authentication with Supabase Auth
- **Organization Management**: Complete organization setup and member management
- **Role-Based Access Control**: Admin, manager, and member roles with granular permissions

### Project Management
- **Projects**: Create and manage projects with status tracking
- **Tasks**: Full task management with assignments, priorities, and deadlines
- **Time Tracking**: Built-in time tracking for tasks
- **Comments**: Collaborative commenting system on tasks

### CRM (Customer Relationship Management)
- **Contact Management**: Store and organize customer information
- **Deal Pipeline**: Track deals through customizable stages
- **Activities**: Log calls, meetings, and interactions
- **Notes**: Maintain detailed notes for each contact

### AI Agents & MCP Integration
- **AI Agents**: Create and manage AI agents with specific capabilities
- **Agent Tasks**: Assign and track tasks for AI agents
- **MCP Servers**: Model Context Protocol server integration
- **Tool Management**: Configure tools and resources for AI agents

### Marketing Automation
- **Campaigns**: Create and manage marketing campaigns
- **Email Templates**: Build reusable email templates
- **Campaign Analytics**: Track opens, clicks, and conversions
- **Audience Segmentation**: Target specific customer groups

### Social Media Management
- **Multi-Platform Support**: Manage Facebook, Twitter, Instagram, LinkedIn, and TikTok
- **Post Scheduling**: Schedule posts for optimal engagement times
- **Analytics Dashboard**: Track engagement metrics across platforms
- **Content Calendar**: Visual planning of social media content

### Analytics & Reporting
- **Real-time Dashboards**: Visual analytics for all modules
- **Custom Reports**: Generate reports based on specific metrics
- **Data Export**: Export data for external analysis

## Tech Stack

### Frontend
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Full type safety across the application
- **Vite**: Lightning-fast build tool and dev server
- **React Router**: Client-side routing with protected routes
- **Tailwind CSS**: Utility-first CSS framework for beautiful, responsive design
- **Lucide React**: Comprehensive icon library

### Backend
- **Supabase**: Backend-as-a-Service providing:
  - PostgreSQL database with real-time subscriptions
  - Authentication and authorization
  - Row Level Security (RLS)
  - Auto-generated REST APIs
  - Real-time data synchronization

### Database
- **PostgreSQL**: Robust relational database with:
  - Multi-tenant data isolation
  - Foreign key constraints
  - Indexes for optimized queries
  - Comprehensive RLS policies
  - Audit triggers for data tracking

## Project Structure

```
project/
├── src/
│   ├── components/          # Reusable UI components
│   │   └── DashboardLayout.tsx
│   ├── contexts/            # React contexts for state management
│   │   ├── AuthContext.tsx
│   │   └── OrganizationContext.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useAgents.ts
│   │   ├── useContacts.ts
│   │   ├── useMCPServers.ts
│   │   ├── useProjects.ts
│   │   └── useTasks.ts
│   ├── lib/                 # Utility libraries
│   │   ├── database.types.ts
│   │   └── supabase.ts
│   ├── pages/               # Page components
│   │   ├── Login.tsx
│   │   ├── AuthCallback.tsx
│   │   ├── OrganizationSetup.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Projects.tsx
│   │   ├── CRM.tsx
│   │   ├── Agents.tsx
│   │   ├── MCP.tsx
│   │   ├── Marketing.tsx
│   │   ├── Social.tsx
│   │   ├── Analytics.tsx
│   │   └── Settings.tsx
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles
├── supabase/
│   └── migrations/          # Database migrations
│       ├── 20251114035228_create_multi_tenant_foundation.sql
│       ├── 20251114035325_create_project_management_schema.sql
│       ├── 20251114035415_create_crm_schema.sql
│       ├── 20251114035511_create_ai_agents_mcp_schema.sql
│       ├── 20251114035624_create_marketing_social_media_schema.sql
│       ├── 20251115011435_add_missing_foreign_key_indexes.sql
│       ├── 20251115011556_optimize_rls_policies_auth_functions.sql
│       └── 20251115011625_fix_function_search_path_mutability.sql
├── public/                  # Static assets
├── index.html              # HTML entry point
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
└── tailwind.config.js      # Tailwind CSS configuration
```

## Database Schema

### Core Tables

#### organizations
- Multi-tenant foundation table
- Stores organization information
- Links all other data through foreign keys

#### organization_members
- Maps users to organizations
- Defines user roles (admin, manager, member)
- Controls access permissions

### Project Management

#### projects
- Project tracking with status and metadata
- Links to organizations and team members

#### tasks
- Task management with priorities and assignments
- Status tracking (todo, in_progress, done)
- Due date management

#### task_comments
- Collaborative commenting on tasks
- Mentions support for team collaboration

#### time_entries
- Time tracking for tasks
- Billable/non-billable hours

### CRM

#### contacts
- Customer and lead information
- Contact type classification
- Source tracking

#### deals
- Sales pipeline management
- Stage-based tracking
- Value and probability tracking

#### activities
- Interaction logging (calls, meetings, emails)
- Contact history tracking

#### contact_notes
- Detailed note-taking for contacts
- Chronological record keeping

### AI & MCP

#### ai_agents
- AI agent definitions
- Capability and configuration storage

#### agent_tasks
- Task assignments for AI agents
- Status and result tracking

#### mcp_servers
- MCP server configurations
- Connection and authentication details

#### mcp_tools
- Tool definitions for MCP servers
- Schema and parameter specifications

#### mcp_resources
- Resource management for AI agents
- URI-based resource access

### Marketing

#### campaigns
- Marketing campaign management
- Channel and budget tracking
- Performance metrics

#### email_templates
- Reusable email templates
- Variable substitution support

#### campaign_analytics
- Campaign performance tracking
- Engagement metrics (opens, clicks, conversions)

### Social Media

#### social_accounts
- Multi-platform account management
- Authentication token storage
- Platform-specific configurations

#### social_posts
- Post scheduling and management
- Multi-platform publishing
- Content and media storage

#### post_analytics
- Post performance tracking
- Engagement metrics per platform
- Time-series analytics

## Security Features

### Row Level Security (RLS)
Every table has comprehensive RLS policies that ensure:
- Users can only access data from their organization
- Proper role-based access control
- Secure data isolation between tenants

### Authentication
- Secure password hashing with Supabase Auth
- Session management with automatic token refresh
- Protected routes in the frontend
- Email verification support (configurable)

### Data Integrity
- Foreign key constraints prevent orphaned records
- NOT NULL constraints on critical fields
- Check constraints for data validation
- Indexes for optimized query performance

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- A Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone https://github.com/JarvisJOAT/AI-Operating.git
cd AI-Operating
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the database migrations:
- Open your Supabase project dashboard
- Go to the SQL Editor
- Run each migration file in order from the `supabase/migrations/` directory

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment.

## Usage

### First Time Setup

1. **Sign Up**: Create an account on the login page
2. **Create Organization**: Set up your organization with a name and settings
3. **Invite Team Members**: Add team members and assign roles
4. **Configure Integrations**: Set up MCP servers, social accounts, and other integrations
5. **Start Working**: Begin creating projects, contacts, campaigns, and more

### Key Workflows

#### Project Management
1. Create a project from the Projects page
2. Add tasks to the project
3. Assign tasks to team members
4. Track progress and log time
5. Collaborate through comments

#### CRM
1. Add contacts from the CRM page
2. Create deals and associate with contacts
3. Log activities (calls, meetings, emails)
4. Add notes for future reference
5. Track deal progress through stages

#### AI Agents
1. Set up MCP servers with connection details
2. Create AI agents with specific capabilities
3. Assign tasks to agents
4. Monitor agent performance
5. Review results and logs

#### Marketing
1. Create a campaign with target audience
2. Design email templates
3. Launch the campaign
4. Track analytics (opens, clicks, conversions)
5. Optimize based on performance data

#### Social Media
1. Connect social media accounts
2. Create and schedule posts
3. View content calendar
4. Track engagement metrics
5. Analyze performance across platforms

## API Reference

The application uses Supabase's auto-generated REST API. All API calls are made through the Supabase client with automatic authentication.

### Example API Usage

```typescript
// Fetch projects for the current organization
const { data: projects } = await supabase
  .from('projects')
  .select('*')
  .eq('organization_id', organizationId);

// Create a new task
const { data: task } = await supabase
  .from('tasks')
  .insert({
    project_id: projectId,
    title: 'New Task',
    status: 'todo',
    priority: 'medium'
  })
  .select()
  .single();
```

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues, questions, or contributions, please open an issue on GitHub.

## Roadmap

- [ ] Real-time collaboration features
- [ ] Mobile app (React Native)
- [ ] Advanced AI agent capabilities
- [ ] Workflow automation builder
- [ ] Custom dashboard widgets
- [ ] API webhooks
- [ ] Third-party integrations (Slack, Zapier, etc.)
- [ ] Advanced reporting and analytics
- [ ] White-label support
- [ ] Multi-language support

## Acknowledgments

- Built with [React](https://react.dev/)
- Powered by [Supabase](https://supabase.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons by [Lucide](https://lucide.dev/)
