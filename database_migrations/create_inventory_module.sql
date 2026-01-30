-- ============================================================================
-- INVENTORY MODULE DATABASE STRUCTURE (COMPLETE WITH FIXES)
-- ============================================================================
-- This script creates the complete inventory module database structure
-- including tables, indexes, triggers, views, and sample data
-- Updated with fixes for stock history transaction type constraints
-- ============================================================================

-- ------------------------------------------------------------------------------
-- 1. INVENTORY CATEGORIES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE inventory_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 2. INVENTORY STORAGE LOCATIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE inventory_storage_locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 3. MAIN INVENTORY ITEMS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE inventory_items (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES inventory_categories(id),
    in_stock INTEGER NOT NULL DEFAULT 0,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    storage_location_id INTEGER REFERENCES inventory_storage_locations(id),
    minimum_stock_level INTEGER DEFAULT 10,
    pending_requisitions INTEGER DEFAULT 0,
    status VARCHAR(50) GENERATED ALWAYS AS (
        CASE 
            WHEN pending_requisitions > in_stock THEN 'Negative Stock'
            WHEN in_stock = 0 THEN 'Out of Stock'
            WHEN in_stock <= minimum_stock_level THEN 'Low Stock'
            ELSE 'In Stock'
        END
    ) STORED,
    total_value DECIMAL(12,2) GENERATED ALWAYS AS (in_stock * unit_price) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 4. INVENTORY STOCK HISTORY TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE inventory_stock_history (
    id SERIAL PRIMARY KEY,
    inventory_item_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
        'New Stock',
        'Stock Adjustment (Damaged)', 
        'Stock Adjustment (Loss/Theft)',
        'Stock Adjustment (Expired)',
        'Issued for Use',
        'Returned'
    )),
    quantity_change INTEGER NOT NULL, -- Positive for additions, negative for subtractions
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    unit_price_at_time DECIMAL(10,2) NOT NULL, -- Snapshot of unit price at transaction time
    reference_type VARCHAR(50), -- 'manual_update', 'asset_issuance', 'requisition'
    reference_id INTEGER, -- Foreign key to related module tables
    notes TEXT,
    created_by UUID REFERENCES users(id), -- UUID for user reference
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 5. BATCH STOCK UPDATES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE inventory_stock_updates (
    id SERIAL PRIMARY KEY,
    update_date DATE NOT NULL,
    update_type VARCHAR(50) NOT NULL CHECK (update_type IN (
        'New Stock',
        'Stock Adjustment (Damaged)', 
        'Stock Adjustment (Loss/Theft)',
        'Stock Adjustment (Expired)'
    )),
    notes TEXT,
    created_by UUID REFERENCES users(id), -- UUID for user reference
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 6. BATCH STOCK UPDATE ITEMS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE inventory_stock_update_items (
    id SERIAL PRIMARY KEY,
    stock_update_id INTEGER REFERENCES inventory_stock_updates(id) ON DELETE CASCADE,
    inventory_item_id INTEGER REFERENCES inventory_items(id) ON DELETE CASCADE,
    quantity_change INTEGER NOT NULL,
    unit_price_at_time DECIMAL(10,2) NOT NULL,
    notes TEXT
);

-- ------------------------------------------------------------------------------
-- 7. PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------

-- Inventory items indexes
CREATE INDEX idx_inventory_items_category ON inventory_items(category_id);
CREATE INDEX idx_inventory_items_status ON inventory_items(status);
CREATE INDEX idx_inventory_items_storage ON inventory_items(storage_location_id);
CREATE INDEX idx_inventory_items_name ON inventory_items(item_name);

-- Stock history indexes
CREATE INDEX idx_stock_history_item_date ON inventory_stock_history(inventory_item_id, transaction_date DESC);
CREATE INDEX idx_stock_history_type ON inventory_stock_history(transaction_type);
CREATE INDEX idx_stock_history_date ON inventory_stock_history(transaction_date DESC);
CREATE INDEX idx_stock_history_reference ON inventory_stock_history(reference_type, reference_id);

-- Batch updates indexes
CREATE INDEX idx_stock_updates_date ON inventory_stock_updates(update_date DESC);
CREATE INDEX idx_stock_update_items_update ON inventory_stock_update_items(stock_update_id);
CREATE INDEX idx_stock_update_items_item ON inventory_stock_update_items(inventory_item_id);

-- ------------------------------------------------------------------------------
-- 8. TRIGGERS FOR AUTOMATION (FIXED VERSION)
-- ------------------------------------------------------------------------------

-- Function to update stock history when inventory changes (FIXED)
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

-- Trigger to automatically update stock history (FIXED - only fires on stock changes)
CREATE TRIGGER trigger_update_stock_history
    AFTER UPDATE OF in_stock ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_stock_history();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at timestamps
CREATE TRIGGER trigger_inventory_items_updated_at
    BEFORE UPDATE ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_inventory_categories_updated_at
    BEFORE UPDATE ON inventory_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_inventory_storage_locations_updated_at
    BEFORE UPDATE ON inventory_storage_locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 9. VIEWS FOR COMMON QUERIES
-- ------------------------------------------------------------------------------

-- View for inventory summary with category and location names
CREATE VIEW inventory_summary AS
SELECT 
    ii.id,
    ii.item_name,
    ii.description,
    ii.in_stock,
    ii.unit_price,
    ii.total_value,
    ii.minimum_stock_level,
    ii.pending_requisitions,
    ii.status,
    ic.name as category_name,
    isl.name as storage_location_name,
    ii.created_at,
    ii.updated_at
FROM inventory_items ii
LEFT JOIN inventory_categories ic ON ii.category_id = ic.id
LEFT JOIN inventory_storage_locations isl ON ii.storage_location_id = isl.id;

-- View for stock history with item names
CREATE VIEW stock_history_detail AS
SELECT 
    ish.id,
    ish.inventory_item_id,
    ii.item_name,
    ish.transaction_date,
    ish.transaction_type,
    ish.quantity_change,
    ish.quantity_before,
    ish.quantity_after,
    ish.unit_price_at_time,
    ish.reference_type,
    ish.reference_id,
    ish.notes,
    ish.created_at
FROM inventory_stock_history ish
JOIN inventory_items ii ON ish.inventory_item_id = ii.id
ORDER BY ish.transaction_date DESC, ish.created_at DESC;

-- ------------------------------------------------------------------------------
-- 10. SAMPLE DATA (Optional - for testing)
-- ------------------------------------------------------------------------------

-- Sample categories
INSERT INTO inventory_categories (name, description) VALUES
('Stationery', 'Office stationery and supplies'),
('Equipment', 'Electronic and mechanical equipment'),
('Clothing', 'Uniforms and apparel'),
('Food', 'Kitchen and food supplies'),
('Maintenance', 'Maintenance and cleaning supplies');

-- Sample storage locations
INSERT INTO inventory_storage_locations (name, description) VALUES
('Main Store', 'Primary storage location'),
('Kitchen Store', 'Kitchen supplies storage'),
('Pantry', 'Food items storage'),
('Maintenance Room', 'Maintenance supplies'),
('Tool Shed', 'Tools and equipment'),
('Electrical Storage', 'Electrical components'),
('Science Lab', 'Laboratory equipment'),
('Library', 'Library supplies');

-- Sample inventory items
INSERT INTO inventory_items (item_name, description, category_id, in_stock, unit_price, storage_location_id, minimum_stock_level) VALUES
('Exercise Books', 'A4 size ruled exercise books for students', 1, 500, 2.50, 1, 100),
('Ballpoint Pens', 'Blue and black ballpoint pens pack of 10', 1, 1200, 1.20, 1, 200),
('Pencils', 'HB pencils pack of 12', 1, 0, 0.80, 1, 150),
('Uniforms - Grade 8', 'Standard school uniform set for Grade 8 students', 3, 0, 25.00, 1, 20),
('Computers', 'Desktop computers for computer lab', 2, 30, 450.00, 6, 10);

-- Sample stock history (created_by will be NULL for now, which is fine)
INSERT INTO inventory_stock_history (inventory_item_id, transaction_date, transaction_type, quantity_change, quantity_before, quantity_after, unit_price_at_time, notes) VALUES
(1, '2024-01-15', 'New Stock', 50, 0, 50, 2.50, 'Initial stock'),
(1, '2024-02-01', 'New Stock', 25, 50, 75, 2.50, 'Additional stock'),
(1, '2024-01-20', 'Issued for Use', -15, 75, 60, 2.50, 'Issued to classrooms'),
(1, '2024-01-25', 'Returned', 5, 60, 65, 2.50, 'Unused items returned');

-- ------------------------------------------------------------------------------
-- MIGRATION NOTES
-- ------------------------------------------------------------------------------
-- 
-- Key fixes applied:
-- 1. Fixed stock history trigger to only fire on stock quantity changes
-- 2. Changed transaction_type from 'Manual Update' to 'Stock Adjustment (Damaged)'
-- 3. Used UUID for created_by fields instead of INTEGER
-- 4. Added proper validation to prevent constraint violations
--
-- This migration should be run on a fresh database or after dropping existing
-- inventory tables to recreate them with the corrected structure.
--
-- For existing databases with the old trigger, use the separate fix script:
-- fix_inventory_trigger_clean.sql
--
