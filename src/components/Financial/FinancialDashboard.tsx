// src/components/Financial/FinancialDashboard.tsx

import React, { useState } from 'react';
import { CreditCard, FileText, TrendingUp, Users, DollarSign, AlertCircle } from 'lucide-react';
import { PaymentPlansContainer } from './PaymentPlans/PaymentPlansContainer';

interface FinancialModule {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  component: React.ReactNode;
}

export const FinancialDashboard: React.FC = () => {
  const [activeModule, setActiveModule] = useState<string>('overview');

  const financialModules: FinancialModule[] = [
    {
      id: 'overview',
      name: 'Financial Overview',
      icon: <TrendingUp className="w-6 h-6" />,
      description: 'View financial summaries and reports',
      component: (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Financial Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <div className="text-sm text-gray-600">Total Revenue</div>
                  <div className="text-2xl font-bold text-blue-600">Ksh 2,450,000</div>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <div className="text-sm text-gray-600">Active Students</div>
                  <div className="text-2xl font-bold text-green-600">245</div>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-8 h-8 text-yellow-600 mr-3" />
                <div>
                  <div className="text-sm text-gray-600">Pending Payments</div>
                  <div className="text-2xl font-bold text-yellow-600">Ksh 125,000</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'payment-plans',
      name: 'Payment Plans',
      icon: <FileText className="w-6 h-6" />,
      description: 'Manage student payment plans and agreements',
      component: <PaymentPlansContainer />
    },
    {
      id: 'invoices',
      name: 'Invoices',
      icon: <CreditCard className="w-6 h-6" />,
      description: 'Create and manage student invoices',
      component: (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Invoice Management</h2>
          <p className="text-gray-600">Invoice module would be integrated here.</p>
        </div>
      )
    }
  ];

  const currentModule = financialModules.find(module => module.id === activeModule);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <h1 className="text-xl font-bold text-gray-900">Financials</h1>
            <p className="text-sm text-gray-600 mt-1">Manage school finances</p>
          </div>
          
          <nav className="px-4 pb-6">
            <div className="space-y-2">
              {financialModules.map((module) => (
                <button
                  key={module.id}
                  onClick={() => setActiveModule(module.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeModule === module.id
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {module.icon}
                  <div className="text-left">
                    <div className="font-medium">{module.name}</div>
                    <div className="text-sm text-gray-500">{module.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {currentModule && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{currentModule.name}</h1>
                <p className="text-gray-600 mt-1">{currentModule.description}</p>
              </div>
              {currentModule.component}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
