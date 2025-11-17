// src/components/Financial/Invoices/InvoiceBatchCreate.tsx

import React, { useState, useMemo } from 'react';
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
    // NOTE: The IDs are not used in the database insertion logic for line items, but are useful for UI keying
    item_master_id: '',
    itemName: '',
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
 */
const getUniqueClasses = (students: StudentInfo[]): string[] => {
    // Rely ONLY on the denormalized class_name for clean filtering
    const classes = students
        .map(s => s.class_name)
        .filter(Boolean); // Filters out null/undefined/empty string values

    const uniqueClasses = Array.from(new Set(classes as string[]));
    
    // Sort and prepend the 'All Classes' option
    return ['All Classes', ...uniqueClasses.sort()];
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
        includeBalance: false, 
        bbfItemMasterId: '' // The ID of the item master to use for the BBF line
    });
    const [conditionalRules, setConditionalRules] = useState<ConditionalLineItemRule[]>([]);
    // 🌟 STATE FOR CUSTOM LINE ITEM STAGING STATUS 🌟
    const [isCustomItemsStaged, setIsCustomItemsStaged] = useState(false);
    // 🌟 NEW STATE FOR STAGING ALERT MODAL 🌟
    const [showStagingAlert, setShowStagingAlert] = useState(false);


    // --- ORIGINAL GENERAL BATCH STATE ---
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [invoiceDate, setInvoiceDate] = useState(today); 
    const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [generalDescription, setGeneralDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null); 
    
    // --- New State for Class Filtering ---
    const [selectedClass, setSelectedClass] = useState('All Classes');
    
    // Generate unique class list for the filter dropdown
    const uniqueClasses = useMemo(() => getUniqueClasses(allStudents), [allStudents]);

    // 🌟 DEBUGGING CONSOLE LOG 🌟
    console.log(`[BBF PARENT DEBUG] Student IDs selected: ${selectedStudentIds.length}`);

    // --- NEW MEMOIZED ARRAY OF STUDENT OBJECTS FOR BBF COMPONENT ---
    // This is the FIX: Map the list of IDs to the full StudentInfo objects required by BalanceBroughtForward.tsx
    const selectedStudentObjects = useMemo(() => {
        const selectedObjects = allStudents.filter(student => 
            selectedStudentIds.includes(student.admission_number)
        ).map(student => ({
            student_name: student.name, // Map name to student_name
            admission_number: student.admission_number, // Map admission_number
        }));
        
        // 🌟 DEBUGGING CONSOLE LOG 🌟
        console.log(`[BBF PARENT DEBUG] Student Objects for BBF: ${selectedObjects.length} objects`);
        // console.log(`[BBF PARENT DEBUG] Student Objects details:`, selectedObjects); // Uncomment for full details
        
        return selectedObjects;
    }, [allStudents, selectedStudentIds]);

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
            
            if (name === 'item_master_id') {
                const selectedItem = masterItems.find(i => i.id === value);
                if (selectedItem) {
                    item.item_master_id = value;
                    item.itemName = selectedItem.item_name; 
                    item.description = selectedItem.description; 
                    item.unitPrice = selectedItem.current_unit_price;
                } else {
                    item.item_master_id = '';
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
    
    // 🌟 HANDLER FUNCTION FOR CUSTOM LINE ITEM STAGING 🌟
    const handleCustomStagingStatusChange = (isStaged: boolean) => {
        setIsCustomItemsStaged(isStaged);
    }
    
    /**
     * Filtered Student List based on selected class.
     */
    const filteredStudents = useMemo(() => {
        if (selectedClass === 'All Classes') {
            return allStudents;
        }
        
        return allStudents.filter(student => student.class_name === selectedClass);
    }, [allStudents, selectedClass]);
    
    // Student Selection Logic (Simple toggle for now)
    const handleStudentToggle = (admissionNumber: string) => {
        // Prevent changing students when custom items are staged
        if (isCustomItemsStaged) return; 

        setSelectedStudentIds(prev =>
            prev.includes(admissionNumber)
                ? prev.filter(id => id !== admissionNumber)
                : [...prev, admissionNumber]
        );
    };
    
    // --- Submission Logic (UPDATED) ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmissionError(null); 
        
        if (selectedStudentIds.length === 0) {
            alert("Please select at least one student to create batch invoices for.");
            return;
        }

        // Logic to check for unstaged conditional items
        const hasConditionalRules = conditionalRules.length > 0;
        
        if (hasConditionalRules && !isCustomItemsStaged) {
            // Show the custom alert modal
            setShowStagingAlert(true);
            return;
        }
        
        // --- Remaining Validation checks ---
        
        const hasUnselectedCommonItem = lineItems.some(item => !item.item_master_id);
        if (hasUnselectedCommonItem) {
            alert("Please ensure all Common Line items have a Master Item selected.");
            return;
        }

        if (bbfData.includeBalance && !bbfData.bbfItemMasterId) {
            alert("Please select a Master Item for the Balance Brought Forward line.");
            return;
        }
        
        // This validation should check if *any* rule is defined, not just if there are rules
        // since the rules themselves must have a master item selected.
        const hasUnselectedConditionalItem = conditionalRules.some(rule => rule.enabled && !rule.item_master_id);
        if (hasUnselectedConditionalItem) {
            alert("Please ensure all enabled Conditional Line rules have a Master Item selected.");
            return;
        }

        // Must have at least one way to generate an item
        const hasAnyItems = lineItems.some(item => !!item.item_master_id) || bbfData.includeBalance || conditionalRules.length > 0;
        if (!hasAnyItems) {
            alert("Please define at least one item (Common, BBF, or Conditional) to generate invoices.");
            return;
        }

        // --- Actual Submission Process ---
        setIsSubmitting(true);
        
        try {
            // Map Common Line Items for submission (Original Logic)
            // Filter out items that were added but never selected/configured
            const itemsForSubmission = lineItems
                .filter(item => !!item.item_master_id) 
                .map(item => ({
                    item_master_id: item.item_master_id,
                    description: item.description,
                    unitPrice: item.unitPrice,
                    quantity: item.quantity,
                    discount: item.discount,
                    itemName: item.itemName, 
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
                bbfItemMasterId: bbfData.bbfItemMasterId,
                conditionalLineRules: conditionalRules, 
            };
            
            // NOTE: The 'as any' is a temporary fix if the service function expects a less strict type, 
            // but the BatchCreationData type should be correct for the backend. Removed it for cleaner code.
            const successCount = await createBatchInvoices(batchSubmission); 
            
            alert(`Batch creation successful! ${successCount} invoices created.`);
            onClose();

        } catch (error) {
            console.error("Batch invoice submission failed:", error);
            const errorMessage = (error instanceof Error) ? error.message : "An unexpected error occurred.";
            setSubmissionError(errorMessage);
            alert(`Submission Error: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
            // Reset staging status on submission completion/failure
            setIsCustomItemsStaged(false);
        }
    };
    
    // --- Render Logic ---
    
    // isReadyToSubmit: requires students selected AND not currently submitting
    const isReadyToSubmit = selectedStudentIds.length > 0 && !isSubmitting;
    
    // Determine if sections should be locked/collapsed 
    // Sections are locked when conditional items are staged to prevent data inconsistency
    const isSectionLocked = isCustomItemsStaged;
    
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
                <div className={`p-4 border rounded-lg shadow-sm ${isSectionLocked ? 'opacity-60 pointer-events-none bg-gray-100' : ''}`}>
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
                        {lineItems.map((item, index) => (
                            <div key={index} className="grid grid-cols-10 md:grid-cols-12 gap-2 items-center border-b pb-2">
                                {/* Item Name/ID */}
                                <div className="col-span-3 md:col-span-4">
                                    <select
                                        name="item_master_id"
                                        value={item.item_master_id}
                                        onChange={(e) => handleLineItemChange(index, e)}
                                        className="w-full p-2 border rounded-lg text-xs md:text-sm"
                                        disabled={loadingItems || isSubmitting || isSectionLocked}
                                        required
                                    >
                                        <option value="">{loadingItems ? 'Loading...' : 'Select Item'}</option>
                                        {masterItems.map(mItem => (
                                            <option key={mItem.id} value={mItem.id}>
                                                {mItem.item_name} {mItem.description && `(${mItem.description})`}
                                            </option>
                                        ))}
                                    </select>
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
                                    disabled={isSubmitting || isSectionLocked}
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
                                    disabled={isSubmitting || isSectionLocked}
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
                                    disabled={isSubmitting || isSectionLocked}
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
                                    disabled={lineItems.length === 1 || isSubmitting || isSectionLocked}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                    
                    {/* Add Item Button & Totals */}
                    <div className="flex justify-between items-center mt-4 pt-4 border-t">
                        <button 
                            type="button" 
                            onClick={handleAddItem} 
                            className="flex items-center text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 text-sm"
                            disabled={isSubmitting || isSectionLocked}
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
                    // This section receives the IDs and the ALL students list and does its own filtering/mapping
                    selectedStudentIds={selectedStudentIds} 
                    allStudents={allStudents}
                    onStagingStatusChange={handleCustomStagingStatusChange}
                    isStaged={isCustomItemsStaged}
                />
                
                {/* --- */}

                {/* === NEW SECTION: BALANCE BROUGHT FORWARD === */}
                <div className={` ${isSectionLocked ? 'opacity-60 pointer-events-none bg-gray-100 p-4 border rounded-lg' : ''}`}>
                    <BalanceBroughtForward
                        bbfData={bbfData}
                        setBbfData={setBbfData}
                        // FIX APPLIED HERE: Pass the correctly mapped array of student objects
                        selectedStudents={selectedStudentObjects}
                        selectedStudentCount={selectedStudentIds.length}
                        isSubmitting={isSubmitting || isSectionLocked}
                        masterItems={masterItems} // This prop is likely used internally by BBF for master item selection
                        onSaveSuccess={() => { /* Placeholder for save success handler if needed */ }}
                    />
                </div>
                
                {/* ---------------------------------------------------------------------------------- */}

                {/* --- 3. Student Selection & Filters (UPDATED) --- */}
                <div className={`p-4 border rounded-lg shadow-sm ${isSectionLocked ? 'opacity-60 pointer-events-none bg-gray-100' : ''}`}>
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
                                disabled={loadingStudents || isSubmitting || isSectionLocked}
                            >
                                {uniqueClasses.map(className => (
                                    <option key={className} value={className}>
                                        {className}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Student List */}
                    <div className="max-h-60 overflow-y-auto border p-2 rounded-lg bg-white">
                        {loadingStudents ? (
                            <p className="text-center text-gray-500">Loading students...</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {filteredStudents.map(student => {
                                    const isSelected = selectedStudentIds.includes(student.admission_number);
                                    
                                    // Use class_name (TEXT) for display, falling back to 'N/A' if null/undefined
                                    const classDisplay = student.class_name || 'N/A';
                                    
                                    return (
                                        <div 
                                            key={student.admission_number}
                                            // Conditional onClick to prevent selection change when locked
                                            onClick={() => !isSectionLocked && handleStudentToggle(student.admission_number)}
                                            className={`p-2 border rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                                                isSelected ? 'bg-blue-100 border-blue-500' : 'bg-white hover:bg-gray-50'
                                            } ${isSectionLocked ? 'cursor-not-allowed' : ''}`}
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
                        {allStudents.length === 0 && !loadingStudents && (
                            <p className="text-center text-gray-500">No students available.</p>
                        )}
                        {filteredStudents.length === 0 && selectedClass !== 'All Classes' && !loadingStudents && (
                            <p className="text-center text-gray-500">No students found in {selectedClass}.</p>
                        )}
                    </div>
                </div>

                {/* --- 4. Action Buttons (UPDATED) --- */}
                <div className="flex justify-between items-center border-t pt-4">
                    <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50" disabled={isSubmitting}>
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 font-semibold transition-colors"
                        // FIX: Allow submission attempt (and therefore staging alert) if students are selected
                        disabled={!isReadyToSubmit && !showStagingAlert} 
                    >
                        {isSubmitting ? 'Creating Invoices...' : `Create ${selectedStudentIds.length} Invoices`}
                    </button>
                </div>
            </form>

            {/* 🌟 Staging Alert Modal 🌟 */}
            {showStagingAlert && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md space-y-4">
                        <h3 className="text-xl font-bold text-red-700 flex items-center">
                            <AlertTriangle size={24} className="mr-2 text-red-500" /> Action Required
                        </h3>
                        <p className="text-gray-700">
                            You have defined **Conditional Line Items**, but they have not been staged (saved to the temporary table) yet.
                        </p>
                        <p className="text-gray-700 font-medium">
                            Please go back to the Conditional Line Items section and click the **Save** button to proceed with invoice creation.
                        </p>
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={() => setShowStagingAlert(false)}
                                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                Got it, take me back
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};