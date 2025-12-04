-- Update expenses_view to include notes and balance_due
-- Also add calculated balance_due based on payments
-- NOTE: Run this AFTER creating the expense_payments table (create_expense_payments_table.sql)

-- Drop the existing view first to avoid column name conflicts
DROP VIEW IF EXISTS expenses_view CASCADE;

CREATE VIEW expenses_view AS
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
    e.notes,
    -- Calculate balance_due: expense amount minus sum of all payments
    COALESCE(
        e.amount - COALESCE(
            (SELECT SUM(ep.amount) 
             FROM expense_payments ep 
             WHERE ep.expense_id = e.id), 
            0
        ),
        e.amount
    ) AS balance_due,
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

