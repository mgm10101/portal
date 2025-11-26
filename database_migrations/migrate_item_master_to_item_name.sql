-- ============================================
-- MIGRATION: Remove item_master_id Foreign Key
-- Replace with item_name direct reference
-- ============================================
-- 
-- This migration:
-- 1. Ensures all invoice_line_items have item_name populated
-- 2. Drops the foreign key constraint
-- 3. Drops the item_master_id column
-- 4. Ensures item_name is NOT NULL
-- 5. Adds unique constraint to item_master.item_name (recommended)
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

-- Step 3: Drop the foreign key constraint
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

-- Step 4: Drop the item_master_id column
ALTER TABLE invoice_line_items 
DROP COLUMN IF EXISTS item_master_id;

-- Step 5: Ensure item_name is NOT NULL (if not already)
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

-- Step 6: Add unique constraint to item_master.item_name (recommended for data integrity)
-- This prevents duplicate item names which could cause issues
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conrelid = 'item_master'::regclass 
          AND conname = 'item_master_item_name_unique'
    ) THEN
        ALTER TABLE item_master 
        ADD CONSTRAINT item_master_item_name_unique UNIQUE (item_name);
        RAISE NOTICE 'Added unique constraint to item_master.item_name';
    ELSE
        RAISE NOTICE 'Unique constraint on item_master.item_name already exists';
    END IF;
END $$;

-- Step 7: Create an index on invoice_line_items.item_name for better query performance
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

