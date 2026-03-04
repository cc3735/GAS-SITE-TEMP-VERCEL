-- ============================================================
-- Client Intake & Compliance Checklist Schema
-- ============================================================

-- 1. Add intake_completed flag to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS intake_completed boolean DEFAULT false;

-- Staff users skip intake
UPDATE user_profiles SET intake_completed = true WHERE is_gas_staff = true;

-- 2. Client intake questionnaire responses
CREATE TABLE IF NOT EXISTS client_intake (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Domain
  has_domain boolean,
  domain_name text,
  domain_host text,          -- 'hostinger','godaddy','namecheap','cloudflare','other'
  domain_host_other text,

  -- Business Registration
  is_registered boolean,
  registration_state text,
  entity_type text,          -- 'llc','s_corp','c_corp','partnership','sole_prop'

  -- Business Address
  business_address_line1 text,
  business_address_line2 text,
  business_city text,
  business_state text,
  business_zip text,

  -- Registered Agent
  has_registered_agent boolean,
  agent_name text,
  agent_address_line1 text,
  agent_address_city text,
  agent_address_state text,
  agent_address_zip text,

  -- Operating Agreement
  has_operating_agreement boolean,
  operating_agreement_url text,

  -- Trademark
  has_filed_trademark boolean,
  trademark_status text,     -- 'pending','registered','abandoned','opposed'
  trademark_name text,

  -- Preferred State of Origination
  preferred_state_of_origination text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_intake_user_id ON client_intake(user_id);

ALTER TABLE client_intake ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own intake"
  ON client_intake FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own intake"
  ON client_intake FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own intake"
  ON client_intake FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can view all intakes"
  ON client_intake FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_gas_staff = true
    )
  );

-- 3. Compliance checklist items
CREATE TABLE IF NOT EXISTS compliance_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,    -- 'domain','registration','registered_agent','operating_agreement','trademark'
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',  -- 'pending','in_progress','completed'
  priority integer DEFAULT 0,
  completed_at timestamptz,
  portal_link text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compliance_checklist_user_id ON compliance_checklist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_checklist_status ON compliance_checklist_items(status);

ALTER TABLE compliance_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own checklist"
  ON compliance_checklist_items FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own checklist"
  ON compliance_checklist_items FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checklist"
  ON compliance_checklist_items FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checklist"
  ON compliance_checklist_items FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all checklists"
  ON compliance_checklist_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_gas_staff = true
    )
  );

-- 4. Storage bucket for intake document uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'intake-documents',
  'intake-documents',
  false,
  10485760,
  ARRAY['application/pdf', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload intake documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'intake-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view their intake documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'intake-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
