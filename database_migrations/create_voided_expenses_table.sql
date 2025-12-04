-- Create voided_expenses table to store deleted expense records with reason
-- This table maintains an audit trail of voided expenses

CREATE TABLE IF NOT EXISTS voided_expenses (
    id SERIAL PRIMARY KEY,
    original_expense_id INTEGER NOT NULL,
    internal_reference VARCHAR(255) NOT NULL,
    expense_date DATE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    category_id INTEGER,
    category_name VARCHAR(255),
    description_id INTEGER,
    description_name VARCHAR(255),
    vendor_id INTEGER,
    vendor_name VARCHAR(255),
    paid_through_id INTEGER,
    paid_through_name VARCHAR(255),
    payment_status VARCHAR(50),
    due_date DATE,
    date_paid DATE,
    payment_reference_no VARCHAR(255),
    notes TEXT,
    balance_due NUMERIC(10, 2),
    void_reason TEXT NOT NULL,
    voided_by TEXT,
    voided_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_voided_expenses_voided_at ON voided_expenses(voided_at);
CREATE INDEX IF NOT EXISTS idx_voided_expenses_expense_date ON voided_expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_voided_expenses_original_expense_id ON voided_expenses(original_expense_id);

-- Add comments
COMMENT ON TABLE voided_expenses IS 'Stores deleted expense records with void reason for audit trail';
COMMENT ON COLUMN voided_expenses.original_expense_id IS 'The ID of the original expense before deletion';
COMMENT ON COLUMN voided_expenses.void_reason IS 'Reason provided by user for voiding the expense';
COMMENT ON COLUMN voided_expenses.voided_by IS 'User who voided the expense';
COMMENT ON COLUMN voided_expenses.voided_at IS 'Timestamp when the expense was voided';

