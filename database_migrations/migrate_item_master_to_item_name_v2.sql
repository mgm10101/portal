-- ============================================
-- MIGRATION: Remove item_master_id Foreign Key
-- Replace with item_name direct reference
-- VERSION 2: Handles duplicate item names
-- ============================================
-- 
-- PREREQUISITE: Run fix_duplicate_item_names.sql first if you have duplicates
-- 
-- This migration:
-- 1. Ensures all invoice_line_items have item_name populated
-- 2. Drops the foreign key constraint
-- 3. Drops the item_master_id column
-- 4. Ensures item_name is NOT NULL
-- 5. Adds unique constraint to item_master.item_name (only if no duplicates)
--
-- IMPORTANT: Run this migration during a maintenance window
-- ============================================

BEGIN;

-- Step 1: Verify and populate item_name for any missing records
-- (This should already be populated, but we'll ensure it)
UPDATE invoice_line_items ili
SET item_name = im.item_name
FROM item_master im
WHERE ili.item_master_id = im.id
  AND (ili.item_name IS NULL OR ili.item_name = '');

-- Step 2: Check if there are any invoice_line_items without a valid item_master_id
-- This will help identify any orphaned records
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM invoice_line_items ili
    LEFT JOIN item_master im ON ili.item_master_id = im.id
    WHERE ili.item_master_id IS NOT NULL 
      AND im.id IS NULL;
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'WARNING: Found % orphaned invoice_line_items without matching item_master', orphaned_count;
        -- For orphaned records, we'll keep the existing item_name if it exists
        -- If not, we'll need to handle this case
    END IF;
END $$;

-- Step 3: Note about duplicate item names
-- Duplicate item names are allowed (e.g., "Transport" with different descriptions)
-- This is fine because invoices store the item name as a snapshot at billing time
DO $$
BEGIN
    RAISE NOTICE 'Proceeding with migration - duplicate item names are allowed';
END $$;

-- Step 4: Drop the foreign key constraint
-- First, find the constraint name if it exists
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'invoice_line_items'::regclass
      AND contype = 'f'
      AND confrelid = 'item_master'::regclass;
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE invoice_line_items DROP CONSTRAINT %I', constraint_name);
        RAISE NOTICE 'Dropped foreign key constraint: %', constraint_name;
    ELSE
        RAISE NOTICE 'No foreign key constraint found to drop';
    END IF;
END $$;

-- Step 5: Drop the item_master_id column
ALTER TABLE invoice_line_items 
DROP COLUMN IF EXISTS item_master_id;

-- Step 6: Ensure item_name is NOT NULL (if not already)
-- First check if it's already NOT NULL
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'invoice_line_items' 
          AND column_name = 'item_name' 
          AND is_nullable = 'YES'
    ) THEN
        -- Set any NULL values to a default (shouldn't happen, but safety check)
        UPDATE invoice_line_items 
        SET item_name = 'Unknown Item'
        WHERE item_name IS NULL;
        
        -- Now make it NOT NULL
        ALTER TABLE invoice_line_items 
        ALTER COLUMN item_name SET NOT NULL;
        
        RAISE NOTICE 'Set item_name to NOT NULL';
    ELSE
        RAISE NOTICE 'item_name is already NOT NULL';
    END IF;
END $$;

-- Step 7: Skip unique constraint on item_master.item_name
-- NOTE: Item names can be duplicated (e.g., "Transport" with different descriptions like "Zone A" and "Zone B")
-- This is acceptable because invoices store the item name as a snapshot at billing time
-- The invoice_line_items table will reference items by name, and if multiple items share a name,
-- the invoice will use whichever one was selected at the time of creation
DO $$
BEGIN
    RAISE NOTICE 'Skipping unique constraint on item_master.item_name - duplicates are allowed';
END $$;

-- Step 8: Create an index on invoice_line_items.item_name for better query performance
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_item_name 
ON invoice_line_items(item_name);

COMMIT;

-- ============================================
-- VERIFICATION QUERIES (Run after migration)
-- ============================================

-- Verify no item_master_id column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'invoice_line_items' 
  AND column_name = 'item_master_id';
-- Should return 0 rows

-- Verify item_name is NOT NULL
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'invoice_line_items' 
  AND column_name = 'item_name';
-- Should show is_nullable = 'NO'

-- Count invoice_line_items with item_name
SELECT COUNT(*) as total_line_items,
       COUNT(DISTINCT item_name) as unique_item_names
FROM invoice_line_items;
-- Should show all records have item_name

-- Note: No unique constraint on item_name (duplicates allowed for different zones/descriptions)

