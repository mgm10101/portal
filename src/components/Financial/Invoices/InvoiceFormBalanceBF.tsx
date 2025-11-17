// src/components/Financial/Invoices/InvoiceFormBalanceBF.tsx

import React from 'react';
import { InvoiceHeader } from '../../../types/database';

interface OverdueInvoice {
    invoice_number: string;
    balanceDue: number;
}

interface InvoiceFormBalanceBFProps {
    header: InvoiceHeader;
    overdueInvoices: OverdueInvoice[];
    isSubmitting: boolean;
    handleBFSelect: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    broughtForwardAmount: number;
}

export const InvoiceFormBalanceBF: React.FC<InvoiceFormBalanceBFProps> = ({
    header,
    overdueInvoices,
    isSubmitting,
    handleBFSelect,
    broughtForwardAmount,
}) => {
    const isStudentSelected = !!header.admission_number;
    const isDisabled = !isStudentSelected || overdueInvoices.length === 0 || isSubmitting;

    return (
        <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Balance Brought Forward</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Overdue Invoices</label>
                    <select
                        onChange={handleBFSelect}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                        disabled={isDisabled}
                        // Set the value based on header.broughtforward_description to sync the dropdown
                        value={
                            header.broughtforward_description?.startsWith('Balance from')
                                ? header.broughtforward_description.replace('Balance from ', '') // Individual selection
                                : '' // Total selection or default
                        }
                    >
                        {overdueInvoices.length === 0 ? (
                            <option value="">
                                {isStudentSelected ? 'No overdue invoices to carry forward' : 'Select a student first'}
                            </option>
                        ) : (
                            <>
                                <option value="">
                                    Include all {overdueInvoices.length} outstanding invoices
                                </option>
                                {overdueInvoices.map((inv) => (
                                    <option key={inv.invoice_number} value={inv.invoice_number}>
                                        {inv.invoice_number} (Due: Ksh.{inv.balanceDue.toFixed(2)})
                                    </option>
                                ))}
                            </>
                        )}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Balance Due</label>
                    <input
                        type="text"
                        value={`Ksh.${broughtForwardAmount.toFixed(2)}`}
                        disabled
                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 font-semibold text-gray-700 text-right"
                    />
                </div>
            </div>
        </div>
    );
};