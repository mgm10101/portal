-- Add new status columns to invoices table
-- Adds withdrawn, bad_debt, and payment_plan columns

-- Add withdrawn column
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS withdrawn BOOLEAN DEFAULT FALSE;

-- Add bad_debt column  
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS bad_debt BOOLEAN DEFAULT FALSE;

-- Add payment_plan column
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS payment_plan TEXT;