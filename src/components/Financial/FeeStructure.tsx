import React, { useState, useCallback } from 'react';
import { Plus, Search, Filter, FileText, Edit, Trash2, Eye, Download, Calendar, DollarSign, Users, Layers } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import logo from '../../assets/logo.png';

type TermLineItem = {
  id: number;
  name: string;
  amount: number;
};

type TermData = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  lineItems: TermLineItem[];
  total: number;
};

type TransportZone = {
  id: number;
  zoneName: string;
  oneWay: number;
  twoWay: number;
};

type BoardingType = {
  id: number;
  name: string;
  description: string;
  amount: number;
};

type OptionalCharge = {
  id: number;
  name: string;
  amount: number;
};

interface FeeStructure {
  id: number;
  className: string;
  academicYear: string;
  semesterType: 'semester' | 'term';
  numberOfTerms: number;
  terms: TermData[];
  transport: TransportZone[];
  boarding: BoardingType[];
  optional: OptionalCharge[];
  footerPaymentDetails?: string;
  createdAt: string;
}

export const FeeStructure: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState<FeeStructure | null>(null);
  const [semesterType, setSemesterType] = useState<'semester' | 'term'>('term');
  const [numberOfTerms, setNumberOfTerms] = useState(3);

  // Sample fee structures
  const feeStructures: FeeStructure[] = [
    {
      id: 1,
      className: 'Grade 8',
      academicYear: '2024-2025',
      semesterType: 'term',
      numberOfTerms: 3,
      terms: [
        {
          id: 1,
          name: 'Term 1',
          startDate: '2024-01-15',
          endDate: '2024-04-15',
          lineItems: [
            { id: 1, name: 'Tuition', amount: 50000 },
            { id: 2, name: 'Library Fee', amount: 2000 },
            { id: 3, name: 'Sports Fee', amount: 3000 },
            { id: 4, name: 'Laboratory Fee', amount: 4000 },
            { id: 5, name: 'Computer Lab', amount: 2500 }
          ],
          total: 61500
        },
        {
          id: 2,
          name: 'Term 2',
          startDate: '2024-05-01',
          endDate: '2024-08-01',
          lineItems: [
            { id: 6, name: 'Tuition', amount: 50000 },
            { id: 7, name: 'Library Fee', amount: 2000 },
            { id: 8, name: 'Sports Fee', amount: 3000 },
            { id: 9, name: 'Laboratory Fee', amount: 4000 },
            { id: 10, name: 'Computer Lab', amount: 2500 }
          ],
          total: 61500
        },
        {
          id: 3,
          name: 'Term 3',
          startDate: '2024-09-01',
          endDate: '2024-12-15',
          lineItems: [
            { id: 11, name: 'Tuition', amount: 50000 },
            { id: 12, name: 'Library Fee', amount: 2000 },
            { id: 13, name: 'Sports Fee', amount: 3000 },
            { id: 14, name: 'Laboratory Fee', amount: 4000 },
            { id: 15, name: 'Computer Lab', amount: 2500 }
          ],
          total: 61500
        }
      ],
      transport: [
        { id: 1, zoneName: 'Zone A - Downtown', oneWay: 5000, twoWay: 9000 },
        { id: 2, zoneName: 'Zone B - Park Avenue', oneWay: 6000, twoWay: 11000 },
        { id: 3, zoneName: 'Zone C - Residential Complex', oneWay: 7000, twoWay: 13000 },
        { id: 4, zoneName: 'Zone D - Mall Area', oneWay: 8000, twoWay: 15000 }
      ],
      boarding: [
        { id: 1, name: 'Full Boarding', description: 'Monday to Sunday', amount: 150000 },
        { id: 2, name: 'Weekdays Only', description: 'Monday to Friday', amount: 100000 },
        { id: 3, name: 'Weekends Only', description: 'Saturday and Sunday', amount: 50000 }
      ],
      optional: [
        { id: 1, name: 'Karate Classes', amount: 8000 },
        { id: 2, name: 'Music Lessons', amount: 5000 },
        { id: 3, name: 'Swimming Lessons', amount: 6000 },
        { id: 4, name: 'Art Club', amount: 3000 }
      ],
      footerPaymentDetails: 'For payment inquiries, contact: finance@mgmacademy.org or call +254 700 000 000. Payment can be made via M-Pesa Paybill: 123456, Account: Student Name',
      createdAt: '2024-01-01'
    },
    {
      id: 2,
      className: 'Grade 9',
      academicYear: '2024-2025',
      semesterType: 'semester',
      numberOfTerms: 2,
      terms: [
        {
          id: 1,
          name: 'Semester 1',
          startDate: '2024-01-15',
          endDate: '2024-06-30',
          lineItems: [
            { id: 1, name: 'Tuition', amount: 55000 },
            { id: 2, name: 'Library Fee', amount: 2500 },
            { id: 3, name: 'Sports Fee', amount: 3500 }
          ],
          total: 61000
        },
        {
          id: 2,
          name: 'Semester 2',
          startDate: '2024-07-15',
          endDate: '2024-12-15',
          lineItems: [
            { id: 4, name: 'Tuition', amount: 55000 },
            { id: 5, name: 'Library Fee', amount: 2500 },
            { id: 6, name: 'Sports Fee', amount: 3500 }
          ],
          total: 61000
        }
      ],
      transport: [
        { id: 1, zoneName: 'Zone A - Downtown', oneWay: 5500, twoWay: 10000 }
      ],
      boarding: [
        { id: 1, name: 'Full Boarding', description: 'Monday to Sunday', amount: 160000 }
      ],
      optional: [
        { id: 1, name: 'Music Lessons', amount: 5000 }
      ],
      footerPaymentDetails: 'Installment plans available. Contact finance office for details.',
      createdAt: '2024-01-01'
    }
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear().toString().slice(-2);
    
    const getOrdinal = (n: number) => {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    
    return `${getOrdinal(day)} ${month} '${year}`;
  };

  const handleExportToPdf = useCallback(async () => {
    if (!selectedStructure) return;
    const element = document.getElementById('fee-structure-pdf-wrapper');
    if (!element) return;

    element.classList.add('exporting');

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 794,
      windowWidth: 794,
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let position = 10;
    let heightLeft = imgHeight;

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - 20;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 10;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;
    }

    pdf.save(`FeeStructure_${selectedStructure.className}_${selectedStructure.academicYear}.pdf`);
    element.classList.remove('exporting');
  }, [selectedStructure]);

  const FeeStructureForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Create Fee Structure</h2>
          <button
            onClick={() => setShowForm(false)}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Grade 6</option>
                <option>Grade 7</option>
                <option>Grade 8</option>
                <option>Grade 9</option>
                <option>Grade 10</option>
                <option>Grade 11</option>
                <option>Grade 12</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="2024-2025"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Period Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSemesterType('term')}
                  className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                    semesterType === 'term'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Terms
                </button>
                <button
                  type="button"
                  onClick={() => setSemesterType('semester')}
                  className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                    semesterType === 'semester'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Semesters
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of {semesterType === 'term' ? 'Terms' : 'Semesters'}
              </label>
              <select
                value={numberOfTerms}
                onChange={(e) => setNumberOfTerms(parseInt(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {[1, 2, 3, 4].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Terms/Semesters</label>
            <div className="space-y-3">
              {Array.from({ length: numberOfTerms }).map((_, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border border-gray-200 rounded-lg">
                  <input
                    type="text"
                    placeholder={`${semesterType === 'term' ? 'Term' : 'Semester'} ${idx + 1} Name`}
                    className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="date"
                    placeholder="Start Date"
                    className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="date"
                    placeholder="End Date"
                    className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button type="button" className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Plus className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Fee Categories</label>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-800">Category 1</h4>
                  <button type="button" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Category Name"
                  className="w-full p-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <textarea
                  placeholder="Description"
                  rows={2}
                  className="w-full p-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                ></textarea>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Charge Name"
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      className="w-32 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <label className="flex items-center space-x-1 text-sm">
                      <input type="checkbox" className="rounded" />
                      <span>Optional</span>
                    </label>
                    <button type="button" className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Add Category
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Header Payment Details (Optional)</label>
            <textarea
              rows={2}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Payment instructions to display at the top..."
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Footer Payment Details (Optional)</label>
            <textarea
              rows={2}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional payment information for footer..."
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Fee Structure
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const FeeStructurePreview = () => {
    if (!selectedStructure) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6 print:hidden">
            <button
              onClick={() => {
                setShowPreview(false);
                setSelectedStructure(null);
              }}
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              &larr; Back to Fee Structures
            </button>
            <button
              onClick={handleExportToPdf}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export to PDF</span>
            </button>
          </div>

          <div
            id="fee-structure-pdf-wrapper"
            className="bg-white mx-auto"
            style={{ width: '794px', margin: '0 auto' }}
          >
            <div className="p-10 font-sans antialiased text-gray-900 bg-white">
              {/* Header - First Page Only */}
              <header className="flex justify-between items-start mb-8">
                <div>
                  <img
                    src={logo}
                    alt="MGM Academy Logo"
                    className="h-28 w-auto mb-3 object-contain"
                    style={{ maxWidth: '220px' }}
                  />
                  <p className="font-bold text-base mb-1">MGM ACADEMY LIMITED</p>
                  <p className="text-xs text-gray-600">Nairobi, Kenya</p>
                  <p className="text-xs text-gray-600">info@mgmacademy.org</p>
                </div>
                <div className="text-right">
                  <h1 className="text-3xl font-normal mb-1">FEE STRUCTURE</h1>
                  <p className="text-base font-medium text-gray-700">{selectedStructure.className}</p>
                  <p className="text-xs text-gray-600">Academic Year: {selectedStructure.academicYear}</p>
                </div>
              </header>

              {/* Terms Section - Page 1 */}
              <div className="mb-6" style={{ pageBreakAfter: 'always', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
                {selectedStructure.terms.map((term, index) => (
                  <div key={term.id} className={index > 0 ? 'mt-8' : ''}>
                    <h2 className="text-lg font-bold text-gray-900 mb-3 uppercase">{term.name}</h2>
                    <table className="w-full border-collapse mb-4">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-b border-gray-200">Description</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase border-b border-gray-200">Amount (KES)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {term.lineItems.map((item) => (
                          <tr key={item.id} className="border-b border-gray-100">
                            <td className="px-4 py-2.5 text-sm text-gray-900">{item.name}</td>
                            <td className="px-4 py-2.5 text-sm text-gray-900 text-right font-medium">
                              {item.amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-semibold">
                          <td className="px-4 py-3 text-sm text-gray-900">Total for {term.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {term.total.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ))}
                {/* Footer for Terms page */}
                {selectedStructure.footerPaymentDetails && (
                  <div className="mt-auto pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-600">{selectedStructure.footerPaymentDetails}</p>
                  </div>
                )}
              </div>

              {/* Transport Section - Page 2 */}
              {selectedStructure.transport.length > 0 && (
                <div className="mb-6" style={{ pageBreakBefore: 'always', pageBreakAfter: 'always', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
                  <h2 className="text-lg font-bold text-gray-900 mb-4 uppercase">Transport</h2>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-b border-gray-200">Zone</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase border-b border-gray-200">One Way (KES)</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase border-b border-gray-200">Two Way (KES)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStructure.transport.map((zone) => (
                        <tr key={zone.id} className="border-b border-gray-100">
                          <td className="px-4 py-2.5 text-sm text-gray-900">{zone.zoneName}</td>
                          <td className="px-4 py-2.5 text-sm text-gray-900 text-right font-medium">
                            {zone.oneWay.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-gray-900 text-right font-medium">
                            {zone.twoWay.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* Footer for Transport page */}
                  {selectedStructure.footerPaymentDetails && (
                    <div className="mt-auto pt-6 border-t border-gray-200">
                      <p className="text-xs text-gray-600">{selectedStructure.footerPaymentDetails}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Boarding Section - Page 3 */}
              {selectedStructure.boarding.length > 0 && (
                <div className="mb-6" style={{ pageBreakBefore: 'always', pageBreakAfter: 'always', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
                  <h2 className="text-lg font-bold text-gray-900 mb-4 uppercase">Boarding</h2>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-b border-gray-200">Type</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-b border-gray-200">Description</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase border-b border-gray-200">Amount (KES)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStructure.boarding.map((boarding) => (
                        <tr key={boarding.id} className="border-b border-gray-100">
                          <td className="px-4 py-2.5 text-sm text-gray-900 font-medium">{boarding.name}</td>
                          <td className="px-4 py-2.5 text-sm text-gray-600">{boarding.description}</td>
                          <td className="px-4 py-2.5 text-sm text-gray-900 text-right font-medium">
                            {boarding.amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* Footer for Boarding page */}
                  {selectedStructure.footerPaymentDetails && (
                    <div className="mt-auto pt-6 border-t border-gray-200">
                      <p className="text-xs text-gray-600">{selectedStructure.footerPaymentDetails}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Optional Section - Page 4 */}
              {selectedStructure.optional.length > 0 && (
                <div className="mb-6" style={{ pageBreakBefore: 'always', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
                  <h2 className="text-lg font-bold text-gray-900 mb-4 uppercase">Optional:</h2>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-b border-gray-200">Description</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase border-b border-gray-200">Amount (KES)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStructure.optional.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100">
                          <td className="px-4 py-2.5 text-sm text-gray-900">{item.name}</td>
                          <td className="px-4 py-2.5 text-sm text-gray-900 text-right font-medium">
                            {item.amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* Footer for Optional page */}
                  {selectedStructure.footerPaymentDetails && (
                    <div className="mt-auto pt-6 border-t border-gray-200">
                      <p className="text-xs text-gray-600">{selectedStructure.footerPaymentDetails}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 md:p-3 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-3 mb-6 md:mb-3">
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Total Structures</div>
                <div className="text-2xl font-bold text-gray-800">{feeStructures.length}</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Classes Covered</div>
                <div className="text-2xl font-bold text-green-600">
                  {new Set(feeStructures.map(s => s.className)).size}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Layers className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Total Terms</div>
                <div className="text-2xl font-bold text-purple-600">
                  {feeStructures.reduce((sum, s) => sum + s.numberOfTerms, 0)}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Avg. Annual Fee</div>
                <div className="text-2xl font-bold text-orange-600">
                  KES {Math.round(feeStructures.reduce((sum, s) => {
                    const annualTotal = s.terms.reduce((termSum, term) => termSum + term.total, 0) * s.numberOfTerms;
                    return sum + annualTotal;
                  }, 0) / feeStructures.length).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search, Filters, and Create */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 md:mb-3">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search fee structures..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="flex-shrink-0 flex items-center justify-center p-2 md:px-4 md:py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Filters</span>
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex-shrink-0 bg-blue-600 text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
            >
              <Plus className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">Create Fee Structure</span>
            </button>
          </div>
        </div>

        {/* Fee Structures Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Academic Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Terms/Semesters
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Annual Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {feeStructures.map((structure) => (
                  <tr key={structure.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{structure.className}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {structure.academicYear}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                        {structure.semesterType} ({structure.numberOfTerms})
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {structure.numberOfTerms} {structure.semesterType === 'term' ? 'Terms' : 'Semesters'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      KES {(structure.terms.reduce((sum, term) => sum + term.total, 0) * structure.numberOfTerms).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedStructure(structure);
                            setShowPreview(true);
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && <FeeStructureForm />}
        {showPreview && <FeeStructurePreview />}
      </div>
    </div>
  );
};

