-- ============================================================================
-- EXPENSES MODULE SETUP
-- ============================================================================
-- This script creates the necessary tables for the Expenses module
-- which handles expense recording, payment tracking, and customizable dropdowns.
--
-- TABLES CREATED:
-- 1. expense_categories - Lookup table for expense categories (Food, Utilities, etc.)
-- 2. expense_descriptions - Lookup table for expense descriptions (category-specific)
-- 3. expense_vendors - Lookup table for vendors
-- 4. expense_paid_through - Lookup table for payment methods (KCB Bank, DTB Bank, etc.)
-- 5. expenses - Main expenses records table
--
-- TRIGGERS:
-- 1. Auto-generate internal reference numbers (EXP + random alphanumeric)
-- 2. Auto-update timestamps
--
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CREATE expense_categories TABLE (Customizable dropdown)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expense_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_expense_categories_name ON expense_categories(name);
CREATE INDEX IF NOT EXISTS idx_expense_categories_sort_order ON expense_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_expense_categories_is_active ON expense_categories(is_active);

-- Insert default categories
INSERT INTO expense_categories (name, sort_order) VALUES
    ('Food', 0),
    ('Utilities', 1),
    ('Maintenance', 2),
    ('Transport', 3),
    ('Supplies', 4)
ON CONFLICT (name) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. CREATE expense_descriptions TABLE (Category-specific, customizable dropdown)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expense_descriptions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id INTEGER NOT NULL REFERENCES expense_categories(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Ensure unique description per category
    CONSTRAINT unique_description_per_category UNIQUE (name, category_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_expense_descriptions_category_id ON expense_descriptions(category_id);
CREATE INDEX IF NOT EXISTS idx_expense_descriptions_name ON expense_descriptions(name);
CREATE INDEX IF NOT EXISTS idx_expense_descriptions_sort_order ON expense_descriptions(sort_order);
CREATE INDEX IF NOT EXISTS idx_expense_descriptions_is_active ON expense_descriptions(is_active);

-- Insert default descriptions
INSERT INTO expense_descriptions (name, category_id, sort_order) VALUES
    -- Food category descriptions
    ('Weekly food supplies', 1, 0),
    ('Monthly food supplies', 1, 1),
    ('Kitchen supplies', 1, 2),
    ('Canteen stock', 1, 3),
    -- Utilities category descriptions
    ('Monthly electricity bill', 2, 0),
    ('Water bill', 2, 1),
    ('Internet bill', 2, 2),
    ('Phone bill', 2, 3),
    -- Maintenance category descriptions
    ('Classroom repairs', 3, 0),
    ('Building maintenance', 3, 1),
    ('Equipment repairs', 3, 2),
    ('Plumbing repairs', 3, 3),
    -- Transport category descriptions
    ('Fuel expenses', 4, 0),
    ('Vehicle maintenance', 4, 1),
    ('Transport services', 4, 2),
    -- Supplies category descriptions
    ('Office supplies', 5, 0),
    ('Stationery', 5, 1),
    ('Cleaning supplies', 5, 2)
ON CONFLICT (name, category_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. CREATE expense_vendors TABLE (Customizable dropdown)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expense_vendors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_expense_vendors_name ON expense_vendors(name);
CREATE INDEX IF NOT EXISTS idx_expense_vendors_sort_order ON expense_vendors(sort_order);
CREATE INDEX IF NOT EXISTS idx_expense_vendors_is_active ON expense_vendors(is_active);

-- Insert default vendors
INSERT INTO expense_vendors (name, sort_order) VALUES
    ('Fresh Foods Ltd', 0),
    ('Kenya Power', 1),
    ('Fix-It Services', 2),
    ('Office Supplies Co', 3)
ON CONFLICT (name) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. CREATE expense_paid_through TABLE (Customizable dropdown)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expense_paid_through (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_expense_paid_through_name ON expense_paid_through(name);
CREATE INDEX IF NOT EXISTS idx_expense_paid_through_sort_order ON expense_paid_through(sort_order);
CREATE INDEX IF NOT EXISTS idx_expense_paid_through_is_active ON expense_paid_through(is_active);

-- Insert default paid through options
INSERT INTO expense_paid_through (name, sort_order) VALUES
    ('KCB Bank', 0),
    ('DTB Bank', 1),
    ('Equity Bank', 2),
    ('Petty Cash', 3),
    ('Mobile Money', 4)
ON CONFLICT (name) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. CREATE expenses TABLE (Main expenses records)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    internal_reference VARCHAR(50) UNIQUE NOT NULL, -- System-generated (e.g., EXP7A2B9C)
    expense_date DATE NOT NULL,
    category_id INTEGER NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
    description_id INTEGER REFERENCES expense_descriptions(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    vendor_id INTEGER REFERENCES expense_vendors(id) ON DELETE SET NULL,
    paid_through_id INTEGER REFERENCES expense_paid_through(id) ON DELETE SET NULL,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'Unpaid' CHECK (payment_status IN ('Paid', 'Unpaid')),
    due_date DATE, -- Required when payment_status = 'Unpaid'
    date_paid DATE, -- Required when payment_status = 'Paid'
    payment_reference_no VARCHAR(255), -- Payment reference number
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255), -- User who created the expense
    updated_by VARCHAR(255), -- User who last updated the expense
    is_voided BOOLEAN DEFAULT FALSE, -- Soft delete flag
    voided_at TIMESTAMP WITH TIME ZONE,
    voided_by VARCHAR(255)
);

-- Create indexes for expenses table
CREATE INDEX IF NOT EXISTS idx_expenses_internal_reference ON expenses(internal_reference);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_description_id ON expenses(description_id);
CREATE INDEX IF NOT EXISTS idx_expenses_vendor_id ON expenses(vendor_id);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_through_id ON expenses(paid_through_id);
CREATE INDEX IF NOT EXISTS idx_expenses_payment_status ON expenses(payment_status);
CREATE INDEX IF NOT EXISTS idx_expenses_is_voided ON expenses(is_voided);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at DESC);

-- ----------------------------------------------------------------------------
-- 6. FUNCTION: Generate Internal Reference Number (EXP + random alphanumeric)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_expense_reference()
RETURNS VARCHAR(50) AS $$
DECLARE
    new_reference VARCHAR(50);
    reference_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a random alphanumeric string (8 characters, similar to receipt numbers)
        -- Format: EXP + 5 alphanumeric characters (e.g., EXP7A2B9C)
        new_reference := 'EXP' || 
            UPPER(
                SUBSTRING(
                    MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) 
                    FROM 1 FOR 5
                )
            );
        
        -- Check if reference number already exists
        SELECT EXISTS(SELECT 1 FROM expenses WHERE internal_reference = new_reference) INTO reference_exists;
        
        -- Exit loop if reference number is unique
        EXIT WHEN NOT reference_exists;
    END LOOP;
    
    RETURN new_reference;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 7. TRIGGER: Auto-generate internal_reference before insert
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_expense_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.internal_reference IS NULL OR NEW.internal_reference = '' THEN
        NEW.internal_reference := generate_expense_reference();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_expense_reference ON expenses;
CREATE TRIGGER trigger_set_expense_reference
    BEFORE INSERT ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION set_expense_reference();

-- ----------------------------------------------------------------------------
-- 8. TRIGGER: Auto-update updated_at timestamp
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_expenses_updated_at ON expenses;
CREATE TRIGGER trigger_update_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_expenses_updated_at();

-- ----------------------------------------------------------------------------
-- 9. TRIGGER: Auto-update updated_at for lookup tables
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_lookup_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all lookup tables
DROP TRIGGER IF EXISTS trigger_update_expense_categories_updated_at ON expense_categories;
CREATE TRIGGER trigger_update_expense_categories_updated_at
    BEFORE UPDATE ON expense_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_lookup_tables_updated_at();

DROP TRIGGER IF EXISTS trigger_update_expense_descriptions_updated_at ON expense_descriptions;
CREATE TRIGGER trigger_update_expense_descriptions_updated_at
    BEFORE UPDATE ON expense_descriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_lookup_tables_updated_at();

DROP TRIGGER IF EXISTS trigger_update_expense_vendors_updated_at ON expense_vendors;
CREATE TRIGGER trigger_update_expense_vendors_updated_at
    BEFORE UPDATE ON expense_vendors
    FOR EACH ROW
    EXECUTE FUNCTION update_lookup_tables_updated_at();

DROP TRIGGER IF EXISTS trigger_update_expense_paid_through_updated_at ON expense_paid_through;
CREATE TRIGGER trigger_update_expense_paid_through_updated_at
    BEFORE UPDATE ON expense_paid_through
    FOR EACH ROW
    EXECUTE FUNCTION update_lookup_tables_updated_at();

-- ----------------------------------------------------------------------------
-- 10. VIEW: Expenses with joined data for easy querying
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW expenses_view AS
SELECT 
    e.id,
    e.internal_reference,
    e.expense_date,
    e.amount,
    e.payment_status,
    e.due_date,
    e.date_paid,
    e.payment_reference_no,
    e.is_voided,
    e.created_at,
    e.updated_at,
    ec.id AS category_id,
    ec.name AS category_name,
    ed.id AS description_id,
    ed.name AS description_name,
    ev.id AS vendor_id,
    ev.name AS vendor_name,
    ept.id AS paid_through_id,
    ept.name AS paid_through_name
FROM expenses e
LEFT JOIN expense_categories ec ON e.category_id = ec.id
LEFT JOIN expense_descriptions ed ON e.description_id = ed.id
LEFT JOIN expense_vendors ev ON e.vendor_id = ev.id
LEFT JOIN expense_paid_through ept ON e.paid_through_id = ept.id
WHERE e.is_voided = FALSE;

-- ============================================================================
-- END OF EXPENSES MODULE SETUP
-- ============================================================================

