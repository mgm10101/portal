import React, { useState } from 'react';
import { FileText, Download, Calendar, Filter } from 'lucide-react';

export const ReportBuilder: React.FC = () => {
  const [selectedRecord, setSelectedRecord] = useState('');
  const [selectedField, setSelectedField] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Report Builder</h1>
          <p className="text-gray-600">Create custom reports from any section with flexible filtering options</p>
        </div>

        {/* Report Configuration */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Configure Your Report</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Select Records
              </label>
              <select
                value={selectedRecord}
                onChange={(e) => {
                  setSelectedRecord(e.target.value);
                  setSelectedField(''); // Reset field when record type changes
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose record type...</option>
                {recordTypes.map((record) => (
                  <option key={record.value} value={record.value}>
                    {record.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-2" />
                Group By Field
              </label>
              <select
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value)}
                disabled={!selectedRecord}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Choose field...</option>
                {selectedRecord && getFieldsForRecord(selectedRecord).map((field) => (
                  <option key={field.value} value={field.value}>
                    {field.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setSelectedRecord('');
                setSelectedField('');
                setStartDate('');
                setEndDate('');
              }}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Clear
            </button>
            <button
              onClick={generateReport}
              disabled={!selectedRecord || !selectedField}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Generate Report
            </button>
          </div>
        </div>

        {/* Report Preview */}
        {selectedRecord && selectedField && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Report Preview</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Report Type:</strong> {recordTypes.find(r => r.value === selectedRecord)?.label} by {getFieldsForRecord(selectedRecord).find(f => f.value === selectedField)?.label}
              </p>
              {startDate && endDate && (
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Date Range:</strong> {startDate} to {endDate}
                </p>
              )}
              <p className="text-sm text-gray-500 italic">
                Click "Generate Report" to create and download your custom report.
              </p>
            </div>
          </div>
        )}

        {/* Quick Report Templates */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Report Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left">
              <h4 className="font-medium text-gray-800">Student Enrollment by Class</h4>
              <p className="text-sm text-gray-500 mt-1">Current student distribution across all classes</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left">
              <h4 className="font-medium text-gray-800">Monthly Financial Summary</h4>
              <p className="text-sm text-gray-500 mt-1">Income vs expenses for the current month</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left">
              <h4 className="font-medium text-gray-800">Staff by Department</h4>
              <p className="text-sm text-gray-500 mt-1">Staff distribution across departments</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left">
              <h4 className="font-medium text-gray-800">Attendance Summary</h4>
              <p className="text-sm text-gray-500 mt-1">Weekly attendance rates by class</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left">
              <h4 className="font-medium text-gray-800">Outstanding Payments</h4>
              <p className="text-sm text-gray-500 mt-1">Unpaid invoices and overdue amounts</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left">
              <h4 className="font-medium text-gray-800">Inventory Status</h4>
              <p className="text-sm text-gray-500 mt-1">Stock levels and items needing reorder</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};