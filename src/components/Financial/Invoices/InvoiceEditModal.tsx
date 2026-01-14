import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Edit, Info, Loader2, X } from 'lucide-react';
import { fetchFullInvoice, fetchMasterItems, fetchOutstandingBalances, markInvoicesAsForwarded, updateInvoice } from '../../../services/financialService';
import { FullInvoice, InvoiceHeader, InvoiceLineItem, InvoiceSubmissionData, ItemMaster } from '../../../types/database';
import { InvoiceFormLineItems } from './InvoiceFormLineItems';
import { supabase } from '../../../supabaseClient';

interface InvoiceEditModalProps {
  invoice: InvoiceHeader;
  onClose: () => void;
  onSaved: () => void;
}

const getNewDefaultLineItem = (): InvoiceLineItem => ({
  id: undefined,
  itemName: '',
  selectedItemId: '',
  description: null,
  unitPrice: 0.0,
  quantity: 1,
  discount: 0,
  lineTotal: 0.0,
});

export const InvoiceEditModal: React.FC<InvoiceEditModalProps> = ({ invoice, onClose, onSaved }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const [fullInvoice, setFullInvoice] = useState<FullInvoice | null>(null);
  const [masterItems, setMasterItems] = useState<ItemMaster[]>([]);

  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);

  // Balance Brought Forward state
  const [overdueInvoices, setOverdueInvoices] = useState<{ invoice_number: string; balanceDue: number }[]>([]);
  const [includeBBF, setIncludeBBF] = useState(false);

  const calculateLineTotal = useCallback((item: InvoiceLineItem): number => {
    const discountFactor = 1 - ((item.discount || 0) / 100);
    return (item.unitPrice || 0) * (item.quantity || 0) * discountFactor;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [fi, items] = await Promise.all([
          fetchFullInvoice(invoice.invoice_number),
          fetchMasterItems(),
        ]);

        if (cancelled) return;

        if (!fi) {
          setError('Failed to load invoice details.');
          setLoading(false);
          return;
        }

        setFullInvoice(fi);
        setMasterItems(items);

        setDueDate(fi.due_date);
        setDescription(fi.description || '');

        const initialLineItems = (fi.line_items || []).map((li) => ({
          ...li,
          lineTotal: calculateLineTotal(li),
        }));
        setLineItems(initialLineItems);

        // Fetch overdue invoices for BBF functionality (excluding the current invoice being edited)
        try {
          const overdueData = await fetchOutstandingBalances([fi.admission_number]);
          // Filter out the current invoice being edited
          const filteredOverdue = overdueData.filter(inv => inv.invoice_number !== invoice.invoice_number);
          setOverdueInvoices(filteredOverdue.map(inv => ({
            invoice_number: inv.invoice_number,
            balanceDue: inv.balance_due
          })));
        } catch (err) {
          console.error('Error fetching overdue invoices:', err);
          setOverdueInvoices([]);
        }
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || 'Failed to load invoice details.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [invoice.invoice_number, calculateLineTotal]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      scrollContainerRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const handleScrollKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const line = 40;
    const page = Math.max(200, Math.floor(el.clientHeight * 0.9));

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        e.stopPropagation();
        el.scrollBy({ top: line, behavior: 'auto' });
        break;
      case 'ArrowUp':
        e.preventDefault();
        e.stopPropagation();
        el.scrollBy({ top: -line, behavior: 'auto' });
        break;
      case 'PageDown':
        e.preventDefault();
        e.stopPropagation();
        el.scrollBy({ top: page, behavior: 'auto' });
        break;
      case 'PageUp':
        e.preventDefault();
        e.stopPropagation();
        el.scrollBy({ top: -page, behavior: 'auto' });
        break;
      case 'Home':
        e.preventDefault();
        e.stopPropagation();
        el.scrollTo({ top: 0, behavior: 'auto' });
        break;
      case 'End':
        e.preventDefault();
        e.stopPropagation();
        el.scrollTo({ top: el.scrollHeight, behavior: 'auto' });
        break;
      default:
        break;
    }
  };

  const lineItemsSubtotal = useMemo(() => {
    const validLineItems = lineItems.filter((i) => i.itemName && i.quantity > 0);
    return validLineItems.reduce((sum, item) => sum + calculateLineTotal(item), 0);
  }, [lineItems, calculateLineTotal]);

  const paymentMade = useMemo(() => {
    if (!fullInvoice) return 0;
    return Number(fullInvoice.paymentMade) || 0;
  }, [fullInvoice]);

  // Calculate brought forward amount from overdue invoices
  const broughtForwardAmount = useMemo(() => {
    return overdueInvoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);
  }, [overdueInvoices]);

  // Grand total including BBF if enabled
  const grandTotal = useMemo(() => {
    return includeBBF && broughtForwardAmount > 0
      ? lineItemsSubtotal + broughtForwardAmount
      : lineItemsSubtotal;
  }, [lineItemsSubtotal, includeBBF, broughtForwardAmount]);

  const handleAddItem = () => {
    setLineItems((prev) => [...prev, getNewDefaultLineItem()]);
  };

  const handleRemoveItem = (index: number) => {
    setError(null);

    if (paymentMade > 0) {
      const next = lineItems.filter((_, i) => i !== index);
      const nextSubtotal = next
        .filter((i) => i.itemName && i.quantity > 0)
        .reduce((sum, item) => sum + calculateLineTotal(item), 0);
      const nextTotal = parseFloat(nextSubtotal.toFixed(2));

      if (nextTotal < paymentMade) {
        setError(`You cannot remove line items because the new total (Ksh ${nextTotal.toFixed(2)}) would be less than the amount already paid (Ksh ${paymentMade.toFixed(2)}).`);
        return;
      }
    }

    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index: number, e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;

    setLineItems((prev) => {
      const next = [...prev];
      const item = { ...next[index] };
      next[index] = item;

      let numericValue = (name === 'quantity' || name === 'discount') ? parseInt(value) : parseFloat(value);

      if (name === 'selectedItemId') {
        const selectedItem = masterItems.find((i) => i.id === value);
        if (selectedItem) {
          item.selectedItemId = selectedItem.id;
          item.itemName = selectedItem.item_name;
          item.description = selectedItem.description;
          item.unitPrice = selectedItem.current_unit_price;
          if (!item.quantity || item.quantity === 0) {
            item.quantity = 1;
          }
        } else {
          item.selectedItemId = '';
          item.itemName = '';
          item.description = null;
          item.unitPrice = 0.0;
        }
      } else if (name === 'description') {
        item.description = value || null;
      } else {
        const finalValue = Number.isFinite(numericValue) ? numericValue : 0;
        (item as any)[name] = finalValue;
      }

      item.lineTotal = calculateLineTotal(item);
      return next;
    });
  };

  const handleToggleBadDebt = async () => {
    if (!fullInvoice) return;

    if (fullInvoice.status === 'Forwarded') {
      setError('Forwarded invoices cannot be marked as bad debt.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const newBadDebtStatus = !fullInvoice.bad_debt;
      
      const submissionData: InvoiceSubmissionData = {
        header: {
          ...fullInvoice,
          bad_debt: newBadDebtStatus,
        },
        line_items: fullInvoice.line_items,
      };

      await updateInvoice(invoice.invoice_number, submissionData);
      
      // Update the local state to reflect the change
      setFullInvoice(prev => prev ? { ...prev, bad_debt: newBadDebtStatus } : null);
      
      onSaved();
    } catch (e: any) {
      setError(e?.message || 'Failed to update bad debt status.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullInvoice) return;

    if (fullInvoice.status === 'Forwarded') {
      setError('Forwarded invoices cannot be edited.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let finalLineItems: InvoiceLineItem[] = lineItems
        .filter((li) => li.itemName)
        .map((li) => ({
          ...li,
          lineTotal: li.lineTotal || calculateLineTotal(li),
        }));

      // Add BBF as a line item if enabled and there are overdue invoices
      if (includeBBF && overdueInvoices.length > 0 && broughtForwardAmount > 0) {
        // Find or auto-create "Balance Brought Forward" item
        let bbfItem = masterItems.find(item => item.item_name === 'Balance Brought Forward');
        
        if (!bbfItem) {
          // Create the BBF item in the database
          const { data: newBbfItem, error: createError } = await supabase
            .from('item_master')
            .insert({
              item_name: 'Balance Brought Forward',
              current_unit_price: 0,
              description: 'System-generated item for carrying forward previous balances'
            })
            .select()
            .single();
          
          if (createError || !newBbfItem) {
            throw new Error('Failed to create Balance Brought Forward item: ' + createError?.message);
          }
          
          bbfItem = {
            id: newBbfItem.id,
            item_name: newBbfItem.item_name,
            current_unit_price: parseFloat(newBbfItem.current_unit_price),
            description: newBbfItem.description,
            created_at: newBbfItem.created_at
          };
          
          // Add to local masterItems so it's available for future use
          setMasterItems(prev => [...prev, bbfItem!]);
        }
        
        const invoiceNumbers = overdueInvoices.map(inv => inv.invoice_number).join(', ');
        
        // Add BBF line item
        finalLineItems.push({
          itemName: 'Balance Brought Forward',
          unitPrice: broughtForwardAmount,
          quantity: 1,
          discount: 0,
          description: `Invoices: ${invoiceNumbers}`,
          lineTotal: broughtForwardAmount
        });
      }

      // Recalculate subtotal from finalLineItems (which includes BBF if enabled)
      const finalSubtotal = finalLineItems.reduce((sum, item) => {
        const discountFactor = 1 - ((item.discount || 0) / 100);
        const lineTotal = (item.unitPrice || 0) * (item.quantity || 0) * discountFactor;
        return sum + lineTotal;
      }, 0);

      const totalAmount = parseFloat(finalSubtotal.toFixed(2));
      const currentPaymentMade = Number(fullInvoice.paymentMade) || 0;

      if (currentPaymentMade > 0 && totalAmount < currentPaymentMade) {
        throw new Error(`Cannot save because the new total (Ksh ${totalAmount.toFixed(2)}) is less than the amount already paid (Ksh ${currentPaymentMade.toFixed(2)}).`);
      }

      const submissionData: InvoiceSubmissionData = {
        header: {
          ...fullInvoice,
          due_date: dueDate,
          description,
          subtotal: parseFloat(finalSubtotal.toFixed(2)),
          totalAmount,
          paymentMade: currentPaymentMade,
        },
        line_items: finalLineItems,
      };

      await updateInvoice(invoice.invoice_number, submissionData);

      // Mark the old invoices as 'Forwarded' if balance was brought forward
      if (includeBBF && overdueInvoices.length > 0 && broughtForwardAmount > 0) {
        try {
          const invoiceNumbersToForward = overdueInvoices.map(inv => inv.invoice_number);
          await markInvoicesAsForwarded(invoiceNumbersToForward);
          console.log(`✅ Marked ${invoiceNumbersToForward.length} invoices as 'Forwarded'`);
        } catch (forwardError: any) {
          console.error("⚠️ Failed to mark invoices as Forwarded:", forwardError);
          alert(`Invoice updated successfully, but failed to mark old invoices as 'Forwarded'. Please update them manually.\nError: ${forwardError.message}`);
        }
      }

      onSaved();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to save invoice changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <style>{`
        .invisible-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: transparent transparent;
        }
        .invisible-scrollbar::-webkit-scrollbar {
          width: 10px;
        }
        .invisible-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .invisible-scrollbar::-webkit-scrollbar-thumb {
          background: transparent;
        }
      `}</style>
      <div
        ref={scrollContainerRef}
        tabIndex={0}
        onKeyDown={handleScrollKeyDown}
        className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto invisible-scrollbar focus:outline-none"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Edit className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-800">Edit Invoice</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-gray-600">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading invoice...
            </div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : fullInvoice ? (
            <form onSubmit={handleSave} className="space-y-6">
              {fullInvoice.status === 'Forwarded' && (
                <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  This invoice is Forwarded and cannot be edited.
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Invoice #</div>
                  <div className="text-sm font-medium text-gray-900">{fullInvoice.invoice_number}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Student</div>
                  <div className="text-sm font-medium text-gray-900">{fullInvoice.name}</div>
                  <div className="text-sm text-gray-500">Adm: {fullInvoice.admission_number}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Status</div>
                  <div className="text-sm font-medium text-gray-900">{fullInvoice.status}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                  <input
                    type="date"
                    value={fullInvoice.invoice_date}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={saving || fullInvoice.status === 'Forwarded'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                  <input
                    type="text"
                    value={fullInvoice.class_name || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    disabled
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={saving || fullInvoice.status === 'Forwarded'}
                />
              </div>

              <InvoiceFormLineItems
                lineItems={lineItems}
                masterItems={masterItems}
                loadingItems={false}
                isSubmitting={saving}
                lineItemsSubtotal={lineItemsSubtotal}
                isEditMode={true}
                allowRemoveInEditMode={true}
                isForwarded={fullInvoice.status === 'Forwarded'}
                handleAddItem={handleAddItem}
                handleRemoveItem={handleRemoveItem}
                handleLineItemChange={handleLineItemChange}
                calculateLineTotal={calculateLineTotal}
              />

              {/* Balance Brought Forward Section */}
              {fullInvoice.status !== 'Forwarded' && (
                <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="bbf-toggle-edit"
                        checked={includeBBF}
                        onChange={(e) => setIncludeBBF(e.target.checked)}
                        disabled={saving || overdueInvoices.length === 0}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
                      />
                      <label 
                        htmlFor="bbf-toggle-edit" 
                        className={`text-sm font-medium cursor-pointer ${overdueInvoices.length === 0 ? 'text-gray-400' : 'text-gray-800'}`}
                      >
                        Include Balance Brought Forward
                      </label>
                    </div>
                    {overdueInvoices.length > 0 && (
                      <div className="text-sm text-gray-600">
                        {overdueInvoices.length} overdue invoice{overdueInvoices.length > 1 ? 's' : ''} • Ksh.{broughtForwardAmount.toFixed(2)}
                      </div>
                    )}
                  </div>

                  {overdueInvoices.length === 0 && (
                    <p className="mt-2 text-xs text-gray-500">
                      No overdue invoices found for this student.
                    </p>
                  )}

                  {includeBBF && overdueInvoices.length > 0 && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start text-sm text-green-800">
                        <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Balance Brought Forward will be added</p>
                          <p className="text-xs mt-1">
                            Invoices: {overdueInvoices.map(inv => inv.invoice_number).join(', ')}
                          </p>
                          <p className="text-xs mt-1">
                            Amount: Ksh.{broughtForwardAmount.toFixed(2)} will be added as a line item.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Grand Total Display when BBF is enabled */}
                  {includeBBF && broughtForwardAmount > 0 && (
                    <div className="mt-3 flex justify-end text-lg font-semibold">
                      <span className="text-gray-700 mr-4">Grand Total:</span>
                      <span className="text-blue-600">Ksh.{grandTotal.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleToggleBadDebt}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center ${
                    fullInvoice.bad_debt 
                      ? 'text-white bg-purple-600 hover:bg-purple-700' 
                      : 'text-white bg-orange-600 hover:bg-orange-700'
                  }`}
                  disabled={saving || fullInvoice.status === 'Forwarded'}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Updating...
                    </>
                  ) : fullInvoice.bad_debt ? (
                    'Remove Bad Debt'
                  ) : (
                    'Mark as Bad Debt'
                  )}
                </button>
                
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center"
                    disabled={saving || fullInvoice.status === 'Forwarded'}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </div>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default InvoiceEditModal;
