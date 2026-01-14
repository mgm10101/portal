-- Add report_access column to users table
-- This column will store a JSON array of report IDs that the user has access to

-- First, check if the column already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'report_access'
    ) THEN
        -- Add the report_access column as JSONB type for efficient JSON operations
        ALTER TABLE users 
        ADD COLUMN report_access JSONB;
        
        -- Add comment to describe the column
        COMMENT ON COLUMN users.report_access IS 'JSON array of report IDs that the user has access to. If null, user has access to all reports when Reports module is assigned.';
        
        -- Create index for better performance on report_access queries
        CREATE INDEX idx_users_report_access ON users USING GIN (report_access);
        
        RAISE NOTICE 'report_access column added successfully to users table';
    ELSE
        RAISE NOTICE 'report_access column already exists in users table';
    END IF;
END $$;

-- Example queries for working with report_access:

-- 1. Get users who have access to a specific report
SELECT id, username, email 
FROM users 
WHERE report_access IS NOT NULL 
AND report_access ? 'students-by-class';

-- 2. Get all reports a user has access to
SELECT username, email, report_access 
FROM users 
WHERE id = 'user_id_here';

-- 3. Check if user has access to any reports in a specific category
SELECT username, email 
FROM users 
WHERE report_access IS NOT NULL 
AND EXISTS (
    SELECT 1 
    FROM jsonb_array_elements_text(report_access) AS report_id
    WHERE report_id IN (
        SELECT id FROM unnest(ARRAY[
            'students-by-class', 'attendance-summary', 'assessment-averages', 'academic-performance',
            'medical-summary', 'disciplinary-records', 'transport-summary', 'boarding-summary',
            'enrollment-trends', 'students-by-teams', 'age-group-analysis'
        ]) AS id
    )
);

-- 4. Update user's report access
UPDATE users 
SET report_access = '["students-by-class", "attendance-summary", "financial-summary"]'::JSONB
WHERE id = 'user_id_here';

-- 5. Remove report access for a user
UPDATE users 
SET report_access = NULL 
WHERE id = 'user_id_here';

-- 6. Add a specific report to user's existing access
UPDATE users 
SET report_access = jsonb_set(
    report_access, 
    '0', 
    COALESCE(report_access, '[]'::JSONB) || '["new-report-id"]'::JSONB
)
WHERE id = 'user_id_here' AND NOT (report_access ? 'new-report-id');

-- Sample data for testing:
INSERT INTO users (id, username, email, role, report_access) VALUES
('test-user-1', 'testuser1', 'test1@example.com', 'Custom', '["students-by-class", "financial-summary"]'::JSONB),
('test-user-2', 'testuser2', 'test2@example.com', 'Admin', '["students-by-class", "attendance-summary", "disciplinary-records"]'::JSONB),
('test-user-3', 'testuser3', 'test3@example.com', 'Teacher', NULL); -- NULL means access to all reports

-- Query to verify the setup:
SELECT 
    id, 
    username, 
    email, 
    role, 
    report_access,
    CASE 
        WHEN report_access IS NULL THEN 'All Reports'
        WHEN jsonb_array_length(report_access) = 0 THEN 'No Reports'
        ELSE jsonb_array_length(report_access)::text || ' Reports'
    END as access_level
FROM users 
ORDER BY username;
