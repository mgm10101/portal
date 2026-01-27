import React, { useState } from 'react';
import { Plus, Search, Filter, Wallet, DollarSign, Users, Package, User, Edit, Trash2 } from 'lucide-react';

type BudgetType = 'department' | 'staff' | 'item' | 'custom';
type TimePeriod = 'monthly' | 'quarterly' | 'yearly' | 'custom';

interface Budget {
  id: number;
  name: string;
  type: BudgetType;
  amount: number;
  spent: number;
  startDate: string;
  endDate: string;
  period: TimePeriod;
  status: 'healthy' | 'warning' | 'exceeded';
}

export const Budgets: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [budgetType, setBudgetType] = useState<BudgetType>('department');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly');
  const [showCustomDates, setShowCustomDates] = useState(false);

  // Sample budget data
  const budgets: Budget[] = [
    {
      id: 1,
      name: 'Science Department',
      type: 'department',
      amount: 50000,
      spent: 32500,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      period: 'yearly',
      status: 'healthy'
    },
    {
      id: 2,
      name: 'John Teacher',
      type: 'staff',
      amount: 5000,
      spent: 4800,
      startDate: '2024-02-01',
      endDate: '2024-02-29',
      period: 'monthly',
      status: 'warning'
    },
    {
      id: 3,
      name: 'Exercise Books',
      type: 'item',
      amount: 10000,
      spent: 10500,
      startDate: '2024-01-01',
      endDate: '2024-03-31',
      period: 'quarterly',
      status: 'exceeded'
    },
    {
      id: 4,
      name: 'Grade 8 Department',
      type: 'department',
      amount: 35000,
      spent: 18200,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      period: 'yearly',
      status: 'healthy'
    }
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear().toString().slice(-2);
    
    // Add ordinal suffix
    const getOrdinal = (n: number) => {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    
    return `${getOrdinal(day)} ${month} '${year}`;
  };

  const calculatePercentage = (spent: number, amount: number) => {
    return Math.round((spent / amount) * 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'exceeded':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage < 75) return 'bg-green-500';
    if (percentage < 95) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getBudgetIcon = (type: BudgetType) => {
    switch (type) {
      case 'department':
        return <Users className="w-4 h-4" />;
      case 'staff':
        return <User className="w-4 h-4" />;
      case 'item':
        return <Package className="w-4 h-4" />;
      case 'custom':
        return <DollarSign className="w-4 h-4" />;
      default:
        return <Wallet className="w-4 h-4" />;
    }
  };

  const BudgetForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Create New Budget</h2>
          <button
            onClick={() => setShowForm(false)}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <form className="space-y-6">
          {/* Budget Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Budget Type</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setBudgetType('department')}
                className={`p-4 border-2 rounded-lg flex flex-col items-center justify-center space-y-2 transition-colors ${
                  budgetType === 'department'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Users className="w-6 h-6" />
                <span className="text-sm font-medium">Department</span>
              </button>
              <button
                type="button"
                onClick={() => setBudgetType('staff')}
                className={`p-4 border-2 rounded-lg flex flex-col items-center justify-center space-y-2 transition-colors ${
                  budgetType === 'staff'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <User className="w-6 h-6" />
                <span className="text-sm font-medium">Staff</span>
              </button>
              <button
                type="button"
                onClick={() => setBudgetType('item')}
                className={`p-4 border-2 rounded-lg flex flex-col items-center justify-center space-y-2 transition-colors ${
                  budgetType === 'item'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Package className="w-6 h-6" />
                <span className="text-sm font-medium">Item</span>
              </button>
              <button
                type="button"
                onClick={() => setBudgetType('custom')}
                className={`p-4 border-2 rounded-lg flex flex-col items-center justify-center space-y-2 transition-colors ${
                  budgetType === 'custom'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <DollarSign className="w-6 h-6" />
                <span className="text-sm font-medium">Custom</span>
              </button>
            </div>
          </div>

          {/* Budget Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {budgetType === 'department' && 'Department Name'}
                {budgetType === 'staff' && 'Staff Member'}
                {budgetType === 'item' && 'Item Name'}
                {budgetType === 'custom' && 'Budget Name'}
              </label>
              {budgetType === 'department' || budgetType === 'staff' ? (
                <div className="flex">
                  <select className="flex-1 p-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    {budgetType === 'department' ? (
                      <>
                        <option>Science Department</option>
                        <option>Grade 8</option>
                        <option>Grade 9</option>
                        <option>Administration</option>
                      </>
                    ) : (
                      <>
                        <option>John Teacher</option>
                        <option>Dr. Smith</option>
                        <option>Admin Staff</option>
                      </>
                    )}
                  </select>
                  <button
                    type="button"
                    className="px-3 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={budgetType === 'item' ? 'Enter item name' : 'Enter budget name'}
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Time Period Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Time Period</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => {
                  setTimePeriod('monthly');
                  setShowCustomDates(false);
                }}
                className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                  timePeriod === 'monthly' && !showCustomDates
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimePeriod('quarterly');
                  setShowCustomDates(false);
                }}
                className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                  timePeriod === 'quarterly' && !showCustomDates
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                Quarterly
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimePeriod('yearly');
                  setShowCustomDates(false);
                }}
                className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                  timePeriod === 'yearly' && !showCustomDates
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                Yearly
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimePeriod('custom');
                  setShowCustomDates(true);
                }}
                className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                  showCustomDates
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                Custom Period
              </button>
            </div>
          </div>

          {/* Custom Date Range */}
          {showCustomDates && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Alert Threshold */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alert Threshold (% of budget used)
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="0"
                max="100"
                defaultValue="90"
                className="flex-1"
              />
              <span className="text-sm font-medium text-gray-700 w-12">90%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              You'll receive a warning when spending exceeds this percentage
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add any additional notes about this budget..."
            ></textarea>
          </div>

          {/* Form Actions */}
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
              Create Budget
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-3 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Search, Filters, and Create Budget */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 md:mb-3">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search budgets..."
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
              <span className="hidden md:inline">Create Budget</span>
            </button>
          </div>
        </div>

        {/* Budgets Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remaining
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {budgets.map((budget) => {
                  const percentage = calculatePercentage(budget.spent, budget.amount);
                  const remaining = budget.amount - budget.spent;

                  return (
                    <tr key={budget.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-50 rounded-lg mr-3">
                            {getBudgetIcon(budget.type)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{budget.name}</div>
                            <div className="text-xs text-gray-400">{formatDate(budget.startDate)} to {formatDate(budget.endDate)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                          {budget.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 capitalize">
                          {budget.period}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        ${budget.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                        ${budget.spent.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={remaining >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${Math.abs(remaining).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                            <div
                              className={`h-2 rounded-full ${getProgressBarColor(percentage)}`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700">{percentage}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(budget.status)} capitalize`}>
                          {budget.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && <BudgetForm />}
      </div>
    </div>
  );
};

