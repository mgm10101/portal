-- ============================================================================
-- VERIFY UPDATE POLICY FOR LAST_LOGIN
-- ============================================================================
-- This checks if the RLS policy allows users to update their own last_login
-- ============================================================================

-- Check all UPDATE policies
SELECT 
  policyname,
  cmd AS command_type,
  qual AS using_clause,
  with_check AS with_check_clause,
  CASE 
    WHEN qual::text LIKE '%auth.uid()%id%' OR qual::text LIKE '%id%auth.uid()%' THEN '✅ Should allow own update'
    WHEN qual::text LIKE '%auth.role()%authenticated%' THEN '✅ Allows all authenticated'
    ELSE '⚠️ Check condition: ' || LEFT(qual::text, 100)
  END AS policy_assessment
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users'
  AND cmd = 'UPDATE'
ORDER BY policyname;

-- Test if a user can update their own last_login
-- First, get the current user's auth.uid() (this will be the logged-in user's ID)
SELECT 
  'Current authenticated user ID' AS test_type,
  auth.uid() AS user_id;

-- Then check if that user exists in users table
SELECT 
  'User exists check' AS test_type,
  id,
  email,
  CASE 
    WHEN id = auth.uid() THEN '✅ User ID matches auth.uid()'
    ELSE '❌ User ID does NOT match auth.uid()'
  END AS match_status
FROM public.users
WHERE id = auth.uid()
LIMIT 1;

