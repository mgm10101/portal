import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Download, Eye, Calendar, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { formatDateTime, formatDate } from '../../utils/dateUtils';
import { InvoiceSettings } from '../../types/database';
import { fetchMasterItems } from '../../services/financialService';
import { supabase } from '../../supabaseClient';
import logo from '../../assets/logo.png';

interface InvoiceSettings {
  logo_url: string | null;
  school_name: string | null;
  contact_info: string | null;
  address: string | null;
  payment_details: string | null;
}

interface StudentsByInvoiceItemsReportProps {
  onClose: () => void;
}

interface StudentInvoiceRecord {
  id: string;
  admission_number: string;
  name: string;
  class_name: string;
  invoice_number: string;
  invoice_date: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  status: string;
}

interface PageData {
  records: StudentInvoiceRecord[];
  pageNumber: number;
  totalPages: number;
  showSummary: boolean;
}

export const StudentsByInvoiceItemsReport: React.FC<StudentsByInvoiceItemsReportProps> = ({ onClose }) => {
  const [showConfigPopup, setShowConfigPopup] = useState(true);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [students, setStudents] = useState<StudentInvoiceRecord[]>([]);
  const [items, setItems] = useState<{ id: string; name: string; description: string; displayName: string }[]>([]);
  const [classList, setClassList] = useState<{ id: number; name: string }[]>([]);
  const [itemSearchTerm, setItemSearchTerm] = useState<string | null>(null);
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

  // Page layout constants (A4 dimensions in pixels at 96 DPI) - EXACTLY from VoidedRecordsReport
  const A4_WIDTH = 794;
  const A4_HEIGHT = 1123;
  const PAGE_MARGIN = 37.8;
  const HEADER_HEIGHT = 180;
  const FOOTER_HEIGHT = 50;
  const SUMMARY_HEIGHT = 120;
  const TABLE_HEADER_HEIGHT = 45;
  const ROW_HEIGHT = 60;

  // Calculate available height for content (excluding header, footer, margins)
  const calculateAvailableContentHeight = useCallback((includeSummary: boolean = false) => {
    const header = measuredHeights?.headerHeight || HEADER_HEIGHT;
    const footer = measuredHeights?.footerHeight || FOOTER_HEIGHT;
    const tableHeader = measuredHeights?.tableHeaderHeight || TABLE_HEADER_HEIGHT;
    const summary = includeSummary ? (measuredHeights?.summaryHeight || SUMMARY_HEIGHT) : 0;
    const usedHeight = header + footer + tableHeader;
    return A4_HEIGHT - (PAGE_MARGIN * 2) - usedHeight - summary;
  }, [measuredHeights]);

  
  // Split records into pages using actual row height measurement
  const splitIntoPages = useCallback((records: StudentInvoiceRecord[]): PageData[] => {
    if (records.length === 0) return [];
    
    const pages: PageData[] = [];
    let currentPageRecords: StudentInvoiceRecord[] = [];
    let currentPageNumber = 1;
    let currentCumulativeHeight = 0;
    
    const availableHeightWithoutSummary = calculateAvailableContentHeight(false);
    const availableHeightWithSummary = calculateAvailableContentHeight(true);
    const summaryHeight = measuredHeights?.summaryHeight || SUMMARY_HEIGHT;
    
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
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
      
      console.log(`🔍 [DEBUG] Row ${i}:`, {
        actualRowHeight,
        currentCumulativeHeight,
        newCumulativeHeight,
        availableHeightWithoutSummary,
        availableHeightWithSummary,
        wouldExceed: newCumulativeHeight > availableHeightWithoutSummary
      });
      
      // Check if adding this record would exceed the page limit
      if (newCumulativeHeight > availableHeightWithoutSummary) {
        // Current page is full, save it and start new page
        pages.push({
          records: [...currentPageRecords],
          pageNumber: currentPageNumber,
          totalPages: 0,
          showSummary: false
        });
        currentPageRecords = [record];
        currentCumulativeHeight = actualRowHeight;
        currentPageNumber++;
      } else {
        currentPageRecords.push(record);
        currentCumulativeHeight = newCumulativeHeight;
      }
    }
    
    // Handle the last page with remaining records
    if (currentPageRecords.length > 0) {
      const wouldFitWithSummary = (currentCumulativeHeight + summaryHeight) <= availableHeightWithSummary;
      
      pages.push({
        records: [...currentPageRecords],
        pageNumber: currentPageNumber,
        totalPages: 0,
        showSummary: wouldFitWithSummary
      });
      
      // If summary doesn't fit, add a separate summary page
      if (!wouldFitWithSummary) {
        pages.push({
          records: [],
          pageNumber: currentPageNumber + 1,
          totalPages: 0,
          showSummary: true
        });
      }
    }
    
    const totalPages = pages.length;
    return pages.map(page => ({ ...page, totalPages }));
  }, [calculateAvailableContentHeight, measuredHeights]);

  // Set default date range and fetch data on mount
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
    
    const todayString = formatDateLocal(today);
    const oneMonthAgoString = formatDateLocal(oneMonthAgo);
    
    console.log('Today:', today);
    console.log('One month ago:', oneMonthAgo);
    console.log('Today date string:', todayString);
    console.log('One month ago date string:', oneMonthAgoString);
    
    setDateTo(todayString);
    setDateFrom(oneMonthAgoString);

    async function fetchDropdownData() {
      try {
        // Fetch classes
        const { data: classesRes } = await supabase
          .from('classes')
          .select('id, name')
          .order('sort_order', { ascending: true });
        
        if (classesRes) setClassList(classesRes);

        // Fetch items using the same ordering as ProjectedRevenueReport
        const masterItems = await fetchMasterItems();
        console.log('Master items fetched:', masterItems);
        
        if (masterItems) {
          const itemsList = masterItems
            .filter(item => {
              // Filter out "Balance Brought Forward" items
              const isBalanceBroughtForward = item.item_name.toLowerCase().includes('balance') && 
                                           item.item_name.toLowerCase().includes('brought') && 
                                           item.item_name.toLowerCase().includes('forward');
              return !isBalanceBroughtForward;
            })
            .map(item => {
              const displayName = item.description 
                ? `${item.item_name} - ${item.description}`
                : item.item_name;
              console.log('Processing item:', {
                id: item.id,
                item_name: item.item_name,
                description: item.description,
                displayName,
                name: item.item_name
              });
              return {
                id: item.id.toString(),
                name: item.item_name,
                description: item.description || '',
                displayName
              };
            });
          console.log('Final items list:', itemsList);
          setItems(itemsList);
          // Set the first item as default selection if no item is selected
          if (itemsList.length > 0 && !selectedItem) {
            console.log('Setting default selected item:', itemsList[0].id);
            setSelectedItem(itemsList[0].id);
          }
        }
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

    fetchDropdownData();
    fetchInvoiceSettings();
  }, []);

  // Filter items based on search term
  const filteredItems = items.filter(item =>
    !itemSearchTerm || 
    item.displayName.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
    item.name.toLowerCase().includes(itemSearchTerm.toLowerCase())
  );

  // Add console log to track items state changes
  useEffect(() => {
    console.log('Items state updated:', items);
    console.log('Current selectedItem:', selectedItem);
  }, [items, selectedItem]);

  // Measure actual heights after rendering from the first rendered page (only once)
  useEffect(() => {
    if (!showPreview || students.length === 0 || pages.length === 0 || measuredHeights !== null) return;

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
      
      console.log('🔍 [DEBUG] Measuring rows:', allDataRows.length, 'rows found');
      
      allDataRows.forEach((row, index) => {
        const height = (row as HTMLElement).offsetHeight;
        rowHeights.push(height);
        if (height > maxRowHeight) {
          maxRowHeight = height;
        }
        totalRowHeight += height;
        if (index < 5) {
          console.log(`🔍 [DEBUG] Row ${index} height:`, height);
        }
      });
      
      const avgRowHeight = rowHeights.length > 0 ? totalRowHeight / rowHeights.length : ROW_HEIGHT;
      
      console.log('🔍 [DEBUG] Row height summary:', {
        count: rowHeights.length,
        maxRowHeight,
        avgRowHeight,
        availableWithoutSummary: calculateAvailableContentHeight(false),
        availableWithSummary: calculateAvailableContentHeight(true)
      });

      const summaryElement = firstPageElement.querySelector('.grid.grid-cols-3.gap-4') as HTMLElement;
      const summaryHeight = summaryElement ? summaryElement.offsetHeight : SUMMARY_HEIGHT;

      // Only set heights once to prevent infinite loop
      setMeasuredHeights({
        headerHeight,
        footerHeight,
        summaryHeight,
        tableHeaderHeight,
        rowHeights,
        maxRowHeight,
        avgRowHeight
      });
    };

    const timeoutId = setTimeout(measureHeights, 300);
    return () => clearTimeout(timeoutId);
  }, [showPreview, students.length]); // Remove pages.length from dependencies

  // Update pages when students or measuredHeights changes
  useEffect(() => {
    if (students.length > 0) {
      const splitPages = splitIntoPages(students);
      setPages(splitPages);
      pageRefs.current = new Array(splitPages.length).fill(null);
    } else {
      setPages([]);
    }
  }, [students, splitIntoPages, measuredHeights]);

  const handleClose = () => {
    setShowPreview(false);
    setShowConfigPopup(false);
    setStudents([]);
    onClose();
  };

  const handleGenerate = async () => {
    if (!dateFrom || !dateTo) {
      alert('Please select a date range');
      return;
    }
    if (!selectedItem) {
      alert('Please select an invoice item');
      return;
    }

    setLoading(true);
    try {
      // First fetch invoices with students
      // Use exclusion-based filtering: Get ALL invoices, then exclude specific types
      let invoiceQuery = supabase
        .from('invoices')
        .select(`
          invoice_number,
          invoice_date,
          status,
          admission_number,
          name,
          students (class_name)
        `)
        .gte('invoice_date', dateFrom)
        .lte('invoice_date', dateTo)
        .neq('status', 'Voided')      // Exclude voided invoices
        .neq('status', 'Forwarded')    // Exclude forwarded invoices
        .neq('withdrawn', true)         // Exclude withdrawn invoices
        .neq('bad_debt', true);        // Exclude bad debt invoices

      const { data: invoicesData, error: invoicesError } = await invoiceQuery;
      if (invoicesError) throw invoicesError;

      // Filter invoices by class if a specific class is selected
      let filteredInvoicesData = invoicesData;
      if (selectedClass !== 'all') {
        filteredInvoicesData = invoicesData.filter((invoice: any) => {
          const className = Array.isArray(invoice.students) 
            ? invoice.students[0]?.class_name 
            : invoice.students?.class_name;
          return className === selectedClass;
        });
      }

      if (!filteredInvoicesData || filteredInvoicesData.length === 0) {
        setStudents([]);
        setShowPreview(true);
        setShowConfigPopup(false);
        setLoading(false);
        return;
      }

      // Get all invoice numbers from filtered data
      const invoiceNumbers = filteredInvoicesData.map(inv => inv.invoice_number);

      // Fetch line items for these invoices
      let lineItemsQuery = supabase
        .from('invoice_line_items')
        .select('id, invoice_number, item_name, quantity, unit_price, line_total, description')
        .in('invoice_number', invoiceNumbers);

      // Find the selected item by id to get its name and description
      const selectedItemData = items.find(item => item.id === selectedItem);
      const selectedItemName = selectedItemData?.name;
      const selectedItemDescription = selectedItemData?.description;
      
      if (selectedItemName) {
        lineItemsQuery = lineItemsQuery.eq('item_name', selectedItemName);
      }
      
      // Also filter by description if it exists
      if (selectedItemDescription) {
        lineItemsQuery = lineItemsQuery.eq('description', selectedItemDescription);
      }

      const { data: lineItemsData, error: lineItemsError } = await lineItemsQuery;
      if (lineItemsError) throw lineItemsError;

      // If description field doesn't exist in line items, filter by description in application logic
      let filteredLineItemsData = lineItemsData;
      if (selectedItemDescription && lineItemsData && lineItemsData.length > 0) {
        // Check if description field exists in the data
        const hasDescriptionField = lineItemsData[0].hasOwnProperty('description');
        
        if (!hasDescriptionField) {
          // Filter by matching item_name and description from item_master
          console.log('Description field not found in line items, filtering by application logic');
          filteredLineItemsData = lineItemsData.filter((lineItem: any) => {
            // Find the corresponding item in item_master to match description
            const matchingItem = items.find(item => 
              item.name === lineItem.item_name && 
              item.description === selectedItemDescription
            );
            return matchingItem !== undefined;
          });
        }
      }

      // Create a map of invoices for quick lookup
      const invoiceMap = new Map(filteredInvoicesData.map(inv => [inv.invoice_number, inv]));

      // Transform the data
      const transformedData: StudentInvoiceRecord[] = (filteredLineItemsData || []).map((item: any) => {
        const invoice = invoiceMap.get(item.invoice_number) as any;
        return {
          id: item.id,
          admission_number: invoice?.admission_number || 'N/A',
          name: invoice?.name || 'N/A',
          class_name: Array.isArray(invoice?.students) ? invoice.students[0]?.class_name || 'N/A' : invoice?.students?.class_name || 'N/A',
          invoice_number: item.invoice_number || 'N/A',
          invoice_date: invoice?.invoice_date || '',
          item_name: item.item_name || 'N/A',
          quantity: parseInt(item.quantity) || 0,
          unit_price: parseFloat(item.unit_price) || 0,
          line_total: parseFloat(item.line_total) || 0,
          status: invoice?.status || 'N/A'
        };
      });

      transformedData.sort((a, b) => {
        const dateCompare = new Date(a.invoice_date).getTime() - new Date(b.invoice_date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return a.name.localeCompare(b.name);
      });

      setStudents(transformedData);
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

      const sanitizeFilename = (str: string) => str.replace(/[<>:"/\\|?*]/g, '_').trim();
      const filename = `Students_By_Invoice_Items_${dateFrom}_to_${dateTo}.pdf`;
      pdf.save(sanitizeFilename(filename));
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExportingPdf(false);
    }
  }, [pages, dateFrom, dateTo, exportingPdf]);

  const totalAmount = students.reduce((sum, record) => sum + record.line_total, 0);
  const totalQuantity = students.reduce((sum, record) => sum + record.quantity, 0);

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
              <h2 className="text-xl font-semibold text-gray-800">Students by Invoice Items Report</h2>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Date From <span className="text-red-500">*</span>
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
                    Invoice Date To <span className="text-red-500">*</span>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class (Optional)
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Classes</option>
                  {classList.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Item
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={itemSearchTerm !== null ? itemSearchTerm : items.find(item => item.id === selectedItem)?.displayName || ''}
                    onChange={(e) => {
                      if (itemSearchTerm !== null) {
                        setItemSearchTerm(e.target.value);
                      }
                    }}
                    onFocus={() => setItemSearchTerm('')}
                    onBlur={() => {
                      // Delay to allow click on dropdown items
                      setTimeout(() => {
                        if (itemSearchTerm === '' || itemSearchTerm === null) {
                          setItemSearchTerm(null);
                        }
                      }, 200);
                    }}
                    placeholder="Search for an item..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    readOnly={itemSearchTerm === null}
                  />
                  {itemSearchTerm !== null && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredItems.length > 0 ? (
                        filteredItems.map((item) => (
                          <div
                            key={item.id}
                            onMouseDown={() => {
                              setSelectedItem(item.id);
                              setItemSearchTerm(null);
                            }}
                            className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">{item.displayName}</div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-gray-500 text-center">
                          No items found
                        </div>
                      )}
                    </div>
                  )}
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
                  disabled={loading || !dateFrom || !dateTo || !selectedItem}
                  className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 ${
                    loading || !dateFrom || !dateTo || !selectedItem ? 'opacity-50 cursor-not-allowed' : ''
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
              {students.length === 0 ? (
                <div
                  className="bg-white mx-auto p-8"
                  style={{
                    width: `${A4_WIDTH}px`,
                    minHeight: `${A4_HEIGHT}px`,
                    padding: `${PAGE_MARGIN}px`,
                  }}
                >
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg">No records found for the selected criteria.</p>
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
                          <h1 className="text-3xl font-normal text-gray-900 mb-2">Students by Invoice Items Report</h1>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Invoice Item:</strong> {items.find(item => item.id === selectedItem)?.displayName || selectedItem}</p>
                            <p><strong>Filter:</strong> {selectedClass === 'all' ? 'All Classes' : selectedClass}, Invoice Date Range from {formatDate(dateFrom)} to {formatDate(dateTo)}</p>
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
                                <th className="text-left p-3 text-sm font-semibold text-gray-700" style={{ width: '12%' }}>Adm No</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700" style={{ width: '22%' }}>Student Name</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700" style={{ width: '10%' }}>Class</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700" style={{ width: '12%' }}>Invoice</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700" style={{ width: '12%' }}>Date</th>
                                <th className="text-right p-3 text-sm font-semibold text-gray-700" style={{ width: '8%' }}>Qty</th>
                                <th className="text-right p-3 text-sm font-semibold text-gray-700" style={{ width: '12%' }}>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pageData.records.map((record, index) => (
                                <tr key={record.id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : ''}`} style={index % 2 === 1 ? { backgroundColor: '#fcfcfd' } : {}}>
                                  <td className="p-3 text-sm text-gray-900">{record.admission_number}</td>
                                  <td className="p-3 text-sm text-gray-900">{record.name}</td>
                                  <td className="p-3 text-sm text-gray-900">{record.class_name}</td>
                                  <td className="p-3 text-sm text-gray-900">{record.invoice_number}</td>
                                  <td className="p-3 text-sm text-gray-900">{formatDate(record.invoice_date)}</td>
                                  <td className="p-3 text-sm text-right text-gray-900">{record.quantity}</td>
                                  <td className="p-3 text-sm text-right font-medium text-gray-900">{record.line_total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
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
                          <p className="text-2xl font-semibold text-gray-900">{students.length}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Total Quantity</p>
                          <p className="text-2xl font-semibold text-gray-900">{totalQuantity}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                          <p className="text-2xl font-semibold text-green-600">
                            Ksh. {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

export default StudentsByInvoiceItemsReport;
