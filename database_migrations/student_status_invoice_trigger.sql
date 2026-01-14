-- Function to update invoice withdrawn status based on student status
CREATE OR REPLACE FUNCTION update_invoice_withdrawn_on_student_status()
RETURNS TRIGGER AS $$
BEGIN
    -- When student status changes to Inactive, withdraw all their invoices
    IF NEW.status = 'Inactive' AND OLD.status != 'Inactive' THEN
        UPDATE invoices
        SET withdrawn = TRUE
        WHERE admission_number = NEW.admission_number;
    END IF;
    
    -- When student status changes to Active, unwithdraw all their invoices
    IF NEW.status = 'Active' AND OLD.status != 'Active' THEN
        UPDATE invoices
        SET withdrawn = FALSE
        WHERE admission_number = NEW.admission_number;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function when student status is updated
DROP TRIGGER IF EXISTS trigger_update_invoice_withdrawn ON students;
CREATE TRIGGER trigger_update_invoice_withdrawn
AFTER UPDATE ON students
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_invoice_withdrawn_on_student_status();
