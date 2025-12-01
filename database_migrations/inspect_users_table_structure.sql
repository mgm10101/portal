-- ============================================================================
-- INSPECT USERS TABLE STRUCTURE
-- ============================================================================
-- This script reveals the complete structure of the users table in Supabase
-- Run this to verify the table structure matches what UserManagement expects
-- ============================================================================

-- ============================================================================
-- 1. TABLE STRUCTURE - Columns, Data Types, Constraints
-- ============================================================================
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default,
  CASE 
    WHEN column_name = 'id' THEN 'PRIMARY KEY (references auth.users)'
    WHEN column_name = 'email' THEN 'UNIQUE'
    ELSE ''
  END AS constraints
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- ============================================================================
-- 2. CHECK CONSTRAINTS (like status IN ('Active', 'Inactive'))
-- ============================================================================
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_schema = 'public'
  AND constraint_name LIKE '%users%';

-- ============================================================================
-- 3. FOREIGN KEY RELATIONSHIPS
-- ============================================================================
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'users'
  AND tc.table_schema = 'public';

-- ============================================================================
-- 4. INDEXES ON USERS TABLE
-- ============================================================================
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'users'
ORDER BY indexname;

-- ============================================================================
-- 5. SAMPLE DATA - First 10 rows (to see actual data structure)
-- ============================================================================
SELECT 
  id,
  email,
  username,
  role,
  description,
  employee_id,
  student_ids,
  selected_modules,
  is_employee,
  status,
  last_login,
  created_at,
  updated_at,
  created_by
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- 6. DATA COUNTS BY ROLE
-- ============================================================================
SELECT 
  role,
  COUNT(*) AS count,
  COUNT(*) FILTER (WHERE status = 'Active') AS active_count,
  COUNT(*) FILTER (WHERE status = 'Inactive') AS inactive_count
FROM public.users
GROUP BY role
ORDER BY count DESC;

-- ============================================================================
-- 7. RLS STATUS AND POLICIES
-- ============================================================================
SELECT 
  tablename,
  rowsecurity AS rls_enabled,
  CASE WHEN rowsecurity THEN '✅ RLS ON' ELSE '❌ RLS OFF' END AS rls_status
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'users';

-- List all RLS policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd AS command_type,
  qual AS policy_condition,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users'
ORDER BY policyname;

-- ============================================================================
-- 8. TABLE SIZE AND STATISTICS
-- ============================================================================
SELECT 
  schemaname,
  relname AS table_name,
  n_live_tup AS total_rows,
  n_dead_tup AS dead_rows,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE relname = 'users';

-- ============================================================================
-- 9. VERIFY COLUMN NAMES MATCH EXPECTED STRUCTURE
-- ============================================================================
-- Expected columns for UserManagement component:
-- id, email, username, role, description, status, last_login, created_at, updated_at
-- Plus optional: employee_id, student_ids, selected_modules, is_employee, created_by

SELECT 
  'Expected columns check' AS check_type,
  CASE 
    WHEN COUNT(*) FILTER (WHERE column_name IN ('id', 'email', 'role', 'status', 'last_login')) = 5 
    THEN '✅ All required columns exist'
    ELSE '⚠️ Some required columns missing'
  END AS status,
  ARRAY_AGG(column_name ORDER BY column_name) FILTER (WHERE column_name IN ('id', 'email', 'role', 'status', 'last_login')) AS found_columns
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users';

-- ============================================================================
-- 10. CHECK FOR NULL VALUES IN CRITICAL COLUMNS
-- ============================================================================
SELECT 
  'Data Quality Check' AS check_type,
  COUNT(*) AS total_users,
  COUNT(*) FILTER (WHERE email IS NULL) AS missing_email,
  COUNT(*) FILTER (WHERE role IS NULL) AS missing_role,
  COUNT(*) FILTER (WHERE status IS NULL) AS missing_status,
  COUNT(*) FILTER (WHERE email IS NOT NULL AND role IS NOT NULL AND status IS NOT NULL) AS complete_records
FROM public.users;

