import React, { useState } from 'react';

import { InventoryItem, InventoryCategory, InventoryStorageLocation, updateInventoryItem, updateStockForItem, StockHistory, getStockHistory } from './Inventory.data';

import { DropdownField } from '../Students/masterlist/DropdownField';

import { OptionsModal } from '../Students/masterlist/OptionsModal';



interface InventoryEditModalProps {

  item: InventoryItem;

  onClose: () => void;

  onSaved: () => void;

  categories: InventoryCategory[];

  storageLocations: InventoryStorageLocation[];

}



type StockUpdateType =

  | 'New Stock'

  | 'Stock Adjustment (Damaged)'

  | 'Stock Adjustment (Loss/Theft)'

  | 'Stock Adjustment (Expired)'

  | 'Stock Adjustment (Accounting Error)';

type StockUpdateDirection = 'add' | 'subtract';



interface StockUpdateFormData {

  date: string;

  type: StockUpdateType;

  direction: StockUpdateDirection;

  quantity: number;

}



interface UpdateStockModalProps {

  initialData: StockUpdateFormData;

  onClose: () => void;

  onSubmit: (data: StockUpdateFormData) => void;

}



const UpdateStockModal: React.FC<UpdateStockModalProps> = ({ initialData, onClose, onSubmit }) => {

  const [data, setData] = useState<StockUpdateFormData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);



  const deriveDirection = (type: StockUpdateType): StockUpdateDirection => {

    if (type === 'New Stock') return 'add';

    if (type === 'Stock Adjustment (Accounting Error)') return 'add'; // Default to add, but user can change

    return 'subtract';

  };



  return (

    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">

      <div className="bg-white rounded-lg p-6 w-full max-w-xl">

        <div className="flex items-center justify-between mb-4">

          <h3 className="text-lg font-medium text-gray-800">Update Stock</h3>

          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>

        </div>



        <div className="space-y-4">

          <div>

            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>

            <input

              type="date"

              value={data.date}

              onChange={(e) => setData({ ...data, date: e.target.value })}

              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"

            />

          </div>



          <div>

            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>

            <select

              value={data.type}

              onChange={(e) => {

                const nextType = e.target.value as StockUpdateType;

                setData({

                  ...data,

                  type: nextType,

                  direction: deriveDirection(nextType)

                });

              }}

              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"

            >

              <option value="New Stock">New Stock</option>

              <option value="Stock Adjustment (Damaged)">Stock Adjustment (Damaged)</option>

              <option value="Stock Adjustment (Loss/Theft)">Stock Adjustment (Loss/Theft)</option>

              <option value="Stock Adjustment (Expired)">Stock Adjustment (Expired)</option>

              <option value="Stock Adjustment (Accounting Error)">Stock Adjustment (Accounting Error)</option>

            </select>

          </div>



          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>

              {data.type === 'Stock Adjustment (Accounting Error)' ? (
                <select
                  value={data.direction}
                  onChange={(e) => {
                    setData({
                      ...data,
                      direction: e.target.value as StockUpdateDirection
                    });
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="add">Add</option>
                  <option value="subtract">Subtract</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={data.direction === 'add' ? 'Add' : 'Subtract'}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              )}

            </div>

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>

              <input

                type="number"

                min={0}

                value={data.quantity}

                onChange={(e) => setData({ ...data, quantity: parseInt(e.target.value) || 0 })}

                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"

              />

            </div>

          </div>



          <div className="flex justify-end space-x-3 pt-2">

            <button

              type="button"

              onClick={onClose}

              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"

            >

              Cancel

            </button>

            <button

              type="button"

              onClick={async () => {
                console.log('🔘 [UPDATE STOCK MODAL] Apply button clicked');
                console.log('📊 [UPDATE STOCK MODAL] Current data:', data);
                console.log('⏳ [UPDATE STOCK MODAL] Setting isSubmitting to true');
                
                setIsSubmitting(true);
                
                try {
                  console.log('🚀 [UPDATE STOCK MODAL] Calling onSubmit prop...');
                  await onSubmit(data);
                  console.log('✅ [UPDATE STOCK MODAL] onSubmit completed successfully');
                } catch (error) {
                  console.error('❌ [UPDATE STOCK MODAL] Error in onSubmit:', error);
                } finally {
                  console.log('🏁 [UPDATE STOCK MODAL] Setting isSubmitting to false');
                  setIsSubmitting(false);
                }
              }}

              disabled={isSubmitting}

              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"

            >

              {isSubmitting ? 'Applying...' : 'Apply'}

            </button>

          </div>

        </div>

      </div>

    </div>

  );

};

export const InventoryEditModal: React.FC<InventoryEditModalProps> = ({ item, onClose, onSaved, categories, storageLocations }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Scroll-on-hover state for restock tab
  const [isRestockHovering, setIsRestockHovering] = useState(false);
  const restockScrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showStorageLocationModal, setShowStorageLocationModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'restock'>('details');
  const [isUpdateStockOpen, setIsUpdateStockOpen] = useState(false);

  // Stock history state
  const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);
  const [filteredStockHistory, setFilteredStockHistory] = useState<StockHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');

  // Find category_id from category_name if category_id is undefined
  const getCategoryIdFromName = (categoryName?: string): number | undefined => {
    if (!categoryName) return undefined;
    const category = categories.find(cat => cat.name === categoryName);
    return category?.id;
  };

  // Find storage_location_id from storage_location_name if storage_location_id is undefined
  const getStorageLocationIdFromName = (locationName?: string): number | undefined => {
    if (!locationName) return undefined;
    const location = storageLocations.find((loc: any) => loc.name === locationName);
    return location?.id;
  };

  const derivedCategoryId = item.category_id || getCategoryIdFromName(item.category_name);
  const derivedStorageLocationId = item.storage_location_id || getStorageLocationIdFromName(item.storage_location_name);

  const [formData, setFormData] = useState({
    item_name: item.item_name,
    description: item.description || '',
    category_id: derivedCategoryId,
    in_stock: item.in_stock,
    unit_price: item.unit_price,
    storage_location_id: derivedStorageLocationId,
    minimum_stock_level: item.minimum_stock_level
  });

  const [stockUpdateInitialData, setStockUpdateInitialData] = useState<StockUpdateFormData>(() => ({
    date: new Date().toISOString().slice(0, 10),
    type: 'New Stock',
    direction: 'add',
    quantity: 0
  }));

  // Keyboard navigation for scrolling
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isHovering || !scrollContainerRef.current) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        scrollContainerRef.current.scrollBy({
          top: -100,
          behavior: 'smooth'
        });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        scrollContainerRef.current.scrollBy({
          top: 100,
          behavior: 'smooth'
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHovering]);

  // Keyboard navigation for scrolling restock tab
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isRestockHovering || !restockScrollContainerRef.current) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        restockScrollContainerRef.current.scrollBy({
          top: -100,
          behavior: 'smooth'
        });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        restockScrollContainerRef.current.scrollBy({
          top: 100,
          behavior: 'smooth'
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRestockHovering]);

  // Click outside to close functionality
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.modal-content')) return;
      if (target.closest('[role="dialog"]')) return;
      
      // Check if click is outside the modal backdrop
      if (target.classList.contains('fixed') && target.classList.contains('inset-0')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const [clearIfInvalid] = useState(() => {
    // Placeholder function for dropdown validation
    return () => {};
  });

  const handleCategorySelect = (id: number) => {
    setFormData({ ...formData, category_id: id });
  };

  const handleStorageSelect = (id: number) => {
    setFormData({ ...formData, storage_location_id: id });
  };

  const handleAddCategory = async (name: string) => {
    // TODO: Implement add category
    console.log('Add category:', name);
  };

  const handleDeleteCategory = async (id: number) => {
    // TODO: Implement delete category
    console.log('Delete category:', id);
  };

  const handleEditCategory = async (id: number, newName: string) => {
    // TODO: Implement edit category
    console.log('Edit category:', id, newName);
  };

  const handleAddStorageLocation = async (name: string) => {
    // TODO: Implement add storage location
    console.log('Add storage location:', name);
  };

  const handleDeleteStorageLocation = async (id: number) => {
    // TODO: Implement delete storage location
    console.log('Delete storage location:', id);
  };

  const handleEditStorageLocation = async (id: number, newName: string) => {
    // TODO: Implement edit storage location
    console.log('Edit storage location:', id, newName);
  };

  // Load stock history for the current item
  const loadStockHistory = async () => {
    try {
      setHistoryLoading(true);
      console.log('📚 [STOCK HISTORY] Loading history for item:', item.id);
      
      const history = await getStockHistory(item.id);
      console.log('📚 [STOCK HISTORY] Loaded history:', history);
      
      setStockHistory(history);
      filterStockHistory(history, historyDateFrom, historyDateTo);
    } catch (error: any) {
      console.error('❌ [STOCK HISTORY] Error loading history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Filter stock history based on date range
  const filterStockHistory = (history: StockHistory[], fromDate: string, toDate: string) => {
    let filtered = history;
    
    if (fromDate) {
      filtered = filtered.filter(item => 
        new Date(item.transaction_date) >= new Date(fromDate)
      );
    }
    
    if (toDate) {
      filtered = filtered.filter(item => 
        new Date(item.transaction_date) <= new Date(toDate)
      );
    }
    
    console.log('📚 [STOCK HISTORY] Filtered history:', filtered);
    setFilteredStockHistory(filtered);
  };

  // Handle date filter changes
  const handleDateFilterChange = (fromDate: string, toDate: string) => {
    setHistoryDateFrom(fromDate);
    setHistoryDateTo(toDate);
    filterStockHistory(stockHistory, fromDate, toDate);
  };

  // Load stock history when component mounts or when switching to restock tab
  React.useEffect(() => {
    if (activeTab === 'restock' && item.id) {
      loadStockHistory();
    }
  }, [activeTab, item.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.item_name.trim()) {
      alert('Item name is required');
      return;
    }
    
    if (!formData.category_id) {
      alert('Please select a category');
      return;
    }
    
    if (!formData.storage_location_id) {
      alert('Please select a storage location');
      return;
    }
    
    if (formData.unit_price < 0) {
      alert('Unit price cannot be negative');
      return;
    }
    
    if (formData.minimum_stock_level < 0) {
      alert('Minimum stock level cannot be negative');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare the update data
      const updateData = {
        item_name: formData.item_name.trim(),
        description: formData.description?.trim() || '',
        category_id: formData.category_id,
        unit_price: formData.unit_price,
        storage_location_id: formData.storage_location_id,
        minimum_stock_level: formData.minimum_stock_level
      };
      
      console.log('💾 Saving inventory item:', updateData);
      
      // Update the item in the database
      await updateInventoryItem(item.id, updateData);
      
      console.log('✅ Item updated successfully');
      
      // Show success message
      alert('Item updated successfully!');
      
      // Call the onSaved callback to refresh parent data
      onSaved();
      
      // Close the modal
      onClose();
      
    } catch (error: any) {
      console.error('❌ Error updating item:', error);
      alert(error.message || 'Failed to update item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };



  return (

    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">

      <div 
        ref={scrollContainerRef}
        className="modal-content bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden scrollbar-hide" 
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onWheel={(e) => {
          const target = e.currentTarget;
          target.scrollTop += e.deltaY;
        }}
        tabIndex={-1} // Make it focusable without requiring click
      >

        {isUpdateStockOpen && (

          <UpdateStockModal

            initialData={stockUpdateInitialData}

            onClose={() => setIsUpdateStockOpen(false)}

            onSubmit={async (data) => {
              console.log('🔄 [STOCK UPDATE] onSubmit called with data:', data);
              console.log('📊 [STOCK UPDATE] Item ID:', item.id);
              console.log('🔢 [STOCK UPDATE] Calculating delta...');
              
              try {
                const delta = data.direction === 'add' ? data.quantity : -data.quantity;
                console.log('➕➖ [STOCK UPDATE] Delta calculated:', delta);
                console.log('📝 [STOCK UPDATE] Transaction type:', data.type);
                
                console.log('🗄️ [STOCK UPDATE] Calling updateStockForItem...');
                
                // Update the database
                await updateStockForItem(
                  item.id,
                  delta,
                  data.type,
                  `Stock update: ${data.type}`
                );
                
                console.log('✅ [STOCK UPDATE] Database update successful');
                
                // Update local form data
                console.log('📊 [STOCK UPDATE] Updating local form data...');
                const newStock = Math.max(0, (formData.in_stock || 0) + delta);
                console.log('📈 [STOCK UPDATE] New stock calculated:', newStock);
                
                setFormData((prev) => {
                  console.log('⚙️ [STOCK UPDATE] setFormData called with prev:', prev);
                  const updated = {
                    ...prev,
                    in_stock: newStock
                  };
                  console.log('🔄 [STOCK UPDATE] New form data:', updated);
                  return updated;
                });

                console.log('💾 [STOCK UPDATE] Updating stockUpdateInitialData...');
                setStockUpdateInitialData(data);
                
                console.log('🚪 [STOCK UPDATE] Closing modal...');
                setIsUpdateStockOpen(false);
                
                // Refresh the parent data
                console.log('🔄 [STOCK UPDATE] Calling onSaved callback...');
                onSaved();
                
                console.log('🎉 [STOCK UPDATE] Showing success alert...');
                alert('Stock updated successfully!');
              } catch (error: any) {
                console.error('❌ [STOCK UPDATE] Error in onSubmit:', error);
                console.error('❌ [STOCK UPDATE] Error details:', {
                  message: error.message,
                  stack: error.stack,
                  name: error.name
                });
                alert(`Error updating stock: ${error.message}`);
              }
            }}

          />

        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="border-b border-gray-200">

            <nav className="flex">

              <button

                type="button"

                onClick={() => setActiveTab('details')}

                className={`flex-1 py-2 px-1 border-b-2 text-sm font-medium ${

                  activeTab === 'details'

                    ? 'border-blue-500 text-blue-600'

                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'

                }`}

              >

                Item Details

              </button>

              <button

                type="button"

                onClick={() => setActiveTab('restock')}

                className={`flex-1 py-2 px-1 border-b-2 text-sm font-medium ${

                  activeTab === 'restock'

                    ? 'border-blue-500 text-blue-600'

                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'

                }`}

              >

                Stock History

              </button>

            </nav>

          </div>



          {activeTab === 'details' && (

            <>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>

                  <input

                    type="text"

                    value={formData.item_name}

                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}

                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"

                  />

                </div>

                <div>

                  <DropdownField

                    name="category_id"

                    label="Category"

                    items={categories}

                    selectedId={formData.category_id}

                    clearIfInvalid={clearIfInvalid}

                    onOpenModal={() => setShowCategoryModal(true)}

                    onSelect={handleCategorySelect}

                    tableName="inventory_categories"

                    disableFetch={true}

                  />

                </div>

              </div>



              <div>

                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>

                <textarea

                  value={formData.description}

                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}

                  rows={2}

                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"

                />

              </div>



              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">In Stock</label>

                  <input

                    type="number"

                    value={formData.in_stock}

                    readOnly

                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed focus:ring-2 focus:ring-gray-500 focus:border-transparent"

                  />

                </div>

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Alert</label>

                  <input

                    type="number"

                    value={formData.minimum_stock_level}

                    onChange={(e) => setFormData({ ...formData, minimum_stock_level: parseInt(e.target.value) || 0 })}

                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"

                  />

                </div>

              </div>



              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (Ksh)</label>

                  <input

                    type="number"

                    step="0.01"

                    value={formData.unit_price}

                    onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}

                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"

                  />

                </div>

                <div>

                  <DropdownField

                    name="storage_location_id"

                    label="Storage Location"

                    items={storageLocations}

                    selectedId={formData.storage_location_id}

                    clearIfInvalid={clearIfInvalid}

                    onOpenModal={() => setShowStorageLocationModal(true)}

                    onSelect={handleStorageSelect}

                    tableName="inventory_storage_locations"

                    disableFetch={true}

                  />

                </div>

              </div>

            </>

          )}



          {activeTab === 'restock' && (
            <div 
              ref={restockScrollContainerRef}
              className="max-h-[60vh] overflow-y-auto scrollbar-hide"
              onMouseEnter={() => setIsRestockHovering(true)}
              onMouseLeave={() => setIsRestockHovering(false)}
              tabIndex={-1} // Make it focusable without requiring click
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-base font-medium text-gray-700">Stock History</h4>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">From:</label>
                    <input
                      type="date"
                      value={historyDateFrom}
                      onChange={(e) => handleDateFilterChange(e.target.value, historyDateTo)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="text-sm text-gray-600">to:</span>
                    <input
                      type="date"
                      value={historyDateTo}
                      onChange={(e) => handleDateFilterChange(historyDateFrom, e.target.value)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

              <div className="space-y-2">
                {historyLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="text-sm text-gray-500">Loading stock history...</div>
                  </div>
                ) : filteredStockHistory.length === 0 ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="text-sm text-gray-500">
                      {stockHistory.length === 0 
                        ? 'No stock history found for this item' 
                        : 'No stock history found for the selected date range'
                      }
                    </div>
                  </div>
                ) : (
                  filteredStockHistory.map((history) => (
                    <div key={history.id} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600 w-24">
                        {new Date(history.transaction_date).toLocaleDateString()}
                      </span>
                      <span className="text-sm text-gray-500 flex-1">{history.transaction_type}</span>
                      <span className={`text-sm font-medium w-20 text-right ${
                        history.quantity_change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {history.quantity_change > 0 ? '+' : ''}{history.quantity_change} units
                      </span>
                      <span className="text-sm font-medium text-gray-700 w-28 text-right">
                        Balance: {history.quantity_after}
                      </span>
                      <div className="flex gap-1 ml-8">
                        <button 
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit entry"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete entry"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            </div>
          )}



          <div className="flex justify-end space-x-3 pt-4">

            <button

              type="button"

              onClick={onClose}

              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"

            >

              Cancel

            </button>

            <button

              type="button"

              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"

              onClick={() => {

                setStockUpdateInitialData((prev) => ({

                  ...prev,

                  date: new Date().toISOString().slice(0, 10)

                }));

                setIsUpdateStockOpen(true);

              }}

            >

              Update Stock

            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>

          </div>

        </form>

        

        {/* Options Modals */}

        {showCategoryModal && (

          <OptionsModal

            title="Categories"

            items={categories}

            onAdd={handleAddCategory}

            onDelete={handleDeleteCategory}

            onEdit={handleEditCategory}

            onClose={() => setShowCategoryModal(false)}

            tableName="inventory_categories"

          />

        )}



        {showStorageLocationModal && (

          <OptionsModal

            title="Storage Locations"

            items={storageLocations}

            onAdd={handleAddStorageLocation}

            onDelete={handleDeleteStorageLocation}

            onEdit={handleEditStorageLocation}

            onClose={() => setShowStorageLocationModal(false)}

            tableName="inventory_storage_locations"

          />

        )}

      </div>

    </div>

  );

};

