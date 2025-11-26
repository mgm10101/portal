-- ============================================================================
-- FIX STAFF MODULE TRIGGERS
-- ============================================================================
-- The previous triggers used shared functions that referenced columns (staff_id)
-- that don't exist in the staff table, causing a "record new has no field staff_id" error.
-- This script splits those shared functions into specific functions for each table.
-- ============================================================================

-- 1. FIX GROSS PAY TRIGGERS
-- ----------------------------------------------------------------------------

-- Drop the old shared function and triggers
DROP TRIGGER IF EXISTS trigger_update_gross_pay_staff ON staff;
DROP TRIGGER IF EXISTS trigger_update_gross_pay_allowances_insert ON staff_allowances;
DROP TRIGGER IF EXISTS trigger_update_gross_pay_allowances_update ON staff_allowances;
DROP TRIGGER IF EXISTS trigger_update_gross_pay_allowances_delete ON staff_allowances;
DROP FUNCTION IF EXISTS update_staff_gross_pay();

-- Create function for STAFF table changes
CREATE OR REPLACE FUNCTION update_staff_gross_pay_on_staff_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate gross_pay using the helper function
    -- Using NEW.id because this runs on the staff table
    NEW.gross_pay := calculate_gross_pay(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function for ALLOWANCES table changes
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

-- Re-create triggers using the specific functions

-- Trigger on STAFF table (BEFORE update/insert is better for updating its own column)
CREATE TRIGGER trigger_update_gross_pay_on_staff_change
    BEFORE INSERT OR UPDATE OF basic_pay ON staff
    FOR EACH ROW
    EXECUTE FUNCTION update_staff_gross_pay_on_staff_change();

-- Triggers on STAFF_ALLOWANCES table
CREATE TRIGGER trigger_update_gross_pay_on_allowance_insert
    AFTER INSERT ON staff_allowances
    FOR EACH ROW
    EXECUTE FUNCTION update_staff_gross_pay_on_allowance_change();

CREATE TRIGGER trigger_update_gross_pay_on_allowance_update
    AFTER UPDATE OF amount, staff_id ON staff_allowances
    FOR EACH ROW
    EXECUTE FUNCTION update_staff_gross_pay_on_allowance_change();

CREATE TRIGGER trigger_update_gross_pay_on_allowance_delete
    AFTER DELETE ON staff_allowances
    FOR EACH ROW
    EXECUTE FUNCTION update_staff_gross_pay_on_allowance_change();


-- 2. FIX NET PAY TRIGGERS
-- ----------------------------------------------------------------------------

-- Drop the old shared function and triggers
DROP TRIGGER IF EXISTS trigger_update_net_pay_staff ON staff;
DROP TRIGGER IF EXISTS trigger_update_net_pay_deductions_insert ON staff_deductions;
DROP TRIGGER IF EXISTS trigger_update_net_pay_deductions_update ON staff_deductions;
DROP TRIGGER IF EXISTS trigger_update_net_pay_deductions_delete ON staff_deductions;
DROP FUNCTION IF EXISTS update_staff_net_pay();

-- Create function for STAFF table changes
CREATE OR REPLACE FUNCTION update_staff_net_pay_on_staff_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate net_pay using the helper function
    -- Using NEW.id because this runs on the staff table
    NEW.net_pay := calculate_net_pay(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function for DEDUCTIONS table changes
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

-- Re-create triggers using the specific functions

-- Trigger on STAFF table (BEFORE update/insert to modify the row being saved)
CREATE TRIGGER trigger_update_net_pay_on_staff_change
    BEFORE INSERT OR UPDATE OF gross_pay ON staff
    FOR EACH ROW
    EXECUTE FUNCTION update_staff_net_pay_on_staff_change();

-- Triggers on STAFF_DEDUCTIONS table
CREATE TRIGGER trigger_update_net_pay_on_deduction_insert
    AFTER INSERT ON staff_deductions
    FOR EACH ROW
    EXECUTE FUNCTION update_staff_net_pay_on_deduction_change();

CREATE TRIGGER trigger_update_net_pay_on_deduction_update
    AFTER UPDATE OF amount, staff_id ON staff_deductions
    FOR EACH ROW
    EXECUTE FUNCTION update_staff_net_pay_on_deduction_change();

CREATE TRIGGER trigger_update_net_pay_on_deduction_delete
    AFTER DELETE ON staff_deductions
    FOR EACH ROW
    EXECUTE FUNCTION update_staff_net_pay_on_deduction_change();

