-- ============================================================================
-- TRANSPORT TYPES SETUP
-- ============================================================================
-- This script creates the transport_types table and adds the transport_type_id
-- column to the students table for managing transport types (e.g., One Way, Two Way)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CREATE transport_types TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transport_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_transport_types_name ON transport_types(name);

-- Create index on sort_order for ordering
CREATE INDEX IF NOT EXISTS idx_transport_types_sort_order ON transport_types(sort_order);

-- ----------------------------------------------------------------------------
-- 2. ADD transport_type_id COLUMN TO students TABLE
-- ----------------------------------------------------------------------------
-- Add transport_type_id column to students table
ALTER TABLE students
ADD COLUMN IF NOT EXISTS transport_type_id INTEGER REFERENCES transport_types(id) ON DELETE SET NULL;

-- Create index on transport_type_id for faster queries
CREATE INDEX IF NOT EXISTS idx_students_transport_type_id ON students(transport_type_id);

-- ----------------------------------------------------------------------------
-- 3. INSERT DEFAULT TRANSPORT TYPES
-- ----------------------------------------------------------------------------
-- Insert some default transport types if they don't exist
INSERT INTO transport_types (name, sort_order)
VALUES 
    ('One Way', 1),
    ('Two Way', 2)
ON CONFLICT (name) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. CREATE TRIGGER FUNCTION FOR updated_at
-- ----------------------------------------------------------------------------
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_transport_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at when transport_types are updated
DROP TRIGGER IF EXISTS update_transport_types_updated_at_trigger ON transport_types;
CREATE TRIGGER update_transport_types_updated_at_trigger
    BEFORE UPDATE ON transport_types
    FOR EACH ROW
    EXECUTE FUNCTION update_transport_types_updated_at();

-- ----------------------------------------------------------------------------
-- END OF SCRIPT
-- ----------------------------------------------------------------------------

