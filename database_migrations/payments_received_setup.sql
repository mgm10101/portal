-- ============================================================================
-- PAYMENTS RECEIVED MODULE SETUP
-- ============================================================================
-- This script creates the necessary tables for the Payments Received module
-- which handles payment recording, invoice allocations, and receipt generation.
--
-- TABLES CREATED:
-- 1. payment_methods - Lookup table for payment methods (Bank Transfer, Cash, etc.)
-- 2. accounts - Lookup table for accounts (KCB Bank, DTB Bank, etc.)
-- 3. payments - Main payment records table
-- 4. payment_allocations - Junction table for payment-to-invoice allocations
--
-- TRIGGERS:
-- 1. Auto-generate receipt numbers
-- 2. Update invoice payment_made when allocations change
-- 3. Update invoice status based on balance
-- 4. Auto-update timestamps
--
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CREATE payment_methods TABLE (Lookup table)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_methods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_methods_name ON payment_methods(name);
CREATE INDEX IF NOT EXISTS idx_payment_methods_sort_order ON payment_methods(sort_order);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_active ON payment_methods(is_active);

-- Insert default payment methods
INSERT INTO payment_methods (name, sort_order) VALUES
    ('Bank Transfer', 0),
    ('Cash', 1),
    ('Cheque', 2),
    ('Mobile Money', 3)
ON CONFLICT (name) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. CREATE accounts TABLE (Lookup table)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    account_number VARCHAR(255),
    bank_name VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_accounts_name ON accounts(name);
CREATE INDEX IF NOT EXISTS idx_accounts_sort_order ON accounts(sort_order);
CREATE INDEX IF NOT EXISTS idx_accounts_is_active ON accounts(is_active);

-- Insert default accounts
INSERT INTO accounts (name, sort_order) VALUES
    ('KCB Bank', 0),
    ('DTB Bank', 1),
    ('Equity Bank', 2),
    ('Petty Cash', 3)
ON CONFLICT (name) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. CREATE payments TABLE (Main payment records)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    receipt_number VARCHAR(50) UNIQUE NOT NULL, -- System-generated (e.g., RCP7A2B9C)
    admission_number VARCHAR(50) NOT NULL REFERENCES students(admission_number) ON DELETE RESTRICT,
    student_name VARCHAR(255) NOT NULL, -- Snapshot of student name at payment time
    payment_date DATE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_method_id INTEGER REFERENCES payment_methods(id) ON DELETE RESTRICT,
    account_id INTEGER REFERENCES accounts(id) ON DELETE RESTRICT,
    reference_number VARCHAR(255), -- Transaction reference
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255), -- User who created the payment
    updated_by VARCHAR(255) -- User who last updated the payment
);

-- Create indexes for payments table
CREATE INDEX IF NOT EXISTS idx_payments_receipt_number ON payments(receipt_number);
CREATE INDEX IF NOT EXISTS idx_payments_admission_number ON payments(admission_number);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method_id ON payments(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payments_account_id ON payments(account_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- ----------------------------------------------------------------------------
-- 4. CREATE payment_allocations TABLE (Junction table for invoice allocations)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_allocations (
    id SERIAL PRIMARY KEY,
    payment_id INTEGER NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL REFERENCES invoices(invoice_number) ON DELETE RESTRICT,
    allocated_amount NUMERIC(12, 2) NOT NULL CHECK (allocated_amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Ensure no duplicate allocations for same payment-invoice pair
    CONSTRAINT unique_payment_invoice_allocation UNIQUE (payment_id, invoice_number)
);

-- Create indexes for payment_allocations table
CREATE INDEX IF NOT EXISTS idx_payment_allocations_payment_id ON payment_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_invoice_number ON payment_allocations(invoice_number);

-- ----------------------------------------------------------------------------
-- 5. FUNCTION: Generate Receipt Number (MPesa-like format)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    new_receipt VARCHAR(50);
    receipt_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a random alphanumeric string (8 characters, similar to MPesa)
        -- Format: RCP + 5 alphanumeric characters (e.g., RCP7A2B9C)
        new_receipt := 'RCP' || 
            UPPER(
                SUBSTRING(
                    MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) 
                    FROM 1 FOR 5
                )
            );
        
        -- Check if receipt number already exists
        SELECT EXISTS(SELECT 1 FROM payments WHERE receipt_number = new_receipt) INTO receipt_exists;
        
        -- Exit loop if receipt number is unique
        EXIT WHEN NOT receipt_exists;
    END LOOP;
    
    RETURN new_receipt;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 6. TRIGGER: Auto-generate receipt_number before insert
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
        NEW.receipt_number := generate_receipt_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_receipt_number ON payments;
CREATE TRIGGER trigger_set_receipt_number
    BEFORE INSERT ON payments
    FOR EACH ROW
    EXECUTE FUNCTION set_receipt_number();

-- ----------------------------------------------------------------------------
-- 7. TRIGGER: Update invoice payment_made when payment allocation is created/deleted
-- ----------------------------------------------------------------------------
-- This function handles existing payment_made values and accumulates allocations
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

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_invoice_on_allocation_insert ON payment_allocations;
DROP TRIGGER IF EXISTS trigger_update_invoice_on_allocation_update ON payment_allocations;
DROP TRIGGER IF EXISTS trigger_update_invoice_on_allocation_delete ON payment_allocations;

-- Create triggers for INSERT, UPDATE, and DELETE
CREATE TRIGGER trigger_update_invoice_on_allocation_insert
    AFTER INSERT ON payment_allocations
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_payment_on_allocation();

CREATE TRIGGER trigger_update_invoice_on_allocation_update
    AFTER UPDATE ON payment_allocations
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_payment_on_allocation();

CREATE TRIGGER trigger_update_invoice_on_allocation_delete
    AFTER DELETE ON payment_allocations
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_payment_on_allocation();

-- ----------------------------------------------------------------------------
-- 8. TRIGGER: Update updated_at timestamp
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_payments_updated_at ON payments;
CREATE TRIGGER trigger_update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER trigger_update_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_accounts_updated_at ON accounts;
CREATE TRIGGER trigger_update_accounts_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 9. VIEW: Payments with related data (for easier querying)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW payments_view AS
SELECT 
    p.id,
    p.receipt_number,
    p.admission_number,
    p.student_name,
    p.payment_date,
    p.amount,
    p.reference_number,
    p.notes,
    p.created_at,
    p.updated_at,
    pm.id AS payment_method_id,
    pm.name AS payment_method_name,
    a.id AS account_id,
    a.name AS account_name,
    a.account_number AS account_number,
    a.bank_name AS bank_name,
    COALESCE(SUM(pa.allocated_amount), 0) AS total_allocated,
    (p.amount - COALESCE(SUM(pa.allocated_amount), 0)) AS unallocated_amount
FROM payments p
LEFT JOIN payment_methods pm ON p.payment_method_id = pm.id
LEFT JOIN accounts a ON p.account_id = a.id
LEFT JOIN payment_allocations pa ON p.id = pa.payment_id
GROUP BY 
    p.id, 
    p.receipt_number, 
    p.admission_number, 
    p.student_name, 
    p.payment_date, 
    p.amount, 
    p.reference_number, 
    p.notes, 
    p.created_at, 
    p.updated_at,
    pm.id,
    pm.name,
    a.id,
    a.name,
    a.account_number,
    a.bank_name;

-- ----------------------------------------------------------------------------
-- 10. GRANT PERMISSIONS (Adjust role name as needed)
-- ----------------------------------------------------------------------------
-- GRANT ALL ON payment_methods, accounts, payments, payment_allocations TO your_role_name;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_role_name;
-- GRANT SELECT ON payments_view TO your_role_name;

