-- ============================================================================
-- ENFORCE total_amount = subtotal IN invoices TABLE
-- ============================================================================
-- This script ensures that total_amount always equals subtotal in the invoices table.
-- Since broughtforward_amount has been removed and BBF is now included as a line item,
-- total_amount should always equal subtotal (which includes all line items).
--
-- APPROACH: Create a trigger that automatically sets total_amount = subtotal
-- on INSERT and UPDATE operations.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: CREATE FUNCTION TO ENFORCE total_amount = subtotal
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION enforce_total_amount_equals_subtotal()
RETURNS TRIGGER AS $$
BEGIN
    -- Automatically set total_amount to equal subtotal
    -- This ensures consistency since BBF is now included in line items (subtotal)
    NEW.total_amount := COALESCE(NEW.subtotal, 0.00);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- STEP 2: DROP EXISTING TRIGGER IF IT EXISTS (for re-running this script)
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_enforce_total_amount_equals_subtotal ON invoices;

-- ----------------------------------------------------------------------------
-- STEP 3: CREATE TRIGGER
-- ----------------------------------------------------------------------------
-- This trigger runs BEFORE INSERT and BEFORE UPDATE to ensure total_amount
-- is always set to match subtotal
CREATE TRIGGER trigger_enforce_total_amount_equals_subtotal
    BEFORE INSERT OR UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION enforce_total_amount_equals_subtotal();

-- ----------------------------------------------------------------------------
-- STEP 4: FIX ANY EXISTING DATA (Optional - run this if you want to fix existing rows)
-- ----------------------------------------------------------------------------
-- Update any existing invoices where total_amount != subtotal
-- This ensures all existing data is consistent
UPDATE invoices
SET total_amount = COALESCE(subtotal, 0.00)
WHERE total_amount IS DISTINCT FROM COALESCE(subtotal, 0.00);

-- ----------------------------------------------------------------------------
-- VERIFICATION
-- ----------------------------------------------------------------------------
-- After running this migration, verify that:
-- 1. The trigger exists:
--    SELECT tgname FROM pg_trigger WHERE tgname = 'trigger_enforce_total_amount_equals_subtotal';
--
-- 2. All invoices have total_amount = subtotal:
--    SELECT invoice_number, subtotal, total_amount 
--    FROM invoices 
--    WHERE total_amount != COALESCE(subtotal, 0.00);
--    (Should return no rows)
--
-- 3. Test by inserting/updating an invoice - total_amount should auto-update
-- ============================================================================

