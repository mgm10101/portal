-- ============================================================================
-- TEST LAST_LOGIN UPDATE
-- ============================================================================
-- This script helps diagnose why last_login updates might be failing
-- ============================================================================

-- 1. Check current last_login values
SELECT 
  id,
  email,
  last_login,
  CASE 
    WHEN last_login IS NULL THEN '❌ NULL - never updated'
    ELSE '✅ Has value: ' || last_login::text
  END AS status
FROM public.users
ORDER BY created_at DESC;

-- 2. Check RLS policies for UPDATE
SELECT 
  policyname,
  cmd AS command_type,
  qual AS policy_condition,
  with_check,
  CASE 
    WHEN qual::text LIKE '%auth.uid()%' THEN '✅ Allows own update'
    WHEN qual::text LIKE '%auth.role()%authenticated%' THEN '✅ Allows authenticated users'
    ELSE '⚠️ Check policy condition'
  END AS policy_assessment
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users'
  AND cmd = 'UPDATE'
ORDER BY policyname;

-- 3. Test manual update (replace USER_ID_HERE with actual user ID)
-- First, get a user ID:
SELECT id, email FROM public.users LIMIT 1;

-- Then test the update (uncomment and replace UUID):
/*
UPDATE public.users
SET last_login = NOW()
WHERE id = 'USER_ID_HERE'::uuid
RETURNING id, email, last_login;
*/

-- 4. Check if there are any triggers that might interfere
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'users'
  AND event_manipulation = 'UPDATE';

