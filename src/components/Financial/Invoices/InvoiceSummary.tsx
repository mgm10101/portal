// src/components/Financial/Invoices/InvoiceSummary.tsx
import React from 'react';
// FIX: Import the correct InvoiceHeader type from the database types file
import { InvoiceHeader } from '../../../types/database'; 
// REMOVED: import { InvoiceData } from './index';

interface InvoiceSummaryProps {
    // FIX: Use InvoiceHeader instead of InvoiceData
    invoices: InvoiceHeader[];
}

export const InvoiceSummary: React.FC<InvoiceSummaryProps> = ({ invoices }) => {
    // The filter logic remains correct based on the InvoiceHeader status literal types
    const totalCount = invoices.length;
    const paidCount = invoices.filter(i => i.status === 'Paid').length;
    const pendingCount = invoices.filter(i => i.status === 'Pending').length;
    const overdueCount = invoices.filter(i => i.status === 'Overdue').length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Total Invoices</div>
                <div className="text-2xl font-bold text-gray-800">{totalCount}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Paid</div>
                <div className="text-2xl font-bold text-green-600">{paidCount}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Pending</div>
                <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Overdue</div>
                <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
            </div>
        </div>
    );
};

export default InvoiceSummary;