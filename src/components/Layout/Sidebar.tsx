import React, { useState, useRef, useMemo } from 'react';
import {
  Home,
  Users,
  FileText,
  CreditCard,
  TrendingUp,
  Settings,
  ChevronDown,
  ChevronRight,
  Star,
  Plus,
  Calendar,
  DollarSign,
  AlertCircle,
  Book,
  Box,
  Archive,
  Trash2,
  Trash,
  Key,
  Activity,
  CalendarClock,
  LogOut,
  LayoutDashboard,
  GraduationCap,
  Wallet,
  BarChart3,
  Receipt,
  HandCoins,
  TrendingDown,
  ShoppingCart,
  Package,
  ClipboardCheck,
  PackageCheck,
  Send,
  Share2,
  UserPlus,
  Bed,
  Bus,
  CalendarDays,
  BookOpen,
  Clock,
  Wrench,
  FileEdit,
  ArrowRightCircle,
  BookMarked,
  Hand,
  BookCheck,
  Download,
  Upload,
  Layers,
  User,
  Shield,
  HeartPulse
} from 'lucide-react';
import { PaymentPlanIcon } from '../Icons/PaymentPlanIcon';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  username?: string;
  role?: string;
  selectedModules?: any; // Parsed selected_modules array
}

export const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange, isOpen, onClose, onLogout, username = 'Admin', role = 'Admin', selectedModules = null }) => {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const handleSectionChange = (section: string) => {
    onSectionChange(section);
  };

  const handleLogout = () => {
    onLogout();
  };

  // Helper to convert sidebar ID to module name format
  const sidebarIdToModuleName = (sidebarId: string): string => {
    const mapping: Record<string, string> = {
      'dashboard': 'Dashboard',
      'students': 'Students',
      'financial': 'Financials',
      'inventory': 'Procurement',
      'hr': 'HR',
      'programs': 'Programs',
      'tasks': 'Tasks',
      'library': 'Library',
      'custom-records': 'Custom Records',
      'leads': 'Leads',
      'reports': 'Reports',
      'settings': 'Settings'
    };
    return mapping[sidebarId] || sidebarId.charAt(0).toUpperCase() + sidebarId.slice(1);
  };

  // Check if user has access to a module/submodule
  const hasModuleAccess = (moduleId: string, submoduleId?: string): boolean => {
    // If no selectedModules, allow all (for backward compatibility)
    if (!selectedModules || !Array.isArray(selectedModules)) {
      return true;
    }
    
    // Convert sidebar ID to module name format
    const moduleName = sidebarIdToModuleName(moduleId);
    
    // Check if module or submodule is in selectedModules
    const hasDirectAccess = selectedModules.some((m: any) => {
      if (submoduleId) {
        // Check for submodule access - try multiple formats
        // Map sidebar submodule IDs to database submodule IDs
        const submoduleIdFormatted = 
          submoduleId === 'financial-home' ? 'overview' : 
          submoduleId === 'leave-management' ? 'leave' :
          submoduleId === 'inventory-list' ? 'inventory' :
          submoduleId === 'requisition-records' ? 'requisitions' :
          submoduleId === 'behaviour' ? 'disciplinary' :
          submoduleId;
        return (
          m.id === `submodule-${moduleName}-${submoduleIdFormatted}` ||
          m.id === `submodule-${moduleName}-${submoduleId}` ||
          m.id === submoduleId ||
          m.id === submoduleIdFormatted ||
          (m.module === moduleName && m.submoduleId === submoduleIdFormatted) ||
          (m.module === moduleName && m.submoduleId === submoduleId)
        );
      } else {
        // Check for module access - try multiple formats
        // IMPORTANT: Only grant module access if the parent module itself is selected
        // NOT if just a submodule is selected (granular control)
        return (
          m.id === `module-${moduleName}` ||
          m.id === `module-${moduleId}` ||
          (m.module === moduleName && !m.isSubmodule) ||
          (m.module === moduleId && !m.isSubmodule) ||
          (m.label === moduleName && !m.isSubmodule) ||
          (m.label === moduleId && !m.isSubmodule)
        );
      }
    });
    
    // REMOVED: No longer grant all submodules if parent module is selected
    // Users must explicitly select each submodule for granular control
    return hasDirectAccess;
  };

  const allMenuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      children: []
    },
    {
      id: 'students',
      label: 'Students',
      icon: GraduationCap,
      children: [
        { id: 'masterlist', label: 'Masterlist', icon: Users },
        { id: 'assessments', label: 'Assessments', icon: FileText },
        { id: 'behaviour', label: 'Disciplinary', icon: Star },
        { id: 'attendance', label: 'Attendance', icon: Calendar },
        { id: 'transport', label: 'Transport', icon: Bus },
        { id: 'boarding', label: 'Boarding', icon: Bed },
        { id: 'medical', label: 'Medical', icon: HeartPulse },
        { id: 'homework', label: 'Homework', icon: BookOpen }
      ]
    },
    {
      id: 'financial',
      label: 'Financials',
      icon: Wallet,
      children: [
        { id: 'invoices', label: 'Invoices', icon: DollarSign },
        { id: 'payment-plans', label: 'Payment Plans', icon: CalendarClock },
        { id: 'fee-structure', label: 'Fee Structure', icon: FileText },
        { id: 'payments', label: 'Received', icon: Receipt },
        { id: 'expenses', label: 'Expenses', icon: TrendingDown },
        { id: 'payroll', label: 'Payroll', icon: HandCoins }
      ]
    },
    {
      id: 'inventory',
      label: 'Procurement',
      icon: ShoppingCart,
      children: [
        { id: 'inventory-list', label: 'Inventory', icon: Package },
        { id: 'requisition-records', label: 'Requisitions', icon: ClipboardCheck },
        { id: 'repair-requests', label: 'Repair Requests', icon: Wrench },
        { id: 'asset-issuance', label: 'Asset Issuance', icon: Share2 },
        { id: 'budgets', label: 'Budgets', icon: Wallet }
      ]
    },
    {
      id: 'hr',
      label: 'HR',
      icon: Users,
      children: [
        { id: 'staff-info', label: 'Staff Info', icon: Users },
        { id: 'leave-management', label: 'Leave', icon: Calendar },
        { id: 'disciplinary', label: 'Disciplinary', icon: AlertCircle },
        { id: 'performance', label: 'Performance', icon: TrendingUp }
      ]
    },
    {
      id: 'programs',
      label: 'Programs',
      icon: Calendar,
      children: [
        { id: 'school-calendar', label: 'School Calendar', icon: CalendarDays },
        { id: 'lesson-plans', label: 'Lesson Plans', icon: BookOpen },
        { id: 'shifts', label: 'Shifts', icon: Clock },
        { id: 'schedules', label: 'Schedules', icon: CalendarClock }
      ]
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: CalendarClock,
      children: []
    },
    {
      id: 'library',
      label: 'Library',
      icon: BookOpen,
      children: [
        { id: 'books-masterlist', label: 'Books Masterlist', icon: BookMarked },
        { id: 'borrowing-records', label: 'Borrowed', icon: BookCheck }
      ]
    },
    {
      id: 'custom-records',
      label: 'Custom Records',
      icon: FileEdit,
      children: []
    },
    {
      id: 'leads',
      label: 'Leads',
      icon: UserPlus,
      children: []
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      children: []
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      children: [
        { id: 'user-management', label: 'User Management', icon: Users },
        { id: 'archive', label: 'Import Data', icon: Download },
        { id: 'delete', label: 'Export Data', icon: Upload },
        { id: 'activity-log', label: 'Activity Log', icon: Activity }
      ]
    }
  ];

  // Filter menu items based on user's selected_modules
  // Dashboard is always shown (but will route to custom-dashboard if no access)
  const menuItems = selectedModules && Array.isArray(selectedModules) 
    ? allMenuItems.filter(item => {
        // Always show dashboard
        if (item.id === 'dashboard') return true;
        // Check if user has access to this module or any of its submodules
        // Each submodule must be explicitly selected - no parent module grants all submodules
        return hasModuleAccess(item.id) || (item.children && item.children.some((child: any) => hasModuleAccess(item.id, child.id)));
      }).map(item => {
        // Filter children based on access
        // Each submodule must be explicitly selected - no parent module grants all submodules
        if (item.children && item.children.length > 0) {
          return {
            ...item,
            children: item.children.filter((child: any) => hasModuleAccess(item.id, child.id))
          };
        }
        return item;
      })
    : allMenuItems;

  const SidebarContent = useMemo(() => (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col">
      <nav ref={scrollRef} className="flex-1 overflow-y-auto py-4 scroll-smooth scrollbar-hide scrollbar-show-on-hover">
        {menuItems.map(item => (
          <div key={item.id} className="px-4 mb-2">
            <button
              onClick={() => {
                if (item.children.length > 0) {
                  toggleSection(item.id);
                } else {
                  // Special handling for dashboard - route to custom-dashboard if no access
                  if (item.id === 'dashboard') {
                    const hasDashboardAccess = hasModuleAccess('dashboard');
                    handleSectionChange(hasDashboardAccess ? 'dashboard' : 'custom-dashboard');
                  } else {
                    handleSectionChange(item.id);
                  }
                }
              }}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                activeSection === item.id || (item.id === 'dashboard' && activeSection === 'custom-dashboard')
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <item.icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{item.label}</span>
              </div>
              {item.children.length > 0 && (
                expandedSections.includes(item.id)
                  ? <ChevronDown className="w-4 h-4" />
                  : <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {item.children.length > 0 && expandedSections.includes(item.id) && (
              <div className="ml-8 mt-2 space-y-1">
                {item.children.map(child => (
                  <button
                    key={child.id}
                    onClick={() => handleSectionChange(child.id)}
                    className={`w-full flex items-center p-2 rounded-lg transition-colors ${
                      activeSection === child.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <child.icon className="w-4 h-4 mr-3" />
                    <span>{child.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="px-4 mt-4 border-t border-gray-200 pt-3">
          <div className="mb-3 bg-blue-50 rounded-lg p-3 border border-blue-100">
            <div className="space-y-2">
              <div className="flex items-center text-xs text-gray-700">
                <User className="w-4 h-4 mr-3 text-blue-600" />
                <span>User: <span className="text-gray-800 font-medium">{username}</span></span>
              </div>
              <div className="flex items-center text-xs text-gray-700">
                <Shield className="w-4 h-4 mr-3 text-blue-600" />
                <span>Role: <span className="text-gray-800 font-medium">{role}</span></span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center p-3 rounded-lg transition-colors text-gray-600 hover:bg-gray-50"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-medium">Log Out</span>
          </button>
        </div>
      </nav>
    </div>
        ), [expandedSections, activeSection, username, role, selectedModules]);

  return (
    <>
      <div 
        className={`fixed inset-0 z-[60] flex transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop overlay */}
        <div 
          className="absolute inset-0 bg-black opacity-30" 
          onClick={onClose}
        />
        {/* Sidebar with shadow */}
        <div 
          className={`relative w-64 h-full bg-white transform transition-transform duration-300 ease-in-out shadow-2xl ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {SidebarContent}
        </div>
      </div>
    </>
  );
};
