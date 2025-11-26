-- ============================================================================
-- UPDATE INVOICE STATUS TRIGGER AND ADD SCHEDULED OVERDUE UPDATES
-- ============================================================================
-- This script:
-- 1. Updates set_invoice_status function to preserve 'Forwarded' status
-- 2. Uses GMT+3 timezone for date comparisons
-- 3. Creates scheduled function to update overdue invoices at midnight GMT+3
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: UPDATE THE set_invoice_status FUNCTION
-- ----------------------------------------------------------------------------
-- This function now:
-- - Preserves 'Forwarded' status (doesn't override it)
-- - Uses GMT+3 timezone for accurate date comparisons
-- - Allows 'Forwarded' as a valid status

CREATE OR REPLACE FUNCTION set_invoice_status()
RETURNS TRIGGER AS $$
BEGIN
    -- IMPORTANT: If status is already 'Forwarded', preserve it and skip automatic status calculation
    -- This allows manual setting of 'Forwarded' status when bringing forward balances
    IF NEW.status = 'Forwarded' THEN
        -- Still ensure balance_due is calculated correctly
        NEW.balance_due := COALESCE(NEW.total_amount, 0.00) - COALESCE(NEW.payment_made, 0.00);
        RETURN NEW;
    END IF;

    -- 1. FORCE CALCULATION: Ensure NEW.balance_due is up-to-date
    NEW.balance_due := COALESCE(NEW.total_amount, 0.00) - COALESCE(NEW.payment_made, 0.00);

    -- 2. STATUS CHECK:
    -- If the balance is zero or less, the invoice is Paid.
    IF NEW.balance_due <= 0.00 THEN
        NEW.status := 'Paid';
        
    -- If the balance is greater than zero AND the due_date has passed (using GMT+3 timezone).
    -- Convert CURRENT_DATE to GMT+3 timezone for accurate comparison
    ELSIF NEW.due_date < (CURRENT_DATE AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Nairobi')::date THEN
        NEW.status := 'Overdue';
        
    -- Otherwise, it is Pending.
    ELSE
        NEW.status := 'Pending';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- STEP 2: CREATE FUNCTION TO UPDATE OVERDUE INVOICES (for scheduled job)
-- ----------------------------------------------------------------------------
-- This function updates invoices to 'Overdue' status at midnight GMT+3
-- It only updates invoices that are 'Pending' and have passed their due date

CREATE OR REPLACE FUNCTION update_overdue_invoices_scheduled()
RETURNS void AS $$
DECLARE
    gmt3_date DATE;
    updated_count INTEGER;
BEGIN
    -- Get current date in GMT+3 (Africa/Nairobi timezone)
    gmt3_date := (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Nairobi')::date;
    
    -- Update invoices that are Pending and have passed their due date
    -- Exclude 'Forwarded' invoices as they should not be changed
    UPDATE invoices
    SET status = 'Overdue'
    WHERE status IN ('Pending', 'Draft')  -- Update both Pending and Draft invoices
      AND due_date < gmt3_date
      AND balance_due > 0.00  -- Only update if there's still a balance
      AND status != 'Forwarded';  -- Never update Forwarded invoices
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    -- Log the update (optional, for monitoring)
    RAISE NOTICE 'Updated % invoices to Overdue status at %', updated_count, gmt3_date;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- STEP 3: ENABLE pg_cron EXTENSION (if not already enabled)
-- ----------------------------------------------------------------------------
-- Note: This may require superuser privileges. If you get an error,
-- you may need to enable it via Supabase Dashboard > Database > Extensions

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ----------------------------------------------------------------------------
-- STEP 4: SCHEDULE THE OVERDUE UPDATE FUNCTION
-- ----------------------------------------------------------------------------
-- Schedule to run daily at 00:00 GMT+3 (which is 21:00 UTC the previous day)
-- Cron format: minute hour day month weekday
-- '0 21 * * *' = 21:00 UTC daily = 00:00 GMT+3 (next day)

-- First, remove any existing schedule with the same name (if re-running this script)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'update_overdue_invoices_daily') THEN
        PERFORM cron.unschedule('update_overdue_invoices_daily');
    END IF;
END $$;

-- Schedule the job
SELECT cron.schedule(
    'update_overdue_invoices_daily',  -- Job name
    '0 21 * * *',  -- Run at 21:00 UTC daily (00:00 GMT+3)
    $$ SELECT update_overdue_invoices_scheduled(); $$  -- Function to execute
);

-- ----------------------------------------------------------------------------
-- STEP 5: ENSURE THE TRIGGER EXISTS
-- ----------------------------------------------------------------------------
-- Drop the trigger if it exists (to ensure clean recreation)
DROP TRIGGER IF EXISTS set_invoice_status_trigger ON invoices;

-- Create the trigger (BEFORE INSERT and BEFORE UPDATE as specified)
CREATE TRIGGER set_invoice_status_trigger
    BEFORE INSERT OR UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION set_invoice_status();

-- ----------------------------------------------------------------------------
-- STEP 6: VERIFY THE SETUP (Optional - for manual verification)
-- ----------------------------------------------------------------------------
-- You can run these queries manually to verify:
-- 
-- Check that the trigger exists:
-- SELECT tgname AS trigger_name, tgrelid::regclass AS table_name, tgenabled AS enabled
-- FROM pg_trigger WHERE tgname = 'set_invoice_status_trigger';
--
-- Check that the cron job was scheduled:
-- SELECT jobid, jobname, schedule, command, active FROM cron.job WHERE jobname = 'update_overdue_invoices_daily';

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- Next steps:
-- 1. Verify the trigger is working by inserting/updating an invoice
-- 2. Wait for the scheduled job to run (or test manually with: SELECT update_overdue_invoices_scheduled();)
-- 3. Application code will be updated to set 'Forwarded' status when bringing forward
-- ============================================================================

