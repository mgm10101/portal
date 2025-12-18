-- Create voided_payments table to store deleted payment records with reason
-- This table maintains an audit trail of voided payments

CREATE TABLE IF NOT EXISTS voided_payments (
    id SERIAL PRIMARY KEY,
    original_payment_id INTEGER NOT NULL,
    receipt_number VARCHAR(50),
    admission_number VARCHAR(50),
    student_name VARCHAR(255),
    payment_date DATE,
    amount NUMERIC(12, 2),
    payment_method_id INTEGER,
    payment_method_name VARCHAR(255),
    account_id INTEGER,
    account_name VARCHAR(255),
    reference_number VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    void_reason TEXT NOT NULL,
    voided_by TEXT,
    voided_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_voided_payments_voided_at ON voided_payments(voided_at);
CREATE INDEX IF NOT EXISTS idx_voided_payments_payment_date ON voided_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_voided_payments_original_payment_id ON voided_payments(original_payment_id);

-- Add comments
COMMENT ON TABLE voided_payments IS 'Stores deleted payment records with void reason for audit trail';
COMMENT ON COLUMN voided_payments.original_payment_id IS 'The ID of the original payment before deletion';
COMMENT ON COLUMN voided_payments.void_reason IS 'Reason provided by user for voiding the payment';
COMMENT ON COLUMN voided_payments.voided_by IS 'User who voided the payment';
COMMENT ON COLUMN voided_payments.voided_at IS 'Timestamp when the payment was voided';

