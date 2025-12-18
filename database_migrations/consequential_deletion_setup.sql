-- ============================================================================
-- CONSEQUENTIAL DELETION SETUP FOR INVOICES AND PAYMENTS
-- ============================================================================
-- This migration ensures proper CASCADE behavior for consequential deletions
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. UPDATE payment_allocations FOREIGN KEY TO CASCADE ON DELETE
-- ----------------------------------------------------------------------------
-- When an invoice is deleted, its payment_allocations should be automatically
-- deleted. This makes the allocated amounts become overpayments in the payment records.
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
        
        RAISE NOTICE 'Updated payment_allocations.invoice_number FK to CASCADE';
    ELSE
        -- If constraint doesn't exist, create it
        ALTER TABLE payment_allocations
        ADD CONSTRAINT payment_allocations_invoice_number_fkey
        FOREIGN KEY (invoice_number) 
        REFERENCES invoices(invoice_number) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Created payment_allocations.invoice_number FK with CASCADE';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. VERIFY TRIGGER HANDLES DELETE OPERATIONS CORRECTLY
-- ----------------------------------------------------------------------------
-- The trigger update_invoice_payment_on_allocation() should already handle
-- DELETE operations on payment_allocations. This is just a verification query.
-- ----------------------------------------------------------------------------

-- Check if the DELETE trigger exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_update_invoice_on_allocation_delete'
    ) THEN
        RAISE NOTICE 'DELETE trigger on payment_allocations exists and will update invoice statuses';
    ELSE
        RAISE WARNING 'DELETE trigger on payment_allocations does not exist! Invoice statuses may not update correctly when payments are deleted.';
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES (Optional - run these to verify the setup)
-- ============================================================================

-- Check foreign key constraints
-- SELECT 
--     tc.table_name, 
--     tc.constraint_name, 
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
--   AND tc.table_name = 'payment_allocations'
-- ORDER BY kcu.column_name;

