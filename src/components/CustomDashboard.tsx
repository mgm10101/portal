import React from 'react';
import { 
  User, Mail, FileText, Shield, 
  Users, DollarSign, Star, Calendar, Bus, Bed, HeartPulse,
  BarChart3, Receipt, HandCoins, TrendingDown,
  Package, ClipboardCheck, Wrench, Share2, Wallet,
  CalendarDays, BookOpen, Clock, CalendarClock,
  BookMarked, BookCheck, AlertCircle, TrendingUp,
  FileEdit, UserPlus, Settings, Download, Upload, Layers, Key, Activity
} from 'lucide-react';

interface CustomDashboardProps {
  onSectionChange: (section: string) => void;
  userEmail?: string;
  userRole?: string;
  selectedModules?: any;
  username?: string;
  description?: string;
}

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
const hasModuleAccess = (moduleId: string, submoduleId: string | undefined, selectedModules: any[]): boolean => {
  if (!selectedModules || !Array.isArray(selectedModules)) {
    return false;
  }
  
  const moduleName = sidebarIdToModuleName(moduleId);
  
  const hasDirectAccess = selectedModules.some((m: any) => {
    if (submoduleId) {
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
      return (
        m.id === `module-${moduleName}` ||
        m.id === `module-${moduleId}` ||
        m.module === moduleName ||
        m.module === moduleId ||
        m.label === moduleName ||
        m.label === moduleId
      );
    }
  });
  
  // REMOVED: No longer grant all submodules if parent module is selected
  // Users must explicitly select each submodule for granular control
  return hasDirectAccess;
};

// Module/submodule to action mapping
const getActionConfig = (moduleId: string, submoduleId?: string) => {
  const actionMap: Record<string, { label: string; icon: any; hoverColor: string; iconColor: string }> = {
    // Students submodules
    'masterlist': { label: 'View Masterlist', icon: Users, hoverColor: 'hover:bg-blue-50 hover:border-blue-300', iconColor: 'text-blue-600' },
    'assessments': { label: 'Manage Assessments', icon: FileText, hoverColor: 'hover:bg-purple-50 hover:border-purple-300', iconColor: 'text-purple-600' },
    'behaviour': { label: 'Record Disciplinary', icon: Star, hoverColor: 'hover:bg-orange-50 hover:border-orange-300', iconColor: 'text-orange-600' },
    'attendance': { label: 'Record Attendance', icon: Calendar, hoverColor: 'hover:bg-green-50 hover:border-green-300', iconColor: 'text-green-600' },
    'transport': { label: 'Manage Transport', icon: Bus, hoverColor: 'hover:bg-yellow-50 hover:border-yellow-300', iconColor: 'text-yellow-600' },
    'boarding': { label: 'Manage Boarding', icon: Bed, hoverColor: 'hover:bg-indigo-50 hover:border-indigo-300', iconColor: 'text-indigo-600' },
    'medical': { label: 'Record Medical', icon: HeartPulse, hoverColor: 'hover:bg-pink-50 hover:border-pink-300', iconColor: 'text-pink-600' },
    'homework': { label: 'Manage Homework', icon: BookOpen, hoverColor: 'hover:bg-teal-50 hover:border-teal-300', iconColor: 'text-teal-600' },
    // Financials submodules
    'invoices': { label: 'Create Invoice', icon: DollarSign, hoverColor: 'hover:bg-green-50 hover:border-green-300', iconColor: 'text-green-600' },
    'fee-structure': { label: 'Manage Fee Structure', icon: FileText, hoverColor: 'hover:bg-teal-50 hover:border-teal-300', iconColor: 'text-teal-600' },
    'payments': { label: 'Record Payment', icon: Receipt, hoverColor: 'hover:bg-emerald-50 hover:border-emerald-300', iconColor: 'text-emerald-600' },
    'expenses': { label: 'Record Expense', icon: TrendingDown, hoverColor: 'hover:bg-red-50 hover:border-red-300', iconColor: 'text-red-600' },
    'payroll': { label: 'Process Payroll', icon: HandCoins, hoverColor: 'hover:bg-amber-50 hover:border-amber-300', iconColor: 'text-amber-600' },
    // Procurement submodules
    'inventory-list': { label: 'Manage Inventory', icon: Package, hoverColor: 'hover:bg-cyan-50 hover:border-cyan-300', iconColor: 'text-cyan-600' },
    'requisition-records': { label: 'Create Requisition', icon: ClipboardCheck, hoverColor: 'hover:bg-violet-50 hover:border-violet-300', iconColor: 'text-violet-600' },
    'repair-requests': { label: 'Submit Repair Request', icon: Wrench, hoverColor: 'hover:bg-rose-50 hover:border-rose-300', iconColor: 'text-rose-600' },
    'asset-issuance': { label: 'Issue Asset', icon: Share2, hoverColor: 'hover:bg-sky-50 hover:border-sky-300', iconColor: 'text-sky-600' },
    'budgets': { label: 'Manage Budgets', icon: Wallet, hoverColor: 'hover:bg-lime-50 hover:border-lime-300', iconColor: 'text-lime-600' },
    // HR submodules
    'staff-info': { label: 'Manage Staff', icon: Users, hoverColor: 'hover:bg-blue-50 hover:border-blue-300', iconColor: 'text-blue-600' },
    'leave-management': { label: 'Manage Leave', icon: Calendar, hoverColor: 'hover:bg-green-50 hover:border-green-300', iconColor: 'text-green-600' },
    'disciplinary': { label: 'Record Disciplinary', icon: AlertCircle, hoverColor: 'hover:bg-red-50 hover:border-red-300', iconColor: 'text-red-600' },
    'performance': { label: 'Track Performance', icon: TrendingUp, hoverColor: 'hover:bg-purple-50 hover:border-purple-300', iconColor: 'text-purple-600' },
    // Programs submodules
    'school-calendar': { label: 'Manage Calendar', icon: CalendarDays, hoverColor: 'hover:bg-indigo-50 hover:border-indigo-300', iconColor: 'text-indigo-600' },
    'lesson-plans': { label: 'Create Lesson Plan', icon: BookOpen, hoverColor: 'hover:bg-amber-50 hover:border-amber-300', iconColor: 'text-amber-600' },
    'shifts': { label: 'Manage Shifts', icon: Clock, hoverColor: 'hover:bg-teal-50 hover:border-teal-300', iconColor: 'text-teal-600' },
    'schedules': { label: 'Create Schedule', icon: CalendarClock, hoverColor: 'hover:bg-pink-50 hover:border-pink-300', iconColor: 'text-pink-600' },
    // Library submodules
    'books-masterlist': { label: 'Manage Books', icon: BookMarked, hoverColor: 'hover:bg-blue-50 hover:border-blue-300', iconColor: 'text-blue-600' },
    'borrowing-records': { label: 'Record Borrowing', icon: BookCheck, hoverColor: 'hover:bg-green-50 hover:border-green-300', iconColor: 'text-green-600' },
    // Settings submodules
    'user-management': { label: 'Manage Users', icon: Users, hoverColor: 'hover:bg-gray-50 hover:border-gray-300', iconColor: 'text-gray-600' },
    'archive': { label: 'Import Data', icon: Download, hoverColor: 'hover:bg-blue-50 hover:border-blue-300', iconColor: 'text-blue-600' },
    'delete': { label: 'Export Data', icon: Upload, hoverColor: 'hover:bg-green-50 hover:border-green-300', iconColor: 'text-green-600' },
    'activity-log': { label: 'View Activity Log', icon: Activity, hoverColor: 'hover:bg-orange-50 hover:border-orange-300', iconColor: 'text-orange-600' },
    // Modules without submodules
    'tasks': { label: 'Manage Tasks', icon: CalendarClock, hoverColor: 'hover:bg-indigo-50 hover:border-indigo-300', iconColor: 'text-indigo-600' },
    'custom-records': { label: 'Manage Custom Records', icon: FileEdit, hoverColor: 'hover:bg-violet-50 hover:border-violet-300', iconColor: 'text-violet-600' },
    'leads': { label: 'Manage Leads', icon: UserPlus, hoverColor: 'hover:bg-cyan-50 hover:border-cyan-300', iconColor: 'text-cyan-600' },
    'reports': { label: 'Generate Report', icon: BarChart3, hoverColor: 'hover:bg-purple-50 hover:border-purple-300', iconColor: 'text-purple-600' },
  };
  
  const key = submoduleId || moduleId;
  return actionMap[key] || { 
    label: `${moduleId.charAt(0).toUpperCase() + moduleId.slice(1).replace(/-/g, ' ')}`, 
    icon: FileText, 
    hoverColor: 'hover:bg-gray-50 hover:border-gray-300', 
    iconColor: 'text-gray-600' 
  };
};

export const CustomDashboard: React.FC<CustomDashboardProps> = ({ 
  onSectionChange, 
  userEmail = 'User',
  userRole = 'User',
  selectedModules = null,
  username = '',
  description = ''
}) => {
  // Get all accessible modules and submodules
  const getAccessibleActions = () => {
    if (!selectedModules || !Array.isArray(selectedModules)) {
      return [];
    }

    const actions: Array<{ moduleId: string; submoduleId?: string; sectionId: string; config: any }> = [];
    
    // Define all modules and their submodules
    const moduleStructure = [
      { id: 'students', submodules: ['masterlist', 'assessments', 'behaviour', 'attendance', 'transport', 'boarding', 'medical', 'homework'] },
      { id: 'financial', submodules: ['invoices', 'fee-structure', 'payments', 'expenses', 'payroll'] },
      { id: 'inventory', submodules: ['inventory-list', 'requisition-records', 'repair-requests', 'asset-issuance', 'budgets'] },
      { id: 'hr', submodules: ['staff-info', 'leave-management', 'disciplinary', 'performance'] },
      { id: 'programs', submodules: ['school-calendar', 'lesson-plans', 'shifts', 'schedules'] },
      { id: 'library', submodules: ['books-masterlist', 'borrowing-records'] },
      { id: 'settings', submodules: ['user-management', 'archive', 'delete', 'activity-log'] },
      { id: 'tasks', submodules: [] },
      { id: 'custom-records', submodules: [] },
      { id: 'leads', submodules: [] },
      { id: 'reports', submodules: [] },
    ];

    moduleStructure.forEach(module => {
      if (module.submodules.length > 0) {
        // Only add directly selected submodules (no parent module grants all submodules)
        module.submodules.forEach(submoduleId => {
          if (hasModuleAccess(module.id, submoduleId, selectedModules)) {
            const config = getActionConfig(module.id, submoduleId);
            actions.push({
              moduleId: module.id,
              submoduleId,
              sectionId: submoduleId,
              config
            });
          }
        });
      } else {
        // Module without submodules - check if module itself is selected
        if (hasModuleAccess(module.id, undefined, selectedModules)) {
          const config = getActionConfig(module.id);
          actions.push({
            moduleId: module.id,
            sectionId: module.id,
            config
          });
        }
      }
    });

    return actions;
  };

  const accessibleActions = getAccessibleActions();
  
  // Get list of module names for display
  const getModuleNames = () => {
    if (!selectedModules || !Array.isArray(selectedModules)) {
      return 'None';
    }
    
    const moduleNames = new Set<string>();
    selectedModules.forEach((m: any) => {
      if (m.module && !m.isSubmodule) {
        moduleNames.add(m.module);
      } else if (m.isSubmodule && m.module) {
        moduleNames.add(m.module);
      }
    });
    
    return Array.from(moduleNames).join(', ') || 'None';
  };

  return (
    <div className="p-6 md:p-3 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Profile Card */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 md:p-4 mb-6 md:mb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                <User className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
                  {username || userEmail?.split('@')[0] || 'User'}
                </h2>
                <div className="flex flex-wrap items-center gap-3 md:gap-4 text-white/90 text-sm md:text-base">
                  <div className="flex items-center space-x-1">
                    <Mail className="w-4 h-4" />
                    <span>{userEmail}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Shield className="w-4 h-4" />
                    <span>{userRole}</span>
                  </div>
                  {description && (
                    <div className="flex items-center space-x-1">
                      <FileText className="w-4 h-4" />
                      <span>{description}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 w-full md:max-w-[40%]">
              <div className="text-white/80 text-xs md:text-sm mb-1">Modules Accessed</div>
              <div className="text-white font-semibold text-sm md:text-base">{getModuleNames()}</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {accessibleActions.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {accessibleActions.map((action, index) => {
                const Icon = action.config.icon;
                return (
                  <button
                    key={`${action.moduleId}-${action.submoduleId || 'main'}-${index}`}
                    onClick={() => onSectionChange(action.sectionId)}
                    className={`p-4 border border-gray-200 rounded-lg ${action.config.hoverColor} transition-colors cursor-pointer`}
                  >
                    <Icon className={`w-6 h-6 ${action.config.iconColor} mx-auto mb-2`} />
                    <span className="text-sm text-gray-700">{action.config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-4">
            <p className="text-gray-500 text-center">No modules assigned. Please contact your administrator.</p>
          </div>
        )}
      </div>
    </div>
  );
};

