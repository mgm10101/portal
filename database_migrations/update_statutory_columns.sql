-- ============================================================================
-- UPDATE STATUTORY COLUMNS - REMOVE NUMERIC, ADD MORE TEXT COLUMNS
-- ============================================================================
-- This script removes statutory_num1-3 columns and adds statutory_text6-10
-- ============================================================================

-- ------------------------------------------------------------------------------
-- 1. DROP STATUTORY NUMERIC COLUMNS
-- ------------------------------------------------------------------------------
ALTER TABLE staff DROP COLUMN IF EXISTS statutory_num1;
ALTER TABLE staff DROP COLUMN IF EXISTS statutory_num2;
ALTER TABLE staff DROP COLUMN IF EXISTS statutory_num3;

-- ------------------------------------------------------------------------------
-- 2. ADD NEW STATUTORY TEXT COLUMNS
-- ------------------------------------------------------------------------------
ALTER TABLE staff ADD COLUMN IF NOT EXISTS statutory_text6 TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS statutory_text7 TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS statutory_text8 TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS statutory_text9 TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS statutory_text10 TEXT;

-- ------------------------------------------------------------------------------
-- 3. CREATE INDEXES FOR NEW COLUMNS
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_staff_statutory_text6 ON staff(statutory_text6);
CREATE INDEX IF NOT EXISTS idx_staff_statutory_text7 ON staff(statutory_text7);
CREATE INDEX IF NOT EXISTS idx_staff_statutory_text8 ON staff(statutory_text8);
CREATE INDEX IF NOT EXISTS idx_staff_statutory_text9 ON staff(statutory_text9);
CREATE INDEX IF NOT EXISTS idx_staff_statutory_text10 ON staff(statutory_text10);

-- ------------------------------------------------------------------------------
-- 4. DROP OLD INDEXES (they were for the dropped columns)
-- ------------------------------------------------------------------------------
DROP INDEX IF EXISTS idx_staff_statutory_num1;
DROP INDEX IF EXISTS idx_staff_statutory_num2;
DROP INDEX IF EXISTS idx_staff_statutory_num3;

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
