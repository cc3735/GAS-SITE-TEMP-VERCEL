/*
  # Master Organization & Business Apps Schema
  
  ## Overview
  This migration adds support for:
  - Master organization (GAS) with domain-restricted access
  - Business apps linked to organizations
  - Multi-tenant admin visibility configuration
  - Seeding initial organizations and business apps
  
  ## Changes
  
  ### organizations table additions:
  - `is_master` (boolean) - Whether this is the master/admin organization
  - `domain_restriction` (text) - Email domain required for membership (e.g., 'gasweb.info')
  - `owner_user_id` (uuid) - Primary owner of the organization
  - `config` (jsonb) - Feature visibility flags for admin access
  
  ### New table: business_apps
  - Links business applications to organizations
  - Stores configuration for each app including repo paths
  
  ### projects table additions:
  - `business_app_id` (uuid) - Optional link to a business app
  
  ## Security
  - Master org admins can view all organizations (read-only by default)
  - PII protection through config flags
  - Audit logging table for admin actions
*/

-- =============================================================================
-- 1. ALTER organizations table to add master org support
-- =============================================================================

-- Add new columns to organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS is_master boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS domain_restriction text,
ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS config jsonb DEFAULT '{
  "can_view_unified_inbox": false,
  "can_view_business_apps": true,
  "can_view_ai_agents": true,
  "can_view_mcp_servers": true,
  "can_view_analytics": true,
  "can_view_crm": false,
  "pii_masking_enabled": true
}'::jsonb;

-- Index for master org lookups
CREATE INDEX IF NOT EXISTS idx_organizations_is_master ON organizations(is_master) WHERE is_master = true;

-- =============================================================================
-- 2. Create business_apps table
-- =============================================================================

CREATE TABLE IF NOT EXISTS business_apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  key text NOT NULL, -- e.g., 'keys-open-doors', 'food-truck', 'construction-mgmt'
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  icon text DEFAULT 'Boxes',
  color text DEFAULT '#3B82F6',
  status text DEFAULT 'active', -- active, inactive, development
  config jsonb DEFAULT '{}'::jsonb, -- app-specific configuration
  repo_path text, -- e.g., '@business-apps/keys-open-doors/'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, key)
);

-- Indexes for business_apps
CREATE INDEX IF NOT EXISTS idx_business_apps_org_id ON business_apps(organization_id);
CREATE INDEX IF NOT EXISTS idx_business_apps_key ON business_apps(key);
CREATE INDEX IF NOT EXISTS idx_business_apps_slug ON business_apps(slug);

-- Enable RLS
ALTER TABLE business_apps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business_apps
CREATE POLICY "Members can view organization business apps"
  ON business_apps FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = business_apps.organization_id
      AND organization_members.user_id = auth.uid()
    )
    OR
    -- Master org admins can view all business apps
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN organizations o ON o.id = om.organization_id
      WHERE om.user_id = auth.uid()
      AND o.is_master = true
      AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can manage business apps"
  ON business_apps FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = business_apps.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = business_apps.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at ON business_apps;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON business_apps
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 3. ALTER projects table to link to business_apps
-- =============================================================================

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS business_app_id uuid REFERENCES business_apps(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_business_app_id ON projects(business_app_id);

-- =============================================================================
-- 4. Create admin_audit_logs table for tracking master admin actions
-- =============================================================================

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  master_org_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  target_org_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  action text NOT NULL, -- 'impersonation_start', 'impersonation_end', 'view_section', 'config_change'
  section text, -- 'mission_control', 'unified_inbox', 'business_apps', etc.
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin ON admin_audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target ON admin_audit_logs(target_org_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created ON admin_audit_logs(created_at DESC);

ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only master org admins can view audit logs
CREATE POLICY "Master admins can view audit logs"
  ON admin_audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN organizations o ON o.id = om.organization_id
      WHERE om.user_id = auth.uid()
      AND o.is_master = true
      AND om.role IN ('owner', 'admin')
    )
  );

-- Master org admins can create audit log entries
CREATE POLICY "Master admins can create audit logs"
  ON admin_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN organizations o ON o.id = om.organization_id
      WHERE om.user_id = auth.uid()
      AND o.is_master = true
      AND om.role IN ('owner', 'admin')
    )
  );

-- =============================================================================
-- 5. Update organizations RLS to allow master org access
-- =============================================================================

-- Drop and recreate the select policy to include master org access
DROP POLICY IF EXISTS "Users can view organizations they are members of" ON organizations;

CREATE POLICY "Users can view organizations they are members of or master admin"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    -- Regular member access
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
    )
    OR
    -- Master org admins can view all organizations
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN organizations master_org ON master_org.id = om.organization_id
      WHERE om.user_id = auth.uid()
      AND master_org.is_master = true
      AND om.role IN ('owner', 'admin')
    )
  );

-- =============================================================================
-- 6. Update projects RLS to allow master org access (read-only)
-- =============================================================================

DROP POLICY IF EXISTS "Members can view organization projects" ON projects;

CREATE POLICY "Members or master admins can view organization projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    -- Regular member access
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = projects.organization_id
      AND organization_members.user_id = auth.uid()
    )
    OR
    -- Master org admins can view all projects (read-only)
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN organizations o ON o.id = om.organization_id
      WHERE om.user_id = auth.uid()
      AND o.is_master = true
      AND om.role IN ('owner', 'admin')
    )
  );

-- =============================================================================
-- 7. Create function to check if user is master admin
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_master_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members om
    JOIN organizations o ON o.id = om.organization_id
    WHERE om.user_id = user_uuid
    AND o.is_master = true
    AND om.role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =============================================================================
-- 8. Create function to check domain restriction for organization membership
-- =============================================================================

CREATE OR REPLACE FUNCTION public.check_org_domain_restriction()
RETURNS trigger AS $$
DECLARE
  org_domain text;
  user_email text;
BEGIN
  -- Get the domain restriction for the organization
  SELECT domain_restriction INTO org_domain
  FROM organizations
  WHERE id = NEW.organization_id;
  
  -- If no domain restriction, allow
  IF org_domain IS NULL OR org_domain = '' THEN
    RETURN NEW;
  END IF;
  
  -- Get the user's email
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.user_id;
  
  -- Check if email domain matches
  IF user_email IS NULL OR NOT user_email LIKE '%@' || org_domain THEN
    RAISE EXCEPTION 'User email domain does not match organization domain restriction (%)' , org_domain;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to enforce domain restriction on membership
DROP TRIGGER IF EXISTS enforce_org_domain_restriction ON organization_members;
CREATE TRIGGER enforce_org_domain_restriction
  BEFORE INSERT ON organization_members
  FOR EACH ROW EXECUTE FUNCTION public.check_org_domain_restriction();

-- =============================================================================
-- 9. Seed Master Organization (GAS)
-- =============================================================================

INSERT INTO organizations (
  id,
  name,
  slug,
  is_master,
  domain_restriction,
  subscription_tier,
  subscription_status,
  settings,
  config
) VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'GAS',
  'gas-master',
  true,
  'gasweb.info',
  'enterprise',
  'active',
  '{"theme": "dark", "notifications": true}'::jsonb,
  '{
    "can_view_unified_inbox": false,
    "can_view_business_apps": true,
    "can_view_ai_agents": true,
    "can_view_mcp_servers": true,
    "can_view_analytics": true,
    "can_view_crm": false,
    "pii_masking_enabled": true
  }'::jsonb
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  is_master = EXCLUDED.is_master,
  domain_restriction = EXCLUDED.domain_restriction,
  config = EXCLUDED.config;

-- =============================================================================
-- 10. Seed Tenant Organizations
-- =============================================================================

-- Keys Open Doors
INSERT INTO organizations (
  id,
  name,
  slug,
  is_master,
  subscription_tier,
  subscription_status,
  settings
) VALUES (
  'b0000000-0000-0000-0000-000000000001'::uuid,
  'Keys Open Doors',
  'keys-open-doors',
  false,
  'pro',
  'active',
  '{"theme": "dark"}'::jsonb
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name;

-- This is what I do BBW (Food Truck)
INSERT INTO organizations (
  id,
  name,
  slug,
  is_master,
  subscription_tier,
  subscription_status,
  settings
) VALUES (
  'b0000000-0000-0000-0000-000000000002'::uuid,
  'This is what I do BBW',
  'this-is-what-i-do-bbw',
  false,
  'pro',
  'active',
  '{"theme": "light"}'::jsonb
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name;

-- Concept Containers (Construction Management)
INSERT INTO organizations (
  id,
  name,
  slug,
  is_master,
  subscription_tier,
  subscription_status,
  settings
) VALUES (
  'b0000000-0000-0000-0000-000000000003'::uuid,
  'Concept Containers',
  'concept-containers',
  false,
  'pro',
  'active',
  '{"theme": "dark"}'::jsonb
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name;

-- =============================================================================
-- 11. Seed Business Apps for each organization
-- =============================================================================

-- Keys Open Doors business app
INSERT INTO business_apps (
  id,
  organization_id,
  key,
  name,
  slug,
  description,
  icon,
  color,
  status,
  repo_path,
  config
) VALUES (
  'c0000000-0000-0000-0000-000000000001'::uuid,
  'b0000000-0000-0000-0000-000000000001'::uuid,
  'keys-open-doors',
  'Keys Open Doors',
  'keys-open-doors',
  'Car dealership inventory scraper and social media automation platform',
  'Key',
  '#10B981',
  'active',
  '@business-apps/keys-open-doors/',
  '{
    "features": ["inventory_scraper", "caption_generator", "social_poster", "analytics"],
    "integrations": ["facebook", "instagram", "twitter"]
  }'::jsonb
) ON CONFLICT (organization_id, key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  repo_path = EXCLUDED.repo_path,
  config = EXCLUDED.config;

-- Food Truck business app
INSERT INTO business_apps (
  id,
  organization_id,
  key,
  name,
  slug,
  description,
  icon,
  color,
  status,
  repo_path,
  config
) VALUES (
  'c0000000-0000-0000-0000-000000000002'::uuid,
  'b0000000-0000-0000-0000-000000000002'::uuid,
  'food-truck',
  'Food Truck Operations',
  'food-truck',
  'Voice-enabled food truck ordering system with real-time order management',
  'UtensilsCrossed',
  '#F59E0B',
  'active',
  '@business-apps/food-truck/',
  '{
    "features": ["voice_ordering", "menu_management", "order_tracking", "notifications"],
    "integrations": ["twilio", "stripe", "square"]
  }'::jsonb
) ON CONFLICT (organization_id, key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  repo_path = EXCLUDED.repo_path,
  config = EXCLUDED.config;

-- Construction Management business app
INSERT INTO business_apps (
  id,
  organization_id,
  key,
  name,
  slug,
  description,
  icon,
  color,
  status,
  repo_path,
  config
) VALUES (
  'c0000000-0000-0000-0000-000000000003'::uuid,
  'b0000000-0000-0000-0000-000000000003'::uuid,
  'construction-mgmt',
  'Construction Management',
  'construction-mgmt',
  'Multilingual construction project management with receipt OCR and expense tracking',
  'HardHat',
  '#6366F1',
  'active',
  '@business-apps/construction-mgmt/',
  '{
    "features": ["project_management", "expense_tracking", "receipt_ocr", "translation", "team_messaging"],
    "integrations": ["google_vision", "google_translate"]
  }'::jsonb
) ON CONFLICT (organization_id, key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  repo_path = EXCLUDED.repo_path,
  config = EXCLUDED.config;

-- =============================================================================
-- 12. Create default workspaces for new organizations
-- =============================================================================

-- Workspace for Keys Open Doors
INSERT INTO workspaces (organization_id, name, description, is_default)
SELECT 'b0000000-0000-0000-0000-000000000001'::uuid, 'General', 'Default workspace', true
WHERE NOT EXISTS (
  SELECT 1 FROM workspaces WHERE organization_id = 'b0000000-0000-0000-0000-000000000001'::uuid AND is_default = true
);

-- Workspace for This is what I do BBW
INSERT INTO workspaces (organization_id, name, description, is_default)
SELECT 'b0000000-0000-0000-0000-000000000002'::uuid, 'General', 'Default workspace', true
WHERE NOT EXISTS (
  SELECT 1 FROM workspaces WHERE organization_id = 'b0000000-0000-0000-0000-000000000002'::uuid AND is_default = true
);

-- Workspace for Concept Containers
INSERT INTO workspaces (organization_id, name, description, is_default)
SELECT 'b0000000-0000-0000-0000-000000000003'::uuid, 'General', 'Default workspace', true
WHERE NOT EXISTS (
  SELECT 1 FROM workspaces WHERE organization_id = 'b0000000-0000-0000-0000-000000000003'::uuid AND is_default = true
);

-- Workspace for GAS master org
INSERT INTO workspaces (organization_id, name, description, is_default)
SELECT 'a0000000-0000-0000-0000-000000000001'::uuid, 'Admin', 'Master admin workspace', true
WHERE NOT EXISTS (
  SELECT 1 FROM workspaces WHERE organization_id = 'a0000000-0000-0000-0000-000000000001'::uuid AND is_default = true
);

