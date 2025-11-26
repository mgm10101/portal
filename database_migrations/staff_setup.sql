-- ============================================================================
-- STAFF MODULE SETUP
-- ============================================================================
-- This script creates all tables, functions, and triggers required for the
-- Staff Info module, including departments, staff members, allowances,
-- deductions, and custom fields.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CREATE departments TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);
CREATE INDEX IF NOT EXISTS idx_departments_sort_order ON departments(sort_order);

-- ----------------------------------------------------------------------------
-- 2. CREATE staff TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(100) NOT NULL UNIQUE,
    national_id VARCHAR(50),
    birthday DATE,
    age INTEGER,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL ON UPDATE CASCADE,
    position VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    emergency_contact_1_name VARCHAR(255),
    emergency_contact_1_phone VARCHAR(50),
    emergency_contact_1_relationship VARCHAR(100),
    emergency_contact_2_name VARCHAR(255),
    emergency_contact_2_phone VARCHAR(50),
    emergency_contact_2_relationship VARCHAR(100),
    date_hired DATE,
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'On Leave', 'Suspended', 'Terminated', 'Retired')),
    date_of_termination DATE,
    date_of_retirement DATE,
    qualifications TEXT,
    basic_pay DECIMAL(12, 2) DEFAULT 0,
    gross_pay DECIMAL(12, 2) DEFAULT 0,
    net_pay DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Custom fields columns (8 slots total)
    staff_custom_text1 TEXT,
    staff_custom_text2 TEXT,
    staff_custom_text3 TEXT,
    staff_custom_text4 TEXT,
    staff_custom_text5 TEXT,
    staff_custom_num1 NUMERIC,
    staff_custom_num2 NUMERIC,
    staff_custom_num3 NUMERIC
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_staff_employee_id ON staff(employee_id);
CREATE INDEX IF NOT EXISTS idx_staff_department_id ON staff(department_id);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);
CREATE INDEX IF NOT EXISTS idx_staff_full_name ON staff(full_name);

-- ----------------------------------------------------------------------------
-- 3. CREATE staff_allowances TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_allowances (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_staff_allowances_staff_id ON staff_allowances(staff_id);

-- ----------------------------------------------------------------------------
-- 4. CREATE staff_deductions TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_deductions (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    deduction_type VARCHAR(50) NOT NULL CHECK (deduction_type IN ('Statutory', 'Other')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_staff_deductions_staff_id ON staff_deductions(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_deductions_type ON staff_deductions(deduction_type);

-- ----------------------------------------------------------------------------
-- 5. CREATE staff_custom_fields TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_custom_fields (
    field_id VARCHAR(50) PRIMARY KEY,
    field_name VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('Text Input', 'Dropdown')),
    options TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_staff_custom_fields_field_name ON staff_custom_fields(field_name);

-- ----------------------------------------------------------------------------
-- 6. FUNCTION: Calculate age from birthday
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
    IF birth_date IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN EXTRACT(YEAR FROM AGE(birth_date));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ----------------------------------------------------------------------------
-- 7. FUNCTION: Calculate gross pay (basic_pay + sum of allowances)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_gross_pay(p_staff_id INTEGER)
RETURNS DECIMAL(12, 2) AS $$
DECLARE
    v_basic_pay DECIMAL(12, 2);
    v_allowances_total DECIMAL(12, 2);
BEGIN
    -- Get basic pay
    SELECT COALESCE(basic_pay, 0) INTO v_basic_pay
    FROM staff
    WHERE id = p_staff_id;
    
    -- Get sum of allowances
    SELECT COALESCE(SUM(amount), 0) INTO v_allowances_total
    FROM staff_allowances
    WHERE staff_id = p_staff_id;
    
    RETURN COALESCE(v_basic_pay, 0) + COALESCE(v_allowances_total, 0);
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 8. FUNCTION: Calculate net pay (gross_pay - sum of deductions)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_net_pay(p_staff_id INTEGER)
RETURNS DECIMAL(12, 2) AS $$
DECLARE
    v_gross_pay DECIMAL(12, 2);
    v_deductions_total DECIMAL(12, 2);
BEGIN
    -- Get gross pay
    SELECT COALESCE(gross_pay, 0) INTO v_gross_pay
    FROM staff
    WHERE id = p_staff_id;
    
    -- Get sum of all deductions
    SELECT COALESCE(SUM(amount), 0) INTO v_deductions_total
    FROM staff_deductions
    WHERE staff_id = p_staff_id;
    
    RETURN COALESCE(v_gross_pay, 0) - COALESCE(v_deductions_total, 0);
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 9. FUNCTION: Update age when birthday changes
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_staff_age()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.birthday IS NOT NULL THEN
        NEW.age := calculate_age(NEW.birthday);
    ELSE
        NEW.age := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 10. TRIGGER: Update age before insert or update
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_update_staff_age ON staff;
CREATE TRIGGER trigger_update_staff_age
    BEFORE INSERT OR UPDATE OF birthday ON staff
    FOR EACH ROW
    EXECUTE FUNCTION update_staff_age();

-- ----------------------------------------------------------------------------
-- 11. FUNCTIONS: Update gross_pay (Split for staff and allowances)
-- ----------------------------------------------------------------------------

-- Function for STAFF table changes
CREATE OR REPLACE FUNCTION update_staff_gross_pay_on_staff_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate gross_pay using the helper function
    -- Using NEW.id because this runs on the staff table
    NEW.gross_pay := calculate_gross_pay(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for ALLOWANCES table changes
CREATE OR REPLACE FUNCTION update_staff_gross_pay_on_allowance_change()
RETURNS TRIGGER AS $$
DECLARE
    target_staff_id INTEGER;
BEGIN
    -- Determine the staff_id based on the operation
    IF (TG_OP = 'DELETE') THEN
        target_staff_id := OLD.staff_id;
    ELSE
        target_staff_id := NEW.staff_id;
    END IF;

    -- Update the staff member's gross_pay
    UPDATE staff
    SET gross_pay = calculate_gross_pay(target_staff_id)
    WHERE id = target_staff_id;
    
    RETURN NULL; -- Return value ignored for AFTER triggers
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 12. TRIGGERS: Update gross_pay
-- ----------------------------------------------------------------------------

-- Trigger on STAFF table (BEFORE update/insert is better for updating its own column)
DROP TRIGGER IF EXISTS trigger_update_gross_pay_on_staff_change ON staff;
CREATE TRIGGER trigger_update_gross_pay_on_staff_change
    BEFORE INSERT OR UPDATE OF basic_pay ON staff
    FOR EACH ROW
    EXECUTE FUNCTION update_staff_gross_pay_on_staff_change();

-- Triggers on STAFF_ALLOWANCES table
DROP TRIGGER IF EXISTS trigger_update_gross_pay_on_allowance_insert ON staff_allowances;
CREATE TRIGGER trigger_update_gross_pay_on_allowance_insert
    AFTER INSERT ON staff_allowances
    FOR EACH ROW
    EXECUTE FUNCTION update_staff_gross_pay_on_allowance_change();

DROP TRIGGER IF EXISTS trigger_update_gross_pay_on_allowance_update ON staff_allowances;
CREATE TRIGGER trigger_update_gross_pay_on_allowance_update
    AFTER UPDATE OF amount, staff_id ON staff_allowances
    FOR EACH ROW
    EXECUTE FUNCTION update_staff_gross_pay_on_allowance_change();

DROP TRIGGER IF EXISTS trigger_update_gross_pay_on_allowance_delete ON staff_allowances;
CREATE TRIGGER trigger_update_gross_pay_on_allowance_delete
    AFTER DELETE ON staff_allowances
    FOR EACH ROW
    EXECUTE FUNCTION update_staff_gross_pay_on_allowance_change();

-- ----------------------------------------------------------------------------
-- 13. FUNCTIONS: Update net_pay (Split for staff and deductions)
-- ----------------------------------------------------------------------------

-- Function for STAFF table changes
CREATE OR REPLACE FUNCTION update_staff_net_pay_on_staff_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate net_pay using the helper function
    -- Using NEW.id because this runs on the staff table
    NEW.net_pay := calculate_net_pay(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for DEDUCTIONS table changes
CREATE OR REPLACE FUNCTION update_staff_net_pay_on_deduction_change()
RETURNS TRIGGER AS $$
DECLARE
    target_staff_id INTEGER;
BEGIN
    -- Determine the staff_id based on the operation
    IF (TG_OP = 'DELETE') THEN
        target_staff_id := OLD.staff_id;
    ELSE
        target_staff_id := NEW.staff_id;
    END IF;

    -- Update the staff member's net_pay
    UPDATE staff
    SET net_pay = calculate_net_pay(target_staff_id)
    WHERE id = target_staff_id;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 14. TRIGGERS: Update net_pay
-- ----------------------------------------------------------------------------

-- Trigger on STAFF table
DROP TRIGGER IF EXISTS trigger_update_net_pay_on_staff_change ON staff;
CREATE TRIGGER trigger_update_net_pay_on_staff_change
    BEFORE INSERT OR UPDATE OF gross_pay ON staff
    FOR EACH ROW
    EXECUTE FUNCTION update_staff_net_pay_on_staff_change();

-- Triggers on STAFF_DEDUCTIONS table
DROP TRIGGER IF EXISTS trigger_update_net_pay_on_deduction_insert ON staff_deductions;
CREATE TRIGGER trigger_update_net_pay_on_deduction_insert
    AFTER INSERT ON staff_deductions
    FOR EACH ROW
    EXECUTE FUNCTION update_staff_net_pay_on_deduction_change();

DROP TRIGGER IF EXISTS trigger_update_net_pay_on_deduction_update ON staff_deductions;
CREATE TRIGGER trigger_update_net_pay_on_deduction_update
    AFTER UPDATE OF amount, staff_id ON staff_deductions
    FOR EACH ROW
    EXECUTE FUNCTION update_staff_net_pay_on_deduction_change();

DROP TRIGGER IF EXISTS trigger_update_net_pay_on_deduction_delete ON staff_deductions;
CREATE TRIGGER trigger_update_net_pay_on_deduction_delete
    AFTER DELETE ON staff_deductions
    FOR EACH ROW
    EXECUTE FUNCTION update_staff_net_pay_on_deduction_change();

-- ----------------------------------------------------------------------------
-- 15. FUNCTION: Update updated_at timestamp
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 16. TRIGGERS: Update updated_at on departments and staff_custom_fields
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_update_departments_updated_at ON departments;
CREATE TRIGGER trigger_update_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_staff_updated_at ON staff;
CREATE TRIGGER trigger_update_staff_updated_at
    BEFORE UPDATE ON staff
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_staff_custom_fields_updated_at ON staff_custom_fields;
CREATE TRIGGER trigger_update_staff_custom_fields_updated_at
    BEFORE UPDATE ON staff_custom_fields
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 17. INSERT DEFAULT DEPARTMENTS (Optional)
-- ----------------------------------------------------------------------------
INSERT INTO departments (name, sort_order)
VALUES 
    ('Science Department', 0),
    ('Mathematics Department', 1),
    ('English Department', 2),
    ('Administration', 3),
    ('Maintenance', 4)
ON CONFLICT (name) DO NOTHING;

-- ----------------------------------------------------------------------------
-- END OF SCRIPT
-- ----------------------------------------------------------------------------
