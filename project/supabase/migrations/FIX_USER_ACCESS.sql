-- ============================================================================
-- FIX USER ACCESS (Dynamic Version)
-- ============================================================================

DO $$
DECLARE
    v_user_id uuid;
    v_user_email text;
BEGIN
    -- 1. Get the first user from auth.users (Assuming single-user dev environment)
    SELECT id, email INTO v_user_id, v_user_email
    FROM auth.users 
    ORDER BY created_at ASC 
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '❌ No users found in auth.users! You need to sign up/login to the app first.';
    END IF;

    RAISE NOTICE 'Found User: % (ID: %)', v_user_email, v_user_id;

    -- 2. Ensure User Profile exists in public schema
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (v_user_id, v_user_email, 'Admin User')
    ON CONFLICT (id) DO NOTHING;

    -- 3. Link User to GAS Organization
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (
        'a0000000-0000-0000-0000-000000000001', -- Canoncial GAS Org ID
        v_user_id,
        'owner'
    )
    ON CONFLICT (organization_id, user_id) DO UPDATE SET
        role = 'owner';

    RAISE NOTICE '✅ SUCCESS: User linked to GAS Organization.';

END $$;
