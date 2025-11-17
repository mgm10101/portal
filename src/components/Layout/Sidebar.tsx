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
  Menu,
  X,
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
  LogOut
} from 'lucide-react';
import logo from '../../assets/logo.png';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['financial']);
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
      icon: Home,
      children: []
    },
    {
      id: 'students',
      label: 'Students',
      icon: Users,
      children: [
        { id: 'masterlist', label: 'Masterlist', icon: Users },
        { id: 'assessments', label: 'Assessments', icon: FileText },
        { id: 'behaviour', label: 'Behaviour', icon: Star },
        { id: 'attendance', label: 'Attendance', icon: Calendar }
      ]
    },
    {
      id: 'financial',
      label: 'Financial',
      icon: TrendingUp,
      children: [
        { id: 'financial-home', label: 'Overview', icon: Home },
        { id: 'invoices', label: 'Invoices', icon: FileText },
        { id: 'payments', label: 'Received', icon: CreditCard },
        { id: 'expenses', label: 'Expenses', icon: TrendingUp }
      ]
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Box,
      children: [
        { id: 'inventory-list', label: 'Inventory List', icon: FileText },
        { id: 'requisition-records', label: 'Requisitions', icon: FileText },
        { id: 'asset-issuance', label: 'Asset Issuance', icon: FileText }
      ]
    },
    {
      id: 'library',
      label: 'Library',
      icon: Book,
      children: [
        { id: 'books-masterlist', label: 'Books Masterlist', icon: FileText },
        { id: 'borrowing-records', label: 'Borrowed', icon: FileText }
      ]
    },
    {
      id: 'hr',
      label: 'HR',
      icon: Users,
      children: [
        { id: 'staff-info', label: 'Staff Info', icon: Users },
        { id: 'payroll', label: 'Payroll', icon: DollarSign },
        { id: 'leave-management', label: 'Leave', icon: Calendar },
        { id: 'disciplinary', label: 'Disciplinary', icon: AlertCircle }
      ]
    },
    {
      id: 'custom-records',
      label: 'Custom Records',
      icon: Plus,
      children: []
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      children: []
    },
    {
      id: 'task-scheduler',
      label: 'Task Scheduler',
      icon: CalendarClock,
      children: []
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      children: [
        { id: 'user-management', label: 'User Management', icon: Users },
        { id: 'archive', label: 'Archive', icon: Archive },
        { id: 'delete', label: 'Delete', icon: Trash2 },
        { id: 'recycle-bin', label: 'Recycle Bin', icon: Trash },
        { id: 'reset-password', label: 'Reset Password', icon: Key },
        { id: 'activity-log', label: 'Activity Log', icon: Activity }
      ]
    }
  ];

  const SidebarContent = useMemo(() => (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <img
            src={logo}
            alt="MGM Academy Logo"
            className="w-[60px] sm:w-[66px] md:w-[72px] h-auto mr-3 rounded"
          />
          <div className="flex flex-col items-center justify-center leading-tight">
            <span className="text-xl font-bold text-gray-800">MGM</span>
            <span className="text-xl font-bold text-gray-800">Academy</span>
          </div>
        </div>
      </div>

      <nav ref={scrollRef} className="flex-1 overflow-y-auto py-4 scroll-smooth">
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

        <div className="px-4 mt-4 border-t border-gray-200">
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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <div className="hidden lg:block w-64 h-screen">
        {SidebarContent}
      </div>

      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black opacity-50" onClick={() => setIsOpen(false)} />
          <div className="relative w-64">
            {SidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
