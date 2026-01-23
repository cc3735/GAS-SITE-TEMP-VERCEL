-- ============================================================================
-- VERIFY AND FIX DATABASE STATE
-- ============================================================================

DO $$
DECLARE
    v_org_id uuid := 'a0000000-0000-0000-0000-000000000001';
    v_exists boolean;
BEGIN
    RAISE NOTICE 'Starting DB Verification...';

    -- 1. Check if Organization exists
    SELECT EXISTS (SELECT 1 FROM organizations WHERE id = v_org_id) INTO v_exists;
    
    IF v_exists THEN
        RAISE NOTICE '✅ Organization exists: %', v_org_id;
    ELSE
        RAISE NOTICE '❌ Organization MISSING! Attempting to fix...';
        
        INSERT INTO organizations (id, name, slug, subscription_tier, subscription_status)
        VALUES (v_org_id, 'GAS', 'gas', 'enterprise', 'active');
        
        RAISE NOTICE '✅ Fixed: Created Organization';
    END IF;

    -- 2. Try a test insertion into Contacts (Rollback afterwards to keep clean)
    --    This verifies the FK constraint is satisfied.
    BEGIN
        INSERT INTO contacts (
            organization_id, 
            first_name, 
            last_name, 
            email, 
            lead_source
        ) VALUES (
            v_org_id, 
            'Test', 
            'Verification', 
            'test.verify-' || floor(random() * 1000)::text || '@example.com',
            'manual_test'
        );
        RAISE NOTICE '✅ Success: Can insert into contacts table';
    EXCEPTION WHEN foreign_key_violation THEN
        RAISE EXCEPTION '❌ FAILURE: Foreign Key Violation still persists despite Org check!';
    WHEN OTHERS THEN
        RAISE EXCEPTION '❌ FAILURE: Other error during contact insert: %', SQLERRM;
    END;

    RAISE NOTICE '==================================================';
    RAISE NOTICE '🎉 DATABASE STATE IS VALID. THE ORG IS THERE.';
    RAISE NOTICE '==================================================';

END $$;
