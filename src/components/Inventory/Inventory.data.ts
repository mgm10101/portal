import { supabase } from '../../supabaseClient';

export interface InventoryItem {
  id: number;
  item_name: string;
  description?: string;
  category_id?: number;
  in_stock: number;
  units?: string;
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

export interface Requisition {
  id: string;
  item: string;
  description?: string;
  req_by: string;
  department: string;
  date: string;
  requisitioned: number;
  issued: number;
  unit_price?: number;
  total_price?: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}

// Get a single inventory item by ID (includes units field)
export const getInventoryItemById = async (id: number): Promise<InventoryItem> => {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

// Inventory Items
export const getInventoryItems = async (): Promise<InventoryItem[]> => {
  const { data, error } = await supabase
    .from('inventory_items')
    .select(`
      id,
      item_name,
      description,
      category_id,
      in_stock,
      units,
      unit_price,
      storage_location_id,
      minimum_stock_level,
      pending_requisitions,
      status,
      total_value,
      created_at,
      updated_at,
      inventory_categories (
        id,
        name
      ),
      inventory_storage_locations (
        id,
        name
      )
    `)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  
  // Transform the data to match the expected interface
  return (data || []).map(item => {
    const category = item.inventory_categories as any;
    const storage = item.inventory_storage_locations as any;
    
    return {
      ...item,
      category_name: Array.isArray(category) ? category[0]?.name : category?.name || 'N/A',
      storage_location_name: Array.isArray(storage) ? storage[0]?.name : storage?.name || 'N/A'
    };
  });
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
    .delete()
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
    .delete()
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

// Submit Requisition - Validates stock, creates requisition, updates inventory, and creates stock history entries
export const submitRequisition = async (
  requisitionData: {
    item_name: string;
    description?: string;
    req_by: string;
    department: string;
    date: string;
    requisitioned: number;
    issued: number;
  },
  lineItems: Array<{
    item: string;
    description: string;
    qtyRequisitioned: string;
    qtyIssued: string;
  }>,
  staffData: { full_name: string; department_name: string }
): Promise<{ success: boolean; message: string; requisitionId?: string }> => {
  try {
    // Validate that we have line items
    const validLineItems = lineItems.filter(item => item.item);

    if (validLineItems.length === 0) {
      return { success: false, message: 'Please add at least one item' };
    }

    // Validate stock availability for items with issued quantities and capture unit_price
    let itemUnitPrice: number | null = null;
    for (const lineItem of validLineItems) {
      const trimmedItemName = lineItem.item.trim();
      const trimmedDescription = lineItem.description ? lineItem.description.trim() : '';

      // Strict match with both item_name and description (case-insensitive, trimmed)
      const { data: inventoryItem } = await supabase
        .from('inventory_items')
        .select('id, in_stock, item_name, unit_price')
        .ilike('item_name', trimmedItemName)
        .ilike('description', trimmedDescription)
        .maybeSingle();

      if (!inventoryItem) {
        return { success: false, message: `Item "${lineItem.item}"${trimmedDescription ? ` (${trimmedDescription})` : ''} not found in inventory` };
      }

      const issuedQty = parseInt(lineItem.qtyIssued);
      // Only validate stock if actually issuing items
      if (issuedQty > 0) {
        if (issuedQty > inventoryItem.in_stock) {
          return {
            success: false,
            message: `Insufficient stock for "${lineItem.item}". Available: ${inventoryItem.in_stock}, Requested to issue: ${issuedQty}`
          };
        }
      }

      // Capture unit_price from the first item
      if (itemUnitPrice === null) {
        itemUnitPrice = inventoryItem.unit_price;
      }
    }

    // Create the requisition record
    const { data: requisition, error: requisitionError } = await supabase
      .from('requisitions')
      .insert([
        {
          item: lineItems[0]?.item || '',
          description: lineItems[0]?.description || '',
          req_by: staffData.full_name,
          department: staffData.department_name,
          date: requisitionData.date,
          requisitioned: parseInt(lineItems[0]?.qtyRequisitioned) || 0,
          issued: parseInt(lineItems[0]?.qtyIssued) || 0,
          unit_price: itemUnitPrice || 0,
          status: 'Pending'
        }
      ])
      .select()
      .single();

    if (requisitionError) {
      console.error('❌ Requisition creation error:', requisitionError);
      return { success: false, message: 'Failed to create requisition record' };
    }

    // Process each line item with issued quantity > 0
    for (const lineItem of validLineItems) {
      const issuedQty = parseInt(lineItem.qtyIssued);
      const trimmedItemName = lineItem.item.trim();
      const trimmedDescription = lineItem.description ? lineItem.description.trim() : '';

      // Strict match with both item_name and description (case-insensitive, trimmed)
      const { data: inventoryItem } = await supabase
        .from('inventory_items')
        .select('id, in_stock, unit_price')
        .ilike('item_name', trimmedItemName)
        .ilike('description', trimmedDescription)
        .maybeSingle();

      if (inventoryItem) {
        const quantityBefore = inventoryItem.in_stock;
        const quantityAfter = quantityBefore - issuedQty;

        // Update inventory stock
        await supabase
          .from('inventory_items')
          .update({ in_stock: quantityAfter })
          .eq('id', inventoryItem.id);

        // Create stock history entry with transaction type indicating requisition
        await createStockHistoryEntry({
          inventory_item_id: inventoryItem.id,
          transaction_date: requisitionData.date,
          transaction_type: 'Issued for Use',
          quantity_change: -issuedQty,
          quantity_before: quantityBefore,
          quantity_after: quantityAfter,
          unit_price_at_time: inventoryItem.unit_price,
          reference_type: 'requisition',
          notes: `Issued to ${staffData.full_name} (${staffData.department_name})`
        });
      }
    }

    return {
      success: true,
      message: 'Requisition recorded successfully',
      requisitionId: requisition.id
    };
  } catch (error) {
    console.error('❌ [submitRequisition] Error:', error);
    return { success: false, message: 'An error occurred while processing the requisition' };
  }
};

// Get all requisitions
export const getRequisitions = async (): Promise<Requisition[]> => {
  const { data, error } = await supabase
    .from('requisitions')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ [getRequisitions] Error:', error);
    throw error;
  }

  return data || [];
};

// Update requisition with issued/returned quantities
export const updateRequisitionIssued = async (
  requisitionId: string,
  itemName: string,
  itemDescription: string,
  addToIssuedQty: number,
  returnQty: number,
  updateDate: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Get current requisition
    const { data: requisition, error: reqError } = await supabase
      .from('requisitions')
      .select('*')
      .eq('id', requisitionId)
      .single();

    if (reqError || !requisition) {
      return { success: false, message: 'Requisition not found' };
    }

    // Strict match with both item_name and description (case-insensitive, trimmed)
    const trimmedItemName = itemName.trim();
    const trimmedDescription = itemDescription ? itemDescription.trim() : '';
    const { data: inventoryItem } = await supabase
      .from('inventory_items')
      .select('id, in_stock, unit_price')
      .ilike('item_name', trimmedItemName)
      .ilike('description', trimmedDescription)
      .maybeSingle();

    if (!inventoryItem) {
      return { success: false, message: `No corresponding inventory record found for "${itemName}"${trimmedDescription ? ` (${trimmedDescription})` : ''}. The item may have been modified or deleted in inventory.` };
    }

    // Calculate new issued quantity and stock
    const newIssuedQty = requisition.issued + addToIssuedQty - returnQty;
    const newStock = inventoryItem.in_stock - addToIssuedQty + returnQty;

    // Check if new stock would be negative
    if (newStock < 0) {
      return { 
        success: false, 
        message: `Insufficient stock. Available: ${inventoryItem.in_stock}, trying to issue: ${addToIssuedQty}` 
      };
    }

    // Update requisition
    const { error: updateError } = await supabase
      .from('requisitions')
      .update({ issued: newIssuedQty })
      .eq('id', requisitionId);

    if (updateError) {
      return { success: false, message: 'Failed to update requisition' };
    }

    // Update inventory stock
    await supabase
      .from('inventory_items')
      .update({ in_stock: newStock })
      .eq('id', inventoryItem.id);

    // Create stock history entries for additional issued quantity
    if (addToIssuedQty > 0) {
      await createStockHistoryEntry({
        inventory_item_id: inventoryItem.id,
        transaction_date: updateDate,
        transaction_type: 'Issued for Use',
        quantity_change: -addToIssuedQty,
        quantity_before: inventoryItem.in_stock,
        quantity_after: inventoryItem.in_stock - addToIssuedQty,
        unit_price_at_time: inventoryItem.unit_price,
        reference_type: 'requisition',
        notes: `Additional issue to ${requisition.req_by} (${requisition.department})`
      });
    }

    // Create stock history entries for returned quantity
    if (returnQty > 0) {
      await createStockHistoryEntry({
        inventory_item_id: inventoryItem.id,
        transaction_date: updateDate,
        transaction_type: 'Returned',
        quantity_change: returnQty,
        quantity_before: inventoryItem.in_stock - addToIssuedQty,
        quantity_after: newStock,
        unit_price_at_time: inventoryItem.unit_price,
        reference_type: 'requisition',
        notes: `Returned by ${requisition.req_by} (${requisition.department})`
      });
    }

    return {
      success: true,
      message: 'Requisition updated successfully'
    };
  } catch (error) {
    console.error('❌ [updateRequisitionIssued] Error:', error);
    return { success: false, message: 'An error occurred while updating the requisition' };
  }
};
