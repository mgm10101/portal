// src/components/Financial/Invoices/InvoiceBatchExport.tsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Download, FileDown, Loader2, Filter, X } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import InvoiceDisplay, { InvoiceData } from './InvoiceDisplay';

interface InvoiceBatchExportProps {
    onClose: () => void;
}

interface InvoiceForExport {
    invoice_number: string;
    invoice_seq_number: number;
    name: string;
    admission_number: string;
    class_name: string | null;
    invoice_date: string;
    due_date: string;
    status: string;
    description: string | null;
    subtotal: string;
    total_amount: string;
    payment_made: string;
    balance_due: string;
    broughtforward_amount: string | null;
    broughtforward_description: string | null;
}

export const InvoiceBatchExport: React.FC<InvoiceBatchExportProps> = ({ onClose }) => {
    const [filterClass, setFilterClass] = useState<string>('');
    const [dueDateFrom, setDueDateFrom] = useState<string>('');
    const [dueDateTo, setDueDateTo] = useState<string>('');
    const [balanceDueMin, setBalanceDueMin] = useState<string>('');
    const [balanceDueMax, setBalanceDueMax] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [selectedStudent, setSelectedStudent] = useState<string>('');
    const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
    const [showStudentDropdown, setShowStudentDropdown] = useState(false);
    const [classesList, setClassesList] = useState<any[]>([]);
    const [studentsList, setStudentsList] = useState<any[]>([]);
    const [loadingClasses, setLoadingClasses] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(true);
    const [invoices, setInvoices] = useState<InvoiceForExport[]>([]);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
    const [currentInvoiceData, setCurrentInvoiceData] = useState<InvoiceData | null>(null);
    const studentDropdownRef = useRef<HTMLDivElement>(null);

    // Fetch classes for filter
    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const { data } = await supabase
                    .from('classes')
                    .select('id, name')
                    .order('sort_order', { ascending: true, nullsFirst: true });
                setClassesList(data || []);
            } catch (error) {
                console.error('Error fetching classes:', error);
            } finally {
                setLoadingClasses(false);
            }
        };
        fetchClasses();
    }, []);

    // Fetch students for filter
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const { data } = await supabase
                    .from('students')
                    .select('admission_number, name')
                    .eq('status', 'Active')
                    .order('name', { ascending: true });
                setStudentsList(data || []);
            } catch (error) {
                console.error('Error fetching students:', error);
            } finally {
                setLoadingStudents(false);
            }
        };
        fetchStudents();
    }, []);

    // Close student dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (studentDropdownRef.current && !studentDropdownRef.current.contains(event.target as Node)) {
                setShowStudentDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Fetch invoices when filters change
    useEffect(() => {
        const fetchFilteredInvoices = async () => {
            // Check if any filter is active
            const hasFilters = filterClass || dueDateFrom || dueDateTo || balanceDueMin || balanceDueMax || filterStatus || selectedStudent;
            
            if (!hasFilters) {
                setInvoices([]);
                return;
            }

            setLoadingInvoices(true);
            try {
                let query = supabase
                    .from('invoices')
                    .select(`
                        invoice_number,
                        invoice_seq_number,
                        name,
                        admission_number,
                        invoice_date,
                        due_date,
                        status,
                        description,
                        subtotal,
                        total_amount,
                        payment_made,
                        balance_due,
                        broughtforward_amount,
                        broughtforward_description,
                        students!inner(class_name)
                    `)
                    .order('invoice_seq_number', { ascending: true });

                // Apply class filter
                if (filterClass) {
                    query = query.eq('students.class_name', filterClass);
                }

                // Apply due date range filter
                if (dueDateFrom) {
                    query = query.gte('due_date', dueDateFrom);
                }
                if (dueDateTo) {
                    query = query.lte('due_date', dueDateTo);
                }

                // Apply balance due range filter
                if (balanceDueMin) {
                    query = query.gte('balance_due', parseFloat(balanceDueMin));
                }
                if (balanceDueMax) {
                    query = query.lte('balance_due', parseFloat(balanceDueMax));
                }

                // Apply status filter
                if (filterStatus) {
                    query = query.eq('status', filterStatus);
                }

                // Apply student filter
                if (selectedStudent) {
                    query = query.eq('admission_number', selectedStudent);
                }

                const { data, error } = await query;

                if (error) throw error;

                const mapped = (data as any[]).map((inv: any) => ({
                    ...inv,
                    class_name: inv.students?.class_name || null
                }));

                setInvoices(mapped);
            } catch (error) {
                console.error('Error fetching invoices:', error);
                setInvoices([]);
            } finally {
                setLoadingInvoices(false);
            }
        };

        fetchFilteredInvoices();
    }, [filterClass, dueDateFrom, dueDateTo, balanceDueMin, balanceDueMax, filterStatus, selectedStudent]);

    // Fetch full invoice data with line items
    const fetchFullInvoiceData = async (invoiceNumber: string): Promise<InvoiceData | null> => {
        try {
            // Fetch invoice header
            const { data: headerData, error: headerError } = await supabase
                .from('invoices')
                .select('*')
                .eq('invoice_number', invoiceNumber)
                .single();

            if (headerError || !headerData) {
                console.error('Error fetching invoice header:', headerError);
                return null;
            }

            // Fetch line items
            const { data: lineItems, error: lineItemsError } = await supabase
                .from('invoice_line_items')
                .select('*')
                .eq('invoice_number', invoiceNumber)
                .order('sort_order', { ascending: true, nullsLast: true })
                .order('id', { ascending: true }); // Secondary sort

            if (lineItemsError) {
                console.error('Error fetching line items:', lineItemsError);
                return null;
            }

            // Transform to InvoiceData format
            const invoiceData: InvoiceData = {
                invoiceNumber: headerData.invoice_number,
                balanceDue: parseFloat(headerData.balance_due || 0),
                invoiceDate: headerData.invoice_date,
                dueDate: headerData.due_date,
                status: headerData.status,
                billToName: headerData.name,
                billToDescription: `Admission Number: ${headerData.admission_number}`,
                slogan: 'Excellence in Education',
                items: lineItems?.map((item: any, index: number) => ({
                    id: index + 1,
                    description: item.item_name || 'Item',
                    details: item.description || '',
                    quantity: parseFloat(item.quantity || 1),
                    rate: parseFloat(item.unit_price || 0),
                    total: parseFloat(item.line_total || 0),
                    finalAmount: parseFloat(item.line_total || 0),
                    discount: item.discount > 0 ? `${item.discount}% discount applied` : undefined
                })) || [],
                subTotal: parseFloat(headerData.subtotal || 0),
                paymentMade: parseFloat(headerData.payment_made || 0),
                finalBalance: parseFloat(headerData.balance_due || 0),
                paymentBanks: [
                    {
                        bank: 'Equity Bank',
                        branch: 'Westlands Branch',
                        accountNumber: '0123456789',
                        paybillNumber: '247247'
                    }
                ]
            };

            return invoiceData;
        } catch (error) {
            console.error('Error fetching full invoice data:', error);
            return null;
        }
    };

    // Generate a styled PDF for a single invoice using html2canvas (Optimized for smaller file size)
    const generateInvoicePDF = async (invoiceNumber: string): Promise<Blob | null> => {
        try {
            // Fetch full invoice data
            const invoiceData = await fetchFullInvoiceData(invoiceNumber);
            if (!invoiceData) {
                return null;
            }

            // Set the invoice data to render it in the DOM
            setCurrentInvoiceData(invoiceData);

            // Smart wait: Check for actual content, not just element existence
            const waitForContent = async (maxWait = 3000) => {
                const startTime = Date.now();
                while (Date.now() - startTime < maxWait) {
                    const element = document.getElementById('export-invoice-container');
                    if (element) {
                        // Check if loading message is gone and actual content exists
                        const hasLoadingText = element.textContent?.includes('Loading updated financial details');
                        const hasInvoiceNumber = element.textContent?.includes(invoiceNumber);
                        const hasItemsTable = element.querySelector('table');
                        
                        // Element is ready when: no loading text, has invoice number, and has items table
                        if (!hasLoadingText && hasInvoiceNumber && hasItemsTable && element.offsetHeight > 100) {
                            // One more frame to ensure everything is painted
                            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                            return element;
                        }
                    }
                    await new Promise(resolve => setTimeout(resolve, 100)); // Check every 100ms
                }
                // Fallback: return element even if checks didn't pass (better than nothing)
                return document.getElementById('export-invoice-container');
            };

            // Capture with html2canvas
            const invoiceElement = await waitForContent();
            if (!invoiceElement) {
                console.error('Invoice container not found');
                return null;
            }

            // DEBUG: Log element dimensions
            const rect = invoiceElement.getBoundingClientRect();
            console.log(`🔍 [BATCH PDF DEBUG] Invoice ${invoiceNumber} - Element dimensions:`, {
                width: rect.width,
                height: rect.height,
                scrollWidth: invoiceElement.scrollWidth,
                scrollHeight: invoiceElement.scrollHeight,
                offsetWidth: invoiceElement.offsetWidth,
                offsetHeight: invoiceElement.offsetHeight
            });

            const canvas = await html2canvas(invoiceElement, {
                scale: 1.5, // Reduced from 2 to 1.5 (still high quality, smaller file)
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                width: 794, // A4 width in pixels at 96 DPI
                windowWidth: 794,
                imageTimeout: 5000, // Reduced timeout (images should load faster)
                removeContainer: false,
                allowTaint: false,
                foreignObjectRendering: false, // Faster rendering
            });

            // DEBUG: Log canvas dimensions
            console.log(`🔍 [BATCH PDF DEBUG] Invoice ${invoiceNumber} - Canvas dimensions:`, {
                canvasWidth: canvas.width,
                canvasHeight: canvas.height,
                canvasAspectRatio: canvas.width / canvas.height
            });

            // Convert to JPEG with quality 0.85 instead of PNG (much smaller file size)
            const imgData = canvas.toDataURL('image/jpeg', 0.85);
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
            const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm

            // DEBUG: Log PDF page dimensions
            console.log(`🔍 [BATCH PDF DEBUG] Invoice ${invoiceNumber} - PDF page dimensions:`, {
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
            console.log(`🔍 [BATCH PDF DEBUG] Invoice ${invoiceNumber} - Conversion calculations:`, {
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
            
            console.log(`🔍 [BATCH PDF DEBUG] Invoice ${invoiceNumber} - Final dimensions (NO SCALING):`, {
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

            console.log(`🔍 [BATCH PDF DEBUG] Invoice ${invoiceNumber} - PDF placement:`, {
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

            const blob = pdf.output('blob');
            return blob;
        } catch (error) {
            console.error('Error generating PDF:', error);
            return null;
        }
    };

    // Handle batch export
    const handleBatchExport = async () => {
        if (invoices.length === 0) {
            alert('No invoices to export. Please adjust your filters.');
            return;
        }

        setIsExporting(true);
        setExportProgress({ current: 0, total: invoices.length });

        try {
            const zip = new JSZip();
            const invoicesFolder = zip.folder('Invoices');
            let successCount = 0;
            let failedCount = 0;

            for (let i = 0; i < invoices.length; i++) {
                const invoice = invoices[i];
                setExportProgress({ current: i + 1, total: invoices.length });

                const pdfBlob = await generateInvoicePDF(invoice.invoice_number);
                
                if (pdfBlob) {
                    invoicesFolder?.file(`${invoice.invoice_number}.pdf`, pdfBlob);
                    successCount++;
                } else {
                    console.error(`Failed to generate PDF for ${invoice.invoice_number}`);
                    failedCount++;
                }

                // Minimal yield to browser to prevent UI freeze
                await new Promise(resolve => requestAnimationFrame(resolve));
            }

            if (successCount === 0) {
                alert('Failed to generate any PDFs. Please try again.');
                setIsExporting(false);
                setExportProgress({ current: 0, total: 0 });
                return;
            }

            // Generate zip file
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            
            // Download
            const timestamp = new Date().toISOString().split('T')[0];
            saveAs(zipBlob, `Invoices_Export_${timestamp}.zip`);

            const message = failedCount > 0 
                ? `Exported ${successCount} invoice(s). ${failedCount} failed.`
                : `Successfully exported ${successCount} invoice(s)!`;
            
            alert(message);
            onClose();
        } catch (error) {
            console.error('Error during batch export:', error);
            alert('An error occurred during export. Please try again.');
        } finally {
            setIsExporting(false);
            setExportProgress({ current: 0, total: 0 });
        }
    };

    const handleClearFilters = () => {
        setFilterClass('');
        setDueDateFrom('');
        setDueDateTo('');
        setBalanceDueMin('');
        setBalanceDueMax('');
        setFilterStatus('');
        setSelectedStudent('');
        setStudentSearchQuery('');
    };

    const hasActiveFilters = filterClass || dueDateFrom || dueDateTo || balanceDueMin || balanceDueMax || filterStatus || selectedStudent;

    // Filter students for dropdown
    const filteredStudents = useMemo(() => {
        if (!studentSearchQuery) return studentsList.slice(0, 10); // Show first 10 if no search
        const query = studentSearchQuery.toLowerCase();
        return studentsList
            .filter(s => 
                s.name?.toLowerCase().includes(query) || 
                s.admission_number?.toLowerCase().includes(query)
            )
            .slice(0, 10);
    }, [studentSearchQuery, studentsList]);

    return (
        <>
            {/* Hidden invoice for PDF generation */}
            {currentInvoiceData && (
                <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                    <div id="export-invoice-container">
                        <InvoiceDisplay data={currentInvoiceData} />
                    </div>
                </div>
            )}

            <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-2xl font-bold text-gray-800">Batch Invoice Export</h3>
                    <p className="text-gray-600 mt-1">
                        Filter and export invoices as PDF files in a single zip archive
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Filters Section */}
            <div className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <Filter className="w-5 h-5 text-gray-600 mr-2" />
                        <h4 className="font-semibold text-gray-800">Filters</h4>
                    </div>
                    {hasActiveFilters && (
                        <button
                            onClick={handleClearFilters}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                            disabled={isExporting}
                        >
                            Clear All
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Class Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Filter by Class
                        </label>
                        <select
                            value={filterClass}
                            onChange={(e) => setFilterClass(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={loadingClasses || isExporting}
                        >
                            <option value="">All Classes</option>
                            {classesList.map(cls => (
                                <option key={cls.id} value={cls.name}>
                                    {cls.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Due Date From */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Due Date From
                        </label>
                        <input
                            type="date"
                            value={dueDateFrom}
                            onChange={(e) => setDueDateFrom(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isExporting}
                        />
                    </div>

                    {/* Due Date To */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Due Date To
                        </label>
                        <input
                            type="date"
                            value={dueDateTo}
                            onChange={(e) => setDueDateTo(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isExporting}
                        />
                    </div>

                    {/* Balance Due Min */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Balance Due (Min)
                        </label>
                        <input
                            type="number"
                            value={balanceDueMin}
                            onChange={(e) => setBalanceDueMin(e.target.value)}
                            placeholder="e.g., 0"
                            step="0.01"
                            min="0"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isExporting}
                        />
                    </div>

                    {/* Balance Due Max */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Balance Due (Max)
                        </label>
                        <input
                            type="number"
                            value={balanceDueMax}
                            onChange={(e) => setBalanceDueMax(e.target.value)}
                            placeholder="e.g., 10000"
                            step="0.01"
                            min="0"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isExporting}
                        />
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isExporting}
                        >
                            <option value="">All Statuses</option>
                            <option value="Paid">Paid</option>
                            <option value="Pending">Pending</option>
                            <option value="Overdue">Overdue</option>
                            <option value="Forwarded">Forwarded</option>
                            <option value="Draft">Draft</option>
                        </select>
                    </div>

                    {/* Student Filter */}
                    <div className="relative" ref={studentDropdownRef}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Student
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={selectedStudent ? studentsList.find(s => s.admission_number === selectedStudent)?.name || selectedStudent : studentSearchQuery}
                                onChange={(e) => {
                                    setStudentSearchQuery(e.target.value);
                                    setShowStudentDropdown(true);
                                    if (!e.target.value) {
                                        setSelectedStudent('');
                                    }
                                }}
                                onFocus={() => setShowStudentDropdown(true)}
                                placeholder={loadingStudents ? "Loading..." : "Search by name or admission number"}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={loadingStudents || isExporting}
                            />
                            {selectedStudent && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedStudent('');
                                        setStudentSearchQuery('');
                                    }}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        {showStudentDropdown && filteredStudents.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {filteredStudents.map((student) => (
                                    <div
                                        key={student.admission_number}
                                        onClick={() => {
                                            setSelectedStudent(student.admission_number);
                                            setStudentSearchQuery('');
                                            setShowStudentDropdown(false);
                                        }}
                                        className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                                    >
                                        <div className="font-medium">{student.name}</div>
                                        <div className="text-sm text-gray-500">{student.admission_number}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Results Section */}
            <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800">Preview</h4>
                    {loadingInvoices && (
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    )}
                </div>

                {!hasActiveFilters && !loadingInvoices && (
                    <div className="text-center py-12 text-gray-500">
                        <FileDown className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="font-medium">No filters applied</p>
                        <p className="text-sm mt-1">Apply filters to view and export invoices</p>
                    </div>
                )}

                {hasActiveFilters && loadingInvoices && (
                    <div className="text-center py-12">
                        <Loader2 className="w-12 h-12 mx-auto mb-3 text-blue-500 animate-spin" />
                        <p className="text-gray-600">Loading invoices...</p>
                    </div>
                )}

                {hasActiveFilters && !loadingInvoices && invoices.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <p className="font-medium">No invoices found</p>
                        <p className="text-sm mt-1">Try adjusting your filters</p>
                    </div>
                )}

                {hasActiveFilters && !loadingInvoices && invoices.length > 0 && (
                    <div>
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
                            <p className="text-sm text-green-800">
                                <strong>{invoices.length}</strong> invoice(s) matched your filters
                            </p>
                        </div>

                        <div className="max-h-64 overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100 sticky top-0">
                                    <tr>
                                        <th className="text-left p-2">Invoice #</th>
                                        <th className="text-left p-2">Student</th>
                                        <th className="text-left p-2">Class</th>
                                        <th className="text-left p-2">Date</th>
                                        <th className="text-right p-2">Amount</th>
                                        <th className="text-center p-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map((inv) => (
                                        <tr key={inv.invoice_number} className="border-b hover:bg-gray-50">
                                            <td className="p-2 font-medium">{inv.invoice_number}</td>
                                            <td className="p-2">
                                                <div className="text-sm">
                                                    <div className="font-medium">{inv.name}</div>
                                                    <div className="text-gray-500 text-xs">{inv.admission_number}</div>
                                                </div>
                                            </td>
                                            <td className="p-2">{inv.class_name || '-'}</td>
                                            <td className="p-2">{inv.invoice_date}</td>
                                            <td className="p-2 text-right font-medium">
                                                Ksh.{parseFloat(inv.total_amount).toFixed(2)}
                                            </td>
                                            <td className="p-2 text-center">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    inv.status === 'Paid' 
                                                        ? 'bg-green-100 text-green-800'
                                                        : inv.status === 'Overdue'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Export Progress */}
            {isExporting && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-800">
                            Generating PDFs...
                        </span>
                        <span className="text-sm text-blue-600">
                            {exportProgress.current} / {exportProgress.total}
                        </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                        <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(exportProgress.current / exportProgress.total) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center border-t pt-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={isExporting}
                >
                    Close
                </button>
                <button
                    type="button"
                    onClick={handleBatchExport}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 font-semibold transition-colors flex items-center"
                    disabled={isExporting || invoices.length === 0}
                >
                    {isExporting ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Exporting...
                        </>
                    ) : (
                        <>
                            <Download className="w-5 h-5 mr-2" />
                            Export {invoices.length > 0 ? `${invoices.length} Invoice(s)` : 'Invoices'}
                        </>
                    )}
                </button>
            </div>
        </div>
        </>
    );
};
