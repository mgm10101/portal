-- ============================================================================
-- UPDATE USERS TABLE STATISTICS
-- ============================================================================
-- This helps the query planner make better decisions
-- ============================================================================

ANALYZE users;

-- Verify it worked
SELECT 
  relname AS tablename,
  last_analyze,
  n_live_tup AS total_rows
FROM pg_stat_user_tables
WHERE relname = 'users';

