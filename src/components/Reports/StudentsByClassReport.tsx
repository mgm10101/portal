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

interface StudentsByClassReportProps {
  onClose: () => void;
}

interface StudentRecord {
  admission_number: string;
  name: string;
  class_name: string | null;
  stream_name: string | null;
  gender: string | null;
  age: number | null;
  status: string;
}

interface ClassGroup {
  className: string;
  streamName: string | null;
  students: StudentRecord[];
}

interface PageData {
  records: StudentRecord[];
  pageNumber: number;
  totalPages: number;
  showSummary: boolean;
  currentClass: string;
  currentStream: string | null;
  isClassContinuation: boolean;
}

export const StudentsByClassReport: React.FC<StudentsByClassReportProps> = ({ onClose }) => {
  const [showConfigPopup, setShowConfigPopup] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStream, setSelectedStream] = useState<string>('all');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [classes, setClasses] = useState<{ id: number; name: string; sort_order: number }[]>([]);
  const [streams, setStreams] = useState<{ id: number; name: string }[]>([]);
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
    classSummaryHeight: number;
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
  const SUMMARY_HEIGHT = 100;
  const TABLE_HEADER_HEIGHT = 45;
  const ROW_HEIGHT = 40;
  const CLASS_SUMMARY_TABLE_HEIGHT = 200; // Estimated height for class summary table

  const calculateAvailableContentHeight = useCallback((includeSummary: boolean = false) => {
    const header = measuredHeights?.headerHeight || HEADER_HEIGHT;
    const footer = measuredHeights?.footerHeight || FOOTER_HEIGHT;
    const tableHeader = measuredHeights?.tableHeaderHeight || TABLE_HEADER_HEIGHT;
    const summary = includeSummary ? (measuredHeights?.summaryHeight || SUMMARY_HEIGHT) : 0;
    const usedHeight = header + footer + tableHeader;
    return A4_HEIGHT - (PAGE_MARGIN * 2) - usedHeight - summary;
  }, [measuredHeights]);

  // Helper function to get sort order for a class
  const getSortOrderForClass = useCallback((className: string | null): number => {
    if (!className || className === 'Unassigned') return 999; // Put Unassigned last
    const classItem = classes.find(c => c.name === className);
    return classItem ? classItem.sort_order : 999;
  }, [classes]);

  // Group students by class and stream
  const groupStudentsByClass = useCallback((studentList: StudentRecord[]): ClassGroup[] => {
    const groups: { [key: string]: ClassGroup } = {};
    
    studentList.forEach(student => {
      const className = student.class_name || 'Unassigned';
      const streamName = student.stream_name || null;
      const key = `${className}|||${streamName || ''}`;
      
      if (!groups[key]) {
        groups[key] = {
          className,
          streamName,
          students: []
        };
      }
      groups[key].students.push(student);
    });

    // Sort groups by class sort_order, then by stream name
    return Object.values(groups).sort((a, b) => {
      const sortOrderA = getSortOrderForClass(a.className);
      const sortOrderB = getSortOrderForClass(b.className);
      if (sortOrderA !== sortOrderB) return sortOrderA - sortOrderB;
      if (!a.streamName && !b.streamName) return 0;
      if (!a.streamName) return -1;
      if (!b.streamName) return 1;
      return a.streamName.localeCompare(b.streamName);
    });
  }, [getSortOrderForClass]);

  // Split records into pages using actual row height measurement
  const splitIntoPages = useCallback((studentList: StudentRecord[]): PageData[] => {
    if (studentList.length === 0) return [];
    
    const classGroups = groupStudentsByClass(studentList);
    const pages: PageData[] = [];
    let currentPageNumber = 1;
    
    const availableHeightWithoutSummary = calculateAvailableContentHeight(false);
    const availableHeightWithSummary = calculateAvailableContentHeight(true);
    const summaryHeight = measuredHeights?.summaryHeight || SUMMARY_HEIGHT;
    
    // Flatten all students to get global row index for height measurement
    const allStudents: { student: StudentRecord; classGroup: ClassGroup; globalIndex: number }[] = [];
    classGroups.forEach(group => {
      group.students.forEach(student => {
        allStudents.push({
          student,
          classGroup: group,
          globalIndex: allStudents.length
        });
      });
    });
    
    let currentPageRecords: StudentRecord[] = [];
    let currentCumulativeHeight = 0;
    let currentClass: string = '';
    let currentStream: string | null = null;
    let isClassContinuation = false;
    
    for (let i = 0; i < allStudents.length; i++) {
      const { student, classGroup } = allStudents[i];
      const isLastStudent = i === allStudents.length - 1;
      
      // Check if we're starting a new class
      if (currentClass !== classGroup.className || currentStream !== classGroup.streamName) {
        if (currentPageRecords.length > 0) {
          // Save current page before starting new class
          pages.push({
            records: [...currentPageRecords],
            pageNumber: currentPageNumber,
            totalPages: 0,
            showSummary: false,
            currentClass,
            currentStream,
            isClassContinuation
          });
          currentPageNumber++;
          currentPageRecords = [];
          currentCumulativeHeight = 0;
        }
        currentClass = classGroup.className;
        currentStream = classGroup.streamName;
        isClassContinuation = false;
      }
      
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
      
      if (isLastStudent) {
        // This is the last student overall
        // Calculate if summary + class summary table would fit
        const measuredClassSummaryHeight = measuredHeights?.classSummaryHeight || (selectedClass === 'all' ? CLASS_SUMMARY_TABLE_HEIGHT : 0);
        const totalAdditionalHeight = summaryHeight + measuredClassSummaryHeight;
        const wouldFitWithSummary = (newCumulativeHeight + totalAdditionalHeight) <= availableHeightWithSummary;
        
        if (wouldFitWithSummary) {
          currentPageRecords.push(student);
          pages.push({
            records: [...currentPageRecords],
            pageNumber: currentPageNumber,
            totalPages: 0,
            showSummary: true,
            currentClass,
            currentStream,
            isClassContinuation
          });
        } else {
          if (newCumulativeHeight <= availableHeightWithoutSummary) {
            currentPageRecords.push(student);
            pages.push({
              records: [...currentPageRecords],
              pageNumber: currentPageNumber,
              totalPages: 0,
              showSummary: false,
              currentClass,
              currentStream,
              isClassContinuation
            });
            // Create a summary page that includes both summary cards and class summary table
            pages.push({
              records: [],
              pageNumber: currentPageNumber + 1,
              totalPages: 0,
              showSummary: true,
              currentClass,
              currentStream,
              isClassContinuation: false
            });
          } else {
            pages.push({
              records: [...currentPageRecords],
              pageNumber: currentPageNumber,
              totalPages: 0,
              showSummary: false,
              currentClass,
              currentStream,
              isClassContinuation
            });
            pages.push({
              records: [student],
              pageNumber: currentPageNumber + 1,
              totalPages: 0,
              showSummary: true,
              currentClass,
              currentStream,
              isClassContinuation: false
            });
          }
        }
      } else {
        if (newCumulativeHeight > availableHeightWithoutSummary) {
          // Current page is full, save it and start new page
          pages.push({
            records: [...currentPageRecords],
            pageNumber: currentPageNumber,
            totalPages: 0,
            showSummary: false,
            currentClass,
            currentStream,
            isClassContinuation
          });
          currentPageRecords = [student];
          currentCumulativeHeight = actualRowHeight;
          currentPageNumber++;
          isClassContinuation = true;
        } else {
          currentPageRecords.push(student);
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
        showSummary: true,
        currentClass,
        currentStream,
        isClassContinuation
      });
    }
    
    return pages.map(page => ({ ...page, totalPages: pages.length }));
  }, [calculateAvailableContentHeight, groupStudentsByClass, measuredHeights]);

  // Fetch classes and streams on mount
  useEffect(() => {
    async function fetchDropdownData() {
      try {
        const [classesRes, streamsRes] = await Promise.all([
          supabase.from('classes').select('id, name, sort_order').order('sort_order', { ascending: true }),
          supabase.from('streams').select('id, name').order('sort_order', { ascending: true })
        ]);
        
        if (classesRes.data) setClasses(classesRes.data);
        if (streamsRes.data) setStreams(streamsRes.data);
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
    if (students.length > 0) {
      const splitPages = splitIntoPages(students);
      setPages(splitPages);
      pageRefs.current = new Array(splitPages.length).fill(null);
    } else {
      setPages([]);
    }
  }, [students, splitIntoPages, measuredHeights]);

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

      // Measure class summary table if present
      const classSummaryElement = firstPageElement.querySelector('h3.text-lg.font-semibold')?.nextElementSibling as HTMLElement;
      const classSummaryHeight = classSummaryElement ? classSummaryElement.offsetHeight : (selectedClass === 'all' ? CLASS_SUMMARY_TABLE_HEIGHT : 0);

      setMeasuredHeights(prev => {
        const newHeights = {
          headerHeight,
          footerHeight,
          summaryHeight,
          classSummaryHeight,
          tableHeaderHeight,
          rowHeights,
          maxRowHeight,
          avgRowHeight
        };
        
        if (!prev || 
            prev.headerHeight !== headerHeight ||
            prev.footerHeight !== footerHeight ||
            prev.summaryHeight !== summaryHeight ||
            prev.classSummaryHeight !== classSummaryHeight ||
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
  }, [showPreview, students.length]); // Remove pages.length from dependencies

  // Helper functions to get names by ID
  const getClassNameById = (classId: string) => {
    if (classId === 'all') return 'All Classes';
    const classObj = classes.find(c => c.id === parseInt(classId));
    return classObj ? classObj.name : classId;
  };

  const getStreamNameById = (streamId: string) => {
    if (streamId === 'all') return 'All Streams';
    const streamObj = streams.find(s => s.id === parseInt(streamId));
    return streamObj ? streamObj.name : streamId;
  };

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
          gender,
          date_of_birth,
          status,
          classes!students_current_class_id_fkey(name),
          streams!students_stream_id_fkey(name)
        `)
        .order('current_class_id', { ascending: true })
        .order('stream_id', { ascending: true })
        .order('name', { ascending: true });

      if (!includeInactive) {
        query = query.eq('status', 'Active');
      }

      if (selectedClass !== 'all') {
        query = query.eq('current_class_id', parseInt(selectedClass));
      }

      if (selectedStream !== 'all') {
        query = query.eq('stream_id', parseInt(selectedStream));
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform the data to match the expected interface
      const transformedData = (data || []).map((student: any) => {
        console.log('Student data:', student); // Debug log
        
        // Try to get class name from join, fallback to ID-based lookup
        let className = 'Unassigned';
        if (student.classes && student.classes.name) {
          className = student.classes.name;
        } else if (student.current_class_id) {
          const classObj = classes.find(c => c.id === student.current_class_id);
          className = classObj ? classObj.name : `Class ${student.current_class_id}`;
        }
        
        // Try to get stream name from join, fallback to ID-based lookup
        let streamName = '';
        if (student.streams && student.streams.name) {
          streamName = student.streams.name;
        } else if (student.stream_id) {
          const streamObj = streams.find(s => s.id === student.stream_id);
          streamName = streamObj ? streamObj.name : `Stream ${student.stream_id}`;
        }
        
        // Calculate age from date_of_birth
        let age = null;
        if (student.date_of_birth) {
          const birthDate = new Date(student.date_of_birth);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        }
        
        return {
          admission_number: student.admission_number,
          name: student.name,
          class_name: className,
          stream_name: streamName,
          gender: student.gender,
          age: age,
          status: student.status
        };
      });
      
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

      const filename = `Students_by_Class_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExportingPdf(false);
    }
  }, [pages, exportingPdf]);

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
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

  // Get summary statistics
  const getSummaryStats = () => {
    const totalStudents = students.length;
    const totalClasses = new Set(students.map(s => s.class_name)).size;
    const maleCount = students.filter(s => s.gender?.toLowerCase() === 'male').length;
    const femaleCount = students.filter(s => s.gender?.toLowerCase() === 'female').length;
    
    return { totalStudents, totalClasses, maleCount, femaleCount };
  };

  // Get class-wise summary statistics
  const getClassWiseSummary = () => {
    const classStats: { [key: string]: { male: number; female: number; total: number } } = {};
    
    students.forEach(student => {
      const className = student.class_name || 'Unassigned';
      
      if (!classStats[className]) {
        classStats[className] = { male: 0, female: 0, total: 0 };
      }
      
      classStats[className].total++;
      
      if (student.gender?.toLowerCase() === 'male') {
        classStats[className].male++;
      } else if (student.gender?.toLowerCase() === 'female') {
        classStats[className].female++;
      }
    });
    
    // Convert to array and sort by sort_order
    return Object.entries(classStats)
      .map(([className, stats]) => ({ className, ...stats }))
      .sort((a, b) => {
        const sortOrderA = getSortOrderForClass(a.className);
        const sortOrderB = getSortOrderForClass(b.className);
        return sortOrderA - sortOrderB;
      });
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
              <h2 className="text-xl font-semibold text-gray-800">Students by Class Report</h2>
              <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Classes</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id.toString()}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stream
                </label>
                <select
                  value={selectedStream}
                  onChange={(e) => setSelectedStream(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Streams</option>
                  {streams.map(s => (
                    <option key={s.id} value={s.id.toString()}>{s.name}</option>
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
                          <h1 className="text-3xl font-normal text-gray-900 mb-2">Students by Class</h1>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Class:</strong> {pageData.currentClass}{pageData.isClassContinuation ? ' (continued)' : ''}</p>
                            <p><strong>Stream:</strong> {selectedStream !== 'all' ? getStreamNameById(selectedStream) : (pageData.currentStream || 'None')}</p>
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
                                <th className="text-left p-3 text-sm font-semibold text-gray-700" style={{ width: '18%' }}>Adm No.</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700">Name</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700" style={{ width: '12%' }}>Gender</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700" style={{ width: '15%' }}>Age</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pageData.records.map((student, index) => {
                                // Calculate cumulative number across all previous pages
                                const previousPagesCount = pages.slice(0, pageIndex).reduce((total, page) => total + page.records.length, 0);
                                const cumulativeNumber = previousPagesCount + index + 1;
                                
                                return (
                                <tr key={student.admission_number} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : ''}`} style={index % 2 === 1 ? { backgroundColor: '#fcfcfd' } : {}}>
                                  <td className="p-3 text-sm text-gray-600">{cumulativeNumber}</td>
                                  <td className="p-3 text-sm text-gray-900 font-medium">{student.admission_number}</td>
                                  <td className="p-3 text-sm text-gray-900">{student.name}</td>
                                  <td className="p-3 text-sm text-gray-600">{student.gender || 'N/A'}</td>
                                  <td className="p-3 text-sm text-gray-600">{student.age || 'N/A'}</td>
                                </tr>
                                );
                              })}
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
                          <p className="text-sm text-gray-600 mb-1">Total Classes</p>
                          <p className="text-2xl font-semibold text-blue-600">{stats.totalClasses}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Male</p>
                          <p className="text-2xl font-semibold text-gray-900">{stats.maleCount}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Female</p>
                          <p className="text-2xl font-semibold text-gray-900">{stats.femaleCount}</p>
                        </div>
                      </div>
                    )}

                    {/* Class-wise Summary Table - Only show when all classes selected */}
                    {pageData.showSummary && selectedClass === 'all' && (
                      <div className="mt-8 flex-shrink-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Summary</h3>
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-50 border-b-2 border-gray-200">
                              <th className="text-left p-3 text-sm font-semibold text-gray-700">Class</th>
                              <th className="text-center p-3 text-sm font-semibold text-gray-700">Male</th>
                              <th className="text-center p-3 text-sm font-semibold text-gray-700">Female</th>
                              <th className="text-center p-3 text-sm font-semibold text-gray-700">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getClassWiseSummary().map((classStat, index) => (
                              <tr key={classStat.className} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : ''}`} style={index % 2 === 1 ? { backgroundColor: '#fcfcfd' } : {}}>
                                <td className="p-3 text-sm text-gray-900 font-medium">{classStat.className}</td>
                                <td className="p-3 text-sm text-gray-600 text-center">{classStat.male}</td>
                                <td className="p-3 text-sm text-gray-600 text-center">{classStat.female}</td>
                                <td className="p-3 text-sm text-gray-900 text-center font-semibold">{classStat.total}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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

export default StudentsByClassReport;
