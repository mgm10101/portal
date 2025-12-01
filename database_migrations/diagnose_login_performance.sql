-- ============================================================================
-- DIAGNOSE LOGIN PERFORMANCE ISSUES
-- ============================================================================
-- This script helps identify what's causing slow login performance.
-- Run each section separately and check the results.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CHECK TABLE SIZE AND STATISTICS
-- ----------------------------------------------------------------------------
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  n_live_tup AS row_count
FROM pg_stat_user_tables
WHERE tablename = 'users';

-- ----------------------------------------------------------------------------
-- 2. CHECK INDEXES ON USERS TABLE
-- ----------------------------------------------------------------------------
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'users'
ORDER BY indexname;

-- ----------------------------------------------------------------------------
-- 3. CHECK RLS POLICIES ON USERS TABLE
-- ----------------------------------------------------------------------------
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users';

-- ----------------------------------------------------------------------------
-- 4. CHECK IF RLS IS ENABLED
-- ----------------------------------------------------------------------------
SELECT 
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'users';

-- ----------------------------------------------------------------------------
-- 5. TEST QUERY PERFORMANCE (SIMULATE LOGIN QUERY)
-- ----------------------------------------------------------------------------
-- Replace 'YOUR_USER_ID_HERE' with an actual UUID from auth.users
-- First, get a user ID:
SELECT id, email FROM auth.users LIMIT 1;

-- Then test the query (replace UUID below):
EXPLAIN ANALYZE
SELECT role, email, status
FROM users
WHERE id = 'REPLACE_WITH_ACTUAL_USER_ID'
LIMIT 1;

-- Alternative: Test by email (what we used before)
EXPLAIN ANALYZE
SELECT role, email, status
FROM users
WHERE email = 'admin@mgmacademy.org'
LIMIT 1;

-- ----------------------------------------------------------------------------
-- 6. CHECK FOR SLOW QUERIES OR LOCKS
-- ----------------------------------------------------------------------------
SELECT 
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query,
  state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds'
  AND state != 'idle'
ORDER BY duration DESC;

-- ----------------------------------------------------------------------------
-- 7. CHECK TABLE STATISTICS (for query planner)
-- ----------------------------------------------------------------------------
SELECT 
  schemaname,
  tablename,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze,
  n_live_tup,
  n_dead_tup
FROM pg_stat_user_tables
WHERE tablename = 'users';

-- ----------------------------------------------------------------------------
-- 8. CHECK IF INDEXES ARE BEING USED
-- ----------------------------------------------------------------------------
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan AS index_scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename = 'users'
ORDER BY idx_scan DESC;

-- ----------------------------------------------------------------------------
-- 9. CHECK FOR MISSING INDEXES (SLOW QUERIES)
-- ----------------------------------------------------------------------------
SELECT 
  schemaname,
  tablename,
  seq_scan AS sequential_scans,
  seq_tup_read AS sequential_tuples_read,
  idx_scan AS index_scans,
  seq_tup_read / seq_scan AS avg_seq_read_per_scan
FROM pg_stat_user_tables
WHERE tablename = 'users'
  AND seq_scan > 0;

-- ----------------------------------------------------------------------------
-- 10. TEST AUTHENTICATED QUERY (SIMULATE REAL LOGIN)
-- ----------------------------------------------------------------------------
-- This simulates what happens during login with RLS
-- Note: This might be slow if RLS policies are complex

-- First, check if you're authenticated:
SELECT auth.uid() AS current_user_id;

-- Then test the query as authenticated user:
EXPLAIN ANALYZE
SELECT role, email, status
FROM users
WHERE id = auth.uid();

-- ----------------------------------------------------------------------------
-- 11. CHECK RLS POLICY PERFORMANCE
-- ----------------------------------------------------------------------------
-- Check if policies have complex conditions that might slow things down
SELECT 
  schemaname,
  tablename,
  policyname,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END AS has_using,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END AS has_with_check,
  LENGTH(COALESCE(qual::text, '') || COALESCE(with_check::text, '')) AS policy_complexity
FROM pg_policies
WHERE tablename = 'users';

-- ----------------------------------------------------------------------------
-- 12. GET ACTUAL USER DATA (QUICK CHECK)
-- ----------------------------------------------------------------------------
SELECT 
  id,
  email,
  role,
  status,
  created_at,
  last_login
FROM users
WHERE email = 'admin@mgmacademy.org';

-- ----------------------------------------------------------------------------
-- 13. CHECK FOR FOREIGN KEY CONSTRAINTS (might slow inserts/updates)
-- ----------------------------------------------------------------------------
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'users';

-- ============================================================================
-- SUMMARY: What to look for
-- ============================================================================
-- 1. If EXPLAIN ANALYZE shows "Seq Scan" instead of "Index Scan" -> Missing index
-- 2. If RLS policies have complex conditions -> Might slow queries
-- 3. If last_analyze is old -> Run ANALYZE users; to update statistics
-- 4. If sequential_scans are high -> Missing indexes
-- 5. If there are locks -> Queries are waiting
-- ============================================================================

-- ----------------------------------------------------------------------------
-- QUICK FIXES TO TRY:
-- ----------------------------------------------------------------------------

-- Update table statistics (helps query planner)
-- ANALYZE users;

-- Force refresh of query planner cache
-- SELECT pg_stat_reset();

-- Check if we need to add a specific index
-- CREATE INDEX IF NOT EXISTS idx_users_id_role_status 
-- ON users(id, role, status) 
-- WHERE status = 'Active';

