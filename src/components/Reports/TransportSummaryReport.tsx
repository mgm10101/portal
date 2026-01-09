import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Download, Eye, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from '../../supabaseClient';
import logo from '../../assets/logo.png';

interface InvoiceSettings {
  logo_url: string | null;
  school_name: string | null;
  contact_info: string | null;
  address: string | null;
  payment_details: string | null;
}

interface TransportSummaryReportProps {
  onClose: () => void;
}

interface StudentRecord {
  admission_number: string;
  name: string;
  class_name: string;
  stream_name: string;
  transport_zone: string | null;
  transport_route: string | null;
  pickup_point: string | null;
  status: string;
}

interface ZoneGroup {
  zoneName: string;
  students: StudentRecord[];
}

interface PageData {
  records: StudentRecord[];
  pageNumber: number;
  totalPages: number;
  showSummary: boolean;
  currentZone: string;
  isZoneContinuation: boolean;
}

export const TransportSummaryReport: React.FC<TransportSummaryReportProps> = ({ onClose }) => {
  const [showConfigPopup, setShowConfigPopup] = useState(true);
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [zones, setZones] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings | null>(null);
  const [pages, setPages] = useState<PageData[]>([]);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Page layout constants (A4 dimensions in pixels at 96 DPI)
  const A4_WIDTH = 794;
  const A4_HEIGHT = 1123;
  const PAGE_MARGIN = 37.8;
  const HEADER_HEIGHT = 160;
  const FOOTER_HEIGHT = 50;
  const SUMMARY_HEIGHT = 100;
  const TABLE_HEADER_HEIGHT = 45;
  const ROW_HEIGHT = 40;

  const calculateAvailableContentHeight = useCallback((includeSummary: boolean = false) => {
    const usedHeight = HEADER_HEIGHT + FOOTER_HEIGHT + TABLE_HEADER_HEIGHT;
    const summary = includeSummary ? SUMMARY_HEIGHT : 0;
    return A4_HEIGHT - (PAGE_MARGIN * 2) - usedHeight - summary;
  }, []);

  // Group students by transport zone
  const groupStudentsByZone = useCallback((studentList: StudentRecord[]): ZoneGroup[] => {
    const groups: { [key: string]: ZoneGroup } = {};
    
    studentList.forEach(student => {
      const zoneName = student.transport_zone || 'No Transport Zone';
      
      if (!groups[zoneName]) {
        groups[zoneName] = {
          zoneName,
          students: []
        };
      }
      groups[zoneName].students.push(student);
    });

    // Sort groups by zone name
    return Object.values(groups).sort((a, b) => {
      if (a.zoneName === 'No Transport Zone') return 1;
      if (b.zoneName === 'No Transport Zone') return -1;
      return a.zoneName.localeCompare(b.zoneName);
    });
  }, []);

  // Split records into pages
  const splitIntoPages = useCallback((studentList: StudentRecord[]): PageData[] => {
    if (studentList.length === 0) return [];
    
    const zoneGroups = groupStudentsByZone(studentList);
    const pages: PageData[] = [];
    let currentPageNumber = 1;
    
    const availableHeight = calculateAvailableContentHeight(false);
    const rowsPerPage = Math.floor(availableHeight / ROW_HEIGHT);
    
    zoneGroups.forEach((group, groupIndex) => {
      const isLastGroup = groupIndex === zoneGroups.length - 1;
      let remainingStudents = [...group.students];
      let isFirstPageOfGroup = true;
      
      while (remainingStudents.length > 0) {
        const pageStudents = remainingStudents.slice(0, rowsPerPage);
        remainingStudents = remainingStudents.slice(rowsPerPage);
        
        const isLastPageOfGroup = remainingStudents.length === 0;
        
        pages.push({
          records: pageStudents,
          pageNumber: currentPageNumber,
          totalPages: 0,
          showSummary: isLastGroup && isLastPageOfGroup,
          currentZone: group.zoneName,
          isZoneContinuation: !isFirstPageOfGroup
        });
        
        currentPageNumber++;
        isFirstPageOfGroup = false;
      }
    });
    
    return pages.map(page => ({ ...page, totalPages: pages.length }));
  }, [calculateAvailableContentHeight, groupStudentsByZone]);

  // Fetch zones on mount
  useEffect(() => {
    async function fetchDropdownData() {
      try {
        const { data: zonesRes } = await supabase
          .from('transport_zones')
          .select('id, name')
          .order('name');
        
        if (zonesRes) setZones(zonesRes);
      } catch (err) {
        console.error('Error fetching zones:', err);
        // If transport_zones table doesn't exist, set empty array
        setZones([]);
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
    if (students.length > 0) {
      const splitPages = splitIntoPages(students);
      setPages(splitPages);
      pageRefs.current = new Array(splitPages.length).fill(null);
    } else {
      setPages([]);
    }
  }, [students, splitIntoPages]);

  const handleClose = () => {
    setShowPreview(false);
    setShowConfigPopup(false);
    setStudents([]);
    onClose();
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('students')
        .select(`
          admission_number,
          name,
          current_class_id,
          stream_id,
          transport_zone_id,
          status
        `)
        .order('transport_zone_id', { ascending: true, nullsFirst: false })
        .order('name', { ascending: true });

      if (!includeInactive) {
        query = query.eq('status', 'Active');
      }

      if (selectedZone !== 'all') {
        query = query.eq('transport_zone_id', parseInt(selectedZone));
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform the data to match the expected interface
      const transformedData = (data || []).map(student => ({
        admission_number: student.admission_number,
        name: student.name,
        class_name: student.current_class_id ? `Class ${student.current_class_id}` : 'Unassigned',
        stream_name: student.stream_id ? `Stream ${student.stream_id}` : '',
        transport_zone: student.transport_zone_id ? `Zone ${student.transport_zone_id}` : 'No Zone',
        transport_route: null,
        pickup_point: null,
        status: student.status
      }));
      
      setStudents(transformedData);
      setShowPreview(true);
      setShowConfigPopup(false);
    } catch (error) {
      console.error('Error fetching students:', error);
      alert('Failed to fetch students. Please try again.');
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

      const filename = `Transport_Summary_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExportingPdf(false);
    }
  }, [pages, exportingPdf]);

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  // Get summary statistics
  const getSummaryStats = () => {
    const zoneGroups = groupStudentsByZone(students);
    const totalStudents = students.length;
    const totalZones = new Set(students.filter(s => s.transport_zone).map(s => s.transport_zone)).size;
    const withTransport = students.filter(s => s.transport_zone).length;
    const withoutTransport = students.filter(s => !s.transport_zone).length;
    
    return { totalStudents, totalZones, withTransport, withoutTransport };
  };

  if (showConfigPopup) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Transport Summary Report</h2>
              <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transport Zone
                </label>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Zones</option>
                  {zones.map(z => (
                    <option key={z.id} value={z.id.toString()}>{z.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeInactive"
                  checked={includeInactive}
                  onChange={(e) => setIncludeInactive(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="includeInactive" className="ml-2 text-sm text-gray-700">
                  Include inactive students
                </label>
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
                  disabled={loading}
                  className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
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
                    <p className="text-lg">No students found for the selected criteria.</p>
                  </div>
                </div>
              ) : (
                pages.map((pageData, pageIndex) => (
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
                          <h1 className="text-3xl font-normal text-gray-900 mb-2">Transport Summary</h1>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Zone:</strong> {pageData.currentZone}{pageData.isZoneContinuation ? ' (continued)' : ''}</p>
                            <p><strong>Filter:</strong> {selectedZone === 'all' ? 'All Zones' : selectedZone}</p>
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

                    {/* Students Table */}
                    <div className="flex-1 overflow-hidden">
                      {pageData.records.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-50 border-b-2 border-gray-200">
                                <th className="text-left p-3 text-sm font-semibold text-gray-700" style={{ width: '5%' }}>#</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700" style={{ width: '15%' }}>Adm No.</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700">Name</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700" style={{ width: '15%' }}>Class</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700" style={{ width: '20%' }}>Route / Pickup</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pageData.records.map((student, index) => (
                                <tr key={student.admission_number} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : ''}`} style={index % 2 === 1 ? { backgroundColor: '#fcfcfd' } : {}}>
                                  <td className="p-3 text-sm text-gray-600">{index + 1}</td>
                                  <td className="p-3 text-sm text-gray-900 font-medium">{student.admission_number}</td>
                                  <td className="p-3 text-sm text-gray-900">{student.name}</td>
                                  <td className="p-3 text-sm text-gray-600">{student.class_name || 'N/A'}</td>
                                  <td className="p-3 text-sm text-gray-600">
                                    <div>{student.transport_route || 'N/A'}</div>
                                    {student.pickup_point && (
                                      <div className="text-xs text-gray-400">{student.pickup_point}</div>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : null}
                    </div>

                    {/* Summary Cards */}
                    {pageData.showSummary && (
                      <div className="mt-8 grid grid-cols-4 gap-4 flex-shrink-0">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Total Students</p>
                          <p className="text-2xl font-semibold text-gray-900">{stats.totalStudents}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Total Zones</p>
                          <p className="text-2xl font-semibold text-blue-600">{stats.totalZones}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">With Transport</p>
                          <p className="text-2xl font-semibold text-green-600">{stats.withTransport}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">No Transport</p>
                          <p className="text-2xl font-semibold text-gray-500">{stats.withoutTransport}</p>
                        </div>
                      </div>
                    )}

                    {/* Footer */}
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

export default TransportSummaryReport;
