-- ============================================================================
-- CASCADE UPDATE AND DELETE FOR STUDENTS
-- ============================================================================
-- This migration implements cascade updates and deletes for student records
-- and their associated records (invoices, payments, balance_brought_forward)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CREATE TRIGGER FUNCTION FOR CASCADE UPDATE OF admission_number
-- ----------------------------------------------------------------------------
-- This function will automatically update admission_number in all related tables
-- when it is changed in the students table
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION cascade_update_student_admission_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if admission_number actually changed
    IF OLD.admission_number IS DISTINCT FROM NEW.admission_number THEN
        -- Update invoices table
        UPDATE invoices
        SET admission_number = NEW.admission_number
        WHERE admission_number = OLD.admission_number;
        
        -- Update payments table
        UPDATE payments
        SET admission_number = NEW.admission_number
        WHERE admission_number = OLD.admission_number;
        
        -- Update balance_brought_forward table (if it exists)
        -- Check if table exists first to avoid errors
        IF EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' 
                   AND table_name = 'balance_brought_forward') THEN
            UPDATE balance_brought_forward
            SET admission_number = NEW.admission_number
            WHERE admission_number = OLD.admission_number;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 2. CREATE TRIGGER TO EXECUTE CASCADE UPDATE
-- ----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS cascade_update_student_admission_trigger ON students;
CREATE TRIGGER cascade_update_student_admission_trigger
    AFTER UPDATE OF admission_number ON students
    FOR EACH ROW
    WHEN (OLD.admission_number IS DISTINCT FROM NEW.admission_number)
    EXECUTE FUNCTION cascade_update_student_admission_number();

-- ----------------------------------------------------------------------------
-- 3. ALTER FOREIGN KEY CONSTRAINTS TO CASCADE ON DELETE
-- ----------------------------------------------------------------------------
-- Change payments table foreign key from RESTRICT to CASCADE
-- This allows deletion of students to automatically delete their payments
-- ----------------------------------------------------------------------------

-- First, drop the existing foreign key constraint
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find the constraint name
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'payments'::regclass
      AND confrelid = 'students'::regclass
      AND contype = 'f'
      AND pg_get_constraintdef(oid) LIKE '%admission_number%';
    
    -- Drop the constraint if it exists
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE payments DROP CONSTRAINT %I', constraint_name);
    END IF;
END $$;

-- Create new foreign key constraint with CASCADE
ALTER TABLE payments
ADD CONSTRAINT payments_admission_number_fkey
FOREIGN KEY (admission_number) 
REFERENCES students(admission_number) 
ON DELETE CASCADE;

-- ----------------------------------------------------------------------------
-- 4. HANDLE balance_brought_forward TABLE (if it exists)
-- ----------------------------------------------------------------------------
-- If balance_brought_forward has a foreign key, update it to CASCADE
-- If it doesn't have a foreign key, we'll handle deletion in the application
-- ----------------------------------------------------------------------------

DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    -- Check if balance_brought_forward table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_name = 'balance_brought_forward') THEN
        
        -- Find the constraint name for balance_brought_forward
        SELECT conname INTO constraint_name
        FROM pg_constraint
        WHERE conrelid = 'balance_brought_forward'::regclass
          AND confrelid = 'students'::regclass
          AND contype = 'f'
          AND pg_get_constraintdef(oid) LIKE '%admission_number%';
        
        -- Drop the constraint if it exists
        IF constraint_name IS NOT NULL THEN
            EXECUTE format('ALTER TABLE balance_brought_forward DROP CONSTRAINT %I', constraint_name);
            
            -- Create new foreign key constraint with CASCADE
            ALTER TABLE balance_brought_forward
            ADD CONSTRAINT balance_brought_forward_admission_number_fkey
            FOREIGN KEY (admission_number) 
            REFERENCES students(admission_number) 
            ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 5. HANDLE invoices TABLE FOREIGN KEY CONSTRAINT
-- ----------------------------------------------------------------------------
-- The invoices table has a foreign key constraint that needs to be updated
-- to allow CASCADE updates and deletes
-- ----------------------------------------------------------------------------

DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find the constraint name for invoices table
    -- Try common constraint names first
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'invoices'::regclass
      AND confrelid = 'students'::regclass
      AND contype = 'f'
      AND (
        pg_get_constraintdef(oid) LIKE '%admission_number%'
        OR conname LIKE '%admission%'
        OR conname LIKE '%fk%'
      )
    LIMIT 1;
    
    -- If not found, try to find any FK constraint on invoices referencing students
    IF constraint_name IS NULL THEN
        SELECT conname INTO constraint_name
        FROM pg_constraint
        WHERE conrelid = 'invoices'::regclass
          AND confrelid = 'students'::regclass
          AND contype = 'f'
        LIMIT 1;
    END IF;
    
    -- Drop the constraint if it exists
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE invoices DROP CONSTRAINT %I', constraint_name);
        
        -- Create new foreign key constraint with CASCADE for both UPDATE and DELETE
        ALTER TABLE invoices
        ADD CONSTRAINT invoices_admission_number_fkey
        FOREIGN KEY (admission_number) 
        REFERENCES students(admission_number) 
        ON UPDATE CASCADE
        ON DELETE CASCADE;
    ELSE
        -- If no constraint exists, create one with CASCADE
        -- First check if admission_number column exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'invoices' 
            AND column_name = 'admission_number'
        ) THEN
            ALTER TABLE invoices
            ADD CONSTRAINT invoices_admission_number_fkey
            FOREIGN KEY (admission_number) 
            REFERENCES students(admission_number) 
            ON UPDATE CASCADE
            ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 6. UPDATE payments FOREIGN KEY TO INCLUDE CASCADE UPDATE
-- ----------------------------------------------------------------------------
-- The payments constraint was created with only ON DELETE CASCADE above
-- We need to also add ON UPDATE CASCADE
-- ----------------------------------------------------------------------------

DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find the payments constraint we just created
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'payments'::regclass
      AND confrelid = 'students'::regclass
      AND contype = 'f'
      AND pg_get_constraintdef(oid) LIKE '%admission_number%';
    
    -- Drop and recreate with both CASCADE options
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE payments DROP CONSTRAINT %I', constraint_name);
        
        ALTER TABLE payments
        ADD CONSTRAINT payments_admission_number_fkey
        FOREIGN KEY (admission_number) 
        REFERENCES students(admission_number) 
        ON UPDATE CASCADE
        ON DELETE CASCADE;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 7. UPDATE payment_allocations FOREIGN KEY TO INCLUDE CASCADE DELETE
-- ----------------------------------------------------------------------------
-- payment_allocations references invoices, so when invoices are deleted,
-- payment_allocations should be automatically deleted
-- ----------------------------------------------------------------------------

DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find the payment_allocations constraint on invoice_number
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'payment_allocations'::regclass
      AND confrelid = 'invoices'::regclass
      AND contype = 'f'
      AND pg_get_constraintdef(oid) LIKE '%invoice_number%';
    
    -- Drop and recreate with CASCADE DELETE
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE payment_allocations DROP CONSTRAINT %I', constraint_name);
        
        ALTER TABLE payment_allocations
        ADD CONSTRAINT payment_allocations_invoice_number_fkey
        FOREIGN KEY (invoice_number) 
        REFERENCES invoices(invoice_number) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES (Optional - run these to verify the setup)
-- ============================================================================

-- Check if trigger exists
-- SELECT tgname, tgrelid::regclass, proname 
-- FROM pg_trigger t
-- JOIN pg_proc p ON t.tgfoid = p.oid
-- WHERE tgname = 'cascade_update_student_admission_trigger';

-- Check foreign key constraints
-- SELECT 
--     tc.table_name, 
--     tc.constraint_name, 
--     tc.constraint_type,
--     kcu.column_name,
--     ccu.table_name AS foreign_table_name,
--     ccu.column_name AS foreign_column_name,
--     rc.delete_rule
-- FROM information_schema.table_constraints AS tc
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
-- JOIN information_schema.referential_constraints AS rc
--   ON rc.constraint_name = tc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY'
--   AND (tc.table_name IN ('payments', 'balance_brought_forward', 'invoices'))
--   AND ccu.table_name = 'students'
-- ORDER BY tc.table_name;

