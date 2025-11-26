// src/App.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Login } from './components/Login';
import { ParentDashboard } from './components/Parent/ParentDashboard';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { IconSidebar } from './components/Layout/IconSidebar';
import { Dashboard } from './components/Dashboard';
import { Boarding } from './components/Boarding';
import { Transport } from './components/Transport';
import { Leads } from './components/Leads';
import { FinancialHome } from './components/Financial/FinancialHome';
import { FeeStructure } from './components/Financial/FeeStructure';
import { Masterlist } from './components/Students/masterlist';
import { Assessments } from './components/Students/Assessments';
import { Behaviour } from './components/Students/Behaviour';
import { Attendance } from './components/Students/Attendance';
import { MedicalContainer } from './components/Students/Medical/MedicalContainer';
import { Invoices } from './components/Financial/Invoices'; // ✅ Works with index.tsx
import { PaymentsReceived } from './components/Financial/PaymentsReceived';
import { Expenses } from './components/Financial/Expenses';
import { InventoryList } from './components/Inventory/InventoryList';
import { RequisitionRecords } from './components/Inventory/RequisitionRecords';
import { UsageTracking } from './components/Inventory/UsageTracking';
import { AssetIssuance } from './components/Inventory/AssetIssuance';
import { Budgets } from './components/Inventory/Budgets';
import { RepairRequests } from './components/Inventory/RepairRequests';
import { BooksMasterlist } from './components/Library/BooksMasterlist';
import { BorrowingRecords } from './components/Library/BorrowingRecords';
import { StaffInfo } from './components/HR/StaffInfo';
import { Payroll } from './components/HR/Payroll';
import { LeaveManagement } from './components/HR/LeaveManagement';
import { Disciplinary } from './components/HR/Disciplinary';
import { Performance } from './components/HR/Performance';
import { ReportBuilder } from './components/ReportBuilder';
import { UserManagement } from './components/UserManagement';
import { CustomRecords } from './components/CustomRecords';
import { TaskScheduler } from './components/TaskScheduler';
import { SchoolCalendar } from './components/Programs/SchoolCalendar';
import { LessonPlans } from './components/Programs/LessonPlans';
import { Shifts } from './components/Programs/Shifts';
import { Schedules } from './components/Programs/Schedules';
import { UnderConstruction } from './components/UnderConstruction';

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [user, setUser] = useState<{ email: string; type: 'admin' | 'parent' } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  const handleLogin = (email: string, userType: 'admin' | 'parent') => {
    setUser({ email, type: userType });
  };

  const handleLogout = () => {
    setUser(null);
    setActiveSection('dashboard');
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    setIsSidebarOpen(false); // Close sidebar when section is selected
  };

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [activeSection]);

  if (!user) return <Login onLogin={handleLogin} />;
  if (user.type === 'parent') return <ParentDashboard onLogout={handleLogout} />;

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return <Dashboard onSectionChange={handleSectionChange} />;
      case 'boarding': return <Boarding />;
      case 'transport': return <Transport />;
      case 'leads': return <Leads />;
      case 'masterlist': return <Masterlist />;
      case 'assessments': return <Assessments />;
      case 'behaviour': return <Behaviour />;
      case 'attendance': return <Attendance />;
      case 'medical': return <MedicalContainer />;
      case 'financial-home': return <FinancialHome />;
      case 'invoices': return <Invoices />; // ✅ Fixed to work with index.tsx
      case 'fee-structure': return <FeeStructure />;
      case 'payments': return <PaymentsReceived />;
      case 'expenses': return <Expenses />;
      case 'inventory-list': return <InventoryList />;
      case 'requisition-records': return <RequisitionRecords />;
      case 'usage-tracking': return <UsageTracking />;
      case 'asset-issuance': return <AssetIssuance />;
      case 'budgets': return <Budgets />;
      case 'repair-requests': return <RepairRequests />;
      case 'books-masterlist': return <BooksMasterlist />;
      case 'borrowing-records': return <BorrowingRecords />;
      case 'staff-info': return <StaffInfo />;
      case 'payroll': return <Payroll />;
      case 'leave-management': return <LeaveManagement />;
      case 'disciplinary': return <Disciplinary />;
      case 'performance': return <Performance />;
      case 'reports': return <ReportBuilder />;
      case 'custom-records': return <CustomRecords />;
      case 'tasks': return <TaskScheduler />;
      case 'school-calendar': return <SchoolCalendar />;
      case 'lesson-plans': return <LessonPlans />;
      case 'shifts': return <Shifts />;
      case 'schedules': return <Schedules />;
      case 'user-management': return <UserManagement />;
      case 'archive': return <UnderConstruction />; // Import Data
      case 'delete': return <UnderConstruction />; // Export Data
      case 'recycle-bin': return <UnderConstruction />; // Modules
      case 'reset-password': return <UnderConstruction />; // Security
      case 'logout':
        handleLogout();
        return null;
      case 'delete-data':
        return (
          <div className="p-6 md:p-3 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Delete Data</h1>
              <p className="text-gray-600">Clear data for specific sections or the whole database</p>
              <div className="mt-8 md:mt-4 bg-white p-8 md:p-4 rounded-lg shadow-sm border border-gray-200">
                <p className="text-gray-500">Data deletion interface - use with caution</p>
              </div>
            </div>
          </div>
        );
      default: return <Dashboard onSectionChange={handleSectionChange} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          activeSection={activeSection} 
          onSectionChange={handleSectionChange}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <IconSidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          isMainSidebarOpen={isSidebarOpen}
        />
        <main 
          ref={mainRef} 
          className={`flex-1 overflow-y-auto scroll-smooth transition-all duration-300 ${
            !isSidebarOpen ? 'md:ml-12' : ''
          }`}
        >
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
