-- ============================================================================
-- UPDATE CUSTOM COLUMNS - REMOVE NUMERIC, ADD MORE TEXT COLUMNS
-- ============================================================================
-- This script removes staff_custom_num1-3 columns and adds staff_custom_text6-10
-- ============================================================================

-- ------------------------------------------------------------------------------
-- 1. DROP CUSTOM NUMERIC COLUMNS
-- ------------------------------------------------------------------------------
ALTER TABLE staff DROP COLUMN IF EXISTS staff_custom_num1;
ALTER TABLE staff DROP COLUMN IF EXISTS staff_custom_num2;
ALTER TABLE staff DROP COLUMN IF EXISTS staff_custom_num3;

-- ------------------------------------------------------------------------------
-- 2. ADD NEW CUSTOM TEXT COLUMNS
-- ------------------------------------------------------------------------------
ALTER TABLE staff ADD COLUMN IF NOT EXISTS staff_custom_text6 TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS staff_custom_text7 TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS staff_custom_text8 TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS staff_custom_text9 TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS staff_custom_text10 TEXT;

-- ------------------------------------------------------------------------------
-- 3. CREATE INDEXES FOR NEW COLUMNS
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_staff_custom_text6 ON staff(staff_custom_text6);
CREATE INDEX IF NOT EXISTS idx_staff_custom_text7 ON staff(staff_custom_text7);
CREATE INDEX IF NOT EXISTS idx_staff_custom_text8 ON staff(staff_custom_text8);
CREATE INDEX IF NOT EXISTS idx_staff_custom_text9 ON staff(staff_custom_text9);
CREATE INDEX IF NOT EXISTS idx_staff_custom_text10 ON staff(staff_custom_text10);

-- ------------------------------------------------------------------------------
-- 4. DROP OLD INDEXES (they were for the dropped columns)
-- ------------------------------------------------------------------------------
DROP INDEX IF EXISTS idx_staff_custom_num1;
DROP INDEX IF EXISTS idx_staff_custom_num2;
DROP INDEX IF EXISTS idx_staff_custom_num3;

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
