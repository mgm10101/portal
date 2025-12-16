-- Add number_of_leave_days column to staff table
-- This field stores the number of leave days allocated to a staff member per year

ALTER TABLE staff
ADD COLUMN number_of_leave_days INTEGER;

-- Add a comment to document the column
COMMENT ON COLUMN staff.number_of_leave_days IS 'Number of leave days allocated to the staff member per year';

