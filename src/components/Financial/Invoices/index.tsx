import React, { useState, useCallback, useEffect } from 'react';
import { Plus } from 'lucide-react';
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
    } catch (err) {
      console.error(err);
      setError('Failed to load invoices.');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleViewInvoice = useCallback(async (invoice: InvoiceHeader) => {
    try {
      const fullDetails = await fetchFullInvoice(invoice.invoice_number);
      if (!fullDetails) return;

      const safeBalanceDue = Number(fullDetails.balance_due) || 0;
      const safeSubtotal = Number(fullDetails.subtotal) || 0;
      const safePaymentMade = Number(fullDetails.payment_made) || 0;

      const mappedData: InvoiceData = {
        invoiceNumber: fullDetails.invoice_number,
        balanceDue: safeBalanceDue,
        invoiceDate: fullDetails.invoice_date,
        dueDate: fullDetails.due_date,
        status: fullDetails.status as 'Overdue' | 'Paid' | 'Draft',
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
      };

      setInvoiceToDisplay(mappedData);
    } catch (error) {
      console.error('Failed to fetch full invoice details:', error);
    }
  }, []);

  const handleCloseDisplay = useCallback(() => setInvoiceToDisplay(null), []);

  // --- FIXED MARGIN PDF EXPORT ---
  const handleExportToPdf = useCallback(async () => {
    if (!invoiceToDisplay) return;
    const element = document.getElementById('invoice-pdf-wrapper');
    if (!element) return;

    element.classList.add('exporting');

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 794, // A4 width at 96 DPI
      windowWidth: 794,
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth - 20; // 10mm margin each side
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let position = 10; // top margin
    let heightLeft = imgHeight;

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - 20;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 10;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;
    }

    pdf.save(`Invoice_${invoiceToDisplay.invoiceNumber}.pdf`);
    element.classList.remove('exporting');
  }, [invoiceToDisplay]);

  const handleDataMutationSuccess = useCallback(() => {
    loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setSelectedInvoice(null);
    handleDataMutationSuccess();
  }, [handleDataMutationSuccess]);

  const handleEditInvoice = useCallback((invoice: InvoiceHeader) => {
    setSelectedInvoice(invoice);
    setShowForm(true);
  }, []);

  if (loading) return <div className="p-6 text-center text-gray-500">Loading invoices...</div>;
  if (error) return <div className="p-6 text-center text-red-600">Error: {error}</div>;

  if (invoiceToDisplay) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6 print:hidden">
            <button onClick={handleCloseDisplay} className="text-blue-600 hover:text-blue-800 font-semibold">
              &larr; Back to Invoices List
            </button>

            <button
              onClick={handleExportToPdf}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold"
            >
              Export to PDF
            </button>
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
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Invoices</h1>
            <p className="text-gray-600">Create and manage student invoices</p>
          </div>
          <button
            onClick={() => {
              setSelectedInvoice(null);
              setShowForm(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Invoice
          </button>
        </div>

        <InvoiceSummary invoices={invoices} />
        <InvoiceFilters />

        <InvoiceTable
          invoices={invoices}
          onEdit={handleEditInvoice}
          onView={handleViewInvoice}
          onDataMutation={handleDataMutationSuccess}
        />

        {showForm && <InvoiceForm selectedInvoice={selectedInvoice} onClose={handleCloseForm} />}
      </div>
    </div>
  );
};

export default Invoices;

