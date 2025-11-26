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
    // Exclude Forwarded invoices from all calculations
    const nonForwardedInvoices = invoices.filter(i => i.status !== 'Forwarded');
    
    // Calculate Total Receivables as sum of all non-forwarded invoices' totalAmount
    const totalReceivables = nonForwardedInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    
    // Calculate Outstanding Fees (formerly Pending) - sum of balanceDue for Pending invoices (excluding Forwarded)
    const outstandingFees = nonForwardedInvoices
        .filter(i => i.status === 'Pending')
        .reduce((sum, invoice) => sum + invoice.balanceDue, 0);
    
    // Calculate Paid as Total Receivables - Outstanding Fees
    const paidTotal = totalReceivables - outstandingFees;
    
    // Calculate Overdue - sum of balanceDue for Overdue invoices (excluding Forwarded)
    const overdueTotal = nonForwardedInvoices
        .filter(i => i.status === 'Overdue')
        .reduce((sum, invoice) => sum + invoice.balanceDue, 0);

    // Format currency helper - returns just the formatted number
    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Total Receivables</div>
                <div className="text-2xl font-normal text-gray-800">
                    Ksh {formatCurrency(totalReceivables)}
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Paid</div>
                <div className="text-2xl font-normal text-green-600">
                    Ksh {formatCurrency(paidTotal)}
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Outstanding Fees</div>
                <div className="text-2xl font-normal text-yellow-600">
                    Ksh {formatCurrency(outstandingFees)}
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Overdue</div>
                <div className="text-2xl font-normal text-red-600">
                    Ksh {formatCurrency(overdueTotal)}
                </div>
            </div>
        </div>
    );
};

export default InvoiceSummary;