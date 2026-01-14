// src/components/Financial/PaymentPlans/PaymentPlansContainer.tsx

import React, { useState } from 'react';
import { Plus, Search, FileText, CheckCircle, Clock, AlertCircle, Filter } from 'lucide-react';
import { PaymentPlan } from '../../../types/paymentPlan';
import { PaymentPlanForm } from './PaymentPlanForm';
import { PaymentPlanPreview } from './PaymentPlanPreview';
import { PaymentPlanTable } from './PaymentPlanTable';

// Placeholder data for development
const placeholderPaymentPlans: PaymentPlan[] = [
  {
    id: 1,
    invoice_number: 'INV-2024-001',
    student_admission_number: 'STU001',
    student_name: 'John Doe',
    total_amount: 50000,
    status: 'active',
    signed_status: 'signed',
    parent_name: 'Mary Doe',
    parent_email: 'mary.doe@email.com',
    parent_phone: '+254712345678',
    school_representative: 'Mrs. Jane Smith',
    school_representative_title: 'Finance Director',
    created_date: '2024-01-15',
    signed_date: '2024-01-16',
    notes: 'Parent agreed to quarterly payments',
    milestones: [
      {
        id: 1,
        payment_plan_id: 1,
        milestone_number: 1,
        due_date: '2024-02-15',
        percentage_of_total: 25,
        amount: 12500,
        description: 'First quarter payment',
        status: 'completed',
        completed_date: '2024-02-14',
        paid_amount: 12500
      },
      {
        id: 2,
        payment_plan_id: 1,
        milestone_number: 2,
        due_date: '2024-05-15',
        percentage_of_total: 25,
        amount: 12500,
        description: 'Second quarter payment',
        status: 'pending'
      },
      {
        id: 3,
        payment_plan_id: 1,
        milestone_number: 3,
        due_date: '2024-08-15',
        percentage_of_total: 25,
        amount: 12500,
        description: 'Third quarter payment',
        status: 'pending'
      },
      {
        id: 4,
        payment_plan_id: 1,
        milestone_number: 4,
        due_date: '2024-11-15',
        percentage_of_total: 25,
        amount: 12500,
        description: 'Final payment',
        status: 'pending'
      }
    ],
    invoice_date: '2024-01-10',
    invoice_total_amount: 50000,
    invoice_balance_due: 25000
  },
  {
    id: 2,
    invoice_number: 'INV-2024-002',
    student_admission_number: 'STU002',
    student_name: 'Jane Smith',
    total_amount: 75000,
    status: 'draft',
    signed_status: 'not_signed',
    parent_name: 'Robert Smith',
    parent_email: 'robert.smith@email.com',
    parent_phone: '+254798765432',
    school_representative: 'Mr. John Johnson',
    school_representative_title: 'Bursar',
    created_date: '2024-01-20',
    notes: 'Awaiting parent review and signature',
    milestones: [
      {
        id: 5,
        payment_plan_id: 2,
        milestone_number: 1,
        due_date: '2024-02-28',
        percentage_of_total: 30,
        amount: 22500,
        description: 'Initial payment',
        status: 'pending'
      },
      {
        id: 6,
        payment_plan_id: 2,
        milestone_number: 2,
        due_date: '2024-06-30',
        percentage_of_total: 40,
        amount: 30000,
        description: 'Mid-year payment',
        status: 'pending'
      },
      {
        id: 7,
        payment_plan_id: 2,
        milestone_number: 3,
        due_date: '2024-10-31',
        percentage_of_total: 30,
        amount: 22500,
        description: 'Final payment',
        status: 'pending'
      }
    ],
    invoice_date: '2024-01-18',
    invoice_total_amount: 75000,
    invoice_balance_due: 75000
  }
];

export const PaymentPlansContainer: React.FC = () => {
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>(placeholderPaymentPlans);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  // Filter payment plans based on search and status
  const filteredPlans = paymentPlans.filter(plan => {
    const matchesSearch = plan.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.parent_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || plan.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleCreateNew = () => {
    setSelectedPlan(null);
    setShowForm(true);
  };

  const handleEdit = (plan: PaymentPlan) => {
    setSelectedPlan(plan);
    setShowForm(true);
  };

  const handlePreview = (plan: PaymentPlan) => {
    setSelectedPlan(plan);
    setShowPreview(true);
  };

  const handleDownloadPDF = (plan: PaymentPlan) => {
    // TODO: Implement PDF download
    console.log('Downloading PDF for plan:', plan.invoice_number);
  };

  const handleDelete = async (plan: PaymentPlan) => {
    if (confirm(`Are you sure you want to delete this payment plan for ${plan.student_name}?`)) {
      setPaymentPlans(prev => prev.filter(p => p.id !== plan.id));
    }
  };

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      // TODO: Implement API call
      console.log('Submitting payment plan:', data);
      
      // For now, just update local state
      if (selectedPlan) {
        // Update existing plan
        setPaymentPlans(prev => prev.map(p => 
          p.id === selectedPlan.id ? { ...p, ...data } : p
        ));
      } else {
        // Create new plan
        const newPlan: PaymentPlan = {
          ...data,
          id: Math.max(...paymentPlans.map(p => p.id)) + 1,
          created_date: new Date().toISOString().split('T')[0],
          status: 'draft',
          signed_status: 'not_signed'
        };
        setPaymentPlans(prev => [...prev, newPlan]);
      }
      
      setShowForm(false);
    } catch (error) {
      console.error('Error saving payment plan:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 px-3 pb-3 pt-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-3">
        <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <div className="text-sm text-gray-600">Total Plans</div>
              <div className="text-2xl font-bold text-blue-600">{paymentPlans.length}</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <div className="text-sm text-gray-600">Pending Signature</div>
              <div className="text-2xl font-bold text-yellow-600">
                {paymentPlans.filter(p => p.signed_status === 'not_signed').length}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <div className="text-sm text-gray-600">Active Plans</div>
              <div className="text-2xl font-bold text-green-600">
                {paymentPlans.filter(p => p.status === 'active').length}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <AlertCircle className="w-8 h-8 text-red-600 mr-3" />
            <div>
              <div className="text-sm text-gray-600">Defaulted</div>
              <div className="text-2xl font-bold text-red-600">
                {paymentPlans.filter(p => p.status === 'defaulted').length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters, Search, and New Button */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by student, invoice, or parent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 hover:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
          
          {showFilterDropdown && (
            <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px]">
              <button
                onClick={() => { setFilterStatus('all'); setShowFilterDropdown(false); }}
                className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${filterStatus === 'all' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
              >
                All Status
              </button>
              <button
                onClick={() => { setFilterStatus('draft'); setShowFilterDropdown(false); }}
                className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${filterStatus === 'draft' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
              >
                Draft
              </button>
              <button
                onClick={() => { setFilterStatus('active'); setShowFilterDropdown(false); }}
                className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${filterStatus === 'active' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
              >
                Active
              </button>
              <button
                onClick={() => { setFilterStatus('completed'); setShowFilterDropdown(false); }}
                className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${filterStatus === 'completed' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
              >
                Completed
              </button>
              <button
                onClick={() => { setFilterStatus('defaulted'); setShowFilterDropdown(false); }}
                className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${filterStatus === 'defaulted' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
              >
                Defaulted
              </button>
              <button
                onClick={() => { setFilterStatus('terminated'); setShowFilterDropdown(false); }}
                className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${filterStatus === 'terminated' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
              >
                Terminated
              </button>
            </div>
          )}
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          New Payment Plan
        </button>
      </div>

      {/* Payment Plans Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <PaymentPlanTable
          paymentPlans={filteredPlans}
          onEdit={handleEdit}
          onPreview={handlePreview}
          onDelete={handleDelete}
          onDownloadPDF={handleDownloadPDF}
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <PaymentPlanForm
          selectedPlan={selectedPlan}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
          loading={loading}
        />
      )}

      {/* Preview Modal */}
      {showPreview && selectedPlan && (
        <PaymentPlanPreview
          paymentPlan={selectedPlan}
          onClose={() => setShowPreview(false)}
          onDownloadPDF={() => handleDownloadPDF(selectedPlan)}
        />
      )}
    </div>
  );
};
