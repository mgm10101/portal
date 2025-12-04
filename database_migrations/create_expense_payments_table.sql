-- Create expense_payments table for tracking individual payments
-- This table stores each payment made towards an expense, supporting partial payments

-- Drop constraint if it exists (in case of previous partial migration)
ALTER TABLE IF EXISTS expense_payments DROP CONSTRAINT IF EXISTS expense_payments_amount_check;

CREATE TABLE IF NOT EXISTS expense_payments (
    id SERIAL PRIMARY KEY,
    expense_id INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    paid_through_id INTEGER REFERENCES expense_paid_through(id),
    payment_reference_no TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_expense_payments_expense_id ON expense_payments(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_payments_payment_date ON expense_payments(payment_date);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_expense_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_expense_payments_updated_at ON expense_payments;
CREATE TRIGGER trigger_update_expense_payments_updated_at
    BEFORE UPDATE ON expense_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_expense_payments_updated_at();

-- Add comment to document the table
COMMENT ON TABLE expense_payments IS 'Stores individual payments made towards expenses, supporting partial payments';
COMMENT ON COLUMN expense_payments.expense_id IS 'Foreign key to expenses table';
COMMENT ON COLUMN expense_payments.payment_date IS 'Date when the payment was made';
COMMENT ON COLUMN expense_payments.amount IS 'Amount of this payment (must be > 0)';
COMMENT ON COLUMN expense_payments.paid_through_id IS 'Payment method used (references expense_paid_through)';
COMMENT ON COLUMN expense_payments.payment_reference_no IS 'Reference number for this payment (receipt, check number, etc.)';
