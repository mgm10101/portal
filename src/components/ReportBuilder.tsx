import React, { useState } from 'react';
import { FileText, Download, Calendar, Filter } from 'lucide-react';
import { VoidedRecordsReport } from './Financial/VoidedRecordsReport';
import { StudentsByClassReport } from './Reports/StudentsByClassReport';
import { TransportSummaryReport } from './Reports/TransportSummaryReport';
import { ProjectedRevenueReport } from './Reports/ProjectedRevenueReport';
import { ExpenditurePerCategoryReport } from './Reports/ExpenditurePerCategoryReport';
import { ExpenditurePerVendorReport } from './Reports/ExpenditurePerVendorReport';
import { FeePaymentProgressReport } from './Reports/FeePaymentProgressReport';
import { InvoiceDistributionReport } from './Reports/InvoiceDistributionReport';
import { ExpenseAnalysisReport } from './Reports/ExpenseAnalysisReport';
import { StudentsByInvoiceItemsReport } from './Reports/StudentsByInvoiceItemsReport';
import { PaymentsReceivedReport } from './Reports/PaymentsReceivedReport';

interface ReportConfig {
  id: string;
  name: string;
  category: string;
  description: string;
}

const REPORT_CONFIG: ReportConfig[] = [
  // Student Reports
  { id: 'students-by-class', name: 'Students by Class', category: 'Student Reports', description: 'Class lists for each class and stream' },
  { id: 'attendance-summary', name: 'Attendance Summary', category: 'Student Reports', description: 'Attendance rates by class and individual students' },
  { id: 'assessment-averages', name: 'Assessment Averages by Subject', category: 'Student Reports', description: 'Average assessment scores and performance by subject' },
  { id: 'academic-performance', name: 'Academic Performance', category: 'Student Reports', description: 'Overall academic performance and ranking by class and subject' },
  { id: 'medical-summary', name: 'Medical Summary', category: 'Student Reports', description: 'Students by allergies and medical conditions' },
  { id: 'disciplinary-records', name: 'Disciplinary Records', category: 'Student Reports', description: 'Disciplinary incidents and actions taken' },
  { id: 'transport-summary', name: 'Transport Summary', category: 'Student Reports', description: 'Students by transport zones' },
  { id: 'boarding-summary', name: 'Boarding Summary', category: 'Student Reports', description: 'Students by boarding houses and rooms' },
  { id: 'enrollment-trends', name: 'Enrollment Trends', category: 'Student Reports', description: 'Student enrollment patterns and trends over time' },
  { id: 'students-by-teams', name: 'Students by Teams', category: 'Student Reports', description: 'Student distribution by teams' },
  { id: 'age-group-analysis', name: 'Age Group Analysis', category: 'Student Reports', description: 'Student demographics and distribution by age groups' },
  
  // Financial & Procurement Reports
  { id: 'monthly-financial-summary', name: 'Monthly Financial Summary', category: 'Financial Reports', description: 'Income vs expenses for the current month' },
  { id: 'outstanding-invoices', name: 'Outstanding Invoices', category: 'Financial Reports', description: 'Pending and overdue invoices, can also be filtered per class' },
  { id: 'payments-received', name: 'Payments Received', category: 'Financial Reports', description: 'All received payments by account, method, and period' },
  { id: 'projected-revenue', name: 'Projected Revenue by Source', category: 'Financial Reports', description: 'Projected revenue breakdown by Invoice line items' },
  { id: 'expenditure-per-category', name: 'Expenditure per Category', category: 'Financial Reports', description: 'Total expenditure breakdown by expense categories' },
  { id: 'expenditure-per-vendor', name: 'Expenditure Per Vendor', category: 'Financial Reports', description: 'Spending analysis by vendor for custom periods' },
  { id: 'fee-payment-progress', name: 'Fee Payment Progress', category: 'Financial Reports', description: 'Percentage of Students who have cleared a specified percentage of their outstanding fees' },
  { id: 'invoice-distribution', name: 'Invoice Distribution by Status', category: 'Financial Reports', description: 'Breakdown of invoices by payment status: paid, partially paid, unpaid, and overdue' },
  { id: 'students-by-invoice-items', name: 'Students by Invoice Items', category: 'Financial Reports', description: 'Break Down of Students with specified line items in their invoices for a specified period' },
  { id: 'expense-analysis', name: 'Expense Analysis', category: 'Financial Reports', description: 'Expenses by category and subcategory, vendor, and account' },
  { id: 'budget-vs-spending', name: 'Budget vs Spending', category: 'Financial Reports', description: 'Budget comparison by department and per staff member' },
  { id: 'stock-records', name: 'Stock Records', category: 'Financial Reports', description: 'In stock, out of stock, and negative stock items with requisition status' },
  { id: 'requisition-summary', name: 'Requisition Summary', category: 'Financial Reports', description: 'Inventory requisitions by staff, department, and period' },
  { id: 'asset-issuance-summary', name: 'Asset Issuance Summary', category: 'Financial Reports', description: 'Asset issuance records by staff, department, and status' },
  { id: 'voided-records', name: 'Voided Records', category: 'Financial Reports', description: 'View and export voided financial records with reasons' },
  
  // HR Reports
  { id: 'staff-distribution', name: 'Staff Distribution', category: 'HR Reports', description: 'Staff distribution by department and position' },
  { id: 'staff-status-reports', name: 'Staff Status Reports', category: 'HR Reports', description: 'Staff status breakdown: on leave, suspended, active, and terminated' },
  { id: 'payroll-summary', name: 'Payroll Summary', category: 'HR Reports', description: 'Payroll breakdown by department and position' },
  { id: 'payslips', name: 'Payslips', category: 'HR Reports', description: 'Individual staff payslips by period' },
  { id: 'payroll-analysis', name: 'Payroll Analysis', category: 'HR Reports', description: 'Payroll analysis by department, statutory deductions, and totals by period' },
  { id: 'leave-summary', name: 'Leave Summary', category: 'HR Reports', description: 'Leave records by status, by staff, and leave balances' },
  { id: 'hr-disciplinary-records', name: 'Disciplinary Records', category: 'HR Reports', description: 'Incidents and actions taken, including history for each staff member' },
  { id: 'staff-qualifications', name: 'Staff Qualifications', category: 'HR Reports', description: 'Staff qualifications by type and by department, showing qualification counts' }
];

interface ReportBuilderProps {
  reportAccess?: string[] | null;
}

// Helper function to check if user has access to a report
const hasReportAccess = (reportId: string, reportAccess: string[] | null | undefined): boolean => {
  // If reportAccess is null or undefined, user has access to all reports
  if (!reportAccess || reportAccess.length === 0) {
    return true;
  }
  return reportAccess.includes(reportId);
};

export const ReportBuilder: React.FC<ReportBuilderProps> = ({ reportAccess }) => {
  const [selectedRecord, setSelectedRecord] = useState('');
  const [selectedField, setSelectedField] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showVoidedRecordsReport, setShowVoidedRecordsReport] = useState(false);
  const [showStudentsByClassReport, setShowStudentsByClassReport] = useState(false);
  const [showTransportSummaryReport, setShowTransportSummaryReport] = useState(false);
  const [showProjectedRevenueReport, setShowProjectedRevenueReport] = useState(false);
  const [showExpenditurePerCategoryReport, setShowExpenditurePerCategoryReport] = useState(false);
  const [showExpenditurePerVendorReport, setShowExpenditurePerVendorReport] = useState(false);
  const [showFeePaymentProgressReport, setShowFeePaymentProgressReport] = useState(false);
  const [showInvoiceDistributionReport, setShowInvoiceDistributionReport] = useState(false);
  const [showExpenseAnalysisReport, setShowExpenseAnalysisReport] = useState(false);
  const [showStudentsByInvoiceItemsReport, setShowStudentsByInvoiceItemsReport] = useState(false);
  const [showPaymentsReceivedReport, setShowPaymentsReceivedReport] = useState(false);

  const recordTypes = [
    { value: 'students', label: 'Students' },
    { value: 'expenses', label: 'Expenses' },
    { value: 'payments', label: 'Payments' },
    { value: 'invoices', label: 'Invoices' },
    { value: 'staff', label: 'Staff' },
    { value: 'inventory', label: 'Inventory' },
    { value: 'library', label: 'Library' },
    { value: 'attendance', label: 'Attendance' },
    { value: 'assessments', label: 'Assessments' },
    { value: 'behavior', label: 'Behavior' }
  ];

  const getFieldsForRecord = (recordType: string) => {
    switch (recordType) {
      case 'students':
        return [
          { value: 'class', label: 'Class' },
          { value: 'team', label: 'Team Color' },
          { value: 'status', label: 'Status' },
          { value: 'age', label: 'Age Group' }
        ];
      case 'expenses':
        return [
          { value: 'category', label: 'Category' },
          { value: 'account', label: 'Account' },
          { value: 'vendor', label: 'Vendor' },
          { value: 'status', label: 'Payment Status' }
        ];
      case 'payments':
        return [
          { value: 'method', label: 'Payment Method' },
          { value: 'account', label: 'Account' },
          { value: 'student', label: 'Student' }
        ];
      case 'staff':
        return [
          { value: 'department', label: 'Department' },
          { value: 'position', label: 'Position' },
          { value: 'status', label: 'Status' }
        ];
      case 'inventory':
        return [
          { value: 'category', label: 'Category' },
          { value: 'status', label: 'Stock Status' },
          { value: 'department', label: 'Department' }
        ];
      default:
        return [];
    }
  };

  const generateReport = () => {
    // This would generate the actual report based on selections
    console.log('Generating report:', {
      recordType: selectedRecord,
      field: selectedField,
      dateRange: { start: startDate, end: endDate }
    });
  };

  const handleReportClick = (reportId: string) => {
    switch (reportId) {
      case 'students-by-class':
        setShowStudentsByClassReport(true);
        break;
      case 'transport-summary':
        setShowTransportSummaryReport(true);
        break;
      case 'projected-revenue':
        setShowProjectedRevenueReport(true);
        break;
      case 'expenditure-per-category':
        setShowExpenditurePerCategoryReport(true);
        break;
      case 'expenditure-per-vendor':
        setShowExpenditurePerVendorReport(true);
        break;
      case 'fee-payment-progress':
        setShowFeePaymentProgressReport(true);
        break;
      case 'invoice-distribution':
        setShowInvoiceDistributionReport(true);
        break;
      case 'expense-analysis':
        setShowExpenseAnalysisReport(true);
        break;
      case 'students-by-invoice-items':
        setShowStudentsByInvoiceItemsReport(true);
        break;
      case 'payments-received':
        setShowPaymentsReceivedReport(true);
        break;
      case 'voided-records':
        setShowVoidedRecordsReport(true);
        break;
      default:
        console.log(`${reportId} Report clicked`);
    }
  };

  const generateReportButtons = (category: string) => {
    const categoryReports = REPORT_CONFIG.filter(report => report.category === category);
    const accessibleReports = categoryReports.filter(report => hasReportAccess(report.id, reportAccess));
    
    if (accessibleReports.length === 0) {
      return null;
    }

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-4 mb-6 md:mb-3">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{category}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accessibleReports.map(report => (
            <button
              key={report.id}
              onClick={() => handleReportClick(report.id)}
              className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
            >
              <h4 className="font-medium text-gray-800">{report.name}</h4>
              <p className="text-sm text-gray-500 mt-1">{report.description}</p>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 md:p-3 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Generate report sections dynamically based on user access */}
        {generateReportButtons('Student Reports')}
        {generateReportButtons('Financial Reports')}
        {generateReportButtons('HR Reports')}

        {/* Voided Records Report */}
        {showVoidedRecordsReport && (
          <VoidedRecordsReport
            onClose={() => setShowVoidedRecordsReport(false)}
          />
        )}

        {/* Students by Class Report */}
        {showStudentsByClassReport && (
          <StudentsByClassReport
            onClose={() => setShowStudentsByClassReport(false)}
          />
        )}

        {/* Transport Summary Report */}
        {showTransportSummaryReport && (
          <TransportSummaryReport
            onClose={() => setShowTransportSummaryReport(false)}
          />
        )}

        {/* Projected Revenue Report */}
        {showProjectedRevenueReport && (
          <ProjectedRevenueReport
            onClose={() => setShowProjectedRevenueReport(false)}
          />
        )}

        {/* Expenditure per Category Report */}
        {showExpenditurePerCategoryReport && (
          <ExpenditurePerCategoryReport
            onClose={() => setShowExpenditurePerCategoryReport(false)}
          />
        )}

        {/* Expenditure Per Vendor Report */}
        {showExpenditurePerVendorReport && (
          <ExpenditurePerVendorReport
            onClose={() => setShowExpenditurePerVendorReport(false)}
          />
        )}

        {/* Fee Payment Progress Report */}
        {showFeePaymentProgressReport && (
          <FeePaymentProgressReport
            onClose={() => setShowFeePaymentProgressReport(false)}
          />
        )}

        {/* Invoice Distribution Report */}
        {showInvoiceDistributionReport && (
          <InvoiceDistributionReport
            onClose={() => setShowInvoiceDistributionReport(false)}
          />
        )}

        {/* Expense Analysis Report */}
        {showExpenseAnalysisReport && (
          <ExpenseAnalysisReport
            onClose={() => setShowExpenseAnalysisReport(false)}
          />
        )}

        {/* Students by Invoice Items Report */}
        {showStudentsByInvoiceItemsReport && (
          <StudentsByInvoiceItemsReport
            onClose={() => setShowStudentsByInvoiceItemsReport(false)}
          />
        )}

        {/* Payments Received Report */}
        {showPaymentsReceivedReport && (
          <PaymentsReceivedReport
            onClose={() => setShowPaymentsReceivedReport(false)}
          />
        )}
      </div>
    </div>
  );
};