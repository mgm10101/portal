// src/components/Financial/Invoices/InvoiceFormLineItems.tsx

import React from 'react';
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
    handleAddItem,
    handleRemoveItem,
    handleLineItemChange,
    calculateLineTotal,
}) => {
    const renderLineItem = (item: InvoiceLineItem, index: number) => {
        // Look up the master item details based on the item_master_id
        const itemMaster = masterItems.find(i => i.id === item.item_master_id);
        
        // Use the master item's current price, but fall back to the invoice line item's stored price 
        // if the master item isn't found (e.g., if it was deleted or changed after invoice creation).
        const unitPrice = itemMaster ? itemMaster.current_unit_price : item.unitPrice;
        
        // Pass the item with its correct unitPrice for calculation
        const lineTotal = calculateLineTotal({ ...item, unitPrice }); 

        // Define the display name for the currently selected item
        const selectedItemDisplay = item.item_master_id 
            // If the item has been loaded or selected, use its details (itemName comes from the fetched data)
            ? `${item.itemName} (${item.description || 'No description'})` 
            : (loadingItems ? 'Loading Items...' : 'Select Item');


        return (
            // NOTE: Using 'item.id || index' as key is safer if you have 'id' on InvoiceLineItem. 
            // Sticking with 'index' as per your original code for now, but be aware of the risk.
            <div key={index} className="grid grid-cols-6 md:grid-cols-12 gap-2 p-3 border-b border-gray-100 items-center bg-white rounded-lg shadow-sm">
                
                {/* Item Dropdown */}
                <div className="col-span-3 md:col-span-4">
                    <select
                        name="item_master_id"
                        value={item.item_master_id || ''} // Use empty string for unselected
                        onChange={(e) => handleLineItemChange(index, e)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500"
                        disabled={loadingItems || isSubmitting}
                    >
                        {/* 🚨 FIX APPLIED HERE: 
                            1. Render the actual loaded item as the default selected option. 
                            2. Use the item's stored itemName and description for existing invoices.
                            3. Render the empty placeholder only if no item is selected.
                        */}
                        
                        {item.item_master_id ? (
                            // Display the item that was loaded from the database (its stored name/description)
                            <option value={item.item_master_id}>{selectedItemDisplay}</option>
                        ) : (
                            // Placeholder for when no item is selected
                            <option value="">{selectedItemDisplay}</option>
                        )}

                        {/* Map over all master items, allowing the user to change the item */}
                        {masterItems.map(i => (
                            <option key={i.id} value={i.id}>
                                {/* masterItems uses i.item_name because it's fetched from item_master table */}
                                {i.item_name} ({i.description || 'No description'}) 
                            </option>
                        ))}
                    </select>
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
                        disabled={isSubmitting}
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
                        disabled={isSubmitting}
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
                        // 🎯 LOGIC CHANGE: Disabled if submitting OR in edit mode
                        disabled={isSubmitting || isEditMode}
                        title={isEditMode ? "Cannot delete existing line items in Edit Mode" : "Remove Line Item"}
                        className={`p-1 ${
                            isEditMode || isSubmitting
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
                    disabled={isSubmitting}
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
            <div className="space-y-3 max-h-60 overflow-y-auto">
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