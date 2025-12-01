-- ============================================================================
-- COMPREHENSIVE LOGIN DIAGNOSTICS
-- ============================================================================
-- Run this to diagnose why login stopped working after it was working
-- Replace 'admin@mgmacademy.org' with your actual email
-- ============================================================================

-- ============================================================================
-- 1. CHECK AUTH USER VS PUBLIC.USERS ALIGNMENT
-- ============================================================================
WITH params AS (
  SELECT 'admin@mgmacademy.org'::text AS email
),
auth_vs_users AS (
  SELECT 
    au.id   AS auth_user_id,
    au.email AS auth_email,
    au.confirmed_at,
    au.email_confirmed_at,
    au.last_sign_in_at,
    au.created_at AS auth_created_at,
    au.deleted_at,
    au.banned_until,
    u.id    AS app_user_id,
    u.email AS app_email,
    u.role,
    u.status,
    u.last_login,
    u.created_at AS app_created_at,
    u.updated_at
  FROM auth.users au
  LEFT JOIN public.users u ON u.id = au.id
  WHERE au.email = (SELECT email FROM params)
)
SELECT *,
  CASE
    WHEN auth_user_id IS NULL THEN '❌ auth.users row MISSING - user does not exist'
    WHEN deleted_at IS NOT NULL THEN '❌ Auth user is DELETED'
    WHEN banned_until IS NOT NULL AND banned_until > NOW() THEN '❌ Auth user is BANNED'
    WHEN confirmed_at IS NULL AND email_confirmed_at IS NULL THEN '⚠️ Auth user email NOT CONFIRMED (but might be OK if email verification disabled)'
    WHEN app_user_id IS NULL THEN '❌ public.users row MISSING - need to insert'
    WHEN status IS DISTINCT FROM 'Active' THEN '❌ User exists but status is NOT Active'
    WHEN auth_user_id IS NOT NULL AND app_user_id IS NOT NULL AND status = 'Active' THEN '✅ Both rows exist and user is Active'
    ELSE '⚠️ Unknown issue'
  END AS diagnostic
FROM auth_vs_users;

-- ============================================================================
-- 2. CHECK RLS STATUS AND POLICIES
-- ============================================================================
SELECT 
  t.schemaname,
  t.tablename,
  t.rowsecurity AS rls_enabled,
  COALESCE(c.relforcerowsecurity, false) AS rls_forced,
  CASE 
    WHEN t.rowsecurity THEN 'RLS is ON'
    ELSE '❌ RLS is OFF - security risk!'
  END AS rls_status
FROM pg_tables t
JOIN pg_class c
  ON c.relname = t.tablename
 AND c.relnamespace = t.schemaname::regnamespace
WHERE t.schemaname = 'public'
  AND t.tablename = 'users';

-- List all policies on users table
SELECT 
  policyname,
  permissive,
  roles,
  cmd AS command_type,
  CASE 
    WHEN LENGTH(qual::text) > 200 THEN '⚠️ Complex policy (might be slow)'
    ELSE 'Simple policy'
  END AS policy_complexity,
  qual AS policy_condition,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users'
ORDER BY policyname;

-- Check if policies allow authenticated users to read
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual::text LIKE '%auth.role()%authenticated%' OR qual::text LIKE '%auth.uid()%' THEN '✅ Should allow authenticated access'
    WHEN qual::text LIKE '%Super Admin%' THEN '⚠️ Only allows Super Admin (might cause recursion)'
    ELSE '❓ Unknown policy logic'
  END AS policy_assessment
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users'
  AND cmd = 'SELECT';

-- ============================================================================
-- 3. CHECK FOR TRIGGERS THAT MIGHT INTERFERE
-- ============================================================================
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing,
  CASE 
    WHEN action_statement LIKE '%status%' OR action_statement LIKE '%Active%' THEN '⚠️ Might modify status'
    ELSE 'Probably safe'
  END AS trigger_risk
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- ============================================================================
-- 4. CHECK USER DATA INTEGRITY
-- ============================================================================
SELECT 
  COUNT(*) AS total_users,
  COUNT(*) FILTER (WHERE status = 'Active') AS active_users,
  COUNT(*) FILTER (WHERE status <> 'Active') AS inactive_users,
  COUNT(*) FILTER (WHERE status IS NULL) AS status_null,
  COUNT(*) FILTER (WHERE role IS NULL) AS role_null,
  COUNT(*) FILTER (WHERE email IS NULL) AS email_null,
  COUNT(*) FILTER (WHERE id IS NULL) AS id_null
FROM public.users;

-- Check for users with mismatched emails
SELECT 
  u.id,
  u.email AS app_email,
  au.email AS auth_email,
  CASE 
    WHEN u.email <> au.email THEN '❌ Email mismatch'
    ELSE '✅ Emails match'
  END AS email_check
FROM public.users u
JOIN auth.users au ON au.id = u.id
WHERE u.email <> au.email;

-- ============================================================================
-- 5. CHECK SESSION STATE (if any active sessions)
-- ============================================================================
-- Note: auth.sessions structure varies by Supabase version
-- This query checks what columns exist and shows session info
SELECT 
  COUNT(*) AS total_sessions,
  MIN(created_at) AS oldest_session,
  MAX(created_at) AS newest_session
FROM auth.sessions;

-- Check for sessions for your user
WITH params AS (
  SELECT 'admin@mgmacademy.org'::text AS email
)
SELECT 
  s.id AS session_id,
  s.user_id,
  s.created_at,
  s.updated_at,
  s.aal,
  s.factor_id,
  'Session exists' AS session_status
FROM auth.sessions s
JOIN auth.users au ON au.id = s.user_id
WHERE au.email = (SELECT email FROM params)
ORDER BY s.created_at DESC
LIMIT 5;

-- ============================================================================
-- 6. CHECK INDEXES AND PERFORMANCE
-- ============================================================================
SELECT 
  schemaname,
  relname,
  indexrelname AS index_name,
  idx_scan AS times_used,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched,
  CASE 
    WHEN idx_scan = 0 THEN '⚠️ Index never used'
    ELSE '✅ Index is being used'
  END AS index_status
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND relname = 'users'
ORDER BY idx_scan DESC NULLS LAST;

-- Check table statistics
SELECT 
  schemaname,
  relname,
  n_live_tup AS total_rows,
  n_dead_tup AS dead_rows,
  seq_scan AS sequential_scans,
  idx_scan AS index_scans,
  last_analyze,
  CASE 
    WHEN last_analyze IS NULL OR last_analyze < NOW() - INTERVAL '7 days' THEN '⚠️ Statistics outdated - Run ANALYZE'
    ELSE '✅ Statistics fresh'
  END AS stats_status,
  CASE 
    WHEN seq_scan > idx_scan * 10 AND seq_scan > 0 THEN '⚠️ Too many sequential scans'
    ELSE '✅ Mostly using indexes'
  END AS scan_status
FROM pg_stat_user_tables
WHERE relname = 'users'
ORDER BY schemaname;

-- ============================================================================
-- 7. TEST QUERY PERFORMANCE (simulate login query)
-- ============================================================================
-- Get user ID first
WITH params AS (
  SELECT 'admin@mgmacademy.org'::text AS email
),
user_id AS (
  SELECT id FROM auth.users WHERE email = (SELECT email FROM params) LIMIT 1
)
SELECT 
  'Testing login query performance...' AS test_description,
  id AS test_user_id
FROM user_id;

-- Then test the actual query (replace UUID with actual ID from above)
-- EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
-- SELECT role, email, status
-- FROM public.users
-- WHERE id = 'PASTE_USER_ID_HERE'::uuid;

-- ============================================================================
-- 8. CHECK FOR RECENT CHANGES (if audit logging exists)
-- ============================================================================
-- Check if updated_at changed recently (might indicate something modified the user)
WITH params AS (
  SELECT 'admin@mgmacademy.org'::text AS email
)
SELECT 
  u.id,
  u.email,
  u.status,
  u.role,
  u.updated_at,
  u.last_login,
  CASE 
    WHEN u.updated_at > NOW() - INTERVAL '1 hour' THEN '⚠️ User record updated in last hour'
    WHEN u.updated_at > NOW() - INTERVAL '24 hours' THEN '⚠️ User record updated in last 24 hours'
    ELSE '✅ No recent updates'
  END AS recent_changes
FROM public.users u
WHERE u.email = (SELECT email FROM params);

-- ============================================================================
-- SUMMARY RECOMMENDATIONS
-- ============================================================================
SELECT 
  '=== DIAGNOSTIC SUMMARY ===' AS summary,
  '1. Check if auth user exists and is not deleted/banned' AS step1,
  '2. Check if public.users row exists with status = Active' AS step2,
  '3. Verify RLS policies allow authenticated users to SELECT' AS step3,
  '4. Check for triggers that might modify user status' AS step4,
  '5. Verify no email mismatches between auth.users and public.users' AS step5,
  '6. Run ANALYZE public.users if statistics are outdated' AS step6;

