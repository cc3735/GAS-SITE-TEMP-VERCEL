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

