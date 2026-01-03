-- Migration: Create Organization Invitations System
-- Purpose: Enable email-based invitations and domain auto-join for organizations
-- Date: January 2, 2026

-- ============================================================
-- 1. Create organization_invitations table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.organization_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  token text UNIQUE NOT NULL,
  invited_by uuid REFERENCES auth.users(id) NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  
  -- Prevent duplicate invitations for same email to same org
  UNIQUE(organization_id, email)
);

-- Add comments for documentation
COMMENT ON TABLE public.organization_invitations IS 'Stores pending and accepted organization invitations';
COMMENT ON COLUMN public.organization_invitations.token IS 'Unique token for invitation acceptance URL';
COMMENT ON COLUMN public.organization_invitations.role IS 'Role to assign when invitation is accepted (owner, admin, member, viewer)';
COMMENT ON COLUMN public.organization_invitations.expires_at IS 'Invitation expiration timestamp (default 7 days)';
COMMENT ON COLUMN public.organization_invitations.accepted_at IS 'Timestamp when invitation was accepted (null if pending)';

-- ============================================================
-- 2. Add domain auto-join fields to organizations table
-- ============================================================
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS domain_auto_join_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS allowed_domains text[];

COMMENT ON COLUMN public.organizations.domain_auto_join_enabled IS 'When true, users with matching email domains can auto-join this organization';
COMMENT ON COLUMN public.organizations.allowed_domains IS 'Array of email domains that can auto-join (e.g., ["company.com", "corp.company.com"])';

-- ============================================================
-- 3. Add is_enabled field to mcp_servers table if not exists
-- ============================================================
ALTER TABLE public.mcp_servers 
  ADD COLUMN IF NOT EXISTS is_enabled boolean DEFAULT true;

COMMENT ON COLUMN public.mcp_servers.is_enabled IS 'Whether the MCP server is enabled for the organization';

-- ============================================================
-- 4. Create indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_organization_invitations_token 
  ON public.organization_invitations(token) 
  WHERE accepted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_organization_invitations_email 
  ON public.organization_invitations(email);

CREATE INDEX IF NOT EXISTS idx_organization_invitations_org_email 
  ON public.organization_invitations(organization_id, email);

CREATE INDEX IF NOT EXISTS idx_organization_invitations_expires 
  ON public.organization_invitations(expires_at) 
  WHERE accepted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_domain_auto_join 
  ON public.organizations(domain_auto_join_enabled) 
  WHERE domain_auto_join_enabled = true;

-- ============================================================
-- 5. Enable RLS on organization_invitations
-- ============================================================
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. Create RLS policies for organization_invitations
-- ============================================================

-- GAS admins can view all invitations
CREATE POLICY "GAS admins can view all invitations"
  ON public.organization_invitations FOR SELECT
  TO authenticated
  USING (
    public.is_master_admin(auth.uid())
  );

-- Organization admins can view their org's invitations
CREATE POLICY "Org admins can view own org invitations"
  ON public.organization_invitations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_invitations.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

-- GAS admins can insert invitations for any org
CREATE POLICY "GAS admins can create invitations"
  ON public.organization_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_master_admin(auth.uid())
  );

-- Organization admins can insert invitations for their org
CREATE POLICY "Org admins can create invitations for own org"
  ON public.organization_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_invitations.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

-- Allow users to view invitations sent to their email (for accepting)
CREATE POLICY "Users can view invitations to their email"
  ON public.organization_invitations FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- GAS admins can update any invitation
CREATE POLICY "GAS admins can update invitations"
  ON public.organization_invitations FOR UPDATE
  TO authenticated
  USING (
    public.is_master_admin(auth.uid())
  );

-- Organization admins can update their org's invitations
CREATE POLICY "Org admins can update own org invitations"
  ON public.organization_invitations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_invitations.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

-- Users can update (accept) invitations sent to them
CREATE POLICY "Users can accept their own invitations"
  ON public.organization_invitations FOR UPDATE
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  WITH CHECK (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND accepted_at IS NOT NULL -- Only allow setting accepted_at
  );

-- GAS admins can delete any invitation
CREATE POLICY "GAS admins can delete invitations"
  ON public.organization_invitations FOR DELETE
  TO authenticated
  USING (
    public.is_master_admin(auth.uid())
  );

-- Organization admins can delete their org's invitations
CREATE POLICY "Org admins can delete own org invitations"
  ON public.organization_invitations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_invitations.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

-- ============================================================
-- 7. Create helper function to generate invitation token
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Generate a URL-safe random token
  RETURN encode(gen_random_bytes(32), 'base64')
    -- Make URL-safe
    || '-' || to_char(now(), 'YYYYMMDDHH24MISS');
END;
$$;

COMMENT ON FUNCTION public.generate_invitation_token() IS 'Generates a secure random token for invitation URLs';

-- ============================================================
-- 8. Create function to check domain auto-join eligibility
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_auto_join_organization(user_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  email_domain text;
  org_id uuid;
BEGIN
  -- Extract domain from email
  email_domain := split_part(user_email, '@', 2);
  
  -- Find organization with matching domain that has auto-join enabled
  SELECT id INTO org_id
  FROM public.organizations
  WHERE domain_auto_join_enabled = true
    AND email_domain = ANY(allowed_domains)
  LIMIT 1;
  
  RETURN org_id;
END;
$$;

COMMENT ON FUNCTION public.get_auto_join_organization(text) IS 'Returns organization ID if user email domain matches auto-join criteria';

-- ============================================================
-- 9. Create function to validate and accept invitation
-- ============================================================
CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv_record RECORD;
  user_email text;
  result jsonb;
BEGIN
  -- Get current user's email
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  
  IF user_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;
  
  -- Find the invitation
  SELECT * INTO inv_record
  FROM public.organization_invitations
  WHERE token = invitation_token
    AND accepted_at IS NULL
    AND expires_at > now();
  
  IF inv_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;
  
  -- Check if email matches
  IF inv_record.email != user_email THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation was sent to a different email address');
  END IF;
  
  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = inv_record.organization_id
      AND user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You are already a member of this organization');
  END IF;
  
  -- Create membership
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (inv_record.organization_id, auth.uid(), inv_record.role);
  
  -- Mark invitation as accepted
  UPDATE public.organization_invitations
  SET accepted_at = now()
  WHERE id = inv_record.id;
  
  -- Get organization name for response
  SELECT jsonb_build_object(
    'success', true,
    'organization_id', inv_record.organization_id,
    'organization_name', o.name,
    'role', inv_record.role
  ) INTO result
  FROM public.organizations o
  WHERE o.id = inv_record.organization_id;
  
  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.accept_invitation(text) IS 'Validates and accepts an invitation, creating organization membership';

-- ============================================================
-- 10. Grant execute permissions on functions
-- ============================================================
GRANT EXECUTE ON FUNCTION public.generate_invitation_token() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_auto_join_organization(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invitation(text) TO authenticated;

