-- ============================================================================
-- ADD CUSTOM TEXT COLUMNS TO STUDENTS TABLE
-- ============================================================================
-- This script adds student_custom_text6-10 columns to the students table
-- without removing any existing columns to avoid interference
-- ============================================================================

-- ------------------------------------------------------------------------------
-- 1. ADD NEW CUSTOM TEXT COLUMNS TO STUDENTS TABLE
-- ------------------------------------------------------------------------------
ALTER TABLE students ADD COLUMN IF NOT EXISTS student_custom_text6 TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS student_custom_text7 TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS student_custom_text8 TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS student_custom_text9 TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS student_custom_text10 TEXT;

-- ------------------------------------------------------------------------------
-- 2. CREATE INDEXES FOR NEW COLUMNS
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_students_student_custom_text6 ON students(student_custom_text6);
CREATE INDEX IF NOT EXISTS idx_students_student_custom_text7 ON students(student_custom_text7);
CREATE INDEX IF NOT EXISTS idx_students_student_custom_text8 ON students(student_custom_text8);
CREATE INDEX IF NOT EXISTS idx_students_student_custom_text9 ON students(student_custom_text9);
CREATE INDEX IF NOT EXISTS idx_students_student_custom_text10 ON students(student_custom_text10);

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
