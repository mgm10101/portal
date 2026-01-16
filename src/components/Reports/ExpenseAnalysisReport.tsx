import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { X, Download, Eye, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from '../../supabaseClient';
import logo from '../../assets/logo.png';

interface InvoiceSettings {
  logo_url: string | null;
  school_name: string | null;
  contact_info: string | null;
  address: string | null;
  payment_details: string | null;
}

interface ExpenseAnalysisReportProps {
  onClose: () => void;
}

interface ExpenseDetail {
  internal_reference: string;
  expense_date: string;
  category_name: string;
  description_name: string;
  vendor_name: string;
  paid_through_name: string;
  amount: number;
  payment_status: string;
  due_date: string;
  date_paid: string;
}

interface PageData {
  records: ExpenseDetail[];
  pageNumber: number;
  totalPages: number;
  showSummary: boolean;
}

export const ExpenseAnalysisReport: React.FC<ExpenseAnalysisReportProps> = ({ onClose }) => {
  const [showConfigPopup, setShowConfigPopup] = useState(true);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedVendor, setSelectedVendor] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedDescription, setSelectedDescription] = useState<string>('all');
  const [allDescriptions, setAllDescriptions] = useState<{ id: number; name: string; category_id: number }[]>([]);
  const [expenses, setExpenses] = useState<ExpenseDetail[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [vendors, setVendors] = useState<{ id: number; name: string }[]>([]);
  const [accounts, setAccounts] = useState<{ id: number; name: string }[]>([]);

  // Filter descriptions based on selected category
  const descriptions = useMemo(() => {
    if (selectedCategory === 'all') {
      return [];
    }
    const selectedCategoryObj = categories.find(c => c.name === selectedCategory);
    if (!selectedCategoryObj) {
      return [];
    }
    return allDescriptions
      .filter(d => d.category_id === selectedCategoryObj.id)
      .map(({ category_id, ...rest }) => ({ id: rest.id, name: rest.name }));
  }, [selectedCategory, categories, allDescriptions]);

  // Clear description when category changes
  const handleCategoryChange = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setSelectedDescription('all'); // Clear description when category changes
  };
  const [loading, setLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings | null>(null);
  const [pages, setPages] = useState<PageData[]>([]);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [measuredHeights, setMeasuredHeights] = useState<{
    headerHeight: number;
    footerHeight: number;
    summaryHeight: number;
    tableHeaderHeight: number;
    rowHeights: number[];
    maxRowHeight: number;
    avgRowHeight: number;
  } | null>(null);

  // Page layout constants (A4 dimensions in pixels at 96 DPI)
  const A4_WIDTH = 794;
  const A4_HEIGHT = 1123;
  const PAGE_MARGIN = 37.8;
  const HEADER_HEIGHT = 160;
  const FOOTER_HEIGHT = 50;
  const SUMMARY_HEIGHT = 120;
  const TABLE_HEADER_HEIGHT = 45;
  const ROW_HEIGHT = 50;

  const calculateAvailableContentHeight = useCallback((includeSummary: boolean = false) => {
    const header = measuredHeights?.headerHeight || HEADER_HEIGHT;
    const footer = measuredHeights?.footerHeight || FOOTER_HEIGHT;
    const tableHeader = measuredHeights?.tableHeaderHeight || TABLE_HEADER_HEIGHT;
    const summary = includeSummary ? (measuredHeights?.summaryHeight || SUMMARY_HEIGHT) : 0;
    const usedHeight = header + footer + tableHeader;
    return A4_HEIGHT - (PAGE_MARGIN * 2) - usedHeight - summary;
  }, [measuredHeights]);

  // Split records into pages using actual row height measurement
  const splitIntoPages = useCallback((items: ExpenseDetail[]): PageData[] => {
    if (items.length === 0) return [];
    
    const pages: PageData[] = [];
    let currentPageRecords: ExpenseDetail[] = [];
    let currentPageNumber = 1;
    let currentCumulativeHeight = 0;
    
    const availableHeightWithoutSummary = calculateAvailableContentHeight(false);
    const availableHeightWithSummary = calculateAvailableContentHeight(true);
    const summaryHeight = measuredHeights?.summaryHeight || SUMMARY_HEIGHT;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const isLastRecord = i === items.length - 1;
      
      // Get actual height for this specific row
      let actualRowHeight = ROW_HEIGHT;
      if (measuredHeights?.rowHeights[i] !== undefined) {
        actualRowHeight = measuredHeights.rowHeights[i];
      } else if (measuredHeights && measuredHeights.rowHeights && measuredHeights.rowHeights.length > 0) {
        // Use the height of the most recently measured row as a better estimate
        const lastMeasuredIndex = measuredHeights.rowHeights.length - 1;
        actualRowHeight = measuredHeights.rowHeights[lastMeasuredIndex];
      }
      
      const newCumulativeHeight = currentCumulativeHeight + actualRowHeight;
      
      if (isLastRecord) {
        // This is the last record - need to decide if summary fits
        const wouldFitWithSummary = (newCumulativeHeight + summaryHeight) <= availableHeightWithSummary;
        
        if (wouldFitWithSummary) {
          // Add record and summary to current page
          currentPageRecords.push(item);
          pages.push({
            records: [...currentPageRecords],
            pageNumber: currentPageNumber,
            totalPages: 0,
            showSummary: true
          });
        } else {
          // Check if record alone fits on current page
          if (newCumulativeHeight <= availableHeightWithoutSummary) {
            // Add record to current page, summary goes to next
            currentPageRecords.push(item);
            pages.push({
              records: [...currentPageRecords],
              pageNumber: currentPageNumber,
              totalPages: 0,
              showSummary: false
            });
            // Add summary-only page
            pages.push({
              records: [],
              pageNumber: currentPageNumber + 1,
              totalPages: 0,
              showSummary: true
            });
          } else {
            // Current page is full, save it and start new page with record and summary
            pages.push({
              records: [...currentPageRecords],
              pageNumber: currentPageNumber,
              totalPages: 0,
              showSummary: false
            });
            pages.push({
              records: [item],
              pageNumber: currentPageNumber + 1,
              totalPages: 0,
              showSummary: true
            });
          }
        }
      } else {
        // Not the last record - check if adding this record would exceed page limit
        if (newCumulativeHeight > availableHeightWithoutSummary) {
          // Current page is full, save it and start new page
          pages.push({
            records: [...currentPageRecords],
            pageNumber: currentPageNumber,
            totalPages: 0,
            showSummary: false
          });
          currentPageRecords = [item];
          currentCumulativeHeight = actualRowHeight;
          currentPageNumber++;
        } else {
          currentPageRecords.push(item);
          currentCumulativeHeight = newCumulativeHeight;
        }
      }
    }
    
    // If there are remaining records (shouldn't happen, but handle edge case)
    if (currentPageRecords.length > 0 && pages.length === 0) {
      pages.push({
        records: [...currentPageRecords],
        pageNumber: 1,
        totalPages: 1,
        showSummary: true
      });
    }
    
    const totalPages = pages.length;
    return pages.map(page => ({ ...page, totalPages }));
  }, [calculateAvailableContentHeight, measuredHeights]);

  // Set default date range and fetch dropdown data on mount
  useEffect(() => {
    const today = new Date();
    
    // Get today's date components
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11
    const currentDay = today.getDate();
    
    // Calculate one month ago
    let targetYear = currentYear;
    let targetMonth = currentMonth - 1;
    
    // Handle year rollover
    if (targetMonth < 0) {
      targetMonth = 11; // December
      targetYear = currentYear - 1;
    }
    
    // Create the date one month ago
    const oneMonthAgo = new Date(targetYear, targetMonth, currentDay);
    
    // Format dates as YYYY-MM-DD in local timezone
    const formatDateLocal = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    setDateTo(formatDateLocal(today));
    setDateFrom(formatDateLocal(oneMonthAgo));

    async function fetchDropdownData() {
      try {
        const [categoriesRes, vendorsRes, accountsRes, descriptionsRes] = await Promise.all([
          supabase.from('expense_categories').select('id, name').eq('is_active', true).order('sort_order', { ascending: true }),
          supabase.from('expense_vendors').select('id, name').eq('is_active', true).order('sort_order', { ascending: true }),
          supabase.from('expense_paid_through').select('id, name').eq('is_active', true).order('sort_order', { ascending: true }),
          supabase.from('expense_descriptions').select('id, name, category_id').eq('is_active', true).order('sort_order', { ascending: true })
        ]);
        
        if (categoriesRes.data) setCategories(categoriesRes.data);
        if (vendorsRes.data) setVendors(vendorsRes.data);
        if (accountsRes.data) setAccounts(accountsRes.data);
        if (descriptionsRes.data) setAllDescriptions(descriptionsRes.data);
      } catch (err) {
        console.error('Failed to fetch dropdown data:', err);
      }
    }

    async function fetchInvoiceSettings() {
      try {
        const { data: settingsData, error: settingsError } = await supabase
          .from('invoice_settings')
          .select('logo_url, school_name, contact_info, address, payment_details')
          .single();

        if (settingsError && settingsError.code !== 'PGRST301') {
          console.warn('Error fetching invoice settings:', settingsError);
        }
        setInvoiceSettings(settingsData || {
          logo_url: null,
          school_name: null,
          contact_info: null,
          address: null,
          payment_details: null
        });
      } catch (err) {
        console.error('Failed to fetch invoice settings:', err);
      }
    }

    fetchDropdownData();
    fetchInvoiceSettings();
  }, []);

  useEffect(() => {
    if (expenses.length > 0) {
      const splitPages = splitIntoPages(expenses);
      setPages(splitPages);
      pageRefs.current = new Array(splitPages.length).fill(null);
    } else {
      setPages([]);
    }
  }, [expenses, splitIntoPages, measuredHeights]);

  // Measure actual heights after rendering from the first rendered page (only once)
  useEffect(() => {
    if (!showPreview || expenses.length === 0 || pages.length === 0 || measuredHeights !== null) return;

    const measureHeights = () => {
      const firstPageElement = pageRefs.current[0];
      if (!firstPageElement) return;

      const headerElement = firstPageElement.querySelector('.mb-4.border-b') as HTMLElement;
      const headerHeight = headerElement ? headerElement.offsetHeight : HEADER_HEIGHT;

      const footerElement = firstPageElement.querySelector('.mt-auto.pt-4.border-t') as HTMLElement;
      const footerHeight = footerElement ? footerElement.offsetHeight : FOOTER_HEIGHT;

      const tableHeaderElement = firstPageElement.querySelector('table thead tr') as HTMLElement;
      const tableHeaderHeight = tableHeaderElement ? tableHeaderElement.offsetHeight : TABLE_HEADER_HEIGHT;

      const allDataRows = firstPageElement.querySelectorAll('table tbody tr');
      const rowHeights: number[] = [];
      let maxRowHeight = ROW_HEIGHT;
      let totalRowHeight = 0;
      
      allDataRows.forEach((row) => {
        const height = (row as HTMLElement).offsetHeight;
        rowHeights.push(height);
        if (height > maxRowHeight) {
          maxRowHeight = height;
        }
        totalRowHeight += height;
      });
      
      const avgRowHeight = rowHeights.length > 0 ? totalRowHeight / rowHeights.length : ROW_HEIGHT;

      const summaryElement = firstPageElement.querySelector('.grid.grid-cols-3.gap-4') as HTMLElement;
      const summaryHeight = summaryElement ? summaryElement.offsetHeight : SUMMARY_HEIGHT;

      setMeasuredHeights(prev => {
        const newHeights = {
          headerHeight,
          footerHeight,
          summaryHeight,
          tableHeaderHeight,
          rowHeights,
          maxRowHeight,
          avgRowHeight
        };
        
        if (!prev || 
            prev.headerHeight !== headerHeight ||
            prev.footerHeight !== footerHeight ||
            prev.summaryHeight !== summaryHeight ||
            prev.tableHeaderHeight !== tableHeaderHeight ||
            prev.rowHeights.length !== rowHeights.length ||
            prev.maxRowHeight !== maxRowHeight) {
          return newHeights;
        }
        return prev;
      });
    };

    const timeoutId = setTimeout(measureHeights, 300);
    return () => clearTimeout(timeoutId);
  }, [showPreview, expenses.length]); // Remove pages.length from dependencies

  const handleClose = () => {
    setShowPreview(false);
    setShowConfigPopup(false);
    setExpenses([]);
    onClose();
  };

  const handleGenerate = async () => {
    if (!dateFrom || !dateTo) {
      alert('Please select a date range');
      return;
    }

    setLoading(true);
    try {
      // Fetch expenses from expenses_view
      let query = supabase
        .from('expenses_view')
        .select(`
          internal_reference,
          expense_date,
          category_name,
          description_name,
          vendor_name,
          paid_through_name,
          amount,
          payment_status,
          due_date,
          date_paid
        `)
        .gte('expense_date', dateFrom)
        .lte('expense_date', dateTo)
        .eq('is_voided', false)
        .order('expense_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (selectedCategory !== 'all') {
        query = query.eq('category_name', selectedCategory);
      }

      if (selectedVendor !== 'all') {
        query = query.eq('vendor_name', selectedVendor);
      }

      if (selectedAccount !== 'all') {
        query = query.eq('paid_through_name', selectedAccount);
      }

      if (selectedDescription !== 'all') {
        query = query.eq('description_name', selectedDescription);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      setExpenses(data || []);
      setShowPreview(true);
      setShowConfigPopup(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportToPdf = useCallback(async () => {
    if (pages.length === 0 || exportingPdf) return;

    setExportingPdf(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;

      for (let i = 0; i < pages.length; i++) {
        const pageElement = pageRefs.current[i];
        if (!pageElement) continue;

        if (i > 0) {
          pdf.addPage();
        }

        const canvas = await html2canvas(pageElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: A4_WIDTH,
          windowWidth: A4_WIDTH,
          imageTimeout: 15000,
          removeContainer: false,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgWidth = pageWidth - (margin * 2);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
      }

      const filename = `Expense_Analysis_${dateFrom}_to_${dateTo}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExportingPdf(false);
    }
  }, [pages, exportingPdf, dateFrom, dateTo]);

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getPaymentStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'paid': return 'text-green-600';
      case 'unpaid': return 'text-red-600';
      case 'partial': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  // Get summary statistics
  const getSummaryStats = () => {
    const totalExpenses = expenses.length;
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const paidCount = expenses.filter(exp => exp.payment_status === 'Paid').length;
    const unpaidCount = expenses.filter(exp => exp.payment_status === 'Unpaid').length;
    const partialCount = expenses.filter(exp => exp.payment_status === 'Partial').length;
    const paidAmount = expenses.filter(exp => exp.payment_status === 'Paid').reduce((sum, exp) => sum + exp.amount, 0);
    const unpaidAmount = expenses.filter(exp => exp.payment_status === 'Unpaid').reduce((sum, exp) => sum + exp.amount, 0);
    
    return { totalExpenses, totalAmount, paidCount, unpaidCount, partialCount, paidAmount, unpaidAmount };
  };

  if (showConfigPopup) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white shadow-xl w-full max-w-md my-8">
          <div 
            className="p-6 max-h-[calc(100vh-4rem)] overflow-y-auto"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'transparent transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.scrollbarColor = '#d1d5db #9ca3af';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.scrollbarColor = 'transparent transparent';
            }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Expense Analysis</h2>
              <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date From <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date To <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <select
                  value={selectedDescription}
                  onChange={(e) => setSelectedDescription(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={selectedCategory === 'all'}
                >
                  <option value="all">All Descriptions</option>
                  {descriptions.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor
                </label>
                <select
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Vendors</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.name}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account
                </label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Accounts</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={loading || !dateFrom || !dateTo}
                  className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 ${
                    loading || !dateFrom || !dateTo ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      View Preview
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showPreview) {
    const stats = getSummaryStats();
    
    return (
      <div className="fixed inset-0 bg-gray-50 z-50 overflow-auto">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6 print:hidden">
              <button
                onClick={() => {
                  setShowPreview(false);
                  setShowConfigPopup(true);
                }}
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                &larr; Back to Configuration
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleExportToPdf}
                  disabled={exportingPdf}
                  className={`bg-green-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${
                    exportingPdf ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
                  }`}
                >
                  {exportingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Export to PDF
                    </>
                  )}
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {expenses.length === 0 ? (
                <div
                  className="bg-white mx-auto p-8"
                  style={{
                    width: `${A4_WIDTH}px`,
                    minHeight: `${A4_HEIGHT}px`,
                    padding: `${PAGE_MARGIN}px`,
                  }}
                >
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg">No expenses found for the selected criteria.</p>
                  </div>
                </div>
              ) : (
                pages.map((pageData, pageIndex) => (
                  <div
                    key={`page-${pageData.pageNumber}`}
                    ref={(el) => { pageRefs.current[pageIndex] = el; }}
                    className="bg-white mx-auto page-break shadow-lg"
                    style={{
                      width: `${A4_WIDTH}px`,
                      minHeight: `${A4_HEIGHT}px`,
                      padding: `${PAGE_MARGIN}px`,
                      display: 'flex',
                      flexDirection: 'column',
                      pageBreakAfter: pageIndex === pages.length - 1 ? 'auto' : 'always',
                      pageBreakInside: 'avoid',
                    }}
                  >
                    {/* Header */}
                    <div className="mb-4 border-b border-gray-200 pb-3 flex-shrink-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h1 className="text-3xl font-normal text-gray-900 mb-2">Expense Analysis</h1>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Date Range:</strong> {formatDate(dateFrom)} to {formatDate(dateTo)}</p>
                            <p><strong>Filters:</strong> {selectedCategory !== 'all' ? `Category: ${selectedCategory}` : 'All Categories'}{selectedVendor !== 'all' ? `, Vendor: ${selectedVendor}` : ''}{selectedAccount !== 'all' ? `, Account: ${selectedAccount}` : ''}</p>
                            <p><strong>Generated:</strong> {formatDateTime(new Date().toISOString())}</p>
                          </div>
                        </div>
                        <div className="flex-shrink-0 mt-4">
                          {invoiceSettings?.logo_url ? (
                            <img
                              src={invoiceSettings.logo_url}
                              alt="School Logo"
                              style={{
                                height: '100px',
                                width: 'auto',
                                maxWidth: '200px',
                                objectFit: 'contain',
                                display: 'block',
                                imageRendering: 'crisp-edges',
                                flexShrink: 0
                              }}
                              onError={(e) => { (e.target as HTMLImageElement).src = logo; }}
                            />
                          ) : (
                            <img
                              src={logo}
                              alt="School Logo"
                              style={{
                                height: '100px',
                                width: 'auto',
                                maxWidth: '200px',
                                objectFit: 'contain',
                                display: 'block',
                                imageRendering: 'crisp-edges',
                                flexShrink: 0
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expenses Table */}
                    <div className="flex-1 overflow-hidden">
                      {pageData.records.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse text-xs">
                            <thead>
                              <tr className="bg-gray-50 border-b-2 border-gray-200">
                                <th className="text-left p-2 text-xs font-semibold text-gray-700" style={{ width: '8%' }}>Date</th>
                                <th className="text-left p-2 text-xs font-semibold text-gray-700">Category & Description</th>
                                <th className="text-left p-2 text-xs font-semibold text-gray-700">Vendor</th>
                                <th className="text-left p-2 text-xs font-semibold text-gray-700">Account</th>
                                <th className="text-right p-2 text-xs font-semibold text-gray-700" style={{ width: '10%' }}>Amount</th>
                                <th className="text-center p-2 text-xs font-semibold text-gray-700" style={{ width: '8%' }}>Status</th>
                                <th className="text-left p-2 text-xs font-semibold text-gray-700" style={{ width: '8%' }}>Due</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pageData.records.map((expense, index) => (
                                <tr key={expense.internal_reference} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : ''}`} style={index % 2 === 1 ? { backgroundColor: '#fcfcfd' } : {}}>
                                  <td className="p-2 text-xs text-gray-600">
                                    <div className="font-semibold text-black">{formatDate(expense.expense_date)}</div>
                                    <div className="text-xs text-gray-500 font-normal">{expense.internal_reference}</div>
                                  </td>
                                  <td className="p-2 text-xs text-gray-600">
                                    <div className="font-semibold text-black">{expense.category_name || 'N/A'}</div>
                                    <div className="text-xs text-gray-500 font-normal">{expense.description_name || 'N/A'}</div>
                                  </td>
                                  <td className="p-2 text-xs text-gray-600">{expense.vendor_name || 'N/A'}</td>
                                  <td className="p-2 text-xs text-gray-600">{expense.paid_through_name || 'N/A'}</td>
                                  <td className="p-2 text-xs text-right font-medium text-red-600">{formatCurrency(expense.amount)}</td>
                                  <td className="p-2 text-xs text-center">
                                    <span className={getPaymentStatusColor(expense.payment_status)}>
                                      {expense.payment_status}
                                    </span>
                                  </td>
                                  <td className="p-2 text-xs text-gray-600">{formatDate(expense.due_date)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : null}
                    </div>

                    {/* Summary Cards */}
                    {pageData.showSummary && (
                      <div className="mt-8 grid grid-cols-3 gap-4 flex-shrink-0">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                          <p className="text-2xl font-semibold text-red-600">Ksh. {formatCurrency(stats.totalAmount)}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Paid</p>
                          <p className="text-2xl font-semibold text-green-600">Ksh. {formatCurrency(stats.paidAmount)}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Unpaid</p>
                          <p className="text-2xl font-semibold text-red-600">Ksh. {formatCurrency(stats.unpaidAmount)}</p>
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="mt-auto pt-4 border-t border-gray-200 flex-shrink-0" style={{ height: `${FOOTER_HEIGHT}px` }}>
                      <div className="text-center text-sm text-gray-600">
                        Page {pageData.pageNumber} of {pageData.totalPages}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ExpenseAnalysisReport;
