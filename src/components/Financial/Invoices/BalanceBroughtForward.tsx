// src/components/Financial/Invoices/BalanceBroughtForward.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../supabaseClient';
import { AlertTriangle, Loader2, Save } from 'lucide-react';

// Define the shape of the data this component will pass back to the parent
export interface BalanceBroughtForwardData {
    // Master switch: Should we attempt to include BBF?
    includeBalance: boolean;
    // ID of the ItemMaster used for the 'Balance Brought Forward' line item
    bbfItemMasterId: string;
    // New state to indicate if this section's save/transfer is complete.
    isSaved: boolean;
}

// Interface for an overdue invoice (Outstanding Balance)
interface OutstandingInvoice {
    // We use the unique 'invoice_number' as the primary key reference (PK)
    invoice_pk: string;
    student_name: string;
    admission_number: string;
    invoice_number: string;
    invoice_description: string;
    balance_due: number; // Assuming this is the field representing the outstanding amount
}

// Interface for selected students from parent (e.g., from CustomLineItems' fetch)
interface SelectedStudent {
    student_name: string;
    admission_number: string;
}

interface BalanceBroughtForwardProps {
    // State and setter from the parent (InvoiceBatchCreate)
    bbfData: BalanceBroughtForwardData;
    setBbfData: (data: BalanceBroughtForwardData) => void;
    // Contextual props
    selectedStudentCount: number;
    isSubmitting: boolean;
    // New prop: List of selected students (with their admission numbers)
    selectedStudents: SelectedStudent[];
    // New prop: Function to notify parent component that this section is completed/saved
    onSaveSuccess: () => void;
}

export const BalanceBroughtForward: React.FC<BalanceBroughtForwardProps> = ({
    bbfData,
    setBbfData,
    selectedStudentCount,
    selectedStudents = [],
    isSubmitting,
    onSaveSuccess,
}) => {
    const [outstandingInvoices, setOutstandingInvoices] = useState<OutstandingInvoice[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const formatCurrency = (amount: number) => {
        // NOTE: Keeping currency as Ksh based on previous logs/context
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'Ksh' }).format(amount);
    };

    const totalOutstandingBalance = useMemo(() => {
        if (!outstandingInvoices) return 0;
        return outstandingInvoices.reduce((sum, item) => sum + item.balance_due, 0);
    }, [outstandingInvoices]);

    // 1. Fetch Outstanding Balances
    const fetchOutstandingBalances = useCallback(async () => {
        const currentAdmissionNumbers = selectedStudents.map(s => s.admission_number);

        console.log('💡 [BBF DEBUG] fetchOutstandingBalances running.');
        console.log('🔍 [BBF DEBUG] Current State Check: includeBalance:', bbfData.includeBalance, '| Students selected:', currentAdmissionNumbers.length, '| isSaved:', bbfData.isSaved);

        if (!bbfData.includeBalance || currentAdmissionNumbers.length === 0 || bbfData.isSaved) {
            console.log('🛑 [BBF DEBUG] Fetch ABORTED: Condition not met.');
            setOutstandingInvoices(null);
            setError(null);
            return;
        }

        setIsLoading(true);
        setError(null);
        
        console.log('🔢 [BBF DEBUG] Students being queried:', currentAdmissionNumbers);

        try {
            let supabaseQuery = supabase
                .from('invoices')
                // 💥 CRITICAL FIX: Use Supabase aliasing format (e.g., nameasstudent_name)
                // AND replace non-existent 'id' with 'invoice_number'
                .select('invoice_number, nameasstudent_name, admission_number, descriptionasinvoice_description, balance_due');
                
            // Using .in for admission numbers
            supabaseQuery = supabaseQuery.in('admission_number', currentAdmissionNumbers);
            
            // Filter for both 'Overdue' and 'Pending' statuses
            supabaseQuery = supabaseQuery.in('status', ['Overdue', 'Pending']);
            
            console.log('✅ [BBF DEBUG] Query Filter: status IN (Overdue, Pending)');
            
            const { data, error: fetchError } = await supabaseQuery;

            if (fetchError) {
                console.error('❌ [BBF DEBUG] Error fetching outstanding balances:', fetchError);
                setError(`Failed to load outstanding balances. Server said: ${fetchError.message} (Code: ${fetchError.code})`);
                setOutstandingInvoices([]);
            } else if (data) {
                console.log('📤 [BBF DEBUG] Raw Data received:', data);

                // Map the data using the *aliased* names from the query
                const mappedData: OutstandingInvoice[] = (data as any[]).map(invoice => ({
                    // 💥 FIX: Use invoice_number as the PK reference
                    invoice_pk: invoice.invoice_number, 
                    // Use the aliased names for mapping
                    student_name: (invoice as any).student_name, 
                    admission_number: invoice.admission_number,
                    invoice_number: invoice.invoice_number,
                    invoice_description: (invoice as any).invoice_description || 'Outstanding Balance', 
                    balance_due: invoice.balance_due || 0,
                }));
                
                // Filter out any results where balance_due might be 0 or null after mapping.
                const finalInvoices = mappedData.filter(inv => inv.balance_due > 0);
                
                console.log(`🎉 [BBF DEBUG] Final Mapped Invoices (Count: ${finalInvoices.length}):`, finalInvoices);

                setOutstandingInvoices(finalInvoices);
            }
        } catch(e: any) {
            console.error('💣 [BBF DEBUG] Unexpected fetch error in try/catch:', e);
            setError(`An unexpected error occurred during balance fetch: ${e.message}`);
            setOutstandingInvoices([]);
        }

        setIsLoading(false);
    }, [bbfData.includeBalance, bbfData.isSaved, selectedStudents]);

    useEffect(() => {
        fetchOutstandingBalances();
    }, [fetchOutstandingBalances]);

    // 2. Toggling the Checkbox
    const handleToggle = (checked: boolean) => {
        console.log(`💡 [BBF DEBUG] Toggle change: includeBalance set to ${checked}`);
        
        // Clear data and reset saved status when unchecking
        if (!checked) {
            setOutstandingInvoices(null);
            setError(null);
            setShowConfirm(false);
            // CRITICAL CHANGE: Reset isSaved in the parent state when unchecking
            setBbfData({ ...bbfData, includeBalance: checked, isSaved: false });
            return;
        }

        // Only update includeBalance when checking, which will trigger the useEffect to fetch.
        setBbfData({
            ...bbfData,
            includeBalance: checked,
        });
    };

    // 3. Save Logic (Transfer and Delete)
    const handleSave = async () => {
        if (!outstandingInvoices || outstandingInvoices.length === 0) return;
        
        // Safety check for bbfItemMasterId (as per your interface)
        if (!bbfData.bbfItemMasterId) {
             setError('Cannot save: Balance Brought Forward Item Master ID is missing. Ensure it is set in the parent state.');
             setShowConfirm(false);
             return;
        }
        
        setIsSaving(true);
        setError(null);
        setShowConfirm(false);

        // a. Prepare data for insertion into balance_brought_forward
        const transferData = outstandingInvoices.map(invoice => ({
            student_name: invoice.student_name,
            admission_number: invoice.admission_number,
            invoice_number: invoice.invoice_number,
            invoice_description: invoice.invoice_description,
            balance_due: invoice.balance_due,
            // Use the item master ID from the parent state (bbfData)
            item_master_id: bbfData.bbfItemMasterId, 
            date_transferred: new Date().toISOString(),
        }));
        
        console.log(`💾 [BBF DEBUG] Attempting to SAVE/TRANSFER ${transferData.length} records.`);


        // b. Insert into balance_brought_forward table
        const { error: insertError } = await supabase
            .from('balance_brought_forward')
            .insert(transferData);

        if (insertError) {
            console.error('❌ [BBF DEBUG] INSERT Error:', insertError);
            setError('Failed to transfer balances. Aborting deletion.');
            setIsSaving(false);
            return;
        }

        // c. Delete from invoices table
        // 💥 FIX: Use the 'invoice_pk' (which is the invoice_number) and target the 'invoice_number' column for deletion.
        const invoicePksToDelete = outstandingInvoices.map(inv => inv.invoice_pk);
        
        console.log(`🗑️ [BBF DEBUG] Transfer SUCCESSFUL. Attempting to DELETE ${invoicePksToDelete.length} invoices. IDs:`, invoicePksToDelete);

        const { error: deleteError } = await supabase
            .from('invoices')
            .delete()
            .in('invoice_number', invoicePksToDelete); // 💥 FIX: Use 'invoice_number' column for delete

        if (deleteError) {
            console.error('❌ [BBF DEBUG] DELETE Error:', deleteError);
            setError('Balances transferred, but failed to delete original invoices.');
            // Crucial: Despite the delete error, we mark as saved because transfer succeeded.
             setBbfData({ ...bbfData, isSaved: true, includeBalance: true });
        } else {
            console.log('✔️ [BBF DEBUG] DELETE SUCCESSFUL.');
            // Success: update parent state and component state
            setBbfData({ ...bbfData, isSaved: true, includeBalance: true });
            onSaveSuccess(); // Notify parent component
        }
        
        setIsSaving(false);
    };

    // Conditional Rendering of Save Button
    const showSaveButton = bbfData.includeBalance && !bbfData.isSaved;
    // Added check for bbfItemMasterId to disable the button if the required ID isn't set.
    const saveButtonDisabled = isSaving || isLoading || outstandingInvoices === null || outstandingInvoices.length === 0 || !bbfData.bbfItemMasterId; 

    // Confirmation Dialog Component
    const ConfirmationDialog = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                <h5 className="text-lg font-bold text-red-700 mb-4 flex items-center">
                     <AlertTriangle className="mr-2 h-5 w-5" /> Permanent Action Required
                </h5>
                <p className="mb-6 text-gray-700">
                    You are about to **PERMANENTLY DELETE** {outstandingInvoices?.length || 0} overdue invoice(s) from the `invoices` table and transfer them to the `balance_brought_forward` table.
                </p>
                 <p className="mb-6 text-gray-700 font-semibold">
                    Total balance being transferred: **{formatCurrency(totalOutstandingBalance)}**.
                </p>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={() => setShowConfirm(false)}
                        className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300 transition flex items-center"
                        disabled={isSaving}
                    >
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSaving ? 'Transferring...' : 'Confirm and Delete Invoices'}
                    </button>
                </div>
            </div>
        </div>
    );

    // Conditional content for the main area
    const content = bbfData.includeBalance ? (
        bbfData.isSaved ? (
            <p className="text-sm text-green-700 font-bold border-t pt-2 flex items-center">
                ✅ Balances successfully saved and moved to brought-forward ledger.
            </p>
        ) : (
            isLoading ? (
                <p className="text-sm text-yellow-700 italic border-t pt-2 flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading outstanding balances...
                </p>
            ) : error ? (
                <p className="text-sm text-red-600 font-bold border-t pt-2 flex items-center">
                    <AlertTriangle className="mr-2 h-4 w-4" /> Error: {error}
                </p>
            ) : outstandingInvoices && outstandingInvoices.length > 0 ? (
                <>
                    <p className="text-sm text-yellow-700 italic pt-2">
                        Preview of **{outstandingInvoices.length}** outstanding invoices for the selected students:
                    </p>
                    <div className="overflow-x-auto border rounded-lg max-h-60">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adm. No.</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice No.</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance Due</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {outstandingInvoices.map((inv) => (
                                    <tr key={inv.invoice_pk} className="hover:bg-yellow-50">
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{inv.student_name}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{inv.admission_number}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{inv.invoice_number}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">{inv.invoice_description}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-right text-red-600">
                                            {formatCurrency(inv.balance_due)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <p className="text-sm text-yellow-700 italic border-t pt-2">
                    No outstanding balances found for the {selectedStudentCount} selected students.
                </p>
            )
        )
    ) : (
        <p className="text-sm text-yellow-700 italic border-t pt-2">
            This will automatically add a line item for the current outstanding balance to each of the {selectedStudentCount} selected students who have one.
        </p>
    );
    

    return (
        <div className="p-4 border border-yellow-300 rounded-lg bg-yellow-50 shadow-sm space-y-3">
            <h4 className="text-xl font-semibold text-yellow-800">
                Balances Brought Forward
            </h4>

            <div className="flex items-center space-x-6 justify-between">
                <div className="flex items-center">
                    <input
                        id="include-balance"
                        type="checkbox"
                        checked={bbfData.includeBalance}
                        onChange={(e) => handleToggle(e.target.checked)}
                        className="h-5 w-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500 disabled:opacity-50 cursor-pointer"
                        disabled={isSubmitting || bbfData.isSaved} // Prevent changes after saving
                    />
                    <label htmlFor="include-balance" className="ml-3 block text-base font-medium text-gray-700">
                        Include Outstanding Balances?
                    </label>
                </div>

                {/* Save button appears only when checked and not yet saved */}
                {showSaveButton && (
                    <button
                        onClick={() => setShowConfirm(true)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition 
                            ${saveButtonDisabled
                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                        disabled={saveButtonDisabled}
                        title={!bbfData.bbfItemMasterId ? "Item Master ID is required for transfer. Ensure parent component sets it." : "Save Balances"}
                    >
                         <Save className="mr-2 h-4 w-4" />
                        {isSaving ? 'Saving...' : 'Save Balances'}
                    </button>
                )}
            </div>

            {/* Display the preview or standard text */}
            {content}

            {/* Confirmation Dialog */}
            {showConfirm && <ConfirmationDialog />}
        </div>
    );
};