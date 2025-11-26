-- ============================================
-- FIX DUPLICATE ITEM NAMES BEFORE MIGRATION
-- ============================================
-- 
-- This script identifies and fixes duplicate item names
-- Run this BEFORE running the main migration
-- ============================================

BEGIN;

-- Step 1: Identify duplicate item names
SELECT 
    item_name,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ') as ids,
    STRING_AGG(created_at::text, ', ') as created_dates
FROM item_master
GROUP BY item_name
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, item_name;

-- Step 2: For each duplicate, we'll keep the oldest one (earliest created_at)
-- and rename the others by appending a suffix

DO $$
DECLARE
    dup_record RECORD;
    counter INTEGER;
    new_name TEXT;
BEGIN
    -- Loop through each duplicate item name
    FOR dup_record IN 
        SELECT item_name, COUNT(*) as dup_count
        FROM item_master
        GROUP BY item_name
        HAVING COUNT(*) > 1
    LOOP
        counter := 1;
        
        -- For each duplicate (except the first/oldest), rename it
        FOR dup_record IN 
            SELECT id, item_name, created_at
            FROM item_master
            WHERE item_name = dup_record.item_name
            ORDER BY created_at ASC, id ASC
        LOOP
            IF counter > 1 THEN
                -- Rename duplicates with a suffix
                new_name := dup_record.item_name || ' (' || counter || ')';
                
                -- Check if the new name already exists
                WHILE EXISTS (SELECT 1 FROM item_master WHERE item_name = new_name) LOOP
                    counter := counter + 1;
                    new_name := dup_record.item_name || ' (' || counter || ')';
                END LOOP;
                
                -- Update the item name
                UPDATE item_master
                SET item_name = new_name
                WHERE id = dup_record.id;
                
                RAISE NOTICE 'Renamed duplicate item: % -> %', dup_record.item_name, new_name;
            END IF;
            
            counter := counter + 1;
        END LOOP;
    END LOOP;
END $$;

-- Step 3: Verify no duplicates remain
DO $$
DECLARE
    dup_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO dup_count
    FROM (
        SELECT item_name
        FROM item_master
        GROUP BY item_name
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF dup_count > 0 THEN
        RAISE EXCEPTION 'Still have % duplicate item names. Please review and fix manually.', dup_count;
    ELSE
        RAISE NOTICE 'All duplicate item names have been resolved.';
    END IF;
END $$;

COMMIT;

-- ============================================
-- VERIFICATION: Check for remaining duplicates
-- ============================================
SELECT 
    item_name,
    COUNT(*) as count
FROM item_master
GROUP BY item_name
HAVING COUNT(*) > 1;
-- Should return 0 rows

