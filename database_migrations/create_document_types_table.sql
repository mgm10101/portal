-- Create document_types table for customizable document fields
CREATE TABLE IF NOT EXISTS document_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sort_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add documents JSONB column to students table to store document statuses
ALTER TABLE students
ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '{}'::jsonb;

-- Add some default document types (optional - you can delete these rows if you want a completely clean slate)
-- Uncomment the lines below if you want to start with some default document types:
-- INSERT INTO document_types (name, sort_order) VALUES
-- ('Birth Certificate', 0),
-- ('Copy of Parents'' ID', 1),
-- ('Immunization Records', 2),
-- ('Passport Sized Photos', 3);

-- Remove old hardcoded document columns (optional - only run if you want to clean up)
-- WARNING: This will delete existing document data in these columns
-- Uncomment the lines below only if you're sure you want to remove the old columns:
-- ALTER TABLE students DROP COLUMN IF EXISTS birth_certificate_status;
-- ALTER TABLE students DROP COLUMN IF EXISTS parents_id_status;
-- ALTER TABLE students DROP COLUMN IF EXISTS immunization_records_status;
-- ALTER TABLE students DROP COLUMN IF EXISTS passport_photos_status;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_document_types_sort_order ON document_types(sort_order);
CREATE INDEX IF NOT EXISTS idx_students_documents ON students USING gin(documents);

-- Grant necessary permissions (adjust role name as needed)
-- GRANT ALL ON document_types TO your_role_name;
-- GRANT USAGE, SELECT ON SEQUENCE document_types_id_seq TO your_role_name;

