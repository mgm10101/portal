// src/components/Financial/Invoices/InvoiceBatchCreate.tsx

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ItemMaster, InvoiceLineItem, StudentInfo } from '../../../types/database'; 
import { Plus, X, Search, CheckCircle, AlertTriangle } from 'lucide-react';
import { createBatchInvoices } from '../../../services/financialService'; // Assuming this service function exists
import { BatchCreationData } from '../../../services/financialService'; // Import the new type for correct submission

// ==============================================================================
// 🌟 NEW IMPORTS: Balance Brought Forward & Custom Line Items
import { BalanceBroughtForward, BalanceBroughtForwardData } from './BalanceBroughtForward'; 
import { CustomLineItems, ConditionalLineItemRule } from './CustomLineItems'; 
// ==============================================================================

interface InvoiceBatchCreateProps {
    masterItems: ItemMaster[];
    loadingItems: boolean;
    // We'll need to fetch and pass ALL students to this component later for filtering
    allStudents: StudentInfo[]; 
    loadingStudents: boolean; 
    onClose: () => void;
}

// Factory function for a new default line item
const getNewDefaultLineItem = (): InvoiceLineItem => ({
    // NOTE: Using itemName for DB storage, selectedItemId for UI selection
    itemName: '',
    selectedItemId: '', // Item ID used for dropdown selection (not stored in DB)
    description: null,
    unitPrice: 0.00,
    quantity: 1,
    discount: 0,
    lineTotal: 0.00,
    // Add missing InvoiceLineItem fields with defaults if necessary, though they are likely omitted from Batch UI
    id: undefined,
    invoice_number: undefined, 
});

/**
 * Generates a unique list of class names for the filter dropdown, relying on the denormalized class_name.
 * NOTE: Removed 'All Classes' option - students are only shown when a class is selected.
 */
const getUniqueClasses = (students: StudentInfo[]): string[] => {
    // Rely ONLY on the denormalized class_name for clean filtering
    const classes = students
        .map(s => s.class_name)
        .filter(Boolean); // Filters out null/undefined/empty string values

    const uniqueClasses = Array.from(new Set(classes as string[]));
    
    // Sort classes (no 'All Classes' option)
    return uniqueClasses.sort();
}


export const InvoiceBatchCreate: React.FC<InvoiceBatchCreateProps> = ({ 
    masterItems, 
    loadingItems, 
    allStudents, 
    loadingStudents, 
    onClose 
}) => {
    
    const today = new Date().toISOString().split('T')[0];
    
    // --- ORIGINAL STATE (Common Line Items) ---
    const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([getNewDefaultLineItem()]);
    
    // --- NEW STATE FOR BBF AND CUSTOM ITEMS ---
    const [bbfData, setBbfData] = useState<BalanceBroughtForwardData>({ 
        includeBalance: false
    });
    const [conditionalRules, setConditionalRules] = useState<ConditionalLineItemRule[]>([]);


    // --- ORIGINAL GENERAL BATCH STATE ---
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [invoiceDate, setInvoiceDate] = useState(today); 
    const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [generalDescription, setGeneralDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [creationProgress, setCreationProgress] = useState({ current: 0, total: 0 }); 
    
    // --- New State for Class Filtering ---
    // Changed default to empty string - no class selected initially
    const [selectedClass, setSelectedClass] = useState('');
    
    // Generate unique class list for the filter dropdown
    const uniqueClasses = useMemo(() => getUniqueClasses(allStudents), [allStudents]);
    
    // Filter out "Balance Brought Forward" from available items
    const availableItems = useMemo(() => 
        masterItems.filter(i => i.item_name !== 'Balance Brought Forward'),
        [masterItems]
    );
    
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


    // --- Handlers & Calculations (ORIGINAL LOGIC) ---

    const calculateLineTotal = (item: InvoiceLineItem): number => {
        const discountFactor = 1 - ((item.discount || 0) / 100); 
        return (item.unitPrice || 0) * (item.quantity || 0) * discountFactor;
    };
    
    const grandTotal = useMemo(() => {
        return lineItems.reduce((sum, item) => sum + calculateLineTotal(item), 0);
    }, [lineItems]);

    const handleAddItem = () => {
        setLineItems(prev => [...prev, getNewDefaultLineItem()]);
    };

    const handleRemoveItem = (index: number) => {
        setLineItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleLineItemChange = (index: number, e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        
        setLineItems(prev => {
            const newList = [...prev];
            const item = { ...newList[index] }; 
            newList[index] = item; 
            
            let numericValue: number;
            
            if (name === 'quantity' || name === 'discount') {
                // Use parseInt for quantities and discounts
                numericValue = parseInt(value);
            } else if (name === 'unitPrice') {
                // Use parseFloat for prices
                numericValue = parseFloat(value);
            } else {
                // Default to 0 for non-numeric fields if unexpected
                numericValue = 0; 
            }
            
            if (name === 'selectedItemId') {
                // Find item by ID (unique identifier) to handle duplicate names correctly
                const selectedItem = availableItems.find(i => i.id === value);
                if (selectedItem) {
                    item.selectedItemId = selectedItem.id;
                    item.itemName = selectedItem.item_name; // Store the name for DB
                    item.description = selectedItem.description; 
                    item.unitPrice = selectedItem.current_unit_price;
                    // Set quantity to 1 by default when an item is selected
                    if (!item.quantity || item.quantity === 0) {
                        item.quantity = 1;
                    }
                } else {
                    item.selectedItemId = '';
                    item.itemName = '';
                    item.description = null;
                    item.unitPrice = 0.00;
                }
            } else {
                // FIX: Correctly check for NaN and assign the numeric value
                const finalValue = isNaN(numericValue) ? 0 : numericValue;
                // Safely update the property
                (item as any)[name] = finalValue; 
            }

            // Recalculate lineTotal whenever an input changes
            item.lineTotal = calculateLineTotal(item);
            
            return newList;
        });
    };
    
    /**
     * Filtered Student List based on selected class.
     * Returns empty array if no class is selected (prevents loading all students).
     */
    const filteredStudents = useMemo(() => {
        // Don't show any students until a class is selected
        if (!selectedClass || selectedClass === '') {
            return [];
        }
        
        return allStudents.filter(student => student.class_name === selectedClass);
    }, [allStudents, selectedClass]);
    
    // Student Selection Logic (Simple toggle for now)
    const handleStudentToggle = (admissionNumber: string) => {
        setSelectedStudentIds(prev =>
            prev.includes(admissionNumber)
                ? prev.filter(id => id !== admissionNumber)
                : [...prev, admissionNumber]
        );
    };
    
    // Select All students from the filtered list
    const handleSelectAll = () => {
        const allFilteredIds = filteredStudents.map(student => student.admission_number);
        setSelectedStudentIds(prev => {
            // Combine existing selections with filtered students, removing duplicates
            const combined = [...new Set([...prev, ...allFilteredIds])];
            return combined;
        });
    };
    
    // Drop All selected students
    const handleDropAll = () => {
        setSelectedStudentIds([]);
    };
    
    // --- Submission Logic (UPDATED) ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmissionError(null); 
        
        if (selectedStudentIds.length === 0) {
            alert("Please select at least one student to create batch invoices for.");
            return;
        }

        // --- Validation checks ---
        
        const hasUnselectedCommonItem = lineItems.some(item => !item.itemName);
        if (hasUnselectedCommonItem) {
            alert("Please ensure all Common Line items have a Master Item selected.");
            return;
        }

        
        // This validation should check if *any* rule is defined, not just if there are rules
        // since the rules themselves must have a master item selected.
        const hasUnselectedConditionalItem = conditionalRules.some(rule => rule.enabled && !rule.itemName);
        if (hasUnselectedConditionalItem) {
            alert("Please ensure all enabled Conditional Line rules have a Master Item selected.");
            return;
        }

        // Must have at least one way to generate an item
        const hasAnyItems = lineItems.some(item => !!item.itemName) || bbfData.includeBalance || conditionalRules.length > 0;
        if (!hasAnyItems) {
            alert("Please define at least one item (Common, BBF, or Conditional) to generate invoices.");
            return;
        }

        // --- Actual Submission Process ---
        setIsSubmitting(true);
        setCreationProgress({ current: 0, total: selectedStudentIds.length });
        
        try {
            // Map Common Line Items for submission (Original Logic)
            // Filter out items that were added but never selected/configured
            const itemsForSubmission = lineItems
                .filter(item => !!item.itemName) 
                .map(item => ({
                    itemName: item.itemName,
                    description: item.description,
                    unitPrice: item.unitPrice,
                    quantity: item.quantity,
                    discount: item.discount, 
                    lineTotal: item.lineTotal, 
                }));

            // Final Submission Object - COMBINING ALL DATA
            const batchSubmission: BatchCreationData = {
                selectedStudentIds: selectedStudentIds,
                invoiceDate: invoiceDate, 
                dueDate: dueDate,
                description: generalDescription,
                lineItems: itemsForSubmission, // Common Line Items
                
                // --- NEW FIELDS FOR SERVICE LAYER ---
                includeBalanceBroughtForward: bbfData.includeBalance,
                conditionalLineRules: conditionalRules, 
            };
            
            // Progress callback to update UI
            const progressCallback = (current: number, total: number) => {
                setCreationProgress({ current, total });
            };
            
            // NOTE: The 'as any' is a temporary fix if the service function expects a less strict type, 
            // but the BatchCreationData type should be correct for the backend. Removed it for cleaner code.
            const successCount = await createBatchInvoices(batchSubmission, progressCallback); 
            
            alert(`Batch creation successful! ${successCount} invoices created.`);
            onClose();

        } catch (error) {
            console.error("Batch invoice submission failed:", error);
            const errorMessage = (error instanceof Error) ? error.message : "An unexpected error occurred.";
            setSubmissionError(errorMessage);
            alert(`Submission Error: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
            setCreationProgress({ current: 0, total: 0 });
        }
    };
    
    // --- Render Logic ---
    
    // isReadyToSubmit: requires students selected AND not currently submitting
    const isReadyToSubmit = selectedStudentIds.length > 0 && !isSubmitting;
    
    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800">Batch Invoice Creator</h3>
            <p className="text-gray-600">
                Define the items and dates once, then select multiple students to generate invoices simultaneously.
            </p>

            {submissionError && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    **Error:** {submissionError}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* --- 1. Batch Details & Dates (UPDATED) --- */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-gray-50">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                        <input
                            type="date"
                            value={invoiceDate}
                            onChange={(e) => setInvoiceDate(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">General Description (e.g., Q2 Term Fees)</label>
                        <input
                            type="text"
                            value={generalDescription}
                            onChange={(e) => setGeneralDescription(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            placeholder="Optional general description for all invoices"
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                {/* --- 2. Common Line Items Template (ORIGINAL LOGIC) --- */}
                <div className="p-4 border rounded-lg shadow-sm">
                    <h4 className="text-xl font-semibold mb-3">1. Common Line Items <span className="text-sm font-normal text-blue-600">({selectedStudentIds.length} Students)</span></h4>
                    
                    {/* Item Headers */}
                    <div className="grid grid-cols-10 md:grid-cols-12 gap-2 items-center text-xs md:text-sm font-semibold text-gray-600 border-b pb-1 mb-2">
                        <div className="col-span-3 md:col-span-4">Item (Description)</div>
                        <div className="col-span-1 text-center">Qty</div>
                        <div className="col-span-2 text-right">Unit Price</div>
                        <div className="col-span-1 text-center">Disc(%)</div> 
                        <div className="col-span-2 md:col-span-3 text-right">Line Total</div>
                        <div className="col-span-1"></div>
                    </div>

                    {/* Item Rows */}
                    <div className="space-y-3">
                        {lineItems.map((item, index) => {
                            // Get selected item display name
                            const selectedItem = availableItems.find(i => i.id === item.selectedItemId);
                            const selectedItemDisplay = selectedItem
                                ? `${selectedItem.item_name}${selectedItem.description ? ` (${selectedItem.description})` : ''}`
                                : (loadingItems ? 'Loading...' : 'Select Item');
                            
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
                            <div key={index} className="grid grid-cols-10 md:grid-cols-12 gap-2 items-center border-b pb-2">
                                {/* Item Name/ID - Searchable Dropdown */}
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
                                            if (!item.selectedItemId) {
                                                setSearchQueries(prev => ({ ...prev, [index]: '' }));
                                            }
                                        }}
                                        placeholder={loadingItems ? 'Loading...' : 'Select Item'}
                                        className="w-full p-2 border rounded-lg text-xs md:text-sm"
                                        disabled={loadingItems || isSubmitting}
                                        required
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
                                                        <span className="font-medium text-gray-900 text-xs md:text-sm">{i.item_name}</span>
                                                        {i.description && (
                                                            <span className="text-xs text-gray-500 ml-2">({i.description})</span>
                                                        )}
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="p-3 text-gray-500 italic text-xs md:text-sm">
                                                    {searchQuery ? `No items found matching "${searchQuery}"` : 'No items available'}
                                                </li>
                                            )}
                                        </ul>
                                    )}
                                </div>
                                {/* Quantity */}
                                <input 
                                    type="number" 
                                    name="quantity"
                                    placeholder="Qty" 
                                    value={item.quantity || 0}
                                    onChange={(e) => handleLineItemChange(index, e)}
                                    className="col-span-1 p-2 border rounded-lg text-xs md:text-sm text-center"
                                    min="1"
                                    disabled={isSubmitting}
                                />
                                {/* Unit Price */}
                                <input 
                                    type="number" 
                                    name="unitPrice"
                                    placeholder="Price" 
                                    value={item.unitPrice || 0}
                                    onChange={(e) => handleLineItemChange(index, e)}
                                    className="col-span-2 p-2 border rounded-lg text-xs md:text-sm text-right"
                                    step="0.01"
                                    disabled={isSubmitting}
                                />
                                {/* Discount */}
                                <input 
                                    type="number" 
                                    name="discount"
                                    placeholder="Disc" 
                                    value={item.discount || 0}
                                    onChange={(e) => handleLineItemChange(index, e)}
                                    className="col-span-1 p-2 border rounded-lg text-xs md:text-sm text-center"
                                    min="0"
                                    max="100"
                                    disabled={isSubmitting}
                                />
                                {/* Total */}
                                <div className="col-span-2 md:col-span-3 text-right font-medium text-gray-700 text-sm">
                                    Ksh.{calculateLineTotal(item).toFixed(2)}
                                </div>
                                {/* Remove Button */}
                                <button 
                                    type="button" 
                                    onClick={() => handleRemoveItem(index)}
                                    className="col-span-1 text-red-500 hover:text-red-700 disabled:opacity-50"
                                    disabled={lineItems.length === 1 || isSubmitting}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            );
                        })}
                    </div>
                    
                    {/* Add Item Button & Totals */}
                    <div className="flex justify-between items-center mt-4 pt-4 border-t">
                        <button 
                            type="button"
                            onClick={handleAddItem} 
                            className="flex items-center text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 text-sm"
                            disabled={isSubmitting}
                        >
                            <Plus size={16} className="mr-1" /> Add Common Item
                        </button>
                        <div className="text-lg md:text-xl font-bold text-blue-700">
                            Common Total per Invoice: Ksh.{grandTotal.toFixed(2)}
                        </div>
                    </div>
                </div>
                
                {/* ---------------------------------------------------------------------------------- */}
                {/* === NEW SECTION: CUSTOMLINE ITEMS === */}
                <CustomLineItems
                    conditionalRules={conditionalRules}
                    setConditionalRules={setConditionalRules}
                    masterItems={masterItems}
                    isSubmitting={isSubmitting}
                    selectedStudentIds={selectedStudentIds} 
                    allStudents={allStudents}
                />
                
                {/* --- */}

                {/* === NEW SECTION: BALANCE BROUGHT FORWARD === */}
                <BalanceBroughtForward
                    bbfData={bbfData}
                    setBbfData={setBbfData}
                    selectedStudentCount={selectedStudentIds.length}
                    isSubmitting={isSubmitting}
                />
                
                {/* ---------------------------------------------------------------------------------- */}

                {/* --- 3. Student Selection & Filters (UPDATED) --- */}
                <div className="p-4 border rounded-lg shadow-sm">
                    {/* Filter by Class Dropdown moved to top-right */}
                    <div className="flex justify-between items-start mb-3">
                        <h4 className="text-xl font-semibold">Target Students ({selectedStudentIds.length} Selected)</h4>
                        
                        <div className="flex items-center space-x-2">
                            <label htmlFor="class-filter" className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by Class</label>
                            <select
                                id="class-filter"
                                value={selectedClass}
                                onChange={(e) => {
                                    setSelectedClass(e.target.value);
                                }}
                                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm"
                                disabled={loadingStudents || isSubmitting}
                            >
                                <option value="">-- Select a Class --</option>
                                {uniqueClasses.map(className => (
                                    <option key={className} value={className}>
                                        {className}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    {/* Select All / Drop All buttons - only show when a class is selected */}
                    {selectedClass && filteredStudents.length > 0 && (
                        <div className="flex justify-end gap-2 mb-3">
                            <button
                                type="button"
                                onClick={handleSelectAll}
                                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isSubmitting || filteredStudents.length === 0}
                            >
                                Select All ({filteredStudents.length})
                            </button>
                            {selectedStudentIds.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleDropAll}
                                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-300 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isSubmitting}
                                >
                                    Drop All ({selectedStudentIds.length})
                                </button>
                            )}
                        </div>
                    )}

                    {/* Student List */}
                    <div className="max-h-60 overflow-y-auto border p-2 rounded-lg bg-white">
                        {loadingStudents ? (
                            <p className="text-center text-gray-500">Loading students...</p>
                        ) : !selectedClass ? (
                            <p className="text-center text-gray-500 py-8">
                                Please select a class to view and select students.
                            </p>
                        ) : filteredStudents.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">
                                No students found in {selectedClass}.
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {filteredStudents.map(student => {
                                    const isSelected = selectedStudentIds.includes(student.admission_number);
                                    
                                    // Use class_name (TEXT) for display, falling back to 'N/A' if null/undefined
                                    const classDisplay = student.class_name || 'N/A';
                                    
                                    return (
                                        <div 
                                            key={student.admission_number}
                                            onClick={() => handleStudentToggle(student.admission_number)}
                                            className={`p-2 border rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                                                isSelected ? 'bg-blue-100 border-blue-500' : 'bg-white hover:bg-gray-50'
                                            }`}
                                        >
                                            <span className={`text-sm ${isSelected ? 'font-medium text-blue-800' : 'text-gray-700'}`}>
                                                {student.name} ({classDisplay}) - ({student.admission_number})
                                            </span>
                                            {isSelected && <CheckCircle size={16} className="text-blue-600 ml-2" />}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {allStudents.length === 0 && !loadingStudents && selectedClass && (
                            <p className="text-center text-gray-500">No students available.</p>
                        )}
                    </div>
                </div>

                {/* Creation Progress */}
                {isSubmitting && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-800">
                                Creating Invoices...
                            </span>
                            <span className="text-sm text-blue-600">
                                {creationProgress.current} / {creationProgress.total}
                            </span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                            <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${creationProgress.total > 0 ? (creationProgress.current / creationProgress.total) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* --- 4. Action Buttons (UPDATED) --- */}
                <div className="flex justify-between items-center border-t pt-4">
                    <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50" disabled={isSubmitting}>
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 font-semibold transition-colors"
                        disabled={!isReadyToSubmit} 
                    >
                        {isSubmitting ? 'Creating Invoices...' : `Create ${selectedStudentIds.length} Invoices`}
                    </button>
                </div>
            </form>

        </div>
    );
};