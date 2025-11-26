-- ============================================================================
-- UPDATE EXISTING TRANSPORT TYPES
-- ============================================================================
-- This script updates existing students who have a transport_zone_id assigned
-- but no transport_type_id, setting their type to "Two Way" by default
-- ============================================================================

-- Update all students who have a zone assigned but no type
-- Set their transport_type_id to "Two Way" (assuming it exists with id from the default insert)
UPDATE students
SET transport_type_id = (
    SELECT id 
    FROM transport_types 
    WHERE name = 'Two Way' 
    LIMIT 1
)
WHERE transport_zone_id IS NOT NULL 
  AND transport_type_id IS NULL
  AND status = 'Active';

-- Show how many records were updated
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Updated % students with default "Two Way" transport type', updated_count;
END $$;

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================

