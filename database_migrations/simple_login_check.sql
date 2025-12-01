-- ============================================================================
-- SIMPLE LOGIN CHECK - Run each section separately if needed
-- Replace 'admin@mgmacademy.org' with your actual email
-- ============================================================================

-- ============================================================================
-- SECTION 1: Check if auth user exists and get its ID
-- ============================================================================
SELECT 
  id AS auth_user_id,
  email AS auth_email,
  confirmed_at,
  email_confirmed_at,
  last_sign_in_at,
  deleted_at,
  banned_until,
  CASE 
    WHEN deleted_at IS NOT NULL THEN '❌ DELETED'
    WHEN banned_until IS NOT NULL AND banned_until > NOW() THEN '❌ BANNED'
    WHEN confirmed_at IS NULL AND email_confirmed_at IS NULL THEN '⚠️ NOT CONFIRMED'
    ELSE '✅ Auth user OK'
  END AS auth_status
FROM auth.users
WHERE email = 'admin@mgmacademy.org';

-- ============================================================================
-- SECTION 2: Check if public.users row exists for that auth user
-- ============================================================================
-- First, get the auth user ID from section 1, then run this:
-- (Or run both together if you know the email matches)
SELECT 
  u.id AS app_user_id,
  u.email AS app_email,
  u.role,
  u.status,
  u.last_login,
  u.updated_at,
  CASE 
    WHEN u.id IS NULL THEN '❌ public.users row MISSING'
    WHEN u.status IS DISTINCT FROM 'Active' THEN '❌ Status is NOT Active: ' || COALESCE(u.status, 'NULL')
    WHEN u.status = 'Active' THEN '✅ User exists and is Active'
    ELSE '⚠️ Unknown status'
  END AS app_user_status
FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id
WHERE au.email = 'admin@mgmacademy.org';

-- ============================================================================
-- SECTION 3: Check RLS is enabled
-- ============================================================================
SELECT 
  tablename,
  rowsecurity AS rls_enabled,
  CASE WHEN rowsecurity THEN '✅ RLS ON' ELSE '❌ RLS OFF' END AS rls_status
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';

-- ============================================================================
-- SECTION 4: List all RLS policies (this is critical!)
-- ============================================================================
SELECT 
  policyname,
  cmd AS command_type,
  roles,
  qual AS policy_condition
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY policyname;

-- ============================================================================
-- SECTION 5: Test if authenticated user can read users table
-- ============================================================================
-- This simulates what happens during login
-- Replace 'YOUR_AUTH_USER_ID_HERE' with the ID from Section 1
-- You'll need to run this as the authenticated user, but we can check the policies instead

-- ============================================================================
-- SECTION 6: Check for any triggers
-- ============================================================================
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public' 
  AND event_object_table = 'users';

-- ============================================================================
-- SECTION 7: Quick fix - Re-apply simple RLS policies
-- ============================================================================
-- Uncomment and run this if RLS policies are the issue:
/*
-- Drop all existing policies
DROP POLICY IF EXISTS "Super Admin full access" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Authenticated users can insert" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to read users" ON users;
DROP POLICY IF EXISTS "Allow user management for now" ON users;
DROP POLICY IF EXISTS "Allow authenticated read" ON users;
DROP POLICY IF EXISTS "Allow own update" ON users;
DROP POLICY IF EXISTS "Allow own insert" ON users;
DROP POLICY IF EXISTS "Allow authenticated full access" ON users;

-- Create simple policies
CREATE POLICY "Allow authenticated read" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow own update" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow own insert" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow authenticated full access" ON users
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
*/

