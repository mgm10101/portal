-- ============================================
-- MIGRATION: Add sort_order to item_master and invoice_line_items
-- ============================================
-- 
-- This migration:
-- 1. Adds sort_order column to item_master table
-- 2. Initializes sort_order for existing items in item_master (by created_at)
-- 3. Adds sort_order column to invoice_line_items table
-- 4. Initializes sort_order for existing line items (by id within each invoice)
-- 5. Creates indexes for better query performance
--
-- IMPORTANT: Run this migration before implementing the UI changes
-- ============================================

BEGIN;

-- Step 1: Add sort_order to item_master table
ALTER TABLE item_master 
ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- Step 2: Initialize sort_order for existing items in item_master (by created_at order)
UPDATE item_master 
SET sort_order = subquery.row_num - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num 
  FROM item_master
) AS subquery
WHERE item_master.id = subquery.id
AND item_master.sort_order IS NULL;

-- Step 3: Create index on item_master.sort_order for better query performance
CREATE INDEX IF NOT EXISTS idx_item_master_sort_order ON item_master(sort_order);

-- Step 4: Add sort_order to invoice_line_items table
ALTER TABLE invoice_line_items 
ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- Step 5: Initialize sort_order for existing line items (by id within each invoice)
-- This preserves the insertion order for existing invoices
UPDATE invoice_line_items 
SET sort_order = subquery.row_num - 1
FROM (
  SELECT id, invoice_number, ROW_NUMBER() OVER (PARTITION BY invoice_number ORDER BY id) as row_num 
  FROM invoice_line_items
) AS subquery
WHERE invoice_line_items.id = subquery.id
AND invoice_line_items.sort_order IS NULL;

-- Step 6: Create index on invoice_line_items.sort_order for better query performance
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_sort_order ON invoice_line_items(invoice_number, sort_order);

COMMIT;

-- ============================================
-- VERIFICATION QUERIES (Run after migration)
-- ============================================

-- Verify sort_order column exists in item_master
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'item_master' 
  AND column_name = 'sort_order';
-- Should return 1 row

-- Verify sort_order column exists in invoice_line_items
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'invoice_line_items' 
  AND column_name = 'sort_order';
-- Should return 1 row

-- Check that all items have sort_order assigned
SELECT 
    COUNT(*) as total_items,
    COUNT(sort_order) as items_with_sort_order
FROM item_master;
-- Should show all items have sort_order

-- Check that all line items have sort_order assigned
SELECT 
    COUNT(*) as total_line_items,
    COUNT(sort_order) as line_items_with_sort_order
FROM invoice_line_items;
-- Should show all line items have sort_order

