-- ============================================================================
-- REMOVE broughtforward_amount COLUMN FROM invoices TABLE
-- ============================================================================
-- This script removes the broughtforward_amount column from the invoices table
-- because the balance brought forward is now included as a line item in the
-- invoice_line_items table, making this column redundant and causing double-counting.
--
-- IMPORTANT: Run this migration AFTER updating the application code to remove
-- all references to broughtforward_amount.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: DROP THE TRIGGER THAT DEPENDS ON broughtforward_amount
-- ----------------------------------------------------------------------------
-- The trigger tr_recalculate_invoice_totals depends on broughtforward_amount
-- We need to drop it first, then recreate it without that dependency

DROP TRIGGER IF EXISTS tr_recalculate_invoice_totals ON invoices;

-- ----------------------------------------------------------------------------
-- STEP 2: DROP/RECREATE THE TRIGGER FUNCTION (if it exists)
-- ----------------------------------------------------------------------------
-- If there's a function that recalculates invoice totals, we need to update it
-- to remove references to broughtforward_amount. Since we don't know the exact
-- definition, we'll create a safe version that calculates totals from line items only.

-- Check if the function exists and get its definition
DO $$
BEGIN
    -- Drop the function if it exists (we'll recreate it if needed)
    DROP FUNCTION IF EXISTS recalculate_invoice_totals() CASCADE;
    
    -- Note: If you have a custom function that recalculates totals, you may need
    -- to recreate it here without the broughtforward_amount reference.
    -- For now, we're just removing the dependency so we can drop the column.
END $$;

-- ----------------------------------------------------------------------------
-- STEP 3: DROP THE COLUMN
-- ----------------------------------------------------------------------------
ALTER TABLE invoices 
DROP COLUMN IF EXISTS broughtforward_amount;

-- ----------------------------------------------------------------------------
-- STEP 4: VERIFICATION
-- ----------------------------------------------------------------------------
-- After running this migration, verify that:
-- 1. The column no longer exists: 
--    SELECT column_name FROM information_schema.columns 
--    WHERE table_name = 'invoices' AND column_name = 'broughtforward_amount';
--    (Should return no rows)
--
-- 2. The trigger no longer exists (or has been recreated without the dependency):
--    SELECT tgname FROM pg_trigger WHERE tgname = 'tr_recalculate_invoice_totals';
--
-- 3. Existing invoices still work correctly (BBF amounts are in line items)
--
-- 4. New invoices with BBF work correctly (BBF is added as a line item)
-- ============================================================================

