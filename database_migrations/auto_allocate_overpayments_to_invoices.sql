-- ============================================================================
-- AUTO-ALLOCATE OVERPAYMENTS TO NEW INVOICES
-- ============================================================================
-- This script creates a function and trigger that automatically allocates
-- unallocated payment amounts (overpayments) to new invoices when they are created.
--
-- HOW IT WORKS:
-- 1. When a new invoice is inserted, the trigger fires
-- 2. It finds all payments for that student with unallocated amounts
-- 3. It automatically creates payment_allocations from those unallocated amounts
--    to the new invoice, up to the invoice's total_amount
-- 4. The existing payment allocation trigger then updates payment_made automatically
--
-- ============================================================================

-- ----------------------------------------------------------------------------
-- FUNCTION: Auto-allocate unallocated payments to a new invoice
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auto_allocate_overpayments_to_invoice()
RETURNS TRIGGER AS $$
DECLARE
    payment_record RECORD;
    unallocated_amount NUMERIC(12, 2);
    invoice_balance NUMERIC(12, 2);
    amount_to_allocate NUMERIC(12, 2);
BEGIN
    -- Only process if this is a new invoice (not an update)
    IF TG_OP != 'INSERT' THEN
        RETURN NEW;
    END IF;
    
    -- Get the invoice's total amount (this is what we need to cover)
    invoice_balance := COALESCE(NEW.total_amount, 0);
    
    -- If invoice has no amount, nothing to allocate
    IF invoice_balance <= 0 THEN
        RETURN NEW;
    END IF;
    
    -- Find all payments for this student that have unallocated amounts
    -- Process them in order by payment_date (oldest first) to use oldest payments first
    FOR payment_record IN
        SELECT 
            p.id,
            p.amount,
            p.payment_date,
            (p.amount - COALESCE(SUM(pa.allocated_amount), 0)) AS unallocated
        FROM payments p
        LEFT JOIN payment_allocations pa ON p.id = pa.payment_id
        WHERE p.admission_number = NEW.admission_number
        GROUP BY p.id, p.amount, p.payment_date
        HAVING (p.amount - COALESCE(SUM(pa.allocated_amount), 0)) > 0
        ORDER BY p.payment_date ASC, p.id ASC
    LOOP
        -- Calculate how much is unallocated for this payment
        unallocated_amount := payment_record.unallocated;
        
        -- If no unallocated amount, skip to next payment
        IF unallocated_amount <= 0 THEN
            CONTINUE;
        END IF;
        
        -- If invoice is already fully paid, stop allocating
        IF invoice_balance <= 0 THEN
            EXIT;
        END IF;
        
        -- Calculate how much to allocate (min of unallocated amount and remaining invoice balance)
        amount_to_allocate := LEAST(unallocated_amount, invoice_balance);
        
        -- Create the payment allocation
        INSERT INTO payment_allocations (
            payment_id,
            invoice_number,
            allocated_amount
        ) VALUES (
            payment_record.id,
            NEW.invoice_number,
            amount_to_allocate
        )
        ON CONFLICT (payment_id, invoice_number) 
        DO NOTHING; -- Safety measure: if allocation already exists, skip it
        
        -- Reduce the invoice balance by what we just allocated
        invoice_balance := invoice_balance - amount_to_allocate;
        
    END LOOP;
    
    -- The existing trigger on payment_allocations will automatically update
    -- the invoice's payment_made and balance_due fields
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- TRIGGER: Auto-allocate overpayments when a new invoice is created
-- ----------------------------------------------------------------------------
-- This trigger runs AFTER INSERT so that the invoice is fully created
-- before we try to allocate payments to it
DROP TRIGGER IF EXISTS trigger_auto_allocate_overpayments ON invoices;

CREATE TRIGGER trigger_auto_allocate_overpayments
    AFTER INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION auto_allocate_overpayments_to_invoice();

-- ----------------------------------------------------------------------------
-- NOTES:
-- ----------------------------------------------------------------------------
-- 1. This trigger only runs on INSERT, not UPDATE, so it won't interfere
--    with existing invoices when they are modified.
--
-- 2. The function processes payments in chronological order (oldest first)
--    to ensure older payments are used before newer ones.
--
-- 3. If multiple payments have unallocated amounts, they are allocated
--    sequentially until the invoice is fully paid or no more unallocated
--    amounts exist.
--
-- 4. The existing payment allocation trigger will automatically update
--    the invoice's payment_made and balance_due fields after allocations
--    are created.
--
-- 5. If an overpayment is larger than the invoice amount, the remainder
--    stays as unallocated in the payment record, ready for the next invoice.
--
-- ============================================================================

