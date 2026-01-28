-- ============================================================================
-- ADD STATUTORY DETAILS TO STAFF MODULE
-- ============================================================================
-- This script creates the statutory_fields table and adds statutory detail 
-- columns to the staff table, following the exact same pattern as custom fields.
-- ============================================================================

-- ------------------------------------------------------------------------------
-- 1. ADD STATUTORY DETAIL COLUMNS TO STAFF TABLE
-- ------------------------------------------------------------------------------
ALTER TABLE staff ADD COLUMN IF NOT EXISTS statutory_text1 TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS statutory_text2 TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS statutory_text3 TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS statutory_text4 TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS statutory_text5 TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS statutory_num1 TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS statutory_num2 TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS statutory_num3 TEXT;

-- Change existing numeric columns to text if they exist
DO $$
BEGIN
    -- Check if column exists and is numeric, then change to text
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='staff' AND column_name='statutory_num1' 
        AND data_type='numeric'
    ) THEN
        ALTER TABLE staff ALTER COLUMN statutory_num1 TYPE TEXT USING statutory_num1::TEXT;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='staff' AND column_name='statutory_num2' 
        AND data_type='numeric'
    ) THEN
        ALTER TABLE staff ALTER COLUMN statutory_num2 TYPE TEXT USING statutory_num2::TEXT;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='staff' AND column_name='statutory_num3' 
        AND data_type='numeric'
    ) THEN
        ALTER TABLE staff ALTER COLUMN statutory_num3 TYPE TEXT USING statutory_num3::TEXT;
    END IF;
END $$;

-- Create indexes for statutory detail columns
CREATE INDEX IF NOT EXISTS idx_staff_statutory_text1 ON staff(statutory_text1);
CREATE INDEX IF NOT EXISTS idx_staff_statutory_text2 ON staff(statutory_text2);
CREATE INDEX IF NOT EXISTS idx_staff_statutory_text3 ON staff(statutory_text3);
CREATE INDEX IF NOT EXISTS idx_staff_statutory_text4 ON staff(statutory_text4);
CREATE INDEX IF NOT EXISTS idx_staff_statutory_text5 ON staff(statutory_text5);
CREATE INDEX IF NOT EXISTS idx_staff_statutory_num1 ON staff(statutory_num1);
CREATE INDEX IF NOT EXISTS idx_staff_statutory_num2 ON staff(statutory_num2);
CREATE INDEX IF NOT EXISTS idx_staff_statutory_num3 ON staff(statutory_num3);

-- ------------------------------------------------------------------------------
-- 2. CREATE statutory_fields TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS statutory_fields (
    field_id VARCHAR(50) PRIMARY KEY,
    field_name VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('Text Input', 'Dropdown')),
    options TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_statutory_fields_field_name ON statutory_fields(field_name);

-- ------------------------------------------------------------------------------
-- 3. FUNCTION: Update updated_at timestamp for statutory_fields
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_statutory_fields_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 4. TRIGGER: Update updated_at on statutory_fields
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_update_statutory_fields_updated_at ON statutory_fields;
CREATE TRIGGER trigger_update_statutory_fields_updated_at
    BEFORE UPDATE ON statutory_fields
    FOR EACH ROW
    EXECUTE FUNCTION update_statutory_fields_updated_at_column();

-- ------------------------------------------------------------------------------
-- 5. INSERT DEFAULT STATUTORY FIELDS (Optional Examples)
-- ------------------------------------------------------------------------------
INSERT INTO statutory_fields (field_id, field_name, field_type, options)
VALUES 
    ('statutory_text1', 'KRA Pin', 'Text Input', ARRAY[]::TEXT[]),
    ('statutory_text2', 'NSSF Number', 'Text Input', ARRAY[]::TEXT[]),
    ('statutory_text3', 'NHIF Number', 'Text Input', ARRAY[]::TEXT[]),
    ('statutory_text4', 'Bank Account Number', 'Text Input', ARRAY[]::TEXT[]),
    ('statutory_text5', 'Passport Number', 'Text Input', ARRAY[]::TEXT[])
ON CONFLICT (field_id) DO NOTHING;

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
