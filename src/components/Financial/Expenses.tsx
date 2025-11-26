import React, { useState } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2 } from 'lucide-react';

export const Expenses: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);

  const expenses = [
    {
      id: 1,
      date: '2024-02-05',
      category: 'Food',
      amount: 850,
      paidThrough: 'KCB Bank',
      vendor: 'Fresh Foods Ltd',
      description: 'Weekly food supplies',
      reference: 'EXP001'
    },
    {
      id: 2,
      date: '2024-02-04',
      category: 'Utilities',
      amount: 420,
      paidThrough: 'DTB Bank',
      vendor: 'Kenya Power',
      description: 'Monthly electricity bill',
      reference: 'EXP002'
    },
    {
      id: 3,
      date: '2024-02-03',
      category: 'Maintenance',
      amount: 380,
      paidThrough: 'Petty Cash',
      vendor: 'Fix-It Services',
      description: 'Classroom repairs',
      reference: 'EXP003'
    }
  ];

  const ExpenseForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {selectedExpense ? 'Edit Expense' : 'Record New Expense'}
          </h2>
          <button
            onClick={() => {
              setShowForm(false);
              setSelectedExpense(null);
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue={selectedExpense?.date || new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue={selectedExpense?.amount}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
              <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Paid</option>
                <option>Unpaid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (if unpaid)</label>
              <input
                type="date"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <div className="flex">
                <select className="flex-1 p-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Select Category</option>
                  <option>Food</option>
                  <option>Utilities</option>
                  <option>Maintenance</option>
                  <option>Transport</option>
                  <option>Supplies</option>
                  <option>Salaries</option>
                  <option>Insurance</option>
                  <option>Marketing</option>
                </select>
                <button
                  type="button"
                  className="px-3 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paid Through</label>
              <div className="flex">
                <select className="flex-1 p-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Select Account</option>
                  <option>KCB Bank</option>
                  <option>DTB Bank</option>
                  <option>Equity Bank</option>
                  <option>Petty Cash</option>
                  <option>Mobile Money</option>
                </select>
                <button
                  type="button"
                  className="px-3 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
            <div className="flex">
              <select className="flex-1 p-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Select Vendor</option>
                <option>Fresh Foods Ltd</option>
                <option>Kenya Power</option>
                <option>Fix-It Services</option>
                <option>Office Supplies Co</option>
                <option>Transport Services</option>
              </select>
              <button
                type="button"
                className="px-3 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              placeholder="Brief description of the expense"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              defaultValue={selectedExpense?.description}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number (Optional)</label>
            <input
              type="text"
              placeholder="Receipt or reference number"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              defaultValue={selectedExpense?.reference}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes about the expense..."
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setSelectedExpense(null);
              }}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {selectedExpense ? 'Update' : 'Record'} Expense
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
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Today's Expenses</div>
            <div className="text-2xl font-bold text-gray-800">$850</div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">This Week</div>
            <div className="text-2xl font-bold text-red-600">$3,420</div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">This Month</div>
            <div className="text-2xl font-bold text-red-600">$22,300</div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Top Category</div>
            <div className="text-lg font-bold text-blue-600">Food</div>
          </div>
        </div>

        {/* Search, Filters, and Record Expense */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 md:mb-3">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search expenses..."
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
              <span className="hidden md:inline">Record Expense</span>
            </button>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid Through
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{expense.date}</div>
                        <div className="text-sm text-gray-500">{expense.reference}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-red-600">${expense.amount}</div>
                      <div className="text-sm text-gray-500">{expense.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.paidThrough}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.vendor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-700">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedExpense(expense);
                            setShowForm(true);
                          }}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-700">
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

        {showForm && <ExpenseForm />}
      </div>
    </div>
  );
};