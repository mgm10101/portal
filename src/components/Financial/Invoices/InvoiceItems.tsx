// src/components/Financial/Invoices/InvoiceItems.tsx

import React, { useState } from 'react';
import { ItemMaster } from '../../../types/database'; 
// ✅ CRITICAL FIX: Import the Supabase client directly.
import { supabase } from '../../../supabaseClient'; 

interface InvoiceItemsProps {
    masterItems: ItemMaster[];
    setMasterItems: React.Dispatch<React.SetStateAction<ItemMaster[]>>; 
    loadingItems?: boolean; 
}

/**
 * Component to manage the list of Master Invoice Items (e.g., School Fees, Books, etc.)
 */
export const InvoiceItems: React.FC<InvoiceItemsProps> = ({ 
    masterItems, 
    setMasterItems,
    loadingItems = false 
}) => {
    // State for Modal and Form
    const [isModalOpen, setIsModalOpen] = useState(false);
    // ✅ New state to manage the saving process
    const [isSaving, setIsSaving] = useState(false); 
    const [newItemForm, setNewItemForm] = useState({
        item_name: '',
        description: '',
        current_unit_price: '' as number | '' 
    });

    // --- Modal Handlers ---
    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        // Reset form on close
        setNewItemForm({ item_name: '', description: '', current_unit_price: '' });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewItemForm(prev => ({
            ...prev,
            [name]: name === 'current_unit_price' ? (value === '' ? '' : parseFloat(value) || 0) : value,
        }));
    };

    // --- Persistence Logic ---
    const handleSaveNewItem = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic Validation
        if (!newItemForm.item_name || newItemForm.current_unit_price === '' || isNaN(Number(newItemForm.current_unit_price))) {
            alert('Please enter a valid Item Name and Unit Price.');
            return;
        }

        const price = Number(newItemForm.current_unit_price);
        setIsSaving(true); // Disable form during API call

        const newItemPayload = {
            item_name: newItemForm.item_name,
            description: newItemForm.description,
            current_unit_price: price,
            // Ensure status is included to match the DB schema
            status: 'Active' 
        };

        try {
            // ✅ CRITICAL FIX: The Supabase INSERT operation
            const { data, error } = await supabase
                .from('item_master') // Assuming your table name is 'item_master'
                .insert([newItemPayload])
                .select() // Request the newly inserted row back (including generated ID/created_at)
                .single(); 

            if (error) {
                console.error('Supabase Insert Error:', error);
                // Throwing here triggers the catch block
                throw new Error(error.message); 
            }

            if (data) {
                // ✅ Update the local state with the actual, DB-persisted item
                // Prepended to the array so it appears at the top of the list
                setMasterItems(prevItems => [data as ItemMaster, ...prevItems]);
            }
            
            // Close and reset the modal only on success
            handleCloseModal();
            
        } catch (error) {
            console.error("Failed to save item to database:", error);
            alert("An error occurred while saving the item. Ensure your table columns match the payload and check RLS policies.");
        } finally {
            setIsSaving(false); // Re-enable form regardless of success/failure
        }
    };


    // Placeholder data for demonstration/initial structure. 
    const placeholderItems: (ItemMaster & { status?: 'Active' | 'Inactive' })[] = [
        { id: '1', item_name: 'Tuition Fees', current_unit_price: 500.00, created_at: '2023-01-01', description: 'Standard term tuition fee.', status: 'Active' },
        { id: '2', item_name: 'Library Fee', current_unit_price: 25.00, created_at: '2023-01-01', description: 'Annual Library access fee.', status: 'Active' },
        { id: '3', item_name: 'Uniform Fee', current_unit_price: 75.00, created_at: '2023-01-01', description: 'Mandatory school uniform fee.', status: 'Inactive' },
    ];
    
    // Use masterItems or placeholder if masterItems is empty for demonstration
    const displayItems = (masterItems.length > 0 ? masterItems : placeholderItems).map(item => ({
        ...item,
        status: item.status || 'Active' as 'Active' | 'Inactive'
    }));

    // Handler to change the status of an item (conceptual: this would require an API/DB UPDATE call as well)
    const handleStatusChange = (id: string, newStatus: 'Active' | 'Inactive') => {
        console.log(`Updating item ${id} status to ${newStatus}. (DB update required here)`);
        
        // Local state update for responsiveness
        setMasterItems(prevItems => prevItems.map(item => 
            item.id === id ? { ...item, status: newStatus } : item
        ) as ItemMaster[]); 
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-2xl font-semibold text-gray-800">Manage Invoice Items</h3>
                <button 
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    onClick={handleOpenModal} 
                >
                    + New Item
                </button>
            </div>
            
            {loadingItems ? (
                <div className="text-center p-10 text-gray-500">Loading master items...</div>
            ) : (
                <>
                    <div className="bg-gray-50 p-4 border rounded-lg">
                        <p className="font-medium mb-2">Item List ({displayItems.length} items loaded)</p>
                        <div className="overflow-x-auto">
                            <ul className="divide-y divide-gray-200 min-w-full">
                                <li className="py-2 flex justify-between items-center text-xs font-semibold uppercase text-gray-600 border-b border-gray-300">
                                    <span className="w-1/2">Item Name / Description</span>
                                    <span className="w-1/6 text-right">Price</span>
                                    <span className="w-1/4 text-center">Status</span>
                                </li>

                                {displayItems.map(item => (
                                    <li key={item.id} className="py-2 flex justify-between items-center text-sm">
                                        <div className="w-1/2 flex flex-col sm:flex-row sm:items-baseline">
                                            <span className="font-medium text-gray-900">{item.item_name}</span>
                                            <span className="text-xs text-gray-500 sm:ml-2">({item.description || 'No description'})</span>
                                        </div>

                                        <span className="w-1/6 text-right text-gray-600 font-mono">Ksh.{item.current_unit_price.toFixed(2)}</span>

                                        <div className="w-1/4 flex justify-center">
                                            <select 
                                                value={item.status}
                                                onChange={(e) => handleStatusChange(item.id, e.target.value as 'Active' | 'Inactive')}
                                                className={`p-1 text-xs border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${item.status === 'Active' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'}`}
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Inactive">Inactive</option>
                                            </select>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </>
            )}

            <div className="border-t border-gray-200 pt-6 mt-6 space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">Invoice Details Configuration</h3>
                <div className="bg-white p-4 border rounded-lg shadow-sm space-y-3">
                    <p className="font-medium text-gray-700">Company Information:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="p-2 border rounded bg-white">
                            <label className="block font-semibold text-gray-600">Company Name</label>
                            <p className="text-gray-800">Example Academy Ltd.</p>
                        </div>
                        <div className="p-2 border rounded bg-white">
                            <label className="block font-semibold text-gray-600">Address</label>
                            <p className="text-gray-800">P.O. Box 123 - 00100, Nairobi</p>
                        </div>
                        <div className="md:col-span-2 p-2 border rounded bg-white">
                            <label className="block font-semibold text-gray-600">Logo URL / Upload</label>
                            <p className="text-gray-800 italic">https://example.com/logo.png (Edit button to be implemented)</p>
                        </div>
                    </div>
                    
                    <p className="font-medium text-gray-700 pt-3">Payment Details:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="p-2 border rounded bg-white">
                            <label className="block font-semibold text-gray-600">Bank Name</label>
                            <p className="text-gray-800">Bank of Africa</p>
                        </div>
                        <div className="p-2 border rounded bg-white">
                            <label className="block font-semibold text-gray-600">Account Number</label>
                            <p className="text-gray-800">1234567890</p>
                        </div>
                        <div className="p-2 border rounded bg-white">
                            <label className="block font-semibold text-gray-600">MPESA Paybill</label>
                            <p className="text-gray-800">400001</p>
                        </div>
                        <div className="p-2 border rounded bg-white">
                            <label className="block font-semibold text-gray-600">SWIFT/Routing</label>
                            <p className="text-gray-800">BOFAKENB</p>
                        </div>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button className="text-blue-600 hover:text-blue-700 text-sm">
                            Edit Details
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-end pt-4">
                <button 
                    onClick={() => console.log('Close Invoice Items view')} 
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                    Done
                </button>
            </div>


            {/* --- NEW ITEM CREATION MODAL (Popup) --- */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
                    <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-auto p-6">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center pb-3 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">Create New Invoice Item</h3>
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                disabled={isSaving} // Disable close when saving
                                className="text-gray-400 hover:text-gray-600"
                                aria-label="Close"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        
                        {/* Modal Body (Form) */}
                        <form onSubmit={handleSaveNewItem} className="mt-4 space-y-4">
                            {/* Field 1: Name (item_name) */}
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
                                disabled={isSaving} // Disable when saving
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-green-500 focus:border-green-500"
                                    placeholder="Required: e.g., Tuition Fee"
                                />
                            </div>

                            {/* Field 2: Description (description) */}
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
                                disabled={isSaving} // Disable when saving
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-green-500 focus:border-green-500"
                                    placeholder="e.g., Full term fee for Year 3"
                                />
                            </div>
                            
                            {/* Field 3: Price (current_unit_price) */}
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
                                disabled={isSaving} // Disable when saving
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-green-500 focus:border-green-500"
                                    placeholder="0.00"
                                />
                            </div>

                            {/* Modal Footer (Actions) */}
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                disabled={isSaving} // Disable when saving
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                disabled={isSaving} // Disable when saving
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                                >
                                    {isSaving ? 'Saving...' : 'Save Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};