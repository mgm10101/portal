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
                        broughtforward_description,
                        students(class_name)
                    `)
                    .order('invoice_seq_number', { ascending: true });

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

                // Map the data and extract class_name from the join
                let mapped = (data as any[]).map((inv: any) => ({
                    ...inv,
                    class_name: inv.students?.class_name || null
                }));

                // Apply class filter client-side (after join is resolved)
                if (filterClass) {
                    mapped = mapped.filter((inv: any) => inv.class_name === filterClass);
                }

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
                .order('sort_order', { ascending: true, nullsFirst: false })
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
                billToDescription: headerData.description || 'N/A',
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
                ],
                admissionNumber: headerData.admission_number // Store for PDF naming
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

            // Wait for ALL content to be fully loaded - no hard-coded delays
            const waitForContentReady = async (): Promise<HTMLElement | null> => {
                const maxAttempts = 300; // Maximum attempts (30 seconds at 100ms intervals)
                let attempts = 0;
                
                while (attempts < maxAttempts) {
                    const container = document.getElementById('export-invoice-container');
                    if (!container) {
                        attempts++;
                        await new Promise(resolve => setTimeout(resolve, 100));
                        continue;
                    }

                    const invoiceContainer = container.querySelector('#invoice-container') as HTMLElement;
                    if (!invoiceContainer) {
                        attempts++;
                        await new Promise(resolve => setTimeout(resolve, 100));
                        continue;
                    }

                    // Check for loading state - must be completely gone
                    const hasLoadingText = container.textContent?.includes('Loading updated financial details');
                    if (hasLoadingText) {
                        attempts++;
                        await new Promise(resolve => setTimeout(resolve, 100));
                        continue;
                    }

                    // Verify all required fields are present and rendered
                    const hasInvoiceNumber = container.textContent?.includes(invoiceNumber);
                    const hasBillToName = invoiceData.billToName && container.textContent?.includes(invoiceData.billToName);
                    const hasItemsTable = invoiceContainer.querySelector('table tbody');
                    const hasBalanceDue = container.textContent?.includes('Balance Due') || container.textContent?.includes('KES');
                    const hasSubtotal = container.textContent?.includes('Sub Total') || container.textContent?.includes('Subtotal');
                    
                    // Check that table has actual rows (not just header)
                    const tableRows = invoiceContainer.querySelectorAll('table tbody tr');
                    const hasTableRows = tableRows.length > 0;
                    
                    // Check that invoice container has reasonable height (content is rendered)
                    const hasContentHeight = invoiceContainer.offsetHeight > 200;

                    // All checks must pass before proceeding
                    if (
                        hasInvoiceNumber &&
                        hasBillToName &&
                        hasItemsTable &&
                        hasBalanceDue &&
                        hasSubtotal &&
                        hasTableRows &&
                        hasContentHeight
                    ) {
                        // Double-check: wait for images to load and one more frame for paint
                        await new Promise(resolve => {
                            const checkImages = () => {
                                const images = invoiceContainer.querySelectorAll('img');
                                let imagesLoaded = 0;
                                let imagesToLoad = images.length;
                                
                                if (imagesToLoad === 0) {
                                    requestAnimationFrame(() => requestAnimationFrame(resolve));
                                    return;
                                }
                                
                                images.forEach((img) => {
                                    if ((img as HTMLImageElement).complete) {
                                        imagesLoaded++;
                                    } else {
                                        img.addEventListener('load', () => {
                                            imagesLoaded++;
                                            if (imagesLoaded === imagesToLoad) {
                                                requestAnimationFrame(() => requestAnimationFrame(resolve));
                                            }
                                        });
                                        img.addEventListener('error', () => {
                                            imagesLoaded++;
                                            if (imagesLoaded === imagesToLoad) {
                                                requestAnimationFrame(() => requestAnimationFrame(resolve));
                                            }
                                        });
                                    }
                                });
                                
                                if (imagesLoaded === imagesToLoad) {
                                    requestAnimationFrame(() => requestAnimationFrame(resolve));
                                }
                            };
                            checkImages();
                        });
                        
                        return invoiceContainer;
                    }
                    
                    attempts++;
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                // If we've exhausted attempts, log warning but return element anyway
                console.warn(`⚠️ [BATCH PDF] Invoice ${invoiceNumber} - Content verification timeout, proceeding anyway`);
                const container = document.getElementById('export-invoice-container');
                return container?.querySelector('#invoice-container') as HTMLElement || null;
            };

            // Wait for content to be fully ready
            const invoiceElement = await waitForContentReady();
            if (!invoiceElement) {
                console.error(`❌ [BATCH PDF] Invoice ${invoiceNumber} - Invoice container not found or not ready`);
                return null;
            }

            // Get row positions BEFORE hiding footer (so measurements are accurate)
            const tableRows: number[] = [];
            const container = document.getElementById('export-invoice-container');
            const wrapperElement = container || invoiceElement;
            
            if (invoiceElement) {
                // Find all table rows (including header and data rows)
                const rows = invoiceElement.querySelectorAll('table tbody tr, table thead tr');
                const wrapperRect = wrapperElement.getBoundingClientRect();
                
                rows.forEach((row) => {
                    const rect = row.getBoundingClientRect();
                    // Calculate relative position from top of wrapper element
                    const relativeTop = rect.top - wrapperRect.top;
                    const relativeBottom = rect.bottom - wrapperRect.top;
                    // Account for canvas scale (1.5) - the canvas will be scaled
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
            const footer = invoiceElement.querySelector('.invoice-footer') as HTMLElement;
            const originalFooterDisplay = footer ? footer.style.display : '';
            if (footer) {
                footer.style.display = 'none';
            }

            // Wait a moment for the DOM to update
            await new Promise(resolve => setTimeout(resolve, 50));

            const canvas = await html2canvas(wrapperElement || invoiceElement, {
                scale: 1.5,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                width: 794, // A4 width at 96 DPI
                windowWidth: 794,
                imageTimeout: 15000,
                removeContainer: false,
            });

            // Convert to JPEG
            const imgData = canvas.toDataURL('image/jpeg', 0.85);
            const pdf = new jsPDF('p', 'mm', 'a4');

            const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
            const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm

            // Convert canvas pixels to mm: At 96 DPI, 1 pixel = 25.4/96 mm = 0.264583mm
            const pixelsToMm = 25.4 / 96;
            
            // The canvas is captured at scale 1.5, so canvas.width = element.width * 1.5
            const margin = 10;
            const imgWidth = pageWidth - (margin * 2); // 190mm
            const availableHeight = pageHeight - (margin * 2);
            const canvasAspectRatio = canvas.width / canvas.height;
            const finalImgWidth = imgWidth;
            const finalImgHeight = finalImgWidth / canvasAspectRatio;

            // Calculate how many canvas pixels correspond to the available height per page
            const availableHeightInCanvasPx = (availableHeight / finalImgHeight) * canvas.height;
            
            // Helper function to find a safe cut point before a given position
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
            
            // Helper function to find the next row boundary after a given position
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
            
            // Process pages, adjusting for row boundaries
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
                
                if (sourceHeight <= 0) {
                    break;
                }
                
                pages.push({
                    sourceY: currentSourceY,
                    sourceHeight: sourceHeight
                });
                
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
                        0, sourceY, canvas.width, sourceHeight,
                        0, 0, canvas.width, sourceHeight
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

            // Restore footer display
            if (footer) {
                footer.style.display = originalFooterDisplay;
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
            
            // Track filename usage to handle duplicates
            const filenameCounts = new Map<string, number>();

            for (let i = 0; i < invoices.length; i++) {
                const invoice = invoices[i];
                setExportProgress({ current: i + 1, total: invoices.length });

                const pdfBlob = await generateInvoicePDF(invoice.invoice_number);
                
                if (pdfBlob) {
                    // Sanitize filename: replace invalid characters with underscores
                    const sanitizeFilename = (str: string) => str.replace(/[<>:"/\\|?*]/g, '_').trim();
                    const admissionNumber = invoice.admission_number || 'Unknown';
                    const studentName = invoice.name || 'Unknown';
                    const baseFilename = `${sanitizeFilename(admissionNumber)} - ${sanitizeFilename(studentName)}`;
                    
                    // Check if this filename has been used before
                    let filename = `${baseFilename}.pdf`;
                    if (filenameCounts.has(baseFilename)) {
                        // This is a duplicate, add (2), (3), etc.
                        const count = filenameCounts.get(baseFilename)! + 1;
                        filenameCounts.set(baseFilename, count);
                        filename = `${baseFilename} (${count}).pdf`;
                    } else {
                        // First occurrence, mark it
                        filenameCounts.set(baseFilename, 1);
                    }
                    
                    invoicesFolder?.file(filename, pdfBlob);
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
                    <div id="export-invoice-container" style={{ width: '794px' }}>
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
