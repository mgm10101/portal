// src/components/Financial/PaymentPlans/PaymentPlanPreview.tsx

import React, { useState, useRef } from 'react';
import { X, Download, User, Calendar, FileText } from 'lucide-react';
import { PaymentPlan } from '../../../types/paymentPlan';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PaymentPlanPreviewProps {
  paymentPlan: PaymentPlan;
  onClose: () => void;
}

export const PaymentPlanPreview: React.FC<PaymentPlanPreviewProps> = ({
  paymentPlan,
  onClose
}) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const generatePDF = async () => {
    if (!previewRef.current) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Payment-Plan-${paymentPlan.invoice_number}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex px-2 py-1 text-xs font-semibold rounded-full";
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'overdue':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const completedMilestones = paymentPlan.milestones.filter(m => m.status === 'completed').length;
  const totalMilestones = paymentPlan.milestones.length;
  const progressPercentage = (completedMilestones / totalMilestones) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Payment Plan Preview</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={generatePDF}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download PDF
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Preview Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div ref={previewRef} className="bg-white p-8">
            {/* School Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Payment Plan Agreement</h1>
              <p className="text-gray-600 mt-2">School Fee Payment Arrangement</p>
            </div>

            {/* Plan Details */}
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Plan Reference</h3>
                  <p className="text-lg font-semibold text-gray-900">{paymentPlan.invoice_number}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Date Created</h3>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(paymentPlan.created_date)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Total Amount</h3>
                  <p className="text-2xl font-bold text-blue-600">Ksh {formatCurrency(paymentPlan.total_amount)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Progress</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {completedMilestones}/{totalMilestones}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Student Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Student Information
              </h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Student Name</p>
                    <p className="font-medium text-gray-900">{paymentPlan.student_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Admission Number</p>
                    <p className="font-medium text-gray-900">{paymentPlan.student_admission_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Invoice Number</p>
                    <p className="font-medium text-gray-900">{paymentPlan.invoice_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Invoice Date</p>
                    <p className="font-medium text-gray-900">{formatDate(paymentPlan.invoice_date)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Parent Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Parent/Guardian Information
              </h3>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Parent Name</p>
                    <p className="font-medium text-gray-900">{paymentPlan.parent_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{paymentPlan.parent_email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">{paymentPlan.parent_phone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* School Representative */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                School Representative
              </h3>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium text-gray-900">{paymentPlan.school_representative}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Title</p>
                    <p className="font-medium text-gray-900">{paymentPlan.school_representative_title}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Milestones */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Payment Schedule
              </h3>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="space-y-3">
                  {paymentPlan.milestones.map((milestone) => (
                    <div key={milestone.id} className="bg-white p-4 rounded-lg border border-yellow-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">Milestone {milestone.milestone_number}</h4>
                          {milestone.description && (
                            <p className="text-sm text-gray-600">{milestone.description}</p>
                          )}
                        </div>
                        <span className={getStatusBadge(milestone.status)}>
                          {milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Due Date</p>
                          <p className="font-medium text-gray-900">{formatDate(milestone.due_date)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Percentage</p>
                          <p className="font-medium text-gray-900">{milestone.percentage_of_total}%</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Amount</p>
                          <p className="font-medium text-gray-900">Ksh {formatCurrency(milestone.amount)}</p>
                        </div>
                      </div>
                      {milestone.completed_date && (
                        <div className="mt-2 text-sm text-green-600">
                          Completed on {formatDate(milestone.completed_date)}
                        </div>
                      )}
                      {milestone.paid_amount && milestone.paid_amount !== milestone.amount && (
                        <div className="mt-2 text-sm text-yellow-600">
                          Paid: Ksh {formatCurrency(milestone.paid_amount)} / Ksh {formatCurrency(milestone.amount)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms and Conditions</h3>
              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 space-y-2">
                <p>1. All payments must be made on or before the due dates specified above.</p>
                <p>2. Late payments may incur additional charges as per school policy.</p>
                <p>3. Failure to make payments as scheduled may result in suspension of services.</p>
                <p>4. This agreement is binding and must be signed by both parties.</p>
                <p>5. Any changes to this payment plan must be agreed upon in writing by both parties.</p>
              </div>
            </div>

            {/* Notes */}
            {paymentPlan.notes && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">{paymentPlan.notes}</p>
                </div>
              </div>
            )}

            {/* Signature Section */}
            <div className="border-t-2 border-gray-300 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Signatures</h3>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="border-b-2 border-gray-300 pb-2 mb-2">
                    <p className="text-sm text-gray-600">Parent/Guardian Signature</p>
                    {paymentPlan.signed_status === 'signed' && (
                      <p className="text-xs text-green-600 mt-1">✓ Signed on {formatDate(paymentPlan.signed_date || '')}</p>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">Date: _________________</p>
                </div>
                <div>
                  <div className="border-b-2 border-gray-300 pb-2 mb-2">
                    <p className="text-sm text-gray-600">School Representative Signature</p>
                  </div>
                  <p className="text-sm text-gray-600">Date: _________________</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
              <p>This document was generated on {formatDate(new Date().toISOString())}</p>
              <p>For any questions, please contact the school finance office.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
