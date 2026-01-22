/*
  # Multi-Tenant AI Operating System - Foundation Schema
  
  ## Overview
  This migration creates the foundational multi-tenant database structure for the AI Operating System,
  supporting organizations, users, subscriptions, and core workspace management.
  
  ## New Tables
  
  ### `organizations`
  - `id` (uuid, primary key) - Unique organization identifier
  - `name` (text) - Organization name
  - `slug` (text, unique) - URL-friendly organization identifier
  - `logo_url` (text) - Organization logo
  - `subscription_tier` (text) - Subscription plan: free, pro, enterprise
  - `subscription_status` (text) - Status: active, trial, canceled, expired
  - `trial_ends_at` (timestamptz) - Trial expiration date
  - `settings` (jsonb) - Organization-wide settings and preferences
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `organization_members`
  - `id` (uuid, primary key) - Unique member record identifier
  - `organization_id` (uuid, foreign key) - Reference to organizations
  - `user_id` (uuid, foreign key) - Reference to auth.users
  - `role` (text) - Member role: owner, admin, member, guest
  - `invited_by` (uuid) - User who sent invitation
  - `invited_at` (timestamptz) - Invitation timestamp
  - `joined_at` (timestamptz) - Join timestamp
  - `created_at` (timestamptz) - Creation timestamp
  
  ### `user_profiles`
  - `id` (uuid, primary key) - Matches auth.users.id
  - `email` (text) - User email
  - `full_name` (text) - User full name
  - `avatar_url` (text) - Profile picture URL
  - `timezone` (text) - User timezone
  - `preferences` (jsonb) - User preferences and settings
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `workspaces`
  - `id` (uuid, primary key) - Unique workspace identifier
  - `organization_id` (uuid, foreign key) - Reference to organizations
  - `name` (text) - Workspace name
  - `description` (text) - Workspace description
  - `color` (text) - Visual identifier color
  - `icon` (text) - Icon identifier
  - `is_default` (boolean) - Default workspace flag
  - `created_by` (uuid) - Creator user ID
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ## Security
  - Enable Row Level Security (RLS) on all tables
  - Policies ensure users can only access data from their organizations
  - Organization owners and admins have full access
  - Members have read access and limited write access based on role
  
  ## Important Notes
  1. All tables use RLS to enforce multi-tenant data isolation
  2. Foreign keys ensure referential integrity
  3. Timestamps track creation and modification for audit trails
  4. JSONB fields provide flexibility for evolving requirements
  5. Indexes optimize common query patterns
*/

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  subscription_tier text NOT NULL DEFAULT 'free',
  subscription_status text NOT NULL DEFAULT 'trial',
  trial_ends_at timestamptz DEFAULT (now() + interval '14 days'),
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  timezone text DEFAULT 'UTC',
  preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create organization members table
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'member',
  invited_by uuid REFERENCES auth.users(id),
  invited_at timestamptz DEFAULT now(),
  joined_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Create workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  color text DEFAULT '#3B82F6',
  icon text DEFAULT 'Briefcase',
  is_default boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_org_id ON workspaces(organization_id);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view organizations they are members of"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Organization owners and admins can update"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can view profiles in their organizations"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om1
      WHERE om1.user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM organization_members om2
        WHERE om2.user_id = user_profiles.id
        AND om2.organization_id = om1.organization_id
      )
    )
  );

CREATE POLICY "Users can create their own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for organization_members
CREATE POLICY "Members can view organization members"
  ON organization_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create organization memberships"
  ON organization_members FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_members.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can update memberships"
  ON organization_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can delete memberships"
  ON organization_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for workspaces
CREATE POLICY "Members can view organization workspaces"
  ON workspaces FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = workspaces.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create workspaces"
  ON workspaces FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = workspaces.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update workspaces"
  ON workspaces FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = workspaces.organization_id
      AND organization_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = workspaces.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can delete workspaces"
  ON workspaces FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = workspaces.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS set_updated_at ON organizations;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON user_profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON workspaces;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();/*
  # CRM and Contact Management Schema
  
  ## Overview
  This migration creates the CRM system supporting contacts, companies, deals, pipelines,
  and activity tracking for comprehensive customer relationship management.
  
  ## New Tables
  
  ### `companies`
  - `id` (uuid, primary key) - Unique company identifier
  - `organization_id` (uuid, foreign key) - Reference to organizations
  - `name` (text) - Company name
  - `domain` (text) - Company website domain
  - `industry` (text) - Industry classification
  - `size` (text) - Company size: startup, small, medium, large, enterprise
  - `phone` (text) - Primary phone number
  - `address` (text) - Physical address
  - `city` (text) - City
  - `state` (text) - State/Province
  - `country` (text) - Country
  - `postal_code` (text) - Postal code
  - `website` (text) - Company website URL
  - `linkedin_url` (text) - LinkedIn profile URL
  - `logo_url` (text) - Company logo URL
  - `description` (text) - Company description
  - `tags` (text[]) - Array of tags
  - `custom_fields` (jsonb) - Custom field values
  - `created_by` (uuid) - Creator user ID
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `contacts`
  - `id` (uuid, primary key) - Unique contact identifier
  - `organization_id` (uuid, foreign key) - Reference to organizations
  - `company_id` (uuid, foreign key) - Reference to companies
  - `first_name` (text) - Contact first name
  - `last_name` (text) - Contact last name
  - `email` (text) - Primary email address
  - `phone` (text) - Primary phone number
  - `mobile` (text) - Mobile phone number
  - `title` (text) - Job title
  - `department` (text) - Department
  - `avatar_url` (text) - Profile picture URL
  - `linkedin_url` (text) - LinkedIn profile URL
  - `twitter_handle` (text) - Twitter handle
  - `lead_source` (text) - How contact was acquired
  - `lead_status` (text) - Status: new, qualified, unqualified, contacted
  - `lead_score` (integer) - Lead scoring value
  - `tags` (text[]) - Array of tags
  - `custom_fields` (jsonb) - Custom field values
  - `owner_id` (uuid) - Assigned owner user ID
  - `created_by` (uuid) - Creator user ID
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `pipelines`
  - `id` (uuid, primary key) - Unique pipeline identifier
  - `organization_id` (uuid, foreign key) - Reference to organizations
  - `name` (text) - Pipeline name
  - `description` (text) - Pipeline description
  - `stages` (jsonb) - Array of pipeline stages with order and probability
  - `is_default` (boolean) - Default pipeline flag
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `deals`
  - `id` (uuid, primary key) - Unique deal identifier
  - `organization_id` (uuid, foreign key) - Reference to organizations
  - `pipeline_id` (uuid, foreign key) - Reference to pipelines
  - `contact_id` (uuid, foreign key) - Reference to contacts
  - `company_id` (uuid, foreign key) - Reference to companies
  - `name` (text) - Deal name
  - `value` (numeric) - Deal value/amount
  - `currency` (text) - Currency code
  - `stage` (text) - Current pipeline stage
  - `probability` (integer) - Win probability percentage
  - `expected_close_date` (date) - Expected close date
  - `actual_close_date` (date) - Actual close date
  - `status` (text) - Status: open, won, lost
  - `loss_reason` (text) - Reason if lost
  - `description` (text) - Deal description
  - `tags` (text[]) - Array of tags
  - `custom_fields` (jsonb) - Custom field values
  - `owner_id` (uuid) - Deal owner user ID
  - `created_by` (uuid) - Creator user ID
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `activities`
  - `id` (uuid, primary key) - Unique activity identifier
  - `organization_id` (uuid, foreign key) - Reference to organizations
  - `contact_id` (uuid, foreign key) - Reference to contacts
  - `company_id` (uuid, foreign key) - Reference to companies
  - `deal_id` (uuid, foreign key) - Reference to deals
  - `activity_type` (text) - Type: call, email, meeting, note, task
  - `subject` (text) - Activity subject
  - `description` (text) - Activity description
  - `duration_minutes` (integer) - Activity duration
  - `outcome` (text) - Activity outcome
  - `scheduled_at` (timestamptz) - Scheduled time
  - `completed_at` (timestamptz) - Completion time
  - `is_completed` (boolean) - Completion flag
  - `user_id` (uuid) - User who performed activity
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ## Security
  - Enable RLS on all tables
  - Organization-scoped access policies
  - Members can view and manage CRM data
  - Contact owners have update permissions
  
  ## Important Notes
  1. All tables include organization_id for multi-tenant isolation
  2. Contacts can be linked to companies for B2B relationships
  3. Deals track revenue through customizable pipelines
  4. Activities create comprehensive timeline of interactions
  5. Lead scoring enables automatic qualification
*/

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  domain text,
  industry text,
  size text,
  phone text,
  address text,
  city text,
  state text,
  country text,
  postal_code text,
  website text,
  linkedin_url text,
  logo_url text,
  description text,
  tags text[],
  custom_fields jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text,
  email text,
  phone text,
  mobile text,
  title text,
  department text,
  avatar_url text,
  linkedin_url text,
  twitter_handle text,
  lead_source text,
  lead_status text DEFAULT 'new',
  lead_score integer DEFAULT 0,
  tags text[],
  custom_fields jsonb DEFAULT '{}'::jsonb,
  owner_id uuid REFERENCES auth.users(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create pipelines table
CREATE TABLE IF NOT EXISTS pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  stages jsonb DEFAULT '[]'::jsonb,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create deals table
CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  pipeline_id uuid REFERENCES pipelines(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  name text NOT NULL,
  value numeric(15,2),
  currency text DEFAULT 'USD',
  stage text,
  probability integer DEFAULT 0,
  expected_close_date date,
  actual_close_date date,
  status text DEFAULT 'open',
  loss_reason text,
  description text,
  tags text[],
  custom_fields jsonb DEFAULT '{}'::jsonb,
  owner_id uuid REFERENCES auth.users(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES deals(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  subject text,
  description text,
  duration_minutes integer,
  outcome text,
  scheduled_at timestamptz,
  completed_at timestamptz,
  is_completed boolean DEFAULT false,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_companies_org_id ON companies(organization_id);
CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);
CREATE INDEX IF NOT EXISTS idx_contacts_org_id ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_owner_id ON contacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_pipelines_org_id ON pipelines(organization_id);
CREATE INDEX IF NOT EXISTS idx_deals_org_id ON deals(organization_id);
CREATE INDEX IF NOT EXISTS idx_deals_pipeline_id ON deals(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_deals_contact_id ON deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_deals_company_id ON deals(company_id);
CREATE INDEX IF NOT EXISTS idx_deals_owner_id ON deals(owner_id);
CREATE INDEX IF NOT EXISTS idx_activities_org_id ON activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_activities_contact_id ON activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_activities_deal_id ON activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
CREATE POLICY "Members can view companies"
  ON companies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = companies.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can manage companies"
  ON companies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = companies.organization_id
      AND organization_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = companies.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- RLS Policies for contacts
CREATE POLICY "Members can view contacts"
  ON contacts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = contacts.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create contacts"
  ON contacts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = contacts.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update contacts"
  ON contacts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = contacts.organization_id
      AND organization_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = contacts.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can delete contacts"
  ON contacts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = contacts.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- RLS Policies for pipelines
CREATE POLICY "Members can view pipelines"
  ON pipelines FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = pipelines.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage pipelines"
  ON pipelines FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = pipelines.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = pipelines.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for deals
CREATE POLICY "Members can view deals"
  ON deals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = deals.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create deals"
  ON deals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = deals.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update deals"
  ON deals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = deals.organization_id
      AND organization_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = deals.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can delete deals"
  ON deals FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = deals.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- RLS Policies for activities
CREATE POLICY "Members can view activities"
  ON activities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = activities.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create activities"
  ON activities FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = activities.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own activities"
  ON activities FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own activities"
  ON activities FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Triggers for updated_at
DROP TRIGGER IF EXISTS set_updated_at ON companies;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON contacts;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON pipelines;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON pipelines
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON deals;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON activities;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();/*
  # AI Agents and MCP Server Management Schema
  
  ## Overview
  This migration creates tables for managing AI agents (content generation, voice, operating, social media)
  and MCP server integration (creation, monitoring, tool discovery).
  
  ## New Tables
  
  ### `ai_agents`
  - `id` (uuid, primary key) - Unique agent identifier
  - `organization_id` (uuid, foreign key) - Reference to organizations
  - `name` (text) - Agent name
  - `description` (text) - Agent description
  - `agent_type` (text) - Type: content_generation, voice, operating, social_media, lead_qualification
  - `status` (text) - Status: active, paused, archived
  - `configuration` (jsonb) - Agent configuration including prompts, parameters, tools
  - `knowledge_base` (jsonb) - Company/project specific knowledge
  - `performance_metrics` (jsonb) - Metrics: tokens used, tasks completed, success rate
  - `created_by` (uuid) - Creator user ID
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `agent_executions`
  - `id` (uuid, primary key) - Unique execution identifier
  - `organization_id` (uuid, foreign key) - Reference to organizations
  - `agent_id` (uuid, foreign key) - Reference to ai_agents
  - `execution_type` (text) - Type: manual, scheduled, triggered
  - `input_data` (jsonb) - Execution input
  - `output_data` (jsonb) - Execution output
  - `status` (text) - Status: pending, running, completed, failed
  - `error_message` (text) - Error details if failed
  - `started_at` (timestamptz) - Execution start time
  - `completed_at` (timestamptz) - Execution completion time
  - `duration_ms` (integer) - Duration in milliseconds
  - `tokens_used` (integer) - Tokens consumed
  - `cost` (numeric) - Execution cost
  - `created_at` (timestamptz) - Creation timestamp
  
  ### `agent_workflows`
  - `id` (uuid, primary key) - Unique workflow identifier
  - `organization_id` (uuid, foreign key) - Reference to organizations
  - `name` (text) - Workflow name
  - `description` (text) - Workflow description
  - `workflow_definition` (jsonb) - Workflow steps and agent chain configuration
  - `trigger_type` (text) - Type: manual, schedule, event, webhook
  - `trigger_config` (jsonb) - Trigger configuration
  - `is_active` (boolean) - Active status
  - `created_by` (uuid) - Creator user ID
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `mcp_servers`
  - `id` (uuid, primary key) - Unique server identifier
  - `organization_id` (uuid, foreign key) - Reference to organizations
  - `name` (text) - Server name
  - `description` (text) - Server description
  - `server_type` (text) - Type: hosted, external, custom
  - `endpoint_url` (text) - Server endpoint URL
  - `authentication` (jsonb) - Authentication configuration (encrypted)
  - `capabilities` (jsonb) - Server capabilities: resources, tools, prompts
  - `status` (text) - Status: active, inactive, error
  - `health_status` (text) - Health: healthy, degraded, down
  - `last_health_check` (timestamptz) - Last health check timestamp
  - `version` (text) - Server version
  - `metadata` (jsonb) - Additional server metadata
  - `created_by` (uuid) - Creator user ID
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `mcp_server_tools`
  - `id` (uuid, primary key) - Unique tool identifier
  - `organization_id` (uuid, foreign key) - Reference to organizations
  - `server_id` (uuid, foreign key) - Reference to mcp_servers
  - `tool_name` (text) - Tool name
  - `tool_description` (text) - Tool description
  - `input_schema` (jsonb) - Tool input schema
  - `output_schema` (jsonb) - Tool output schema
  - `examples` (jsonb) - Usage examples
  - `is_enabled` (boolean) - Enabled status
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `mcp_server_executions`
  - `id` (uuid, primary key) - Unique execution identifier
  - `organization_id` (uuid, foreign key) - Reference to organizations
  - `server_id` (uuid, foreign key) - Reference to mcp_servers
  - `tool_name` (text) - Tool executed
  - `input_params` (jsonb) - Input parameters
  - `output_result` (jsonb) - Output result
  - `status` (text) - Status: success, error
  - `error_message` (text) - Error details if failed
  - `duration_ms` (integer) - Duration in milliseconds
  - `executed_by` (uuid) - User who triggered execution
  - `created_at` (timestamptz) - Execution timestamp
  
  ### `voice_agent_calls`
  - `id` (uuid, primary key) - Unique call identifier
  - `organization_id` (uuid, foreign key) - Reference to organizations
  - `agent_id` (uuid, foreign key) - Reference to ai_agents
  - `contact_id` (uuid, foreign key) - Reference to contacts
  - `phone_number` (text) - Phone number called
  - `direction` (text) - Direction: inbound, outbound
  - `status` (text) - Status: queued, ringing, in_progress, completed, failed
  - `duration_seconds` (integer) - Call duration
  - `recording_url` (text) - Call recording URL
  - `transcription` (text) - Call transcription
  - `sentiment_analysis` (jsonb) - Sentiment analysis results
  - `outcome` (text) - Call outcome
  - `metadata` (jsonb) - Additional call metadata
  - `started_at` (timestamptz) - Call start time
  - `ended_at` (timestamptz) - Call end time
  - `created_at` (timestamptz) - Creation timestamp
  
  ## Security
  - Enable RLS on all tables
  - Organization-scoped access policies
  - Only admins can create and configure agents and MCP servers
  - All members can view agents and executions
  
  ## Important Notes
  1. AI agents support multiple types for different use cases
  2. Agent workflows enable chaining multiple agents
  3. MCP servers can be hosted, external, or custom-built
  4. Tool discovery automatically catalogs server capabilities
  5. Voice agent calls are tracked with full transcription and analytics
*/

-- Create ai_agents table
CREATE TABLE IF NOT EXISTS ai_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  agent_type text NOT NULL,
  status text DEFAULT 'active',
  configuration jsonb DEFAULT '{}'::jsonb,
  knowledge_base jsonb DEFAULT '{}'::jsonb,
  performance_metrics jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create agent_executions table
CREATE TABLE IF NOT EXISTS agent_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  agent_id uuid REFERENCES ai_agents(id) ON DELETE CASCADE NOT NULL,
  execution_type text DEFAULT 'manual',
  input_data jsonb,
  output_data jsonb,
  status text DEFAULT 'pending',
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  duration_ms integer,
  tokens_used integer,
  cost numeric(10,4),
  created_at timestamptz DEFAULT now()
);

-- Create agent_workflows table
CREATE TABLE IF NOT EXISTS agent_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  workflow_definition jsonb DEFAULT '[]'::jsonb,
  trigger_type text DEFAULT 'manual',
  trigger_config jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create mcp_servers table
CREATE TABLE IF NOT EXISTS mcp_servers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  server_type text NOT NULL,
  endpoint_url text,
  authentication jsonb DEFAULT '{}'::jsonb,
  capabilities jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'active',
  health_status text DEFAULT 'healthy',
  last_health_check timestamptz,
  version text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create mcp_server_tools table
CREATE TABLE IF NOT EXISTS mcp_server_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  server_id uuid REFERENCES mcp_servers(id) ON DELETE CASCADE NOT NULL,
  tool_name text NOT NULL,
  tool_description text,
  input_schema jsonb DEFAULT '{}'::jsonb,
  output_schema jsonb DEFAULT '{}'::jsonb,
  examples jsonb DEFAULT '[]'::jsonb,
  is_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create mcp_server_executions table
CREATE TABLE IF NOT EXISTS mcp_server_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  server_id uuid REFERENCES mcp_servers(id) ON DELETE CASCADE NOT NULL,
  tool_name text NOT NULL,
  input_params jsonb,
  output_result jsonb,
  status text DEFAULT 'success',
  error_message text,
  duration_ms integer,
  executed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Create voice_agent_calls table
CREATE TABLE IF NOT EXISTS voice_agent_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  agent_id uuid REFERENCES ai_agents(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  phone_number text NOT NULL,
  direction text NOT NULL,
  status text DEFAULT 'queued',
  duration_seconds integer,
  recording_url text,
  transcription text,
  sentiment_analysis jsonb,
  outcome text,
  metadata jsonb DEFAULT '{}'::jsonb,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_agents_org_id ON ai_agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_type ON ai_agents(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_executions_org_id ON agent_executions(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_agent_id ON agent_executions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_workflows_org_id ON agent_workflows(organization_id);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_org_id ON mcp_servers(organization_id);
CREATE INDEX IF NOT EXISTS idx_mcp_server_tools_server_id ON mcp_server_tools(server_id);
CREATE INDEX IF NOT EXISTS idx_mcp_server_executions_server_id ON mcp_server_executions(server_id);
CREATE INDEX IF NOT EXISTS idx_voice_agent_calls_org_id ON voice_agent_calls(organization_id);
CREATE INDEX IF NOT EXISTS idx_voice_agent_calls_agent_id ON voice_agent_calls(agent_id);
CREATE INDEX IF NOT EXISTS idx_voice_agent_calls_contact_id ON voice_agent_calls(contact_id);

-- Enable RLS
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_server_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_server_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_agent_calls ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_agents
CREATE POLICY "Members can view agents"
  ON ai_agents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = ai_agents.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage agents"
  ON ai_agents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = ai_agents.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = ai_agents.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for agent_executions
CREATE POLICY "Members can view agent executions"
  ON agent_executions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = agent_executions.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create agent executions"
  ON agent_executions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = agent_executions.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- RLS Policies for agent_workflows
CREATE POLICY "Members can view workflows"
  ON agent_workflows FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = agent_workflows.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage workflows"
  ON agent_workflows FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = agent_workflows.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = agent_workflows.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for mcp_servers
CREATE POLICY "Members can view MCP servers"
  ON mcp_servers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = mcp_servers.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage MCP servers"
  ON mcp_servers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = mcp_servers.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = mcp_servers.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for mcp_server_tools
CREATE POLICY "Members can view MCP server tools"
  ON mcp_server_tools FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = mcp_server_tools.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage MCP server tools"
  ON mcp_server_tools FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = mcp_server_tools.organization_id
      AND organization_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = mcp_server_tools.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- RLS Policies for mcp_server_executions
CREATE POLICY "Members can view MCP executions"
  ON mcp_server_executions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = mcp_server_executions.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create MCP executions"
  ON mcp_server_executions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = mcp_server_executions.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- RLS Policies for voice_agent_calls
CREATE POLICY "Members can view voice calls"
  ON voice_agent_calls FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = voice_agent_calls.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage voice calls"
  ON voice_agent_calls FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = voice_agent_calls.organization_id
      AND organization_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = voice_agent_calls.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Triggers for updated_at
DROP TRIGGER IF EXISTS set_updated_at ON ai_agents;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON ai_agents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON agent_workflows;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON agent_workflows
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON mcp_servers;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON mcp_servers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON mcp_server_tools;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON mcp_server_tools
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();-- Phase 0: Mission Control Dashboard Schema

-- 1. communication_threads
CREATE TABLE IF NOT EXISTS communication_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  customer_profile_id uuid, -- Foreign key added later after customer_profiles is created
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  thread_type text NOT NULL, -- 'email', 'sms', 'social', 'voice', 'mixed'
  subject text,
  priority text DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  status text DEFAULT 'open', -- 'open', 'assigned', 'resolved', 'archived'
  assigned_to uuid REFERENCES auth.users(id),
  assigned_agent_id uuid REFERENCES ai_agents(id),
  human_online_status boolean DEFAULT false, -- For handoff logic
  escalation_queue boolean DEFAULT false, -- For offline escalations
  handoff_summary text, -- AI-generated summary for seamless handoff
  handoff_timestamp timestamptz,
  last_message_at timestamptz,
  unread_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. communication_messages
CREATE TABLE IF NOT EXISTS communication_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  thread_id uuid REFERENCES communication_threads(id) ON DELETE CASCADE NOT NULL,
  channel text NOT NULL, -- 'email', 'sms', 'instagram', 'facebook', 'voice'
  direction text NOT NULL, -- 'inbound', 'outbound'
  sender_type text NOT NULL, -- 'customer', 'ai_agent', 'human'
  sender_id uuid, -- customer_profile_id, agent_id, or user_id
  recipient_id uuid,
  subject text,
  body text NOT NULL,
  body_html text,
  attachments jsonb DEFAULT '[]'::jsonb,
  sentiment_score numeric(3,1), -- -10 to 10
  sentiment_label text, -- 'positive', 'neutral', 'negative'
  priority text DEFAULT 'medium',
  is_read boolean DEFAULT false,
  read_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 3. agent_performance_logs
CREATE TABLE IF NOT EXISTS agent_performance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  agent_id uuid REFERENCES ai_agents(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL, -- 'active', 'idle', 'processing', 'paused', 'error', 'offline'
  status_context text, -- e.g., 'handling 3 conversations', 'API timeout'
  active_conversations integer DEFAULT 0,
  current_task text,
  success_rate numeric(5,2), -- Percentage
  avg_response_time_seconds integer,
  cost_per_interaction numeric(10,4),
  customer_satisfaction_score numeric(3,1), -- 0-10
  tasks_completed_24h integer DEFAULT 0,
  tokens_used_24h integer DEFAULT 0,
  errors_count_24h integer DEFAULT 0,
  last_activity_at timestamptz,
  logged_at timestamptz DEFAULT now()
);

-- 4. agent_transcripts
CREATE TABLE IF NOT EXISTS agent_transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  agent_id uuid REFERENCES ai_agents(id) ON DELETE CASCADE NOT NULL,
  thread_id uuid REFERENCES communication_threads(id) ON DELETE SET NULL,
  conversation_snippet text NOT NULL, -- Last 2-3 messages
  full_transcript_url text, -- Link to full conversation if needed
  sentiment_analysis jsonb,
  intervention_required boolean DEFAULT false,
  human_took_over boolean DEFAULT false,
  takeover_timestamp timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 5. alert_rules
CREATE TABLE IF NOT EXISTS alert_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  rule_type text NOT NULL, -- 'agent_failure', 'high_priority', 'performance_threshold', 'intervention_needed'
  conditions jsonb NOT NULL, -- Threshold values, criteria
  channels text[] DEFAULT ARRAY['dashboard'], -- 'dashboard', 'email', 'sms'
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. alert_history
CREATE TABLE IF NOT EXISTS alert_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  alert_rule_id uuid REFERENCES alert_rules(id) ON DELETE SET NULL,
  alert_type text NOT NULL,
  severity text DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  title text NOT NULL,
  message text NOT NULL,
  context jsonb DEFAULT '{}'::jsonb,
  is_acknowledged boolean DEFAULT false,
  acknowledged_by uuid REFERENCES auth.users(id),
  acknowledged_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 7. handoff_events
CREATE TABLE IF NOT EXISTS handoff_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  thread_id uuid REFERENCES communication_threads(id) ON DELETE CASCADE NOT NULL,
  agent_id uuid REFERENCES ai_agents(id) ON DELETE SET NULL,
  from_type text NOT NULL, -- 'ai_agent', 'human'
  to_type text NOT NULL, -- 'ai_agent', 'human'
  to_user_id uuid REFERENCES auth.users(id),
  handoff_reason text, -- 'escalation', 'complex_query', 'agent_request'
  summary text, -- AI-generated context summary
  handoff_mode text NOT NULL, -- 'escalation' (offline), 'seamless' (online)
  status text DEFAULT 'pending', -- 'pending', 'accepted', 'completed', 'resumed'
  resumed_at timestamptz, -- When agent resumed after human handoff
  created_at timestamptz DEFAULT now()
);

-- 8. human_online_status
CREATE TABLE IF NOT EXISTS human_online_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_online boolean DEFAULT false,
  last_seen_at timestamptz DEFAULT now(),
  status_message text,
  available_for_handoff boolean DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_threads_status ON communication_threads(status, priority);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON communication_messages(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent_time ON agent_performance_logs(agent_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_transcripts_agent ON agent_transcripts(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_org_unacknowledged ON alert_history(organization_id, is_acknowledged, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_handoff_events_thread ON handoff_events(thread_id, created_at DESC);

-- Enable RLS
ALTER TABLE communication_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE handoff_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_online_status ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (Organization Scoped)
CREATE POLICY "Users can view threads in their organization" ON communication_threads FOR SELECT USING (organization_id = (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can update threads in their organization" ON communication_threads FOR UPDATE USING (organization_id = (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert threads in their organization" ON communication_threads FOR INSERT WITH CHECK (organization_id = (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view messages in their organization" ON communication_messages FOR SELECT USING (organization_id = (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert messages in their organization" ON communication_messages FOR INSERT WITH CHECK (organization_id = (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view agent logs" ON agent_performance_logs FOR SELECT USING (organization_id = (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can view agent transcripts" ON agent_transcripts FOR SELECT USING (organization_id = (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view alert rules" ON alert_rules FOR SELECT USING (organization_id = (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage alert rules" ON alert_rules FOR ALL USING (organization_id = (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view alert history" ON alert_history FOR SELECT USING (organization_id = (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can update alert history" ON alert_history FOR UPDATE USING (organization_id = (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view handoff events" ON handoff_events FOR SELECT USING (organization_id = (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can update handoff events" ON handoff_events FOR UPDATE USING (organization_id = (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view human status" ON human_online_status FOR SELECT USING (organization_id = (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can update their own status" ON human_online_status FOR ALL USING (user_id = auth.uid() AND organization_id = (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
-- Phase 1: God View Identity Layer Schema

-- 1. customer_profiles
CREATE TABLE IF NOT EXISTS customer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  -- Unified identity fields
  primary_email text,
  primary_phone text,
  primary_name text, -- Full name
  identity_confidence_score numeric(3,2) DEFAULT 1.0, -- 0.0 to 1.0
  -- Aggregated data
  lifetime_value numeric(15,2) DEFAULT 0,
  total_orders integer DEFAULT 0,
  last_active_at timestamptz,
  status text DEFAULT 'active', -- 'active', 'inactive', 'lost', 'converted'
  tags text[],
  custom_fields jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Update communication_threads foreign key
ALTER TABLE communication_threads 
ADD CONSTRAINT fk_communication_threads_customer_profile 
FOREIGN KEY (customer_profile_id) REFERENCES customer_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_threads_org_customer ON communication_threads(organization_id, customer_profile_id);

-- 2. identity_links
CREATE TABLE IF NOT EXISTS identity_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  customer_profile_id uuid REFERENCES customer_profiles(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL, -- 'shopify', 'instagram', 'email', 'phone', 'facebook', etc.
  platform_id text NOT NULL, -- Platform-specific ID
  platform_username text, -- e.g., Instagram handle
  verification_status text DEFAULT 'verified', -- 'verified', 'unverified', 'pending'
  metadata jsonb DEFAULT '{}'::jsonb,
  first_seen_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, platform, platform_id)
);

-- 3. customer_journey_events
CREATE TABLE IF NOT EXISTS customer_journey_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  customer_profile_id uuid REFERENCES customer_profiles(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL, -- 'ad_click', 'form_submit', 'cart_add', 'cart_abandon', 'purchase', 'email_open', 'sms_sent', etc.
  platform text NOT NULL, -- 'shopify', 'instagram', 'email', 'website', etc.
  platform_event_id text, -- Link to source event
  title text NOT NULL, -- Human-readable title
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  value numeric(15,2), -- Monetary value if applicable
  occurred_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 4. agent_interaction_logs
CREATE TABLE IF NOT EXISTS agent_interaction_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  customer_profile_id uuid REFERENCES customer_profiles(id) ON DELETE CASCADE NOT NULL,
  agent_id uuid REFERENCES ai_agents(id) ON DELETE SET NULL,
  interaction_type text NOT NULL, -- 'voice_call', 'chat', 'email', 'sms'
  thread_id uuid REFERENCES communication_threads(id) ON DELETE SET NULL,
  -- voice_call_id uuid REFERENCES voice_agent_calls(id) ON DELETE SET NULL, -- Assuming voice_agent_calls exists or will exist
  conversation_snippet text,
  full_transcript_url text,
  sentiment_score numeric(3,1), -- -10 to 10
  sentiment_label text, -- 'positive', 'neutral', 'negative'
  human_intervention_required boolean DEFAULT false,
  human_intervened boolean DEFAULT false,
  intervention_reason text,
  outcome text, -- 'resolved', 'escalated', 'converted', 'lost'
  duration_seconds integer,
  tokens_used integer,
  cost numeric(10,4),
  started_at timestamptz NOT NULL,
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customer_profiles_org_email ON customer_profiles(organization_id, primary_email);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_org_phone ON customer_profiles(organization_id, primary_phone);
CREATE INDEX IF NOT EXISTS idx_identity_links_profile ON identity_links(customer_profile_id);
CREATE INDEX IF NOT EXISTS idx_identity_links_platform ON identity_links(platform, platform_id);
CREATE INDEX IF NOT EXISTS idx_journey_events_profile_time ON customer_journey_events(customer_profile_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_interactions_profile ON agent_interaction_logs(customer_profile_id, started_at DESC);

-- Enable RLS
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_journey_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_interaction_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view customer profiles" ON customer_profiles FOR SELECT USING (organization_id = (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage customer profiles" ON customer_profiles FOR ALL USING (organization_id = (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view identity links" ON identity_links FOR SELECT USING (organization_id = (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage identity links" ON identity_links FOR ALL USING (organization_id = (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view journey events" ON customer_journey_events FOR SELECT USING (organization_id = (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert journey events" ON customer_journey_events FOR INSERT WITH CHECK (organization_id = (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view agent interactions" ON agent_interaction_logs FOR SELECT USING (organization_id = (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
