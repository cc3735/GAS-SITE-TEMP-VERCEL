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
