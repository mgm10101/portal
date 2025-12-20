// src/components/Financial/Invoices/InvoiceForm.tsx

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search } from 'lucide-react';
import { 
    ItemMaster, 
    InvoiceHeader, 
    StudentInfo, 
    InvoiceLineItem,
    InvoiceSubmissionData
} from '../../../types/database'; 
import { 
    fetchMasterItems, 
    fetchStudents, 
    createInvoice,
    updateInvoice, 
    fetchFullInvoice,
    fetchOutstandingBalances,
    markInvoicesAsForwarded
} from '../../../services/financialService';
import { supabase } from '../../../supabaseClient';

// IMPORT THE NEW REFACTORED COMPONENTS
import { InvoiceFormLineItems } from './InvoiceFormLineItems';
import { InvoiceFormBalanceBF } from './InvoiceFormBalanceBF';

// --- NEW IMPORTS START ---
import { InvoiceBatchCreate } from './InvoiceBatchCreate';
import { InvoiceBatchExport } from './InvoiceBatchExport'; 
import { InvoiceItems } from './InvoiceItems';
import { InvoiceDetails } from './InvoiceDetails';
// --- NEW IMPORTS END ---




interface InvoiceFormProps {
    selectedInvoice: InvoiceHeader | null; 
    onClose: () => void;
}

// Mock data for overdue invoices (replace with real fetchOverdueInvoices(admissionNumber))
// Removed mock function - now fetching real data from Supabase

// Initial state for a new invoice (matched to the database type)
const initialInvoiceHeader: InvoiceHeader = {
    invoice_number: '', 
    admission_number: '', 
    name: '', 
    class_name: null,
    invoice_date: new Date().toISOString().split('T')[0], 
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
    status: 'Pending',
    subtotal: 0.00,
    totalAmount: 0.00,
    paymentMade: 0.00, // Important default for creation
    balanceDue: 0.00,
    invoice_seq_number: null,
    created_at: new Date().toISOString(),
    description: '',
    broughtforward_description: null,
};

// --- Factory Function for Line Items ---
const getNewDefaultLineItem = (): InvoiceLineItem => ({
    // ID is undefined for new items
    id: undefined, // Explicitly undefined for new items
    itemName: '', // Item name stored in DB
    selectedItemId: '', // Item ID used for dropdown selection (not stored in DB)
    description: null,
    unitPrice: 0.00,
    quantity: 1,
    discount: 0,
    lineTotal: 0.00,
});
// ----------------------------------------

/**
 * Helper function to determine the initial line item state.
 * If editing, it starts empty, awaiting fetch. If creating, it starts with one default item.
 */
const getInitialLineItems = (selectedInvoice: InvoiceHeader | null): InvoiceLineItem[] => {
    return selectedInvoice ? [] : [getNewDefaultLineItem()];
};

// Define tab types for the new feature
type InvoiceFormTab = 'Single Invoice' | 'Batch Creation' | 'Batch Export' | 'Invoice Items' | 'Invoice Details';

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ selectedInvoice, onClose }) => {
    const [isHovering, setIsHovering] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    
    // Keyboard navigation for scrolling
    useEffect(() => {
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
    
    // 🎯 FIX: Helper to safely convert potentially null/undefined numeric fields from the database to 0
    const safeHeaderInit = (invoice: InvoiceHeader): InvoiceHeader => ({
        ...invoice,
        // Coerce potential nulls/undefineds to 0.00 for numeric fields
        subtotal: invoice.subtotal || 0.00,
        totalAmount: invoice.totalAmount || 0.00,
        paymentMade: invoice.paymentMade || 0.00, // <--- CRITICAL FIX FOR NaN
        balanceDue: invoice.balanceDue || 0.00,   // <--- CRITICAL FIX FOR NaN
        // Ensure description is a string
        description: invoice.description || '',
    });


    // Determine if we are in Edit Mode
    const isEditMode = !!selectedInvoice;
    
    // Check if invoice is Forwarded (cannot be edited)
    const isForwarded = isEditMode && selectedInvoice?.status === 'Forwarded';

    // --- STATE ---
    // Apply the safe initializer if in edit mode, otherwise use the standard initial state
    const [header, setHeader] = useState<InvoiceHeader>(
        isEditMode ? safeHeaderInit(selectedInvoice!) : initialInvoiceHeader
    );
    const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(() => getInitialLineItems(selectedInvoice)); 
    // Use header.description for initial state to correctly reflect existing invoice description
    const [generalDescription, setGeneralDescription] = useState(selectedInvoice?.description || ''); 

    const [allStudents, setAllStudents] = useState<StudentInfo[]>([]); 
    
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(true);
    const [masterItems, setMasterItems] = useState<ItemMaster[]>([]);
    const [loadingItems, setLoadingItems] = useState(true);
    const [loadingLineItems, setLoadingLineItems] = useState(false); 
    const [overdueInvoices, setOverdueInvoices] = useState<any[]>([]); 
    const [includeBBF, setIncludeBBF] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // 🎯 FIX: If in edit mode, default to 'Single Invoice' and disable switching
    const [activeTab, setActiveTab] = useState<InvoiceFormTab>('Single Invoice');
    const previousTabRef = useRef<InvoiceFormTab>('Single Invoice');
    
    // Refetch masterItems when returning to Invoice Items tab (in case order was changed)
    useEffect(() => {
        // If we're switching TO Invoice Items tab FROM another tab, refetch to get latest order
        if (activeTab === 'Invoice Items' && previousTabRef.current !== 'Invoice Items') {
            // Refetch master items to get updated sort_order
            setLoadingItems(true);
            fetchMasterItems()
                .then(items => {
                    setMasterItems(items);
                    setLoadingItems(false);
                })
                .catch(err => {
                    console.error('Error refetching master items:', err);
                    setLoadingItems(false);
                });
        }
        previousTabRef.current = activeTab;
    }, [activeTab]);

    // --- CALCULATION LOGIC ---
    const calculateLineTotal = useCallback((item: InvoiceLineItem): number => {
        const discountFactor = 1 - ((item.discount || 0) / 100); 
        return (item.unitPrice || 0) * (item.quantity || 0) * discountFactor;
    }, []);

    const { lineItemsSubtotal, grandTotal, broughtForwardAmount } = useMemo(() => {
        // Filter out any line items that are invalid (e.g., missing name or quantity 0)
        const validLineItems = lineItems.filter(item => item.itemName && item.quantity > 0 && item.unitPrice >= 0);
        
        const subtotal = validLineItems.reduce((sum, item) => sum + calculateLineTotal(item), 0); 
        
        // Calculate brought forward amount from overdue invoices (not from line items)
        // This ensures it's available even before the BBF line item is added
        const bfa = overdueInvoices.length > 0 
            ? overdueInvoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0)
            : 0.00;
        
        // For display purposes: include BBF in total if it's enabled (even if not yet in line items)
        // When submitting, BBF will be added as a line item, so it will be in subtotal
        const total = includeBBF && bfa > 0 
            ? subtotal + bfa  // Add BBF for display when enabled
            : subtotal;       // Otherwise just subtotal
        return { lineItemsSubtotal: subtotal, grandTotal: total, broughtForwardAmount: bfa };
    }, [lineItems, calculateLineTotal, overdueInvoices, includeBBF]); 

    // Update totals in the header state
    useEffect(() => {
        // Ensure paymentMade is treated as a number (0.00 if null/undefined, though safeHeaderInit covers the initial load)
        const currentPaymentMade = header.paymentMade || 0.00;
        
        setHeader(prev => ({ 
            ...prev, 
            subtotal: parseFloat(lineItemsSubtotal.toFixed(2)),
            totalAmount: parseFloat(grandTotal.toFixed(2)),
            // Balance is calculated as Total - PaymentMade (paymentMade can be 0 or current value)
            balanceDue: parseFloat((grandTotal - currentPaymentMade).toFixed(2)),
        }));
    }, [lineItemsSubtotal, grandTotal, header.paymentMade]); // Include header.paymentMade as dependency

    // --- EFFECT: Load All Data (Students, Master Items, and Classes) ---
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [studentData, itemData] = await Promise.all([
                    fetchStudents(),
                    fetchMasterItems()
                ]);

                setAllStudents(studentData);
                setMasterItems(itemData);

                if (selectedInvoice) {
                    setSearchQuery(`${selectedInvoice.admission_number} - ${selectedInvoice.name}`);
                    // Fetch real overdue invoices
                    try {
                        const overdueData = await fetchOutstandingBalances([selectedInvoice.admission_number]);
                        setOverdueInvoices(overdueData.map(inv => ({
                            invoice_number: inv.invoice_number,
                            balanceDue: inv.balance_due
                        })));
                    } catch (error) {
                        console.error('Error fetching overdue invoices:', error);
                        setOverdueInvoices([]);
                    }
                }
            } catch (err) {
                console.error("Failed to load initial data:", err);
            } finally {
                setLoadingStudents(false);
                setLoadingItems(false);
            }
        };
        loadInitialData();
    }, [selectedInvoice]);


    // ----------------------------------------------------------------
    // --- Dedicated EFFECT to Load Line Items for EDIT mode only ---
    // ----------------------------------------------------------------
    useEffect(() => {
        if (isEditMode && selectedInvoice?.invoice_number) {
            setLoadingLineItems(true);
            const loadLineItems = async () => {
                try {
                    const fullInvoiceData = await fetchFullInvoice(selectedInvoice.invoice_number); 
                    
                    if (fullInvoiceData && fullInvoiceData.line_items) {
                        const recalculatedLineItems = fullInvoiceData.line_items.map(item => ({
                            ...item,
                            lineTotal: calculateLineTotal(item) 
                        }));
                        
                        setLineItems(recalculatedLineItems);
                    } else {
                        setLineItems([]);
                    }

                } catch (error) {
                    console.error("Failed to load invoice line items:", error);
                    alert("Could not load existing invoice items.");
                } finally {
                    setLoadingLineItems(false);
                }
            };
            loadLineItems();
        }
    }, [isEditMode, selectedInvoice, calculateLineTotal]);
    // ----------------------------------------------------------------

    // --- HANDLERS ---

    const handleSelectStudent = async (student: StudentInfo) => {
        setHeader(prev => ({
            ...prev,
            admission_number: student.admission_number,
            name: student.name,
        }));
        setSearchQuery(`${student.admission_number} - ${student.name}`); 
        setIsSearching(false);
        
        // Fetch real overdue invoices
        try {
            const overdueData = await fetchOutstandingBalances([student.admission_number]);
            setOverdueInvoices(overdueData.map(inv => ({
                invoice_number: inv.invoice_number,
                balanceDue: inv.balance_due // fetchOutstandingBalances returns balance_due (snake_case)
            })));
        } catch (error) {
            console.error('Error fetching overdue invoices:', error);
            setOverdueInvoices([]);
        }
    };

    const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        // In Edit Mode, only due_date is meant to be editable here as per requirements.
        if (name === 'due_date' || (!isEditMode && name === 'invoice_date')) {
            setHeader(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleToggleBBF = (include: boolean) => {
        // This function is disabled in Edit Mode as per requirements
        if (isEditMode) return;
        
        setIncludeBBF(include);
        
        if (include && overdueInvoices.length > 0) {
            const invoiceNumbers = overdueInvoices.map(inv => inv.invoice_number).join(', ');
            
            setHeader(prev => ({ 
                ...prev, 
                broughtforward_description: `Invoices: ${invoiceNumbers}`
            }));
        } else {
            setHeader(prev => ({ 
                ...prev, 
                broughtforward_description: null
            }));
        }
    };

    const handleAddItem = () => {
        setLineItems(prev => [...prev, getNewDefaultLineItem()]);
    };

    const handleRemoveItem = (index: number) => {
        // In Edit Mode, removal is disabled as per requirements.
        if (isEditMode) {
             alert("Deletion of line items is not permitted in Edit Mode. You can only modify existing items or add new ones.");
             return;
        }
        setLineItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleLineItemChange = (index: number, e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        
        setLineItems(prev => {
            const newList = [...prev];
            const item = { ...newList[index] }; 
            newList[index] = item; 
            
            let numericValue = (name === 'quantity' || name === 'discount') ? parseInt(value) : parseFloat(value);
            
            if (name === 'selectedItemId') {
                // Find item by ID (unique identifier) to handle duplicate names correctly
                const selectedItem = masterItems.find(i => i.id === value);
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
                const finalValue = isNaN(numericValue) ? 0 : numericValue;
                (item as any)[name] = finalValue; 
            }

            item.lineTotal = calculateLineTotal(item);
            
            return newList;
        });
    };
    
    // --- SUBMISSION LOGIC (CRITICAL FIX APPLIED HERE) ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Prevent editing Forwarded invoices
        if (isForwarded) {
            alert("Forwarded invoices cannot be edited. This invoice has been brought forward to a new invoice.");
            return;
        }
        
        if (!header.admission_number) {
            alert("Please select a valid Student.");
            return;
        }
        
        // Safety check for line items.
        if (lineItems.filter(item => item.itemName).length === 0 && grandTotal === 0.00) {
             // Allow update if totals are zero
        } else if (lineItems.filter(item => item.itemName).length === 0) {
            alert("Please add at least one line item (or zero the totals) to the invoice.");
            return;
        }

        setIsSubmitting(true);
        
        try {
            // Filter line items: exclude invalid ones
            // Note: lineTotal is calculated server-side, but we keep it for type consistency
            const lineItemsPayload: InvoiceLineItem[] = lineItems
                .filter(item => item.itemName)
                .map(item => ({
                    ...item,
                    // Ensure lineTotal is included (will be recalculated server-side if needed)
                    lineTotal: item.lineTotal || (item.unitPrice * item.quantity * (1 - item.discount / 100))
                })); 
            
            let result: InvoiceHeader;

            if (isEditMode) {
                // 🎯 CRITICAL FIX: Destructure to OMIT the paymentMade field from the update payload.
                // This ensures the backend update does not touch the existing payment amount.
                const { paymentMade, ...headerFieldsForUpdate } = header; 
                
                // Construct the header payload, using the remaining fields + explicit updates
                const headerPayload = {
                    ...headerFieldsForUpdate, // Includes admission_number, name, status, etc.
                    // Explicitly update only the editable/calculated fields:
                    description: generalDescription,
                    due_date: header.due_date,
                    subtotal: lineItemsSubtotal,
                    totalAmount: grandTotal,
                    balanceDue: header.balanceDue, // Use the state-calculated value
                    broughtforward_description: header.broughtforward_description,
                    
                    // IMPORTANT: paymentMade is explicitly excluded here.
                    // NOTE: broughtforward_amount is not included - BBF is already in line items
                };

                // The submission data object for update
                const submissionData: InvoiceSubmissionData = {
                    header: headerPayload as InvoiceHeader, // Cast back to full type for the update service
                    line_items: lineItemsPayload,
                };
                
                // *** EDIT MODE: CALL THE UPDATE FUNCTION ***
                result = await updateInvoice(selectedInvoice!.invoice_number, submissionData);
                alert(`Invoice ${result.invoice_number} successfully UPDATED!`);

            } else {
                // *** CREATE MODE: CALL THE CREATE FUNCTION ***
                
                // Add BBF as a line item if enabled and there are overdue invoices
                let finalLineItems = [...lineItemsPayload];
                if (includeBBF && overdueInvoices.length > 0 && broughtForwardAmount > 0) {
                    // Find or auto-create "Balance Brought Forward" item
                    let bbfItem = masterItems.find(item => item.item_name === 'Balance Brought Forward');
                    
                    if (!bbfItem) {
                        // Create the BBF item in the database
                        console.log('🔧 [DEBUG] Creating system "Balance Brought Forward" item...');
                        const { data: newBbfItem, error: createError } = await supabase
                            .from('item_master')
                            .insert({
                                item_name: 'Balance Brought Forward',
                                current_unit_price: 0,
                                description: 'System-generated item for carrying forward previous balances'
                            })
                            .select()
                            .single();
                        
                        if (createError || !newBbfItem) {
                            throw new Error('Failed to create Balance Brought Forward item: ' + createError?.message);
                        }
                        
                        bbfItem = {
                            id: newBbfItem.id,
                            item_name: newBbfItem.item_name,
                            current_unit_price: parseFloat(newBbfItem.current_unit_price),
                            description: newBbfItem.description,
                            created_at: newBbfItem.created_at
                        };
                        
                        // Add to local masterItems so it's available for future use
                        setMasterItems(prev => [...prev, bbfItem!]);
                    }
                    
                    const invoiceNumbers = overdueInvoices.map(inv => inv.invoice_number).join(', ');
                    
                    // Add BBF line item (now using itemName directly)
                    finalLineItems.push({
                        itemName: 'Balance Brought Forward',
                        unitPrice: broughtForwardAmount,
                        quantity: 1,
                        discount: 0,
                        description: `Invoices: ${invoiceNumbers}`,
                        lineTotal: broughtForwardAmount
                    });
                }
                
                // Recalculate subtotal from finalLineItems (which includes BBF if enabled)
                // This ensures the backend gets the correct subtotal
                const finalSubtotal = finalLineItems.reduce((sum, item) => {
                    const discountFactor = 1 - ((item.discount || 0) / 100);
                    const lineTotal = (item.unitPrice || 0) * (item.quantity || 0) * discountFactor;
                    return sum + lineTotal;
                }, 0);
                
                // In create mode, we need all fields, including paymentMade (which should be 0)
                const submissionData: InvoiceSubmissionData = {
                    header: {
                        ...header,
                        description: generalDescription,
                        subtotal: parseFloat(finalSubtotal.toFixed(2)),
                        totalAmount: parseFloat(finalSubtotal.toFixed(2)), // Will be set to subtotal by trigger
                        // balanceDue is calculated by backend/trigger: totalAmount - paymentMade
                        // paymentMade: 0.00 (included from initial state)
                    },
                    line_items: finalLineItems,
                };

                result = await createInvoice(submissionData as InvoiceSubmissionData);
                
                // IMPORTANT: Mark the old invoices as 'Forwarded' if balance was brought forward
                // This ensures data integrity - the old invoices should not appear in outstanding balances
                if (includeBBF && overdueInvoices.length > 0 && broughtForwardAmount > 0) {
                    try {
                        const invoiceNumbersToForward = overdueInvoices.map(inv => inv.invoice_number);
                        await markInvoicesAsForwarded(invoiceNumbersToForward);
                        console.log(`✅ [DEBUG] Marked ${invoiceNumbersToForward.length} invoices as 'Forwarded'`);
                    } catch (forwardError: any) {
                        // Log the error but don't fail the entire operation
                        // The new invoice was created successfully, but the status update failed
                        console.error("⚠️ [WARNING] Failed to mark invoices as Forwarded:", forwardError);
                        alert(`Invoice created successfully, but failed to mark old invoices as 'Forwarded'. Please update them manually.\nError: ${forwardError.message}`);
                    }
                }
                
                alert(`Invoice successfully CREATED! Number: ${result.invoice_number}`);
            }
            
            onClose();

        } catch (error: any) {
            console.error("Invoice submission failed:", error);
            alert(`Submission Error: ${error.response?.data?.error || error.message || "Could not save the invoice. Check console for details."}`);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // --- Search Logic ---
    const filteredStudents = useMemo(() => {
        if (!searchQuery || loadingStudents) return allStudents;
        const query = searchQuery.toLowerCase();
        return allStudents.filter(student => 
            student.admission_number.toLowerCase().includes(query) ||
            student.name.toLowerCase().includes(query)
        );
    }, [allStudents, searchQuery, loadingStudents]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);
        if (!value || !value.includes(header.admission_number)) {
             setHeader(prev => ({ ...prev, admission_number: '', name: '', broughtforward_description: null }));
             setOverdueInvoices([]);
             setIncludeBBF(false);
        }
        setIsSearching(true);
    };

    const handleSearchInputFocus = () => {
        if (!header.admission_number && !isEditMode) {
            setIsSearching(true);
        }
    };

    const handleBlur = () => {
        setTimeout(() => setIsSearching(false), 200);
    };
    
    // Show a loading screen if we're in edit mode and line items are still fetching
    if (isEditMode && loadingLineItems) {
        return (
             <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                 <div className="bg-white rounded-lg p-10 shadow-xl">
                     <p className="text-lg font-medium text-gray-700">Loading invoice details...</p>
                     <div className="mt-4 flex justify-center">
                         <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                         </svg>
                     </div>
                 </div>
             </div>
        );
    }

    // Helper for reusable tab button styling
    const getTabClassName = (tabName: InvoiceFormTab) => 
        `px-4 py-2 text-sm font-medium transition-colors ${
             activeTab === tabName 
                 ? 'text-blue-600 border-b-2 border-blue-600' 
                 : 'text-gray-500 hover:text-blue-600'
        }`;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <style>
                {`
                    .scrollbar-hide::-webkit-scrollbar {
                        display: none;
                    }
                    .scrollbar-hide {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                `}
            </style>
            <div 
                ref={scrollContainerRef}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide"
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">
                        {isEditMode ? `Edit Invoice ${selectedInvoice!.invoice_number}` : 'Invoice Management'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        &times;
                    </button>
                </div>

                {/* Warning message for Forwarded invoices */}
                {isForwarded && (
                    <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800">
                                    Forwarded Invoice - Read Only
                                </h3>
                                <div className="mt-2 text-sm text-blue-700">
                                    <p>
                                        This invoice has been marked as "Forwarded" because its balance has been brought forward to a new invoice. 
                                        Forwarded invoices cannot be edited or deleted to maintain data integrity.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB NAVIGATION --- */}
                {/* 🎯 EDIT MODE: Hide/Disable other tabs */}
                <div className="flex border-b border-gray-200 mb-6 -mx-6 px-6 overflow-x-auto">
                    <button 
                        onClick={() => setActiveTab('Single Invoice')} 
                        className={getTabClassName('Single Invoice')}
                        disabled={isEditMode} // Cannot switch tabs in edit mode
                    >
                        {isEditMode ? 'Single Invoice (Editing)' : 'Single Invoice'}
                    </button>
                    {!isEditMode && (
                        <>
                            <button 
                                onClick={() => setActiveTab('Batch Creation')} 
                                className={getTabClassName('Batch Creation')}
                            >
                                Batch Creation
                            </button>
                            <button 
                                onClick={() => setActiveTab('Batch Export')} 
                                className={getTabClassName('Batch Export')}
                            >
                                Batch Export
                            </button>
                            <button 
                                onClick={() => setActiveTab('Invoice Items')} 
                                className={getTabClassName('Invoice Items')}
                            >
                                Invoice Items
                            </button>
                            <button 
                                onClick={() => setActiveTab('Invoice Details')} 
                                className={getTabClassName('Invoice Details')}
                            >
                                Invoice Details
                            </button>
                        </>
                    )}
                </div>

                {/* --- TAB CONTENT --- */}
                {activeTab === 'Single Invoice' && (
                    <form className="space-y-6" onSubmit={handleSubmit}>
                    
                        {/* --- HEADER FIELDS --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder={loadingStudents ? "Loading students..." : "Search by Name or Adm number"}
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        onFocus={handleSearchInputFocus}
                                        onBlur={handleBlur}
                                        className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        // 🎯 FIX: Disable search/input in edit mode or if Forwarded
                                        disabled={loadingStudents || isEditMode || isSubmitting || isForwarded}
                                    />
                                </div>
                                {/* Student Search Results are only shown if NOT in edit mode */}
                                {!isEditMode && isSearching && searchQuery.length > 0 && (
                                    <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                                        {filteredStudents.length > 0 ? (
                                            filteredStudents.map(student => (
                                                <li
                                                    key={student.admission_number}
                                                    onMouseDown={() => handleSelectStudent(student)}
                                                    className="p-3 cursor-pointer hover:bg-blue-50 flex justify-between items-center"
                                                >
                                                    <span className="font-medium text-gray-900">{student.name}</span>
                                                    <span className="text-sm text-gray-500">{student.admission_number}</span>
                                                </li>
                                            ))
                                        ) : (
                                            <li className="p-3 text-gray-500 italic">No students found matching "{searchQuery}".</li>
                                        )}
                                    </ul>
                                )}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                                <input
                                    type="date"
                                    name="invoice_date"
                                    value={header.invoice_date}
                                    onChange={handleHeaderChange}
                                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                                    // 🎯 FIX: Disable Invoice Date in edit mode or if Forwarded
                                    disabled={isEditMode || isSubmitting || isForwarded}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                <input
                                    type="date"
                                    name="due_date"
                                    value={header.due_date}
                                    onChange={handleHeaderChange}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={isSubmitting || isForwarded}
                                />
                            </div>
                            {isEditMode && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <input
                                        type="text"
                                        value={header.status}
                                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                                        disabled={true}
                                    />
                                </div>
                            )}
                        </div>
                        
                        {/* General Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                                type="text"
                                name="description"
                                placeholder="e.g., Q1 Term Fees"
                                value={generalDescription || ''}
                                onChange={(e) => setGeneralDescription(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={isSubmitting || isForwarded}
                            />
                        </div>
                        
                        {/* --- LINE ITEMS SECTION (REFACTORED) --- */}
                        <InvoiceFormLineItems
                            lineItems={lineItems}
                            masterItems={masterItems}
                            loadingItems={loadingItems || loadingLineItems} 
                            isSubmitting={isSubmitting}
                            lineItemsSubtotal={lineItemsSubtotal}
                            handleAddItem={handleAddItem}
                            handleRemoveItem={handleRemoveItem}
                            handleLineItemChange={handleLineItemChange}
                            calculateLineTotal={calculateLineTotal}
                            // 🎯 CRITICAL: Pass flag to disable line item deletion in Edit Mode or if Forwarded
                            isEditMode={isEditMode}
                            isForwarded={isForwarded}
                        />
                        
                        {/* --- BALANCE BROUGHT FORWARD SECTION (REFACTORED) --- */}
                        {/* 🎯 FIX: Disable this section completely in Edit Mode as per requirements */}
                        {!isEditMode && (
                            <InvoiceFormBalanceBF
                                header={header}
                                includeBBF={includeBBF}
                                onToggleBBF={handleToggleBBF}
                                isSubmitting={isSubmitting}
                                broughtForwardAmount={broughtForwardAmount}
                                overdueInvoiceCount={overdueInvoices.length}
                            />
                        )}

                        {/* --- FINAL TOTAL --- */}
                        <div className="border-t pt-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xl font-semibold text-gray-800">TOTAL INVOICE AMOUNT:</span>
                                <span className="text-2xl font-bold text-blue-600">
                                    {/* 🎯 CURRENCY FIX: Change $ to Ksh. */}
                                    Ksh.{(grandTotal).toFixed(2)}
                                </span>
                            </div>
                            {isEditMode && (
                                <div className="flex justify-between items-center text-sm pt-2 text-gray-600">
                                    <span>Payment Made:</span>
                                    {/* Displaying the existing paymentMade for context, but it's excluded from the update payload */}
                                    {/* 🎯 CURRENCY FIX: Change $ to Ksh. (and NaN fix ensures it's a number) */}
                                    <span className="font-medium">Ksh.{header.paymentMade.toFixed(2)}</span> 
                                </div>
                            )}
                            <div className="flex justify-between items-center text-sm pt-2 text-gray-600">
                                <span>Balance Due:</span>
                                {/* 🎯 CURRENCY FIX: Change $ to Ksh. (and NaN fix ensures it's a number) */}
                                <span className="font-medium">Ksh.{header.balanceDue.toFixed(2)}</span>
                            </div>
                        </div>
                        
                        {/* --- Action Buttons --- */}
                        <div className="flex justify-end space-x-3 pt-4">
                            <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50" disabled={isSubmitting}>
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                                disabled={!header.admission_number || lineItems.length === 0 || isSubmitting || loadingLineItems || isForwarded} 
                            >
                                {isSubmitting ? (isEditMode ? 'Saving Changes...' : 'Creating Invoice...') : 
                                loadingLineItems ? 'Loading Items...' :
                                isForwarded ? 'Cannot Edit Forwarded Invoice' :
                                (isEditMode ? 'Update Invoice' : 'Create Invoice')}
                            </button>
                        </div>
                    </form>
                )}
                
                {/* --- BATCH CREATION CONTENT --- */}
                {activeTab === 'Batch Creation' && (
                    <InvoiceBatchCreate 
                        masterItems={masterItems} 
                        loadingItems={loadingItems} 
                        allStudents={allStudents} 
                        loadingStudents={loadingStudents}
                        onClose={() => setActiveTab('Single Invoice')} 
                    />
                )}

                {/* --- BATCH EXPORT CONTENT --- */}
                {activeTab === 'Batch Export' && (
                    <InvoiceBatchExport
                        onClose={() => setActiveTab('Single Invoice')}
                    />
                )}

                {/* --- INVOICE ITEMS CONTENT --- */}
                {activeTab === 'Invoice Items' && (
                    <InvoiceItems
                        masterItems={masterItems}
                        setMasterItems={setMasterItems}
                        loadingItems={loadingItems}
                        onClose={onClose}
                    />
                )}

                {/* --- INVOICE DETAILS CONTENT --- */}
                {activeTab === 'Invoice Details' && (
                    <InvoiceDetails />
                )}
            </div>
        </div>
    );
};