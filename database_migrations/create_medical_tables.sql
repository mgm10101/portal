-- ============================================================================
-- MEDICAL SECTION TABLES FOR STUDENTS
-- ============================================================================
-- This migration creates tables for managing student medical information:
-- 1. Master tables for customizable dropdowns (allergies, medical_conditions, emergency_medications)
-- 2. Junction tables for multiple entries per student (student_allergies, student_medical_conditions, student_emergency_medications)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CREATE ALLERGIES TABLE (Customizable Dropdown)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS allergies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_allergies_sort_order ON allergies(sort_order);

-- Add comments
COMMENT ON TABLE allergies IS 'Master table for student allergies (customizable dropdown)';
COMMENT ON COLUMN allergies.name IS 'Name of the allergy (e.g., Peanuts, Dairy)';
COMMENT ON COLUMN allergies.sort_order IS 'Order for displaying allergies in dropdown';

-- ----------------------------------------------------------------------------
-- 2. CREATE MEDICAL CONDITIONS TABLE (Customizable Dropdown)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medical_conditions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_medical_conditions_sort_order ON medical_conditions(sort_order);

-- Add comments
COMMENT ON TABLE medical_conditions IS 'Master table for student medical conditions (customizable dropdown)';
COMMENT ON COLUMN medical_conditions.name IS 'Name of the medical condition (e.g., Diabetes, Sickle Cell)';
COMMENT ON COLUMN medical_conditions.sort_order IS 'Order for displaying conditions in dropdown';

-- ----------------------------------------------------------------------------
-- 3. CREATE EMERGENCY MEDICATIONS TABLE (Customizable Dropdown)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS emergency_medications (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_emergency_medications_sort_order ON emergency_medications(sort_order);

-- Add comments
COMMENT ON TABLE emergency_medications IS 'Master table for student emergency medications (customizable dropdown)';
COMMENT ON COLUMN emergency_medications.name IS 'Name of the emergency medication (e.g., Epipen, Asthma Inhaler)';
COMMENT ON COLUMN emergency_medications.sort_order IS 'Order for displaying medications in dropdown';

-- ----------------------------------------------------------------------------
-- 4. CREATE STUDENT_ALLERGIES JUNCTION TABLE (Multiple Allergies per Student)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_allergies (
    id SERIAL PRIMARY KEY,
    admission_number VARCHAR(50) NOT NULL REFERENCES students(admission_number) ON DELETE CASCADE ON UPDATE CASCADE,
    allergy_id INTEGER NOT NULL REFERENCES allergies(id) ON DELETE RESTRICT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Prevent duplicate entries for same student and allergy
    UNIQUE(admission_number, allergy_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_student_allergies_admission_number ON student_allergies(admission_number);
CREATE INDEX IF NOT EXISTS idx_student_allergies_allergy_id ON student_allergies(allergy_id);

-- Add comments
COMMENT ON TABLE student_allergies IS 'Junction table linking students to their allergies (supports multiple allergies per student)';
COMMENT ON COLUMN student_allergies.notes IS 'Additional details about the allergy for this specific student';

-- ----------------------------------------------------------------------------
-- 5. CREATE STUDENT_MEDICAL_CONDITIONS JUNCTION TABLE (Multiple Conditions per Student)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_medical_conditions (
    id SERIAL PRIMARY KEY,
    admission_number VARCHAR(50) NOT NULL REFERENCES students(admission_number) ON DELETE CASCADE ON UPDATE CASCADE,
    medical_condition_id INTEGER NOT NULL REFERENCES medical_conditions(id) ON DELETE RESTRICT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Prevent duplicate entries for same student and condition
    UNIQUE(admission_number, medical_condition_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_student_medical_conditions_admission_number ON student_medical_conditions(admission_number);
CREATE INDEX IF NOT EXISTS idx_student_medical_conditions_condition_id ON student_medical_conditions(medical_condition_id);

-- Add comments
COMMENT ON TABLE student_medical_conditions IS 'Junction table linking students to their medical conditions (supports multiple conditions per student)';
COMMENT ON COLUMN student_medical_conditions.notes IS 'Additional details about the medical condition for this specific student';

-- ----------------------------------------------------------------------------
-- 6. CREATE STUDENT_EMERGENCY_MEDICATIONS JUNCTION TABLE (Multiple Medications per Student)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_emergency_medications (
    id SERIAL PRIMARY KEY,
    admission_number VARCHAR(50) NOT NULL REFERENCES students(admission_number) ON DELETE CASCADE ON UPDATE CASCADE,
    emergency_medication_id INTEGER NOT NULL REFERENCES emergency_medications(id) ON DELETE RESTRICT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Prevent duplicate entries for same student and medication
    UNIQUE(admission_number, emergency_medication_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_student_emergency_medications_admission_number ON student_emergency_medications(admission_number);
CREATE INDEX IF NOT EXISTS idx_student_emergency_medications_medication_id ON student_emergency_medications(emergency_medication_id);

-- Add comments
COMMENT ON TABLE student_emergency_medications IS 'Junction table linking students to their emergency medications (supports multiple medications per student)';
COMMENT ON COLUMN student_emergency_medications.notes IS 'Additional details about the emergency medication for this specific student';

-- ----------------------------------------------------------------------------
-- 7. INSERT SAMPLE DATA (Current placeholder values)
-- ----------------------------------------------------------------------------

-- Insert Allergies
INSERT INTO allergies (name, sort_order) VALUES
    ('Peanuts', 1),
    ('Dairy', 2),
    ('Eggs', 3),
    ('Shellfish', 4),
    ('Tree Nuts', 5)
ON CONFLICT (name) DO NOTHING;

-- Insert Medical Conditions
INSERT INTO medical_conditions (name, sort_order) VALUES
    ('Diabetes', 1),
    ('Sickle Cell', 2),
    ('Asthma', 3),
    ('Epilepsy', 4),
    ('Hypertension', 5)
ON CONFLICT (name) DO NOTHING;

-- Insert Emergency Medications
INSERT INTO emergency_medications (name, sort_order) VALUES
    ('Epipen', 1),
    ('Asthma Inhaler', 2),
    ('Insulin', 3),
    ('Antihistamine', 4),
    ('Rescue Medication', 5)
ON CONFLICT (name) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 8. CREATE TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ----------------------------------------------------------------------------

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for master tables
DROP TRIGGER IF EXISTS trigger_update_allergies_updated_at ON allergies;
CREATE TRIGGER trigger_update_allergies_updated_at
    BEFORE UPDATE ON allergies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_medical_conditions_updated_at ON medical_conditions;
CREATE TRIGGER trigger_update_medical_conditions_updated_at
    BEFORE UPDATE ON medical_conditions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_emergency_medications_updated_at ON emergency_medications;
CREATE TRIGGER trigger_update_emergency_medications_updated_at
    BEFORE UPDATE ON emergency_medications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers for junction tables
DROP TRIGGER IF EXISTS trigger_update_student_allergies_updated_at ON student_allergies;
CREATE TRIGGER trigger_update_student_allergies_updated_at
    BEFORE UPDATE ON student_allergies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_student_medical_conditions_updated_at ON student_medical_conditions;
CREATE TRIGGER trigger_update_student_medical_conditions_updated_at
    BEFORE UPDATE ON student_medical_conditions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_student_emergency_medications_updated_at ON student_emergency_medications;
CREATE TRIGGER trigger_update_student_emergency_medications_updated_at
    BEFORE UPDATE ON student_emergency_medications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION QUERIES (Optional - run these to verify the setup)
-- ============================================================================

-- Check if tables were created
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('allergies', 'medical_conditions', 'emergency_medications', 
--                     'student_allergies', 'student_medical_conditions', 'student_emergency_medications')
-- ORDER BY table_name;

-- Check sample data
-- SELECT * FROM allergies ORDER BY sort_order;
-- SELECT * FROM medical_conditions ORDER BY sort_order;
-- SELECT * FROM emergency_medications ORDER BY sort_order;

-- ============================================================================

