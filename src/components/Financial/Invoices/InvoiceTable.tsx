// src/components/Financial/Invoices/InvoiceTable.tsx (READY TO PASTE)

import React from 'react';
import { Eye, Download, Edit, Trash2 } from 'lucide-react';
import { InvoiceHeader } from '../../../types/database'; 

interface InvoiceTableProps {
    invoices: InvoiceHeader[]; 
    onEdit: (invoice: InvoiceHeader) => void;
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
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

// UPDATE: Added 'onView' prop here
export const InvoiceTable: React.FC<InvoiceTableProps> = ({ invoices, onEdit, onView, onDataMutation }) => {
    
    // --- Example Delete Handler (Conceptual) ---
    const handleDelete = async (invoice: InvoiceHeader) => {
        if (!window.confirm(`Are you sure you want to delete invoice ${invoice.invoice_number}?`)) return;
        // ... (Database DELETE operation)
        onDataMutation(); 
    };
    // -------------------------------------------
    
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Invoice #
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Student
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount (Balance)
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
                            <tr key={invoice.invoice_number} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">{invoice.invoice_number}</div>
                                        <div className="text-sm text-gray-500">Adm: {invoice.admission_number}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {/* --- UPDATED: Display Student Name and Class Name --- */}
                                    <div className="text-sm font-medium text-gray-900">{invoice.name}</div>
                                    {invoice.class_name && (
                                        <div className="text-sm text-gray-500">Class: {invoice.class_name}</div>
                                    )}
                                    {/* ----------------------------------------------------- */}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        {/* FIX: Changed from invoice.total_amount to invoice.totalAmount */}
                                        <div className="text-sm font-medium text-gray-900">Ksh.{invoice.totalAmount.toFixed(2)}</div>
                                        {/* FIX: Changed from invoice.balance_due to invoice.balanceDue */}
                                        {invoice.balanceDue > 0 && (
                                            <div className="text-sm text-red-600">Balance: Ksh.{invoice.balanceDue.toFixed(2)}</div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusClasses(invoice.status)}`}>
                                        {invoice.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {invoice.due_date}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex space-x-2">
                                        <button 
                                            onClick={() => onView(invoice)} // CALLS THE NEW VIEW HANDLER
                                            className="text-blue-600 hover:text-blue-700" 
                                            title="View"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button className="text-green-600 hover:text-green-700" title="Download PDF">
                                            <Download className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => onEdit(invoice)}
                                            className="text-orange-600 hover:text-orange-700" 
                                            title="Edit"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(invoice)}
                                            className="text-red-600 hover:text-red-700" 
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
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