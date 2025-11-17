import React, { useState, useEffect } from 'react';
// 1. Import supabase client (relative path adjusted: two levels up to src, then supabaseClient)
import { supabase } from '../../../supabaseClient'; 

// --- Interface Definitions (No Change) ---

interface PaymentBank {
  bank: string;
  branch: string;
  accountNumber: string;
  paybillNumber: string;
}

interface InvoiceItem {
  id: number;
  description: string;
  details: string;
  quantity: number;
  rate: number;
  total: number;
  finalAmount: number;
  discount?: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  balanceDue: number; // This will be overwritten by fetched data
  invoiceDate: string;
  dueDate: string;
  status: 'Overdue' | 'Paid' | 'Draft' | 'Pending';
  billToName: string;
  billToDescription: string;
  slogan: string;
  items: InvoiceItem[];
  subTotal: number;
  paymentMade: number; // This will be overwritten by fetched data
  finalBalance: number; // This will be overwritten by fetched data
  paymentBanks: PaymentBank[];
}

// --- Component Definition (Modified to fetch data) ---

const InvoiceDisplay: React.FC<{ data: InvoiceData }> = ({ data }) => {
  const [fetchedPayments, setFetchedPayments] = useState<{ paymentMade: number; balanceDue: number; finalBalance: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUpdatedFinancials() {
      setIsLoading(true);
      setError(null);

      // We use the invoiceNumber from the existing data prop to query the table
      const invoiceNumber = data.invoiceNumber;
      
      try {
        const { data: dbData, error: fetchError } = await supabase
          .from('invoices')
          .select('payment_made, balance_due') // Fetch only the required fields
          .eq('invoice_number', invoiceNumber)
          .single();

        if (fetchError || !dbData) {
          throw new Error(`Invoice ${invoiceNumber} data not found or failed to fetch: ${fetchError?.message}`);
        }

        // Parse numeric strings to numbers. If the fields are stored as `numeric` in Supabase, they are returned as strings.
        const updatedPaymentMade = parseFloat(dbData.payment_made);
        const updatedBalanceDue = parseFloat(dbData.balance_due);

        setFetchedPayments({
          paymentMade: updatedPaymentMade,
          balanceDue: updatedBalanceDue,
          finalBalance: updatedBalanceDue, // Assuming finalBalance is the same as balanceDue
        });

      } catch (e) {
        console.error("Error fetching financial updates:", e);
        setError(`Failed to load up-to-date payment/balance details.`);
        // Fallback: If fetch fails, we still use the old data values (data.paymentMade, etc.)
        setFetchedPayments({
            paymentMade: data.paymentMade,
            balanceDue: data.balanceDue,
            finalBalance: data.finalBalance,
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    // Only fetch if data (and thus invoiceNumber) is available
    if (data.invoiceNumber) {
        fetchUpdatedFinancials();
    } else {
        setIsLoading(false);
    }
    
  }, [data.invoiceNumber]); // Rerun the effect if the invoiceNumber changes

  // --- Destructuring Logic (Modified to use fetched data if available) ---
  
  // Use data from props initially
  let {
    invoiceNumber,
    invoiceDate,
    dueDate,
    status,
    billToName,
    billToDescription,
    items,
    subTotal,
    paymentBanks,
  } = data;
  
  // Override the financial values with fetched data once loading is complete and successful
  let { balanceDue, paymentMade, finalBalance } = data; // Default to props values
  
  if (!isLoading && fetchedPayments) {
      balanceDue = fetchedPayments.balanceDue;
      paymentMade = fetchedPayments.paymentMade;
      finalBalance = fetchedPayments.finalBalance;
  }
  
  // Display a loading state overlay or message while fetching
  if (isLoading) {
    // You can choose a better loading indicator here
    return <div className="p-10 text-center text-gray-600">Loading updated financial details...</div>;
  }
  
  // --- Rendering Logic (No Change) ---

  const statusColor =
    status === 'Overdue'
      ? 'text-red-600'
      : status === 'Paid'
      ? 'text-green-600'
      : 'text-gray-600';

  return (
    <div
      id="invoice-container"
      className="font-sans antialiased text-gray-900 bg-white shadow-2xl"
      style={{
        width: '794px', // exact A4 width for html2canvas
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      <div className="p-10">
        <header className="flex justify-between items-start mb-0">
          <div className="flex flex-col relative">
            {/* ✅ Enlarged logo */}
            <img
              src="https://res.cloudinary.com/dr3oqhggp/image/upload/v1758472807/logo_jetvz8.jpg"
              alt="MGM Academy Logo"
              className="h-36 w-auto mb-6 object-contain"
              style={{ maxWidth: '300px' }}
            />

            {/* ✅ Company info */}
            <p className="font-bold text-lg mb-1">MGM ACADEMY LIMITED</p>
            <p className="text-sm">Nairobi, Kenya</p>
            <p className="text-sm mb-6">info@mgmacademy.org</p>

            {/* ✅ Bill To moved slightly higher */}
            <div className="mt-16">
              <p className="text-xs font-semibold uppercase text-gray-600 mb-0">Bill To</p>
              <p className="text-lg font-bold">{billToName}</p>
              <p className="text-sm text-gray-600">Description: {billToDescription}</p>
            </div>
          </div>

          <div className="text-right">
            <h1 className="text-5xl font-normal mb-1">INVOICE</h1>
            <p className="text-2xl font-medium mb-4">#{invoiceNumber}</p>

            {/* BALANCE DUE DISPLAY: Uses updated 'balanceDue' variable */}
            <div className="text-right mt-8">
              <p className="text-base font-semibold uppercase text-gray-700 mb-1">Balance Due</p>
              <p className="text-2xl font-normal text-black">
                KES {Number(balanceDue).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </header>

        <div className="flex justify-end text-sm mb-12 mt-4">
          <div className="w-1/3 space-y-1">
            <div className="flex justify-between">
              <span className="font-medium">Invoice Date:</span>
              <span>{invoiceDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Due Date:</span>
              <span>{dueDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Status:</span>
              <span className={`font-bold ${statusColor}`}>{status}</span>
            </div>
          </div>
        </div>

        <table className="w-full text-sm border-collapse" style={{ minWidth: '100%' }}>
          <thead>
            <tr className="text-white font-bold text-left bg-gray-900 h-10">
              <th className="py-2 px-4 w-1/12 text-center">#</th>
              <th className="py-2 px-4 w-1/2">Item & Description</th>
              <th className="py-2 px-4 w-1/12">Qty</th>
              <th className="py-2 px-4 w-1/6">Rate</th>
              <th className="py-2 px-4 w-1/6 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item.id} className="border-b border-gray-300">
                <td className="py-3 px-4 text-center">{i + 1}</td>
                <td className="py-3 px-4">
                  <p className="font-medium">{item.description}</p>
                  <p className="text-xs text-gray-600">{item.details}</p>
                </td>
                <td className="py-3 px-4">{Number(item.quantity).toFixed(2)}</td>
                <td className="py-3 px-4">{Number(item.rate).toLocaleString()}</td>
                <td className="py-3 px-4 text-right">
                  {Number(item.finalAmount).toLocaleString()}
                  {item.discount && <p className="text-xs text-gray-600">{item.discount}</p>}
                </td>
              </tr>
            ))}
            <tr className="border-b border-gray-300 bg-gray-50 font-bold">
              <td colSpan={3}></td>
              <td className="p-2 text-right">Sub Total</td>
              <td className="p-2 text-right">{Number(subTotal).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-between mt-12">
          <div className="w-1/2 pr-8">
            <h3 className="text-lg font-bold mb-3">Payment Details</h3>
            <div className="border p-4 bg-gray-50 text-sm space-y-3">
              {paymentBanks.map((b, i) => (
                <div key={i} className={i > 0 ? 'border-t pt-3 mt-3' : ''}>
                  <p className="font-semibold">MGM ACADEMY LIMITED</p>
                  <p className="text-xs">
                    {b.bank}, {b.branch}
                  </p>
                  <p className="text-xs font-semibold">
                    ACCOUNT NUMBER: {b.accountNumber}
                  </p>
                  <p className="text-xs font-semibold">
                    PAYBILL NUMBER: {b.paybillNumber}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="w-1/2 pl-8 flex justify-end">
            <div className="w-full max-w-xs text-right mt-4">
              <div className="flex justify-between text-base border-b pb-1 mb-1">
                <span className="font-medium">Total</span>
                <span className="font-semibold">
                  Ksh.{Number(subTotal).toLocaleString()}
                </span>
              </div>

              {/* PAYMENT MADE DISPLAY: Uses updated 'paymentMade' variable */}
              <div className="flex justify-between text-base border-b pb-1 mb-1">
                <span className="font-medium">Payment Made</span>
                <span className="font-semibold text-red-600">
                  (-) {Number(paymentMade).toLocaleString()}
                </span>
              </div>

              {/* FINAL BALANCE DISPLAY: Uses updated 'finalBalance' variable */}
              <div className="flex justify-between text-xl pt-2 border-t-2 border-black">
                <span className="font-bold">Balance Due</span>
                <span className="font-extrabold text-black">
                  Ksh.{Number(finalBalance).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDisplay;