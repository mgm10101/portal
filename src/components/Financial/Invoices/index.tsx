import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Edit, Loader2, Printer } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { fetchInvoices, fetchFullInvoice } from '../../../services/financialService';
import { InvoiceHeader } from '../../../types/database';
import { InvoiceForm } from './InvoiceForm';
import { InvoiceSummary } from './InvoiceSummary';
import { InvoiceFilters } from './InvoiceFilters';
import { InvoiceTable } from './InvoiceTable';
import { InvoiceEditModal } from './InvoiceEditModal';
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
  const [displayedInvoiceHeader, setDisplayedInvoiceHeader] = useState<InvoiceHeader | null>(null);
  const [invoiceToEdit, setInvoiceToEdit] = useState<InvoiceHeader | null>(null);
  const [dynamicBottomPadding, setDynamicBottomPadding] = useState<number>(0);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [printingPdf, setPrintingPdf] = useState(false);
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

      setDisplayedInvoiceHeader(invoice);
      setInvoiceToDisplay(mappedData);
    } catch (error) {
      console.error('Failed to fetch full invoice details:', error);
    }
  }, []);

  const handleCloseDisplay = useCallback(() => {
    setInvoiceToDisplay(null);
    setDisplayedInvoiceHeader(null);
    setInvoiceToEdit(null);
  }, []);

  const refreshDisplayedInvoice = useCallback(async () => {
    if (!invoiceToDisplay) return;
    try {
      const fullDetails = await fetchFullInvoice(invoiceToDisplay.invoiceNumber);
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
        admissionNumber: (fullDetails as any).admission_number || invoiceToDisplay.admissionNumber,
      };

      setInvoiceToDisplay(mappedData);
    } catch (error) {
      console.error('Failed to refresh invoice details:', error);
    }
  }, [invoiceToDisplay]);

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

  const generateInvoicePdf = useCallback(async (): Promise<jsPDF | null> => {
    if (!invoiceToDisplay) return null;
    const element = document.getElementById('invoice-pdf-wrapper');
    if (!element) return null;

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

    try {
      // Get row positions BEFORE hiding footer (so measurements are accurate)
      // Wait a moment for the DOM to update
      await new Promise(resolve => setTimeout(resolve, 50));

      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794,
        windowWidth: 794,
        imageTimeout: 15000,
        removeContainer: false,
      });

      const pdf = new jsPDF('p', 'mm', 'a4');

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const availableHeight = pageHeight - (margin * 2);
      const canvasAspectRatio = canvas.width / canvas.height;
      const finalImgWidth = pageWidth - (margin * 2);
      const finalImgHeight = finalImgWidth / canvasAspectRatio;
      const availableHeightInCanvasPx = (availableHeight / finalImgHeight) * canvas.height;

      const findPreviousRowBoundary = (position: number): number => {
        if (tableRows.length === 0) {
          const estimatedRowHeight = 70;
          return Math.floor(position / estimatedRowHeight) * estimatedRowHeight;
        }
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

      const findNextRowBoundary = (position: number): number => {
        if (tableRows.length === 0) {
          const estimatedRowHeight = 70;
          return Math.ceil(position / estimatedRowHeight) * estimatedRowHeight;
        }
        for (const boundary of tableRows) {
          if (boundary > position) {
            return boundary;
          }
        }
        return canvas.height;
      };

      const pages: Array<{ sourceY: number; sourceHeight: number }> = [];
      let currentSourceY = 0;

      while (currentSourceY < canvas.height) {
        const pageEndY = currentSourceY + availableHeightInCanvasPx;
        const adjustedPageEndY = findPreviousRowBoundary(pageEndY);
        const remainingHeight = canvas.height - currentSourceY;
        let sourceHeight: number;

        if (adjustedPageEndY <= currentSourceY) {
          const nextRowBoundary = findNextRowBoundary(currentSourceY);
          if (nextRowBoundary > currentSourceY && nextRowBoundary < canvas.height) {
            sourceHeight = nextRowBoundary - currentSourceY;
          } else {
            sourceHeight = remainingHeight;
          }
        } else if (adjustedPageEndY >= canvas.height || remainingHeight <= availableHeightInCanvasPx) {
          sourceHeight = remainingHeight;
        } else {
          sourceHeight = adjustedPageEndY - currentSourceY;
        }

        if (sourceHeight <= 0) break;

        pages.push({ sourceY: currentSourceY, sourceHeight });
        currentSourceY += sourceHeight;
      }

      const totalPages = pages.length || 1;

      for (let pageNum = 0; pageNum < pages.length; pageNum++) {
        if (pageNum > 0) {
          pdf.addPage();
        }

        const { sourceY, sourceHeight } = pages[pageNum];
        const destHeight = (sourceHeight / canvas.height) * finalImgHeight;

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;
        const pageCtx = pageCanvas.getContext('2d');

        if (pageCtx) {
          pageCtx.fillStyle = '#ffffff';
          pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          pageCtx.drawImage(
            canvas,
            0, sourceY, canvas.width, sourceHeight,
            0, 0, canvas.width, sourceHeight
          );

          const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
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

        pdf.setFontSize(10);
        pdf.setTextColor(128, 128, 128);
        pdf.text(
          `Page ${pageNum + 1} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - margin / 2,
          { align: 'center' }
        );
      }

      return pdf;
    } finally {
      if (footer) {
        footer.style.display = originalFooterDisplay;
      }
      element.classList.remove('exporting');
    }
  }, [invoiceToDisplay]);

  // --- OPTIMIZED PDF EXPORT (Reduced file size) ---
  const handleExportToPdf = useCallback(async () => {
    if (!invoiceToDisplay || exportingPdf || printingPdf) return;
    setExportingPdf(true);
    try {
      const pdf = await generateInvoicePdf();
      if (!pdf) return;

      const sanitizeFilename = (str: string) => str.replace(/[<>:"/\\|?*]/g, '_').trim();
      const admissionNumber = invoiceToDisplay.admissionNumber || 'Unknown';
      const studentName = invoiceToDisplay.billToName || 'Unknown';
      const filename = `${sanitizeFilename(admissionNumber)} - ${sanitizeFilename(studentName)}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExportingPdf(false);
    }
  }, [invoiceToDisplay, exportingPdf, printingPdf, generateInvoicePdf]);

  const handlePrintPdf = useCallback(async () => {
    if (!invoiceToDisplay || printingPdf || exportingPdf) return;
    setPrintingPdf(true);
    try {
      const pdf = await generateInvoicePdf();
      if (!pdf) return;

      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = url;
      document.body.appendChild(iframe);

      const cleanup = () => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
        iframe.remove();
      };

      // Fallback cleanup in case afterprint doesn't fire (some browsers)
      const fallbackCleanupTimer = window.setTimeout(cleanup, 60_000);

      iframe.onload = () => {
        const w = iframe.contentWindow;
        if (!w) return;

        // Cleanup only after printing completes, otherwise the dialog can close immediately.
        const onAfterPrint = () => {
          window.clearTimeout(fallbackCleanupTimer);
          w.removeEventListener('afterprint', onAfterPrint);
          cleanup();
        };

        w.addEventListener('afterprint', onAfterPrint);

        // Give the embedded PDF renderer a tick to become ready.
        window.setTimeout(() => {
          try {
            w.focus();
            w.print();
          } catch {
            // If print throws, still allow fallback cleanup.
          }
        }, 250);
      };
    } catch (error) {
      console.error('Error printing PDF:', error);
      alert('Failed to print. Please try again.');
    } finally {
      setPrintingPdf(false);
    }
  }, [invoiceToDisplay, printingPdf, exportingPdf, generateInvoicePdf]);

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
                onClick={() => {
                  if (!displayedInvoiceHeader) return;
                  setInvoiceToEdit(displayedInvoiceHeader);
                }}
                disabled={!displayedInvoiceHeader || exportingPdf || printingPdf}
                className={`bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${
                  !displayedInvoiceHeader || exportingPdf || printingPdf ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600'
                }`}
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>

              <button
                onClick={handleExportToPdf}
                disabled={exportingPdf || printingPdf}
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

              <button
                onClick={handlePrintPdf}
                disabled={printingPdf || exportingPdf}
                className={`px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-900 transition-all duration-200 font-medium flex items-center gap-2 ${
                  printingPdf ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {printingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Printing...
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4" />
                    Print
                  </>
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

          {invoiceToEdit && (
            <InvoiceEditModal
              invoice={invoiceToEdit}
              onClose={() => setInvoiceToEdit(null)}
              onSaved={() => {
                setInvoiceToEdit(null);
                handleDataMutationSuccess();
                refreshDisplayedInvoice();
              }}
            />
          )}
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

