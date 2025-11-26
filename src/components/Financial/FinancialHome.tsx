import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users, Calendar, AlertCircle } from 'lucide-react';

export const FinancialHome: React.FC = () => {
  // Mock data - replace with real data from Firebase
  const financialData = {
    unpaidInvoices: 25840,
    payables: 12450,
    bankBalance: 45890,
    monthlyIncome: 38500,
    monthlyExpenses: 22300,
    topExpenses: [
      { category: 'Food', amount: 8500, percentage: 38, color: 'bg-blue-500' },
      { category: 'Utilities', amount: 4200, percentage: 19, color: 'bg-green-500' },
      { category: 'Maintenance', amount: 3800, percentage: 17, color: 'bg-yellow-500' },
      { category: 'Transport', amount: 3200, percentage: 14, color: 'bg-purple-500' },
      { category: 'Supplies', amount: 2600, percentage: 12, color: 'bg-red-500' }
    ]
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendValue,
    color = 'blue'
  }: {
    title: string;
    value: number | string;
    icon: any;
    trend?: 'up' | 'down';
    trendValue?: string;
    color?: string;
  }) => (
    <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">
            ${Number(value).toLocaleString()}
          </p>
          {trend && trendValue && (
            <div
              className={`flex items-center mt-2 text-sm ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend === 'up' ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              {trendValue}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-3 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-3 mb-8 md:mb-4">
          <StatCard
            title="Total Unpaid Invoices"
            value={financialData.unpaidInvoices}
            icon={AlertCircle}
            trend="up"
            trendValue="12% from last month"
            color="red"
          />
          <StatCard
            title="Total Payables"
            value={financialData.payables}
            icon={TrendingDown}
            trend="down"
            trendValue="5% from last month"
            color="yellow"
          />
          <StatCard
            title="Bank Balance"
            value={financialData.bankBalance}
            icon={DollarSign}
            trend="up"
            trendValue="8% from last month"
            color="green"
          />
          <StatCard
            title="Active Students"
            value="342"
            icon={Users}
            color="blue"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-3 mb-8 md:mb-4">
          {/* Cash Flow Chart */}
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Cash Flow</h3>
            <div className="flex items-end justify-center space-x-8 h-48">
              <div className="flex flex-col items-center">
                <div
                  className="bg-green-500 rounded-t w-16 mb-2"
                  style={{ height: `${(financialData.monthlyIncome / 50000) * 150}px` }}
                ></div>
                <span className="text-sm text-gray-600">Income</span>
                <span className="text-sm font-semibold text-green-600">
                  ${financialData.monthlyIncome.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <div
                  className="bg-red-500 rounded-t w-16 mb-2"
                  style={{ height: `${(financialData.monthlyExpenses / 50000) * 150}px` }}
                ></div>
                <span className="text-sm text-gray-600">Expenses</span>
                <span className="text-sm font-semibold text-red-600">
                  ${financialData.monthlyExpenses.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-50 rounded">
              <p className="text-sm text-gray-600">Net Cash Flow</p>
              <p className="text-lg font-semibold text-green-600">
                +${(financialData.monthlyIncome - financialData.monthlyExpenses).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Top 5 Expense Categories */}
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Top Expense Categories
            </h3>
            <div className="space-y-4">
              {financialData.topExpenses.map((expense, index) => (
                <div key={index} className="flex items-center">
                  <div className={`w-4 h-4 rounded-full ${expense.color} mr-3`}></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {expense.category}
                      </span>
                      <span className="text-sm text-gray-600">
                        ${expense.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${expense.color}`}
                        style={{ width: `${expense.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Recent Financial Activity
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <p className="font-medium text-gray-800">Payment Received - John Smith</p>
                  <p className="text-sm text-gray-600">Invoice #INV-001 paid</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-600">+$1,200</p>
                <p className="text-sm text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                <div>
                  <p className="font-medium text-gray-800">Expense - Office Supplies</p>
                  <p className="text-sm text-gray-600">Stationery and materials</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-red-600">-$350</p>
                <p className="text-sm text-gray-500">5 hours ago</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <div>
                  <p className="font-medium text-gray-800">Invoice Created</p>
                  <p className="text-sm text-gray-600">Term fees for Grade 8</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-blue-600">$2,400</p>
                <p className="text-sm text-gray-500">1 day ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
