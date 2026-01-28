-- ============================================================================
-- ADD 'RESIGNED' STATUS TO STAFF TABLE
-- ============================================================================
-- This script adds the 'Resigned' status to the staff table's status column
-- CHECK constraint, allowing staff members to be marked as resigned.
-- ============================================================================

-- Drop the existing CHECK constraint
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_status_check;

-- Add a new CHECK constraint that includes 'Resigned'
ALTER TABLE staff 
ADD CONSTRAINT staff_status_check 
CHECK (status IN ('Active', 'On Leave', 'Suspended', 'Terminated', 'Retired', 'Resigned'));

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
