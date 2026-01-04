// src/components/Financial/Invoices/InvoiceSummary.tsx
import React from 'react';
import { AlertCircle, CheckCircle, Clock, HandCoins } from 'lucide-react';
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
    
    // Calculate Paid as the total amount already paid across all non-forwarded invoices.
    // NOTE: Using paymentMade is more reliable than deriving from balanceDue, in case balanceDue is stale.
    const paidTotal = nonForwardedInvoices.reduce((sum, invoice) => {
        const paidPortion = Math.min(Math.max(0, invoice.paymentMade || 0), invoice.totalAmount || 0);
        return sum + paidPortion;
    }, 0);
    
    // Calculate Overdue - sum of balanceDue for Overdue invoices (excluding Forwarded)
    const overdueTotal = nonForwardedInvoices
        .filter(i => i.status === 'Overdue')
        .reduce((sum, invoice) => sum + invoice.balanceDue, 0);

    // Format currency helper - returns just the formatted number
    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    if (import.meta.env.DEV) {
        const mismatch = nonForwardedInvoices.filter((inv) => {
            const byBalance = (inv.totalAmount || 0) - (inv.balanceDue || 0);
            const byPayment = inv.paymentMade || 0;
            return Math.abs(byBalance - byPayment) > 0.01;
        });

        const statusTotals = nonForwardedInvoices.reduce((acc: Record<string, number>, inv) => {
            const key = inv.status || 'Unknown';
            acc[key] = (acc[key] || 0) + (inv.totalAmount || 0);
            return acc;
        }, {});

        console.log('[InvoiceSummary] Totals', {
            totalReceivables,
            outstandingFees,
            overdueTotal,
            paidTotal,
            statusTotals,
            mismatchCount: mismatch.length,
        });

        if (mismatch.length > 0) {
            console.log('[InvoiceSummary] Invoices with paymentMade != (totalAmount - balanceDue)', mismatch);
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-3 mb-6 md:mb-3">
            <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                    <HandCoins className="w-8 h-8 text-blue-600 mr-3" />
                    <div>
                        <div className="text-sm text-gray-600">Total Receivables</div>
                        <div className="text-2xl font-bold text-blue-600">Ksh {formatCurrency(totalReceivables)}</div>
                    </div>
                </div>
            </div>
            <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                    <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                    <div>
                        <div className="text-sm text-gray-600">Paid</div>
                        <div className="text-2xl font-bold text-green-600">Ksh {formatCurrency(paidTotal)}</div>
                    </div>
                </div>
            </div>
            <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                    <Clock className="w-8 h-8 text-yellow-600 mr-3" />
                    <div>
                        <div className="text-sm text-gray-600">Outstanding Fees</div>
                        <div className="text-2xl font-bold text-yellow-600">Ksh {formatCurrency(outstandingFees)}</div>
                    </div>
                </div>
            </div>
            <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                    <AlertCircle className="w-8 h-8 text-red-600 mr-3" />
                    <div>
                        <div className="text-sm text-gray-600">Overdue</div>
                        <div className="text-2xl font-bold text-[#1f2937]">Ksh {formatCurrency(overdueTotal)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceSummary;