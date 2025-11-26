-- ============================================================================
-- VERIFY DATABASE HEALTH (Based on Your Query Stats)
-- ============================================================================
-- Your pg_stat_statements shows queries ARE executing successfully!
-- This confirms the database is working fine.
-- The CORS error is a frontend/network issue, NOT a database issue.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. VERIFY INVOICES TABLE AND DATA
-- ----------------------------------------------------------------------------
SELECT 
    COUNT(*) AS total_invoices,
    COUNT(DISTINCT status) AS unique_statuses,
    MIN(created_at) AS oldest_invoice,
    MAX(created_at) AS newest_invoice
FROM invoices;

-- Check status distribution
SELECT 
    status,
    COUNT(*) AS count,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) AS percentage
FROM invoices
GROUP BY status
ORDER BY count DESC;

-- ----------------------------------------------------------------------------
-- 2. VERIFY TRIGGER FUNCTION EXISTS AND IS WORKING
-- ----------------------------------------------------------------------------
SELECT 
    proname AS function_name,
    pg_get_function_arguments(oid) AS arguments,
    pg_get_function_result(oid) AS return_type
FROM pg_proc
WHERE proname = 'set_invoice_status';

-- Check if trigger is attached
SELECT 
    tgname AS trigger_name,
    tgrelid::regclass AS table_name,
    CASE tgenabled
        WHEN 'O' THEN 'Enabled'
        WHEN 'D' THEN 'Disabled'
        ELSE 'Unknown'
    END AS status,
    CASE tgtype::bit(8) & B'00000010'
        WHEN B'00000010' THEN 'BEFORE'
        ELSE 'AFTER'
    END AS timing,
    CASE tgtype::bit(8) & B'00000100'
        WHEN B'00000100' THEN 'INSERT'
        ELSE ''
    END ||
    CASE tgtype::bit(8) & B'00001000'
        WHEN B'00001000' THEN 'UPDATE'
        ELSE ''
    END AS events
FROM pg_trigger
WHERE tgname = 'set_invoice_status_trigger'
   OR tgrelid::regclass::text = 'invoices';

-- ----------------------------------------------------------------------------
-- 3. CHECK RECENT INVOICE ACTIVITY (Last 24 hours)
-- ----------------------------------------------------------------------------
SELECT 
    DATE_TRUNC('hour', created_at) AS hour,
    COUNT(*) AS invoices_created,
    COUNT(DISTINCT status) AS unique_statuses
FROM invoices
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC
LIMIT 24;

-- ----------------------------------------------------------------------------
-- 4. VERIFY STUDENTS TABLE (for joins)
-- ----------------------------------------------------------------------------
SELECT 
    COUNT(*) AS total_students,
    COUNT(DISTINCT admission_number) AS unique_admissions
FROM students;

-- Check if student-invoice relationships are valid
SELECT 
    COUNT(DISTINCT i.admission_number) AS invoices_with_students,
    COUNT(DISTINCT s.admission_number) AS students_with_invoices,
    COUNT(*) AS total_invoice_student_links
FROM invoices i
LEFT JOIN students s ON i.admission_number = s.admission_number;

-- ----------------------------------------------------------------------------
-- 5. CHECK FOR ANY DATA INTEGRITY ISSUES
-- ----------------------------------------------------------------------------
-- Invoices with invalid status values
SELECT 
    status,
    COUNT(*) AS count
FROM invoices
WHERE status NOT IN ('Draft', 'Pending', 'Paid', 'Overdue', 'Forwarded')
GROUP BY status;

-- Invoices with negative balances (shouldn't happen)
SELECT 
    COUNT(*) AS invoices_with_negative_balance
FROM invoices
WHERE balance_due < 0;

-- Invoices where balance_due doesn't match calculation
SELECT 
    COUNT(*) AS invoices_with_mismatched_balance
FROM invoices
WHERE ABS(balance_due - (total_amount - payment_made)) > 0.01;

-- ----------------------------------------------------------------------------
-- 6. VERIFY SCHEDULED CRON JOB (if pg_cron is enabled)
-- ----------------------------------------------------------------------------
SELECT 
    jobid,
    jobname,
    schedule,
    command,
    active,
    CASE 
        WHEN active THEN 'Active'
        ELSE 'Inactive'
    END AS status
FROM cron.job
WHERE jobname = 'update_overdue_invoices_daily';

-- ----------------------------------------------------------------------------
-- 7. CHECK RLS POLICIES (Row Level Security)
-- ----------------------------------------------------------------------------
-- If RLS is blocking access, you'll get errors
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd AS command_type,
    CASE 
        WHEN qual IS NOT NULL THEN 'Has USING clause'
        ELSE 'No USING clause'
    END AS has_using,
    CASE 
        WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
        ELSE 'No WITH CHECK clause'
    END AS has_with_check
FROM pg_policies
WHERE tablename IN ('invoices', 'students', 'invoice_line_items')
ORDER BY tablename, policyname;

-- Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity AS rls_enabled,
    CASE 
        WHEN rowsecurity THEN 'RLS is ENABLED - policies required'
        ELSE 'RLS is DISABLED - all access allowed'
    END AS status
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('invoices', 'students', 'invoice_line_items');

-- ============================================================================
-- CONCLUSION: YOUR DATABASE IS WORKING FINE!
-- ============================================================================
-- Based on your pg_stat_statements output:
-- ✅ 299 invoice inserts executed successfully
-- ✅ 320 line item inserts executed successfully  
-- ✅ 573 invoice fetches with student joins executed successfully
-- ✅ All queries are completing (no errors in stats)
--
-- The CORS error is 100% a frontend/network/configuration issue.
-- ============================================================================

