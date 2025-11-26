// src/components/Financial/Invoices/BalanceBroughtForward.tsx

import React from 'react';
import { Info } from 'lucide-react';

// Define the shape of the data this component will pass back to the parent
export interface BalanceBroughtForwardData {
    includeBalance: boolean;
    bbfItemMasterId?: string; // Optional for backward compatibility
}

interface BalanceBroughtForwardProps {
    bbfData: BalanceBroughtForwardData;
    setBbfData: (data: BalanceBroughtForwardData) => void;
    selectedStudentCount: number;
    isSubmitting: boolean;
    masterItems?: any[]; // Optional for backward compatibility
    selectedStudents?: any[]; // Optional for backward compatibility
    onSaveSuccess?: () => void; // Optional for backward compatibility
}

export const BalanceBroughtForward: React.FC<BalanceBroughtForwardProps> = ({
    bbfData,
    setBbfData,
    selectedStudentCount,
    isSubmitting,
}) => {
    
    const handleToggle = (checked: boolean) => {
        setBbfData({
            ...bbfData,
            includeBalance: checked,
        });
    };

    return (
        <div className="p-4 border rounded-lg shadow-sm">
            <div className="mb-4">
                <h4 className="text-xl font-semibold mb-2">
                    3. Balance Brought Forward
                    <span className="text-sm font-normal text-gray-600 ml-2">
                        ({selectedStudentCount} Students Selected)
                    </span>
                </h4>
                <div className="flex items-start text-sm text-blue-600 bg-blue-50 p-2 rounded">
                    <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                        Automatically include outstanding balances from previous overdue invoices. 
                        The system will fetch overdue invoices for each student and add them as a single line item called "Balance Brought Forward" with invoice numbers in the description.
                    </span>
                </div>
            </div>

            {/* Main Toggle */}
            <div className="flex items-center space-x-3 mb-4">
                <input
                    type="checkbox"
                    id="bbf-toggle"
                    checked={bbfData.includeBalance}
                    onChange={(e) => handleToggle(e.target.checked)}
                    disabled={isSubmitting}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="bbf-toggle" className="text-base font-medium text-gray-800 cursor-pointer">
                    Include Balance Brought Forward
                </label>
            </div>

            {/* Enabled State Info */}
            {bbfData.includeBalance && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-medium mb-2">
                        ✓ Balance Brought Forward Enabled
                    </p>
                    <p className="text-sm text-green-700">
                        When you submit the batch, the system will:
                    </p>
                    <ul className="list-disc list-inside text-sm text-green-700 mt-2 space-y-1">
                        <li>Check each student for overdue invoices</li>
                        <li>Calculate their total outstanding balance</li>
                        <li>Add it as a single line item: "Balance Brought Forward"</li>
                        <li>Include invoice numbers in the description</li>
                    </ul>
                </div>
            )}

            {/* Disabled State Info */}
            {!bbfData.includeBalance && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600">
                        BBF is currently disabled. Check the box above to include outstanding balances in the batch invoices.
                    </p>
                </div>
            )}
        </div>
    );
};
