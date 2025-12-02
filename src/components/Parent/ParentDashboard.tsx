import React, { useState } from 'react';
import { User, FileText, Star, DollarSign, CreditCard, Calendar, TrendingUp } from 'lucide-react';
import { Header } from '../Layout/Header';
import { ParentSidebar } from './ParentSidebar';
import { ParentHomework } from './ParentHomework';

interface ParentDashboardProps {
  onLogout: () => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({ onLogout }) => {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'homework'>('dashboard');

  // Mock student data for parent view
  const studentData = {
    name: 'John Smith',
    class: 'Grade 10',
    admissionNumber: 'ADM001',
    teamColor: 'Red',
    profilePicture: null
  };

  const assessmentData = [
    {
      subject: 'Mathematics',
      assessmentType: 'Mid-Term Exam',
      date: '2024-02-15',
      marks: '85/100',
      grade: 'A',
      remarks: 'Excellent performance'
    },
    {
      subject: 'English',
      assessmentType: 'Assignment',
      date: '2024-02-10',
      marks: '42/50',
      grade: 'B+',
      remarks: 'Good work'
    }
  ];

  const behaviorData = {
    currentStars: 4,
    maxStars: 5,
    weeklyAverage: 4.2,
    recentIncidents: [
      { date: '2024-02-05', offense: 'Late to class', starsLost: 1 }
    ]
  };

  const financialData = {
    totalFees: 1200,
    paidAmount: 800,
    outstandingAmount: 400,
    lastPayment: {
      amount: 400,
      date: '2024-01-15',
      method: 'Bank Transfer'
    }
  };

  const PaymentForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Record Payment</h2>
          <button
            onClick={() => setShowPaymentForm(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Transaction reference number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>Bank Transfer</option>
              <option>Mobile Money</option>
              <option>Cash</option>
              <option>Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Amount paid"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              defaultValue={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes about the payment..."
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowPaymentForm(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Submit Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const StarDisplay = ({ current, max }: { current: number; max: number }) => (
    <div className="flex">
      {Array.from({ length: max }).map((_, index) => (
        <Star
          key={index}
          className={`w-5 h-5 ${
            index < current ? 'text-yellow-500 fill-current' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      <ParentSidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={onLogout}
        onSectionChange={(section) => setActiveSection(section as 'dashboard' | 'homework')}
      />
      <main className="flex-1 overflow-y-auto scroll-smooth w-full">
        <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} username="Parent" />
        {activeSection === 'homework' ? (
          <ParentHomework />
        ) : (
        <div className="p-6 bg-gray-50 min-h-screen">
          <div className="max-w-7xl mx-auto">

        {/* Student Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Student Information</h3>
          <div className="flex items-center">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mr-4">
              <User className="w-8 h-8 text-gray-500" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-800">{studentData.name}</h4>
              <p className="text-gray-600">
                {studentData.class} • {studentData.admissionNumber}
              </p>
              <p className="text-sm text-gray-500">Team: {studentData.teamColor}</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Assessments</div>
                <div className="text-2xl font-bold text-gray-800">{assessmentData.length}</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Star className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Behavior Stars</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {behaviorData.currentStars}/{behaviorData.maxStars}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Fees Paid</div>
                <div className="text-2xl font-bold text-green-600">
                  ${financialData.paidAmount}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Outstanding</div>
                <div className="text-2xl font-bold text-red-600">
                  ${financialData.outstandingAmount}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Assessments */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Assessments</h3>
            <div className="space-y-4">
              {assessmentData.map((assessment, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-800">{assessment.subject}</h4>
                      <p className="text-sm text-gray-600">{assessment.assessmentType}</p>
                      <p className="text-xs text-gray-500">{assessment.date}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">{assessment.marks}</div>
                      <div className="text-sm font-semibold text-green-600">{assessment.grade}</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{assessment.remarks}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Behavior Report */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Behavior Report</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Current Week Stars</span>
                  <span className="text-sm text-gray-600">
                    {behaviorData.currentStars}/{behaviorData.maxStars}
                  </span>
                </div>
                <StarDisplay current={behaviorData.currentStars} max={behaviorData.maxStars} />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Weekly Average</span>
                  <span className="text-sm font-medium text-blue-600">
                    {behaviorData.weeklyAverage}/5.0
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${(behaviorData.weeklyAverage / 5) * 100}%` }}
                  ></div>
                </div>
              </div>

              {behaviorData.recentIncidents.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Incidents</h4>
                  {behaviorData.recentIncidents.map((incident, index) => (
                    <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      {incident.date}: {incident.offense} (-{incident.starsLost}★)
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Financial Information</h3>
            <button
              onClick={() => setShowPaymentForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Record Payment
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">${financialData.totalFees}</div>
              <div className="text-sm text-gray-600">Total Fees</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">${financialData.paidAmount}</div>
              <div className="text-sm text-gray-600">Amount Paid</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">${financialData.outstandingAmount}</div>
              <div className="text-sm text-gray-600">Outstanding</div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-700 mb-2">Last Payment</h4>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">
                  Amount: <span className="font-medium">${financialData.lastPayment.amount}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Method: <span className="font-medium">{financialData.lastPayment.method}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">{financialData.lastPayment.date}</p>
              </div>
            </div>
          </div>
        </div>

        {showPaymentForm && <PaymentForm />}
          </div>
        </div>
        )}
      </main>
    </div>
  );
};
