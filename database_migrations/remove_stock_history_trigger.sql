-- ============================================================================
-- COMPLETELY REMOVE UNNECESSARY STOCK HISTORY TRIGGER
-- ============================================================================
-- This script completely removes the problematic trigger and function
-- since we now have better manual control through updateStockForItem
-- ============================================================================

-- ------------------------------------------------------------------------------
-- 1. COMPLETELY REMOVE THE TRIGGER
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_update_stock_history ON inventory_items CASCADE;

-- ------------------------------------------------------------------------------
-- 2. COMPLETELY REMOVE THE FUNCTION
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS update_stock_history() CASCADE;

-- ------------------------------------------------------------------------------
-- 3. VERIFICATION - CONFIRM REMOVAL
-- ------------------------------------------------------------------------------
-- This query should return no rows for the stock history trigger
SELECT 
    event_object_table as tablename,
    trigger_name,
    action_timing,
    action_condition,
    action_orientation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'inventory_items' 
  AND trigger_name = 'trigger_update_stock_history';

-- ------------------------------------------------------------------------------
-- 4. CLEANUP ANY EXISTING DUPLICATE ENTRIES (OPTIONAL)
-- ------------------------------------------------------------------------------
-- Uncomment to clean up duplicate entries created by the old trigger
-- DELETE FROM inventory_stock_history 
-- WHERE reference_type = 'manual_update' 
--   AND notes = 'Inventory item updated'
--   AND created_at >= CURRENT_DATE - INTERVAL '1 day';

-- ------------------------------------------------------------------------------
-- MIGRATION NOTES
-- ------------------------------------------------------------------------------
-- 
-- This migration completely removes the automatic stock history trigger because:
-- 
-- 1. MANUAL CONTROL: updateStockForItem() function provides better control
-- 2. CORRECT TYPES: We can set proper transaction types based on user actions
-- 3. NO DUPLICATES: Prevents the "New Stock" + "Damaged" duplicate issue
-- 4. BETTER AUDIT: More meaningful and accurate stock history
-- 5. CLEANER CODE: Less complexity, fewer potential issues
-- 
-- The trigger was originally created to automatically track stock changes,
-- but our manual approach in updateStockForItem() is superior in every way.
--
