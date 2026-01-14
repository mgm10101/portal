// src/components/Financial/PaymentPlans/PaymentPlanForm.tsx

import React, { useState } from 'react';
import { X, Plus, Trash2, Calendar, DollarSign, User, Mail, Phone, FileText } from 'lucide-react';
import { PaymentPlan } from '../../../types/paymentPlan';

interface PaymentPlanFormProps {
  selectedPlan: PaymentPlan | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
}

interface MilestoneFormData {
  milestone_number: number;
  due_date: string;
  percentage_of_total: number;
  amount: number;
  description: string;
}

export const PaymentPlanForm: React.FC<PaymentPlanFormProps> = ({
  selectedPlan,
  onSubmit,
  onCancel,
  loading
}) => {
  const [formData, setFormData] = useState({
    invoice_number: selectedPlan?.invoice_number || '',
    student_admission_number: selectedPlan?.student_admission_number || '',
    student_name: selectedPlan?.student_name || '',
    total_amount: selectedPlan?.total_amount || 0,
    parent_name: selectedPlan?.parent_name || '',
    parent_email: selectedPlan?.parent_email || '',
    parent_phone: selectedPlan?.parent_phone || '',
    school_representative: selectedPlan?.school_representative || '',
    school_representative_title: selectedPlan?.school_representative_title || '',
    notes: selectedPlan?.notes || ''
  });

  const [milestones, setMilestones] = useState<MilestoneFormData[]>(
    selectedPlan?.milestones.map(m => ({
      milestone_number: m.milestone_number,
      due_date: m.due_date,
      percentage_of_total: m.percentage_of_total,
      amount: m.amount,
      description: m.description || ''
    })) || [{
      milestone_number: 1,
      due_date: '',
      percentage_of_total: 100,
      amount: formData.total_amount,
      description: ''
    }]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMilestoneChange = (index: number, field: keyof MilestoneFormData, value: string | number) => {
    const updatedMilestones = [...milestones];
    updatedMilestones[index] = {
      ...updatedMilestones[index],
      [field]: value
    };

    // Recalculate amounts if percentage changed
    if (field === 'percentage_of_total') {
      const percentage = Number(value);
      updatedMilestones[index].amount = (formData.total_amount * percentage) / 100;
    }

    setMilestones(updatedMilestones);
  };

  const addMilestone = () => {
    const newMilestone: MilestoneFormData = {
      milestone_number: milestones.length + 1,
      due_date: '',
      percentage_of_total: 0,
      amount: 0,
      description: ''
    };
    setMilestones([...milestones, newMilestone]);
  };

  const removeMilestone = (index: number) => {
    if (milestones.length > 1) {
      const updatedMilestones = milestones.filter((_, i) => i !== index);
      // Renumber milestones
      const renumberedMilestones = updatedMilestones.map((m, i) => ({
        ...m,
        milestone_number: i + 1
      }));
      setMilestones(renumberedMilestones);
    }
  };

  const validateForm = () => {
    if (!formData.invoice_number || !formData.student_admission_number || !formData.student_name) {
      alert('Please fill in all required student and invoice information');
      return false;
    }

    if (!formData.parent_name || !formData.parent_phone) {
      alert('Please fill in parent contact information');
      return false;
    }

    if (!formData.school_representative || !formData.school_representative_title) {
      alert('Please fill in school representative information');
      return false;
    }

    if (milestones.some(m => !m.due_date || m.percentage_of_total <= 0)) {
      alert('Please fill in all milestone information with valid percentages');
      return false;
    }

    const totalPercentage = milestones.reduce((sum, m) => sum + m.percentage_of_total, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      alert('Total percentage must equal 100%');
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submissionData = {
      ...formData,
      total_amount: Number(formData.total_amount),
      milestones: milestones.map(m => ({
        ...m,
        milestone_number: m.milestone_number,
        percentage_of_total: Number(m.percentage_of_total),
        amount: Number(m.amount)
      }))
    };

    onSubmit(submissionData);
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const totalPercentage = milestones.reduce((sum, m) => sum + m.percentage_of_total, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedPlan ? 'Edit Payment Plan' : 'Create New Payment Plan'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Invoice & Student Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Invoice & Student Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Number *
                </label>
                <input
                  type="text"
                  name="invoice_number"
                  value={formData.invoice_number}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admission Number *
                </label>
                <input
                  type="text"
                  name="student_admission_number"
                  value={formData.student_admission_number}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student Name *
                </label>
                <input
                  type="text"
                  name="student_name"
                  value={formData.student_name}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Amount *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    name="total_amount"
                    value={formData.total_amount}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Parent Information */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Parent Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Name *
                </label>
                <input
                  type="text"
                  name="parent_name"
                  value={formData.parent_name}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="email"
                    name="parent_email"
                    value={formData.parent_email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Phone *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="tel"
                    name="parent_phone"
                    value={formData.parent_phone}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* School Representative */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              School Representative
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Representative Name *
                </label>
                <input
                  type="text"
                  name="school_representative"
                  value={formData.school_representative}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  name="school_representative_title"
                  value={formData.school_representative_title}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Payment Milestones */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Payment Milestones
              </h3>
              <button
                type="button"
                onClick={addMilestone}
                className="flex items-center gap-2 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Milestone
              </button>
            </div>

            <div className={`space-y-3 ${totalPercentage !== 100 ? 'mb-2' : ''}`}>
              {milestones.map((milestone, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-purple-200">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-900">Milestone {milestone.milestone_number}</h4>
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMilestone(index)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Due Date *
                      </label>
                      <input
                        type="date"
                        value={milestone.due_date}
                        onChange={(e) => handleMilestoneChange(index, 'due_date', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Percentage (%) *
                      </label>
                      <input
                        type="number"
                        value={milestone.percentage_of_total}
                        onChange={(e) => handleMilestoneChange(index, 'percentage_of_total', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount
                      </label>
                      <div className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50">
                        Ksh {formatCurrency(milestone.amount)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={milestone.description}
                        onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., First payment"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Percentage Summary */}
            <div className={`mt-3 p-3 rounded-lg text-center font-medium ${
              totalPercentage === 100 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              Total Percentage: {totalPercentage.toFixed(1)}%
              {totalPercentage !== 100 && (
                <div className="text-sm mt-1">
                  Must equal 100% to save
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any additional terms or conditions..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || totalPercentage !== 100}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (selectedPlan ? 'Update Plan' : 'Create Plan')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
