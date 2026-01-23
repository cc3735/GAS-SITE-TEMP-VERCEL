-- ============================================================================
-- SIMPLE DEBUG ACCESS (No Variables, Just Data)
-- ============================================================================

-- 1. List All Users (Copy the 'id' you see here!)
SELECT id, email, created_at, last_sign_in_at 
FROM auth.users;

-- 2. List All Organizations (Verify the ID matches a000...001)
SELECT id, name, slug 
FROM organizations;

-- 3. List All Memberships (Is your user ID linked to the organization ID?)
SELECT 
    u.email, 
    o.name, 
    o.id as org_id, 
    m.user_id, 
    m.role 
FROM organization_members m
JOIN auth.users u ON m.user_id = u.id
JOIN organizations o ON m.organization_id = o.id;

-- 4. Check for 'Orphaned' Memberships (Linked to ID but no User Table match?)
SELECT * FROM organization_members
WHERE organization_id = 'a0000000-0000-0000-0000-000000000001';
