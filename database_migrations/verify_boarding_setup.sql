-- ============================================================================
-- VERIFICATION SQL FOR BOARDING SETUP
-- ============================================================================
-- This script verifies that all the necessary tables and columns exist
-- for the Boarding module's Houses, Rooms, and Students functionality.
-- Run this BEFORE running the main setup script to check what exists.
-- Run this AFTER running the main setup script to verify everything was created.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CHECK IF boarding_accommodation_types TABLE EXISTS
-- ----------------------------------------------------------------------------
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'boarding_accommodation_types'
        ) 
        THEN '✓ boarding_accommodation_types table exists'
        ELSE '✗ boarding_accommodation_types table DOES NOT exist'
    END AS boarding_accommodation_types_table_status;

-- Check columns in boarding_accommodation_types table (if it exists)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'boarding_accommodation_types'
ORDER BY ordinal_position;

-- ----------------------------------------------------------------------------
-- 2. CHECK IF boarding_houses TABLE EXISTS
-- ----------------------------------------------------------------------------
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'boarding_houses'
        ) 
        THEN '✓ boarding_houses table exists'
        ELSE '✗ boarding_houses table DOES NOT exist'
    END AS boarding_houses_table_status;

-- Check columns in boarding_houses table (if it exists)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'boarding_houses'
ORDER BY ordinal_position;

-- ----------------------------------------------------------------------------
-- 3. CHECK IF boarding_house_personnel TABLE EXISTS
-- ----------------------------------------------------------------------------
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'boarding_house_personnel'
        ) 
        THEN '✓ boarding_house_personnel table exists'
        ELSE '✗ boarding_house_personnel table DOES NOT exist'
    END AS boarding_house_personnel_table_status;

-- Check columns in boarding_house_personnel table (if it exists)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'boarding_house_personnel'
ORDER BY ordinal_position;

-- ----------------------------------------------------------------------------
-- 4. CHECK IF boarding_house_amenities TABLE EXISTS
-- ----------------------------------------------------------------------------
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'boarding_house_amenities'
        ) 
        THEN '✓ boarding_house_amenities table exists'
        ELSE '✗ boarding_house_amenities table DOES NOT exist'
    END AS boarding_house_amenities_table_status;

-- Check columns in boarding_house_amenities table (if it exists)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'boarding_house_amenities'
ORDER BY ordinal_position;

-- ----------------------------------------------------------------------------
-- 5. CHECK IF boarding_rooms TABLE EXISTS
-- ----------------------------------------------------------------------------
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'boarding_rooms'
        ) 
        THEN '✓ boarding_rooms table exists'
        ELSE '✗ boarding_rooms table DOES NOT exist'
    END AS boarding_rooms_table_status;

-- Check columns in boarding_rooms table (if it exists)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'boarding_rooms'
ORDER BY ordinal_position;

-- ----------------------------------------------------------------------------
-- 6. CHECK IF boarding_room_amenities TABLE EXISTS
-- ----------------------------------------------------------------------------
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'boarding_room_amenities'
        ) 
        THEN '✓ boarding_room_amenities table exists'
        ELSE '✗ boarding_room_amenities table DOES NOT exist'
    END AS boarding_room_amenities_table_status;

-- Check columns in boarding_room_amenities table (if it exists)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'boarding_room_amenities'
ORDER BY ordinal_position;

-- ----------------------------------------------------------------------------
-- 7. CHECK IF COLUMNS EXIST IN students TABLE
-- ----------------------------------------------------------------------------
-- Check boarding_house_id column
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = 'students'
            AND column_name = 'boarding_house_id'
        )
        THEN '✓ boarding_house_id column exists in students table'
        ELSE '✗ boarding_house_id column DOES NOT exist in students table'
    END AS boarding_house_id_column_status;

-- Check boarding_room_id column
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = 'students'
            AND column_name = 'boarding_room_id'
        )
        THEN '✓ boarding_room_id column exists in students table'
        ELSE '✗ boarding_room_id column DOES NOT exist in students table'
    END AS boarding_room_id_column_status;

-- Check accommodation_type_id column
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = 'students'
            AND column_name = 'accommodation_type_id'
        )
        THEN '✓ accommodation_type_id column exists in students table'
        ELSE '✗ accommodation_type_id column DOES NOT exist in students table'
    END AS accommodation_type_id_column_status;

-- Show all boarding-related columns in students table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'students'
    AND column_name IN ('boarding_house_id', 'boarding_room_id', 'accommodation_type_id')
ORDER BY ordinal_position;

-- ----------------------------------------------------------------------------
-- 8. CHECK FOREIGN KEY CONSTRAINTS
-- ----------------------------------------------------------------------------
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
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
        tc.table_name LIKE 'boarding_%'
        OR (tc.table_name = 'students' AND kcu.column_name LIKE '%boarding%')
        OR (tc.table_name = 'students' AND kcu.column_name = 'accommodation_type_id')
    )
ORDER BY tc.table_name, kcu.column_name;

-- ----------------------------------------------------------------------------
-- 9. CHECK INDEXES
-- ----------------------------------------------------------------------------
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND (
        tablename LIKE 'boarding_%'
        OR (tablename = 'students' AND indexname LIKE '%boarding%')
        OR (tablename = 'students' AND indexname LIKE '%accommodation%')
    )
ORDER BY tablename, indexname;

-- ----------------------------------------------------------------------------
-- 10. COUNT RECORDS IN TABLES (if they exist)
-- ----------------------------------------------------------------------------
-- Count accommodation types
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'boarding_accommodation_types'
        )
        THEN (SELECT COUNT(*)::text || ' accommodation types' FROM boarding_accommodation_types)
        ELSE 'N/A - table does not exist'
    END AS accommodation_types_count;

-- Count houses
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'boarding_houses'
        )
        THEN (SELECT COUNT(*)::text || ' houses' FROM boarding_houses)
        ELSE 'N/A - table does not exist'
    END AS houses_count;

-- Count rooms
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'boarding_rooms'
        )
        THEN (SELECT COUNT(*)::text || ' rooms' FROM boarding_rooms)
        ELSE 'N/A - table does not exist'
    END AS rooms_count;

-- Count students with boarding assignments
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = 'students'
            AND column_name = 'boarding_house_id'
        )
        THEN (
            SELECT 
                COUNT(*)::text || ' students assigned to houses, ' ||
                COUNT(CASE WHEN boarding_room_id IS NOT NULL THEN 1 END)::text || ' assigned to rooms'
            FROM students
            WHERE boarding_house_id IS NOT NULL
        )
        ELSE 'N/A - columns do not exist'
    END AS students_boarding_count;

-- ----------------------------------------------------------------------------
-- END OF VERIFICATION SCRIPT
-- ----------------------------------------------------------------------------

