// src/components/Financial/Invoices/InvoiceTable.tsx (READY TO PASTE)

import React, { useState } from 'react';
import { Edit, Loader2, Trash2 } from 'lucide-react';
import { InvoiceHeader } from '../../../types/database'; 
import { voidInvoice, voidInvoices } from '../../../services/financialService';
import { VoidReasonPopup } from '../VoidReasonPopup';
import { supabase } from '../../../supabaseClient';
import { InvoiceEditModal } from './InvoiceEditModal';

interface InvoiceTableProps {
    invoices: InvoiceHeader[]; 
    // NEW PROP: Function to trigger the full invoice display view
    onView: (invoice: InvoiceHeader) => void; 
    onDataMutation: () => void; 
}

// Helper function to map database status to a Tailwind CSS class (Keep existing code)
const getStatusClasses = (status: InvoiceHeader['status']) => {
    switch (status) {
        case 'Paid':
            return 'bg-green-100 text-green-800';
        case 'Pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'Overdue':
            return 'bg-red-100 text-red-800';
        case 'Forwarded':
            return 'bg-blue-100 text-blue-800';
        case 'Draft':
            return 'bg-gray-100 text-gray-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

// UPDATE: Added 'onView' and 'onDownload' props here
export const InvoiceTable: React.FC<InvoiceTableProps> = ({ invoices, onView, onDataMutation }) => {
    
    // Hover state tracking (borrowed from students masterlist)
    const [hoveredRow, setHoveredRow] = useState<string | null>(null);
    
    // Selection state (borrowed from students masterlist)
    const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
    
    // Loading state for deletions
    const [isDeleting, setIsDeleting] = useState(false);
    const [showVoidReasonPopup, setShowVoidReasonPopup] = useState(false);
    const [invoiceToVoid, setInvoiceToVoid] = useState<string | string[] | null>(null);

    const [invoiceToEdit, setInvoiceToEdit] = useState<InvoiceHeader | null>(null);
    
    // Get current user email for voided_by
    const getCurrentUserEmail = async (): Promise<string | undefined> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            return user?.email || undefined;
        } catch (error) {
            console.error('Error getting current user:', error);
            return undefined;
        }
    };
    
    // Toggle selection function (borrowed from students masterlist)
    const toggleSelection = (invoiceNumber: string) => {
        setSelectedInvoices(prev => {
            const newSet = new Set(prev);
            if (newSet.has(invoiceNumber)) {
                newSet.delete(invoiceNumber);
            } else {
                newSet.add(invoiceNumber);
            }
            return newSet;
        });
    };
    
    const hasSelections = selectedInvoices.size > 0;
    
    // --- Void Handler ---
    const handleVoid = (invoice: InvoiceHeader) => {
        setInvoiceToVoid(invoice.invoice_number);
        setShowVoidReasonPopup(true);
    };
    
    // --- Confirm Void Handler ---
    const handleConfirmVoid = async (reason: string) => {
        if (!invoiceToVoid) return;
        
        setIsDeleting(true);
        try {
            const voidedBy = await getCurrentUserEmail();
            const invoiceNumbers = Array.isArray(invoiceToVoid) ? invoiceToVoid : [invoiceToVoid];
            
            if (invoiceNumbers.length === 1) {
                await voidInvoice(invoiceNumbers[0], reason, voidedBy);
                alert(`Invoice ${invoiceNumbers[0]} voided successfully.`);
            } else {
                await voidInvoices(invoiceNumbers, reason, voidedBy);
                alert(`Successfully voided ${invoiceNumbers.length} invoice(s).`);
            }
            
            setSelectedInvoices(new Set());
            setShowVoidReasonPopup(false);
            setInvoiceToVoid(null);
            onDataMutation(); // Refresh the invoice list
        } catch (error: any) {
            console.error('Error voiding invoice(s):', error);
            alert(error.message || 'Failed to void invoice(s). Please try again.');
            setShowVoidReasonPopup(false);
            setInvoiceToVoid(null);
        } finally {
            setIsDeleting(false);
        }
    };
    
    // --- Void Selected Handler ---
    const handleVoidSelected = () => {
        const selectedArray = Array.from(selectedInvoices);
        if (selectedArray.length === 0) return;
        setInvoiceToVoid(selectedArray);
        setShowVoidReasonPopup(true);
    };
    
    return (
        <div className="relative">
            {/* Loading Overlay for Deletions */}
            {isDeleting && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 flex flex-col items-center space-y-4 shadow-xl">
                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                        <div className="text-center">
                            <p className="text-gray-900 text-lg font-medium">Deleting invoice(s)...</p>
                            <p className="text-gray-600 text-sm mt-2">This may take a moment while we remove all associated records.</p>
                        </div>
                    </div>
                </div>
            )}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Bulk Actions Bar (borrowed from students masterlist) */}
            {hasSelections && (
                <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-600">
                            {selectedInvoices.size} selected
                        </span>
                        <button
                            onClick={() => setSelectedInvoices(new Set(invoices.map(inv => inv.invoice_number)))}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Select All ({invoices.length})
                        </button>
                        <button
                            onClick={() => setSelectedInvoices(new Set())}
                            className="text-xs text-gray-600 hover:text-gray-700"
                        >
                            Clear
                        </button>
                    </div>
                    <button
                        onClick={handleVoidSelected}
                        className="text-xs text-red-600 hover:text-red-700 font-medium px-3 py-1 bg-red-50 hover:bg-red-100 rounded transition-colors"
                    >
                        Void Selected
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
                    <thead className="bg-gray-50">
                        <tr>
                            {/* Checkbox column header (borrowed from students masterlist) */}
                            <th className="pl-3 pr-2 py-3 text-left w-10">
                                {/* Empty header for checkbox column */}
                            </th>
                            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Invoice #
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Student
                            </th>
                            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Class
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Balance Due
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Due Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {invoices?.map((invoice) => (
                            <tr 
                                key={invoice.invoice_number} 
                                className="hover:bg-gray-50 transition-colors cursor-pointer"
                                onMouseEnter={() => setHoveredRow(invoice.invoice_number)}
                                onMouseLeave={() => setHoveredRow(null)}
                                onClick={() => onView(invoice)}
                            >
                                {/* Checkbox column (borrowed from students masterlist) */}
                                <td 
                                    className="pl-3 pr-2 py-4 whitespace-nowrap"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedInvoices.has(invoice.invoice_number)}
                                        onChange={() => toggleSelection(invoice.invoice_number)}
                                        className={`w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 transition-opacity cursor-pointer ${
                                            hoveredRow === invoice.invoice_number || hasSelections
                                                ? 'opacity-100'
                                                : 'opacity-0'
                                        }`}
                                    />
                                </td>
                                <td className="px-2 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{invoice.invoice_number}</div>
                                    <div className="text-sm text-gray-500">{invoice.description || '-'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <div className="text-sm font-medium text-gray-900">{invoice.name}</div>
                                    <div className="text-sm text-gray-500">Adm: {invoice.admission_number}</div>
                                </td>
                                <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {invoice.class_name || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    Ksh.{invoice.totalAmount.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    Ksh.{invoice.balanceDue.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusClasses(invoice.status)}`}>
                                        {invoice.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {invoice.due_date}
                                </td>
                                <td 
                                    className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="flex space-x-3 items-center">
                                        <button
                                            onClick={() => {
                                                if (invoice.status === 'Forwarded') return;
                                                setInvoiceToEdit(invoice);
                                            }}
                                            disabled={isDeleting || invoice.status === 'Forwarded'}
                                            className={`transition-colors ${
                                                isDeleting || invoice.status === 'Forwarded'
                                                    ? 'text-green-300 cursor-not-allowed'
                                                    : 'text-green-600 hover:text-green-700'
                                            }`}
                                            title={invoice.status === 'Forwarded' ? 'Forwarded invoices cannot be edited' : 'Edit Invoice'}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleVoid(invoice)}
                                            disabled={isDeleting}
                                            className={`transition-colors ${
                                                isDeleting
                                                    ? 'text-red-400 cursor-not-allowed'
                                                    : 'text-red-600 hover:text-red-700'
                                            }`}
                                            title="Void Invoice"
                                        >
                                            {isDeleting && invoiceToVoid === invoice.invoice_number ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
        {showVoidReasonPopup && invoiceToVoid && (
            <VoidReasonPopup
                onClose={() => {
                    setShowVoidReasonPopup(false);
                    setInvoiceToVoid(null);
                }}
                onConfirm={handleConfirmVoid}
                expenseCount={Array.isArray(invoiceToVoid) ? invoiceToVoid.length : 1}
                recordType="invoice"
            />
        )}

        {invoiceToEdit && (
            <InvoiceEditModal
                invoice={invoiceToEdit}
                onClose={() => setInvoiceToEdit(null)}
                onSaved={onDataMutation}
            />
        )}
    </div>
    );
};

export default InvoiceTable;