import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Filter, DollarSign, Calendar, CheckCircle, Users } from 'lucide-react';

export const Payroll: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<any>(null);
  const [periodType, setPeriodType] = useState('monthly');
  const [periodValue, setPeriodValue] = useState('2024-02');
  const [isHovering, setIsHovering] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation for scrolling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isHovering || !scrollContainerRef.current) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        scrollContainerRef.current.scrollBy({
          top: -100,
          behavior: 'smooth'
        });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        scrollContainerRef.current.scrollBy({
          top: 100,
          behavior: 'smooth'
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHovering]);

  const payrollRecords = [
    {
      id: 1,
      employeeId: 'EMP001',
      employeeName: 'Dr. Sarah Johnson',
      designation: 'Senior Science Teacher',
      department: 'Science Department',
      grossSalary: 80000,
      deductions: 8000,
      netSalary: 72000,
      payPeriodType: 'Monthly',
      payPeriodStart: '2024-02-01',
      payPeriodEnd: '2024-02-29',
      payDate: '2024-02-28',
      status: 'Paid',
      paymentMethod: 'Bank Transfer'
    },
    {
      id: 2,
      employeeId: 'EMP002',
      employeeName: 'Michael Thompson',
      designation: 'Mathematics Teacher',
      department: 'Mathematics Department',
      grossSalary: 68000,
      deductions: 6500,
      netSalary: 61500,
      payPeriodType: 'Monthly',
      payPeriodStart: '2024-02-01',
      payPeriodEnd: '2024-02-29',
      payDate: '2024-02-28',
      status: 'Paid',
      paymentMethod: 'Bank Transfer'
    },
    {
      id: 3,
      employeeId: 'EMP003',
      employeeName: 'Emily Rodriguez',
      designation: 'Administrative Officer',
      department: 'Administration',
      grossSalary: 47000,
      deductions: 4500,
      netSalary: 42500,
      payPeriodType: 'Monthly',
      payPeriodStart: '2024-03-01',
      payPeriodEnd: '2024-03-31',
      payDate: '2024-03-31',
      status: 'Pending',
      paymentMethod: 'Bank Transfer'
    }
  ];

  const PayrollForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <style>
        {`
          @media (min-width: 768px) {
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          }
        `}
      </style>
      <div 
        ref={scrollContainerRef}
        className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
              <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Dr. Sarah Johnson (EMP001)</option>
                <option>Michael Thompson (EMP002)</option>
                <option>Emily Rodriguez (EMP003)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pay Period</label>
              <input
                type="month"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue={selectedPayroll?.payPeriodStart}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gross Salary</label>
              <input
                type="number"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue={selectedPayroll?.grossSalary}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deductions</label>
              <input
                type="number"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue={selectedPayroll?.deductions}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pay Date</label>
              <input
                type="date"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue={selectedPayroll?.payDate}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Bank Transfer</option>
                <option>Cash</option>
                <option>Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes about payroll..."
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setSelectedPayroll(null);
              }}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {selectedPayroll ? 'Update' : 'Process'} Payroll
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-3 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-3 mb-6 md:mb-3">
          {/* Period Selector Card */}
          <div className="bg-white p-3 md:p-2 rounded-lg shadow-sm border border-gray-200">
            <div className="space-y-1.5">
              <div className="text-sm font-semibold text-black">
                Period Ending
              </div>
              {(periodType === 'daily' || periodType === 'weekly' || periodType === 'monthly' || periodType === 'fortnightly' || periodType === 'quarterly' || periodType === 'annually') && (
                <>
                  {periodType === 'daily' && (
                    <input 
                      type="date" 
                      value={periodValue}
                      onChange={(e) => setPeriodValue(e.target.value)}
                      className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                  )}
                  {periodType === 'weekly' && (
                    <input 
                      type="week" 
                      value={periodValue}
                      onChange={(e) => setPeriodValue(e.target.value)}
                      className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                  )}
                  {(periodType === 'monthly' || periodType === 'fortnightly') && (
                    <input 
                      type="month" 
                      value={periodValue}
                      onChange={(e) => setPeriodValue(e.target.value)}
                      className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                  )}
                  {periodType === 'quarterly' && (
                    <select 
                      value={periodValue}
                      onChange={(e) => setPeriodValue(e.target.value)}
                      className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    >
                      <option value="2024-Q1">Q1 2024</option>
                      <option value="2024-Q2">Q2 2024</option>
                      <option value="2024-Q3">Q3 2024</option>
                      <option value="2024-Q4">Q4 2024</option>
                    </select>
                  )}
                  {periodType === 'annually' && (
                    <input 
                      type="number" 
                      value={periodValue}
                      onChange={(e) => setPeriodValue(e.target.value)}
                      placeholder="2024"
                      min="2020"
                      max="2030"
                      className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                  )}
                </>
              )}
            </div>
          </div>
          <div className="bg-white p-3 md:p-2 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <div className="text-sm font-semibold text-gray-600">Total Payroll</div>
                <div className="text-2xl font-bold text-green-600">Ksh 176,000</div>
                <div className="flex items-center text-xs text-gray-600 mt-1">
                  <Users className="w-2.5 h-2.5 mr-2" />
                  <span>Staff Members: 3</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 md:p-2 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <div className="text-sm font-semibold text-gray-600">Paid This Month</div>
                <div className="text-2xl font-bold text-blue-600">Ksh 133,500</div>
                <div className="flex items-center text-xs text-gray-600 mt-1">
                  <Users className="w-2.5 h-2.5 mr-2" />
                  <span>Staff Members: 2</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 md:p-2 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <div className="text-sm font-semibold text-gray-600">Pending</div>
                <div className="text-2xl font-bold text-yellow-600">Ksh 42,500</div>
                <div className="flex items-center text-xs text-gray-600 mt-1">
                  <Users className="w-2.5 h-2.5 mr-2" />
                  <span>Staff Members: 1</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search, Filters, and Process Payroll */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search payroll records..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="flex-shrink-0 flex items-center justify-center p-2 md:px-4 md:py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Filter by Period</span>
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex-shrink-0 bg-blue-600 text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
            >
              <Plus className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">Process Payroll</span>
            </button>
          </div>
        </div>

        {/* Payroll Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Designation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gross Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deductions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pay Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payrollRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{record.employeeName}</div>
                        <div className="text-sm text-gray-500">{record.employeeId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{record.designation}</div>
                        <div className="text-sm text-gray-500">{record.department}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      Ksh {record.grossSalary.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      -Ksh {record.deductions.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      Ksh {record.netSalary.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{record.payPeriodType}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(record.payPeriodStart).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })} &nbsp;–&nbsp; {new Date(record.payPeriodEnd).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        record.status === 'Paid' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && <PayrollForm />}
      </div>
    </div>
  );
};