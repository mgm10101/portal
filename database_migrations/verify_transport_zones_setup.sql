-- ============================================================================
-- VERIFICATION SQL FOR TRANSPORT ZONES SETUP
-- ============================================================================
-- This script verifies that all the necessary tables and columns exist
-- for the Transport module's Students and Zones functionality.
-- Run this BEFORE running the main setup script to check what exists.
-- Run this AFTER running the main setup script to verify everything was created.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CHECK IF transport_zones TABLE EXISTS
-- ----------------------------------------------------------------------------
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'transport_zones'
        ) 
        THEN '✓ transport_zones table exists'
        ELSE '✗ transport_zones table DOES NOT exist'
    END AS transport_zones_table_status;

-- Check columns in transport_zones table (if it exists)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'transport_zones'
ORDER BY ordinal_position;

-- ----------------------------------------------------------------------------
-- 2. CHECK IF transport_zone_areas TABLE EXISTS
-- ----------------------------------------------------------------------------
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'transport_zone_areas'
        ) 
        THEN '✓ transport_zone_areas table exists'
        ELSE '✗ transport_zone_areas table DOES NOT exist'
    END AS transport_zone_areas_table_status;

-- Check columns in transport_zone_areas table (if it exists)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'transport_zone_areas'
ORDER BY ordinal_position;

-- ----------------------------------------------------------------------------
-- 3. CHECK IF transport_zone_id COLUMN EXISTS IN students TABLE
-- ----------------------------------------------------------------------------
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public' 
                AND table_name = 'students'
                AND column_name = 'transport_zone_id'
        ) 
        THEN '✓ transport_zone_id column exists in students table'
        ELSE '✗ transport_zone_id column DOES NOT exist in students table'
    END AS transport_zone_id_column_status;

-- Check if students table exists and show relevant columns
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'students'
    AND column_name IN ('id', 'admission_number', 'name', 'current_class_id', 'transport_zone_id')
ORDER BY 
    CASE column_name
        WHEN 'id' THEN 1
        WHEN 'admission_number' THEN 2
        WHEN 'name' THEN 3
        WHEN 'current_class_id' THEN 4
        WHEN 'transport_zone_id' THEN 5
    END;

-- ----------------------------------------------------------------------------
-- 4. CHECK FOREIGN KEY CONSTRAINTS
-- ----------------------------------------------------------------------------
-- Check foreign key from transport_zone_areas to transport_zones
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND (
        (tc.table_name = 'transport_zone_areas' AND ccu.table_name = 'transport_zones')
        OR (tc.table_name = 'students' AND ccu.table_name = 'transport_zones' AND kcu.column_name = 'transport_zone_id')
    );

-- ----------------------------------------------------------------------------
-- 5. CHECK INDEXES
-- ----------------------------------------------------------------------------
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND (
        tablename = 'transport_zones'
        OR tablename = 'transport_zone_areas'
        OR (tablename = 'students' AND indexname LIKE '%transport_zone%')
    )
ORDER BY tablename, indexname;

-- ----------------------------------------------------------------------------
-- 6. COUNT RECORDS IN TABLES (if they exist)
-- ----------------------------------------------------------------------------
-- Count zones
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'transport_zones'
        )
        THEN (SELECT COUNT(*)::text || ' zones' FROM transport_zones)
        ELSE 'N/A - table does not exist'
    END AS transport_zones_count;

-- Count zone areas
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'transport_zone_areas'
        )
        THEN (SELECT COUNT(*)::text || ' zone areas' FROM transport_zone_areas)
        ELSE 'N/A - table does not exist'
    END AS transport_zone_areas_count;

-- Count students with zones assigned
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public' 
                AND table_name = 'students'
                AND column_name = 'transport_zone_id'
        )
        THEN (
            SELECT 
                COUNT(*)::text || ' total students, ' ||
                COUNT(*) FILTER (WHERE transport_zone_id IS NOT NULL)::text || ' with zones, ' ||
                COUNT(*) FILTER (WHERE transport_zone_id IS NULL)::text || ' unassigned'
            FROM students
        )
        ELSE 'N/A - column does not exist'
    END AS students_zone_status;

-- ----------------------------------------------------------------------------
-- END OF VERIFICATION SCRIPT
-- ----------------------------------------------------------------------------

