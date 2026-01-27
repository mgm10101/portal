import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Package, Plus, Search, Filter, Edit, Trash2, Loader2, Eye, ChevronDown, ShoppingCart, CheckCircle, AlertTriangle } from 'lucide-react';
import { DropdownField } from '../Students/masterlist/DropdownField';
import { OptionsModal } from '../Students/masterlist/OptionsModal';
import { InventoryEditModal } from './InventoryEditModal';

export const InventoryList: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  
  // Hover state tracking (borrowed from invoices table)
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  
  // Selection state (borrowed from invoices table)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  
  // Loading state for deletions
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Edit modal state
  const [itemToEdit, setItemToEdit] = useState<any>(null);

  // Tab state for inventory form
  const [activeTab, setActiveTab] = useState('add-item');

  // Category selector state
  const [selectedCategory, setSelectedCategory] = useState('Stationery');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');

  // State for customizable dropdowns
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([
    { id: 1, name: 'Stationery' },
    { id: 2, name: 'Clothing' },
    { id: 3, name: 'Equipment' },
    { id: 4, name: 'Food' },
    { id: 5, name: 'Maintenance' }
  ]);
  
  const [storageLocations, setStorageLocations] = useState<{ id: number; name: string }[]>([
    { id: 1, name: 'Main Store' },
    { id: 2, name: 'Kitchen Store' },
    { id: 3, name: 'Pantry' },
    { id: 4, name: 'Maintenance Room' },
    { id: 5, name: 'Tool Shed' },
    { id: 6, name: 'Electrical Storage' },
    { id: 7, name: 'Science Lab' },
    { id: 8, name: 'Library' }
  ]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(1);
  const [selectedStorageLocationId, setSelectedStorageLocationId] = useState<number | undefined>(1);

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showStorageLocationModal, setShowStorageLocationModal] = useState(false);

  // Filter categories based on search term
  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase()) && cat.name !== selectedCategory
  );

  // Calculate status based on stock vs requisitions
  const calculateStatus = (item: any) => {
    if (item.pendingRequisitions > item.inStock) {
      return 'Negative Stock';
    } else if (item.inStock === 0) {
      return 'Out of Stock';
    } else if (item.inStock <= 10) {
      return 'Low Stock';
    } else {
      return 'In Stock';
    }
  };

  const inventory = [
    // Stationery Items
    {
      id: 1,
      item: 'Exercise Books',
      description: 'A4 size ruled exercise books for students',
      category: 'Stationery',
      inStock: 500,
      pendingRequisitions: 25,
      storageLocation: 'Store Room A',
      unitPrice: 2.50,
      totalValue: 1250,
      status: '' // Will be calculated dynamically
    },
    {
      id: 2,
      item: 'Ballpoint Pens',
      description: 'Blue and black ballpoint pens pack of 10',
      category: 'Stationery',
      inStock: 1200,
      pendingRequisitions: 50,
      storageLocation: 'Store Room B',
      unitPrice: 1.20,
      totalValue: 1440,
      status: '' // Will be calculated dynamically
    },
    {
      id: 3,
      item: 'Pencils',
      description: 'HB pencils pack of 12',
      category: 'Stationery',
      inStock: 0,
      pendingRequisitions: 30,
      storageLocation: 'Store Room A',
      unitPrice: 0.80,
      totalValue: 0,
      status: '' // Will be calculated dynamically
    },
    {
      id: 4,
      item: 'Erasers',
      description: 'White rubber erasers pack of 6',
      category: 'Stationery',
      inStock: 800,
      pendingRequisitions: 15,
      storageLocation: 'Store Room C',
      unitPrice: 0.50,
      totalValue: 400,
      status: '' // Will be calculated dynamically
    },
    {
      id: 5,
      item: 'Rulers',
      description: '30cm plastic rulers',
      category: 'Stationery',
      inStock: 300,
      pendingRequisitions: 20,
      storageLocation: 'Store Room A',
      unitPrice: 1.00,
      totalValue: 300,
      status: '' // Will be calculated dynamically
    },
    
    // Clothing Items
    {
      id: 6,
      item: 'Uniforms - Grade 8',
      description: 'Standard school uniform set for Grade 8 students',
      category: 'Clothing',
      inStock: 0,
      pendingRequisitions: 15,
      storageLocation: 'Main Store',
      unitPrice: 45.00,
      totalValue: 0,
      status: '' // Will be calculated dynamically
    },
    {
      id: 7,
      item: 'Uniforms - Grade 1',
      description: 'Standard school uniform set for Grade 1 students',
      category: 'Clothing',
      inStock: 50,
      pendingRequisitions: 10,
      storageLocation: 'Main Store',
      unitPrice: 38.00,
      totalValue: 1900,
      status: '' // Will be calculated dynamically
    },
    {
      id: 8,
      item: 'Sports Jerseys',
      description: 'School sports team jerseys',
      category: 'Clothing',
      inStock: 25,
      pendingRequisitions: 5,
      storageLocation: 'Sports Room',
      unitPrice: 25.00,
      totalValue: 625,
      status: '' // Will be calculated dynamically
    },
    {
      id: 9,
      item: 'Lab Coats',
      description: 'White lab coats for science classes',
      category: 'Clothing',
      inStock: 40,
      pendingRequisitions: 12,
      storageLocation: 'Lab Storage',
      unitPrice: 18.00,
      totalValue: 720,
      status: '' // Will be calculated dynamically
    },
    {
      id: 10,
      item: 'Winter Jackets',
      description: 'School winter jackets size M',
      category: 'Clothing',
      inStock: 5,
      pendingRequisitions: 8,
      storageLocation: 'Main Store',
      unitPrice: 35.00,
      totalValue: 175,
      status: '' // Will be calculated dynamically (8 > 5, so Negative Stock)
    },
    
    // Equipment Items
    {
      id: 11,
      item: 'Science Lab Equipment',
      description: 'Basic laboratory equipment for science experiments',
      category: 'Equipment',
      inStock: 15,
      pendingRequisitions: 8,
      storageLocation: 'Lab Cabinet',
      unitPrice: 120.00,
      totalValue: 1800,
      status: '' // Will be calculated dynamically
    },
    {
      id: 12,
      item: 'Projectors',
      description: 'Multimedia projectors for classrooms',
      category: 'Equipment',
      inStock: 8,
      pendingRequisitions: 3,
      storageLocation: 'AV Room',
      unitPrice: 450.00,
      totalValue: 3600,
      status: '' // Will be calculated dynamically
    },
    {
      id: 13,
      item: 'Computers',
      description: 'Desktop computers for computer lab',
      category: 'Equipment',
      inStock: 30,
      pendingRequisitions: 10,
      storageLocation: 'Computer Lab',
      unitPrice: 800.00,
      totalValue: 24000,
      status: '' // Will be calculated dynamically
    },
    {
      id: 14,
      item: 'Microscopes',
      description: 'Biological microscopes for biology lab',
      category: 'Equipment',
      inStock: 0,
      pendingRequisitions: 6,
      storageLocation: 'Lab Cabinet',
      unitPrice: 250.00,
      totalValue: 0,
      status: '' // Will be calculated dynamically
    },
    {
      id: 15,
      item: 'Whiteboards',
      description: 'Mobile whiteboards with stands',
      category: 'Equipment',
      inStock: 12,
      pendingRequisitions: 4,
      storageLocation: 'Storage Room 2',
      unitPrice: 150.00,
      totalValue: 1800,
      status: '' // Will be calculated dynamically
    },
    
    // Food Items
    {
      id: 16,
      item: 'Rice Bags',
      description: '25kg bags of premium rice',
      category: 'Food',
      inStock: 20,
      pendingRequisitions: 5,
      storageLocation: 'Kitchen Store',
      unitPrice: 45.00,
      totalValue: 900,
      status: '' // Will be calculated dynamically
    },
    {
      id: 17,
      item: 'Cooking Oil',
      description: '5L containers of cooking oil',
      category: 'Food',
      inStock: 35,
      pendingRequisitions: 8,
      storageLocation: 'Kitchen Store',
      unitPrice: 12.00,
      totalValue: 420,
      status: '' // Will be calculated dynamically
    },
    {
      id: 18,
      item: 'Sugar',
      description: '50kg bags of sugar',
      category: 'Food',
      inStock: 0,
      pendingRequisitions: 3,
      storageLocation: 'Kitchen Store',
      unitPrice: 65.00,
      totalValue: 0,
      status: '' // Will be calculated dynamically
    },
    {
      id: 19,
      item: 'Flour',
      description: '25kg bags of wheat flour',
      category: 'Food',
      inStock: 15,
      pendingRequisitions: 4,
      storageLocation: 'Kitchen Store',
      unitPrice: 28.00,
      totalValue: 420,
      status: '' // Will be calculated dynamically
    },
    {
      id: 20,
      item: 'Tea Bags',
      description: 'Boxes of tea bags (100 count)',
      category: 'Food',
      inStock: 100,
      pendingRequisitions: 12,
      storageLocation: 'Pantry',
      unitPrice: 8.50,
      totalValue: 850,
      status: '' // Will be calculated dynamically
    },
    
    // Maintenance Items
    {
      id: 21,
      item: 'Cleaning Supplies',
      description: 'General cleaning chemicals and supplies',
      category: 'Maintenance',
      inStock: 50,
      pendingRequisitions: 10,
      storageLocation: 'Maintenance Room',
      unitPrice: 15.00,
      totalValue: 750,
      status: '' // Will be calculated dynamically
    },
    {
      id: 22,
      item: 'Light Bulbs',
      description: 'LED light bulbs for classrooms',
      category: 'Maintenance',
      inStock: 200,
      pendingRequisitions: 25,
      storageLocation: 'Electrical Storage',
      unitPrice: 3.50,
      totalValue: 700,
      status: '' // Will be calculated dynamically
    },
    {
      id: 23,
      item: 'Paint',
      description: 'White paint for classroom walls',
      category: 'Maintenance',
      inStock: 0,
      pendingRequisitions: 6,
      storageLocation: 'Maintenance Room',
      unitPrice: 85.00,
      totalValue: 0,
      status: '' // Will be calculated dynamically
    },
    {
      id: 24,
      item: 'Tools',
      description: 'Basic maintenance tools set',
      category: 'Maintenance',
      inStock: 25,
      pendingRequisitions: 3,
      storageLocation: 'Tool Shed',
      unitPrice: 120.00,
      totalValue: 3000,
      status: '' // Will be calculated dynamically
    },
    {
      id: 25,
      item: 'Plumbing Supplies',
      description: 'Pipes, fittings, and plumbing accessories',
      category: 'Maintenance',
      inStock: 40,
      pendingRequisitions: 8,
      storageLocation: 'Maintenance Room',
      unitPrice: 45.00,
      totalValue: 1800,
      status: '' // Will be calculated dynamically
    }
  ].map(item => ({ ...item, status: calculateStatus(item) }));

  // Filter inventory based on selected category
  const filteredInventory = inventory.filter(item => item.category === selectedCategory);

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
  
  // --- Delete Handler ---
  const handleDelete = async (itemId: number) => {
    if (!confirm('Are you sure you want to delete this inventory item?')) return;
    
    setIsDeleting(true);
    try {
      // Here you would typically delete from your backend
      console.log('Deleting inventory item:', itemId);
      alert('Inventory item deleted successfully.');
      // Refresh logic would go here
    } catch (error: any) {
      console.error('Error deleting inventory item:', error);
      alert(error.message || 'Failed to delete inventory item. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSelected = () => {
    const selectedArray = Array.from(selectedItems);
    if (selectedArray.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedArray.length} inventory item(s)?`)) return;
    
    setIsDeleting(true);
    try {
      // Here you would typically delete from your backend
      console.log('Deleting inventory items:', selectedArray);
      alert('Inventory items deleted successfully.');
      // Refresh logic would go here
    } catch (error: any) {
      console.error('Error deleting inventory items:', error);
      alert(error.message || 'Failed to delete inventory items. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // --- Edit Handler ---
  const handleEdit = (item: any) => {
    setItemToEdit(item);
  };

  // --- Dropdown Handlers ---
  const handleAddCategory = async (name: string) => {
    const newCategory = {
      id: Math.max(...categories.map(c => c.id)) + 1,
      name
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
      name
    };
    setStorageLocations([...storageLocations, newLocation]);
  };

  const handleDeleteStorageLocation = async (id: number) => {
    setStorageLocations(storageLocations.filter(l => l.id !== id));
  };

  const handleEditStorageLocation = async (id: number, newName: string) => {
    setStorageLocations(storageLocations.map(l => l.id === id ? { ...l, name: newName } : l));
  };

  const clearIfInvalid = (e: React.FocusEvent<HTMLSelectElement>, validList: string[]) => {
    // Placeholder function for dropdown validation
  };

  const InventoryForm: React.FC = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
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
            <button
              onClick={() => setActiveTab('update-stock')}
              className={`flex-1 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'update-stock'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Batch Stock Update
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'add-item' && (
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <DropdownField
                  name="category_id"
                  label="Category"
                  items={categories}
                  selectedId={selectedCategoryId}
                  clearIfInvalid={clearIfInvalid}
                  onOpenModal={() => setShowCategoryModal(true)}
                  onSelect={setSelectedCategoryId}
                  tableName="inventory_categories"
                  disableFetch={true}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
                <input
                  type="number"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Alert</label>
                <input
                  type="number"
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <DropdownField
                  name="storage_location_id"
                  label="Storage Location"
                  items={storageLocations}
                  selectedId={selectedStorageLocationId}
                  clearIfInvalid={clearIfInvalid}
                  onOpenModal={() => setShowStorageLocationModal(true)}
                  onSelect={setSelectedStorageLocationId}
                  tableName="inventory_storage_locations"
                  disableFetch={true}
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
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}

        {activeTab === 'update-stock' && (
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
                <option value="New Stock Purchased">New Stock Purchased</option>
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
        )}
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
              <span className="hidden md:inline">Manage Inventory</span>
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
              <button
                onClick={handleDeleteSelected}
                className="text-xs text-red-600 hover:text-red-700 font-medium px-3 py-1 bg-red-50 hover:bg-red-100 rounded transition-colors"
              >
                Delete Selected
              </button>
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
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.map((item) => (
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
                    <td className="px-2 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.item}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {item.inStock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                      {item.pendingRequisitions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.storageLocation}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Ksh {item.unitPrice}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.status === 'Negative Stock' ? (
                        <div>
                          <span className="text-sm font-semibold text-yellow-800">Negative Stock</span>
                          <div className="text-xs text-gray-900 font-semibold">
                            Deficit: {item.pendingRequisitions - item.inStock}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && <InventoryForm />}
        
        {itemToEdit && (
          <InventoryEditModal
            item={itemToEdit}
            onClose={() => setItemToEdit(null)}
            onSaved={() => {
              // Refresh logic would go here
              setItemToEdit(null);
            }}
          />
        )}
      </div>
    </div>
  );
};