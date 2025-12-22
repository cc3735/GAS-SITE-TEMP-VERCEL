-- PARTIAL SETUP: CRM, AI, Mission Control, God View
-- Run this if "organizations" and "users" tables already exist.

-- ==========================================
-- 1. CRM LAYER (Contacts)
-- ==========================================

CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  first_name text,
  last_name text,
  email text,
  phone text,
  company_name text,
  status text DEFAULT 'lead',
  source text,
  tags text[],
  notes text,
  last_contacted_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for Contacts
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Safely create policy for contacts
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contacts' AND policyname = 'Members can view contacts') THEN
        CREATE POLICY "Members can view contacts" ON contacts FOR SELECT USING (
            organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contacts' AND policyname = 'Members can manage contacts') THEN
        CREATE POLICY "Members can manage contacts" ON contacts FOR ALL USING (
            organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
        );
    END IF;
END $$;


-- ==========================================
-- 2. AI AGENT LAYER
-- ==========================================

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

CREATE TABLE IF NOT EXISTS mcp_servers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  server_type text NOT NULL,
  endpoint_url text,
  status text DEFAULT 'active',
  health_status text DEFAULT 'healthy',
  last_health_check timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for AI
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_servers ENABLE ROW LEVEL SECURITY;

-- Safely create policies for AI
DO $$ 
BEGIN
    -- Agents
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_agents' AND policyname = 'Members can view agents') THEN
        CREATE POLICY "Members can view agents" ON ai_agents FOR SELECT USING (
            organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_agents' AND policyname = 'Admins can manage agents') THEN
        CREATE POLICY "Admins can manage agents" ON ai_agents FOR ALL USING (
            organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
        );
    END IF;

    -- Executions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agent_executions' AND policyname = 'Members can view executions') THEN
        CREATE POLICY "Members can view executions" ON agent_executions FOR SELECT USING (
            organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agent_executions' AND policyname = 'System can create executions') THEN
        CREATE POLICY "System can create executions" ON agent_executions FOR INSERT WITH CHECK (
            organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
        );
    END IF;

    -- MCP
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mcp_servers' AND policyname = 'Members can view mcp') THEN
        CREATE POLICY "Members can view mcp" ON mcp_servers FOR SELECT USING (
            organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
        );
    END IF;
END $$;


-- ==========================================
-- 3. MISSION CONTROL & GOD VIEW LAYER
-- ==========================================

-- Customer Profiles (God View)
CREATE TABLE IF NOT EXISTS customer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  primary_email text,
  primary_phone text,
  primary_name text,
  identity_confidence_score numeric(3,2) DEFAULT 1.0,
  lifetime_value numeric(15,2) DEFAULT 0,
  total_orders integer DEFAULT 0,
  last_active_at timestamptz,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Identity Links
CREATE TABLE IF NOT EXISTS identity_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  customer_profile_id uuid REFERENCES customer_profiles(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL,
  platform_id text NOT NULL,
  verification_status text DEFAULT 'verified',
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, platform, platform_id)
);

-- Threads (Mission Control)
CREATE TABLE IF NOT EXISTS communication_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  customer_profile_id uuid REFERENCES customer_profiles(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  thread_type text NOT NULL,
  status text DEFAULT 'open',
  priority text DEFAULT 'medium',
  assigned_agent_id uuid REFERENCES ai_agents(id),
  last_message_at timestamptz,
  unread_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Messages
CREATE TABLE IF NOT EXISTS communication_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  thread_id uuid REFERENCES communication_threads(id) ON DELETE CASCADE NOT NULL,
  channel text NOT NULL,
  direction text NOT NULL,
  sender_type text NOT NULL,
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Agent Performance Logs
CREATE TABLE IF NOT EXISTS agent_performance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  agent_id uuid REFERENCES ai_agents(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL,
  success_rate numeric(5,2),
  avg_response_time_seconds integer,
  logged_at timestamptz DEFAULT now()
);

-- Enable RLS for Mission Control
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance_logs ENABLE ROW LEVEL SECURITY;

-- Safely create policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_profiles' AND policyname = 'Members can view profiles') THEN
        CREATE POLICY "Members can view profiles" ON customer_profiles FOR SELECT USING (
            organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'communication_threads' AND policyname = 'Members can view threads') THEN
        CREATE POLICY "Members can view threads" ON communication_threads FOR SELECT USING (
            organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'communication_messages' AND policyname = 'Members can view messages') THEN
        CREATE POLICY "Members can view messages" ON communication_messages FOR SELECT USING (
            organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
        );
    END IF;
END $$;
