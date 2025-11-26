-- ============================================================================
-- BOARDING SETUP SQL
-- ============================================================================
-- This script creates the necessary tables and fields for the Boarding 
-- module's Houses, Rooms, and Students functionality.
--
-- TABLES CREATED:
-- 1. boarding_houses - Stores boarding houses with personnel and amenities
-- 2. boarding_rooms - Stores rooms within houses
-- 3. boarding_accommodation_types - Stores customizable accommodation types
-- 4. boarding_house_personnel - Stores personnel assigned to houses
-- 5. boarding_house_amenities - Stores amenities for each house
--
-- MODIFICATIONS:
-- 1. Adds boarding_house_id column to students table
-- 2. Adds boarding_room_id column to students table
-- 3. Adds accommodation_type_id column to students table
--
-- WARNING: This script adds new columns to the students table.
-- The columns will be nullable, so existing data will not be affected.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CREATE boarding_accommodation_types TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS boarding_accommodation_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_boarding_accommodation_types_name ON boarding_accommodation_types(name);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_boarding_accommodation_types_created_at ON boarding_accommodation_types(created_at DESC);

-- ----------------------------------------------------------------------------
-- 2. CREATE boarding_houses TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS boarding_houses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    designation VARCHAR(255) NOT NULL, -- e.g., "Boys House - Senior", "Girls House - Grade 8-9"
    description TEXT,
    total_rooms INTEGER DEFAULT 0,
    total_capacity INTEGER DEFAULT 0,
    current_occupancy INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_boarding_houses_name ON boarding_houses(name);

-- Create index on designation for filtering
CREATE INDEX IF NOT EXISTS idx_boarding_houses_designation ON boarding_houses(designation);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_boarding_houses_created_at ON boarding_houses(created_at DESC);

-- ----------------------------------------------------------------------------
-- 3. CREATE boarding_house_personnel TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS boarding_house_personnel (
    id SERIAL PRIMARY KEY,
    house_id INTEGER NOT NULL REFERENCES boarding_houses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    designation VARCHAR(255) NOT NULL, -- e.g., "House Master", "House Mistress", "Assistant House Master"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_personnel_per_house UNIQUE (house_id, name, designation)
);

-- Create index on house_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_boarding_house_personnel_house_id ON boarding_house_personnel(house_id);

-- ----------------------------------------------------------------------------
-- 4. CREATE boarding_house_amenities TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS boarding_house_amenities (
    id SERIAL PRIMARY KEY,
    house_id INTEGER NOT NULL REFERENCES boarding_houses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_amenity_per_house UNIQUE (house_id, name)
);

-- Create index on house_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_boarding_house_amenities_house_id ON boarding_house_amenities(house_id);

-- ----------------------------------------------------------------------------
-- 5. CREATE boarding_rooms TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS boarding_rooms (
    id SERIAL PRIMARY KEY,
    house_id INTEGER NOT NULL REFERENCES boarding_houses(id) ON DELETE CASCADE,
    room_number VARCHAR(50) NOT NULL,
    floor INTEGER NOT NULL DEFAULT 1,
    capacity INTEGER NOT NULL DEFAULT 1,
    current_occupancy INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'vacant' CHECK (status IN ('fully-occupied', 'partially-occupied', 'vacant', 'maintenance', 'reserved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_room_per_house UNIQUE (house_id, room_number)
);

-- Create index on house_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_boarding_rooms_house_id ON boarding_rooms(house_id);

-- Create index on room_number for searches
CREATE INDEX IF NOT EXISTS idx_boarding_rooms_room_number ON boarding_rooms(room_number);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_boarding_rooms_status ON boarding_rooms(status);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_boarding_rooms_created_at ON boarding_rooms(created_at DESC);

-- ----------------------------------------------------------------------------
-- 6. CREATE boarding_room_amenities TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS boarding_room_amenities (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL REFERENCES boarding_rooms(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_amenity_per_room UNIQUE (room_id, name)
);

-- Create index on room_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_boarding_room_amenities_room_id ON boarding_room_amenities(room_id);

-- ----------------------------------------------------------------------------
-- 7. ADD COLUMNS TO students TABLE
-- ----------------------------------------------------------------------------
-- WARNING: This adds new columns to an existing table.
-- The columns are nullable, so existing student records will not be affected.
-- If the columns already exist, this will not cause an error due to IF NOT EXISTS.

-- Add boarding_house_id column
ALTER TABLE students
ADD COLUMN IF NOT EXISTS boarding_house_id INTEGER REFERENCES boarding_houses(id) ON DELETE SET NULL;

-- Add boarding_room_id column
ALTER TABLE students
ADD COLUMN IF NOT EXISTS boarding_room_id INTEGER REFERENCES boarding_rooms(id) ON DELETE SET NULL;

-- Add accommodation_type_id column
ALTER TABLE students
ADD COLUMN IF NOT EXISTS accommodation_type_id INTEGER REFERENCES boarding_accommodation_types(id) ON DELETE SET NULL;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_students_boarding_house_id ON students(boarding_house_id);
CREATE INDEX IF NOT EXISTS idx_students_boarding_room_id ON students(boarding_room_id);
CREATE INDEX IF NOT EXISTS idx_students_accommodation_type_id ON students(accommodation_type_id);

-- ----------------------------------------------------------------------------
-- 8. CREATE TRIGGER FUNCTIONS FOR updated_at
-- ----------------------------------------------------------------------------
-- Function for boarding_houses
CREATE OR REPLACE FUNCTION update_boarding_houses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function for boarding_rooms
CREATE OR REPLACE FUNCTION update_boarding_rooms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function for boarding_accommodation_types
CREATE OR REPLACE FUNCTION update_boarding_accommodation_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ----------------------------------------------------------------------------
-- 9. CREATE TRIGGERS
-- ----------------------------------------------------------------------------
-- Trigger for boarding_houses
DROP TRIGGER IF EXISTS update_boarding_houses_updated_at ON boarding_houses;
CREATE TRIGGER update_boarding_houses_updated_at
    BEFORE UPDATE ON boarding_houses
    FOR EACH ROW
    EXECUTE FUNCTION update_boarding_houses_updated_at();

-- Trigger for boarding_rooms
DROP TRIGGER IF EXISTS update_boarding_rooms_updated_at ON boarding_rooms;
CREATE TRIGGER update_boarding_rooms_updated_at
    BEFORE UPDATE ON boarding_rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_boarding_rooms_updated_at();

-- Trigger for boarding_accommodation_types
DROP TRIGGER IF EXISTS update_boarding_accommodation_types_updated_at ON boarding_accommodation_types;
CREATE TRIGGER update_boarding_accommodation_types_updated_at
    BEFORE UPDATE ON boarding_accommodation_types
    FOR EACH ROW
    EXECUTE FUNCTION update_boarding_accommodation_types_updated_at();

-- ----------------------------------------------------------------------------
-- 10. CREATE FUNCTION TO UPDATE HOUSE STATISTICS
-- ----------------------------------------------------------------------------
-- Function to automatically update house total_rooms, total_capacity, and current_occupancy
CREATE OR REPLACE FUNCTION update_boarding_house_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE boarding_houses
    SET 
        total_rooms = (
            SELECT COUNT(*) 
            FROM boarding_rooms 
            WHERE house_id = COALESCE(NEW.house_id, OLD.house_id)
        ),
        total_capacity = (
            SELECT COALESCE(SUM(capacity), 0)
            FROM boarding_rooms 
            WHERE house_id = COALESCE(NEW.house_id, OLD.house_id)
        ),
        current_occupancy = (
            SELECT COALESCE(SUM(current_occupancy), 0)
            FROM boarding_rooms 
            WHERE house_id = COALESCE(NEW.house_id, OLD.house_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.house_id, OLD.house_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Trigger to update house stats when rooms are inserted, updated, or deleted
DROP TRIGGER IF EXISTS update_boarding_house_stats_on_room_change ON boarding_rooms;
CREATE TRIGGER update_boarding_house_stats_on_room_change
    AFTER INSERT OR UPDATE OR DELETE ON boarding_rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_boarding_house_stats();

-- ----------------------------------------------------------------------------
-- END OF SCRIPT
-- ----------------------------------------------------------------------------

