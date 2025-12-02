import React, { useState, useCallback, useEffect } from 'react';
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

export const Invoices: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceHeader[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceHeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceHeader | null>(null);
  const [invoiceToDisplay, setInvoiceToDisplay] = useState<InvoiceData | null>(null);

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

  // --- OPTIMIZED PDF EXPORT (Reduced file size) ---
  const handleExportToPdf = useCallback(async () => {
    if (!invoiceToDisplay) return;
    const element = document.getElementById('invoice-pdf-wrapper');
    if (!element) return;

    element.classList.add('exporting');

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

    let position = margin; // top margin
    let heightLeft = finalImgHeight;

    pdf.addImage(imgData, 'JPEG', margin, position, finalImgWidth, finalImgHeight, undefined, 'FAST');
    heightLeft -= availableHeight;

    while (heightLeft > 0) {
      position = heightLeft - finalImgHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margin, position, finalImgWidth, finalImgHeight, undefined, 'FAST');
      heightLeft -= availableHeight;
    }

    // Sanitize filename: replace invalid characters with underscores
    const sanitizeFilename = (str: string) => str.replace(/[<>:"/\\|?*]/g, '_').trim();
    const admissionNumber = invoiceToDisplay.admissionNumber || 'Unknown';
    const studentName = invoiceToDisplay.billToName || 'Unknown';
    const filename = `${sanitizeFilename(admissionNumber)} - ${sanitizeFilename(studentName)}.pdf`;
    
    pdf.save(filename);
    element.classList.remove('exporting');
  }, [invoiceToDisplay]);

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
            <button onClick={handleCloseDisplay} className="text-blue-600 hover:text-blue-800 font-semibold">
              &larr; Back to Invoices List
            </button>

            <div className="flex gap-3">
              <button
                onClick={handleExportToPdf}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold"
              >
                Export to PDF
              </button>
            </div>
          </div>

          {/* PDF boundary */}
          <div
            id="invoice-pdf-wrapper"
            className="bg-white mx-auto"
            style={{ width: '794px', margin: '0 auto' }}
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

