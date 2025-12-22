-- Phase 0: Mission Control Dashboard Schema

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
