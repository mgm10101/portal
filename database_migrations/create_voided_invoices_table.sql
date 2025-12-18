-- Create voided_invoices table to store deleted invoice records with reason
-- This table maintains an audit trail of voided invoices

CREATE TABLE IF NOT EXISTS voided_invoices (
    id SERIAL PRIMARY KEY,
    original_invoice_number VARCHAR(50) NOT NULL,
    invoice_seq_number INTEGER,
    admission_number VARCHAR(50),
    student_name VARCHAR(255),
    invoice_date DATE,
    due_date DATE,
    description TEXT,
    subtotal NUMERIC(12, 2),
    total_amount NUMERIC(12, 2),
    payment_made NUMERIC(12, 2),
    balance_due NUMERIC(12, 2),
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    void_reason TEXT NOT NULL,
    voided_by TEXT,
    voided_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_voided_invoices_voided_at ON voided_invoices(voided_at);
CREATE INDEX IF NOT EXISTS idx_voided_invoices_invoice_date ON voided_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_voided_invoices_original_invoice_number ON voided_invoices(original_invoice_number);

-- Add comments
COMMENT ON TABLE voided_invoices IS 'Stores deleted invoice records with void reason for audit trail';
COMMENT ON COLUMN voided_invoices.original_invoice_number IS 'The invoice number of the original invoice before deletion';
COMMENT ON COLUMN voided_invoices.void_reason IS 'Reason provided by user for voiding the invoice';
COMMENT ON COLUMN voided_invoices.voided_by IS 'User who voided the invoice';
COMMENT ON COLUMN voided_invoices.voided_at IS 'Timestamp when the invoice was voided';

