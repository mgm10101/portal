import React, { useState, useEffect, useCallback, useRef } from 'react';
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

interface ExpenditurePerCategoryReportProps {
  onClose: () => void;
}

interface CategoryAggregate {
  categoryName: string;
  totalAmount: number;
  expenseCount: number;
  paidAmount: number;
  unpaidAmount: number;
}

interface PageData {
  records: CategoryAggregate[];
  pageNumber: number;
  totalPages: number;
  showSummary: boolean;
}

export const ExpenditurePerCategoryReport: React.FC<ExpenditurePerCategoryReportProps> = ({ onClose }) => {
  const [showConfigPopup, setShowConfigPopup] = useState(true);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [categories, setCategories] = useState<CategoryAggregate[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings | null>(null);
  const [pages, setPages] = useState<PageData[]>([]);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Page layout constants (A4 dimensions in pixels at 96 DPI)
  const A4_WIDTH = 794;
  const A4_HEIGHT = 1123;
  const PAGE_MARGIN = 37.8;
  const HEADER_HEIGHT = 160;
  const FOOTER_HEIGHT = 50;
  const SUMMARY_HEIGHT = 120;
  const TABLE_HEADER_HEIGHT = 45;
  const ROW_HEIGHT = 45;

  const calculateAvailableContentHeight = useCallback((includeSummary: boolean = false) => {
    const usedHeight = HEADER_HEIGHT + FOOTER_HEIGHT + TABLE_HEADER_HEIGHT;
    const summary = includeSummary ? SUMMARY_HEIGHT : 0;
    return A4_HEIGHT - (PAGE_MARGIN * 2) - usedHeight - summary;
  }, []);

  // Split records into pages
  const splitIntoPages = useCallback((items: CategoryAggregate[]): PageData[] => {
    if (items.length === 0) return [];
    
    const pages: PageData[] = [];
    let currentPageNumber = 1;
    
    const availableHeight = calculateAvailableContentHeight(false);
    const rowsPerPage = Math.floor(availableHeight / ROW_HEIGHT);
    
    let remainingItems = [...items];
    
    while (remainingItems.length > 0) {
      const isLastPage = remainingItems.length <= rowsPerPage;
      const pageItems = remainingItems.slice(0, rowsPerPage);
      remainingItems = remainingItems.slice(rowsPerPage);
      
      pages.push({
        records: pageItems,
        pageNumber: currentPageNumber,
        totalPages: 0,
        showSummary: isLastPage
      });
      
      currentPageNumber++;
    }
    
    return pages.map(page => ({ ...page, totalPages: pages.length }));
  }, [calculateAvailableContentHeight]);

  // Set default date range on mount
  useEffect(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    setDateTo(today.toISOString().split('T')[0]);
    setDateFrom(firstDayOfMonth.toISOString().split('T')[0]);

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

    fetchInvoiceSettings();
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      const splitPages = splitIntoPages(categories);
      setPages(splitPages);
      pageRefs.current = new Array(splitPages.length).fill(null);
    } else {
      setPages([]);
    }
  }, [categories, splitIntoPages]);

  const handleClose = () => {
    setShowPreview(false);
    setShowConfigPopup(false);
    setCategories([]);
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
      const { data: expenses, error } = await supabase
        .from('expenses_view')
        .select('category_name, amount, payment_status')
        .gte('expense_date', dateFrom)
        .lte('expense_date', dateTo)
        .eq('is_voided', false);

      if (error) throw error;

      // Aggregate by category
      const aggregated: { [key: string]: CategoryAggregate } = {};
      
      (expenses || []).forEach(expense => {
        const categoryName = expense.category_name || 'Uncategorized';
        const amount = parseFloat(expense.amount) || 0;
        const isPaid = expense.payment_status === 'Paid';
        
        if (!aggregated[categoryName]) {
          aggregated[categoryName] = {
            categoryName,
            totalAmount: 0,
            expenseCount: 0,
            paidAmount: 0,
            unpaidAmount: 0
          };
        }
        aggregated[categoryName].totalAmount += amount;
        aggregated[categoryName].expenseCount += 1;
        if (isPaid) {
          aggregated[categoryName].paidAmount += amount;
        } else {
          aggregated[categoryName].unpaidAmount += amount;
        }
      });

      // Sort by total amount descending
      const sortedCategories = Object.values(aggregated).sort((a, b) => b.totalAmount - a.totalAmount);
      
      setCategories(sortedCategories);
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

      const filename = `Expenditure_by_Category_${dateFrom}_to_${dateTo}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExportingPdf(false);
    }
  }, [pages, exportingPdf, dateFrom, dateTo]);

  const formatDate = (dateString: string): string => {
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

  // Get summary statistics
  const getSummaryStats = () => {
    const totalExpenditure = categories.reduce((sum, cat) => sum + cat.totalAmount, 0);
    const totalPaid = categories.reduce((sum, cat) => sum + cat.paidAmount, 0);
    const totalUnpaid = categories.reduce((sum, cat) => sum + cat.unpaidAmount, 0);
    const totalCategories = categories.length;
    
    return { totalExpenditure, totalPaid, totalUnpaid, totalCategories };
  };

  if (showConfigPopup) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Expenditure per Category</h2>
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
              {categories.length === 0 ? (
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
                          <h1 className="text-3xl font-normal text-gray-900 mb-2">Expenditure per Category</h1>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Date Range:</strong> {formatDate(dateFrom)} to {formatDate(dateTo)}</p>
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

                    {/* Categories Table */}
                    <div className="flex-1 overflow-hidden">
                      {pageData.records.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-50 border-b-2 border-gray-200">
                                <th className="text-left p-3 text-sm font-semibold text-gray-700" style={{ width: '5%' }}>#</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700">Category</th>
                                <th className="text-right p-3 text-sm font-semibold text-gray-700" style={{ width: '12%' }}>Count</th>
                                <th className="text-right p-3 text-sm font-semibold text-gray-700" style={{ width: '20%' }}>Paid (Ksh)</th>
                                <th className="text-right p-3 text-sm font-semibold text-gray-700" style={{ width: '20%' }}>Unpaid (Ksh)</th>
                                <th className="text-right p-3 text-sm font-semibold text-gray-700" style={{ width: '20%' }}>Total (Ksh)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pageData.records.map((category, index) => (
                                <tr key={category.categoryName} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : ''}`} style={index % 2 === 1 ? { backgroundColor: '#fcfcfd' } : {}}>
                                  <td className="p-3 text-sm text-gray-600">{index + 1}</td>
                                  <td className="p-3 text-sm text-gray-900 font-medium">{category.categoryName}</td>
                                  <td className="p-3 text-sm text-gray-600 text-right">{category.expenseCount.toLocaleString()}</td>
                                  <td className="p-3 text-sm text-right text-green-600">{formatCurrency(category.paidAmount)}</td>
                                  <td className="p-3 text-sm text-right text-orange-600">{formatCurrency(category.unpaidAmount)}</td>
                                  <td className="p-3 text-sm text-right font-medium text-red-600">{formatCurrency(category.totalAmount)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : null}
                    </div>

                    {/* Summary Cards */}
                    {pageData.showSummary && (
                      <div className="mt-8 grid grid-cols-4 gap-4 flex-shrink-0">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Total Categories</p>
                          <p className="text-2xl font-semibold text-gray-900">{stats.totalCategories}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Total Expenditure</p>
                          <p className="text-2xl font-semibold text-red-600">Ksh. {formatCurrency(stats.totalExpenditure)}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Paid</p>
                          <p className="text-2xl font-semibold text-green-600">Ksh. {formatCurrency(stats.totalPaid)}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Unpaid</p>
                          <p className="text-2xl font-semibold text-orange-600">Ksh. {formatCurrency(stats.totalUnpaid)}</p>
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

export default ExpenditurePerCategoryReport;
