// src/components/Financial/Invoices/InvoiceItems.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ItemMaster } from '../../../types/database'; 
import { supabase } from '../../../supabaseClient';
import { updateMasterItem, deleteMasterItem } from '../../../services/financialService';
import { GripVertical, Edit, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface InvoiceItemsProps {
    masterItems: ItemMaster[];
    setMasterItems: React.Dispatch<React.SetStateAction<ItemMaster[]>>; 
    loadingItems?: boolean;
    onTabChange?: () => void; // Callback when tab is about to change
    onClose?: () => void; // Callback to close the popup
}

export const InvoiceItems: React.FC<InvoiceItemsProps> = ({ 
    masterItems, 
    setMasterItems,
    loadingItems = false,
    onTabChange,
    onClose
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingItem, setEditingItem] = useState<ItemMaster | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [hasReordered, setHasReordered] = useState(false);
    const [localItems, setLocalItems] = useState<ItemMaster[]>([]);
    // Use refs to track state for cleanup/unmount
    const hasReorderedRef = useRef(false);
    const localItemsRef = useRef<ItemMaster[]>([]);
    const [newItemForm, setNewItemForm] = useState({
        item_name: '',
        description: '',
        current_unit_price: '' as number | ''
    });

    // Initialize local items sorted by sort_order
    useEffect(() => {
        const sorted = [...masterItems].sort((a, b) => {
            if (a.sort_order !== undefined && b.sort_order !== undefined) {
                return (a.sort_order || 0) - (b.sort_order || 0);
            }
            if (a.sort_order !== undefined) return -1;
            if (b.sort_order !== undefined) return 1;
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
        setLocalItems(sorted);
        localItemsRef.current = sorted;
        setHasReordered(false);
        hasReorderedRef.current = false;
    }, [masterItems]);

    // Modal Handlers
    const handleOpenModal = (item?: ItemMaster) => {
        if (item) {
            setEditingItem(item);
            setNewItemForm({
                item_name: item.item_name,
                description: item.description || '',
                current_unit_price: item.current_unit_price
            });
        } else {
            setEditingItem(null);
            setNewItemForm({ item_name: '', description: '', current_unit_price: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setNewItemForm({ item_name: '', description: '', current_unit_price: '' });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewItemForm(prev => ({
            ...prev,
            [name]: name === 'current_unit_price' ? (value === '' ? '' : parseFloat(value) || 0) : value,
        }));
    };

    // Save new or update existing item
    const handleSaveItem = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newItemForm.item_name || newItemForm.current_unit_price === '' || isNaN(Number(newItemForm.current_unit_price))) {
            alert('Please enter a valid Item Name and Unit Price.');
            return;
        }

        const price = Number(newItemForm.current_unit_price);
        setIsSaving(true);

        try {
            if (editingItem) {
                // Update existing item
                const updated = await updateMasterItem(editingItem.id, {
                    item_name: newItemForm.item_name,
                    description: newItemForm.description || null,
                    current_unit_price: price,
                });
                setMasterItems(prev => prev.map(item => item.id === editingItem.id ? updated : item));
            } else {
                // Create new item
                const maxOrder = localItems.length > 0 
                    ? Math.max(...localItems.map(i => i.sort_order || 0), -1) + 1
                    : 0;
                
                const newItemPayload = {
                    item_name: newItemForm.item_name,
                    description: newItemForm.description,
                    current_unit_price: price,
                    status: 'Active',
                    sort_order: maxOrder
                };

                const { data, error } = await supabase
                    .from('item_master')
                    .insert([newItemPayload])
                    .select()
                    .single();

                if (error) throw new Error(error.message);
                if (data) {
                    setMasterItems(prev => [...prev, data as ItemMaster]);
                }
            }
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save item:", error);
            alert(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsSaving(false);
        }
    };

    // Delete item
    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
            return;
        }

        try {
            await deleteMasterItem(id);
            setMasterItems(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            console.error("Failed to delete item:", error);
            alert(`Failed to delete item: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    // Drag and Drop handlers
    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newItems = [...localItems];
        const draggedItem = newItems[draggedIndex];
        newItems.splice(draggedIndex, 1);
        newItems.splice(index, 0, draggedItem);
        
        setLocalItems(newItems);
        localItemsRef.current = newItems;
        setDraggedIndex(index);
        setHasReordered(true);
        hasReorderedRef.current = true;
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    // Move item up/down
    const handleMoveItem = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === localItems.length - 1) return;

        const newItems = [...localItems];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
        
        setLocalItems(newItems);
        localItemsRef.current = newItems;
        setHasReordered(true);
        hasReorderedRef.current = true;
    };

    // Save reordered items (internal function, can be called manually or automatically)
    const saveOrder = useCallback(async (showAlert = false) => {
        // Use refs to get current values (important for cleanup)
        const currentHasReordered = hasReorderedRef.current;
        const currentLocalItems = localItemsRef.current;
        
        if (!currentHasReordered || currentLocalItems.length === 0) return;

        setIsSaving(true);
        try {
            // Update sort_order for each item based on its new position
            const updates = currentLocalItems.map((item, idx) => 
                supabase
                    .from('item_master')
                    .update({ sort_order: idx })
                    .eq('id', item.id)
            );
            
            const results = await Promise.all(updates);
            
            // Check for errors
            const errors = results.filter(result => result.error);
            if (errors.length > 0) {
                const errorMessages = errors.map(e => e.error?.message).join(', ');
                throw new Error(`Some items failed to update: ${errorMessages}`);
            }
            
            // Update masterItems with new sort_order values
            const updatedItems = currentLocalItems.map((item, idx) => ({
                ...item,
                sort_order: idx
            }));
            
            setMasterItems(updatedItems);
            setHasReordered(false);
            hasReorderedRef.current = false;
            
            if (showAlert) {
                alert('Item order saved successfully!');
            }
        } catch (error) {
            console.error('Error updating order:', error);
            if (showAlert) {
                alert('Failed to save item order.');
            }
            throw error; // Re-throw so caller knows it failed
        } finally {
            setIsSaving(false);
        }
    }, [setMasterItems]);

    // Manual save order (with alert)
    const handleSaveOrder = async () => {
        await saveOrder(true);
    };

    // Auto-save on component unmount (when user leaves tab)
    useEffect(() => {
        return () => {
            // Cleanup: save order when component unmounts (user leaves tab)
            // Use refs to get current values (refs are always current)
            if (hasReorderedRef.current && localItemsRef.current.length > 0) {
                // Fire and forget - we can't await in cleanup, but we can trigger the save
                // Create a new promise that doesn't depend on component state
                const itemsToSave = [...localItemsRef.current];
                const savePromise = Promise.all(
                    itemsToSave.map((item, idx) => 
                        supabase
                            .from('item_master')
                            .update({ sort_order: idx })
                            .eq('id', item.id)
                    )
                ).then(results => {
                    const errors = results.filter(result => result.error);
                    if (errors.length > 0) {
                        console.error('Auto-save errors:', errors);
                    } else {
                        console.log('Auto-saved item order on tab change');
                    }
                }).catch(err => {
                    console.error('Auto-save failed on unmount:', err);
                });
                
                // Note: We can't update state here since component is unmounting
                // The parent will refetch masterItems when needed
            }
        };
    }, []); // Empty deps - only run on mount/unmount

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-2xl font-semibold text-gray-800">Manage Invoice Items</h3>
                <div className="flex gap-2 items-center">
                    {hasReordered && (
                        <span className="text-xs text-gray-500 italic">
                            Changes will be saved automatically when you leave this tab
                        </span>
                    )}
                    <button 
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        onClick={() => handleOpenModal()} 
                    >
                        + New Item
                    </button>
                </div>
            </div>
            
            {loadingItems ? (
                <div className="text-center p-10 text-gray-500">Loading master items...</div>
            ) : (
                <>
                    <div className="bg-gray-50 p-4 border rounded-lg">
                        <p className="font-medium mb-2">Item List ({localItems.length} items)</p>
                        <div className="overflow-x-auto">
                            <ul className="divide-y divide-gray-200 min-w-full">
                                <li className="py-2 flex justify-between items-center text-xs font-semibold uppercase text-gray-600 border-b border-gray-300">
                                    <span className="w-1/12"></span>
                                    <span className="w-1/2">Item Name / Description</span>
                                    <span className="w-1/6 text-right">Price</span>
                                    <span className="w-1/4 text-center">Actions</span>
                                </li>

                                {localItems.map((item, index) => {
                                    // Check if this is the system-generated "Balance Brought Forward" item
                                    const isSystemItem = item.item_name === 'Balance Brought Forward';
                                    
                                    return (
                                        <li 
                                            key={item.id} 
                                            draggable
                                            onDragStart={() => handleDragStart(index)}
                                            onDragOver={(e) => handleDragOver(e, index)}
                                            onDragEnd={handleDragEnd}
                                            className={`py-2 flex justify-between items-center text-sm cursor-move hover:bg-gray-100 transition-colors ${
                                                draggedIndex === index ? 'opacity-50' : ''
                                            }`}
                                        >
                                            <div className="w-1/12 flex items-center gap-1">
                                                <GripVertical className="w-4 h-4 text-gray-400" />
                                                <div className="flex flex-col">
                                                    <button
                                                        onClick={() => handleMoveItem(index, 'up')}
                                                        disabled={index === 0}
                                                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                                        title="Move up"
                                                    >
                                                        <ArrowUp className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleMoveItem(index, 'down')}
                                                        disabled={index === localItems.length - 1}
                                                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                                        title="Move down"
                                                    >
                                                        <ArrowDown className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="w-1/2 flex flex-col sm:flex-row sm:items-baseline">
                                                <span className="font-medium text-gray-900">
                                                    {item.item_name}
                                                    {isSystemItem && (
                                                        <span className="ml-2 text-xs text-gray-500 italic">(System Item)</span>
                                                    )}
                                                </span>
                                                <span className="text-xs text-gray-500 sm:ml-2">({item.description || 'No description'})</span>
                                            </div>

                                            <span className="w-1/6 text-right text-gray-600 font-mono">Ksh.{item.current_unit_price.toFixed(2)}</span>

                                            <div className="w-1/4 flex justify-center gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(item)}
                                                    disabled={isSystemItem}
                                                    className={`p-1 rounded transition-colors ${
                                                        isSystemItem 
                                                            ? 'text-gray-300 cursor-not-allowed' 
                                                            : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                                                    }`}
                                                    title={isSystemItem ? 'System items cannot be edited' : 'Edit item'}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    disabled={isSystemItem}
                                                    className={`p-1 rounded transition-colors ${
                                                        isSystemItem 
                                                            ? 'text-gray-300 cursor-not-allowed' 
                                                            : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                                    }`}
                                                    title={isSystemItem ? 'System items cannot be deleted' : 'Delete item'}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                </>
            )}
            
            <div className="flex justify-end pt-4">
                <button 
                    onClick={async () => {
                        // Save order if there are unsaved changes
                        if (hasReorderedRef.current && localItemsRef.current.length > 0) {
                            try {
                                await saveOrder(false);
                            } catch (error) {
                                console.error('Error saving order before close:', error);
                                // Still close even if save fails
                            }
                        }
                        // Close the popup
                        if (onClose) {
                            onClose();
                        }
                    }}
                    disabled={isSaving}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? 'Saving...' : 'Done'}
                </button>
            </div>

            {/* Edit/Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
                    <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-auto p-6">
                        <div className="flex justify-between items-center pb-3 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {editingItem ? 'Edit Invoice Item' : 'Create New Invoice Item'}
                            </h3>
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                disabled={isSaving}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSaveItem} className="mt-4 space-y-4">
                            <div>
                                <label htmlFor="item_name" className="block text-sm font-medium text-gray-700">
                                    Item Name
                                </label>
                                <input
                                    type="text"
                                    id="item_name"
                                    name="item_name"
                                    value={newItemForm.item_name}
                                    onChange={handleInputChange}
                                    required
                                    disabled={isSaving}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-green-500 focus:border-green-500"
                                    placeholder="Required: e.g., Tuition Fee"
                                />
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                    Description (Optional)
                                </label>
                                <input
                                    type="text"
                                    id="description"
                                    name="description"
                                    value={newItemForm.description}
                                    onChange={handleInputChange}
                                    disabled={isSaving}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-green-500 focus:border-green-500"
                                    placeholder="e.g., Full term fee for Year 3"
                                />
                            </div>
                            
                            <div>
                                <label htmlFor="current_unit_price" className="block text-sm font-medium text-gray-700">
                                    Unit Price (Ksh.)
                                </label>
                                <input
                                    type="number"
                                    id="current_unit_price"
                                    name="current_unit_price"
                                    value={newItemForm.current_unit_price === '' ? '' : newItemForm.current_unit_price}
                                    onChange={handleInputChange}
                                    required
                                    min="0"
                                    step="0.01"
                                    disabled={isSaving}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-green-500 focus:border-green-500"
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    disabled={isSaving}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                                >
                                    {isSaving ? 'Saving...' : editingItem ? 'Update Item' : 'Save Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
