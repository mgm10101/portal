-- ============================================================================
-- SUPABASE CONNECTION DIAGNOSTICS
-- ============================================================================
-- This script helps verify your database is accessible and working correctly.
-- NOTE: CORS errors are NOT database issues - they're HTTP/network configuration
-- issues that happen before requests reach the database.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CHECK IF YOU CAN CONNECT TO THE DATABASE
-- ----------------------------------------------------------------------------
-- If you can run this query, your database connection is working.
SELECT 
    current_database() AS database_name,
    current_user AS current_user,
    version() AS postgres_version,
    NOW() AS current_timestamp;

-- ----------------------------------------------------------------------------
-- 2. VERIFY INVOICES TABLE EXISTS AND IS ACCESSIBLE
-- ----------------------------------------------------------------------------
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'invoices';

-- Check if you can read from invoices table
SELECT COUNT(*) AS total_invoices FROM invoices;

-- ----------------------------------------------------------------------------
-- 3. VERIFY THE TRIGGER FUNCTION EXISTS
-- ----------------------------------------------------------------------------
SELECT 
    proname AS function_name,
    pg_get_functiondef(oid) AS function_definition
FROM pg_proc
WHERE proname = 'set_invoice_status';

-- ----------------------------------------------------------------------------
-- 4. VERIFY THE TRIGGER EXISTS AND IS ATTACHED
-- ----------------------------------------------------------------------------
SELECT 
    tgname AS trigger_name,
    tgrelid::regclass AS table_name,
    tgenabled AS enabled,
    tgtype AS trigger_type
FROM pg_trigger
WHERE tgname = 'set_invoice_status_trigger'
   OR tgrelid::regclass::text = 'invoices';

-- ----------------------------------------------------------------------------
-- 5. CHECK ROW LEVEL SECURITY (RLS) POLICIES ON INVOICES
-- ----------------------------------------------------------------------------
-- If RLS is enabled but no policies exist, you might not be able to access data
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
WHERE tablename = 'invoices';

-- Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'invoices';

-- ----------------------------------------------------------------------------
-- 6. VERIFY STUDENTS TABLE EXISTS AND IS ACCESSIBLE
-- ----------------------------------------------------------------------------
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'students';

-- Check if you can read from students table
SELECT COUNT(*) AS total_students FROM students;

-- Check RLS on students table
SELECT 
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'students';

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'students';

-- ----------------------------------------------------------------------------
-- 7. CHECK SCHEDULED CRON JOB (if pg_cron is enabled)
-- ----------------------------------------------------------------------------
SELECT 
    jobid,
    jobname,
    schedule,
    command,
    nodename,
    nodeport,
    database,
    username,
    active
FROM cron.job
WHERE jobname = 'update_overdue_invoices_daily';

-- ----------------------------------------------------------------------------
-- 8. TEST INVOICE STATUS VALUES
-- ----------------------------------------------------------------------------
-- Check what status values exist in your invoices
SELECT 
    status,
    COUNT(*) AS count
FROM invoices
GROUP BY status
ORDER BY count DESC;

-- ----------------------------------------------------------------------------
-- 9. CHECK FOR ANY RECENT ERRORS IN LOGS (if accessible)
-- ----------------------------------------------------------------------------
-- Note: This might not work on free tier
SELECT * FROM pg_stat_statements 
WHERE query LIKE '%invoice%' 
ORDER BY total_exec_time DESC 
LIMIT 10;

-- ============================================================================
-- IMPORTANT: CORS ERRORS CANNOT BE DIAGNOSED WITH SQL
-- ============================================================================
-- CORS (Cross-Origin Resource Sharing) errors happen at the HTTP/API level,
-- NOT in the database. They occur when:
--
-- 1. Browser blocks requests due to missing CORS headers
-- 2. Supabase project has CORS restrictions in settings
-- 3. Environment variables are missing/incorrect
-- 4. Network/proxy/firewall issues
--
-- To fix CORS issues, check:
-- 1. Supabase Dashboard → Settings → API → CORS settings
-- 2. Your .env file has correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
-- 3. Restart your dev server after changing .env
-- 4. Clear browser cache (Ctrl+Shift+R)
-- 5. Check browser console for more details
--
-- If these SQL queries run successfully, your DATABASE is fine.
-- The issue is with the HTTP/API connection, not the database.
-- ============================================================================

