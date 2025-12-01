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
import { CustomDashboard } from './components/CustomDashboard';
import { supabase } from './supabaseClient';

interface UserInfo {
  email: string;
  type: 'admin' | 'parent';
  role?: string | null;
  selectedModules?: any; // Parsed selected_modules from database
  username?: string | null;
  description?: string | null;
}

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const mainRef = useRef<HTMLDivElement>(null);

  const handleLogin = async (email: string, userType: 'admin' | 'parent') => {
    // Fetch user details from users table
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('email, role, selected_modules, username, description')
          .eq('id', authUser.id)
          .single();
        
        if (!error && userData) {
          // Parse selected_modules if it's a JSON string
          let parsedModules = null;
          if (userData.selected_modules) {
            try {
              parsedModules = typeof userData.selected_modules === 'string'
                ? JSON.parse(userData.selected_modules)
                : userData.selected_modules;
            } catch (err) {
              console.error('Error parsing selected_modules:', err);
            }
          }
          
          // Check if user has Dashboard access
          const hasDashboardAccess = parsedModules && Array.isArray(parsedModules) 
            ? parsedModules.some((m: any) => 
                m.id === 'module-Dashboard' || 
                m.module === 'Dashboard' || 
                m.label === 'Dashboard'
              )
            : false;
          
          // Set initial section based on Dashboard access
          if (!hasDashboardAccess) {
            setActiveSection('custom-dashboard');
          } else {
            setActiveSection('dashboard');
          }
          
          setUser({ 
            email: userData.email || email, // Use email from users table, fallback to passed email
            type: userType,
            role: userData.role || 'Admin', // Fallback to 'Admin' if no role
            selectedModules: parsedModules,
            username: userData.username || null,
            description: userData.description || null
          });
        } else {
          // Fallback if user not found in users table
          setActiveSection('custom-dashboard');
          setUser({ 
            email, 
            type: userType,
            role: 'Admin',
            selectedModules: null,
            username: null,
            description: null
          });
        }
      } else {
        setActiveSection('custom-dashboard');
        setUser({ email, type: userType, role: 'Admin', selectedModules: null, username: null, description: null });
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
      // Fallback on error
      setActiveSection('custom-dashboard');
      setUser({ email, type: userType, role: 'Admin', selectedModules: null, username: null, description: null });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setActiveSection('dashboard');
  };

  // Function to refresh current user's data (for when modules are updated)
  const refreshCurrentUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser && user) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('email, role, selected_modules, username, description')
          .eq('id', authUser.id)
          .single();
        
        if (!error && userData) {
          // Parse selected_modules if it's a JSON string
          let parsedModules = null;
          if (userData.selected_modules) {
            try {
              parsedModules = typeof userData.selected_modules === 'string'
                ? JSON.parse(userData.selected_modules)
                : userData.selected_modules;
            } catch (err) {
              console.error('Error parsing selected_modules:', err);
            }
          }
          
          // Check if user has Dashboard access
          const hasDashboardAccess = parsedModules && Array.isArray(parsedModules) 
            ? parsedModules.some((m: any) => 
                m.id === 'module-Dashboard' || 
                m.module === 'Dashboard' || 
                m.label === 'Dashboard'
              )
            : false;
          
          // If user was on custom-dashboard and now has dashboard access, switch to dashboard
          if (activeSection === 'custom-dashboard' && hasDashboardAccess) {
            setActiveSection('dashboard');
          }
          // If user was on dashboard and lost access, switch to custom-dashboard
          else if (activeSection === 'dashboard' && !hasDashboardAccess) {
            setActiveSection('custom-dashboard');
          }
          
          setUser({ 
            email: userData.email || user.email,
            type: user.type,
            role: userData.role || 'Admin',
            selectedModules: parsedModules,
            username: userData.username || null,
            description: userData.description || null
          });
        }
      }
    } catch (err) {
      console.error('Error refreshing user data:', err);
    }
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

  // SIMPLEST: Don't auto-login, only listen for new logins
  useEffect(() => {
    setIsLoading(false);
    
    // Only listen for auth changes (when user logs in through form)
    // NOTE: We don't set user here if password change is required - Login component handles that
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // Don't set user immediately - let Login component handle password change check
        // Login component will call onLogin only after password change is complete (if needed)
        // This prevents Login from unmounting prematurely
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show loading state while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login onLogin={handleLogin} />;
  if (user.type === 'parent') return <ParentDashboard onLogout={handleLogout} />;

  // Check if user has Dashboard access
  const hasDashboardAccess = () => {
    if (!user?.selectedModules || !Array.isArray(user.selectedModules)) {
      return false;
    }
    return user.selectedModules.some((m: any) => 
      m.id === 'module-Dashboard' || 
      m.module === 'Dashboard' || 
      m.label === 'Dashboard'
    );
  };

  const renderContent = () => {
    // If trying to access dashboard but don't have access, show custom dashboard
    if (activeSection === 'dashboard' && !hasDashboardAccess()) {
      return (
        <CustomDashboard 
          onSectionChange={handleSectionChange}
          userEmail={user?.email || 'User'}
          userRole={user?.role || 'User'}
          selectedModules={user?.selectedModules || null}
          username={user?.username || null}
          description={user?.description || null}
        />
      );
    }

    switch (activeSection) {
      case 'dashboard': return <Dashboard onSectionChange={handleSectionChange} />;
      case 'custom-dashboard': return (
        <CustomDashboard 
          onSectionChange={handleSectionChange}
          userEmail={user?.email || 'User'}
          userRole={user?.role || 'User'}
          selectedModules={user?.selectedModules || null}
          username={user?.username || null}
          description={user?.description || null}
        />
      );
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
            case 'user-management': return <UserManagement onUserUpdate={refreshCurrentUser} />;
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
      default: 
        // If no dashboard access, show custom dashboard, otherwise show regular dashboard
        if (!hasDashboardAccess()) {
          return (
            <CustomDashboard 
              onSectionChange={handleSectionChange}
              userEmail={user?.email || 'User'}
              userRole={user?.role || 'User'}
              selectedModules={user?.selectedModules || null}
              username={user?.username || null}
              description={user?.description || null}
            />
          );
        }
        return <Dashboard onSectionChange={handleSectionChange} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Header 
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
        username={user?.email || 'Admin'}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          activeSection={activeSection} 
          onSectionChange={handleSectionChange}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onLogout={handleLogout}
          username={user?.email || 'Admin'}
          role={user?.role || 'Admin'}
          selectedModules={user?.selectedModules || null}
        />
        <IconSidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          isMainSidebarOpen={isSidebarOpen}
          onLogout={handleLogout}
          selectedModules={user?.selectedModules || null}
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
