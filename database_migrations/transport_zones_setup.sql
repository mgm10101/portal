-- ============================================================================
-- TRANSPORT ZONES SETUP SQL
-- ============================================================================
-- This script creates the necessary tables and fields for the Transport 
-- module's Students and Zones functionality.
--
-- TABLES CREATED:
-- 1. transport_zones - Stores transport zones (groupings of locations for billing)
-- 2. transport_zone_areas - Stores areas/locations within each zone
--
-- MODIFICATIONS:
-- 1. Adds transport_zone_id column to students table
--
-- WARNING: This script adds a new column to the students table.
-- The column will be nullable, so existing data will not be affected.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CREATE transport_zones TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transport_zones (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_transport_zones_name ON transport_zones(name);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_transport_zones_created_at ON transport_zones(created_at DESC);

-- ----------------------------------------------------------------------------
-- 2. CREATE transport_zone_areas TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transport_zone_areas (
    id SERIAL PRIMARY KEY,
    zone_id INTEGER NOT NULL REFERENCES transport_zones(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_area_per_zone UNIQUE (zone_id, name)
);

-- Create index on zone_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_transport_zone_areas_zone_id ON transport_zone_areas(zone_id);

-- Create index on name for faster searches
CREATE INDEX IF NOT EXISTS idx_transport_zone_areas_name ON transport_zone_areas(name);

-- ----------------------------------------------------------------------------
-- 3. ADD transport_zone_id COLUMN TO students TABLE
-- ----------------------------------------------------------------------------
-- WARNING: This adds a new column to an existing table.
-- The column is nullable, so existing student records will not be affected.
-- If the column already exists, this will not cause an error due to IF NOT EXISTS.
ALTER TABLE students
ADD COLUMN IF NOT EXISTS transport_zone_id INTEGER REFERENCES transport_zones(id) ON DELETE SET NULL;

-- Create index on transport_zone_id for faster queries when filtering by zone
CREATE INDEX IF NOT EXISTS idx_students_transport_zone_id ON students(transport_zone_id);

-- ----------------------------------------------------------------------------
-- 4. CREATE TRIGGER FUNCTION FOR updated_at IN transport_zones
-- ----------------------------------------------------------------------------
-- Create or replace function to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_transport_zones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at when transport_zones row is updated
DROP TRIGGER IF EXISTS update_transport_zones_updated_at ON transport_zones;
CREATE TRIGGER update_transport_zones_updated_at
    BEFORE UPDATE ON transport_zones
    FOR EACH ROW
    EXECUTE FUNCTION update_transport_zones_updated_at();

-- ----------------------------------------------------------------------------
-- END OF SCRIPT
-- ----------------------------------------------------------------------------

