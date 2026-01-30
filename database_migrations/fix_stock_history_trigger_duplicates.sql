-- ============================================================================
-- FIX STOCK HISTORY TRIGGER TO PREVENT DUPLICATE ENTRIES
-- ============================================================================
-- This script fixes the database trigger that was creating duplicate stock history
-- entries whenever stock was updated through the Update Stock functionality
-- ============================================================================

-- ------------------------------------------------------------------------------
-- 1. FORCE DROP THE EXISTING TRIGGER (more aggressive approach)
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_update_stock_history ON inventory_items CASCADE;

-- ------------------------------------------------------------------------------
-- 2. DROP AND RECREATE THE FUNCTION AS EMPTY (DISABLED)
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS update_stock_history();

CREATE OR REPLACE FUNCTION update_stock_history() RETURNS TRIGGER AS $$
BEGIN
    -- DISABLED: Do not create automatic stock history entries
    -- Stock history is now created manually through the updateStockForItem function
    -- This prevents duplicate entries when using the Update Stock popup
    
    -- Return without doing anything
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 3. RECREATE THE TRIGGER BUT KEEP IT DISABLED
-- ------------------------------------------------------------------------------
-- Create the trigger but the function does nothing
CREATE TRIGGER trigger_update_stock_history
    AFTER UPDATE OF in_stock ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_stock_history();

-- ------------------------------------------------------------------------------
-- 4. VERIFICATION - CHECK THE TRIGGER STATUS
-- ------------------------------------------------------------------------------
-- This query should show the trigger exists but the function is empty
SELECT 
    event_object_table as tablename,
    trigger_name,
    action_timing,
    action_condition,
    action_orientation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'inventory_items';

-- ------------------------------------------------------------------------------
-- 5. ALTERNATIVE: COMPLETELY DISABLE THE TRIGGER (UNCOMMENT IF NEEDED)
-- ------------------------------------------------------------------------------
-- If the above doesn't work, use this to completely remove the trigger:
-- ALTER TABLE inventory_items DISABLE TRIGGER trigger_update_stock_history;

-- ------------------------------------------------------------------------------
-- 6. CLEANUP ANY EXISTING DUPLICATE ENTRIES (OPTIONAL)
-- ------------------------------------------------------------------------------
-- Uncomment to clean up duplicate entries created by the trigger
-- DELETE FROM inventory_stock_history 
-- WHERE reference_type = 'manual_update' 
--   AND notes = 'Inventory item updated'
--   AND created_at >= CURRENT_DATE - INTERVAL '1 day';

-- ------------------------------------------------------------------------------
-- MIGRATION NOTES
-- ------------------------------------------------------------------------------
-- 
-- This migration:
-- 1. Forces the trigger to be dropped and recreated with a disabled function
-- 2. The trigger still exists but does nothing when fired
-- 3. The updateStockForItem function now handles all stock history creation manually
-- 4. Prevents the "New Stock" + "Stock Adjustment (Damaged)" duplicate issue
-- 5. Stock updates will now only create one history entry with the correct transaction type
--
-- If you still see duplicates after this migration, use the ALTER TABLE command
-- in section 5 to completely disable the trigger.
--
