import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Download, Eye, Calendar, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { fetchVoidedExpenses } from '../../services/expenseService';
import { fetchVoidedInvoices, fetchVoidedPayments } from '../../services/financialService';
import { supabase } from '../../supabaseClient';
import logo from '../../assets/logo.png';

interface InvoiceSettings {
  logo_url: string | null;
  school_name: string | null;
  contact_info: string | null;
  address: string | null;
  payment_details: string | null;
}

interface VoidedRecordsReportProps {
  onClose: () => void;
}

type RecordType = 'expenses' | 'invoices' | 'payments_received' | 'payroll';

interface PageData {
  records: any[];
  pageNumber: number;
  totalPages: number;
  showSummary: boolean; // Whether to show summary cards on this page
}

export const VoidedRecordsReport: React.FC<VoidedRecordsReportProps> = ({ onClose }) => {
  const [showConfigPopup, setShowConfigPopup] = useState(true);
  const [recordType, setRecordType] = useState<RecordType>('expenses');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [voidedRecords, setVoidedRecords] = useState<any[]>([]);
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
    rowHeights: number[]; // Array of actual row heights measured
    maxRowHeight: number; // Maximum row height for unmeasured rows
    avgRowHeight: number; // Average row height for fallback
  } | null>(null);

  // Page layout constants (A4 dimensions in pixels at 96 DPI)
  const A4_WIDTH = 794; // 210mm * 96 / 25.4
  const A4_HEIGHT = 1123; // 297mm * 96 / 25.4
  const PAGE_MARGIN = 60; // Top, bottom, left, right margins in pixels
  const HEADER_HEIGHT = 180; // Fallback header height in pixels
  const FOOTER_HEIGHT = 50; // Fallback footer height in pixels
  const SUMMARY_HEIGHT = 120; // Fallback summary cards height in pixels
  const TABLE_HEADER_HEIGHT = 45; // Fallback table header row height
  const ROW_HEIGHT = 60; // Fallback height per table row in pixels

  // Calculate available height for content (excluding header, footer, margins)
  const calculateAvailableContentHeight = useCallback((includeSummary: boolean = false) => {
    const header = measuredHeights?.headerHeight || HEADER_HEIGHT;
    const footer = measuredHeights?.footerHeight || FOOTER_HEIGHT;
    const tableHeader = measuredHeights?.tableHeaderHeight || TABLE_HEADER_HEIGHT;
    const summary = includeSummary ? (measuredHeights?.summaryHeight || SUMMARY_HEIGHT) : 0;
    const usedHeight = header + footer + tableHeader;
    return A4_HEIGHT - (PAGE_MARGIN * 2) - usedHeight - summary;
  }, [measuredHeights]);

  // Get row height for a specific row index (uses measured height if available, otherwise max/avg)
  const getRowHeight = useCallback((rowIndex: number): number => {
    if (!measuredHeights) return ROW_HEIGHT;
    if (measuredHeights.rowHeights[rowIndex] !== undefined) {
      return measuredHeights.rowHeights[rowIndex];
    }
    // For unmeasured rows, use max height (safest approach)
    return measuredHeights.maxRowHeight || ROW_HEIGHT;
  }, [measuredHeights]);

  // Split records into pages using cumulative height measurement
  const splitIntoPages = useCallback((records: any[]): PageData[] => {
    if (records.length === 0) return [];
    
    const pages: PageData[] = [];
    let currentPageRecords: any[] = [];
    let currentPageNumber = 1;
    let currentCumulativeHeight = 0;
    
    // Get available heights
    const availableHeightWithoutSummary = calculateAvailableContentHeight(false);
    const availableHeightWithSummary = calculateAvailableContentHeight(true);
    const summaryHeight = measuredHeights?.summaryHeight || SUMMARY_HEIGHT;
    
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const isLastRecord = i === records.length - 1;
      
      // Get the height of this row
      const rowHeight = getRowHeight(i);
      
      // Calculate what the cumulative height would be if we add this row
      const newCumulativeHeight = currentCumulativeHeight + rowHeight;
      
      if (isLastRecord) {
        // This is the last record - need to decide if summary fits
        const wouldFitWithSummary = (newCumulativeHeight + summaryHeight) <= availableHeightWithSummary;
        
        if (wouldFitWithSummary) {
          // Add record and summary to current page
          currentPageRecords.push(record);
          pages.push({
            records: [...currentPageRecords],
            pageNumber: currentPageNumber,
            totalPages: 0, // Will update later
            showSummary: true
          });
        } else {
          // Check if record alone fits on current page
          if (newCumulativeHeight <= availableHeightWithoutSummary) {
            // Add record to current page, summary goes to next
            currentPageRecords.push(record);
            pages.push({
              records: [...currentPageRecords],
              pageNumber: currentPageNumber,
              totalPages: 0, // Will update later
              showSummary: false
            });
            // Add summary-only page
            pages.push({
              records: [],
              pageNumber: currentPageNumber + 1,
              totalPages: 0, // Will update later
              showSummary: true
            });
          } else {
            // Current page is full, save it and start new page with record and summary
            pages.push({
              records: [...currentPageRecords],
              pageNumber: currentPageNumber,
              totalPages: 0, // Will update later
              showSummary: false
            });
            pages.push({
              records: [record],
              pageNumber: currentPageNumber + 1,
              totalPages: 0, // Will update later
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
            totalPages: 0, // Will update later
            showSummary: false
          });
          currentPageRecords = [record];
          currentCumulativeHeight = rowHeight;
          currentPageNumber++;
        } else {
          currentPageRecords.push(record);
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
    
    // Update totalPages for all pages
    const totalPages = pages.length;
    return pages.map(page => ({ ...page, totalPages }));
  }, [calculateAvailableContentHeight, getRowHeight, measuredHeights]);

  // Set default date range (last 30 days) and fetch invoice settings
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    setDateTo(today.toISOString().split('T')[0]);
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);

    // Fetch invoice settings for logo
    async function fetchInvoiceSettings() {
      try {
        const { data: settingsData, error: settingsError } = await supabase
          .from('invoice_settings')
          .select('logo_url, school_name, contact_info, address, payment_details')
          .single();

        if (settingsError && settingsError.code !== 'PGRST301') {
          console.warn('Error fetching invoice settings:', settingsError);
          setInvoiceSettings({
            logo_url: null,
            school_name: null,
            contact_info: null,
            address: null,
            payment_details: null
          });
        } else if (settingsData) {
          setInvoiceSettings(settingsData);
        } else {
          setInvoiceSettings({
            logo_url: null,
            school_name: null,
            contact_info: null,
            address: null,
            payment_details: null
          });
        }
      } catch (err) {
        console.error('Failed to fetch invoice settings:', err);
        setInvoiceSettings({
          logo_url: null,
          school_name: null,
          contact_info: null,
          address: null,
          payment_details: null
        });
      }
    }

    fetchInvoiceSettings();
  }, []);

  // Measure actual heights after rendering from the first rendered page
  useEffect(() => {
    if (!showPreview || voidedRecords.length === 0 || pages.length === 0) return;

    const measureHeights = () => {
      // Find the first rendered page element to measure from
      const firstPageElement = pageRefs.current[0];
      if (!firstPageElement) return;

      // Measure header
      const headerElement = firstPageElement.querySelector('.mb-4.border-b') as HTMLElement;
      const headerHeight = headerElement ? headerElement.offsetHeight : HEADER_HEIGHT;

      // Measure footer
      const footerElement = firstPageElement.querySelector('.mt-auto.pt-4.border-t') as HTMLElement;
      const footerHeight = footerElement ? footerElement.offsetHeight : FOOTER_HEIGHT;

      // Measure table header
      const tableHeaderElement = firstPageElement.querySelector('table thead tr') as HTMLElement;
      const tableHeaderHeight = tableHeaderElement ? tableHeaderElement.offsetHeight : TABLE_HEADER_HEIGHT;

      // Measure ALL row heights from the rendered page
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

      // Measure summary cards if they exist
      const summaryElement = firstPageElement.querySelector('.grid.grid-cols-3.gap-4') as HTMLElement;
      const summaryHeight = summaryElement ? summaryElement.offsetHeight : SUMMARY_HEIGHT;

      // Only update if measurements are different to avoid infinite loops
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

    // Measure after a delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(measureHeights, 300);
    
    return () => clearTimeout(timeoutId);
  }, [showPreview, voidedRecords, pages.length]);

  // Update pages when voidedRecords or measuredHeights changes
  useEffect(() => {
    if (voidedRecords.length > 0) {
      // Only split if we have measurements (or use fallbacks on first render)
      const splitPages = splitIntoPages(voidedRecords);
      setPages(splitPages);
      // Initialize refs array
      pageRefs.current = new Array(splitPages.length).fill(null);
    } else {
      setPages([]);
    }
  }, [voidedRecords, splitIntoPages, measuredHeights]);

  // Reset state when component closes
  const handleClose = () => {
    setShowPreview(false);
    setShowConfigPopup(false);
    setVoidedRecords([]);
    onClose();
  };

  const handleGenerate = async () => {
    if (!dateFrom || !dateTo) {
      alert('Please select a date range');
      return;
    }

    setLoading(true);
    try {
      let data: any[] = [];
      if (recordType === 'expenses') {
        data = await fetchVoidedExpenses(dateFrom, dateTo);
      } else if (recordType === 'invoices') {
        data = await fetchVoidedInvoices(dateFrom, dateTo);
      } else if (recordType === 'payments_received') {
        data = await fetchVoidedPayments(dateFrom, dateTo);
      } else {
        alert(`${recordType} voided records are not yet implemented.`);
        setLoading(false);
        return;
      }
      setVoidedRecords(data);
      setShowPreview(true);
      setShowConfigPopup(false);
    } catch (error) {
      console.error('Error fetching voided records:', error);
      alert('Failed to fetch voided records. Please try again.');
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
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // 10mm margin

      // Process each page separately
      for (let i = 0; i < pages.length; i++) {
        const pageElement = pageRefs.current[i];
        if (!pageElement) continue;

        // Add new page (except for first page)
        if (i > 0) {
          pdf.addPage();
        }

        // Capture the page element
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

        // Add image to PDF
        pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
      }

      const sanitizeFilename = (str: string) => str.replace(/[<>:"/\\|?*]/g, '_').trim();
      const filename = `Voided_${recordType}_${dateFrom}_to_${dateTo}.pdf`;
      pdf.save(sanitizeFilename(filename));
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExportingPdf(false);
    }
  }, [pages, recordType, dateFrom, dateTo, exportingPdf]);

  const totalAmount = voidedRecords.reduce((sum, record) => sum + (record.amount || record.total_amount || 0), 0);

  // Format date to DD/MM/YY with slashes
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  // Format datetime to DD/MM/YY HH:MM with slashes
  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  if (showConfigPopup) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Voided Records Report</h2>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Record Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={recordType}
                  onChange={(e) => setRecordType(e.target.value as RecordType)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="expenses">Expenses</option>
                  <option value="invoices">Invoices</option>
                  <option value="payments_received">Payments Received</option>
                  <option value="payroll">Payroll Records</option>
                </select>
              </div>

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
                    required
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
                    required
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

            {/* Render multiple pages */}
            <div className="space-y-4">
              {voidedRecords.length === 0 ? (
                <div className="bg-white mx-auto p-8" style={{ width: `${A4_WIDTH}px`, minHeight: `${A4_HEIGHT}px`, padding: `${PAGE_MARGIN}px` }}>
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg">No voided records found for the selected date range.</p>
                  </div>
                </div>
              ) : (
                pages.map((pageData, pageIndex) => (
                  <div
                    key={`page-${pageData.pageNumber}`}
                    ref={(el) => {
                      pageRefs.current[pageIndex] = el;
                    }}
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
                          <h1 className="text-3xl font-normal text-gray-900 mb-2">Voided Records Report</h1>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Record Type:</strong> {recordType.charAt(0).toUpperCase() + recordType.slice(1).replace('_', ' ')}</p>
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
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = logo;
                              }}
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

                    {/* Records Table - Flexible content area */}
                    <div className="flex-1 overflow-hidden">
                      {pageData.records.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-50 border-b-2 border-gray-200">
                                {recordType === 'expenses' ? (
                                  <>
                                    <th className="text-left p-3 text-sm font-semibold text-gray-700" style={{ width: '12%' }}>Date</th>
                                    <th className="text-left p-3 text-sm font-semibold text-gray-700">Category</th>
                                    <th className="text-right p-3 text-sm font-semibold text-gray-700" style={{ width: '14%', whiteSpace: 'nowrap' }}>Amount (Ksh)</th>
                                    <th className="text-left text-sm font-semibold text-gray-700" style={{ paddingTop: '12px', paddingBottom: '12px', paddingLeft: '12px', paddingRight: '4px' }}>Voided By</th>
                                    <th className="text-left text-sm font-semibold text-gray-700" style={{ paddingTop: '12px', paddingBottom: '12px', paddingLeft: '4px', paddingRight: '12px' }}>Reason</th>
                                  </>
                                ) : recordType === 'invoices' ? (
                                  <>
                                    <th className="text-left p-3 text-sm font-semibold text-gray-700" style={{ width: '12%' }}>Date</th>
                                    <th className="text-left p-3 text-sm font-semibold text-gray-700">Invoice</th>
                                    <th className="text-right p-3 text-sm font-semibold text-gray-700" style={{ width: '14%', whiteSpace: 'nowrap' }}>Amount (Ksh)</th>
                                    <th className="text-left text-sm font-semibold text-gray-700" style={{ paddingTop: '12px', paddingBottom: '12px', paddingLeft: '12px', paddingRight: '4px' }}>Voided By</th>
                                    <th className="text-left text-sm font-semibold text-gray-700" style={{ paddingTop: '12px', paddingBottom: '12px', paddingLeft: '4px', paddingRight: '12px' }}>Reason</th>
                                  </>
                                ) : (
                                  <>
                                    <th className="text-left p-3 text-sm font-semibold text-gray-700" style={{ width: '12%' }}>Date</th>
                                    <th className="text-left p-3 text-sm font-semibold text-gray-700">Payment</th>
                                    <th className="text-right p-3 text-sm font-semibold text-gray-700" style={{ width: '14%', whiteSpace: 'nowrap' }}>Amount (Ksh)</th>
                                    <th className="text-left text-sm font-semibold text-gray-700" style={{ paddingTop: '12px', paddingBottom: '12px', paddingLeft: '12px', paddingRight: '4px' }}>Voided By</th>
                                    <th className="text-left text-sm font-semibold text-gray-700" style={{ paddingTop: '12px', paddingBottom: '12px', paddingLeft: '4px', paddingRight: '12px' }}>Reason</th>
                                  </>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {pageData.records.map((record, index) => (
                                <tr key={record.id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : ''}`} style={index % 2 === 1 ? { backgroundColor: '#fcfcfd' } : {}}>
                                  {recordType === 'expenses' ? (
                                    <>
                                      <td className="p-3 text-sm text-gray-900" style={{ width: '12%' }}>
                                        <div>{formatDate(record.expense_date)}</div>
                                        <div className="text-xs text-gray-500 mt-1">{record.internal_reference}</div>
                                      </td>
                                      <td className="p-3 text-sm text-gray-900">
                                        <div>{record.category_name || 'N/A'}</div>
                                        {record.description_name && (
                                          <div className="text-xs text-gray-500 mt-1">{record.description_name}</div>
                                        )}
                                      </td>
                                      <td className="p-3 text-sm text-right font-medium text-red-600" style={{ width: '14%' }}>
                                        <div>{record.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        <div className="text-xs text-gray-500 mt-1">{record.vendor_name || 'N/A'}</div>
                                      </td>
                                      <td className="text-sm text-gray-900" style={{ paddingTop: '12px', paddingBottom: '12px', paddingLeft: '12px', paddingRight: '4px' }}>
                                        <div>{record.voided_by || 'N/A'}</div>
                                        {record.voided_by && (
                                          <div className="text-xs text-gray-500 mt-1">{formatDateTime(record.voided_at)}</div>
                                        )}
                                      </td>
                                      <td className="text-sm text-gray-900" style={{ paddingTop: '12px', paddingBottom: '12px', paddingLeft: '4px', paddingRight: '12px' }}>{record.void_reason}</td>
                                    </>
                                  ) : recordType === 'invoices' ? (
                                    <>
                                      <td className="p-3 text-sm text-gray-900" style={{ width: '12%' }}>
                                        <div>{formatDate(record.invoice_date)}</div>
                                        <div className="text-xs text-gray-500 mt-1">{record.original_invoice_number}</div>
                                      </td>
                                      <td className="p-3 text-sm text-gray-900">
                                        <div>{record.student_name || 'N/A'}</div>
                                        {record.description && (
                                          <div className="text-xs text-gray-500 mt-1">{record.description}</div>
                                        )}
                                      </td>
                                      <td className="p-3 text-sm text-right font-medium text-red-600" style={{ width: '14%' }}>
                                        <div>{record.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        <div className="text-xs text-gray-500 mt-1">{record.status || 'N/A'}</div>
                                      </td>
                                      <td className="text-sm text-gray-900" style={{ paddingTop: '12px', paddingBottom: '12px', paddingLeft: '12px', paddingRight: '4px' }}>
                                        <div>{record.voided_by || 'N/A'}</div>
                                        {record.voided_by && (
                                          <div className="text-xs text-gray-500 mt-1">{formatDateTime(record.voided_at)}</div>
                                        )}
                                      </td>
                                      <td className="text-sm text-gray-900" style={{ paddingTop: '12px', paddingBottom: '12px', paddingLeft: '4px', paddingRight: '12px' }}>{record.void_reason}</td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="p-3 text-sm text-gray-900" style={{ width: '12%' }}>
                                        <div>{formatDate(record.payment_date)}</div>
                                        <div className="text-xs text-gray-500 mt-1">{record.receipt_number}</div>
                                      </td>
                                      <td className="p-3 text-sm text-gray-900">
                                        <div>{record.student_name || 'N/A'}</div>
                                        {record.payment_method_name && (
                                          <div className="text-xs text-gray-500 mt-1">{record.payment_method_name}</div>
                                        )}
                                      </td>
                                      <td className="p-3 text-sm text-right font-medium text-red-600" style={{ width: '14%' }}>
                                        <div>{record.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        {record.account_name && (
                                          <div className="text-xs text-gray-500 mt-1">{record.account_name}</div>
                                        )}
                                      </td>
                                      <td className="text-sm text-gray-900" style={{ paddingTop: '12px', paddingBottom: '12px', paddingLeft: '12px', paddingRight: '4px' }}>
                                        <div>{record.voided_by || 'N/A'}</div>
                                        {record.voided_by && (
                                          <div className="text-xs text-gray-500 mt-1">{formatDateTime(record.voided_at)}</div>
                                        )}
                                      </td>
                                      <td className="text-sm text-gray-900" style={{ paddingTop: '12px', paddingBottom: '12px', paddingLeft: '4px', paddingRight: '12px' }}>{record.void_reason}</td>
                                    </>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : null}
                    </div>

                    {/* Summary Cards - Only on pages where showSummary is true */}
                    {pageData.showSummary && (
                      <div className="mt-8 grid grid-cols-3 gap-4 flex-shrink-0">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Total Records</p>
                          <p className="text-2xl font-semibold text-gray-900">{voidedRecords.length}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                          <p className="text-2xl font-semibold text-red-600">
                            Ksh. {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Average Amount</p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {voidedRecords.length > 0
                              ? `Ksh. ${(totalAmount / voidedRecords.length).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : 'Ksh. 0.00'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Footer with page number */}
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

export default VoidedRecordsReport;

