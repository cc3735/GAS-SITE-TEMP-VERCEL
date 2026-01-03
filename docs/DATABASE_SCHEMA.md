# Database Schema Documentation

This document describes the database schema for the AI-Operating platform, including all tables, relationships, and recent additions.

## Overview

The database uses PostgreSQL hosted on Supabase with Row Level Security (RLS) policies for multi-tenant data isolation.

## Core Tables

### organizations

The central table for multi-tenancy.

```sql
CREATE TABLE public.organizations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    is_master boolean DEFAULT false,
    domain text,
    subscription_tier text DEFAULT 'free',
    status text DEFAULT 'active',
    settings jsonb DEFAULT '{}',
    config jsonb DEFAULT '{
        "can_view_unified_inbox": true,
        "can_view_business_apps": true,
        "can_view_ai_agents": true,
        "can_view_mcp_servers": true,
        "can_view_analytics": true,
        "can_view_crm": true,
        "pii_masking_enabled": false
    }',
    domain_auto_join_enabled boolean DEFAULT false,
    allowed_domains text[] DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `name` | text | Organization display name |
| `slug` | text | URL-friendly identifier (unique) |
| `is_master` | boolean | True for GAS master organization |
| `domain` | text | Organization's primary domain |
| `subscription_tier` | text | Subscription level (free, starter, pro, enterprise) |
| `status` | text | Status (active, suspended, deleted) |
| `settings` | jsonb | General settings |
| `config` | jsonb | Visibility configuration for admin impersonation |
| `domain_auto_join_enabled` | boolean | Enable domain-based auto-join |
| `allowed_domains` | text[] | Array of email domains for auto-join |

### organization_members

Links users to organizations with roles.

```sql
CREATE TABLE public.organization_members (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(organization_id, user_id)
);
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `organization_id` | uuid | Foreign key to organizations |
| `user_id` | uuid | Foreign key to auth.users |
| `role` | text | User's role (owner, admin, member, viewer) |

### organization_invitations

Manages email invitations to join organizations.

```sql
CREATE TABLE public.organization_invitations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    invited_email text NOT NULL,
    invitation_token text UNIQUE NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    accepted_at timestamp with time zone,
    accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    CONSTRAINT unique_invitation_per_org_email UNIQUE (organization_id, invited_email)
);
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `organization_id` | uuid | Target organization |
| `invited_email` | text | Email address of invitee |
| `invitation_token` | text | Unique secure token for invitation link |
| `expires_at` | timestamp | Expiration time (default: 7 days) |
| `created_by` | uuid | User who sent the invitation |
| `accepted_at` | timestamp | When invitation was accepted |
| `accepted_by` | uuid | User who accepted |
| `role` | text | Role to assign upon acceptance |

### user_profiles

Extended user information.

```sql
CREATE TABLE public.user_profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name text,
    avatar_url text,
    preferences jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

### mcp_servers

MCP server configurations per organization.

```sql
CREATE TABLE public.mcp_servers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    connection_url text NOT NULL,
    status text DEFAULT 'inactive',
    enabled boolean DEFAULT true,
    configuration jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `organization_id` | uuid | Owning organization |
| `name` | text | Server display name |
| `description` | text | Server description |
| `connection_url` | text | Server connection URL |
| `status` | text | Connection status |
| `enabled` | boolean | Whether server is enabled for org |
| `configuration` | jsonb | Server-specific settings |

## Business App Tables

### business_apps

Catalog of available business applications.

```sql
CREATE TABLE public.business_apps (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    icon_url text,
    category text,
    capabilities jsonb DEFAULT '[]',
    config_schema jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);
```

### app_instances

Deployed app instances per organization.

```sql
CREATE TABLE public.app_instances (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    app_id uuid NOT NULL REFERENCES business_apps(id) ON DELETE CASCADE,
    status text DEFAULT 'provisioning',
    configuration jsonb DEFAULT '{}',
    last_sync_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

## AI Agent Tables

### ai_agents

AI agent configurations.

```sql
CREATE TABLE public.ai_agents (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    type text NOT NULL, -- 'voice', 'chat', 'task'
    status text DEFAULT 'inactive',
    configuration jsonb DEFAULT '{}',
    model text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

## Helper Functions

### get_user_org_ids

Returns organization IDs for a user (bypasses RLS).

```sql
CREATE OR REPLACE FUNCTION public.get_user_org_ids(user_uuid uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.organization_members
  WHERE user_id = user_uuid;
$$;
```

### is_master_admin

Checks if a user is a master admin (bypasses RLS).

```sql
CREATE OR REPLACE FUNCTION public.is_master_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    JOIN public.organizations o ON o.id = om.organization_id
    WHERE om.user_id = user_uuid
      AND o.is_master = true
      AND om.role IN ('owner', 'admin')
  );
$$;
```

## Row Level Security Policies

### organizations

```sql
-- Users can view organizations they're members of
CREATE POLICY "Users can view member organizations"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (id IN (SELECT public.get_user_org_ids(auth.uid())));

-- Master admins can view all organizations
CREATE POLICY "Master admins view all orgs"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (public.is_master_admin(auth.uid()));
```

### organization_members

```sql
-- Users can view their own memberships
CREATE POLICY "Users can view own memberships"
  ON public.organization_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Members can view other members in their organizations
CREATE POLICY "Members can view organization members v2"
  ON public.organization_members FOR SELECT
  TO authenticated
  USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));
```

### organization_invitations

```sql
-- Users can view invitations sent to them
CREATE POLICY "Enable read access for authenticated users to their own invitations"
  ON public.organization_invitations FOR SELECT
  TO authenticated
  USING (invited_email = auth.email());

-- Only master admins can create invitations
CREATE POLICY "Enable insert for authenticated users (master admins)"
  ON public.organization_invitations FOR INSERT
  TO authenticated
  WITH CHECK (public.is_master_admin(auth.uid()));

-- Users can accept their own invitations
CREATE POLICY "Enable update for authenticated users (accept invitation)"
  ON public.organization_invitations FOR UPDATE
  TO authenticated
  USING (invited_email = auth.email())
  WITH CHECK (accepted_at IS NOT NULL AND accepted_by IS NOT NULL);
```

## Indexes

```sql
-- Organization lookups
CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_organizations_domain ON public.organizations(domain);
CREATE INDEX idx_organizations_is_master ON public.organizations(is_master);

-- Membership lookups
CREATE INDEX idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX idx_organization_members_org_id ON public.organization_members(organization_id);

-- Invitation lookups
CREATE INDEX idx_invitations_token ON public.organization_invitations(invitation_token);
CREATE INDEX idx_invitations_email ON public.organization_invitations(invited_email);
CREATE INDEX idx_invitations_org_id ON public.organization_invitations(organization_id);

-- MCP server lookups
CREATE INDEX idx_mcp_servers_org_id ON public.mcp_servers(organization_id);
```

## Migration Order

Run migrations in this order:

1. `20251114035228_create_multi_tenant_foundation.sql` - Base organization tables
2. `20251114035325_create_project_management_schema.sql` - Projects
3. `20251114035415_create_crm_schema.sql` - CRM tables
4. `20251114035511_create_ai_agents_mcp_schema.sql` - AI agents
5. `20251114035624_create_marketing_social_media_schema.sql` - Marketing
6. `20251115011435_add_missing_foreign_key_indexes.sql` - Indexes
7. `20251115011556_optimize_rls_policies_auth_functions.sql` - RLS
8. `20251115011625_fix_function_search_path_mutability.sql` - Functions
9. `20251119000000_enhance_projects_schema.sql` - Project enhancements
10. `20251119010000_create_rag_schema.sql` - Vector search
11. `20251223000000_create_master_org_and_business_apps.sql` - Master org
12. `20251228000000_add_organization_key_and_rls_fix.sql` - RLS fixes
13. `20260102000000_create_organization_invitations.sql` - Invitations
14. `20260102100000_add_domain_auto_join.sql` - Domain auto-join

## Related Documentation

- [API Reference](./integration/API_REFERENCE.md)
- [Integration Guide](./integration/AI_OPERATING_INTEGRATION.md)
- [Admin Dashboard Guide](./admin-training/ADMIN_DASHBOARD_GUIDE.md)

