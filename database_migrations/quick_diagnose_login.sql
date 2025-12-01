-- ============================================================================
-- QUICK LOGIN PERFORMANCE DIAGNOSTIC
-- ============================================================================
-- Run this to quickly identify login performance issues
-- ============================================================================

-- 1. Check if RLS is causing issues - See all policies
SELECT 
  policyname,
  cmd AS command_type,
  CASE 
    WHEN LENGTH(qual::text) > 100 THEN 'Complex policy (might be slow)'
    ELSE 'Simple policy'
  END AS policy_complexity,
  qual AS policy_condition
FROM pg_policies
WHERE tablename = 'users';

-- 2. Test the actual login query performance
-- Replace 'admin@mgmacademy.org' with your super admin email
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT role, email, status
FROM users
WHERE email = 'admin@mgmacademy.org'
LIMIT 1;

-- 3. Test by ID (faster method) - Get user ID first
-- Run this to get the user ID:
SELECT id, email FROM auth.users WHERE email = 'admin@mgmacademy.org';

-- Then run this with the actual ID (replace UUID):
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT role, email, status
FROM users
WHERE id = 'PASTE_USER_ID_HERE'::uuid;

-- 4. Check if indexes exist and are being used
SELECT 
  indexname,
  indexdef,
  idx_scan AS times_used,
  CASE 
    WHEN idx_scan = 0 THEN '⚠️ Index never used - might be unnecessary'
    ELSE '✓ Index is being used'
  END AS status
FROM pg_stat_user_indexes
WHERE tablename = 'users';

-- 5. Check table statistics
SELECT 
  n_live_tup AS total_rows,
  n_dead_tup AS dead_rows,
  last_analyze,
  CASE 
    WHEN last_analyze IS NULL OR last_analyze < NOW() - INTERVAL '7 days' 
    THEN '⚠️ Statistics outdated - Run ANALYZE users;'
    ELSE '✓ Statistics recent'
  END AS stats_status
FROM pg_stat_user_tables
WHERE tablename = 'users';

-- 6. Check for sequential scans (bad for performance)
SELECT 
  seq_scan AS sequential_scans,
  idx_scan AS index_scans,
  CASE 
    WHEN seq_scan > idx_scan * 10 THEN '⚠️ Too many sequential scans - Need better indexes'
    ELSE '✓ Mostly using indexes'
  END AS scan_status
FROM pg_stat_user_tables
WHERE tablename = 'users';

-- 7. QUICK FIX: Update statistics if outdated
-- Uncomment this line if statistics are outdated:
-- ANALYZE users;

-- 8. Check RLS is enabled
SELECT 
  tablename,
  rowsecurity AS rls_enabled,
  CASE 
    WHEN rowsecurity THEN 'RLS is ON'
    ELSE 'RLS is OFF'
  END AS rls_status
FROM pg_tables
WHERE tablename = 'users';

