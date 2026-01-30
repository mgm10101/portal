-- ========================================
-- FIX FOR INVENTORY STOCK HISTORY TRANSACTION TYPE
-- ========================================

-- 1. First, drop the existing trigger to prevent conflicts
DROP TRIGGER IF EXISTS trigger_update_stock_history ON inventory_items;

-- 2. Drop the existing function
DROP FUNCTION IF EXISTS update_stock_history();

-- 3. Create the corrected function that only creates history for stock changes
CREATE OR REPLACE FUNCTION update_stock_history() RETURNS TRIGGER AS $$
BEGIN
    -- Only create history entry if stock quantity actually changed
    IF NEW.in_stock != OLD.in_stock THEN
        INSERT INTO inventory_stock_history (
            inventory_item_id, transaction_date, transaction_type,
            quantity_change, quantity_before, quantity_after,
            unit_price_at_time, reference_type, notes
        ) VALUES (
            NEW.id, CURRENT_DATE, 'Stock Adjustment (Damaged)',
            NEW.in_stock - OLD.in_stock, OLD.in_stock, NEW.in_stock,
            NEW.unit_price, 'manual_update', 'Inventory item updated'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Recreate the trigger (only fires on stock changes, not description updates)
CREATE TRIGGER trigger_update_stock_history
    AFTER UPDATE OF in_stock ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_stock_history();
