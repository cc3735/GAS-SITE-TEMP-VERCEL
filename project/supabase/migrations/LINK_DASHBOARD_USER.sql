-- ============================================================================
-- LINK DASHBOARD USER TO ORGANIZATION
-- ============================================================================

-- The user ID we saw in your error logs was: 9195d7c9-e8e2-4c02-8fa1-7efe94a46842
-- But the database currently has owner: 040e0542-7013-420c-80f8-cd7b77b9665f

-- This script adds the "Dashboard User" (you) to the organization.

-- 1. Ensure Profile Exists for the Dashboard User
INSERT INTO public.user_profiles (id, email, full_name)
VALUES (
    '9195d7c9-e8e2-4c02-8fa1-7efe94a46842', 
    'user@example.com', 
    'Dashboard User'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Link the Dashboard User to the Organization
INSERT INTO public.organization_members (organization_id, user_id, role)
VALUES (
    'a0000000-0000-0000-0000-000000000001', 
    '9195d7c9-e8e2-4c02-8fa1-7efe94a46842', 
    'owner'
)
ON CONFLICT (organization_id, user_id) DO UPDATE SET
    role = 'owner';

-- 3. Verify Links (Should now see TWO members)
SELECT * FROM organization_members 
WHERE organization_id = 'a0000000-0000-0000-0000-000000000001';
