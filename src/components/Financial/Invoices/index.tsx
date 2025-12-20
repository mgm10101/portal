import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { fetchInvoices, fetchFullInvoice } from '../../../services/financialService';
import { InvoiceHeader } from '../../../types/database';
import { InvoiceForm } from './InvoiceForm';
import { InvoiceSummary } from './InvoiceSummary';
import { InvoiceFilters } from './InvoiceFilters';
import { InvoiceTable } from './InvoiceTable';
import InvoiceDisplay, { InvoiceData } from './InvoiceDisplay';

// Page layout constants (A4 dimensions in pixels at 96 DPI)
const A4_WIDTH = 794; // 210mm * 96 / 25.4
const A4_HEIGHT = 1123; // 297mm * 96 / 25.4
const PAGE_MARGIN = 37.8; // Top, bottom, left, right margins in pixels (matching invoice padding)
const FOOTER_HEIGHT = 50; // Footer height for page number in pixels

export const Invoices: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceHeader[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceHeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceHeader | null>(null);
  const [invoiceToDisplay, setInvoiceToDisplay] = useState<InvoiceData | null>(null);
  const [dynamicBottomPadding, setDynamicBottomPadding] = useState<number>(0);
  const [exportingPdf, setExportingPdf] = useState(false);
  const invoiceContentRef = useRef<HTMLDivElement>(null);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInvoices();
      setInvoices(data);
      setFilteredInvoices(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load invoices.');
      setInvoices([]);
      setFilteredInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleViewInvoice = useCallback(async (invoice: InvoiceHeader) => {
    try {
      const fullDetails = await fetchFullInvoice(invoice.invoice_number);
      if (!fullDetails) return;

      const safeBalanceDue = Number(fullDetails.balanceDue) || 0;
      const safeSubtotal = Number(fullDetails.subtotal) || 0;
      const safePaymentMade = Number(fullDetails.paymentMade) || 0;

      const mappedData: InvoiceData = {
        invoiceNumber: fullDetails.invoice_number,
        balanceDue: safeBalanceDue,
        invoiceDate: fullDetails.invoice_date,
        dueDate: fullDetails.due_date,
        status: fullDetails.status as 'Overdue' | 'Paid' | 'Draft' | 'Pending' | 'Forwarded',
        billToName: fullDetails.name,
        billToDescription: fullDetails.description || 'N/A',
        slogan: '"Nurturing Their Potential"',
        items: fullDetails.line_items.map((item: any) => ({
          id: item.id,
          description: item.itemName,
          details: item.description || '',
          quantity: item.quantity,
          rate: item.unitPrice,
          total: item.quantity * item.unitPrice,
          finalAmount: item.lineTotal,
          discount: item.discount > 0 ? `(${item.discount}% Discount)` : undefined,
        })),
        subTotal: safeSubtotal,
        paymentMade: safePaymentMade,
        finalBalance: safeBalanceDue,
        paymentBanks: [
          { bank: 'KCB BANK', branch: 'TALA BRANCH', accountNumber: '1283819074', paybillNumber: '522 522' },
          { bank: 'DTB BANK', branch: 'TWO RIVERS BRANCH', accountNumber: '0678239001', paybillNumber: '516 600' },
        ],
        admissionNumber: invoice.admission_number, // Store admission number for PDF naming
      };

      setInvoiceToDisplay(mappedData);
    } catch (error) {
      console.error('Failed to fetch full invoice details:', error);
    }
  }, []);

  const handleCloseDisplay = useCallback(() => setInvoiceToDisplay(null), []);

  // Calculate dynamic bottom padding based on content height
  useEffect(() => {
    if (!invoiceToDisplay || !invoiceContentRef.current) return;

    const calculatePadding = () => {
      const wrapperElement = invoiceContentRef.current;
      if (!wrapperElement) return;

      // Get the actual invoice container inside the wrapper
      const invoiceContainer = wrapperElement.querySelector('#invoice-container') as HTMLElement;
      if (!invoiceContainer) return;

      // A4 page height at 96 DPI: 1123px (297mm * 96 / 25.4)
      const a4PageHeight = A4_HEIGHT;
      
      // Temporarily set bottom padding to 0 to measure content height accurately
      const originalPaddingBottom = wrapperElement.style.paddingBottom;
      wrapperElement.style.paddingBottom = '0px';
      
      // Force a reflow to get accurate measurements
      void wrapperElement.offsetHeight;
      
      // Measure the actual content height (invoice container height)
      const contentHeight = invoiceContainer.offsetHeight;
      
      // Restore original padding
      wrapperElement.style.paddingBottom = originalPaddingBottom;
      
      // Calculate padding needed to reach A4 page height
      // We want: contentHeight + dynamicBottomPadding = a4PageHeight
      const paddingNeeded = a4PageHeight - contentHeight;
      
      // If content is shorter than a full page, add padding to fill the page
      // Only add padding if it's positive and reasonable (not too large)
      if (paddingNeeded > 0 && paddingNeeded < a4PageHeight) {
        setDynamicBottomPadding(paddingNeeded);
      } else {
        // If content fills or exceeds a page, use minimal padding
        setDynamicBottomPadding(0);
      }
    };

    // Calculate after a short delay to ensure content is rendered
    const timeoutId = setTimeout(calculatePadding, 200);
    
    // Also recalculate when window resizes
    window.addEventListener('resize', calculatePadding);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', calculatePadding);
    };
  }, [invoiceToDisplay]);

  // --- OPTIMIZED PDF EXPORT (Reduced file size) ---
  const handleExportToPdf = useCallback(async () => {
    if (!invoiceToDisplay || exportingPdf) return;
    const element = document.getElementById('invoice-pdf-wrapper');
    if (!element) return;

    setExportingPdf(true);
    try {
      // Get row positions BEFORE hiding footer (so measurements are accurate)
    const invoiceContainer = element.querySelector('#invoice-container') as HTMLElement;
    const tableRows: number[] = [];
    
    if (invoiceContainer) {
      // Find all table rows (including header and data rows)
      const rows = invoiceContainer.querySelectorAll('table tbody tr, table thead tr');
      const wrapperRect = element.getBoundingClientRect();
      
      rows.forEach((row) => {
        const rect = row.getBoundingClientRect();
        // Calculate relative position from top of wrapper element (which is what gets captured)
        const relativeTop = rect.top - wrapperRect.top;
        const relativeBottom = rect.bottom - wrapperRect.top;
        // Account for canvas scale (1.5) - the canvas will be scaled, so we need to scale the positions
        const canvasTop = relativeTop * 1.5;
        const canvasBottom = relativeBottom * 1.5;
        // Store both top and bottom of each row
        tableRows.push(Math.floor(canvasTop));
        tableRows.push(Math.floor(canvasBottom));
      });
      
      // Sort row boundaries and remove duplicates
      tableRows.sort((a, b) => a - b);
      // Remove duplicates
      const uniqueRows = Array.from(new Set(tableRows));
      tableRows.length = 0;
      tableRows.push(...uniqueRows);
    }

    // Hide the footer in the HTML (we'll add it in PDF)
    const footer = invoiceContainer ? invoiceContainer.querySelector('.invoice-footer') as HTMLElement : null;
    const originalFooterDisplay = footer ? footer.style.display : '';
    if (footer) {
      footer.style.display = 'none';
    }

    element.classList.add('exporting');

    // Wait a moment for the DOM to update
    await new Promise(resolve => setTimeout(resolve, 50));

    // DEBUG: Log element dimensions
    const rect = element.getBoundingClientRect();
    console.log('🔍 [PDF DEBUG] Element dimensions:', {
      width: rect.width,
      height: rect.height,
      scrollWidth: element.scrollWidth,
      scrollHeight: element.scrollHeight,
      offsetWidth: element.offsetWidth,
      offsetHeight: element.offsetHeight
    });

    const canvas = await html2canvas(element, {
      scale: 1.5, // Reduced from 2 to 1.5 (still high quality, smaller file)
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 794, // A4 width at 96 DPI
      windowWidth: 794,
      imageTimeout: 15000, // Timeout for images
      removeContainer: false,
    });

    // DEBUG: Log canvas dimensions
    console.log('🔍 [PDF DEBUG] Canvas dimensions:', {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      canvasAspectRatio: canvas.width / canvas.height
    });

    // DEBUG: Check if logo is in the canvas and its dimensions
    const canvasContext = canvas.getContext('2d');
    if (canvasContext) {
      canvasContext.getImageData(0, 0, Math.min(400, canvas.width), Math.min(200, canvas.height));
      console.log('🔍 [PDF DEBUG] Top-left area of canvas captured (for logo check)');
    }

    // Convert to JPEG with quality 0.85 (good balance between quality and size)
    const imgData = canvas.toDataURL('image/jpeg', 0.85);
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm

    // DEBUG: Log PDF page dimensions
    console.log('🔍 [PDF DEBUG] PDF page dimensions:', {
      pageWidth,
      pageHeight
    });

    // Convert canvas pixels to mm: At 96 DPI, 1 pixel = 25.4/96 mm = 0.264583mm
    const pixelsToMm = 25.4 / 96;
    
    // The canvas is captured at scale 1.5, so canvas.width = element.width * 1.5
    // To get the original element size in mm, divide by scale
    const elementWidthMm = (canvas.width / 1.5) * pixelsToMm;
    const elementHeightMm = (canvas.height / 1.5) * pixelsToMm;
    
    // DEBUG: Log conversion calculations
    console.log('🔍 [PDF DEBUG] Conversion calculations:', {
      pixelsToMm,
      canvasWidthPx: canvas.width,
      canvasHeightPx: canvas.height,
      elementWidthMm,
      elementHeightMm,
      elementAspectRatio: elementWidthMm / elementHeightMm,
      expectedElementWidthMm: 210, // A4 width
      pdfPageWidth: pageWidth
    });
    
    // DON'T scale - use exact dimensions to match PDF
    // The element is designed to be 210mm (A4 width), so use it directly
    const margin = 10;
    const imgWidth = pageWidth - (margin * 2); // 190mm - exact fit
    const imgHeight = (canvas.height / canvas.width) * (imgWidth / pixelsToMm) * pixelsToMm;
    
    console.log('🔍 [PDF DEBUG] Final dimensions (NO SCALING):', {
      margin,
      imgWidth,
      imgHeight,
      imgWidthPx: imgWidth / pixelsToMm,
      imgHeightPx: imgHeight / pixelsToMm,
      aspectRatio: imgWidth / imgHeight,
      canvasAspectRatio: canvas.width / canvas.height
    });

    // Calculate how to fit the canvas into PDF maintaining aspect ratio
    // Canvas aspect: canvas.width / canvas.height
    // Available space: imgWidth (190mm) x (pageHeight - 20mm)
    const availableHeight = pageHeight - (margin * 2);
    const canvasAspectRatio = canvas.width / canvas.height;
    const finalImgWidth = imgWidth;
    const finalImgHeight = finalImgWidth / canvasAspectRatio;

    console.log('🔍 [PDF DEBUG] PDF placement:', {
      availableHeight,
      finalImgWidth,
      finalImgHeight,
      willNeedPages: Math.ceil(finalImgHeight / availableHeight)
    });

    // Calculate how many canvas pixels correspond to the available height per page
    // finalImgHeight (mm) corresponds to canvas.height (pixels)
    // So: availableHeight (mm) corresponds to (availableHeight / finalImgHeight) * canvas.height (pixels)
    const availableHeightInCanvasPx = (availableHeight / finalImgHeight) * canvas.height;
    
    // Helper function to find a safe cut point before a given position
    // Returns the position of the last complete row boundary before the cut point
    const findPreviousRowBoundary = (position: number): number => {
      if (tableRows.length === 0) {
        // Fallback: use estimated row height if we can't detect rows
        const estimatedRowHeight = 70;
        return Math.floor(position / estimatedRowHeight) * estimatedRowHeight;
      }
      
      // Find the last row boundary (top or bottom) that is before the position
      // This ensures we don't cut through the middle of a row
      let lastBoundary = 0;
      for (const boundary of tableRows) {
        if (boundary <= position) {
          lastBoundary = boundary;
        } else {
          break;
        }
      }
      return lastBoundary;
    };
    
    // Helper function to find the next row boundary after a given position
    const findNextRowBoundary = (position: number): number => {
      if (tableRows.length === 0) {
        // Fallback: use estimated row height
        const estimatedRowHeight = 70;
        return Math.ceil(position / estimatedRowHeight) * estimatedRowHeight;
      }
      
      // Find the first row boundary that is after the position
      for (const boundary of tableRows) {
        if (boundary > position) {
          return boundary;
        }
      }
      // If no boundary found after position, return canvas height
      return canvas.height;
    };
    
    // Process pages, adjusting for row boundaries
    const pages: Array<{ sourceY: number; sourceHeight: number }> = [];
    let currentSourceY = 0;
    
    while (currentSourceY < canvas.height) {
      // Calculate where this page should end (in canvas pixels)
      const pageEndY = currentSourceY + availableHeightInCanvasPx;
      
      // Find the row boundary just before the page end
      // This ensures we don't cut through a row - if a row would be cut, stop before it
      const adjustedPageEndY = findPreviousRowBoundary(pageEndY);
      
      // Calculate the height of this page's portion (in pixels)
      const remainingHeight = canvas.height - currentSourceY;
      let sourceHeight: number;
      
      if (adjustedPageEndY <= currentSourceY) {
        // If we can't fit even one row, we need to move to next row boundary
        const nextRowBoundary = findNextRowBoundary(currentSourceY);
        if (nextRowBoundary > currentSourceY && nextRowBoundary < canvas.height) {
          sourceHeight = nextRowBoundary - currentSourceY;
        } else {
          // Last page gets all remaining content
          sourceHeight = remainingHeight;
        }
      } else if (adjustedPageEndY >= canvas.height || remainingHeight <= availableHeightInCanvasPx) {
        // Last page gets all remaining content
        sourceHeight = remainingHeight;
      } else {
        // For other pages, use the adjusted end position to avoid cutting rows
        // Stop at the row start before the page end, so rows stay intact
        sourceHeight = adjustedPageEndY - currentSourceY;
      }
      
      // Ensure we have at least some content
      if (sourceHeight <= 0) {
        break;
      }
      
      pages.push({
        sourceY: currentSourceY,
        sourceHeight: sourceHeight
      });
      
      // Move to next page start
      currentSourceY += sourceHeight;
    }
    
    const totalPages = pages.length || 1;
    
    // Process each page
    for (let pageNum = 0; pageNum < pages.length; pageNum++) {
      if (pageNum > 0) {
        pdf.addPage();
      }

      const { sourceY, sourceHeight } = pages[pageNum];

      // Calculate destination height in mm (proportional to source)
      const destHeight = (sourceHeight / canvas.height) * finalImgHeight;
      
      // Create a temporary canvas for this page's portion
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = sourceHeight;
      const pageCtx = pageCanvas.getContext('2d');
      
      if (pageCtx) {
        // Fill with white background first
        pageCtx.fillStyle = '#ffffff';
        pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        
        // Draw only the portion of the image that belongs to this page
        pageCtx.drawImage(
          canvas,
          0, sourceY, canvas.width, sourceHeight,  // Source rectangle (from original canvas)
          0, 0, canvas.width, sourceHeight          // Destination rectangle (to page canvas)
        );
        
        // Convert to image data
        const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
        
        // Add to PDF at the top of the page (margin position)
        pdf.addImage(
          pageImgData,
          'JPEG',
          margin,
          margin,
          finalImgWidth,
          destHeight,
          undefined,
          'FAST'
        );
      }
      
      // Add page number to each page
      pdf.setFontSize(10);
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `Page ${pageNum + 1} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - margin / 2,
        { align: 'center' }
      );
    }

    // Sanitize filename: replace invalid characters with underscores
    const sanitizeFilename = (str: string) => str.replace(/[<>:"/\\|?*]/g, '_').trim();
    const admissionNumber = invoiceToDisplay.admissionNumber || 'Unknown';
    const studentName = invoiceToDisplay.billToName || 'Unknown';
    const filename = `${sanitizeFilename(admissionNumber)} - ${sanitizeFilename(studentName)}.pdf`;
    
      pdf.save(filename);
      
      // Restore footer display
      if (footer) {
        footer.style.display = originalFooterDisplay;
      }
      element.classList.remove('exporting');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Failed to export PDF. Please try again.');
      // Restore footer display even on error
      if (footer) {
        footer.style.display = originalFooterDisplay;
      }
      element.classList.remove('exporting');
    } finally {
      setExportingPdf(false);
    }
  }, [invoiceToDisplay, exportingPdf]);

  const handleDataMutationSuccess = useCallback(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleFilterChange = useCallback((filtered: InvoiceHeader[]) => {
    setFilteredInvoices(filtered);
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setSelectedInvoice(null);
    handleDataMutationSuccess();
  }, [handleDataMutationSuccess]);


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-700">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-lg font-medium">Loading invoices...</p>
        <p className="text-sm text-gray-500">Please wait while we fetch the data</p>
      </div>
    );
  }
  
  if (error) return <div className="p-6 text-center text-red-600">Error: {error}</div>;

  if (invoiceToDisplay) {
    return (
      <div className="p-6 md:p-3 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6 md:mb-3 print:hidden">
            <button 
              onClick={handleCloseDisplay} 
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-900 transition-all duration-200 font-medium"
            >
              Close
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
                  'Export to PDF'
                )}
              </button>
            </div>
          </div>

          {/* PDF boundary */}
          <div
            id="invoice-pdf-wrapper"
            ref={invoiceContentRef}
            className="bg-white mx-auto shadow-2xl"
            style={{ 
              width: '794px', 
              margin: '0 auto',
              paddingBottom: `${dynamicBottomPadding}px`,
              minHeight: `${A4_HEIGHT}px`
            }}
          >
            <InvoiceDisplay data={invoiceToDisplay} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-3 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <InvoiceSummary invoices={invoices} />
        <InvoiceFilters 
          invoices={invoices}
          onFilterChange={handleFilterChange}
          onCreateInvoice={() => {
            setSelectedInvoice(null);
            setShowForm(true);
          }}
        />

        <InvoiceTable
          invoices={filteredInvoices}
          onView={handleViewInvoice}
          onDataMutation={handleDataMutationSuccess}
        />

        {showForm && <InvoiceForm selectedInvoice={selectedInvoice} onClose={handleCloseForm} />}
      </div>
    </div>
  );
};

export default Invoices;

