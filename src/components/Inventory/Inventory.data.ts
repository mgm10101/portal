import { supabase } from '../../supabaseClient';

export interface InventoryItem {
  id: number;
  item_name: string;
  description?: string;
  category_id?: number;
  in_stock: number;
  unit_price: number;
  storage_location_id?: number;
  minimum_stock_level: number;
  pending_requisitions: number;
  status: string;
  total_value: number;
  created_at: string;
  updated_at: string;
  category_name?: string;
  storage_location_name?: string;
}

export interface InventoryCategory {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryStorageLocation {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockHistory {
  id: number;
  inventory_item_id: number;
  item_name?: string;
  transaction_date: string;
  transaction_type: string;
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  unit_price_at_time: number;
  reference_type?: string;
  reference_id?: number;
  notes?: string;
  created_at: string;
}

export interface StockUpdate {
  id: number;
  update_date: string;
  update_type: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface StockUpdateItem {
  id: number;
  stock_update_id: number;
  inventory_item_id: number;
  quantity_change: number;
  unit_price_at_time: number;
  notes?: string;
}

// Inventory Items
export const getInventoryItems = async (): Promise<InventoryItem[]> => {
  const { data, error } = await supabase
    .from('inventory_summary')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getInventoryItem = async (id: number): Promise<InventoryItem | null> => {
  const { data, error } = await supabase
    .from('inventory_summary')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const createInventoryItem = async (item: Omit<InventoryItem, 'id' | 'status' | 'total_value' | 'created_at' | 'updated_at' | 'category_name' | 'storage_location_name'>): Promise<InventoryItem> => {
  const { data, error } = await supabase
    .from('inventory_items')
    .insert([item])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateInventoryItem = async (id: number, item: Partial<InventoryItem>): Promise<InventoryItem> => {
  const { data, error } = await supabase
    .from('inventory_items')
    .update(item)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteInventoryItem = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from('inventory_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Categories
export const getInventoryCategories = async (): Promise<InventoryCategory[]> => {
  const { data, error } = await supabase
    .from('inventory_categories')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
};

export const createInventoryCategory = async (category: Omit<InventoryCategory, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryCategory> => {
  const { data, error } = await supabase
    .from('inventory_categories')
    .insert([category])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateInventoryCategory = async (id: number, category: Partial<InventoryCategory>): Promise<InventoryCategory> => {
  const { data, error } = await supabase
    .from('inventory_categories')
    .update(category)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteInventoryCategory = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from('inventory_categories')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
};

// Storage Locations
export const getInventoryStorageLocations = async (): Promise<InventoryStorageLocation[]> => {
  const { data, error } = await supabase
    .from('inventory_storage_locations')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
};

export const createInventoryStorageLocation = async (location: Omit<InventoryStorageLocation, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryStorageLocation> => {
  const { data, error } = await supabase
    .from('inventory_storage_locations')
    .insert([location])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateInventoryStorageLocation = async (id: number, location: Partial<InventoryStorageLocation>): Promise<InventoryStorageLocation> => {
  const { data, error } = await supabase
    .from('inventory_storage_locations')
    .update(location)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteInventoryStorageLocation = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from('inventory_storage_locations')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
};

// Stock History
export const getStockHistory = async (itemId?: number): Promise<StockHistory[]> => {
  let query = supabase
    .from('stock_history_detail')
    .select('*')
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (itemId) {
    query = query.eq('inventory_item_id', itemId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const createStockHistoryEntry = async (entry: Omit<StockHistory, 'id' | 'created_at' | 'item_name'>): Promise<StockHistory> => {
  console.log('📚 [createStockHistoryEntry] Creating history entry:', entry);
  
  const { data, error } = await supabase
    .from('inventory_stock_history')
    .insert([entry])
    .select()
    .single();

  console.log('📝 [createStockHistoryEntry] History entry result:', { data, error });

  if (error) {
    console.error('❌ [createStockHistoryEntry] Error creating history entry:', error);
    throw error;
  }
  
  console.log('✅ [createStockHistoryEntry] History entry created successfully');
  return data;
};

// Stock Updates (Batch)
export const createStockUpdate = async (update: Omit<StockUpdate, 'id' | 'created_at' | 'created_by'>, items: Omit<StockUpdateItem, 'id' | 'stock_update_id'>[]): Promise<StockUpdate> => {
  // First create the stock update
  const { data: stockUpdate, error: updateError } = await supabase
    .from('inventory_stock_updates')
    .insert([update])
    .select()
    .single();

  if (updateError) throw updateError;

  // Then create the stock update items
  const stockUpdateItems = items.map(item => ({
    ...item,
    stock_update_id: stockUpdate.id
  }));

  const { error: itemsError } = await supabase
    .from('inventory_stock_update_items')
    .insert(stockUpdateItems);

  if (itemsError) throw itemsError;

  // Update inventory items quantities
  for (const item of items) {
    const { data: currentItem } = await supabase
      .from('inventory_items')
      .select('in_stock')
      .eq('id', item.inventory_item_id)
      .single();

    if (currentItem) {
      const newStock = currentItem.in_stock + item.quantity_change;
      await supabase
        .from('inventory_items')
        .update({ in_stock: newStock })
        .eq('id', item.inventory_item_id);

      // Create stock history entry
      await createStockHistoryEntry({
        inventory_item_id: item.inventory_item_id,
        transaction_date: update.update_date,
        transaction_type: update.update_type,
        quantity_change: item.quantity_change,
        quantity_before: currentItem.in_stock,
        quantity_after: newStock,
        unit_price_at_time: item.unit_price_at_time,
        reference_type: 'manual_update',
        reference_id: stockUpdate.id,
        notes: item.notes || update.notes
      });
    }
  }

  return stockUpdate;
};

export const updateStockForItem = async (itemId: number, quantityChange: number, transactionType: string, notes?: string): Promise<void> => {
  console.log('🔄 [updateStockForItem] Function called with:', {
    itemId,
    quantityChange,
    transactionType,
    notes
  });

  // Get current item
  console.log('📊 [updateStockForItem] Fetching current item from database...');
  const { data: currentItem, error: fetchError } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('id', itemId)
    .single();

  console.log('📋 [updateStockForItem] Fetch result:', {
    currentItem,
    fetchError
  });

  if (fetchError) {
    console.error('❌ [updateStockForItem] Fetch error:', fetchError);
    throw fetchError;
  }
  if (!currentItem) {
    console.error('❌ [updateStockForItem] Item not found');
    throw new Error('Item not found');
  }

  const newStock = currentItem.in_stock + quantityChange;
  console.log('📈 [updateStockForItem] Stock calculation:', {
    currentStock: currentItem.in_stock,
    quantityChange,
    newStock
  });

  // Update inventory item
  console.log('💾 [updateStockForItem] Updating inventory item...');
  const { error: updateError } = await supabase
    .from('inventory_items')
    .update({ in_stock: newStock })
    .eq('id', itemId);

  console.log('📝 [updateStockForItem] Update result:', { updateError });

  if (updateError) {
    console.error('❌ [updateStockForItem] Update error:', updateError);
    throw updateError;
  }

  // Create stock history entry
  console.log('📚 [updateStockForItem] Creating stock history entry...');
  await createStockHistoryEntry({
    inventory_item_id: itemId,
    transaction_date: new Date().toISOString().split('T')[0],
    transaction_type: transactionType,
    quantity_change: quantityChange,
    quantity_before: currentItem.in_stock,
    quantity_after: newStock,
    unit_price_at_time: currentItem.unit_price,
    reference_type: 'manual_update',
    notes: notes
  });

  console.log('✅ [updateStockForItem] Function completed successfully');
};
