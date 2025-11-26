-- ============================================================================
-- FIX: Remove updated_at references from payment allocation trigger
-- ============================================================================
-- The invoices table doesn't have an updated_at column, so we need to remove
-- those references from the trigger function.
-- ============================================================================

CREATE OR REPLACE FUNCTION update_invoice_payment_on_allocation()
RETURNS TRIGGER AS $$
DECLARE
    total_allocated NUMERIC(12, 2);
    current_payment_made NUMERIC(12, 2);
    invoice_record RECORD;
BEGIN
    -- Get the invoice record to check current payment_made
    SELECT payment_made, total_amount, due_date, status
    INTO invoice_record
    FROM invoices
    WHERE invoice_number = COALESCE(NEW.invoice_number, OLD.invoice_number);
    
    -- Calculate total allocated amount from payment_allocations table
    SELECT COALESCE(SUM(allocated_amount), 0)
    INTO total_allocated
    FROM payment_allocations
    WHERE invoice_number = COALESCE(NEW.invoice_number, OLD.invoice_number);
    
    -- Get current payment_made value
    current_payment_made := COALESCE(invoice_record.payment_made, 0);
    
    -- If there are allocations, use the sum of allocations
    -- If there are NO allocations but payment_made exists, preserve the existing value
    -- This handles the case where payment_made was set manually before allocations existed
    IF total_allocated > 0 THEN
        -- Use sum of allocations (this is the source of truth going forward)
        current_payment_made := total_allocated;
    ELSE
        -- No allocations exist, keep existing payment_made value (if any)
        -- This preserves manually entered payments from before the allocation system
        current_payment_made := COALESCE(invoice_record.payment_made, 0);
    END IF;
    
    -- Update invoice payment_made, balance_due, and status
    UPDATE invoices
    SET 
        payment_made = current_payment_made,
        balance_due = COALESCE(invoice_record.total_amount, 0) - current_payment_made,
        status = CASE
            -- Preserve 'Forwarded' status
            WHEN status = 'Forwarded' THEN 'Forwarded'
            -- If balance is zero or negative, invoice is Paid
            WHEN (COALESCE(invoice_record.total_amount, 0) - current_payment_made) <= 0 THEN 'Paid'
            -- If balance > 0 and due date passed, invoice is Overdue
            WHEN (COALESCE(invoice_record.total_amount, 0) - current_payment_made) > 0 
                 AND invoice_record.due_date < (CURRENT_DATE AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Nairobi')::date 
            THEN 'Overdue'
            -- Otherwise, it's Pending
            ELSE 'Pending'
        END
    WHERE invoice_number = COALESCE(NEW.invoice_number, OLD.invoice_number);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

