// src/components/Financial/Invoices/InvoiceTable.tsx (READY TO PASTE)

import React, { useState } from 'react';
import { Download, Edit, Trash2 } from 'lucide-react'; // Keep imports for potential future use
import { InvoiceHeader } from '../../../types/database'; 
import { deleteInvoice } from '../../../services/financialService';

interface InvoiceTableProps {
    invoices: InvoiceHeader[]; 
    onEdit: (invoice: InvoiceHeader) => void;
    // NEW PROP: Function to trigger the full invoice display view
    onView: (invoice: InvoiceHeader) => void; 
    // NEW PROP: Function to download invoice as PDF
    onDownload: (invoice: InvoiceHeader) => Promise<void>;
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
export const InvoiceTable: React.FC<InvoiceTableProps> = ({ invoices, onEdit, onView, onDownload, onDataMutation }) => {
    
    // Hover state tracking (borrowed from students masterlist)
    const [hoveredRow, setHoveredRow] = useState<string | null>(null);
    
    // Selection state (borrowed from students masterlist)
    const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
    
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
    
    // --- Delete Handler ---
    const handleDelete = async (invoice: InvoiceHeader) => {
        if (!window.confirm(`Are you sure you want to delete invoice ${invoice.invoice_number}? This action cannot be undone.`)) {
            return;
        }
        
        try {
            await deleteInvoice(invoice.invoice_number);
            alert(`Invoice ${invoice.invoice_number} deleted successfully.`);
            onDataMutation(); // Refresh the invoice list
        } catch (error) {
            console.error('Error deleting invoice:', error);
            alert(`Failed to delete invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    // --- Void Handler ---
    const handleVoid = async (invoice: InvoiceHeader) => {
        if (!window.confirm(`Are you sure you want to void invoice ${invoice.invoice_number}? This action cannot be undone.`)) {
            return;
        }
        
        try {
            await deleteInvoice(invoice.invoice_number);
            alert(`Invoice ${invoice.invoice_number} voided successfully.`);
            onDataMutation(); // Refresh the invoice list
        } catch (error) {
            console.error('Error voiding invoice:', error);
            alert(`Failed to void invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };
    
    // --- Void Selected Handler (Optimized with parallel deletion) ---
    const handleVoidSelected = async () => {
        const selectedArray = Array.from(selectedInvoices);
        if (selectedArray.length === 0) return;
        
        const confirmMessage = `Are you sure you want to void ${selectedArray.length} invoice(s)? This action cannot be undone.`;
        if (!window.confirm(confirmMessage)) {
            return;
        }
        
        // Use Promise.allSettled to void all invoices in parallel for better performance
        const voidPromises = selectedArray.map(invoiceNumber => 
            deleteInvoice(invoiceNumber)
                .then(() => ({ invoiceNumber, success: true as const }))
                .catch((error) => {
                    console.error(`Error voiding invoice ${invoiceNumber}:`, error);
                    return { invoiceNumber, success: false as const, error };
                })
        );
        
        const results = await Promise.all(voidPromises);
        
        let successCount = 0;
        let failCount = 0;
        const failedInvoices: string[] = [];
        
        results.forEach((result) => {
            if (result.success) {
                successCount++;
            } else {
                failCount++;
                failedInvoices.push(result.invoiceNumber);
            }
        });
        
        if (failCount > 0) {
            alert(`Voided ${successCount} invoice(s) successfully. Failed to void ${failCount} invoice(s): ${failedInvoices.join(', ')}`);
        } else {
            alert(`Successfully voided ${successCount} invoice(s).`);
        }
        
        setSelectedInvoices(new Set());
        onDataMutation(); // Refresh the invoice list
    };
    
    // --- Download Handler ---
    const handleDownload = async (invoice: InvoiceHeader) => {
        try {
            await onDownload(invoice);
        } catch (error) {
            console.error('Error downloading invoice:', error);
            alert(`Failed to download invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };
    
    return (
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
                                    {invoice.balanceDue > 0 ? (
                                        <span className="text-red-600">Ksh.{invoice.balanceDue.toFixed(2)}</span>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
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
                                    <button
                                        onClick={() => handleVoid(invoice)}
                                        className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-300 rounded-lg transition-colors"
                                        title="Void Invoice"
                                    >
                                        Void
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InvoiceTable;