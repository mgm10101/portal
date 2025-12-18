import React, { useState } from 'react';
import { X } from 'lucide-react';

interface VoidReasonPopupProps {
  onClose: () => void;
  onConfirm: (reason: string) => void;
  expenseCount?: number;
  recordType?: 'expense' | 'invoice' | 'payment';
}

export const VoidReasonPopup: React.FC<VoidReasonPopupProps> = ({ onClose, onConfirm, expenseCount = 1, recordType = 'expense' }) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getRecordTypeLabel = () => {
    switch (recordType) {
      case 'invoice':
        return expenseCount > 1 ? 'Invoices' : 'Invoice';
      case 'payment':
        return expenseCount > 1 ? 'Payments' : 'Payment';
      default:
        return expenseCount > 1 ? 'Expenses' : 'Expense';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert(`Please provide a reason for voiding this ${getRecordTypeLabel().toLowerCase()}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim());
    } catch (error) {
      console.error('Error in void confirmation:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Void {expenseCount > 1 ? `${expenseCount} ${getRecordTypeLabel()}` : getRecordTypeLabel()}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              disabled={isSubmitting}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Voiding <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={`Please provide a reason for voiding this ${getRecordTypeLabel().toLowerCase()}...`}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
                disabled={isSubmitting}
              />
              <p className="mt-1 text-xs text-gray-500">
                This reason will be stored in the audit trail for financial records.
              </p>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !reason.trim()}
                className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 ${
                  isSubmitting || !reason.trim() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting && (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                Confirm Void
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

