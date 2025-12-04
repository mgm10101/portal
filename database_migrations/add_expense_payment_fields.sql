-- Add payment tracking fields to expenses table
-- This migration adds support for partial payments, payment history, and notes

-- Add notes column (nullable text field for additional expense information)
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add balance_due column (numeric field to track remaining balance for partial payments)
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS balance_due NUMERIC(10, 2) DEFAULT 0;

-- Add payment_history column (JSONB field to store array of payment records)
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS payment_history JSONB DEFAULT '[]'::jsonb;

-- Update existing records: set balance_due to amount for unpaid expenses, 0 for paid expenses
UPDATE expenses
SET balance_due = CASE 
    WHEN payment_status = 'Unpaid' THEN amount
    ELSE 0
END
WHERE balance_due IS NULL OR balance_due = 0;

-- Add comments to document the new columns
COMMENT ON COLUMN expenses.notes IS 'Additional notes or comments about the expense';
COMMENT ON COLUMN expenses.balance_due IS 'Remaining balance due for partially paid expenses. For unpaid expenses, equals amount. For fully paid expenses, equals 0.';
COMMENT ON COLUMN expenses.payment_history IS 'JSON array of payment records. Each record contains: date, amount, reference, paid_through_id, created_at';

