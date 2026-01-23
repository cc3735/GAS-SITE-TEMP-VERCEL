-- ============================================================================
-- DEBUG USER ACCESS AND MEMBERSHIP
-- ============================================================================

-- Use PERFORM to avoid "query has no destination for result data" in PL/pgSQL
-- But since we are running this in the SQL editor, we can use direct SELECTs
-- which returns data to the results grid.

DO $$
DECLARE
    v_user RECORD;
    v_org RECORD;
    v_member RECORD;
BEGIN
    RAISE NOTICE '=== 1. CHECKING USERS ===';
    FOR v_user IN SELECT id, email, created_at FROM auth.users LOOP
        RAISE NOTICE 'User: % | % | Created: %', v_user.email, v_user.id, v_user.created_at;
    END LOOP;

    RAISE NOTICE '=== 2. CHECKING ORGANIZATIONS ===';
    FOR v_org IN SELECT id, name, slug FROM organizations LOOP
        RAISE NOTICE 'Org: % | % | ID: %', v_org.name, v_org.slug, v_org.id;
    END LOOP;

    RAISE NOTICE '=== 3. CHECKING MEMBERSHIPS ===';
    FOR v_member IN 
        SELECT u.email, o.name, m.role, m.organization_id, m.user_id 
        FROM organization_members m
        JOIN auth.users u ON m.user_id = u.id
        JOIN organizations o ON m.organization_id = o.id
    LOOP
        RAISE NOTICE 'Member: % is % of %', v_member.email, v_member.role, v_member.name;
    END LOOP;
    
    -- Check for "Orphaned" members (linked to users that exist but not showing up?)
    RAISE NOTICE '=== 4. CHECKING FOR SPECIFIC GAS ORG MEMBERS ===';
    PERFORM * FROM organization_members WHERE organization_id = 'a0000000-0000-0000-0000-000000000001';
    IF NOT FOUND THEN
        RAISE NOTICE '⚠️ WARNING: No members found for GAS Organization (a000...001)';
    ELSE
         FOR v_member IN SELECT user_id, role FROM organization_members WHERE organization_id = 'a0000000-0000-0000-0000-000000000001' LOOP
            RAISE NOTICE 'Existing Member ID in GAS Org: % (% )', v_member.user_id, v_member.role;
         END LOOP;
    END IF;

END $$;
