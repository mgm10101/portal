-- Add gender column to students table with check constraint
-- This migration adds a gender field with options: Male, Female, Custom

-- Add the gender column (nullable to allow existing records)
ALTER TABLE students
ADD COLUMN IF NOT EXISTS gender VARCHAR(20);

-- Add check constraint to enforce valid values
ALTER TABLE students
ADD CONSTRAINT students_gender_check 
CHECK (gender IS NULL OR gender IN ('Male', 'Female', 'Custom'));

-- Optional: Add a comment to document the column
COMMENT ON COLUMN students.gender IS 'Student gender: Male, Female, or Custom';

