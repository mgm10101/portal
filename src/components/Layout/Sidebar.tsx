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

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange, isOpen, onClose }) => {
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
    // TODO: show confirmation modal → supabase.auth.signOut() → redirect to /login
  };

  const menuItems = [
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
        { id: 'medical', label: 'Medical', icon: HeartPulse }
      ]
    },
    {
      id: 'financial',
      label: 'Financials',
      icon: Wallet,
      children: [
        { id: 'financial-home', label: 'Overview', icon: BarChart3 },
        { id: 'invoices', label: 'Invoices', icon: DollarSign },
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
        { id: 'recycle-bin', label: 'Modules', icon: Layers },
        { id: 'reset-password', label: 'Security', icon: Key },
        { id: 'activity-log', label: 'Activity Log', icon: Activity }
      ]
    }
  ];

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
                  handleSectionChange(item.id);
                }
              }}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                activeSection === item.id
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
          <div className="mb-3 space-y-1 ml-3">
            <div className="flex items-center text-xs text-gray-500">
              <User className="w-4 h-4 mr-3" />
              <span>User: <span className="text-gray-600">Admin</span></span>
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <Shield className="w-4 h-4 mr-3" />
              <span>Role: <span className="text-gray-600">Superadmin</span></span>
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
  ), [expandedSections, activeSection]);

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
