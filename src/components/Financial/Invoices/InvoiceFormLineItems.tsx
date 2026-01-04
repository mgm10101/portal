// src/components/Financial/Invoices/InvoiceFormLineItems.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { ItemMaster, InvoiceLineItem } from '../../../types/database';

interface InvoiceFormLineItemsProps {
    lineItems: InvoiceLineItem[];
    masterItems: ItemMaster[];
    loadingItems: boolean;
    isSubmitting: boolean;
    lineItemsSubtotal: number;
    // 🎯 ADDED NEW PROP
    isEditMode: boolean;
    allowRemoveInEditMode?: boolean;
    // 🎯 ADDED: Flag to disable editing for Forwarded invoices
    isForwarded?: boolean;
    
    handleAddItem: () => void;
    handleRemoveItem: (index: number) => void;
    handleLineItemChange: (index: number, e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
    calculateLineTotal: (item: InvoiceLineItem) => number;
}

export const InvoiceFormLineItems: React.FC<InvoiceFormLineItemsProps> = ({
    lineItems,
    masterItems,
    loadingItems,
    isSubmitting,
    lineItemsSubtotal,
    // 🎯 DESTRUCTURE NEW PROP
    isEditMode,
    allowRemoveInEditMode = false,
    isForwarded = false,
    handleAddItem,
    handleRemoveItem,
    handleLineItemChange,
    calculateLineTotal,
}) => {
    // Filter out "Balance Brought Forward" from available items
    const availableItems = masterItems.filter(i => i.item_name !== 'Balance Brought Forward');
    
    // State for searchable dropdowns (one per line item)
    const [searchQueries, setSearchQueries] = useState<{ [key: number]: string }>({});
    const [activeDropdowns, setActiveDropdowns] = useState<{ [key: number]: boolean }>({});
    const dropdownRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
    
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            Object.keys(dropdownRefs.current).forEach(key => {
                const index = parseInt(key);
                const ref = dropdownRefs.current[index];
                if (ref && !ref.contains(event.target as Node)) {
                    setActiveDropdowns(prev => ({ ...prev, [index]: false }));
                    setSearchQueries(prev => ({ ...prev, [index]: '' }));
                }
            });
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const renderLineItem = (item: InvoiceLineItem, index: number) => {
        // Determine the selected item ID for the dropdown
        // If selectedItemId exists, use it; otherwise try to find by itemName
        let selectedItemId = item.selectedItemId;
        if (!selectedItemId && item.itemName) {
            // For existing items, find the first matching item by name
            // (This handles items loaded from DB that don't have selectedItemId)
            const foundItem = availableItems.find(i => i.item_name === item.itemName);
            selectedItemId = foundItem?.id || '';
        }
        
        // Look up the master item details based on selectedItemId or itemName
        const itemMaster = selectedItemId 
            ? availableItems.find(i => i.id === selectedItemId)
            : availableItems.find(i => i.item_name === item.itemName);
        
        // Use the master item's current price, but fall back to the invoice line item's stored price 
        // if the master item isn't found (e.g., if it was deleted or changed after invoice creation).
        const unitPrice = itemMaster ? itemMaster.current_unit_price : item.unitPrice;
        
        // Pass the item with its correct unitPrice for calculation
        const lineTotal = calculateLineTotal({ ...item, unitPrice }); 

        // Define the display name for the currently selected item
        const selectedItemDisplay = item.itemName 
            // If the item has been loaded or selected, use its details (itemName comes from the fetched data)
            ? `${item.itemName} (${item.description || 'No description'})` 
            : (loadingItems ? 'Loading Items...' : 'Select Item');
        
        // Get search query and dropdown state for this item
        const searchQuery = searchQueries[index] || '';
        const isSearching = activeDropdowns[index] || false;
        
        // Filter items based on search query
        const filteredItems = availableItems.filter(i => {
            if (!searchQuery.trim()) return true;
            const query = searchQuery.toLowerCase();
            const itemName = i.item_name?.toLowerCase() || '';
            const description = i.description?.toLowerCase() || '';
            return itemName.includes(query) || description.includes(query);
        });
        
        // Handle item selection
        const handleSelectItem = (selectedItem: ItemMaster) => {
            const syntheticEvent = {
                target: {
                    name: 'selectedItemId',
                    value: selectedItem.id.toString()
                }
            } as React.ChangeEvent<HTMLSelectElement>;
            handleLineItemChange(index, syntheticEvent);
            setActiveDropdowns(prev => ({ ...prev, [index]: false }));
            setSearchQueries(prev => ({ ...prev, [index]: '' }));
        };


        return (
            // NOTE: Using 'item.id || index' as key is safer if you have 'id' on InvoiceLineItem. 
            // Sticking with 'index' as per your original code for now, but be aware of the risk.
            <div key={index} className="grid grid-cols-6 md:grid-cols-12 gap-2 p-3 border-b border-gray-100 items-center bg-white rounded-lg shadow-sm">
                
                {/* Item Searchable Dropdown */}
                <div 
                    className="col-span-3 md:col-span-4 relative" 
                    ref={(el) => { dropdownRefs.current[index] = el; }}
                >
                    <input
                        type="text"
                        value={isSearching ? searchQuery : selectedItemDisplay}
                        onChange={(e) => {
                            setSearchQueries(prev => ({ ...prev, [index]: e.target.value }));
                            setActiveDropdowns(prev => ({ ...prev, [index]: true }));
                        }}
                        onFocus={() => {
                            setActiveDropdowns(prev => ({ ...prev, [index]: true }));
                            if (!selectedItemId) {
                                setSearchQueries(prev => ({ ...prev, [index]: '' }));
                            }
                        }}
                        placeholder={loadingItems ? 'Loading Items...' : 'Select Item'}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500"
                        disabled={loadingItems || isSubmitting || isForwarded}
                    />
                    {isSearching && (
                        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                            {filteredItems.length > 0 ? (
                                filteredItems.map(i => (
                                    <li
                                        key={i.id}
                                        onMouseDown={() => handleSelectItem(i)}
                                        className="p-3 cursor-pointer hover:bg-blue-50"
                                    >
                                        <span className="font-medium text-gray-900">{i.item_name}</span>
                                        {i.description && (
                                            <span className="text-sm text-gray-500 ml-2">({i.description})</span>
                                        )}
                                    </li>
                                ))
                            ) : (
                                <li className="p-3 text-gray-500 italic">
                                    {searchQuery ? `No items found matching "${searchQuery}"` : 'No items available'}
                                </li>
                            )}
                        </ul>
                    )}
                </div>
                
                {/* Unit Price (Display/Locked) */}
                <div className="col-span-1 md:col-span-2">
                    <input
                        type="text"
                        disabled
                        value={unitPrice.toFixed(2)}
                        className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-right"
                    />
                </div>

                {/* Quantity */}
                <div className="col-span-1 md:col-span-2">
                    <input 
                        type="number" 
                        name="quantity"
                        value={item.quantity}
                        onChange={(e) => handleLineItemChange(index, e)}
                        className="w-full p-2 border border-gray-300 rounded text-right focus:ring-blue-500" 
                        min="1"
                        disabled={isSubmitting || isForwarded}
                    />
                </div>
                
                {/* Discount (%) */}
                <div className="col-span-1 md:col-span-1">
                    <input 
                        type="number" 
                        name="discount"
                        value={item.discount}
                        onChange={(e) => handleLineItemChange(index, e)}
                        className="w-full p-2 border border-gray-300 rounded text-right focus:ring-blue-500" 
                        min="0" max="100"
                        disabled={isSubmitting || isForwarded}
                    />
                </div>
                
                {/* Line Total (Calculated) */}
                <div className="col-span-1 md:col-span-2">
                    <input 
                        type="text" 
                        disabled 
                        value={lineTotal.toFixed(2)}
                        className="w-full p-2 border border-gray-300 rounded bg-blue-50 font-semibold text-right" 
                    />
                </div>

                {/* Remove Button */}
                <div className="col-span-1 md:col-span-1 flex justify-end">
                    <button 
                        type="button" 
                        onClick={() => handleRemoveItem(index)} 
                        disabled={isSubmitting || isForwarded || (isEditMode && !allowRemoveInEditMode)}
                        title={isForwarded ? "Forwarded invoices cannot be edited" : (isEditMode && !allowRemoveInEditMode) ? "Cannot delete existing line items in Edit Mode" : "Remove Line Item"}
                        className={`p-1 ${
                            (isEditMode && !allowRemoveInEditMode) || isSubmitting || isForwarded
                                ? 'text-red-300 cursor-not-allowed' // Dimmed/disabled style
                                : 'text-red-500 hover:text-red-700' // Active style
                        }`}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Invoice Items</h3>
                <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center disabled:opacity-50"
                    disabled={isSubmitting || isForwarded}
                >
                    <Plus className="w-4 h-4 mr-1 inline" /> Add Item
                </button>
            </div>
            
            {/* Line Item Header Row */}
            <div className="hidden md:grid grid-cols-12 gap-2 text-sm font-medium text-gray-500 px-3 pb-2">
                <div className="col-span-4">Item</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-1 text-right">Disc (%)</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-1"></div>
            </div>

            {/* Render Line Items */}
            <div className="space-y-3">
                {lineItems.map(renderLineItem)}
            </div>
            {lineItems.length === 0 && (
                <p className="text-gray-500 italic text-center py-4">Click "Add Item" to begin adding fees.</p>
            )}
            
            {/* Subtotal Display */}
            <div className="flex justify-end pt-3 text-lg font-medium">
                <span className="text-gray-700 mr-4">Subtotal (Line Items):</span>
                <span className="text-gray-800">Ksh.{lineItemsSubtotal.toFixed(2)}</span>
            </div>
        </div>
    );
};