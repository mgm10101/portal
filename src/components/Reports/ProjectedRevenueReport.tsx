import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, Download, Eye, X, Loader2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { fetchMasterItems } from '../../services/financialService';
import { ItemMaster } from '../../types/database';
import logo from '../../assets/logo.png';

interface InvoiceSettings {
  logo_url: string | null;
  school_name: string | null;
  contact_info: string | null;
  address: string | null;
  payment_details: string | null;
}

interface ProjectedRevenueReportProps {
  onClose: () => void;
}

interface LineItemAggregate {
  itemId: string;
  itemName: string;
  description: string | null;
  totalQuantity: number;
  totalAmount: number;
  invoiceCount: number;
}

interface ItemNameSummary {
  itemName: string;
  totalQuantity: number;
  totalAmount: number;
  invoiceCount: number;
  descriptionCount: number;
}

interface PageData {
  records: LineItemAggregate[];
  pageNumber: number;
  totalPages: number;
  showSummary: boolean;
  isHighLevelSummary?: boolean;
  summaryData?: ItemNameSummary[];
}

export const ProjectedRevenueReport: React.FC<ProjectedRevenueReportProps> = ({ onClose }) => {
  const [showConfigPopup, setShowConfigPopup] = useState(true);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [lineItems, setLineItems] = useState<LineItemAggregate[]>([]);
  const [summaryData, setSummaryData] = useState<ItemNameSummary[]>([]);
  const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);
  const [itemMaster, setItemMaster] = useState<ItemMaster[]>([]);
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
  const ROW_HEIGHT = 45;

  const calculateAvailableContentHeight = useCallback((includeSummary: boolean = false) => {
    const header = measuredHeights?.headerHeight || HEADER_HEIGHT;
    const footer = measuredHeights?.footerHeight || FOOTER_HEIGHT;
    const tableHeader = measuredHeights?.tableHeaderHeight || TABLE_HEADER_HEIGHT;
    const summary = includeSummary ? (measuredHeights?.summaryHeight || SUMMARY_HEIGHT) : 0;
    const usedHeight = header + footer + tableHeader;
    return A4_HEIGHT - (PAGE_MARGIN * 2) - usedHeight - summary;
  }, [measuredHeights]);

  // Split records into pages using actual row height measurement
  const splitIntoPages = useCallback((items: LineItemAggregate[], summary: ItemNameSummary[]): PageData[] => {
    if (items.length === 0 && summary.length === 0) return [];
    
    const pages: PageData[] = [];
    
    // First, paginate the high-level summary if it exists
    if (summary.length > 0) {
      let currentPageSummary: ItemNameSummary[] = [];
      let currentPageNumber = 1;
      let currentCumulativeHeight = 0;
      
      const availableHeightWithoutSummary = calculateAvailableContentHeight(false);
      const availableHeightWithSummary = calculateAvailableContentHeight(true);
      const summaryHeight = measuredHeights?.summaryHeight || SUMMARY_HEIGHT;
      
      for (let i = 0; i < summary.length; i++) {
        const item = summary[i];
        const isLastRecord = i === summary.length - 1;
        
        // Use standard row height for summary items
        const actualRowHeight = ROW_HEIGHT;
        const newCumulativeHeight = currentCumulativeHeight + actualRowHeight;
        
        if (isLastRecord) {
          // This is the last summary record - need to decide if summary cards fit
          const wouldFitWithSummary = (newCumulativeHeight + summaryHeight) <= availableHeightWithSummary;
          
          if (wouldFitWithSummary) {
            // Add record and summary cards to current page
            currentPageSummary.push(item);
            pages.push({
              records: [],
              pageNumber: currentPageNumber,
              totalPages: 0,
              showSummary: true,
              isHighLevelSummary: true,
              summaryData: [...currentPageSummary]
            });
          } else {
            // Check if record alone fits on current page
            if (newCumulativeHeight <= availableHeightWithoutSummary) {
              // Add record to current page, summary cards go to next
              currentPageSummary.push(item);
              pages.push({
                records: [],
                pageNumber: currentPageNumber,
                totalPages: 0,
                showSummary: false,
                isHighLevelSummary: true,
                summaryData: [...currentPageSummary]
              });
              // Add summary cards-only page
              pages.push({
                records: [],
                pageNumber: currentPageNumber + 1,
                totalPages: 0,
                showSummary: true,
                isHighLevelSummary: true,
                summaryData: []
              });
            } else {
              // Current page is full, save it and start new page with record and summary cards
              pages.push({
                records: [],
                pageNumber: currentPageNumber,
                totalPages: 0,
                showSummary: false,
                isHighLevelSummary: true,
                summaryData: [...currentPageSummary]
              });
              pages.push({
                records: [],
                pageNumber: currentPageNumber + 1,
                totalPages: 0,
                showSummary: true,
                isHighLevelSummary: true,
                summaryData: [item]
              });
            }
          }
        } else {
          // Not the last record - check if adding this record would exceed page limit
          if (newCumulativeHeight > availableHeightWithoutSummary) {
            // Current page is full, save it and start new page
            pages.push({
              records: [],
              pageNumber: currentPageNumber,
              totalPages: 0,
              showSummary: false,
              isHighLevelSummary: true,
              summaryData: [...currentPageSummary]
            });
            currentPageSummary = [item];
            currentCumulativeHeight = actualRowHeight;
            currentPageNumber++;
          } else {
            currentPageSummary.push(item);
            currentCumulativeHeight = newCumulativeHeight;
          }
        }
      }
    }
    
    // Then process the detailed items
    let currentPageRecords: LineItemAggregate[] = [];
    let currentPageNumber = pages.length + 1;
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
    
    setDateTo(formatDateLocal(today));
    setDateFrom(formatDateLocal(oneMonthAgo));

    async function fetchDropdownData() {
      try {
        const { data: classesRes } = await supabase
          .from('classes')
          .select('id, name')
          .order('sort_order', { ascending: true });
        
        if (classesRes) setClasses(classesRes);

        // Fetch item master data for sorting using existing service
        const masterItems = await fetchMasterItems();
        if (masterItems) setItemMaster(masterItems);
      } catch (err) {
        console.error('Error fetching dropdown data:', err);
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
    if (lineItems.length > 0) {
      const splitPages = splitIntoPages(lineItems, summaryData);
      setPages(splitPages);
      pageRefs.current = new Array(splitPages.length).fill(null);
    } else {
      setPages([]);
    }
  }, [lineItems, summaryData, splitIntoPages, measuredHeights]);

  // Measure actual heights after rendering from the first rendered page
  useEffect(() => {
    if (!showPreview || lineItems.length === 0 || pages.length === 0) return;

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
  }, [showPreview, lineItems, pages.length]);

  // Helper function to get sort order for an item
  const getSortOrderForItem = useCallback((itemName: string, description: string | null): number => {
    // Find matching item in item_master
    const matchingItem = itemMaster.find(item => 
      item.item_name === itemName && 
      (item.description === description || 
       (item.description === null && description === null) ||
       (item.description === '' && description === null) ||
       (item.description === null && description === ''))
    );
    
    return matchingItem ? (matchingItem.sort_order || 999) : 999; // Put unknown items last
  }, [itemMaster]);

  // Helper function to group items by name (case-insensitive)
  const groupByItemName = useCallback((items: LineItemAggregate[]): ItemNameSummary[] => {
    const grouped: { [key: string]: ItemNameSummary } = {};
    
    items.forEach(item => {
      const normalizedName = item.itemName.toLowerCase().trim();
      
      if (!grouped[normalizedName]) {
        grouped[normalizedName] = {
          itemName: item.itemName, // Keep original casing for display
          totalQuantity: 0,
          totalAmount: 0,
          invoiceCount: 0,
          descriptionCount: 0
        };
      }
      
      grouped[normalizedName].totalQuantity += item.totalQuantity;
      grouped[normalizedName].totalAmount += item.totalAmount;
      grouped[normalizedName].invoiceCount += item.invoiceCount;
      grouped[normalizedName].descriptionCount += 1;
    });
    
    // Sort by total amount descending
    return Object.values(grouped).sort((a, b) => b.totalAmount - a.totalAmount);
  }, []);

  const handleClose = () => {
    setShowPreview(false);
    setShowConfigPopup(false);
    setLineItems([]);
    onClose();
  };

  const handleGenerate = async () => {
    if (!dateFrom || !dateTo) {
      alert('Please select a date range');
      return;
    }

    setLoading(true);
    try {
      // First, get invoices in the date range
      let invoiceQuery = supabase
        .from('invoices')
        .select('invoice_number, students!inner(class_name)')
        .gte('invoice_date', dateFrom)
        .lte('invoice_date', dateTo)
        .neq('status', 'Voided');

      if (selectedClass !== 'all') {
        invoiceQuery = invoiceQuery.eq('students.class_name', selectedClass);
      }

      const { data: invoices, error: invoiceError } = await invoiceQuery;
      
      if (invoiceError) throw invoiceError;
      
      console.log('🔍 [DEBUG] Class filter - Selected Class:', selectedClass);
      console.log('🔍 [DEBUG] Class filter - Invoices fetched:', invoices?.length);
      console.log('🔍 [DEBUG] Class filter - Sample invoice data:', invoices?.[0]);
      
      if (!invoices || invoices.length === 0) {
        setLineItems([]);
        setShowPreview(true);
        setShowConfigPopup(false);
        setLoading(false);
        return;
      }

      // Extract invoice numbers
      const invoiceNumbers = (invoices || []).map(inv => inv.invoice_number);
      
      // Get line items for these invoices
      const { data: lineItemsData, error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .select('item_name, description, unit_price, quantity, discount, line_total')
        .in('invoice_number', invoiceNumbers);

      if (lineItemsError) throw lineItemsError;

      // Aggregate by composite key (item_name + description) for uniqueness
      const aggregated: { [key: string]: LineItemAggregate } = {};
      
      (lineItemsData || []).forEach(item => {
        const itemName = item.item_name || 'Unknown Item';
        const description = item.description || null;
        // Create composite key for uniqueness
        const compositeKey = `${itemName}|${description || ''}`;
        
        if (!aggregated[compositeKey]) {
          aggregated[compositeKey] = {
            itemId: compositeKey, // Use composite key as ID
            itemName,
            description,
            totalQuantity: 0,
            totalAmount: 0,
            invoiceCount: 0
          };
        }
        aggregated[compositeKey].totalQuantity += item.quantity || 0;
        aggregated[compositeKey].totalAmount += item.line_total || 0;
        aggregated[compositeKey].invoiceCount += 1;
      });

      // Sort by sort_order from item_master, then by total amount descending
      // Items not found in item_master (sort_order = 999) go to the end
      const sortedItems = Object.values(aggregated).sort((a, b) => {
        const sortOrderA = getSortOrderForItem(a.itemName, a.description);
        const sortOrderB = getSortOrderForItem(b.itemName, b.description);
        
        // Check if items were found in item_master (sort_order < 999)
        const foundA = sortOrderA < 999;
        const foundB = sortOrderB < 999;
        
        // Found items come first, missing items go to end
        if (foundA && !foundB) return -1; // A found, B missing → A first
        if (!foundA && foundB) return 1;  // A missing, B found → B first
        
        // Both found or both missing - sort by sort_order
        if (sortOrderA !== sortOrderB) return sortOrderA - sortOrderB;
        
        // If same sort_order, sort by total amount descending
        return b.totalAmount - a.totalAmount;
      });
      
      setLineItems(sortedItems);
      
      // Create high-level summary data
      const summary = groupByItemName(sortedItems);
      setSummaryData(summary);
      
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

      const filename = `Projected_Revenue_${dateFrom}_to_${dateTo}.pdf`;
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
    const totalRevenue = lineItems.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalItems = lineItems.length;
    const totalQuantity = lineItems.reduce((sum, item) => sum + item.totalQuantity, 0);
    
    return { totalRevenue, totalItems, totalQuantity };
  };

  // Get high-level summary statistics
  const getHighLevelSummaryStats = () => {
    const totalRevenue = summaryData.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalItems = summaryData.length;
    const totalQuantity = summaryData.reduce((sum, item) => sum + item.totalQuantity, 0);
    const totalVariations = summaryData.reduce((sum, item) => sum + item.descriptionCount, 0);
    
    return { totalRevenue, totalItems, totalQuantity, totalVariations };
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
              <h2 className="text-xl font-semibold text-gray-800">Projected Revenue by Source</h2>
              <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
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
                  {classes.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
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
              {lineItems.length === 0 ? (
                <div
                  className="bg-white mx-auto p-8"
                  style={{
                    width: `${A4_WIDTH}px`,
                    minHeight: `${A4_HEIGHT}px`,
                    padding: `${PAGE_MARGIN}px`,
                  }}
                >
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg">No invoice line items found for the selected criteria.</p>
                  </div>
                </div>
              ) : (
                pages.map((pageData, pageIndex) => {
                  // Calculate continuous numbering across pages
                  const previousPagesItemsCount = pages.slice(0, pageIndex).reduce((sum, page) => sum + page.records.length, 0);
                  return (
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
                          <h1 className="text-3xl font-normal text-gray-900 mb-2">Projected Revenue by Source</h1>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Invoice Date Range:</strong> {formatDate(dateFrom)} to {formatDate(dateTo)}</p>
                            <p><strong>Class:</strong> {selectedClass === 'all' ? 'All Classes' : selectedClass}</p>
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

                    {/* Line Items Table */}
                    <div className="flex-1 overflow-hidden">
                      {pageData.isHighLevelSummary && pageData.summaryData ? (
                        // High-level summary page
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-50 border-b-2 border-gray-200">
                                <th className="text-left p-3 text-sm font-semibold text-gray-700" style={{ width: '5%' }}>#</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700">Item Name</th>
                                <th className="text-right p-3 text-sm font-semibold text-gray-700" style={{ width: '12%' }}>Qty</th>
                                <th className="text-right p-3 text-sm font-semibold text-gray-700" style={{ width: '15%' }}>Invoices</th>
                                <th className="text-right p-3 text-sm font-semibold text-gray-700" style={{ width: '15%' }}>Variations</th>
                                <th className="text-right p-3 text-sm font-semibold text-gray-700" style={{ width: '20%' }}>Total Amount (Ksh)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pageData.summaryData.map((item, index) => (
                                <tr key={item.itemName} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : ''}`} style={index % 2 === 1 ? { backgroundColor: '#fcfcfd' } : {}}>
                                  <td className="p-3 text-sm text-gray-600">{index + 1}</td>
                                  <td className="p-3 text-sm text-gray-900">
                                    <p className="font-medium">{item.itemName}</p>
                                  </td>
                                  <td className="p-3 text-sm text-gray-600 text-right">{item.totalQuantity.toLocaleString()}</td>
                                  <td className="p-3 text-sm text-gray-600 text-right">{item.invoiceCount.toLocaleString()}</td>
                                  <td className="p-3 text-sm text-gray-600 text-right">{item.descriptionCount}</td>
                                  <td className="p-3 text-sm text-right font-medium text-green-600">{formatCurrency(item.totalAmount)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : pageData.records.length > 0 ? (
                        // Detailed items page
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-50 border-b-2 border-gray-200">
                                <th className="text-left p-3 text-sm font-semibold text-gray-700" style={{ width: '5%' }}>#</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700">Item Name</th>
                                <th className="text-right p-3 text-sm font-semibold text-gray-700" style={{ width: '12%' }}>Qty</th>
                                <th className="text-right p-3 text-sm font-semibold text-gray-700" style={{ width: '15%' }}>Invoices</th>
                                <th className="text-right p-3 text-sm font-semibold text-gray-700" style={{ width: '20%' }}>Total Amount (Ksh)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pageData.records.map((item, index) => (
                                <tr key={item.itemId} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : ''}`} style={index % 2 === 1 ? { backgroundColor: '#fcfcfd' } : {}}>
                                  <td className="p-3 text-sm text-gray-600">{previousPagesItemsCount + index + 1}</td>
                                  <td className="p-3 text-sm text-gray-900">
                                  <p className="font-medium">{item.itemName}</p>
                                  {item.description && (
                                    <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                                  )}
                                </td>
                                  <td className="p-3 text-sm text-gray-600 text-right">{item.totalQuantity.toLocaleString()}</td>
                                  <td className="p-3 text-sm text-gray-600 text-right">{item.invoiceCount.toLocaleString()}</td>
                                  <td className="p-3 text-sm text-right font-medium text-green-600">{formatCurrency(item.totalAmount)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : null}
                    </div>

                    {/* Summary Cards */}
                    {pageData.showSummary && (
                      <div className={`mt-8 grid gap-4 flex-shrink-0 ${pageData.isHighLevelSummary ? 'grid-cols-4' : 'grid-cols-3'}`}>
                        {pageData.isHighLevelSummary ? (
                          // High-level summary cards
                          <>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="text-sm text-gray-600 mb-1">Item Categories</p>
                              <p className="text-2xl font-semibold text-gray-900">{getHighLevelSummaryStats().totalItems}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="text-sm text-gray-600 mb-1">Total Quantity</p>
                              <p className="text-2xl font-semibold text-blue-600">{getHighLevelSummaryStats().totalQuantity.toLocaleString()}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="text-sm text-gray-600 mb-1">Total Variations</p>
                              <p className="text-2xl font-semibold text-purple-600">{getHighLevelSummaryStats().totalVariations.toLocaleString()}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="text-sm text-gray-600 mb-1">Total Projected Revenue</p>
                              <p className="text-2xl font-semibold text-green-600">Ksh. {formatCurrency(getHighLevelSummaryStats().totalRevenue)}</p>
                            </div>
                          </>
                        ) : (
                          // Detailed summary cards
                          <>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="text-sm text-gray-600 mb-1">Total Revenue Items</p>
                              <p className="text-2xl font-semibold text-gray-900">{stats.totalItems}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="text-sm text-gray-600 mb-1">Total Quantity</p>
                              <p className="text-2xl font-semibold text-blue-600">{stats.totalQuantity.toLocaleString()}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="text-sm text-gray-600 mb-1">Total Projected Revenue</p>
                              <p className="text-2xl font-semibold text-green-600">Ksh. {formatCurrency(stats.totalRevenue)}</p>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="mt-auto pt-4 border-t border-gray-200 flex-shrink-0" style={{ height: `${FOOTER_HEIGHT}px` }}>
                      <div className="text-center text-sm text-gray-600">
                        Page {pageData.pageNumber} of {pageData.totalPages}
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ProjectedRevenueReport;
