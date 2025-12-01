-- ============================================================================
-- LOGIN PERFORMANCE DIAGNOSTIC (CORRECTED VERSION)
-- ============================================================================
-- Fixed the column names that were causing errors
-- ============================================================================

-- ============================================================================
-- Query 5 FIXED: Check indexes on users table
-- ============================================================================
SELECT 
  indexrelname AS indexname,
  idx_scan AS times_used,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE relname = 'users'
ORDER BY idx_scan DESC;

-- Also show index definitions
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'users'
ORDER BY indexname;

-- ============================================================================
-- Query 6 FIXED: Check if statistics need updating
-- ============================================================================
SELECT 
  relname AS tablename,
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
WHERE relname = 'users';

-- ============================================================================
-- Query 7 FIXED: Check for sequential scans
-- ============================================================================
SELECT 
  relname AS tablename,
  seq_scan AS sequential_scans,
  idx_scan AS index_scans,
  CASE 
    WHEN seq_scan > idx_scan * 10 AND seq_scan > 0 THEN '⚠️ Too many sequential scans'
    WHEN seq_scan = 0 THEN '✓ Only index scans'
    ELSE '✓ Mostly using indexes'
  END AS scan_status
FROM pg_stat_user_tables
WHERE relname = 'users';

