// src/components/Financial/Invoices/InvoiceFormBalanceBF.tsx

import React from 'react';
import { Info } from 'lucide-react';
import { InvoiceHeader } from '../../../types/database';

interface InvoiceFormBalanceBFProps {
    header: InvoiceHeader;
    includeBBF: boolean;
    onToggleBBF: (include: boolean) => void;
    isSubmitting: boolean;
    broughtForwardAmount: number;
    overdueInvoiceCount: number;
}

export const InvoiceFormBalanceBF: React.FC<InvoiceFormBalanceBFProps> = ({
    header,
    includeBBF,
    onToggleBBF,
    isSubmitting,
    broughtForwardAmount,
    overdueInvoiceCount,
}) => {
    const isStudentSelected = !!header.admission_number;

    return (
        <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Balance Brought Forward</h3>
            
            <div className="flex items-start text-sm text-blue-600 bg-blue-50 p-2 rounded mb-4">
                <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>
                    Automatically include outstanding balances from previous overdue invoices. 
                    The system will add them as a single line item with invoice numbers in the description.
                </span>
            </div>

            <div className="flex items-center space-x-3 mb-4">
                <input
                    type="checkbox"
                    id="bbf-toggle-single"
                    checked={includeBBF}
                    onChange={(e) => onToggleBBF(e.target.checked)}
                    disabled={!isStudentSelected || isSubmitting}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <label 
                    htmlFor="bbf-toggle-single" 
                    className={`text-base font-medium ${!isStudentSelected ? 'text-gray-400' : 'text-gray-800'} cursor-pointer`}
                >
                    Include Balance Brought Forward
                </label>
            </div>

            {!isStudentSelected && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600">
                        Select a student first to check for overdue invoices.
                    </p>
                </div>
            )}

            {isStudentSelected && includeBBF && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    {overdueInvoiceCount > 0 ? (
                        <>
                            <p className="text-sm text-green-800 font-medium mb-2">
                                ✓ Balance Brought Forward Enabled
                            </p>
                            <div className="text-sm text-green-700 space-y-1">
                                <p><strong>Overdue Invoices:</strong> {overdueInvoiceCount}</p>
                                <p><strong>Total Amount:</strong> Ksh.{broughtForwardAmount.toFixed(2)}</p>
                                <p className="mt-2 text-xs">
                                    This will be added as a line item: "Balance Brought Forward" with invoice numbers in the description.
                                </p>
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-green-700">
                            No overdue invoices found for this student. Balance Brought Forward will not be added.
                        </p>
                    )}
                </div>
            )}

            {isStudentSelected && !includeBBF && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600">
                        BBF is currently disabled. Check the box above to include outstanding balances.
                    </p>
                </div>
            )}
        </div>
    );
};
