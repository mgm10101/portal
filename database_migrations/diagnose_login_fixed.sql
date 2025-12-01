-- ============================================================================
-- LOGIN PERFORMANCE DIAGNOSTIC (FIXED VERSION)
-- ============================================================================
-- Run each section separately
-- ============================================================================

-- ============================================================================
-- STEP 1: Check RLS policies complexity
-- ============================================================================
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

-- ============================================================================
-- STEP 2: Test login query performance (by email - what we currently use)
-- ============================================================================
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT role, email, status
FROM users
WHERE email = 'admin@mgmacademy.org'
LIMIT 1;

-- ============================================================================
-- STEP 3: Get user ID from auth.users (run this first to get the UUID)
-- ============================================================================
SELECT id, email FROM auth.users WHERE email = 'admin@mgmacademy.org';

-- ============================================================================
-- STEP 4: Test by ID using dynamic lookup (no need to paste UUID manually)
-- ============================================================================
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT u.role, u.email, u.status
FROM users u
INNER JOIN auth.users au ON u.id = au.id
WHERE au.email = 'admin@mgmacademy.org'
LIMIT 1;

-- Alternative: If you got the UUID from step 3, use this (replace YOUR_UUID):
-- EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
-- SELECT role, email, status
-- FROM users
-- WHERE id = 'YOUR_UUID_HERE'
-- LIMIT 1;

-- ============================================================================
-- STEP 5: Check indexes on users table
-- ============================================================================
SELECT 
  indexname,
  indexdef,
  idx_scan AS times_used,
  CASE 
    WHEN idx_scan = 0 THEN '⚠️ Index never used'
    ELSE '✓ Index is being used'
  END AS status
FROM pg_stat_user_indexes
WHERE tablename = 'users'
ORDER BY idx_scan DESC;

-- ============================================================================
-- STEP 6: Check if statistics need updating
-- ============================================================================
SELECT 
  n_live_tup AS total_rows,
  n_dead_tup AS dead_rows,
  last_analyze,
  last_autoanalyze,
  CASE 
    WHEN last_analyze IS NULL OR last_analyze < NOW() - INTERVAL '7 days' 
    THEN '⚠️ Statistics outdated - Run ANALYZE users;'
    ELSE '✓ Statistics recent'
  END AS status
FROM pg_stat_user_tables
WHERE tablename = 'users';

-- ============================================================================
-- STEP 7: Check for sequential scans (bad performance indicator)
-- ============================================================================
SELECT 
  seq_scan AS sequential_scans,
  idx_scan AS index_scans,
  CASE 
    WHEN seq_scan > idx_scan * 10 AND seq_scan > 0 THEN '⚠️ Too many sequential scans'
    WHEN seq_scan = 0 THEN '✓ Only index scans'
    ELSE '✓ Mostly using indexes'
  END AS scan_status
FROM pg_stat_user_tables
WHERE tablename = 'users';

-- ============================================================================
-- STEP 8: Quick test - Check actual query execution time
-- ============================================================================
\timing on

-- Test email lookup (current method)
SELECT role, email, status
FROM users
WHERE email = 'admin@mgmacademy.org'
LIMIT 1;

-- Test ID lookup via join (what we should use)
SELECT u.role, u.email, u.status
FROM users u
INNER JOIN auth.users au ON u.id = au.id
WHERE au.email = 'admin@mgmacademy.org'
LIMIT 1;

\timing off

-- ============================================================================
-- COMMON FIXES (run these if needed)
-- ============================================================================

-- Fix 1: Update statistics if outdated
-- ANALYZE users;

-- Fix 2: Ensure indexes exist
-- CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
-- CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Fix 3: Check RLS is working properly
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'users';

