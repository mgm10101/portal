// src/App.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Login } from './components/Login';
import { ParentDashboard } from './components/Parent/ParentDashboard';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Dashboard';
import { FinancialHome } from './components/Financial/FinancialHome';
import { Masterlist } from './components/Students/masterlist';
import { Assessments } from './components/Students/Assessments';
import { Behaviour } from './components/Students/Behaviour';
import { Attendance } from './components/Students/Attendance';
import { Invoices } from './components/Financial/Invoices'; // ✅ Works with index.tsx
import { PaymentsReceived } from './components/Financial/PaymentsReceived';
import { Expenses } from './components/Financial/Expenses';
import { InventoryList } from './components/Inventory/InventoryList';
import { RequisitionRecords } from './components/Inventory/RequisitionRecords';
import { UsageTracking } from './components/Inventory/UsageTracking';
import { AssetIssuance } from './components/Inventory/AssetIssuance';
import { BooksMasterlist } from './components/Library/BooksMasterlist';
import { BorrowingRecords } from './components/Library/BorrowingRecords';
import { StaffInfo } from './components/HR/StaffInfo';
import { Payroll } from './components/HR/Payroll';
import { LeaveManagement } from './components/HR/LeaveManagement';
import { Disciplinary } from './components/HR/Disciplinary';
import { ReportBuilder } from './components/ReportBuilder';
import { UserManagement } from './components/UserManagement';
import { CustomRecords } from './components/CustomRecords';

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [user, setUser] = useState<{ email: string; type: 'admin' | 'parent' } | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  const handleLogin = (email: string, userType: 'admin' | 'parent') => {
    setUser({ email, type: userType });
  };

  const handleLogout = () => {
    setUser(null);
    setActiveSection('dashboard');
  };

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [activeSection]);

  if (!user) return <Login onLogin={handleLogin} />;
  if (user.type === 'parent') return <ParentDashboard />;

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return <Dashboard />;
      case 'masterlist': return <Masterlist />;
      case 'assessments': return <Assessments />;
      case 'behaviour': return <Behaviour />;
      case 'attendance': return <Attendance />;
      case 'financial-home': return <FinancialHome />;
      case 'invoices': return <Invoices />; // ✅ Fixed to work with index.tsx
      case 'payments': return <PaymentsReceived />;
      case 'expenses': return <Expenses />;
      case 'inventory-list': return <InventoryList />;
      case 'requisition-records': return <RequisitionRecords />;
      case 'usage-tracking': return <UsageTracking />;
      case 'asset-issuance': return <AssetIssuance />;
      case 'books-masterlist': return <BooksMasterlist />;
      case 'borrowing-records': return <BorrowingRecords />;
      case 'staff-info': return <StaffInfo />;
      case 'payroll': return <Payroll />;
      case 'leave-management': return <LeaveManagement />;
      case 'disciplinary': return <Disciplinary />;
      case 'reports': return <ReportBuilder />;
      case 'custom-records': return <CustomRecords />;
      case 'user-management': return <UserManagement />;
      case 'logout':
        handleLogout();
        return null;
      case 'delete-data':
        return (
          <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Delete Data</h1>
              <p className="text-gray-600">Clear data for specific sections or the whole database</p>
              <div className="mt-8 bg-white p-8 rounded-lg shadow-sm border border-gray-200">
                <p className="text-gray-500">Data deletion interface - use with caution</p>
              </div>
            </div>
          </div>
        );
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main ref={mainRef} className="flex-1 overflow-y-auto scroll-smooth">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
