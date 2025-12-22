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
