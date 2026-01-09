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

export const ReportBuilder: React.FC = () => {
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

  return (
    <div className="p-6 md:p-3 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Student Reports */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-4 mb-6 md:mb-3">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Student Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button 
              onClick={() => setShowStudentsByClassReport(true)}
              className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
            >
              <h4 className="font-medium text-gray-800">Students by Class</h4>
              <p className="text-sm text-gray-500 mt-1">Class lists for each class and stream</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left">
              <h4 className="font-medium text-gray-800">Attendance Summary</h4>
              <p className="text-sm text-gray-500 mt-1">Attendance rates by class and individual students</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left">
              <h4 className="font-medium text-gray-800">Assessment Averages by Subject</h4>
              <p className="text-sm text-gray-500 mt-1">Average assessment scores and performance by subject</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left">
              <h4 className="font-medium text-gray-800">Academic Performance</h4>
              <p className="text-sm text-gray-500 mt-1">Overall academic performance and ranking by class and subject</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left">
              <h4 className="font-medium text-gray-800">Medical Summary</h4>
              <p className="text-sm text-gray-500 mt-1">Students by allergies and medical conditions</p>
            </button>
            <button 
              onClick={() => console.log('Disciplinary Records Report')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
            >
              <h4 className="font-medium text-gray-800">Disciplinary Records</h4>
              <p className="text-sm text-gray-500 mt-1">Disciplinary incidents and actions taken</p>
            </button>
            <button 
              onClick={() => setShowTransportSummaryReport(true)}
              className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
            >
              <h4 className="font-medium text-gray-800">Transport Summary</h4>
              <p className="text-sm text-gray-500 mt-1">Students by transport zones</p>
            </button>
            <button 
              onClick={() => console.log('Boarding Summary Report')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
            >
              <h4 className="font-medium text-gray-800">Boarding Summary</h4>
              <p className="text-sm text-gray-500 mt-1">Students by boarding houses and rooms</p>
            </button>
            <button 
              onClick={() => console.log('Deregistered Students Report')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
            >
              <h4 className="font-medium text-gray-800">Deregistered Students</h4>
              <p className="text-sm text-gray-500 mt-1">List of inactive students</p>
            </button>
            <button 
              onClick={() => console.log('Enrollment Trends Report')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
            >
              <h4 className="font-medium text-gray-800">Enrollment Trends</h4>
              <p className="text-sm text-gray-500 mt-1">Student enrollment patterns and trends over time</p>
            </button>
            <button 
              onClick={() => console.log('Students by Teams Report')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
            >
              <h4 className="font-medium text-gray-800">Students by Teams</h4>
              <p className="text-sm text-gray-500 mt-1">Student distribution by teams</p>
            </button>
            <button 
              onClick={() => console.log('Age Group Analysis Report')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
            >
              <h4 className="font-medium text-gray-800">Age Group Analysis</h4>
              <p className="text-sm text-gray-500 mt-1">Student demographics and distribution by age groups</p>
            </button>
          </div>
        </div>

        {/* Financial & Procurement Reports */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-4 mb-6 md:mb-3">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial & Procurement Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button 
              onClick={() => console.log('Monthly Financial Summary Report')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
            >
              <h4 className="font-medium text-gray-800">Monthly Financial Summary</h4>
              <p className="text-sm text-gray-500 mt-1">Income vs expenses for the current month</p>
            </button>
            <button 
              onClick={() => console.log('Outstanding Invoices Report')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
            >
              <h4 className="font-medium text-gray-800">Outstanding Invoices</h4>
              <p className="text-sm text-gray-500 mt-1">Pending and overdue invoices, can also be filtered per class</p>
            </button>
            <button 
              onClick={() => setShowPaymentsReceivedReport(true)}
              className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
            >
              <h4 className="font-medium text-gray-800">Payments Received</h4>
              <p className="text-sm text-gray-500 mt-1">All received payments by account, method, and period</p>
            </button>
            <button 
              onClick={() => setShowProjectedRevenueReport(true)}
              className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
            >
              <h4 className="font-medium text-gray-800">Projected Revenue by Source</h4>
              <p className="text-sm text-gray-500 mt-1">Projected revenue breakdown by Invoice line items</p>
            </button>
            <button 
              onClick={() => setShowExpenditurePerCategoryReport(true)}
              className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
            >
              <h4 className="font-medium text-gray-800">Expenditure per Category</h4>
              <p className="text-sm text-gray-500 mt-1">Total expenditure breakdown by expense categories</p>
            </button>
            <button 
              onClick={() => setShowExpenditurePerVendorReport(true)}
              className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
            >
              <h4 className="font-medium text-gray-800">Expenditure Per Vendor</h4>
              <p className="text-sm text-gray-500 mt-1">Spending analysis by vendor for custom periods</p>
            </button>
            <button 
              onClick={() => setShowFeePaymentProgressReport(true)}
              className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
            >
              <h4 className="font-medium text-gray-800">Fee Payment Progress</h4>
              <p className="text-sm text-gray-500 mt-1">Percentage of Students who have cleared a specified percentage of their outstanding fees</p>
            </button>
            <button 
              onClick={() => setShowInvoiceDistributionReport(true)}
              className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
            >
              <h4 className="font-medium text-gray-800">Invoice Distribution by Status</h4>
              <p className="text-sm text-gray-500 mt-1">Breakdown of invoices by payment status: paid, partially paid, unpaid, and overdue</p>
            </button>
            <button 
              onClick={() => setShowStudentsByInvoiceItemsReport(true)}
              className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
            >
              <h4 className="font-medium text-gray-800">Students by Invoice Items</h4>
              <p className="text-sm text-gray-500 mt-1">Break Down of Students with specified line items in their invoices for a specified period</p>
            </button>
            <button 
              onClick={() => setShowExpenseAnalysisReport(true)}
              className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
            >
              <h4 className="font-medium text-gray-800">Expense Analysis</h4>
              <p className="text-sm text-gray-500 mt-1">Expenses by category and subcategory, vendor, and account</p>
            </button>
            <button 
              onClick={() => console.log('Budget vs Spending Report')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
            >
              <h4 className="font-medium text-gray-800">Budget vs Spending</h4>
              <p className="text-sm text-gray-500 mt-1">Budget comparison by department and per staff member</p>
            </button>
            <button 
              onClick={() => console.log('Stock Records Report')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
            >
              <h4 className="font-medium text-gray-800">Stock Records</h4>
              <p className="text-sm text-gray-500 mt-1">In stock, out of stock, and negative stock items with requisition status</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left">
              <h4 className="font-medium text-gray-800">Requisition Summary</h4>
              <p className="text-sm text-gray-500 mt-1">Inventory requisitions by staff, department, and period</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left">
              <h4 className="font-medium text-gray-800">Asset Issuance Summary</h4>
              <p className="text-sm text-gray-500 mt-1">Asset issuance records by staff, department, and status</p>
            </button>
            <button 
              onClick={() => setShowVoidedRecordsReport(true)}
              className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
            >
              <h4 className="font-medium text-gray-800">Voided Records</h4>
              <p className="text-sm text-gray-500 mt-1">View and export voided financial records with reasons</p>
            </button>
          </div>
        </div>

        {/* HR Reports */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">HR Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left">
              <h4 className="font-medium text-gray-800">Staff Distribution</h4>
              <p className="text-sm text-gray-500 mt-1">Staff distribution by department and position</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left">
              <h4 className="font-medium text-gray-800">Staff Status Reports</h4>
              <p className="text-sm text-gray-500 mt-1">Staff status breakdown: on leave, suspended, active, and terminated</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left">
              <h4 className="font-medium text-gray-800">Payroll Summary</h4>
              <p className="text-sm text-gray-500 mt-1">Payroll breakdown by department and position</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left">
              <h4 className="font-medium text-gray-800">Payslips</h4>
              <p className="text-sm text-gray-500 mt-1">Individual staff payslips by period</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left">
              <h4 className="font-medium text-gray-800">Payroll Analysis</h4>
              <p className="text-sm text-gray-500 mt-1">Payroll analysis by department, statutory deductions, and totals by period</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left">
              <h4 className="font-medium text-gray-800">Leave Summary</h4>
              <p className="text-sm text-gray-500 mt-1">Leave records by status, by staff, and leave balances</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left">
              <h4 className="font-medium text-gray-800">Disciplinary Records</h4>
              <p className="text-sm text-gray-500 mt-1">Incidents and actions taken, including history for each staff member</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left">
              <h4 className="font-medium text-gray-800">Staff Qualifications</h4>
              <p className="text-sm text-gray-500 mt-1">Staff qualifications by type and by department, showing qualification counts</p>
            </button>
          </div>
        </div>

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