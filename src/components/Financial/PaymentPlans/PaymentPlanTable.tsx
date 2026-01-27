// src/components/Financial/PaymentPlans/PaymentPlanTable.tsx

import React, { useState } from 'react';
import { Eye, Edit, Trash2, Download, CheckCircle, Clock, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { PaymentPlan } from '../../../types/paymentPlan';

interface PaymentPlanTableProps {
  paymentPlans: PaymentPlan[];
  onEdit: (plan: PaymentPlan) => void;
  onPreview: (plan: PaymentPlan) => void;
  onDelete: (plan: PaymentPlan) => void;
  onDownloadPDF: (plan: PaymentPlan) => void;
}

export const PaymentPlanTable: React.FC<PaymentPlanTableProps> = ({
  paymentPlans,
  onEdit,
  onPreview,
  onDelete,
  onDownloadPDF
}) => {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'draft':
        return <FileText className="w-4 h-4 text-gray-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'defaulted':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'terminated':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex px-2 py-1 text-xs font-semibold rounded-full";
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'draft':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'completed':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'defaulted':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'terminated':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      default:
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
    }
  };

  const getSignedStatusBadge = (signedStatus: string) => {
    const baseClasses = "inline-flex px-2 py-1 text-xs font-semibold rounded-full";
    return signedStatus === 'signed' 
      ? `${baseClasses} bg-green-100 text-green-800`
      : `${baseClasses} bg-yellow-100 text-yellow-800`;
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (paymentPlans.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No payment plans found</h3>
        <p className="text-gray-600">Get started by creating a new payment plan.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Parent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paymentPlans.map((plan) => (
              <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{plan.student_name}</div>
                    <div className="text-sm text-gray-500">{plan.student_admission_number}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{plan.invoice_number}</div>
                  <div className="text-sm text-gray-500">{formatDate(plan.invoice_date)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    Ksh {formatCurrency(plan.total_amount)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Balance: Ksh {formatCurrency(plan.invoice_balance_due)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(plan.status)}
                    <span className={getStatusBadge(plan.status)}>
                      {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{plan.parent_name}</div>
                  <div className="text-sm text-gray-500">{plan.parent_phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatDate(plan.created_date)}</div>
                  {plan.signed_date && (
                    <div className="text-sm text-gray-500">Signed: {formatDate(plan.signed_date)}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onPreview(plan)}
                      className="text-blue-600 hover:text-blue-700 transition-colors"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(plan)}
                      className="text-green-600 hover:text-green-700 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDownloadPDF(plan)}
                      className="text-purple-600 hover:text-purple-700 transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingId(plan.id);
                        onDelete(plan);
                      }}
                      disabled={deletingId === plan.id}
                      className="text-red-600 hover:text-red-700 transition-colors"
                      title="Delete"
                    >
                      {deletingId === plan.id ? (
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
  );
};
