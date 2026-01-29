import React, { useState, useEffect } from 'react';

import { InventoryItem, InventoryCategory, InventoryStorageLocation } from './Inventory.data';

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

  | 'Stock Adjustment (Expired)';

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



  const deriveDirection = (type: StockUpdateType): StockUpdateDirection => {

    if (type === 'New Stock') return 'add';

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

            </select>

          </div>



          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>

              <input

                type="text"

                value={data.direction === 'add' ? 'Add' : 'Subtract'}

                readOnly

                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed focus:ring-2 focus:ring-gray-500 focus:border-transparent"

              />

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

              onClick={() => onSubmit(data)}

              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"

            >

              Apply

            </button>

          </div>

        </div>

      </div>

    </div>

  );

};



export const InventoryEditModal: React.FC<InventoryEditModalProps> = ({ item, onClose, onSaved, categories, storageLocations }) => {

  console.log('🔍 Edit modal opened with item:', item);

  

  const [formData, setFormData] = useState({

    item_name: item.item_name,

    description: item.description || '',

    category_id: item.category_id,

    in_stock: item.in_stock,

    unit_price: item.unit_price,

    storage_location_id: item.storage_location_id,

    minimum_stock_level: item.minimum_stock_level

  });

  

  console.log('📝 Initial form data:', formData);

  

  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [showStorageLocationModal, setShowStorageLocationModal] = useState(false);

  

  const [activeTab, setActiveTab] = useState<'details' | 'restock'>('details');

  const [isUpdateStockOpen, setIsUpdateStockOpen] = useState(false);

  const [stockUpdateInitialData, setStockUpdateInitialData] = useState<StockUpdateFormData>(() => ({

    date: new Date().toISOString().slice(0, 10),

    type: 'New Stock',

    direction: 'add',

    quantity: 0

  }));

  

  useEffect(() => {

    console.log('� Categories received as props:', categories);

    console.log('📦 Storage locations received as props:', storageLocations);

  }, [categories, storageLocations]);

  

  const clearIfInvalid = () => {

    // Placeholder function for dropdown validation

  };

  

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



  const handleSubmit = (e: React.FormEvent) => {

    e.preventDefault();

    // Here you would typically save to your backend

    console.log('Saving inventory item:', formData);

    onSaved();

    onClose();

  };



  return (

    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">

      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden scrollbar-hide" onWheel={(e) => {

        const target = e.currentTarget;

        target.scrollTop += e.deltaY;

      }}>

        {isUpdateStockOpen && (

          <UpdateStockModal

            initialData={stockUpdateInitialData}

            onClose={() => setIsUpdateStockOpen(false)}

            onSubmit={(data) => {

              const delta = data.direction === 'add' ? data.quantity : -data.quantity;

              setFormData((prev) => ({

                ...prev,

                in_stock: Math.max(0, (prev.in_stock || 0) + delta)

              }));

              setStockUpdateInitialData(data);

              setIsUpdateStockOpen(false);

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

            <div>

              <div className="flex justify-between items-center mb-4">

                <h4 className="text-base font-medium text-gray-700">Stock History</h4>

                <div className="flex items-center gap-2">

                  <label className="text-sm text-gray-600">From:</label>

                  <input

                    type="date"

                    defaultValue="2024-03-23"

                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"

                  />

                  <span className="text-sm text-gray-600">to:</span>

                  <input

                    type="date"

                    defaultValue="2024-04-23"

                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"

                  />

                </div>

              </div>

              <div className="space-y-2">

                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">

                  <span className="text-sm text-gray-600 w-24">2024-04-01</span>

                  <span className="text-sm text-gray-500 flex-1">Stock Adjustment (Expired)</span>

                  <span className="text-sm font-medium text-red-600 w-20 text-right">-10 units</span>

                  <span className="text-sm font-medium text-gray-700 w-28 text-right">Balance: 130</span>

                  <div className="flex gap-1 ml-8">

                    <button className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors">

                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />

                      </svg>

                    </button>

                    <button className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors">

                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />

                      </svg>

                    </button>

                  </div>

                </div>

                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">

                  <span className="text-sm text-gray-600 w-24">2024-03-15</span>

                  <span className="text-sm text-gray-500 flex-1">Stock Adjustment (Damaged)</span>

                  <span className="text-sm font-medium text-red-600 w-20 text-right">-30 units</span>

                  <span className="text-sm font-medium text-gray-700 w-28 text-right">Balance: 120</span>

                  <div className="flex gap-1 ml-8">

                    <button className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors">

                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />

                      </svg>

                    </button>

                    <button className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors">

                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />

                      </svg>

                    </button>

                  </div>

                </div>

                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">

                  <span className="text-sm text-gray-600 w-24">2024-03-01</span>

                  <span className="text-sm text-gray-500 flex-1">Stock Adjustment (Loss/Theft)</span>

                  <span className="text-sm font-medium text-red-600 w-20 text-right">-15 units</span>

                  <span className="text-sm font-medium text-gray-700 w-28 text-right">Balance: 90</span>

                  <div className="flex gap-1 ml-8">

                    <button className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors">

                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />

                      </svg>

                    </button>

                    <button className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors">

                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />

                      </svg>

                    </button>

                  </div>

                </div>

                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">

                  <span className="text-sm text-gray-600 w-24">2024-02-01</span>

                  <span className="text-sm text-gray-500 flex-1">New Stock</span>

                  <span className="text-sm font-medium text-green-600 w-20 text-right">+25 units</span>

                  <span className="text-sm font-medium text-gray-700 w-28 text-right">Balance: 75</span>

                  <div className="flex gap-1 ml-8">

                    <button className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors">

                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />

                      </svg>

                    </button>

                    <button className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors">

                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />

                      </svg>

                    </button>

                  </div>

                </div>

                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">

                  <span className="text-sm text-gray-600 w-24">2024-01-15</span>

                  <span className="text-sm text-gray-500 flex-1">New Stock</span>

                  <span className="text-sm font-medium text-green-600 w-20 text-right">+50 units</span>

                  <span className="text-sm font-medium text-gray-700 w-28 text-right">Balance: 50</span>

                  <div className="flex gap-1 ml-8">

                    <button className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors">

                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />

                      </svg>

                    </button>

                    <button className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors">

                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />

                      </svg>

                    </button>

                  </div>

                </div>

                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">

                  <span className="text-sm text-gray-600 w-24">2024-01-20</span>

                  <span className="text-sm text-gray-500 flex-1">Issued for Use</span>

                  <span className="text-sm font-medium text-red-600 w-20 text-right">-15 units</span>

                  <span className="text-sm font-medium text-gray-700 w-28 text-right">Balance: 60</span>

                  <div className="flex gap-1 ml-8">

                    <button className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors">

                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />

                      </svg>

                    </button>

                    <button className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors">

                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />

                      </svg>

                    </button>

                  </div>

                </div>

                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">

                  <span className="text-sm text-gray-600 w-24">2024-01-25</span>

                  <span className="text-sm text-gray-500 flex-1">Returned</span>

                  <span className="text-sm font-medium text-green-600 w-20 text-right">+5 units</span>

                  <span className="text-sm font-medium text-gray-700 w-28 text-right">Balance: 65</span>

                  <div className="flex gap-1 ml-8">

                    <button className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors">

                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />

                      </svg>

                    </button>

                    <button className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors">

                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />

                      </svg>

                    </button>

                  </div>

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

              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"

            >

              Save Changes

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

