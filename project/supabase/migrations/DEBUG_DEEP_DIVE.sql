-- ============================================================================
-- DB DEEP DIVE DIAGNOSTIC SCRIPT
-- ============================================================================

DO $$
DECLARE
    v_org_count integer;
    v_org_exists boolean;
BEGIN
    RAISE NOTICE '--------------------------------------------------';
    RAISE NOTICE '🔍 STARTING DATABASE INSPECTION';
    RAISE NOTICE '--------------------------------------------------';

    -- 1. Check Tables Existence
    RAISE NOTICE 'Checking relevant tables...';
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
        RAISE NOTICE '✅ Table "organizations" FOUND';
    ELSE
        RAISE NOTICE '❌ Table "organizations" MISSING';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts') THEN
        RAISE NOTICE '✅ Table "contacts" FOUND';
    ELSE
        RAISE NOTICE '❌ Table "contacts" MISSING';
    END IF;

    -- 2. Check Organization Records
    SELECT count(*) INTO v_org_count FROM organizations;
    RAISE NOTICE '📊 Total Organizations count: %', v_org_count;

    -- 3. Check for the Specific GAS Organization
    SELECT EXISTS (SELECT 1 FROM organizations WHERE id = 'a0000000-0000-0000-0000-000000000001') INTO v_org_exists;
    
    IF v_org_exists THEN
        RAISE NOTICE '✅ GAS Organization (a000...001) EXISTS';
    ELSE
        RAISE NOTICE '❌ GAS Organization (a000...001) MISSING';
        
        -- Attempt to Force Insert it right here
        INSERT INTO organizations (id, name, slug, subscription_tier, subscription_status)
        VALUES ('a0000000-0000-0000-0000-000000000001', 'GAS', 'gas', 'enterprise', 'active');
        RAISE NOTICE '🛠️ Attempted to INSERT missing organization...';
    END IF;

    -- 4. Check Foreign Key Constraint Definition
    RAISE NOTICE 'Checking FK constraints on contacts...';
    BEGIN
        PERFORM 1; -- Placeholder
        -- (Optional: Query pg_constraint but complex to print)
    END;

    -- 5. Final Test Insert
    RAISE NOTICE '🧪 Attempting Test Contact Insertion...';
    BEGIN
        INSERT INTO contacts (organization_id, first_name, lead_source)
        VALUES ('a0000000-0000-0000-0000-000000000001', 'Test', 'diagnostic');
        RAISE NOTICE '✅ TEST INSERT SUCCESSFUL (Rolling back now)';
        RAISE EXCEPTION 'Rollback Test'; -- Force rollback so we don't pollute DB
    EXCEPTION 
        WHEN foreign_key_violation THEN
            RAISE NOTICE '❌ TEST INSERT FAILED: Foreign Key Violation';
            RAISE NOTICE '   This means the DB thinks ID a000...001 is NOT in organizations.';
        WHEN OTHERS THEN
            IF SQLERRM = 'Rollback Test' THEN
                RAISE NOTICE '✅ Verification Complete (Clean)';
            ELSE
                RAISE NOTICE '❌ TEST INSERT FAILED: %', SQLERRM;
            END IF;
    END;

END $$;
