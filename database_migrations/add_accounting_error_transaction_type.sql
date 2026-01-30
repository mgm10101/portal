-- ============================================================================
-- ADD STOCK ADJUSTMENT (ACCOUNTING ERROR) TRANSACTION TYPE
-- ============================================================================
-- This script adds the new 'Stock Adjustment (Accounting Error)' transaction type
-- to the inventory_stock_history table check constraint
-- ============================================================================

-- ------------------------------------------------------------------------------
-- 1. DROP THE EXISTING CHECK CONSTRAINT
-- ------------------------------------------------------------------------------
ALTER TABLE inventory_stock_history DROP CONSTRAINT IF EXISTS inventory_stock_history_transaction_type_check;

-- ------------------------------------------------------------------------------
-- 2. RECREATE THE CHECK CONSTRAINT WITH THE NEW TRANSACTION TYPE
-- ------------------------------------------------------------------------------
ALTER TABLE inventory_stock_history 
ADD CONSTRAINT inventory_stock_history_transaction_type_check 
CHECK (transaction_type IN (
    'New Stock',
    'Stock Adjustment (Damaged)', 
    'Stock Adjustment (Loss/Theft)',
    'Stock Adjustment (Expired)',
    'Stock Adjustment (Accounting Error)',
    'Issued for Use',
    'Returned'
));

-- ------------------------------------------------------------------------------
-- 3. VERIFICATION - CHECK THE CONSTRAINT WAS ADDED CORRECTLY
-- ------------------------------------------------------------------------------
-- This query should return the new constraint definition
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'inventory_stock_history'::regclass 
    AND conname = 'inventory_stock_history_transaction_type_check';

-- ------------------------------------------------------------------------------
-- 4. SAMPLE INSERT TO TEST THE NEW TRANSACTION TYPE (OPTIONAL)
-- ------------------------------------------------------------------------------
-- Uncomment to test the new transaction type
-- INSERT INTO inventory_stock_history (
--     inventory_item_id, 
--     transaction_date, 
--     transaction_type,
--     quantity_change, 
--     quantity_before, 
--     quantity_after,
--     unit_price_at_time, 
--     notes
-- ) VALUES (
--     1, 
--     CURRENT_DATE, 
--     'Stock Adjustment (Accounting Error)',
--     5, 
--     100, 
--     105,
--     10.50, 
--     'Correction of previous accounting error'
-- );

-- ------------------------------------------------------------------------------
-- MIGRATION NOTES
-- ------------------------------------------------------------------------------
-- 
-- This migration:
-- 1. Safely drops the existing check constraint (IF EXISTS prevents errors)
-- 2. Recreates the constraint with the new 'Stock Adjustment (Accounting Error)' type
-- 3. Maintains all existing transaction types
-- 4. Allows the frontend to use the new transaction type
--
-- The new transaction type is specifically designed to allow both add and subtract
-- actions, making it flexible for accounting corrections where stock was previously
-- miscounted or incorrectly recorded.
--
