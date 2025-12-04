import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Download, Check, X, ChevronDown, RotateCcw, Loader2 } from 'lucide-react';
import { 
  fetchInvoices, 
  fetchStudents,
  fetchPayments,
  fetchPaymentMethods,
  updatePaymentMethod,
  fetchAccounts,
  updateAccount,
  fetchStudentInvoicesForPayment,
  createPayment,
  updatePayment,
  deletePayment,
  fetchFullPayment
} from '../../services/financialService';
import { StudentInfo, Payment, PaymentMethod, Account, InvoiceHeader, PaymentSubmissionData } from '../../types/database';
import { OptionsModal } from '../Students/masterlist/OptionsModal';
import { supabase } from '../../supabaseClient';

// Helper function to format dates
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

// Receipt Preview Component
const ReceiptPreview: React.FC<{ payment: Payment; onClose: () => void }> = ({ payment, onClose }) => {
  const [isHovering, setIsHovering] = useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

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
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Receipt</h1>
            <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
        </div>

          {/* Receipt Details */}
          <div className="space-y-6 mb-8">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Receipt Number</p>
                <p className="text-lg font-semibold text-gray-900">{payment.receipt_number}</p>
              </div>
            <div>
                <p className="text-sm text-gray-500 mb-1">Date</p>
                <p className="text-lg font-semibold text-gray-900">{formatDate(payment.payment_date)}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Student</p>
                <p className="text-lg font-semibold text-gray-900">{payment.student_name}</p>
                <p className="text-sm text-gray-600">Admission: {payment.admission_number}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg text-gray-700">Amount Paid</span>
                <span className="text-3xl font-bold text-green-600">Ksh. {payment.amount.toLocaleString()}</span>
          </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
            <div>
                <p className="text-sm text-gray-500 mb-1">Payment Method</p>
                <p className="text-base font-medium text-gray-900">{payment.payment_method_name || 'N/A'}</p>
          </div>
            <div>
                <p className="text-sm text-gray-500 mb-1">Reference Number</p>
                <p className="text-base font-medium text-gray-900">{payment.reference_number || 'N/A'}</p>
              </div>
            </div>

            {payment.notes && (
            <div>
                <p className="text-sm text-gray-500 mb-1">Notes</p>
                <p className="text-base text-gray-900">{payment.notes}</p>
              </div>
            )}
          </div>

          {/* Footer with Payment Details */}
          <div className="border-t border-gray-200 pt-6 mt-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Payment Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Account:</span>
                  <span className="text-gray-900 font-medium">{payment.account_name || 'N/A'}</span>
                </div>
                {payment.reference_number && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction Reference:</span>
                    <span className="text-gray-900 font-medium">{payment.reference_number}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="text-gray-900 font-medium">{payment.payment_method_name || 'N/A'}</span>
                </div>
            </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={() => {
                // Download functionality would go here
                window.print();
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PaymentsReceived: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [selectedPayments, setSelectedPayments] = useState<Set<number>>(new Set());
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentAmountInput, setPaymentAmountInput] = useState<string>('');
  const [invoiceAllocations, setInvoiceAllocations] = useState<Record<string, number>>({});
  const [invoiceAllocationInputs, setInvoiceAllocationInputs] = useState<Record<string, string>>({});
  const [originalAllocations, setOriginalAllocations] = useState<Record<string, number>>({});
  const [selectedAccount, setSelectedAccount] = useState<number | undefined>(undefined);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [accountSearchTerm, setAccountSearchTerm] = useState('');
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  
  // Outstanding fees calculation
  const [outstandingFees, setOutstandingFees] = useState<number>(0);
  
  // Student search state
  const [allStudents, setAllStudents] = useState<StudentInfo[]>([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [isStudentSearching, setIsStudentSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const studentDropdownRef = useRef<HTMLDivElement>(null);
  
  // Payment method state (similar to account)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<number | undefined>(undefined);
  const [paymentMethodDropdownOpen, setPaymentMethodDropdownOpen] = useState(false);
  const [paymentMethodSearchTerm, setPaymentMethodSearchTerm] = useState('');
  const paymentMethodDropdownRef = useRef<HTMLDivElement>(null);
  
  // Database data
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [studentInvoices, setStudentInvoices] = useState<InvoiceHeader[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingStudentInvoices, setLoadingStudentInvoices] = useState(false);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modal states
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterStudent, setFilterStudent] = useState<StudentInfo | null>(null);
  const [filterStudentQuery, setFilterStudentQuery] = useState('');
  const [isFilterStudentSearching, setIsFilterStudentSearching] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterAmountMin, setFilterAmountMin] = useState<string>('');
  const [filterAmountMax, setFilterAmountMax] = useState<string>('');
  const [filterAccount, setFilterAccount] = useState<number | undefined>(undefined);
  const filterStudentDropdownRef = useRef<HTMLDivElement>(null);
  const filterContainerRef = useRef<HTMLDivElement>(null);
  const [isFilterHovering, setIsFilterHovering] = useState(false);

  // Auto-allocate payment based on priority (oldest due date first)
  const autoAllocatePayment = useCallback((amount: number, invoices: InvoiceHeader[]) => {
    console.log('🟡 [DEBUG] autoAllocatePayment called with amount:', amount, 'invoices:', invoices.length);
    const allocations: Record<string, number> = {};
    const allocationInputs: Record<string, string> = {};
    let remaining = amount;

    for (const invoice of invoices) {
      if (remaining <= 0) break;
      const allocation = Math.min(remaining, invoice.balanceDue);
      allocations[invoice.invoice_number] = allocation;
      allocationInputs[invoice.invoice_number] = allocation === 0 ? '' : allocation.toString();
      remaining -= allocation;
    }

    console.log('🟡 [DEBUG] Setting allocations:', allocations);
    setInvoiceAllocations(allocations);
    setInvoiceAllocationInputs(allocationInputs);
    setOriginalAllocations({ ...allocations }); // Store original for reallocate button
  }, []);

  // Handle payment amount input (only update input value, no recalculation)
  const handlePaymentAmountInputChange = useCallback((value: string) => {
    console.log('🔵 [DEBUG] Payment amount input onChange:', value);
    setPaymentAmountInput(value);
  }, []); // Empty deps - only setState, no external dependencies

  // Handle payment amount blur (recalculate on blur)
  const handlePaymentAmountBlur = useCallback(() => {
    console.log('🟢 [DEBUG] Payment amount onBlur triggered');
    // Get current input value directly from state
    setPaymentAmountInput(prev => {
      const value = parseFloat(prev) || 0;
      console.log('🟢 [DEBUG] Parsed value:', value);
      console.log('🟢 [DEBUG] About to call setPaymentAmount and autoAllocatePayment');
      
      // Update calculated values
      setPaymentAmount(value);
      if (studentInvoices.length > 0) {
        autoAllocatePayment(value, studentInvoices);
      }
      
      // Return synced value
      return value === 0 ? '' : value.toString();
    });
    console.log('🟢 [DEBUG] After setPaymentAmount and autoAllocatePayment');
  }, [autoAllocatePayment, studentInvoices]); // Include dependencies

  // Handle invoice allocation input (only update input value, no recalculation)
  const handleAllocationInputChange = useCallback((invoiceNumber: string, value: string) => {
    console.log('🔵 [DEBUG] Invoice allocation input onChange:', invoiceNumber, value);
    // Use functional update - don't log inside to prevent extra renders
    setInvoiceAllocationInputs(prev => ({
      ...prev,
      [invoiceNumber]: value
    }));
  }, []); // Empty deps - uses functional update

  // Handle invoice allocation blur (recalculate on blur)
  const handleAllocationBlur = useCallback((invoiceNumber: string) => {
    console.log('🟢 [DEBUG] Invoice allocation onBlur triggered:', invoiceNumber);
    setInvoiceAllocationInputs(prev => {
      const inputValue = prev[invoiceNumber] || '';
      const invoice = studentInvoices.find(inv => inv.invoice_number === invoiceNumber);
      if (!invoice) return prev;

      const value = parseFloat(inputValue) || 0;
      const maxAllocation = invoice.balanceDue;
      const newValue = Math.min(Math.max(0, value), maxAllocation);
      
      console.log('🟢 [DEBUG] Calculated new value:', newValue);
      console.log('🟢 [DEBUG] About to update invoiceAllocations');
      
      // Update calculated allocation
      setInvoiceAllocations(prevAlloc => {
        const newState = {
          ...prevAlloc,
          [invoiceNumber]: newValue
        };
        console.log('🟢 [DEBUG] New invoiceAllocations state:', newState);
        return newState;
      });
      
      // Return synced input value
      return {
        ...prev,
        [invoiceNumber]: newValue === 0 ? '' : newValue.toString()
      };
    });
    console.log('🟢 [DEBUG] After updating allocations');
  }, [studentInvoices]); // Only studentInvoices as dep (memoized)

  const handleReallocate = () => {
    if (studentInvoices.length > 0) {
      autoAllocatePayment(paymentAmount, studentInvoices);
    }
    // Also sync the payment amount input
    setPaymentAmountInput(paymentAmount === 0 ? '' : paymentAmount.toString());
  };

  // Handle form submission
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudent) {
      alert('Please select a student');
      return;
    }

    if (!selectedPaymentMethod) {
      alert('Please select a payment method');
      return;
    }

    if (!selectedAccount) {
      alert('Please select an account');
      return;
    }

    if (paymentAmount <= 0) {
      alert('Payment amount must be greater than 0');
      return;
    }

    const totalAllocated = Object.values(invoiceAllocations).reduce((sum, val) => sum + val, 0);
    const overpayment = paymentAmount - totalAllocated;
    
    if (overpayment < 0) {
      alert('Cannot submit payment with negative overpayment. Please adjust allocations.');
      return;
    }

    setIsSubmitting(true);
    try {
      const paymentData: PaymentSubmissionData = {
        admission_number: selectedStudent.admission_number,
        student_name: selectedStudent.name,
        payment_date: paymentDate,
        amount: paymentAmount,
        payment_method_id: selectedPaymentMethod,
        account_id: selectedAccount,
        reference_number: referenceNumber || null,
        notes: notes || null,
        allocations: Object.entries(invoiceAllocations)
          .filter(([_, amount]) => amount > 0)
          .map(([invoice_number, allocated_amount]) => ({
            invoice_number,
            allocated_amount: parseFloat(allocated_amount.toString()) // Ensure it's a number
          }))
      };

      if (selectedPayment) {
        // Update existing payment
        await updatePayment(selectedPayment.id, paymentData);
        alert('Payment updated successfully!');
      } else {
        // Create new payment
        await createPayment(paymentData);
        alert('Payment recorded successfully!');
      }

      // Refresh payments list
      const paymentsData = await fetchPayments();
      setPayments(paymentsData);

      // Reset form
      setShowForm(false);
      setSelectedPayment(null);
      setSelectedStudent(null);
      setStudentSearchQuery('');
      setPaymentAmount(0);
      setPaymentAmountInput('');
      setInvoiceAllocations({});
      setInvoiceAllocationInputs({});
      setOriginalAllocations({});
      setSelectedAccount(undefined);
      setSelectedPaymentMethod(undefined);
      setReferenceNumber('');
      setNotes('');
      setPaymentDate(new Date().toISOString().split('T')[0]);

      // Refresh outstanding fees
      const invoices = await fetchInvoices();
      const nonForwardedInvoices = invoices.filter(i => i.status !== 'Forwarded');
      const outstanding = nonForwardedInvoices
        .filter(i => i.status === 'Pending')
        .reduce((sum, invoice) => sum + invoice.balanceDue, 0);
      setOutstandingFees(outstanding);
    } catch (error) {
      console.error('Error submitting payment:', error);
      alert('Failed to save payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle payment edit
  const handleEditPayment = async (payment: Payment) => {
    try {
      const fullPayment = await fetchFullPayment(payment.id);
      if (!fullPayment) {
        alert('Failed to load payment details');
        return;
      }

      // Find student
      const student = allStudents.find(s => s.admission_number === payment.admission_number);
      if (student) {
        setSelectedStudent(student);
        setStudentSearchQuery(`${student.name} (${student.admission_number})`);
      }

      setSelectedPayment(fullPayment);
      setPaymentAmount(fullPayment.amount);
      setPaymentAmountInput(fullPayment.amount.toString());
      setPaymentDate(fullPayment.payment_date);
      setSelectedPaymentMethod(fullPayment.payment_method_id);
      setSelectedAccount(fullPayment.account_id);
      setReferenceNumber(fullPayment.reference_number || '');
      setNotes(fullPayment.notes || '');

      // Set allocations
      const allocations: Record<string, number> = {};
      const allocationInputs: Record<string, string> = {};
      fullPayment.allocations.forEach(allocation => {
        allocations[allocation.invoice_number] = allocation.allocated_amount;
        allocationInputs[allocation.invoice_number] = allocation.allocated_amount.toString();
      });
      setInvoiceAllocations(allocations);
      setInvoiceAllocationInputs(allocationInputs);
      setOriginalAllocations(allocations);

      setShowForm(true);
    } catch (error) {
      console.error('Error loading payment:', error);
      alert('Failed to load payment details');
    }
  };

  // Handle payment delete
  const handleDeletePayment = async (paymentId: number) => {
    if (!confirm('Are you sure you want to delete this payment?')) {
      return;
    }

    try {
      await deletePayment(paymentId);
      alert('Payment deleted successfully!');
      
      // Refresh payments list
      const paymentsData = await fetchPayments();
      setPayments(paymentsData);

      // Refresh outstanding fees
      const invoices = await fetchInvoices();
      const nonForwardedInvoices = invoices.filter(i => i.status !== 'Forwarded');
      const outstanding = nonForwardedInvoices
        .filter(i => i.status === 'Pending')
        .reduce((sum, invoice) => sum + invoice.balanceDue, 0);
      setOutstandingFees(outstanding);
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('Failed to delete payment. Please try again.');
    }
  };

  // Handle payment void
  const handleVoidPayment = async (paymentId: number) => {
    if (!confirm('Are you sure you want to void this payment? This action cannot be undone.')) {
      return;
    }

    try {
      await deletePayment(paymentId);
      alert('Payment voided successfully!');
      
      // Refresh payments list
      const paymentsData = await fetchPayments();
      setPayments(paymentsData);

      // Refresh outstanding fees
      const invoices = await fetchInvoices();
      const nonForwardedInvoices = invoices.filter(i => i.status !== 'Forwarded');
      const outstanding = nonForwardedInvoices
        .filter(i => i.status === 'Pending')
        .reduce((sum, invoice) => sum + invoice.balanceDue, 0);
      setOutstandingFees(outstanding);
    } catch (error) {
      console.error('Error voiding payment:', error);
      alert('Failed to void payment. Please try again.');
    }
  };

  // Handle bulk void
  const handleVoidSelected = async () => {
    if (selectedPayments.size === 0) return;
    
    if (!confirm(`Are you sure you want to void ${selectedPayments.size} payment(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      await Promise.all(Array.from(selectedPayments).map(id => deletePayment(id)));
      alert(`${selectedPayments.size} payment(s) voided successfully!`);
      
      setSelectedPayments(new Set());
      
      // Refresh payments list
      const paymentsData = await fetchPayments();
      setPayments(paymentsData);

      // Refresh outstanding fees
      const invoices = await fetchInvoices();
      const nonForwardedInvoices = invoices.filter(i => i.status !== 'Forwarded');
      const outstanding = nonForwardedInvoices
        .filter(i => i.status === 'Pending')
        .reduce((sum, invoice) => sum + invoice.balanceDue, 0);
      setOutstandingFees(outstanding);
    } catch (error) {
      console.error('Error voiding payments:', error);
      alert('Failed to void payments. Please try again.');
    }
  };

  // Close account dropdown when clicking outside
  useEffect(() => {
    if (!accountDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
        setAccountDropdownOpen(false);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [accountDropdownOpen]);

  const toggleSelection = (paymentId: number) => {
    setSelectedPayments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(paymentId)) {
        newSet.delete(paymentId);
      } else {
        newSet.add(paymentId);
      }
      return newSet;
    });
  };

  const hasSelections = selectedPayments.size > 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Calculate these outside PaymentForm to prevent recalculation on every render
  const totalAllocated = useMemo(() => {
    const total = Object.values(invoiceAllocations).reduce((sum, val) => sum + val, 0);
    console.log('🟣 [DEBUG] totalAllocated calculated:', total);
    return total;
  }, [invoiceAllocations]);
  
  const overpayment = useMemo(() => {
    const over = paymentAmount - totalAllocated;
    console.log('🟣 [DEBUG] overpayment calculated:', over);
    return over;
  }, [paymentAmount, totalAllocated]);

  const formScrollRef = useRef<number>(0);
  const formContainerRef = useRef<HTMLDivElement>(null);
  const [isFormHovering, setIsFormHovering] = useState(false);

  // Keyboard navigation for scrolling in payment form
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
  
  const canSubmit = overpayment >= 0;

  // Fetch outstanding fees on mount
  useEffect(() => {
    const fetchOutstandingFees = async () => {
      try {
        const invoices = await fetchInvoices();
        // Exclude Forwarded invoices and calculate Outstanding Fees (Pending invoices' balanceDue)
        const nonForwardedInvoices = invoices.filter(i => i.status !== 'Forwarded');
        const outstanding = nonForwardedInvoices
          .filter(i => i.status === 'Pending')
          .reduce((sum, invoice) => sum + invoice.balanceDue, 0);
        setOutstandingFees(outstanding);
      } catch (error) {
        console.error('Error fetching outstanding fees:', error);
        setOutstandingFees(0);
      }
    };
    fetchOutstandingFees();
  }, []);

  // Fetch students on mount
  useEffect(() => {
    const loadStudents = async () => {
      setLoadingStudents(true);
      try {
        const students = await fetchStudents();
        setAllStudents(students);
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setLoadingStudents(false);
      }
    };
    loadStudents();
  }, []);

  // Fetch payment methods on mount
  useEffect(() => {
    const loadPaymentMethods = async () => {
      setLoadingPaymentMethods(true);
      try {
        const methods = await fetchPaymentMethods();
        setPaymentMethods(methods);
      } catch (error) {
        console.error('Error fetching payment methods:', error);
      } finally {
        setLoadingPaymentMethods(false);
      }
    };
    loadPaymentMethods();
  }, []);

  // Fetch accounts on mount
  useEffect(() => {
    const loadAccounts = async () => {
      setLoadingAccounts(true);
      try {
        const accountsData = await fetchAccounts();
        setAccounts(accountsData);
      } catch (error) {
        console.error('Error fetching accounts:', error);
      } finally {
        setLoadingAccounts(false);
      }
    };
    loadAccounts();
  }, []);

  // Fetch payments on mount
  useEffect(() => {
    const loadPayments = async () => {
      setLoadingPayments(true);
      try {
        const paymentsData = await fetchPayments();
        setPayments(paymentsData);
      } catch (error) {
        console.error('Error fetching payments:', error);
        setPayments([]);
      } finally {
        setLoadingPayments(false);
      }
    };
    loadPayments();
  }, []);

  // Fetch student invoices when student is selected
  useEffect(() => {
    const loadStudentInvoices = async () => {
      if (!selectedStudent) {
        setStudentInvoices([]);
        setInvoiceAllocations({});
        setInvoiceAllocationInputs({});
        return;
      }

      setLoadingStudentInvoices(true);
      try {
        const invoices = await fetchStudentInvoicesForPayment(selectedStudent.admission_number);
        setStudentInvoices(invoices);
        
        // Auto-allocate if payment amount is already set
        if (paymentAmount > 0 && invoices.length > 0) {
          const allocations: Record<string, number> = {};
          const allocationInputs: Record<string, string> = {};
          let remaining = paymentAmount;

          for (const invoice of invoices) {
            if (remaining <= 0) break;
            const allocation = Math.min(remaining, invoice.balanceDue);
            allocations[invoice.invoice_number] = allocation;
            allocationInputs[invoice.invoice_number] = allocation === 0 ? '' : allocation.toString();
            remaining -= allocation;
          }

          setInvoiceAllocations(allocations);
          setInvoiceAllocationInputs(allocationInputs);
          setOriginalAllocations({ ...allocations });
        } else {
          // Clear allocations if no amount or no invoices
          setInvoiceAllocations({});
          setInvoiceAllocationInputs({});
        }
      } catch (error) {
        console.error('Error fetching student invoices:', error);
        setStudentInvoices([]);
        setInvoiceAllocations({});
        setInvoiceAllocationInputs({});
      } finally {
        setLoadingStudentInvoices(false);
      }
    };
    loadStudentInvoices();
  }, [selectedStudent, paymentAmount]); // Only depend on selectedStudent and paymentAmount

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!studentSearchQuery || loadingStudents) return [];
    return allStudents.filter(student => 
      student.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      student.admission_number.toLowerCase().includes(studentSearchQuery.toLowerCase())
    );
  }, [allStudents, studentSearchQuery, loadingStudents]);

  // Handle student selection
  const handleSelectStudent = (student: StudentInfo) => {
    setSelectedStudent(student);
    setStudentSearchQuery(`${student.name} (${student.admission_number})`);
    setIsStudentSearching(false);
  };

  // Close student dropdown when clicking outside
  useEffect(() => {
    if (!isStudentSearching) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (studentDropdownRef.current && !studentDropdownRef.current.contains(event.target as Node)) {
        setIsStudentSearching(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isStudentSearching]);

  // Close payment method dropdown when clicking outside
  useEffect(() => {
    if (!paymentMethodDropdownOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (paymentMethodDropdownRef.current && !paymentMethodDropdownRef.current.contains(event.target as Node)) {
        setPaymentMethodDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [paymentMethodDropdownOpen]);

  // Filter students for filter modal
  const filteredStudentsForFilter = useMemo(() => {
    if (!filterStudentQuery || loadingStudents) return [];
    return allStudents.filter(student => 
      student.name.toLowerCase().includes(filterStudentQuery.toLowerCase()) ||
      student.admission_number.toLowerCase().includes(filterStudentQuery.toLowerCase())
    );
  }, [allStudents, filterStudentQuery, loadingStudents]);

  // Handle filter student selection
  const handleSelectFilterStudent = (student: StudentInfo) => {
    setFilterStudent(student);
    setFilterStudentQuery(`${student.name} (${student.admission_number})`);
    setIsFilterStudentSearching(false);
  };

  // Close filter student dropdown when clicking outside
  useEffect(() => {
    if (!isFilterStudentSearching) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (filterStudentDropdownRef.current && !filterStudentDropdownRef.current.contains(event.target as Node)) {
        setIsFilterStudentSearching(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterStudentSearching]);

  // Filter payments based on search and filters
  const filteredPayments = useMemo(() => {
    let filtered = [...payments];

    // Apply search query (receipt number, student name, admission number)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(payment =>
        payment.receipt_number.toLowerCase().includes(query) ||
        payment.student_name.toLowerCase().includes(query) ||
        payment.admission_number.toLowerCase().includes(query)
      );
    }

    // Apply student filter
    if (filterStudent) {
      filtered = filtered.filter(payment =>
        payment.admission_number === filterStudent.admission_number
      );
    }

    // Apply date range filter
    if (filterDateFrom) {
      filtered = filtered.filter(payment => payment.payment_date >= filterDateFrom);
    }
    if (filterDateTo) {
      filtered = filtered.filter(payment => payment.payment_date <= filterDateTo);
    }

    // Apply amount range filter
    if (filterAmountMin) {
      const min = parseFloat(filterAmountMin);
      if (!isNaN(min)) {
        filtered = filtered.filter(payment => payment.amount >= min);
      }
    }
    if (filterAmountMax) {
      const max = parseFloat(filterAmountMax);
      if (!isNaN(max)) {
        filtered = filtered.filter(payment => payment.amount <= max);
      }
    }

    // Apply account filter
    if (filterAccount !== undefined) {
      filtered = filtered.filter(payment => payment.account_id === filterAccount);
    }

    return filtered;
  }, [payments, searchQuery, filterStudent, filterDateFrom, filterDateTo, filterAmountMin, filterAmountMax, filterAccount]);

  // Check if any filters are active
  const hasActiveFilters = filterStudent !== null || filterDateFrom || filterDateTo || filterAmountMin || filterAmountMax || filterAccount !== undefined;

  // Clear all filters
  const clearFilters = () => {
    setFilterStudent(null);
    setFilterStudentQuery('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterAmountMin('');
    setFilterAmountMax('');
    setFilterAccount(undefined);
  };

  return (
    <div className="p-6 md:p-3 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-3 mb-6 md:mb-3">
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Today's Payments</div>
            <div className="text-2xl font-normal text-gray-800">
              Ksh. {(() => {
                const today = new Date().toISOString().split('T')[0];
                return payments
                  .filter(p => p.payment_date === today)
                  .reduce((sum, p) => sum + p.amount, 0)
                  .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              })()}
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">This Week</div>
            <div className="text-2xl font-normal text-green-600">
              Ksh. {(() => {
                const today = new Date();
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                weekStart.setHours(0, 0, 0, 0);
                return payments
                  .filter(p => {
                    const paymentDate = new Date(p.payment_date);
                    return paymentDate >= weekStart;
                  })
                  .reduce((sum, p) => sum + p.amount, 0)
                  .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              })()}
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">This Month</div>
            <div className="text-2xl font-normal text-blue-600">
              Ksh. {(() => {
                const today = new Date();
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                return payments
                  .filter(p => {
                    const paymentDate = new Date(p.payment_date);
                    return paymentDate >= monthStart;
                  })
                  .reduce((sum, p) => sum + p.amount, 0)
                  .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              })()}
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Outstanding</div>
            <div className="text-2xl font-normal text-red-600">
              Ksh. {outstandingFees.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Search, Filters, and Record Payment */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 md:mb-3">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Receipt number, Student name, or Admission number..."
                value={searchQuery}
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
              onClick={() => setShowForm(true)}
              className="flex-shrink-0 bg-blue-600 text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
            >
              <Plus className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">Record Payment</span>
            </button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {hasSelections && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-between mb-4 rounded-t-lg">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedPayments.size} payment(s) selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleVoidSelected}
                className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                Void Selected
              </button>
              <button
                onClick={() => setSelectedPayments(new Set())}
                className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Payments Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="pl-3 pr-2 py-3 text-left w-10">
                    {/* Empty header for checkbox column */}
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receipt Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loadingPayments ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      Loading payments...
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      {hasActiveFilters || searchQuery ? 'No payments match your search/filters' : 'No payments found'}
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => {
                    const isHovered = hoveredRow === payment.id;
                    const isSelected = selectedPayments.has(payment.id);

                    return (
                      <tr
                        key={payment.id}
                        onMouseEnter={() => setHoveredRow(payment.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        onClick={() => setSelectedReceipt(payment)}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        {/* Checkbox column */}
                        <td
                          className="pl-3 pr-2 py-4 whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelection(payment.id)}
                            className={`w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 transition-opacity cursor-pointer ${
                              isHovered || hasSelections
                                ? 'opacity-100'
                                : 'opacity-0'
                            }`}
                          />
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{payment.receipt_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{payment.student_name}</div>
                          <div className="text-sm text-gray-500">Adm: {payment.admission_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-green-600">
                            Ksh. {payment.amount.toLocaleString()}
                      </div>
                          <div className="text-sm text-gray-500">{payment.payment_method_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{formatDate(payment.payment_date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.account_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.reference_number || '-'}
                    </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                            <button
                            onClick={() => handleVoidPayment(payment.id)}
                            className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-300 rounded-lg transition-colors"
                            title="Void Payment"
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
              className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  {selectedPayment ? 'Edit Payment' : 'Record New Payment'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setSelectedPayment(null);
                    setPaymentAmount(0);
                    setPaymentAmountInput('');
                    setInvoiceAllocations({});
                    setInvoiceAllocationInputs({});
                    setOriginalAllocations({});
                    setSelectedAccount(undefined);
                    setAccountSearchTerm('');
                    setAccountDropdownOpen(false);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form 
                className="space-y-6"
                onSubmit={handleSubmitPayment}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative" ref={studentDropdownRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder={loadingStudents ? "Loading students..." : "Search by Name or Adm number"}
                        value={studentSearchQuery}
                        onChange={(e) => {
                          setStudentSearchQuery(e.target.value);
                          setIsStudentSearching(true);
                          if (!e.target.value) {
                            setSelectedStudent(null);
                          }
                        }}
                        onFocus={() => setIsStudentSearching(true)}
                        className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={loadingStudents}
                      />
                      {selectedStudent && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudent(null);
                            setStudentSearchQuery('');
                          }}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {isStudentSearching && studentSearchQuery.length > 0 && (
                      <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                        {filteredStudents.length > 0 ? (
                          filteredStudents.map(student => (
                            <li
                              key={student.admission_number}
                              onMouseDown={() => handleSelectStudent(student)}
                              className="p-3 cursor-pointer hover:bg-blue-50 flex justify-between items-center"
                            >
                              <span className="font-medium text-gray-900">{student.name}</span>
                              <span className="text-sm text-gray-500">{student.admission_number}</span>
                            </li>
                          ))
                        ) : (
                          <li className="p-3 text-gray-500 italic">No students found matching "{studentSearchQuery}".</li>
                        )}
                      </ul>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={paymentAmountInput}
                      onChange={(e) => handlePaymentAmountInputChange(e.target.value)}
                      onBlur={handlePaymentAmountBlur}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="relative" ref={paymentMethodDropdownRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                      <div
                        className={`flex-1 px-3 py-3 cursor-pointer ${
                          paymentMethods.find(m => m.id === selectedPaymentMethod) ? 'text-gray-900' : 'text-gray-400'
                        }`}
                        onClick={() => setPaymentMethodDropdownOpen(o => !o)}
                      >
                        {paymentMethods.find(m => m.id === selectedPaymentMethod)?.name || 'Select payment method...'}
                      </div>
                      <button
                        type="button"
                        className="px-3 text-gray-500 hover:bg-gray-50"
                        onClick={() => setPaymentMethodDropdownOpen(o => !o)}
                      >
                        <ChevronDown
                          className={`w-4 h-4 transform transition-transform ${
                            paymentMethodDropdownOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPaymentMethodModal(true)}
                        className="flex items-center px-3 border-l border-gray-300 text-gray-500 hover:bg-gray-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {paymentMethodDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-b-lg shadow-lg">
                        <input
                          type="text"
                          value={paymentMethodSearchTerm}
                          onChange={e => setPaymentMethodSearchTerm(e.target.value)}
                          placeholder="Search payment methods..."
                          className="w-full px-3 py-2 border-b border-gray-300 focus:outline-none"
                        />
                        <ul className="max-h-60 overflow-auto text-gray-900">
                          {loadingPaymentMethods ? (
                            <li className="px-3 py-2 text-gray-500 text-center">Loading...</li>
                          ) : paymentMethods.length === 0 ? (
                            <li className="px-3 py-2 text-gray-500 text-center">No payment methods found</li>
                          ) : (
                            paymentMethods.filter(method =>
                              method.name.toLowerCase().includes(paymentMethodSearchTerm.toLowerCase())
                            ).map(method => (
                              <li
                                key={method.id}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => {
                                  setSelectedPaymentMethod(method.id);
                                  setPaymentMethodDropdownOpen(false);
                                  setPaymentMethodSearchTerm('');
                                }}
                              >
                                {method.name}
                              </li>
                            ))
                          )}
                        </ul>
                        {selectedPaymentMethod && (
                          <div className="border-t border-gray-300 bg-gray-50">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPaymentMethod(undefined);
                                setPaymentMethodDropdownOpen(false);
                                setPaymentMethodSearchTerm('');
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                              Clear my choice
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative" ref={accountDropdownRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                      <div
                        className={`flex-1 px-3 py-3 cursor-pointer ${
                          accounts.find(a => a.id === selectedAccount) ? 'text-gray-900' : 'text-gray-400'
                        }`}
                        onClick={() => setAccountDropdownOpen(o => !o)}
                      >
                        {accounts.find(a => a.id === selectedAccount)?.name || 'Select account...'}
                      </div>
                      <button
                        type="button"
                        className="px-3 text-gray-500 hover:bg-gray-50"
                        onClick={() => setAccountDropdownOpen(o => !o)}
                      >
                        <ChevronDown
                          className={`w-4 h-4 transform transition-transform ${
                            accountDropdownOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAccountModal(true)}
                        className="flex items-center px-3 border-l border-gray-300 text-gray-500 hover:bg-gray-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {accountDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-b-lg shadow-lg">
                        <input
                          type="text"
                          value={accountSearchTerm}
                          onChange={e => setAccountSearchTerm(e.target.value)}
                          placeholder="Search accounts..."
                          className="w-full px-3 py-2 border-b border-gray-300 focus:outline-none"
                        />
                        <ul className="max-h-60 overflow-auto text-gray-900">
                          {loadingAccounts ? (
                            <li className="px-3 py-2 text-gray-500 text-center">Loading...</li>
                          ) : accounts.length === 0 ? (
                            <li className="px-3 py-2 text-gray-500 text-center">No accounts found</li>
                          ) : (
                            accounts.filter(acc =>
                              acc.name.toLowerCase().includes(accountSearchTerm.toLowerCase())
                            ).map(account => (
                              <li
                                key={account.id}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => {
                                  setSelectedAccount(account.id);
                                  setAccountDropdownOpen(false);
                                  setAccountSearchTerm('');
                                }}
                              >
                                {account.name}
                              </li>
                            ))
                          )}
                        </ul>
                        {accounts.find(a => a.id === selectedAccount) && (
                          <div className="border-t border-gray-300 bg-gray-50">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAccount(undefined);
                                setAccountDropdownOpen(false);
                                setAccountSearchTerm('');
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                              Clear my choice
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                    <input
                      type="text"
                      placeholder="Transaction reference"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Invoice Number <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleReallocate}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reallocate
                    </button>
                  </div>
                  <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    {loadingStudentInvoices ? (
                      <p className="text-sm text-gray-600 text-center py-4">Loading invoices...</p>
                    ) : studentInvoices.length === 0 ? (
                      <p className="text-sm text-gray-600 text-center py-4">
                        {selectedStudent ? 'No pending or overdue invoices found for this student' : 'Please select a student first'}
                      </p>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600 mb-4">
                          Allocate payment to invoices (automatically allocated by due date priority)
                        </p>
                        <div className="space-y-3">
                          {studentInvoices.map((invoice) => {
                            const allocated = invoiceAllocations[invoice.invoice_number] || 0;
                            const remainingBalance = invoice.balanceDue - allocated;
                            const isFullyPaid = allocated >= invoice.balanceDue;

                            return (
                              <div
                                key={invoice.invoice_number}
                                className={`p-4 border rounded-lg ${
                                  isFullyPaid ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                                }`}
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-gray-900">{invoice.invoice_number}</span>
                                      <span className={`px-2 py-1 text-xs rounded-full ${
                                        invoice.status === 'Overdue' 
                                          ? 'bg-red-100 text-red-800' 
                                          : 'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {invoice.status}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                      Due: {formatDate(invoice.due_date)} | Balance: Ksh. {invoice.balanceDue.toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max={invoice.balanceDue}
                                    value={invoiceAllocationInputs[invoice.invoice_number] ?? (allocated === 0 ? '' : allocated.toString())}
                                    onChange={(e) => handleAllocationInputChange(invoice.invoice_number, e.target.value)}
                                    onBlur={() => handleAllocationBlur(invoice.invoice_number)}
                                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="0.00"
                                  />
                                  <span className="text-sm text-gray-600 w-24">
                                    Remaining: Ksh. {remainingBalance.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className={`mt-4 p-4 border rounded-lg ${
                    overpayment > 0 
                      ? 'bg-green-50 border-green-200' 
                      : overpayment < 0 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Overpayment</p>
                        <p className="text-xs text-gray-600">
                          {overpayment > 0 
                            ? 'Excess amount after allocating to all invoices'
                            : overpayment < 0
                            ? 'Insufficient payment to cover allocated amounts'
                            : 'Payment exactly matches allocated amounts'
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${
                          overpayment > 0 
                            ? 'text-green-600' 
                            : overpayment < 0 
                            ? 'text-red-600' 
                            : 'text-gray-600'
                        }`}>
                          Ksh. {Math.abs(overpayment).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        {overpayment < 0 && (
                          <p className="text-xs text-red-600 mt-1">Cannot submit with negative overpayment</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Additional notes about the payment..."
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setSelectedPayment(null);
                      setPaymentAmount(0);
                      setPaymentAmountInput('');
                      setInvoiceAllocations({});
                      setInvoiceAllocationInputs({});
                      setOriginalAllocations({});
                      setSelectedAccount(undefined);
                      setAccountSearchTerm('');
                      setAccountDropdownOpen(false);
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!canSubmit || isSubmitting}
                    className={`px-6 py-2 rounded-lg flex items-center ${
                      canSubmit && !isSubmitting
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {selectedPayment ? 'Update' : 'Record'} Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {selectedReceipt && (
          <ReceiptPreview
            payment={selectedReceipt}
            onClose={() => setSelectedReceipt(null)}
          />
        )}

        {/* Payment Method Modal */}
        {showPaymentMethodModal && (
          <OptionsModal
            title="Payment Methods"
            items={paymentMethods.map(m => ({ id: m.id, name: m.name, sort_order: m.sort_order }))}
            onAdd={async (name: string) => {
              const { data, error } = await supabase
                .from('payment_methods')
                .insert({ name, sort_order: paymentMethods.length })
                .select()
                .single();
              
              if (error) throw error;
              
              // Refresh payment methods
              const methods = await fetchPaymentMethods();
              setPaymentMethods(methods);
            }}
            onDelete={async (id: number) => {
              try {
                const { error } = await supabase
                  .from('payment_methods')
                  .delete()
                  .eq('id', id);
                
                if (error) {
                  // Check for foreign key constraint violation
                  if (error.code === '23503' || error.message?.includes('foreign key') || error.message?.includes('violates foreign key')) {
                    throw new Error('Cannot delete this payment method because it is being used by existing payments. Please remove or update those payments first.');
                  }
                  throw error;
                }
                
                // Refresh payment methods
                const methods = await fetchPaymentMethods();
                setPaymentMethods(methods);
              } catch (error: any) {
                console.error('Error deleting payment method:', error);
                alert(error.message || 'Failed to delete payment method. It may be in use by existing payments.');
                throw error;
              }
            }}
            onEdit={async (id: number, newName: string) => {
              try {
                await updatePaymentMethod(id, newName);
                const methods = await fetchPaymentMethods();
                setPaymentMethods(methods);
              } catch (error: any) {
                console.error('Error updating payment method:', error);
                alert(error.message || 'Failed to update payment method');
              }
            }}
            onClose={() => setShowPaymentMethodModal(false)}
            tableName="payment_methods"
            onRefresh={async () => {
              const methods = await fetchPaymentMethods();
              setPaymentMethods(methods);
            }}
          />
        )}

        {/* Account Modal */}
        {showAccountModal && (
          <OptionsModal
            title="Accounts"
            items={accounts.map(a => ({ id: a.id, name: a.name, sort_order: a.sort_order }))}
            onAdd={async (name: string) => {
              const { data, error } = await supabase
                .from('accounts')
                .insert({ name, sort_order: accounts.length })
                .select()
                .single();
              
              if (error) throw error;
              
              // Refresh accounts
              const accountsData = await fetchAccounts();
              setAccounts(accountsData);
            }}
            onDelete={async (id: number) => {
              try {
                const { error } = await supabase
                  .from('accounts')
                  .delete()
                  .eq('id', id);
                
                if (error) {
                  // Check for foreign key constraint violation
                  if (error.code === '23503' || error.message?.includes('foreign key') || error.message?.includes('violates foreign key')) {
                    throw new Error('Cannot delete this account because it is being used by existing payments. Please remove or update those payments first.');
                  }
                  throw error;
                }
                
                // Refresh accounts
                const accountsData = await fetchAccounts();
                setAccounts(accountsData);
              } catch (error: any) {
                console.error('Error deleting account:', error);
                alert(error.message || 'Failed to delete account. It may be in use by existing payments.');
                throw error;
              }
            }}
            onEdit={async (id: number, newName: string) => {
              try {
                await updateAccount(id, newName);
                const accountsData = await fetchAccounts();
                setAccounts(accountsData);
              } catch (error: any) {
                console.error('Error updating account:', error);
                alert(error.message || 'Failed to update account');
              }
            }}
            onClose={() => setShowAccountModal(false)}
            tableName="accounts"
            onRefresh={async () => {
              const accountsData = await fetchAccounts();
              setAccounts(accountsData);
            }}
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
                <h2 className="text-xl font-bold text-gray-800">Filter Payments</h2>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Student Filter */}
                <div className="relative" ref={filterStudentDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={loadingStudents ? "Loading students..." : "Search by Name or Admission number"}
                      value={filterStudentQuery}
                      onChange={(e) => {
                        setFilterStudentQuery(e.target.value);
                        setIsFilterStudentSearching(true);
                        if (!e.target.value) {
                          setFilterStudent(null);
                        }
                      }}
                      onFocus={() => setIsFilterStudentSearching(true)}
                      className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loadingStudents}
                    />
                    {filterStudent && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilterStudent(null);
                          setFilterStudentQuery('');
                        }}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {isFilterStudentSearching && filterStudentQuery.length > 0 && (
                    <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                      {filteredStudentsForFilter.length > 0 ? (
                        filteredStudentsForFilter.map(student => (
                          <li
                            key={student.admission_number}
                            onMouseDown={() => handleSelectFilterStudent(student)}
                            className="p-3 cursor-pointer hover:bg-blue-50 flex justify-between items-center"
                          >
                            <span className="font-medium text-gray-900">{student.name}</span>
                            <span className="text-sm text-gray-500">{student.admission_number}</span>
                          </li>
                        ))
                      ) : (
                        <li className="p-3 text-gray-500 italic">No students found matching "{filterStudentQuery}".</li>
                      )}
                    </ul>
                  )}
                </div>

                {/* Date Range Filter */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                    <input
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                    <input
                      type="date"
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Amount Range Filter */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount Min (Ksh)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={filterAmountMin}
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
                      value={filterAmountMax}
                      onChange={(e) => setFilterAmountMax(e.target.value)}
                      placeholder="0.00"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Account Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
                  <select
                    value={filterAccount || ''}
                    onChange={(e) => setFilterAccount(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Accounts</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
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
