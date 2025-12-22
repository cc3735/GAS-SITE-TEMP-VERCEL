-- Phase 2: Intake & Nudge Engine Schema

-- 1. lead_intake_events
-- Captures raw events from landing pages, forms, webhooks
CREATE TABLE IF NOT EXISTS lead_intake_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  customer_profile_id uuid REFERENCES customer_profiles(id) ON DELETE SET NULL,
  event_type text NOT NULL, -- 'form_submit', 'cart_add', 'cart_abandon', 'page_view', 'button_click'
  source text NOT NULL, -- 'shopify', 'website', 'landing_page', 'form'
  source_event_id text, -- External event ID
  intent_category text, -- 'high_value', 'window_shopper', 'engaged', 'browsing'
  intent_score integer, -- 0-100
  event_data jsonb NOT NULL, -- Full event payload
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 2. lead_states
-- Tracks the current status and engagement level of a lead
CREATE TABLE IF NOT EXISTS lead_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  customer_profile_id uuid REFERENCES customer_profiles(id) ON DELETE CASCADE NOT NULL,
  current_state text NOT NULL, -- 'new', 'engaged', 'ghosting', 'converted', 'lost'
  previous_state text,
  state_transitions jsonb DEFAULT '[]'::jsonb, -- Array of {state, timestamp, reason}
  last_activity_at timestamptz,
  engagement_score integer DEFAULT 0, -- 0-100
  ghosting_started_at timestamptz, -- When entered ghosting state
  nudge_attempts integer DEFAULT 0,
  max_nudge_attempts integer DEFAULT 3,
  context_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, customer_profile_id)
);

-- 3. nudge_campaigns
-- Configuration for automated re-engagement campaigns
CREATE TABLE IF NOT EXISTS nudge_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  trigger_state text NOT NULL, -- 'ghosting', 'abandoned_cart', etc.
  delay_hours integer NOT NULL, -- Configurable delay before nudge
  channel text NOT NULL, -- 'email', 'sms', 'both'
  content_template jsonb NOT NULL, -- Email/SMS templates
  sequence_steps jsonb DEFAULT '[]'::jsonb, -- Multi-stage sequence
  is_active boolean DEFAULT true,
  total_sent integer DEFAULT 0,
  total_converted integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. nudge_executions
-- Log of actual nudges sent
CREATE TABLE IF NOT EXISTS nudge_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  campaign_id uuid REFERENCES nudge_campaigns(id) ON DELETE SET NULL,
  customer_profile_id uuid REFERENCES customer_profiles(id) ON DELETE CASCADE NOT NULL,
  lead_state_id uuid REFERENCES lead_states(id) ON DELETE CASCADE NOT NULL,
  channel text NOT NULL, -- 'email', 'sms'
  content text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  responded_at timestamptz,
  converted_at timestamptz,
  status text DEFAULT 'sent', -- 'sent', 'delivered', 'opened', 'clicked', 'responded', 'converted', 'failed'
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lead_intake_events_profile ON lead_intake_events(customer_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_states_state ON lead_states(current_state, ghosting_started_at);
CREATE INDEX IF NOT EXISTS idx_nudge_executions_profile ON nudge_executions(customer_profile_id, sent_at DESC);

-- Enable RLS
ALTER TABLE lead_intake_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudge_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudge_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Intake Events
CREATE POLICY "Members can view intake events" ON lead_intake_events FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
CREATE POLICY "System can insert intake events" ON lead_intake_events FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);

-- Lead States
CREATE POLICY "Members can view lead states" ON lead_states FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
CREATE POLICY "Members can update lead states" ON lead_states FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);

-- Nudge Campaigns
CREATE POLICY "Members can view nudge campaigns" ON nudge_campaigns FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can manage nudge campaigns" ON nudge_campaigns FOR ALL USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);

-- Nudge Executions
CREATE POLICY "Members can view nudge executions" ON nudge_executions FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
