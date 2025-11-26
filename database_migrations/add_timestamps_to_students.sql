-- Add timestamp columns to students table for tracking creation and updates
-- This allows sorting by "last modified" to show newly added/updated students on top

-- Add created_at column (defaults to current timestamp for new records)
ALTER TABLE students
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add updated_at column (defaults to current timestamp)
ALTER TABLE students
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Set existing records' created_at and updated_at to NOW() if they're NULL
UPDATE students
SET created_at = NOW()
WHERE created_at IS NULL;

UPDATE students
SET updated_at = NOW()
WHERE updated_at IS NULL;

-- Create a function to automatically update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to call the function before any UPDATE on students table
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance when sorting
CREATE INDEX IF NOT EXISTS idx_students_created_at ON students(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_students_updated_at ON students(updated_at DESC);

