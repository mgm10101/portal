import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2, X, ChevronDown } from 'lucide-react';
import { DropdownField } from '../Students/masterlist/DropdownField';
import { OptionsModal } from '../Students/masterlist/OptionsModal';
import {
  fetchExpenses,
  createExpense,
  updateExpense,
  markExpenseAsPaid,
  voidExpense,
  voidExpenses,
  fetchExpenseCategories,
  fetchExpenseDescriptions,
  fetchExpenseVendors,
  fetchExpensePaidThrough,
  addExpenseCategory,
  deleteExpenseCategory,
  addExpenseDescription,
  deleteExpenseDescription,
  addExpenseVendor,
  deleteExpenseVendor,
  addExpensePaidThrough,
  deleteExpensePaidThrough
} from '../../services/expenseService';
import { Expense, ExpenseCategory, ExpenseDescription, ExpenseVendor, ExpensePaidThrough } from '../../types/database';

// Mark as Paid Popup Component
const MarkAsPaidPopup: React.FC<{ 
  expense: Expense; 
  onClose: () => void; 
  onConfirm: (datePaid: string, reference: string) => void;
}> = ({ expense, onClose, onConfirm }) => {
  const [datePaid, setDatePaid] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(datePaid, reference);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Mark as Paid</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Paid
              </label>
              <input
                type="date"
                value={datePaid}
                onChange={(e) => setDatePaid(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Reference No.
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Enter payment reference number"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Mark as Paid
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Expense Display Component (Read-only view)
const ExpenseDisplay: React.FC<{ expense: Expense; onClose: () => void; onMarkAsPaid?: (expense: Expense, datePaid: string, reference: string) => void }> = ({ expense, onClose, onMarkAsPaid }) => {
  const [showMarkAsPaidPopup, setShowMarkAsPaidPopup] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const status = expense.payment_status === 'Paid' ? 'Paid' : 
                 (expense.due_date && new Date(expense.due_date) < new Date() ? 'Payment Overdue' : 'Pending Payment');
  const statusClasses = {
    'Paid': 'bg-green-100 text-green-800',
    'Pending Payment': 'bg-yellow-100 text-yellow-800',
    'Payment Overdue': 'bg-red-100 text-red-800'
  };
  
  const canMarkAsPaid = status === 'Pending Payment' || status === 'Payment Overdue';

  // Keyboard navigation for scrolling
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isHovering || !scrollContainerRef.current) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        scrollContainerRef.current.scrollBy({
          top: -100,
          behavior: 'smooth'
        });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        scrollContainerRef.current.scrollBy({
          top: 100,
          behavior: 'smooth'
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHovering]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <style>
        {`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>
      <div 
        ref={scrollContainerRef}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide"
      >
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Expense Details</h1>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Expense Details */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Internal Reference</p>
                <p className="text-lg font-semibold text-gray-900">{expense.internal_reference}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Date</p>
                <p className="text-lg font-semibold text-gray-900">{expense.expense_date}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>
                  {status}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="grid grid-cols-2 gap-6 mb-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Category</p>
                  <p className="text-base font-medium text-gray-900">{expense.category_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Description</p>
                  <p className="text-base font-medium text-gray-900">{expense.description_name || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg text-gray-700">Amount</span>
                <span className="text-3xl font-normal text-red-600">Ksh. {expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Vendor</p>
                <p className="text-base font-medium text-gray-900">{expense.vendor_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Paid Through</p>
                <p className="text-base font-medium text-gray-900">{expense.paid_through_name || 'N/A'}</p>
              </div>
            </div>

            {expense.payment_reference_no && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Payment Reference No.</p>
                <p className="text-base font-medium text-gray-900">{expense.payment_reference_no}</p>
              </div>
            )}

            {expense.payment_status === 'Paid' && expense.date_paid && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Date Paid</p>
                <p className="text-base font-medium text-gray-900">{expense.date_paid}</p>
              </div>
            )}

            {expense.payment_status === 'Unpaid' && expense.due_date && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Due Date</p>
                <p className="text-base font-medium text-gray-900">{expense.due_date}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            {canMarkAsPaid && onMarkAsPaid && (
              <button
                onClick={() => setShowMarkAsPaidPopup(true)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Mark as Paid
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
      
      {showMarkAsPaidPopup && (
        <MarkAsPaidPopup
          expense={expense}
          onClose={() => setShowMarkAsPaidPopup(false)}
          onConfirm={(datePaid, reference) => {
            if (onMarkAsPaid) {
              onMarkAsPaid(expense, datePaid, reference);
            }
            setShowMarkAsPaidPopup(false);
            onClose();
          }}
        />
      )}
    </div>
  );
};

export const Expenses: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [expenseToDisplay, setExpenseToDisplay] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('Paid');
  const [dueDate, setDueDate] = useState<string>('');
  const [datePaid, setDatePaid] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number>(0);
  const [amountInput, setAmountInput] = useState<string>('');
  const [paymentReferenceNo, setPaymentReferenceNo] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Hover and selection state
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [selectedExpenses, setSelectedExpenses] = useState<Set<number>>(new Set());
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterCategoryId, setFilterCategoryId] = useState<number | undefined>(undefined);
  const [filterDescriptionId, setFilterDescriptionId] = useState<number | undefined>(undefined);
  const [filterVendorId, setFilterVendorId] = useState<number | undefined>(undefined);
  const [filterPaidThroughId, setFilterPaidThroughId] = useState<number | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterAmountMin, setFilterAmountMin] = useState<string>('');
  const [filterAmountMax, setFilterAmountMax] = useState<string>('');
  
  // Scroll preservation for modal
  const formContainerRef = useRef<HTMLDivElement>(null);
  const formScrollRef = useRef<number>(0);
  const [isFormHovering, setIsFormHovering] = useState(false);
  const filterContainerRef = useRef<HTMLDivElement>(null);
  const [isFilterHovering, setIsFilterHovering] = useState(false);

  // State for expenses and dropdowns
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [allDescriptions, setAllDescriptions] = useState<ExpenseDescription[]>([]);
  const [vendors, setVendors] = useState<ExpenseVendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [paidThroughOptions, setPaidThroughOptions] = useState<ExpensePaidThrough[]>([]);
  const [loadingPaidThrough, setLoadingPaidThrough] = useState(true);

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [selectedPaidThroughId, setSelectedPaidThroughId] = useState<number | undefined>(undefined);
  const [selectedVendorId, setSelectedVendorId] = useState<number | undefined>(undefined);
  const [selectedDescriptionId, setSelectedDescriptionId] = useState<number | undefined>(undefined);
  
  // Clear description when category changes
  const handleCategoryChange = (categoryId: number | undefined) => {
    setSelectedCategoryId(categoryId);
    setSelectedDescriptionId(undefined); // Clear description when category changes
  };
  
  // Filter descriptions based on selected category
  const descriptions = useMemo(() => {
    if (!selectedCategoryId) {
      return [];
    }
    return allDescriptions
      .filter(d => d.category_id === selectedCategoryId)
      .map(({ category_id, ...rest }) => ({ ...rest, id: rest.id, name: rest.name, sort_order: rest.sort_order })); // Remove category_id from output
  }, [selectedCategoryId, allDescriptions]);
  
  // Fetch expenses on mount
  useEffect(() => {
    const loadExpenses = async () => {
      setLoadingExpenses(true);
      try {
        const expensesData = await fetchExpenses();
        setExpenses(expensesData);
      } catch (error) {
        console.error('Error fetching expenses:', error);
        alert('Failed to load expenses');
      } finally {
        setLoadingExpenses(false);
      }
    };
    loadExpenses();
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const categoriesData = await fetchExpenseCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  // Fetch descriptions on mount
  useEffect(() => {
    const loadDescriptions = async () => {
      try {
        // Fetch descriptions for all categories
        const allCats = await fetchExpenseCategories();
        const descPromises = allCats.map(cat => fetchExpenseDescriptions(cat.id));
        const descArrays = await Promise.all(descPromises);
        const allDesc = descArrays.flat();
        setAllDescriptions(allDesc);
      } catch (error) {
        console.error('Error fetching descriptions:', error);
      }
    };
    if (categories.length > 0) {
      loadDescriptions();
    }
  }, [categories]);

  // Fetch vendors on mount
  useEffect(() => {
    const loadVendors = async () => {
      setLoadingVendors(true);
      try {
        const vendorsData = await fetchExpenseVendors();
        setVendors(vendorsData);
      } catch (error) {
        console.error('Error fetching vendors:', error);
      } finally {
        setLoadingVendors(false);
      }
    };
    loadVendors();
  }, []);

  // Fetch paid through options on mount
  useEffect(() => {
    const loadPaidThrough = async () => {
      setLoadingPaidThrough(true);
      try {
        const paidThroughData = await fetchExpensePaidThrough();
        setPaidThroughOptions(paidThroughData);
      } catch (error) {
        console.error('Error fetching paid through options:', error);
      } finally {
        setLoadingPaidThrough(false);
      }
    };
    loadPaidThrough();
  }, []);
  
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPaidThroughModal, setShowPaidThroughModal] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);

  // Calculate status based on payment status and due date
  const getExpenseStatus = useCallback((expense: Expense): string => {
    if (expense.payment_status === 'Paid') {
      return 'Paid';
    }
    if (expense.payment_status === 'Unpaid' && expense.due_date) {
      const today = new Date();
      const due = new Date(expense.due_date);
      today.setHours(0, 0, 0, 0);
      due.setHours(0, 0, 0, 0);
      if (due < today) {
        return 'Payment Overdue';
      }
      return 'Pending Payment';
    }
    return 'Pending Payment';
  }, []);

  // Filter expenses based on search and filters
  const filteredExpenses = useMemo(() => {
    let filtered = [...expenses];

    // Apply search query (internal reference, category, description, vendor)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(expense =>
        expense.internal_reference.toLowerCase().includes(query) ||
        (expense.category_name && expense.category_name.toLowerCase().includes(query)) ||
        (expense.description_name && expense.description_name.toLowerCase().includes(query)) ||
        (expense.vendor_name && expense.vendor_name.toLowerCase().includes(query))
      );
    }

    // Apply date range filter
    if (filterDateFrom) {
      filtered = filtered.filter(expense => expense.expense_date >= filterDateFrom);
    }
    if (filterDateTo) {
      filtered = filtered.filter(expense => expense.expense_date <= filterDateTo);
    }

    // Apply category filter
    if (filterCategoryId !== undefined) {
      filtered = filtered.filter(expense => expense.category_id === filterCategoryId);
    }

    // Apply description filter
    if (filterDescriptionId !== undefined) {
      filtered = filtered.filter(expense => expense.description_id === filterDescriptionId);
    }

    // Apply vendor filter
    if (filterVendorId !== undefined) {
      filtered = filtered.filter(expense => expense.vendor_id === filterVendorId);
    }

    // Apply paid through filter
    if (filterPaidThroughId !== undefined) {
      filtered = filtered.filter(expense => expense.paid_through_id === filterPaidThroughId);
    }

    // Apply status filter
    if (filterStatus) {
      filtered = filtered.filter(expense => {
        const status = getExpenseStatus(expense);
        return status === filterStatus;
      });
    }

    // Apply amount range filter
    if (filterAmountMin) {
      const min = parseFloat(filterAmountMin);
      if (!isNaN(min)) {
        filtered = filtered.filter(expense => expense.amount >= min);
      }
    }
    if (filterAmountMax) {
      const max = parseFloat(filterAmountMax);
      if (!isNaN(max)) {
        filtered = filtered.filter(expense => expense.amount <= max);
      }
    }

    return filtered;
  }, [expenses, searchQuery, filterDateFrom, filterDateTo, filterCategoryId, filterDescriptionId, filterVendorId, filterPaidThroughId, filterStatus, filterAmountMin, filterAmountMax, getExpenseStatus]);

  // Check if any filters are active
  const hasActiveFilters = filterDateFrom || filterDateTo || filterCategoryId !== undefined || filterDescriptionId !== undefined || filterVendorId !== undefined || filterPaidThroughId !== undefined || filterStatus || filterAmountMin || filterAmountMax;

  // Clear all filters
  const clearFilters = () => {
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterCategoryId(undefined);
    setFilterDescriptionId(undefined);
    setFilterVendorId(undefined);
    setFilterPaidThroughId(undefined);
    setFilterStatus('');
    setFilterAmountMin('');
    setFilterAmountMax('');
  };

  const clearIfInvalid = (e: React.FocusEvent<HTMLSelectElement>, validList: string[]) => {
    // Placeholder function for dropdown validation
  };

  // Handle form submission
  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategoryId) {
      alert('Please select a category');
      return;
    }

    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (paymentStatus === 'Unpaid' && !dueDate) {
      alert('Please enter a due date for unpaid expenses');
      return;
    }

    if (paymentStatus === 'Paid' && !datePaid) {
      alert('Please enter a date paid for paid expenses');
      return;
    }

    setIsSubmitting(true);
    try {
      const expenseData = {
        expense_date: expenseDate,
        category_id: selectedCategoryId,
        description_id: selectedDescriptionId || null,
        amount: amount,
        vendor_id: selectedVendorId || null,
        paid_through_id: selectedPaidThroughId || null,
        payment_status: paymentStatus as 'Paid' | 'Unpaid',
        due_date: paymentStatus === 'Unpaid' ? dueDate : null,
        date_paid: paymentStatus === 'Paid' ? datePaid : null,
        payment_reference_no: paymentReferenceNo || null
      };

      if (selectedExpense) {
        // Update existing expense
        await updateExpense(selectedExpense.id, expenseData);
        alert('Expense updated successfully!');
      } else {
        // Create new expense
        await createExpense(expenseData);
        alert('Expense recorded successfully!');
      }

      // Refresh expenses list
      const expensesData = await fetchExpenses();
      setExpenses(expensesData);

      // Reset form
      setShowForm(false);
      setSelectedExpense(null);
      setPaymentStatus('Paid');
      setDueDate('');
      setDatePaid('');
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setAmount(0);
      setAmountInput('');
      setPaymentReferenceNo('');
      setSelectedCategoryId(undefined);
      setSelectedDescriptionId(undefined);
      setSelectedVendorId(undefined);
      setSelectedPaidThroughId(undefined);
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Failed to save expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit expense
  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setExpenseDate(expense.expense_date);
    setAmount(expense.amount);
    setAmountInput(expense.amount.toString());
    setPaymentStatus(expense.payment_status);
    setDueDate(expense.due_date || '');
    setDatePaid(expense.date_paid || '');
    setPaymentReferenceNo(expense.payment_reference_no || '');
    setSelectedCategoryId(expense.category_id);
    setSelectedDescriptionId(expense.description_id || undefined);
    setSelectedVendorId(expense.vendor_id || undefined);
    setSelectedPaidThroughId(expense.paid_through_id || undefined);
    setShowForm(true);
  };

  // Handle mark as paid
  const handleMarkAsPaid = async (expense: Expense, datePaid: string, reference: string) => {
    try {
      await markExpenseAsPaid(expense.id, datePaid, reference || null);
      alert('Expense marked as paid successfully!');
      
      // Refresh expenses list
      const expensesData = await fetchExpenses();
      setExpenses(expensesData);
    } catch (error) {
      console.error('Error marking expense as paid:', error);
      alert('Failed to mark expense as paid. Please try again.');
    }
  };

  // Handle void expense
  const handleVoidExpense = async (expenseId: number) => {
    if (!window.confirm('Are you sure you want to void this expense? This action cannot be undone.')) {
      return;
    }

    try {
      await voidExpense(expenseId);
      alert('Expense voided successfully!');
      
      // Refresh expenses list
      const expensesData = await fetchExpenses();
      setExpenses(expensesData);
    } catch (error) {
      console.error('Error voiding expense:', error);
      alert('Failed to void expense. Please try again.');
    }
  };

  // Handle void selected expenses
  const handleVoidSelected = async () => {
    const selectedArray = Array.from(selectedExpenses);
    if (selectedArray.length === 0) return;

    if (!window.confirm(`Are you sure you want to void ${selectedArray.length} expense(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      await voidExpenses(selectedArray);
      alert(`Successfully voided ${selectedArray.length} expense(s).`);
      setSelectedExpenses(new Set());
      
      // Refresh expenses list
      const expensesData = await fetchExpenses();
      setExpenses(expensesData);
    } catch (error) {
      console.error('Error voiding expenses:', error);
      alert('Failed to void expenses. Please try again.');
    }
  };

  // Initialize datePaid when form opens or payment status changes
  useEffect(() => {
    if (paymentStatus === 'Paid' && !datePaid) {
      setDatePaid(expenseDate);
    }
  }, [paymentStatus, expenseDate, datePaid]);

  // Handle amount input (only update input value, no recalculation)
  const handleAmountInputChange = useCallback((value: string) => {
    setAmountInput(value);
  }, []);

  // Handle amount blur (convert to number)
  const handleAmountBlur = useCallback(() => {
    const value = parseFloat(amountInput) || 0;
    setAmount(value);
    setAmountInput(value === 0 ? '' : value.toString());
  }, [amountInput]);

  // Keyboard navigation for scrolling in form
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFormHovering || !formContainerRef.current) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        formContainerRef.current.scrollBy({
          top: -100,
          behavior: 'smooth'
        });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        formContainerRef.current.scrollBy({
          top: 100,
          behavior: 'smooth'
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFormHovering]);

  // Keyboard navigation for scrolling in filter modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFilterHovering || !filterContainerRef.current) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        filterContainerRef.current.scrollBy({
          top: -100,
          behavior: 'smooth'
        });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        filterContainerRef.current.scrollBy({
          top: 100,
          behavior: 'smooth'
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFilterHovering]);

  return (
    <div className="p-6 md:p-3 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <style>
              {`
                .scrollbar-hide::-webkit-scrollbar {
                  display: none;
                }
                .scrollbar-hide {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
              `}
            </style>
            <div 
              ref={(node) => {
                formContainerRef.current = node;
                if (node && formScrollRef.current > 0) {
                  requestAnimationFrame(() => {
                    if (formContainerRef.current) {
                      formContainerRef.current.scrollTop = formScrollRef.current;
                    }
                  });
                }
              }}
              onScroll={(e) => {
                formScrollRef.current = e.currentTarget.scrollTop;
              }}
              onMouseEnter={() => setIsFormHovering(true)}
              onMouseLeave={() => setIsFormHovering(false)}
              className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide"
            >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {selectedExpense ? 'Edit Expense' : 'Record New Expense'}
          </h2>
          <button
            onClick={() => {
              setShowForm(false);
              setSelectedExpense(null);
              setPaymentStatus('Paid');
              setDueDate('');
              setDatePaid('');
              setExpenseDate(new Date().toISOString().split('T')[0]);
              setAmount(0);
              setAmountInput('');
              setPaymentReferenceNo('');
              setSelectedCategoryId(undefined);
              setSelectedDescriptionId(undefined);
              setSelectedVendorId(undefined);
              setSelectedPaidThroughId(undefined);
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form 
          className="space-y-6"
          onSubmit={handleSubmitExpense}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setExpenseDate(newDate);
                  // Update date paid if payment status is Paid and date paid matches old expense date
                  if (paymentStatus === 'Paid' && datePaid === expenseDate) {
                    setDatePaid(newDate);
                  }
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Ksh)</label>
              <input
                type="number"
                step="0.01"
                value={amountInput}
                onChange={(e) => handleAmountInputChange(e.target.value)}
                onBlur={handleAmountBlur}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
              <select 
                value={paymentStatus}
                onChange={(e) => {
                  setPaymentStatus(e.target.value);
                  if (e.target.value === 'Paid') {
                    setDueDate('');
                    // Set date paid to expense date if not already set
                    if (!datePaid) {
                      setDatePaid(expenseDate);
                    }
                  } else {
                    setDatePaid('');
                    setPaymentReferenceNo(''); // Clear payment reference when status changes to Unpaid
                  }
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>Paid</option>
                <option>Unpaid</option>
              </select>
            </div>
            {paymentStatus === 'Paid' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Paid</label>
                <input
                  type="date"
                  value={datePaid}
                  onChange={(e) => setDatePaid(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
            {paymentStatus === 'Unpaid' && (
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <DropdownField
                name="category_id"
                label="Category"
                items={categories}
                selectedId={selectedCategoryId}
                clearIfInvalid={clearIfInvalid}
                onOpenModal={() => setShowCategoryModal(true)}
                onSelect={handleCategoryChange}
                tableName="expense_categories"
                disableFetch={false}
              />
            </div>
            <div>
              <DropdownField
                name="description_id"
                label="Description"
                items={descriptions}
                selectedId={selectedDescriptionId}
                clearIfInvalid={clearIfInvalid}
                onOpenModal={() => {
                  if (selectedCategoryId) {
                    setShowDescriptionModal(true);
                  }
                }}
                onSelect={setSelectedDescriptionId}
                tableName="expense_descriptions"
                disableFetch={true}
                placeholder={selectedCategoryId ? "Select description..." : "Select category first"}
                disabled={!selectedCategoryId}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <DropdownField
                name="vendor_id"
                label="Vendor"
                items={vendors}
                selectedId={selectedVendorId}
                clearIfInvalid={clearIfInvalid}
                onOpenModal={() => setShowVendorModal(true)}
                onSelect={setSelectedVendorId}
                tableName="expense_vendors"
                disableFetch={false}
              />
            </div>
          <div>
              <DropdownField
                name="paid_through_id"
                label="Paid Through"
                items={paidThroughOptions}
                selectedId={selectedPaidThroughId}
                clearIfInvalid={clearIfInvalid}
                onOpenModal={() => setShowPaidThroughModal(true)}
                onSelect={setSelectedPaidThroughId}
                tableName="expense_paid_through"
                disableFetch={false}
              />
            </div>
          </div>

          {paymentStatus === 'Paid' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Reference No.</label>
              <input
                type="text"
                placeholder="Receipt or reference number"
                value={paymentReferenceNo}
                onChange={(e) => setPaymentReferenceNo(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes about the expense..."
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setSelectedExpense(null);
                setPaymentStatus('Paid');
                setDueDate('');
                setDatePaid('');
                setExpenseDate(new Date().toISOString().split('T')[0]);
                setAmount(0);
                setAmountInput('');
                setPaymentReferenceNo('');
                setSelectedCategoryId(undefined);
                setSelectedDescriptionId(undefined);
                setSelectedVendorId(undefined);
                setSelectedPaidThroughId(undefined);
              }}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {selectedExpense ? 'Updating...' : 'Recording...'}
                </>
              ) : (
                `${selectedExpense ? 'Update' : 'Record'} Expense`
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
      )}

      {/* Category Options Modal */}
      {showCategoryModal && (
        <OptionsModal
          title="Categories"
          items={categories.map(c => ({ id: c.id, name: c.name, sort_order: c.sort_order }))}
          onAdd={async (name: string) => {
            try {
              const newCategory = await addExpenseCategory(name);
              const updatedCategories = await fetchExpenseCategories();
              setCategories(updatedCategories);
            } catch (error) {
              console.error('Error adding category:', error);
              alert('Failed to add category');
            }
          }}
          onDelete={async (id: number) => {
            try {
              await deleteExpenseCategory(id);
              const updatedCategories = await fetchExpenseCategories();
              setCategories(updatedCategories);
            } catch (error) {
              console.error('Error deleting category:', error);
              alert('Failed to delete category');
            }
          }}
          onClose={() => setShowCategoryModal(false)}
          tableName="expense_categories"
          onRefresh={async () => {
            const updatedCategories = await fetchExpenseCategories();
            setCategories(updatedCategories);
          }}
        />
      )}

      {/* Paid Through Options Modal */}
      {showPaidThroughModal && (
        <OptionsModal
          title="Paid Through"
          items={paidThroughOptions.map(p => ({ id: p.id, name: p.name, sort_order: p.sort_order }))}
          onAdd={async (name: string) => {
            try {
              const newOption = await addExpensePaidThrough(name);
              const updatedOptions = await fetchExpensePaidThrough();
              setPaidThroughOptions(updatedOptions);
            } catch (error) {
              console.error('Error adding paid through option:', error);
              alert('Failed to add paid through option');
            }
          }}
          onDelete={async (id: number) => {
            try {
              await deleteExpensePaidThrough(id);
              const updatedOptions = await fetchExpensePaidThrough();
              setPaidThroughOptions(updatedOptions);
            } catch (error) {
              console.error('Error deleting paid through option:', error);
              alert('Failed to delete paid through option');
            }
          }}
          onClose={() => setShowPaidThroughModal(false)}
          tableName="expense_paid_through"
          onRefresh={async () => {
            const updatedOptions = await fetchExpensePaidThrough();
            setPaidThroughOptions(updatedOptions);
          }}
        />
      )}

      {/* Vendor Options Modal */}
      {showVendorModal && (
        <OptionsModal
          title="Vendors"
          items={vendors.map(v => ({ id: v.id, name: v.name, sort_order: v.sort_order }))}
          onAdd={async (name: string) => {
            try {
              const newVendor = await addExpenseVendor(name);
              const updatedVendors = await fetchExpenseVendors();
              setVendors(updatedVendors);
            } catch (error) {
              console.error('Error adding vendor:', error);
              alert('Failed to add vendor');
            }
          }}
          onDelete={async (id: number) => {
            try {
              await deleteExpenseVendor(id);
              const updatedVendors = await fetchExpenseVendors();
              setVendors(updatedVendors);
            } catch (error) {
              console.error('Error deleting vendor:', error);
              alert('Failed to delete vendor');
            }
          }}
          onClose={() => setShowVendorModal(false)}
          tableName="expense_vendors"
          onRefresh={async () => {
            const updatedVendors = await fetchExpenseVendors();
            setVendors(updatedVendors);
          }}
        />
      )}

      {/* Description Options Modal */}
      {showDescriptionModal && selectedCategoryId && (
        <OptionsModal
          title={`Descriptions for ${categories.find(c => c.id === selectedCategoryId)?.name || 'Category'}`}
          items={descriptions.map(d => ({ id: d.id, name: d.name, sort_order: d.sort_order }))}
          onAdd={async (name: string) => {
            try {
              const newDescription = await addExpenseDescription(name, selectedCategoryId);
              // Refresh all descriptions
              const allCats = await fetchExpenseCategories();
              const descPromises = allCats.map(cat => fetchExpenseDescriptions(cat.id));
              const descArrays = await Promise.all(descPromises);
              const allDesc = descArrays.flat();
              setAllDescriptions(allDesc);
            } catch (error) {
              console.error('Error adding description:', error);
              alert('Failed to add description');
            }
          }}
          onDelete={async (id: number) => {
            try {
              await deleteExpenseDescription(id);
              // Refresh all descriptions
              const allCats = await fetchExpenseCategories();
              const descPromises = allCats.map(cat => fetchExpenseDescriptions(cat.id));
              const descArrays = await Promise.all(descPromises);
              const allDesc = descArrays.flat();
              setAllDescriptions(allDesc);
            } catch (error) {
              console.error('Error deleting description:', error);
              alert('Failed to delete description');
            }
          }}
          onClose={() => setShowDescriptionModal(false)}
          tableName="expense_descriptions"
          onRefresh={async () => {
            const allCats = await fetchExpenseCategories();
            const descPromises = allCats.map(cat => fetchExpenseDescriptions(cat.id));
            const descArrays = await Promise.all(descPromises);
            const allDesc = descArrays.flat();
            setAllDescriptions(allDesc);
          }}
        />
          )}
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-3 mb-6 md:mb-3">
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Today's Expenses</div>
            <div className="text-2xl font-normal text-gray-800">
              Ksh. {(() => {
                const today = new Date().toISOString().split('T')[0];
                const todayTotal = expenses
                  .filter(e => e.expense_date === today)
                  .reduce((sum, e) => sum + e.amount, 0);
                return todayTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              })()}
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">This Week</div>
            <div className="text-2xl font-normal text-red-600">
              Ksh. {(() => {
                const today = new Date();
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                weekStart.setHours(0, 0, 0, 0);
                const weekTotal = expenses
                  .filter(e => {
                    const expenseDate = new Date(e.expense_date);
                    return expenseDate >= weekStart;
                  })
                  .reduce((sum, e) => sum + e.amount, 0);
                return weekTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              })()}
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">This Month</div>
            <div className="text-2xl font-normal text-red-600">
              Ksh. {(() => {
                const today = new Date();
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                const monthTotal = expenses
                  .filter(e => {
                    const expenseDate = new Date(e.expense_date);
                    return expenseDate >= monthStart;
                  })
                  .reduce((sum, e) => sum + e.amount, 0);
                return monthTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              })()}
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Top Category</div>
            <div className="text-lg font-normal text-blue-600">
              {(() => {
                const categoryTotals: Record<string, number> = {};
                expenses.forEach(e => {
                  const catName = e.category_name || 'Unknown';
                  categoryTotals[catName] = (categoryTotals[catName] || 0) + e.amount;
                });
                const topCategory = Object.entries(categoryTotals)
                  .sort(([, a], [, b]) => b - a)[0];
                return topCategory ? topCategory[0] : 'N/A';
              })()}
            </div>
          </div>
        </div>

        {/* Search, Filters, and Record Expense */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 md:mb-3">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by reference, category, description, or vendor..."
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button 
              onClick={() => setShowFilterModal(true)}
              className={`flex-shrink-0 flex items-center justify-center p-2 md:px-4 md:py-2 border rounded-lg ${
                hasActiveFilters 
                  ? 'border-blue-500 bg-blue-50 text-blue-600' 
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Filters</span>
              {hasActiveFilters && (
                <span className="ml-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  !
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setSelectedExpense(null);
                setPaymentStatus('Paid');
                setDueDate('');
                setDatePaid('');
                setExpenseDate(new Date().toISOString().split('T')[0]);
                setAmount(0);
                setAmountInput('');
                setPaymentReferenceNo('');
                setSelectedCategoryId(undefined);
                setSelectedDescriptionId(undefined);
                setSelectedVendorId(undefined);
                setSelectedPaidThroughId(undefined);
                setShowForm(true);
              }}
              className="flex-shrink-0 bg-blue-600 text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
            >
              <Plus className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">Record Expense</span>
            </button>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Bulk Actions Bar */}
          {selectedExpenses.size > 0 && (
            <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-600">
                  {selectedExpenses.size} selected
                </span>
                <button
                  onClick={() => setSelectedExpenses(new Set(filteredExpenses.map(e => e.id)))}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Select All ({filteredExpenses.length})
                </button>
                <button
                  onClick={() => setSelectedExpenses(new Set())}
                  className="text-xs text-gray-600 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
              <button
                onClick={handleVoidSelected}
                className="text-xs text-red-600 hover:text-red-700 font-medium px-3 py-1 bg-red-50 hover:bg-red-100 rounded transition-colors"
              >
                Void Selected
              </button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="pl-3 pr-2 py-3 text-left w-10">
                    {/* Empty header for checkbox column */}
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid Through
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loadingExpenses ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                      Loading expenses...
                    </td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                      No expenses found
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((expense) => {
                  const status = getExpenseStatus(expense);
                  const statusClasses = {
                    'Paid': 'bg-green-100 text-green-800',
                    'Pending Payment': 'bg-yellow-100 text-yellow-800',
                    'Payment Overdue': 'bg-red-100 text-red-800'
                  };
                  const isHovered = hoveredRow === expense.id;
                  const isSelected = selectedExpenses.has(expense.id);
                  const hasSelections = selectedExpenses.size > 0;
                  
                  return (
                    <tr 
                      key={expense.id} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onMouseEnter={() => setHoveredRow(expense.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      onClick={() => setExpenseToDisplay(expense)}
                    >
                      {/* Checkbox column */}
                      <td 
                        className="pl-3 pr-2 py-4 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedExpenses(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(expense.id)) {
                                newSet.delete(expense.id);
                              } else {
                                newSet.add(expense.id);
                              }
                              return newSet;
                            });
                          }}
                          className={`w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 transition-opacity cursor-pointer ${
                            isHovered || hasSelections
                              ? 'opacity-100'
                              : 'opacity-0'
                          }`}
                        />
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap">
                      <div>
                          <div className="text-sm font-medium text-gray-900">{expense.expense_date}</div>
                          <div className="text-sm text-gray-500">{expense.internal_reference}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {expense.category_name || 'N/A'}
                      </span>
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.description_name || 'N/A'}
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-red-600">Ksh. {expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.paid_through_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.vendor_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>
                          {status}
                        </span>
                    </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleVoidExpense(expense.id)}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-300 rounded-lg transition-colors"
                          title="Void Expense"
                        >
                          Void
                        </button>
                      </td>
                    </tr>
                  );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expense Display Modal */}
        {expenseToDisplay && (
          <ExpenseDisplay
            expense={expenseToDisplay}
            onClose={() => setExpenseToDisplay(null)}
            onMarkAsPaid={handleMarkAsPaid}
          />
        )}

        {/* Filter Modal */}
        {showFilterModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <style>
              {`
                .scrollbar-hide::-webkit-scrollbar {
                  display: none;
                }
                .scrollbar-hide {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
              `}
            </style>
            <div 
              ref={filterContainerRef}
              onMouseEnter={() => setIsFilterHovering(true)}
              onMouseLeave={() => setIsFilterHovering(false)}
              className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Filter Expenses</h2>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Date Range Filter */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                    <input
                      type="date"
                      value={filterDateFrom || ''}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                    <input
                      type="date"
                      value={filterDateTo || ''}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={filterCategoryId || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : undefined;
                      setFilterCategoryId(value);
                      if (!value) {
                        setFilterDescriptionId(undefined); // Clear description when category is cleared
                      }
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <select
                    value={filterDescriptionId || ''}
                    onChange={(e) => setFilterDescriptionId(e.target.value ? parseInt(e.target.value) : undefined)}
                    disabled={!filterCategoryId}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">{filterCategoryId ? 'All Descriptions' : 'Select category first'}</option>
                    {filterCategoryId && allDescriptions
                      .filter(d => d.category_id === filterCategoryId)
                      .map(description => (
                        <option key={description.id} value={description.id}>
                          {description.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Vendor Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                  <select
                    value={filterVendorId || ''}
                    onChange={(e) => setFilterVendorId(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Vendors</option>
                    {vendors.map(vendor => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Paid Through Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paid Through</label>
                  <select
                    value={filterPaidThroughId || ''}
                    onChange={(e) => setFilterPaidThroughId(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Payment Methods</option>
                    {paidThroughOptions.map(paidThrough => (
                      <option key={paidThrough.id} value={paidThrough.id}>
                        {paidThrough.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                    value={filterStatus || ''}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Statuses</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending Payment">Pending Payment</option>
                    <option value="Payment Overdue">Payment Overdue</option>
                  </select>
                </div>

                {/* Amount Range Filter */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount Min (Ksh)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={filterAmountMin || ''}
                      onChange={(e) => setFilterAmountMin(e.target.value)}
                      placeholder="0.00"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount Max (Ksh)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={filterAmountMax || ''}
                      onChange={(e) => setFilterAmountMax(e.target.value)}
                      placeholder="0.00"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFilterModal(false)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};