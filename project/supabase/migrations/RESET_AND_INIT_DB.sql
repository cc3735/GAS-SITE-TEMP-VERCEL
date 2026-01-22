-- MASTER RESET SCRIPT
-- WARNING: THIS WILL DELETE ALL DATA IN YOUR DATABASE
-- It drops the 'public' schema and recreates it to ensure a clean slate.

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- Set search path
SET search_path = public, extensions;

-- Begin Combined Migration
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
-- ============================================================================
-- SEED DATA: Default Organization
-- ============================================================================

DO $$
BEGIN
    -- Insert the default GAS Organization if it doesn't exist
    INSERT INTO organizations (id, name, slug, subscription_tier, subscription_status)
    VALUES (
      'a0000000-0000-0000-0000-000000000001',
      'GAS',
      'gas',
      'enterprise',
      'active'
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      slug = EXCLUDED.slug,
      updated_at = now();

    RAISE NOTICE 'Seeded default GAS Organization';
END $$;
/*
  # Project Management Module Schema
  
  ## Overview
  This migration creates the project management system tables supporting hierarchical task organization,
  multiple views (Kanban, List, Timeline, Calendar), custom fields, time tracking, and collaboration.
  
  ## New Tables
  
  ### `projects`
  - `id` (uuid, primary key) - Unique project identifier
  - `organization_id` (uuid, foreign key) - Reference to organizations
  - `workspace_id` (uuid, foreign key) - Reference to workspaces
  - `name` (text) - Project name
  - `description` (text) - Project description
  - `color` (text) - Visual identifier color
  - `icon` (text) - Icon identifier
  - `status` (text) - Project status: active, on_hold, completed, archived
  - `start_date` (date) - Project start date
  - `end_date` (date) - Project end date
  - `owner_id` (uuid) - Project owner user ID
  - `created_by` (uuid) - Creator user ID
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `task_lists`
  - `id` (uuid, primary key) - Unique list identifier
  - `organization_id` (uuid, foreign key) - Reference to organizations
  - `project_id` (uuid, foreign key) - Reference to projects
  - `name` (text) - List name
  - `description` (text) - List description
  - `position` (integer) - Display order position
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `tasks`
  - `id` (uuid, primary key) - Unique task identifier
  - `organization_id` (uuid, foreign key) - Reference to organizations
  - `project_id` (uuid, foreign key) - Reference to projects
  - `list_id` (uuid, foreign key) - Reference to task_lists
  - `parent_task_id` (uuid, foreign key) - Parent task for subtasks
  - `name` (text) - Task name
  - `description` (text) - Task description with rich text
  - `status` (text) - Task status: todo, in_progress, review, done, blocked
  - `priority` (text) - Priority: low, medium, high, urgent
  - `due_date` (timestamptz) - Due date
  - `start_date` (timestamptz) - Start date
  - `estimated_hours` (numeric) - Time estimate
  - `actual_hours` (numeric) - Actual time spent
  - `position` (integer) - Display order position
  - `assigned_to` (uuid[]) - Array of assigned user IDs
  - `tags` (text[]) - Array of tags
  - `custom_fields` (jsonb) - Custom field values
  - `created_by` (uuid) - Creator user ID
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - `completed_at` (timestamptz) - Completion timestamp
  
  ### `task_dependencies`
  - `id` (uuid, primary key) - Unique dependency identifier
  - `organization_id` (uuid, foreign key) - Reference to organizations
  - `task_id` (uuid, foreign key) - Dependent task
  - `depends_on_task_id` (uuid, foreign key) - Task that must be completed first
  - `dependency_type` (text) - Type: blocks, blocked_by
  - `created_at` (timestamptz) - Creation timestamp
  
  ### `task_comments`
  - `id` (uuid, primary key) - Unique comment identifier
  - `organization_id` (uuid, foreign key) - Reference to organizations
  - `task_id` (uuid, foreign key) - Reference to tasks
  - `user_id` (uuid, foreign key) - Comment author
  - `content` (text) - Comment content
  - `mentions` (uuid[]) - Array of mentioned user IDs
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `task_attachments`
  - `id` (uuid, primary key) - Unique attachment identifier
  - `organization_id` (uuid, foreign key) - Reference to organizations
  - `task_id` (uuid, foreign key) - Reference to tasks
  - `user_id` (uuid, foreign key) - Uploader user ID
  - `file_name` (text) - File name
  - `file_url` (text) - Storage URL
  - `file_size` (bigint) - File size in bytes
  - `file_type` (text) - MIME type
  - `created_at` (timestamptz) - Creation timestamp
  
  ### `time_entries`
  - `id` (uuid, primary key) - Unique time entry identifier
  - `organization_id` (uuid, foreign key) - Reference to organizations
  - `task_id` (uuid, foreign key) - Reference to tasks
  - `user_id` (uuid, foreign key) - User who tracked time
  - `description` (text) - Time entry description
  - `hours` (numeric) - Hours tracked
  - `started_at` (timestamptz) - Start time for timer
  - `ended_at` (timestamptz) - End time for timer
  - `is_running` (boolean) - Timer active flag
  - `created_at` (timestamptz) - Creation timestamp
  
  ### `custom_field_definitions`
  - `id` (uuid, primary key) - Unique field definition identifier
  - `organization_id` (uuid, foreign key) - Reference to organizations
  - `project_id` (uuid, foreign key) - Reference to projects (null for global)
  - `name` (text) - Field name
  - `field_type` (text) - Type: text, number, date, dropdown, multi_select, user, checkbox
  - `options` (jsonb) - Options for dropdown/multi_select fields
  - `is_required` (boolean) - Required field flag
  - `created_at` (timestamptz) - Creation timestamp
  
  ## Security
  - Enable RLS on all tables
  - Policies ensure organization-scoped data access
  - Members can view and create tasks
  - Only assigned users and admins can update tasks
  
  ## Important Notes
  1. All tables include organization_id for multi-tenant isolation
  2. Tasks support hierarchical structure through parent_task_id
  3. Custom fields provide flexibility without schema changes
  4. Time tracking supports both manual entry and active timers
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text DEFAULT '#3B82F6',
  icon text DEFAULT 'FolderOpen',
  status text DEFAULT 'active',
  start_date date,
  end_date date,
  owner_id uuid REFERENCES auth.users(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create task lists table
CREATE TABLE IF NOT EXISTS task_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  list_id uuid REFERENCES task_lists(id) ON DELETE SET NULL,
  parent_task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text DEFAULT 'todo',
  priority text DEFAULT 'medium',
  due_date timestamptz,
  start_date timestamptz,
  estimated_hours numeric(10,2),
  actual_hours numeric(10,2) DEFAULT 0,
  position integer DEFAULT 0,
  assigned_to uuid[],
  tags text[],
  custom_fields jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create task dependencies table
CREATE TABLE IF NOT EXISTS task_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  depends_on_task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  dependency_type text DEFAULT 'blocks',
  created_at timestamptz DEFAULT now(),
  UNIQUE(task_id, depends_on_task_id)
);

-- Create task comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  mentions uuid[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create task attachments table
CREATE TABLE IF NOT EXISTS task_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  file_type text,
  created_at timestamptz DEFAULT now()
);

-- Create time entries table
CREATE TABLE IF NOT EXISTS time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description text,
  hours numeric(10,2),
  started_at timestamptz,
  ended_at timestamptz,
  is_running boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create custom field definitions table
CREATE TABLE IF NOT EXISTS custom_field_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  field_type text NOT NULL,
  options jsonb DEFAULT '[]'::jsonb,
  is_required boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_org_id ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_task_lists_project_id ON task_lists(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks(list_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks USING gin(assigned_to);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_task_id ON time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Members can view organization projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = projects.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = projects.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = projects.organization_id
      AND organization_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = projects.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = projects.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for task_lists
CREATE POLICY "Members can view task lists"
  ON task_lists FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = task_lists.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can manage task lists"
  ON task_lists FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = task_lists.organization_id
      AND organization_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = task_lists.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- RLS Policies for tasks
CREATE POLICY "Members can view tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = tasks.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = tasks.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = tasks.organization_id
      AND organization_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = tasks.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = tasks.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- RLS Policies for task_dependencies
CREATE POLICY "Members can manage task dependencies"
  ON task_dependencies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = task_dependencies.organization_id
      AND organization_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = task_dependencies.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- RLS Policies for task_comments
CREATE POLICY "Members can view comments"
  ON task_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = task_comments.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create comments"
  ON task_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = task_comments.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own comments"
  ON task_comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
  ON task_comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for task_attachments
CREATE POLICY "Members can view attachments"
  ON task_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = task_attachments.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create attachments"
  ON task_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = task_attachments.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own attachments"
  ON task_attachments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for time_entries
CREATE POLICY "Members can view time entries"
  ON time_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = time_entries.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own time entries"
  ON time_entries FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for custom_field_definitions
CREATE POLICY "Members can view custom field definitions"
  ON custom_field_definitions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = custom_field_definitions.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage custom field definitions"
  ON custom_field_definitions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = custom_field_definitions.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = custom_field_definitions.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- Triggers for updated_at
DROP TRIGGER IF EXISTS set_updated_at ON projects;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON task_lists;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON task_lists
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON tasks;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON task_comments;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON task_comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();/*
  # Enhance Projects Schema
  
  ## Overview
  Adds budget, priority, and custom_fields to the projects table to support
  richer project data required by the frontend.
  
  ## Changes
  
  ### `projects`
  - Add `budget` (numeric)
  - Add `priority` (text) - default 'medium'
  - Add `custom_fields` (jsonb) - default '{}'
*/

DO $$ 
BEGIN 
    -- Add budget column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'budget') THEN
        ALTER TABLE projects ADD COLUMN budget numeric(15,2);
    END IF;

    -- Add priority column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'priority') THEN
        ALTER TABLE projects ADD COLUMN priority text DEFAULT 'medium';
    END IF;

    -- Add custom_fields column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'custom_fields') THEN
        ALTER TABLE projects ADD COLUMN custom_fields jsonb DEFAULT '{}'::jsonb;
    END IF;
END $$;
-- ============================================================================
-- MISSING TABLES: Forms and Form Submissions
-- ============================================================================

-- Create forms table
CREATE TABLE IF NOT EXISTS forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  fields jsonb DEFAULT '[]'::jsonb,
  settings jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, name)
);

-- Create form_submissions table
CREATE TABLE IF NOT EXISTS form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  form_id uuid REFERENCES forms(id) ON DELETE CASCADE NOT NULL,
  submission_data jsonb NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'new',
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (Organization Restricted)
-- Forms: Only members can view/manage
CREATE POLICY "Members can view forms" ON forms FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Members can manage forms" ON forms FOR ALL USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- Form Submissions: Members view
-- Note: 'Anyone can insert' policy is in the next script (20251227000000_create_contact_form_and_rls.sql)
CREATE POLICY "Members can view submissions" ON form_submissions FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
/*
  # Contact Form Setup Migration
  
  ## Overview
  This migration creates the Contact Form record and ensures proper RLS policies
  for anonymous form submissions from gasweb.info.
  
  ## Changes
  
  1. Creates the GAS organization's Contact Form record in the forms table
  2. Ensures RLS policy exists for anonymous form_submissions inserts
  3. Adds RLS policy for anonymous contact creation (via Edge Function with service role)
  4. Creates website_analytics table for tracking form events (optional)
  
  ## Notes
  - The Edge Function uses service role key, so RLS is bypassed for most operations
  - The anonymous insert policy on form_submissions allows direct client submissions
  - Contact and company creation happens through the Edge Function with service role
*/

-- ============================================================================
-- 1. Create Contact Form record for GAS organization
-- ============================================================================

-- Insert the Contact Form record if it doesn't exist
INSERT INTO forms (organization_id, name, description, is_active, fields, settings)
VALUES (
  'a0000000-0000-0000-0000-000000000001', -- GAS organization ID
  'Contact Form',
  'Main contact form from gasweb.info - captures leads for AI automation consultation requests',
  true,
  '[
    {"name": "name", "type": "text", "label": "Full Name", "required": true},
    {"name": "email", "type": "email", "label": "Email Address", "required": true},
    {"name": "phone", "type": "tel", "label": "Phone Number", "required": false},
    {"name": "company", "type": "text", "label": "Company Name", "required": false},
    {"name": "service", "type": "select", "label": "Service of Interest", "required": true},
    {"name": "painPoint", "type": "select", "label": "Biggest Pain Point", "required": false},
    {"name": "timeline", "type": "select", "label": "Timeline", "required": false},
    {"name": "message", "type": "textarea", "label": "Tell Us About Your Needs", "required": true}
  ]'::jsonb,
  '{
    "successMessage": "Thank you! We will get back to you within 24 hours.",
    "notificationEmails": ["chris@gasweb.info", "jarvis@gasweb.info"],
    "leadScoring": {
      "company": 10,
      "phone": 5,
      "messageLong": 10,
      "serviceNotGeneral": 15,
      "painPoint": 5,
      "timelineImmediate": 20,
      "timelineShortTerm": 10
    }
  }'::jsonb
)
ON CONFLICT (organization_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  fields = EXCLUDED.fields,
  settings = EXCLUDED.settings,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- ============================================================================
-- 2. Ensure RLS policy for anonymous form_submissions inserts
-- ============================================================================

-- Check if the policy exists, if not create it
DO $$ 
BEGIN
    -- Drop existing policy if it exists (to recreate with correct settings)
    DROP POLICY IF EXISTS "Anyone can create form submissions" ON form_submissions;
    
    -- Create policy allowing anonymous and authenticated users to insert
    CREATE POLICY "Anyone can create form submissions"
      ON form_submissions FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
      
    RAISE NOTICE 'Created RLS policy for anonymous form_submissions inserts';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Policy creation failed or already exists: %', SQLERRM;
END $$;

-- ============================================================================
-- 3. Create website_analytics table for form event tracking (optional)
-- ============================================================================

-- Create website_analytics table if it doesn't exist
CREATE TABLE IF NOT EXISTS website_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  properties jsonb DEFAULT '{}'::jsonb,
  page_url text,
  referrer text,
  user_agent text,
  ip_address text,
  session_id text,
  visitor_id text,
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_website_analytics_org_id ON website_analytics(organization_id);
CREATE INDEX IF NOT EXISTS idx_website_analytics_event_type ON website_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_website_analytics_timestamp ON website_analytics(timestamp);

-- Enable RLS on website_analytics
ALTER TABLE website_analytics ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for analytics events
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Anyone can create analytics events" ON website_analytics;
    
    CREATE POLICY "Anyone can create analytics events"
      ON website_analytics FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
      
    RAISE NOTICE 'Created RLS policy for website_analytics inserts';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Policy creation failed or already exists: %', SQLERRM;
END $$;

-- Allow organization members to view analytics
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Members can view analytics" ON website_analytics;
    
    CREATE POLICY "Members can view analytics"
      ON website_analytics FOR SELECT
      TO authenticated
      USING (
        organization_id IN (
          SELECT organization_id 
          FROM organization_members 
          WHERE user_id = auth.uid()
        )
      );
      
    RAISE NOTICE 'Created RLS policy for analytics viewing';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Policy creation failed or already exists: %', SQLERRM;
END $$;

-- ============================================================================
-- 4. Add unique constraint on forms (organization_id, name) if not exists
-- ============================================================================

DO $$ 
BEGIN
    -- Add unique constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'forms_organization_id_name_key'
    ) THEN
        ALTER TABLE forms ADD CONSTRAINT forms_organization_id_name_key 
          UNIQUE (organization_id, name);
        RAISE NOTICE 'Added unique constraint on forms(organization_id, name)';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Constraint creation failed or already exists: %', SQLERRM;
END $$;

-- ============================================================================
-- 5. Verify all required tables exist with correct structure
-- ============================================================================

-- Verify contacts table has required columns
DO $$ 
BEGIN
    -- Check for lead_source column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contacts' AND column_name = 'lead_source'
    ) THEN
        ALTER TABLE contacts ADD COLUMN lead_source text;
        RAISE NOTICE 'Added lead_source column to contacts';
    END IF;
    
    -- Check for lead_status column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contacts' AND column_name = 'lead_status'
    ) THEN
        ALTER TABLE contacts ADD COLUMN lead_status text DEFAULT 'new';
        RAISE NOTICE 'Added lead_status column to contacts';
    END IF;
    
    -- Check for lead_score column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contacts' AND column_name = 'lead_score'
    ) THEN
        ALTER TABLE contacts ADD COLUMN lead_score integer DEFAULT 0;
        RAISE NOTICE 'Added lead_score column to contacts';
    END IF;
    
    -- Check for tags column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contacts' AND column_name = 'tags'
    ) THEN
        ALTER TABLE contacts ADD COLUMN tags text[];
        RAISE NOTICE 'Added tags column to contacts';
    END IF;
END $$;

-- ============================================================================
-- Success message
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Contact Form Setup Migration Complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Created/Updated:';
    RAISE NOTICE '  - Contact Form record for GAS organization';
    RAISE NOTICE '  - RLS policy for anonymous form_submissions';
    RAISE NOTICE '  - website_analytics table';
    RAISE NOTICE '  - RLS policies for analytics';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Set RESEND_API_KEY in Edge Function secrets';
    RAISE NOTICE '  2. Deploy submit-contact-form Edge Function';
    RAISE NOTICE '  3. Test form submission';
    RAISE NOTICE '========================================';
END $$;

