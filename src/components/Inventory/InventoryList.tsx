import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { Package, Plus, Search, Filter, ChevronDown, ShoppingCart, CheckCircle, AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { DropdownField } from '../Students/masterlist/DropdownField';
import { OptionsModal } from '../Students/masterlist/OptionsModal';
import { InventoryEditModal } from './InventoryEditModal';
import {
  getInventoryItems,
  getInventoryCategories,
  getInventoryStorageLocations,
  createInventoryItem,
  deleteInventoryItem,
  InventoryItem,
  InventoryCategory,
  InventoryStorageLocation
} from './Inventory.data';

// Remove the duplicate InventoryForm at the top - we'll use the one inside the main component

// Move AddItemModal outside main component to prevent recreation
interface AddItemModalProps {
  showForm: boolean;
  activeTab: string;
  categories: InventoryCategory[];
  storageLocations: InventoryStorageLocation[];
  formScrollContainerRef: React.RefObject<HTMLDivElement>;
  isFormHovering: boolean;
  setIsFormHovering: (hovering: boolean) => void;
  stockFormScrollContainerRef: React.RefObject<HTMLDivElement>;
  isStockFormHovering: boolean;
  setIsStockFormHovering: (hovering: boolean) => void;
  setActiveTab: (tab: string) => void;
  setShowForm: (show: boolean) => void;
  handleFormSubmit: (e: React.FormEvent) => void;
  handleCategorySelect: (id: number) => void;
  handleStorageSelect: (id: number) => void;
  clearIfInvalid: () => void;
  showCategoryModal: boolean;
  showStorageLocationModal: boolean;
  setShowCategoryModal: (show: boolean) => void;
  setShowStorageLocationModal: (show: boolean) => void;
  handleAddCategory: (name: string) => Promise<void>;
  handleDeleteCategory: (id: number) => Promise<void>;
  handleEditCategory: (id: number, newName: string) => Promise<void>;
  handleAddStorageLocation: (name: string) => Promise<void>;
  handleDeleteStorageLocation: (id: number) => Promise<void>;
  handleEditStorageLocation: (id: number, newName: string) => Promise<void>;
  setIsSubmitting: (submitting: boolean) => void;
  isSubmitting: boolean;
}

const AddItemModal: React.FC<AddItemModalProps> = memo(({
  showForm,
  activeTab,
  categories,
  storageLocations,
  formScrollContainerRef,
  isFormHovering,
  setIsFormHovering,
  stockFormScrollContainerRef,
  isStockFormHovering,
  setIsStockFormHovering,
  setActiveTab,
  setShowForm,
  handleFormSubmit,
  handleCategorySelect,
  handleStorageSelect,
  clearIfInvalid,
  showCategoryModal,
  showStorageLocationModal,
  setShowCategoryModal,
  setShowStorageLocationModal,
  handleAddCategory,
  handleDeleteCategory,
  handleEditCategory,
  handleAddStorageLocation,
  handleDeleteStorageLocation,
  handleEditStorageLocation,
  setIsSubmitting,
  isSubmitting
}) => {
  console.log(' [MOUNT] AddItemModal mounted');
  
  if (!showForm) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="add-item-form-content bg-white rounded-lg p-6 w-full max-w-2xl">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('add-item')}
              className={`flex-1 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'add-item'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Add New Item
            </button>
          </nav>
        </div>

        {/* Tab Content - Always rendered, use CSS display for visibility */}
        <div 
          ref={formScrollContainerRef}
          style={{ display: activeTab === 'add-item' ? 'block' : 'none' }}
          className="max-h-[60vh] overflow-y-auto scrollbar-hide"
          onMouseEnter={() => { console.log('🖱️ [DEBUG] ADD ITEM onMouseEnter triggered'); setIsFormHovering(true); }}
          onMouseLeave={() => { console.log('🖱️ [DEBUG] ADD ITEM onMouseLeave triggered'); setIsFormHovering(false); }}
          onWheel={(e) => { console.log('🖱️ [DEBUG] ADD ITEM onWheel triggered'); console.log('🖱️ [DEBUG] ADD ITEM ScrollHeight:', e.currentTarget.scrollHeight); console.log('🖱️ [DEBUG] ADD ITEM ClientHeight:', e.currentTarget.clientHeight); console.log('🖱️ [DEBUG] ADD ITEM Can scroll:', e.currentTarget.scrollHeight > e.currentTarget.clientHeight); const target = e.currentTarget; target.scrollTop += e.deltaY; }}
          tabIndex={-1} // Make it focusable without requiring click
        >
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                <input
                  name="item_name"
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <DropdownField
                  name="category_id"
                  label="Category"
                  items={categories}
                  clearIfInvalid={clearIfInvalid}
                  onOpenModal={() => {
                    setShowCategoryModal(true);
                  }}
                  onSelect={handleCategorySelect}
                  tableName="inventory_categories"
                  disableFetch={true}
                />
                <input
                  type="hidden"
                  name="category_id_hidden"
                  id="category_id_hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                rows={2}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
                <input
                  name="in_stock"
                  type="number"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Alert</label>
                <input
                  name="minimum_stock_level"
                  type="number"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                <input
                  name="unit_price"
                  type="number"
                  step="0.01"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <DropdownField
                  name="storage_location_id"
                  label="Storage Location"
                  items={storageLocations}
                  clearIfInvalid={clearIfInvalid}
                  onOpenModal={() => {
                    setShowStorageLocationModal(true);
                  }}
                  onSelect={handleStorageSelect}
                  tableName="inventory_storage_locations"
                  disableFetch={true}
                />
                <input
                  type="hidden"
                  name="storage_location_id_hidden"
                  id="storage_location_id_hidden"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>


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
});

export const InventoryList: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  
  // Hover state tracking (borrowed from invoices table)
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  
  // Selection state (borrowed from invoices table)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  
  // Edit modal state
  const [itemToEdit, setItemToEdit] = useState<any>(null);

  // Tab state for inventory form
  const [activeTab, setActiveTab] = useState('add-item');

  // Category selector state
  const [selectedCategory, setSelectedCategory] = useState('Stationery');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showStorageLocationModal, setShowStorageLocationModal] = useState(false);

  // Data state
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [storageLocations, setStorageLocations] = useState<InventoryStorageLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scroll-on-hover state for add item form
  const [isFormHovering, setIsFormHovering] = useState(false);
  const formScrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Scroll-on-hover state for stock update form
  const [isStockFormHovering, setIsStockFormHovering] = useState(false);
  const stockFormScrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Keyboard navigation for scrolling add item form
  React.useEffect(() => {
    console.log('🔧 [DEBUG] Setting up keyboard navigation for add item form');
    console.log('🔧 [DEBUG] isFormHovering:', isFormHovering);
    console.log('🔧 [DEBUG] formScrollContainerRef.current:', formScrollContainerRef.current);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('⌨️ [DEBUG] Key pressed:', e.key);
      console.log('⌨️ [DEBUG] isFormHovering:', isFormHovering);
      console.log('⌨️ [DEBUG] formScrollContainerRef.current exists:', !!formScrollContainerRef.current);
      
      if (!isFormHovering || !formScrollContainerRef.current) {
        console.log('⌨️ [DEBUG] Early return - not hovering or no container');
        return;
      }

      if (e.key === 'ArrowUp') {
        console.log('⬆️ [DEBUG] Arrow Up pressed - scrolling up');
        e.preventDefault();
        formScrollContainerRef.current.scrollBy({
          top: -100,
          behavior: 'smooth'
        });
      } else if (e.key === 'ArrowDown') {
        console.log('⬇️ [DEBUG] Arrow Down pressed - scrolling down');
        e.preventDefault();
        formScrollContainerRef.current.scrollBy({
          top: 100,
          behavior: 'smooth'
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    console.log('🔧 [DEBUG] Keyboard event listener added for add item form');
    return () => {
      console.log('🔧 [DEBUG] Cleaning up keyboard event listener for add item form');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFormHovering]);

  // Keyboard navigation for scrolling stock update form
  React.useEffect(() => {
    console.log('🔧 [DEBUG] Setting up keyboard navigation for stock update form');
    console.log('🔧 [DEBUG] isStockFormHovering:', isStockFormHovering);
    console.log('🔧 [DEBUG] stockFormScrollContainerRef.current:', stockFormScrollContainerRef.current);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('⌨️ [DEBUG] STOCK Key pressed:', e.key);
      console.log('⌨️ [DEBUG] STOCK isStockFormHovering:', isStockFormHovering);
      console.log('⌨️ [DEBUG] STOCK stockFormScrollContainerRef.current exists:', !!stockFormScrollContainerRef.current);
      
      if (!isStockFormHovering || !stockFormScrollContainerRef.current) {
        console.log('⌨️ [DEBUG] STOCK Early return - not hovering or no container');
        return;
      }

      if (e.key === 'ArrowUp') {
        console.log('⬆️ [DEBUG] STOCK Arrow Up pressed - scrolling up');
        e.preventDefault();
        stockFormScrollContainerRef.current.scrollBy({
          top: -100,
          behavior: 'smooth'
        });
      } else if (e.key === 'ArrowDown') {
        console.log('⬇️ [DEBUG] STOCK Arrow Down pressed - scrolling down');
        e.preventDefault();
        stockFormScrollContainerRef.current.scrollBy({
          top: 100,
          behavior: 'smooth'
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    console.log('🔧 [DEBUG] Keyboard event listener added for stock update form');
    return () => {
      console.log('🔧 [DEBUG] Cleaning up keyboard event listener for stock update form');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isStockFormHovering]);

  // Click outside to close functionality for add item form
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.add-item-form-content')) return;
      if (target.closest('[role="dialog"]')) return;
      
      // Check if click is on the backdrop (outside the form content)
      if (showForm && target.classList.contains('fixed') && target.classList.contains('inset-0')) {
        setShowForm(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showForm]);

  // Remove dropdown state to prevent re-renders

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('🔄 [PARENT] Starting data load...');
      setIsLoading(true);
      const [itemsData, categoriesData, locationsData] = await Promise.all([
        getInventoryItems(),
        getInventoryCategories(),
        getInventoryStorageLocations()
      ]);
      
      console.log('📊 [PARENT] Categories loaded:', categoriesData);
      console.log('📦 [PARENT] Storage locations loaded:', locationsData);
      
      setInventoryItems(itemsData);
      setCategories(categoriesData);
      setStorageLocations(locationsData);
      
      console.log('✅ [PARENT] Data load completed');
    } catch (error) {
      console.error('❌ [PARENT] Error loading inventory data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter inventory based on selected category
  const filteredInventory = inventoryItems.filter(item => 
    item.category_name === selectedCategory
  );

  // Filter categories for dropdown
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
  );

  // Toggle selection function (borrowed from invoices table)
  const toggleSelection = (itemId: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };
  
  const hasSelections = selectedItems.size > 0;
  
  // --- Edit Handler ---
  const handleEdit = (item: any) => {
    console.log('✏️ [PARENT] Edit handler called with item:', item);
    console.log('📊 [PARENT] Current categories state:', categories);
    console.log('📦 [PARENT] Current storage locations state:', storageLocations);
    console.log('🔧 [PARENT] Data being passed to modal:', {
      item,
      categories: categories,
      storageLocations: storageLocations
    });
    setItemToEdit(item);
  };

  // --- Dropdown Handlers ---
  const handleAddCategory = async (name: string) => {
    const newCategory = {
      id: Math.max(...categories.map(c => c.id)) + 1,
      name,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setCategories([...categories, newCategory]);
  };

  const handleDeleteCategory = async (id: number) => {
    setCategories(categories.filter(c => c.id !== id));
  };

  const handleEditCategory = async (id: number, newName: string) => {
    setCategories(categories.map(c => c.id === id ? { ...c, name: newName } : c));
  };

  const handleAddStorageLocation = async (name: string) => {
    const newLocation = {
      id: Math.max(...storageLocations.map(l => l.id)) + 1,
      name,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setStorageLocations([...storageLocations, newLocation]);
  };

  const handleDeleteStorageLocation = async (id: number) => {
    setStorageLocations(storageLocations.filter(l => l.id !== id));
  };

  const handleEditStorageLocation = async (id: number, newName: string) => {
    setStorageLocations(storageLocations.map(l => l.id === id ? { ...l, name: newName } : l));
  };

  const clearIfInvalid = () => {
    // Placeholder function for dropdown validation
  };

  // Delete handler
  const handleDeleteItem = async (itemId: number, itemName: string) => {
    try {
      console.log('🗑️ Deleting item:', itemId, itemName);
      
      // Delete from database
      await deleteInventoryItem(itemId);
      console.log('✅ Item deleted successfully:', itemId);
      
      // Reload data
      await loadData();
      
      alert(`"${itemName}" has been deleted successfully.`);
    } catch (error: any) {
      console.error('❌ Error deleting item:', error);
      alert(error.message || 'Failed to delete item. Please try again.');
    }
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    const selectedCount = selectedItems.size;
    const itemNames = filteredInventory
      .filter(item => selectedItems.has(item.id))
      .map(item => item.item_name)
      .slice(0, 3); // Show first 3 item names
    
    const moreText = selectedCount > 3 ? ` and ${selectedCount - 3} more` : '';
    const confirmMessage = `Are you sure you want to delete ${selectedCount} item(s): ${itemNames.join(', ')}${moreText}?`;
    
    if (!confirm(confirmMessage)) return;
    
    try {
      console.log('🗑️ Bulk deleting items:', Array.from(selectedItems));
      
      // Delete all selected items
      const deletePromises = Array.from(selectedItems).map(itemId => 
        deleteInventoryItem(itemId)
      );
      
      await Promise.all(deletePromises);
      console.log('✅ All items deleted successfully');
      
      // Clear selection and reload data
      setSelectedItems(new Set());
      await loadData();
      
      alert(`${selectedCount} item(s) have been deleted successfully.`);
    } catch (error: any) {
      console.error('❌ Error bulk deleting items:', error);
      alert(error.message || 'Failed to delete some items. Please try again.');
    }
  };

  // Direct DOM update handlers (no state, no re-renders)
  const handleCategorySelect = useCallback((id: number) => {
    // Update hidden input directly without state change
    const hiddenInput = document.getElementById('category_id_hidden') as HTMLInputElement;
    if (hiddenInput) hiddenInput.value = id.toString();
  }, []);

  const handleStorageSelect = useCallback((id: number) => {
    // Update hidden input directly without state change
    const hiddenInput = document.getElementById('storage_location_id_hidden') as HTMLInputElement;
    if (hiddenInput) hiddenInput.value = id.toString();
  }, []);

  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    console.log('🔥 [FORM SUBMIT] Form submission started');
    e.preventDefault();
    console.log('🔥 [FORM SUBMIT] Default prevented');
    
    setIsSubmitting(true);
    
    try {
      // Get form data from DOM since we removed state bindings
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      
      // Get dropdown values from hidden inputs
      const categoryId = formData.get('category_id_hidden') as string;
      const storageId = formData.get('storage_location_id_hidden') as string;
      
      const itemData = {
        item_name: formData.get('item_name') as string || '',
        description: formData.get('description') as string || '',
        category_id: categoryId ? parseInt(categoryId) : undefined,
        in_stock: parseInt(formData.get('in_stock') as string) || 0,
        unit_price: parseFloat(formData.get('unit_price') as string) || 0,
        storage_location_id: storageId ? parseInt(storageId) : undefined,
        minimum_stock_level: parseInt(formData.get('minimum_stock_level') as string) || 10,
        pending_requisitions: 0
      };
      
      console.log('🔥 [FORM DATA] Item data for database:', itemData);
      
      // Validate required fields
      if (!itemData.item_name) {
        alert('Item name is required');
        return;
      }
      
      // Save to database
      const newItem = await createInventoryItem(itemData);
      console.log('🔥 [FORM SUBMIT] Item saved to database:', newItem);
      
      // Reload data
      await loadData();
      
      // Reset form only (no dropdown state to reset)
      form.reset();
      
      alert('Item saved successfully!');
      setShowForm(false);
      console.log('🔥 [FORM SUBMIT] Form closed');
    } catch (error: any) {
      console.error('🔥 [FORM SUBMIT] Error saving item:', error);
      alert(error.message || 'Failed to save item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [loadData]);

  // Move InventoryForm outside main component to prevent recreation
  const InventoryForm = memo(() => {
    console.log('🟢 [MOUNT] InventoryForm mounted');
    
    return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="add-item-form-content bg-white rounded-lg p-6 w-full max-w-2xl">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('add-item')}
              className={`flex-1 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'add-item'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Add New Item
            </button>
          </nav>
        </div>

        {/* Tab Content - Always rendered, use CSS display for visibility */}
        <div 
          ref={formScrollContainerRef}
          style={{ display: activeTab === 'add-item' ? 'block' : 'none' }}
          className="max-h-[60vh] overflow-y-auto scrollbar-hide"
          onMouseEnter={() => { console.log('🖱️ [DEBUG] ADD ITEM onMouseEnter triggered'); setIsFormHovering(true); }}
          onMouseLeave={() => { console.log('🖱️ [DEBUG] ADD ITEM onMouseLeave triggered'); setIsFormHovering(false); }}
          onWheel={(e) => { console.log('🖱️ [DEBUG] ADD ITEM onWheel triggered'); console.log('🖱️ [DEBUG] ADD ITEM ScrollHeight:', e.currentTarget.scrollHeight); console.log('🖱️ [DEBUG] ADD ITEM ClientHeight:', e.currentTarget.clientHeight); console.log('🖱️ [DEBUG] ADD ITEM Can scroll:', e.currentTarget.scrollHeight > e.currentTarget.clientHeight); const target = e.currentTarget; target.scrollTop += e.deltaY; }}
          tabIndex={-1} // Make it focusable without requiring click
        >
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                <input
                  name="item_name"
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <DropdownField
                  name="category_id"
                  label="Category"
                  items={categories}
                  clearIfInvalid={clearIfInvalid}
                  onOpenModal={() => {
                    setShowCategoryModal(true);
                  }}
                  onSelect={handleCategorySelect}
                  tableName="inventory_categories"
                  disableFetch={true}
                />
                <input
                  type="hidden"
                  name="category_id_hidden"
                  id="category_id_hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                rows={2}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
                <input
                  name="in_stock"
                  type="number"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Alert</label>
                <input
                  name="minimum_stock_level"
                  type="number"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (Ksh)</label>
                <input
                  name="unit_price"
                  type="number"
                  step="0.01"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <DropdownField
                  name="storage_location_id"
                  label="Storage Location"
                  items={storageLocations}
                  clearIfInvalid={clearIfInvalid}
                  onOpenModal={() => {
                    setShowStorageLocationModal(true);
                  }}
                  onSelect={handleStorageSelect}
                  tableName="inventory_storage_locations"
                  disableFetch={true}
                />
                <input
                  type="hidden"
                  name="storage_location_id_hidden"
                  id="storage_location_id_hidden"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        <div 
          ref={stockFormScrollContainerRef}
          style={{ display: activeTab === 'update-stock' ? 'block' : 'none' }}
          className="max-h-[60vh] overflow-y-auto scrollbar-hide"
          onMouseEnter={() => setIsStockFormHovering(true)}
          onMouseLeave={() => setIsStockFormHovering(false)}
          tabIndex={-1} // Make it focusable without requiring click
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="New Stock">New Stock</option>
                <option value="Stock Adjustment (Damaged)">Stock Adjustment (Damaged)</option>
                <option value="Stock Adjustment (Loss/Theft)">Stock Adjustment (Loss/Theft)</option>
                <option value="Stock Adjustment (Expired)">Stock Adjustment (Expired)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <input
                  type="text"
                  value="Add"
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min={0}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={2}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save & Record Next
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

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
  );
});

  // Memoize props for AddItemModal to prevent unnecessary remounts
  const addItemModalProps = useMemo(() => ({
    showForm,
    activeTab,
    categories,
    storageLocations,
    formScrollContainerRef,
    isFormHovering,
    setIsFormHovering,
    stockFormScrollContainerRef,
    isStockFormHovering,
    setIsStockFormHovering,
    setActiveTab,
    setShowForm,
    handleFormSubmit,
    handleCategorySelect,
    handleStorageSelect,
    clearIfInvalid,
    showCategoryModal,
    showStorageLocationModal,
    setShowCategoryModal,
    setShowStorageLocationModal,
    handleAddCategory,
    handleDeleteCategory,
    handleEditCategory,
    handleAddStorageLocation,
    handleDeleteStorageLocation,
    handleEditStorageLocation,
    setIsSubmitting,
    isSubmitting
  }), [
    showForm,
    activeTab,
    categories,
    storageLocations,
    isFormHovering,
    showCategoryModal,
    showStorageLocationModal,
    isSubmitting,
    // Functions are stable due to useCallback, so we don't need to include them
  ]);

  return (
    <div className="p-6 md:p-3 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-3 mb-6 md:mb-3">
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Total Items</div>
                <div className="text-2xl font-bold text-gray-800">{filteredInventory.length}</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">In Stock</div>
                <div className="text-2xl font-bold text-green-600">
                  {filteredInventory.filter(i => i.status === 'In Stock').length}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Out of Stock</div>
                <div className="text-2xl font-bold text-red-600">
                  {filteredInventory.filter(i => i.status === 'Out of Stock').length}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Negative Stock</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {filteredInventory.filter(i => i.status === 'Negative Stock').length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search, Filters, and Add New Item */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search inventory..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Category Selector */}
            <div className="relative">
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="flex-shrink-0 flex items-center justify-center p-2 md:px-4 md:py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <ShoppingCart className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">{selectedCategory}</span>
                <ChevronDown className="w-4 h-4 md:ml-2" />
              </button>
              
              {/* Category Dropdown */}
              {showCategoryDropdown && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                  {/* Search Field */}
                  <div className="p-3 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search categories..."
                        value={categorySearchTerm}
                        onChange={(e) => setCategorySearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                  
                  {/* Category List */}
                  <div className="max-h-48 overflow-y-auto">
                    {filteredCategories.length > 0 ? (
                      filteredCategories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => {
                            setSelectedCategory(category.name);
                            setShowCategoryDropdown(false);
                            setCategorySearchTerm('');
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
                        >
                          {category.name}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-500 text-center">
                        No categories found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <button className="flex-shrink-0 flex items-center justify-center p-2 md:px-4 md:py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Filters</span>
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex-shrink-0 bg-blue-600 text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
            >
              <Plus className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">Add Item</span>
            </button>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Bulk Actions Bar (borrowed from invoices table) */}
          {hasSelections && (
            <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-600">
                  {selectedItems.size} selected
                </span>
                <button
                  onClick={() => setSelectedItems(new Set(filteredInventory.map(item => item.id)))}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Select All ({filteredInventory.length})
                </button>
                <button
                  onClick={() => setSelectedItems(new Set())}
                  className="text-xs text-gray-600 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  title="Delete selected items"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete All
                </button>
              </div>
            </div>
          )}
          <style>{`
                .table-scroll-container {
                    overflow-x: auto;
                    overflow-y: visible;
                }
                
                .table-scroll-container::-webkit-scrollbar {
                    height: 10px;
                }
                
                .table-scroll-container::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 5px;
                }
                
                .table-scroll-container::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 5px;
                }
                
                .table-scroll-container::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>
          <div className="overflow-x-auto table-scroll-container">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  {/* Checkbox column header (borrowed from invoices table) */}
                  <th className="pl-3 pr-2 py-3 text-left w-10">
                    {/* Empty header for checkbox column */}
                  </th>
                  <th className="pl-1 pr-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    In Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requisitioned
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Storage Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                      <p className="mt-2">Loading inventory...</p>
                    </td>
                  </tr>
                ) : filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                      No inventory items found
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => (
                    <tr 
                      key={item.id} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onMouseEnter={() => setHoveredRow(item.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      onClick={() => handleEdit(item)}
                    >
                      {/* Checkbox column (borrowed from invoices table) */}
                      <td 
                        className="pl-3 pr-2 py-4 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={() => toggleSelection(item.id)}
                          className={`w-4 h-4 text-blue-600 rounded border-gray-300 cursor-pointer ${
                            hoveredRow === item.id || hasSelections
                              ? 'opacity-100'
                              : 'opacity-0'
                          }`}
                        />
                      </td>
                      <td className="pl-1 pr-2 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.item_name}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.category_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {item.in_stock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                        {item.pending_requisitions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.storage_location_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Ksh {item.unit_price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.status === 'Negative Stock' ? (
                          <div>
                            <span className="text-xs font-semibold text-yellow-800">Negative Stock</span>
                            <div className="text-xs text-gray-900 font-semibold">
                              Deficit: {item.pending_requisitions - item.in_stock}
                            </div>
                          </div>
                        ) : (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.status === 'In Stock' 
                              ? 'bg-green-100 text-green-800'
                              : item.status === 'Out of Stock'
                              ? 'bg-red-100 text-red-800'
                              : item.status === 'Low Stock'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Are you sure you want to delete "${item.item_name}"?`)) {
                              handleDeleteItem(item.id, item.item_name);
                            }
                          }}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          title="Delete item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal with visibility instead of conditional mounting */}
        <AddItemModal {...addItemModalProps} />
        
        {itemToEdit && (
          <>
            {console.log('🎬 [PARENT] About to render InventoryEditModal with props:', {
              item: itemToEdit,
              categories: categories,
              storageLocations: storageLocations
            })}
            <InventoryEditModal
              item={itemToEdit}
              categories={categories}
              storageLocations={storageLocations}
              onClose={() => {
                console.log('❌ [PARENT] Modal onClose called');
                setItemToEdit(null);
              }}
              onSaved={async () => {
                console.log('✅ [PARENT] Modal onSaved called - refreshing data');
                try {
                  await loadData(); // Refresh the inventory data
                  setItemToEdit(null);
                } catch (error) {
                  console.error('❌ [PARENT] Error refreshing data:', error);
                }
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};


