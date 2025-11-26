import React, { useState, useEffect, useRef } from 'react';
import {
  Home,
  Users,
  FileText,
  CreditCard,
  TrendingUp,
  Settings,
  Star,
  Plus,
  Calendar,
  DollarSign,
  AlertCircle,
  Book,
  Box,
  CalendarClock,
  LogOut,
  LayoutDashboard,
  GraduationCap,
  Wallet,
  ShoppingCart,
  UserPlus,
  Bed,
  Bus,
  FileEdit,
  BookOpen,
  BarChart3,
  Receipt,
  HandCoins,
  TrendingDown,
  Package,
  ClipboardCheck,
  Share2,
  Wrench,
  BookMarked,
  BookCheck,
  Clock,
  CalendarDays,
  Download,
  Upload,
  Layers,
  Key,
  Activity,
  HeartPulse
} from 'lucide-react';

interface IconSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isMainSidebarOpen: boolean;
}

export const IconSidebar: React.FC<IconSidebarProps> = ({ 
  activeSection, 
  onSectionChange, 
  isMainSidebarOpen 
}) => {
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  const sidebarRef = useRef<HTMLElement>(null);

  const handleLogout = () => {
    // TODO: show confirmation modal → supabase.auth.signOut() → redirect to /login
    onSectionChange('logout');
  };

  // Map parent sections to their children with icons
  const parentChildrenMap: Record<string, Array<{ id: string; icon: any }>> = {
    'students': [
      { id: 'masterlist', icon: Users },
      { id: 'assessments', icon: FileText },
      { id: 'behaviour', icon: Star },
      { id: 'attendance', icon: Calendar },
      { id: 'transport', icon: Bus },
      { id: 'boarding', icon: Bed },
      { id: 'medical', icon: HeartPulse }
    ],
    'financial': [
      { id: 'financial-home', icon: BarChart3 },
      { id: 'invoices', icon: DollarSign },
      { id: 'fee-structure', icon: FileText },
      { id: 'payments', icon: Receipt },
      { id: 'expenses', icon: TrendingDown },
      { id: 'payroll', icon: HandCoins }
    ],
    'inventory': [
      { id: 'inventory-list', icon: Package },
      { id: 'requisition-records', icon: ClipboardCheck },
      { id: 'repair-requests', icon: Wrench },
      { id: 'asset-issuance', icon: Share2 },
      { id: 'budgets', icon: Wallet }
    ],
    'library': [
      { id: 'books-masterlist', icon: BookMarked },
      { id: 'borrowing-records', icon: BookCheck }
    ],
    'hr': [
      { id: 'staff-info', icon: Users },
      { id: 'leave-management', icon: Calendar },
      { id: 'disciplinary', icon: AlertCircle },
      { id: 'performance', icon: TrendingUp }
    ],
    'programs': [
      { id: 'school-calendar', icon: CalendarDays },
      { id: 'lesson-plans', icon: BookOpen },
      { id: 'shifts', icon: Clock },
      { id: 'schedules', icon: CalendarClock }
    ],
    'settings': [
      { id: 'user-management', icon: Users },
      { id: 'archive', icon: Download },
      { id: 'delete', icon: Upload },
      { id: 'recycle-bin', icon: Layers },
      { id: 'reset-password', icon: Key },
      { id: 'activity-log', icon: Activity }
    ]
  };

  const menuItems = [
    {
      id: 'dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'students',
      icon: GraduationCap,
    },
    {
      id: 'financial',
      icon: Wallet,
    },
    {
      id: 'inventory',
      icon: ShoppingCart,
    },
    {
      id: 'hr',
      icon: Users,
    },
    {
      id: 'programs',
      icon: Calendar,
    },
    {
      id: 'tasks',
      icon: CalendarClock,
    },
    {
      id: 'library',
      icon: BookOpen,
    },
    {
      id: 'custom-records',
      icon: FileEdit,
    },
    {
      id: 'leads',
      icon: UserPlus,
    },
    {
      id: 'reports',
      icon: FileText,
    },
    {
      id: 'settings',
      icon: Settings,
    }
  ];

  // Check if a parent section is active (for sections with children)
  const isParentActive = (parentId: string) => {
    const parentChildMap: Record<string, string[]> = {
      'students': ['masterlist', 'assessments', 'behaviour', 'attendance', 'transport', 'boarding', 'medical'],
      'financial': ['financial-home', 'invoices', 'fee-structure', 'payments', 'expenses', 'payroll'],
      'inventory': ['inventory-list', 'requisition-records', 'repair-requests', 'asset-issuance', 'budgets'],
      'library': ['books-masterlist', 'borrowing-records'],
      'hr': ['staff-info', 'leave-management', 'disciplinary', 'performance'],
      'programs': ['school-calendar', 'lesson-plans', 'shifts', 'schedules'],
      'settings': ['user-management', 'archive', 'delete', 'recycle-bin', 'reset-password', 'activity-log']
    };
    return parentChildMap[parentId]?.includes(activeSection) || false;
  };

  const toggleParent = (parentId: string) => {
    setExpandedParents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(parentId)) {
        newSet.delete(parentId);
      } else {
        newSet.add(parentId);
      }
      return newSet;
    });
  };

  const handleIconClick = (itemId: string) => {
    // If it's a parent with children, toggle expansion, otherwise navigate to the item itself
    if (parentChildrenMap[itemId]) {
      toggleParent(itemId);
    } else {
      onSectionChange(itemId);
    }
  };

  const handleChildClick = (childId: string, parentId: string) => {
    onSectionChange(childId);
    // Collapse the parent after clicking a child
    setExpandedParents(prev => {
      const newSet = new Set(prev);
      newSet.delete(parentId);
      return newSet;
    });
  };

  // Close expanded parents when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setExpandedParents(new Set());
      }
    };

    if (expandedParents.size > 0) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [expandedParents]);

  if (isMainSidebarOpen) {
    return null;
  }

  return (
    <aside ref={sidebarRef} className="hidden md:flex fixed left-0 top-16 bottom-0 w-12 bg-white border-r border-gray-200 z-40 flex-col">
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        <div className="flex flex-col items-center space-y-2">
          {menuItems.map(item => {
            const isActive = activeSection === item.id || isParentActive(item.id);
            const isExpanded = expandedParents.has(item.id);
            const hasChildren = parentChildrenMap[item.id] !== undefined;

            return (
              <div key={item.id} className="flex flex-col items-center w-full">
                <button
                  onClick={() => handleIconClick(item.id)}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 hover:scale-125 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  } ${isExpanded ? 'bg-blue-100' : ''}`}
                  title={item.id.charAt(0).toUpperCase() + item.id.slice(1).replace(/-/g, ' ')}
                  aria-label={item.id}
                >
                  <item.icon className="w-5 h-5 transition-transform duration-200" />
                </button>
                
                {/* Show child icons when parent is expanded */}
                {hasChildren && isExpanded && (
                  <div 
                    className="flex flex-col items-center space-y-1 mt-2 ml-2 border-l-2 border-gray-300 pl-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {parentChildrenMap[item.id].map(child => {
                      const isChildActive = activeSection === child.id;
                      const ChildIcon = child.icon;
                      return (
                        <button
                          key={child.id}
                          onClick={() => handleChildClick(child.id, item.id)}
                          className={`w-8 h-8 flex items-center justify-center rounded transition-all duration-200 hover:scale-125 ${
                            isChildActive
                              ? 'bg-blue-100 text-blue-600'
                              : 'text-gray-500 hover:bg-gray-100'
                          }`}
                          title={child.id.charAt(0).toUpperCase() + child.id.slice(1).replace(/-/g, ' ')}
                          aria-label={child.id}
                        >
                          <ChildIcon className="w-4 h-4 transition-transform duration-200" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>
      
      <div className="border-t border-gray-200 py-4">
        <div className="flex flex-col items-center">
          <button
            onClick={handleLogout}
            className="w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 hover:scale-125 text-gray-600 hover:bg-gray-50"
            title="Log Out"
            aria-label="Log Out"
          >
            <LogOut className="w-5 h-5 transition-transform duration-200" />
          </button>
        </div>
      </div>
    </aside>
  );
};

