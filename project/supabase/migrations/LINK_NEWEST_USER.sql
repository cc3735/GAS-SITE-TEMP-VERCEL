-- ============================================================================
-- LINK NEWEST USER TO ORGANIZATION (The "Just Work" Fix)
-- ============================================================================

DO $$
DECLARE
    v_newest_user_id uuid;
    v_newest_user_email text;
BEGIN
    -- 1. Get the LATEST created user (This will catch a fresh signup)
    SELECT id, email INTO v_newest_user_id, v_newest_user_email
    FROM auth.users 
    ORDER BY created_at DESC 
    LIMIT 1;

    IF v_newest_user_id IS NULL THEN
        RAISE EXCEPTION '❌ No users found! Please Sign Up on the localhost app first.';
    END IF;

    RAISE NOTICE 'Found Newest User: % (ID: %)', v_newest_user_email, v_newest_user_id;

    -- 2. Ensure Profile Exists
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (v_newest_user_id, v_newest_user_email, 'Admin User')
    ON CONFLICT (id) DO NOTHING;

    -- 3. Link them to GAS Organization
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (
        'a0000000-0000-0000-0000-000000000001', 
        v_newest_user_id, 
        'owner'
    )
    ON CONFLICT (organization_id, user_id) DO UPDATE SET
        role = 'owner';

    RAISE NOTICE '✅ SUCCESS: User % is now Owner of GAS Organization.', v_newest_user_email;

END $$;
