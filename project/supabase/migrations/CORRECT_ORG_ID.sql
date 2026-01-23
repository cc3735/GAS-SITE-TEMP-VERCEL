-- ============================================================================
-- CORRECT ORGANIZATION ID MISMATCH (Plain SQL Version)
-- ============================================================================

-- 1. Remove any organization that claims the 'gas' slug but isn't our target ID
--    (This cleans up the "random ID" version that was auto-created)
DELETE FROM organizations 
WHERE slug = 'gas' 
AND id != 'a0000000-0000-0000-0000-000000000001';

-- 2. Insert or Update the Canonical Organization Record
INSERT INTO organizations (id, name, slug, subscription_tier, subscription_status)
VALUES (
    'a0000000-0000-0000-0000-000000000001', 
    'GAS', 
    'gas', 
    'enterprise', 
    'active'
)
ON CONFLICT (id) DO UPDATE SET
    slug = 'gas',
    name = 'GAS';
    
-- 3. Verify the result
SELECT id, name, slug FROM organizations WHERE id = 'a0000000-0000-0000-0000-000000000001';
