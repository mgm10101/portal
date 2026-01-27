import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Search, Edit, Trash2, Shield, User, Filter, GraduationCap, Users, Settings, X, Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { supabaseAdmin } from '../supabaseAdminClient';
import { fetchClasses, fetchStreams } from '../api/tables';
import { fetchStaffMembers } from '../services/staffService';

// Mock data for now - will be replaced with Supabase later
const MOCK_STUDENTS = [
  { id: '1', student_name: 'John Doe', admission_number: 'ADM001' },
  { id: '2', student_name: 'Jane Smith', admission_number: 'ADM002' },
  { id: '3', student_name: 'Bob Johnson', admission_number: 'ADM003' }
];

const MOCK_CLASSES = [
  { id: 1, name: 'Grade 1' },
  { id: 2, name: 'Grade 2' },
  { id: 3, name: 'Grade 3' },
  { id: 4, name: 'Grade 4' }
];

const MOCK_STREAMS = [
  { id: 1, name: 'East' },
  { id: 2, name: 'West' },
  { id: 3, name: 'North' },
  { id: 4, name: 'South' }
];

const MOCK_STAFF = [
  { id: 1, full_name: 'John Admin', employee_id: 'EMP001', position: 'Administrator' },
  { id: 2, full_name: 'Sarah Teacher', employee_id: 'EMP002', position: 'Teacher' }
];

// Define modules, submodules, and their permissions
interface SubmoduleConfig {
  id: string;
  label: string;
  permissions: string[];
  filters?: string[];
}

interface ModuleConfig {
  submodules?: SubmoduleConfig[];
  permissions?: string[]; // For modules without submodules
  filters?: string[];
}

// Define available reports for access control
interface ReportAccessConfig {
  id: string;
  name: string;
  category: string;
  description: string;
}

const REPORT_ACCESS_CONFIG: ReportAccessConfig[] = [
  // Student Reports
  { id: 'students-by-class', name: 'Students by Class', category: 'Student Reports', description: 'View students organized by class and stream' },
  { id: 'attendance-summary', name: 'Attendance Summary', category: 'Student Reports', description: 'Attendance rates by class and individual students' },
  { id: 'assessment-averages', name: 'Assessment Averages by Subject', category: 'Student Reports', description: 'Average assessment scores and performance by subject' },
  { id: 'academic-performance', name: 'Academic Performance', category: 'Student Reports', description: 'Overall academic performance and ranking by class and subject' },
  { id: 'medical-summary', name: 'Medical Summary', category: 'Student Reports', description: 'Students by allergies and medical conditions' },
  { id: 'disciplinary-records', name: 'Disciplinary Records', category: 'Student Reports', description: 'Disciplinary incidents and actions taken' },
  { id: 'transport-summary', name: 'Transport Summary', category: 'Student Reports', description: 'Students by transport zones' },
  { id: 'boarding-summary', name: 'Boarding Summary', category: 'Student Reports', description: 'Students by boarding houses and rooms' },
  { id: 'enrollment-trends', name: 'Enrollment Trends', category: 'Student Reports', description: 'Student enrollment patterns and trends over time' },
  { id: 'students-by-teams', name: 'Students by Teams', category: 'Student Reports', description: 'Student distribution by teams' },
  { id: 'age-group-analysis', name: 'Age Group Analysis', category: 'Student Reports', description: 'Student demographics and distribution by age groups' },
  
  // Financial & Procurement Reports
  { id: 'monthly-financial-summary', name: 'Monthly Financial Summary', category: 'Financial Reports', description: 'Income vs expenses for the current month' },
  { id: 'outstanding-invoices', name: 'Outstanding Invoices', category: 'Financial Reports', description: 'Pending and overdue invoices, can also be filtered per class' },
  { id: 'payments-received', name: 'Payments Received', category: 'Financial Reports', description: 'All received payments by account, method, and period' },
  { id: 'projected-revenue', name: 'Projected Revenue by Source', category: 'Financial Reports', description: 'Projected revenue breakdown by Invoice line items' },
  { id: 'expenditure-per-category', name: 'Expenditure per Category', category: 'Financial Reports', description: 'Total expenditure breakdown by expense categories' },
  { id: 'expenditure-per-vendor', name: 'Expenditure Per Vendor', category: 'Financial Reports', description: 'Spending analysis by vendor for custom periods' },
  { id: 'fee-payment-progress', name: 'Fee Payment Progress', category: 'Financial Reports', description: 'Percentage of Students who have cleared a specified percentage of their outstanding fees' },
  { id: 'invoice-distribution', name: 'Invoice Distribution by Status', category: 'Financial Reports', description: 'Breakdown of invoices by payment status: paid, partially paid, unpaid, and overdue' },
  { id: 'students-by-invoice-items', name: 'Students by Invoice Items', category: 'Financial Reports', description: 'Break Down of Students with specified line items in their invoices for a specified period' },
  { id: 'expense-analysis', name: 'Expense Analysis', category: 'Financial Reports', description: 'Expenses by category and subcategory, vendor, and account' },
  { id: 'budget-vs-spending', name: 'Budget vs Spending', category: 'Financial Reports', description: 'Budget comparison by department and per staff member' },
  { id: 'stock-records', name: 'Stock Records', category: 'Financial Reports', description: 'In stock, out of stock, and negative stock items with requisition status' },
  { id: 'requisition-summary', name: 'Requisition Summary', category: 'Financial Reports', description: 'Inventory requisitions by staff, department, and period' },
  { id: 'asset-issuance-summary', name: 'Asset Issuance Summary', category: 'Financial Reports', description: 'Asset issuance records by staff, department, and status' },
  { id: 'voided-records', name: 'Voided Records', category: 'Financial Reports', description: 'View and export voided financial records with reasons' },
  
  // HR Reports
  { id: 'staff-distribution', name: 'Staff Distribution', category: 'HR Reports', description: 'Staff distribution by department and position' },
  { id: 'staff-status-reports', name: 'Staff Status Reports', category: 'HR Reports', description: 'Staff status breakdown: on leave, suspended, active, and terminated' },
  { id: 'payroll-summary', name: 'Payroll Summary', category: 'HR Reports', description: 'Payroll breakdown by department and position' },
  { id: 'payslips', name: 'Payslips', category: 'HR Reports', description: 'Individual staff payslips by period' },
  { id: 'payroll-analysis', name: 'Payroll Analysis', category: 'HR Reports', description: 'Payroll analysis by department, statutory deductions, and totals by period' },
  { id: 'leave-summary', name: 'Leave Summary', category: 'HR Reports', description: 'Leave records by status, by staff, and leave balances' },
  { id: 'hr-disciplinary-records', name: 'Disciplinary Records', category: 'HR Reports', description: 'Incidents and actions taken, including history for each staff member' },
  { id: 'staff-qualifications', name: 'Staff Qualifications', category: 'HR Reports', description: 'Staff qualifications by type and by department, showing qualification counts' }
];

const MODULE_CONFIG: Record<string, ModuleConfig> = {
  'Dashboard': { permissions: ['view'] },
  'Students': {
    submodules: [
      { id: 'masterlist', label: 'Masterlist', permissions: ['view', 'add', 'edit', 'delete'], filters: ['Class', 'Stream'] },
      { id: 'assessments', label: 'Assessments', permissions: ['view', 'add', 'edit', 'delete'] },
      { id: 'disciplinary', label: 'Disciplinary', permissions: ['view', 'add', 'edit', 'delete'] },
      { id: 'attendance', label: 'Attendance', permissions: ['view', 'add', 'edit', 'delete'] },
      { id: 'transport', label: 'Transport', permissions: ['view', 'add', 'edit', 'delete'] },
      { id: 'boarding', label: 'Boarding', permissions: ['view', 'add', 'edit', 'delete'] },
      { id: 'medical', label: 'Medical', permissions: ['view', 'add', 'edit', 'delete'] },
      { id: 'homework', label: 'Homework', permissions: ['view', 'add', 'edit', 'delete'] }
    ]
  },
  'Financials': {
    submodules: [
      { id: 'invoices', label: 'Invoices', permissions: ['view', 'add', 'edit', 'void', 'approve'] },
      { id: 'payment-plans', label: 'Payment Plans', permissions: ['view', 'add', 'edit', 'delete', 'approve'] },
      { id: 'fee-structure', label: 'Fee Structure', permissions: ['view', 'add', 'edit', 'delete'] },
      { id: 'payments', label: 'Received', permissions: ['view', 'add', 'edit', 'void'] },
      { id: 'expenses', label: 'Expenses', permissions: ['view', 'add', 'edit', 'void', 'approve'] },
      { id: 'payroll', label: 'Payroll', permissions: ['view', 'add', 'edit', 'delete', 'approve'] }
    ]
  },
  'Procurement': {
    submodules: [
      { id: 'inventory', label: 'Inventory', permissions: ['view', 'add', 'edit', 'delete'] },
      { id: 'requisitions', label: 'Requisitions', permissions: ['view', 'add', 'edit', 'delete', 'approve'] },
      { id: 'repair-requests', label: 'Repair Requests', permissions: ['view', 'add', 'edit', 'delete', 'approve'] },
      { id: 'asset-issuance', label: 'Asset Issuance', permissions: ['view', 'add', 'edit', 'delete'] },
      { id: 'budgets', label: 'Budgets', permissions: ['view', 'add', 'edit', 'delete'] }
    ]
  },
  'HR': {
    submodules: [
      { id: 'staff-info', label: 'Staff Info', permissions: ['view', 'add', 'edit', 'delete'], filters: ['Department'] },
      { id: 'leave', label: 'Leave', permissions: ['view', 'add', 'edit', 'approve'] },
      { id: 'disciplinary', label: 'Disciplinary', permissions: ['view', 'add', 'edit', 'delete'] },
      { id: 'performance', label: 'Performance', permissions: ['view', 'add', 'edit', 'delete'] }
    ]
  },
  'Programs': {
    submodules: [
      { id: 'school-calendar', label: 'School Calendar', permissions: ['view', 'add', 'edit', 'delete'] },
      { id: 'lesson-plans', label: 'Lesson Plans', permissions: ['view', 'add', 'edit', 'delete'] },
      { id: 'shifts', label: 'Shifts', permissions: ['view', 'add', 'edit', 'delete'] },
      { id: 'schedules', label: 'Schedules', permissions: ['view', 'add', 'edit', 'delete'] }
    ]
  },
  'Library': {
    submodules: [
      { id: 'books-masterlist', label: 'Books Masterlist', permissions: ['view', 'add', 'edit', 'delete'] },
      { id: 'borrowing-records', label: 'Borrowing Records', permissions: ['view', 'add', 'edit', 'delete'] }
    ]
  },
  'Tasks': { permissions: ['view', 'add', 'edit', 'delete'] },
  'Custom Records': { permissions: ['view', 'add', 'edit', 'delete'] },
  'Leads': { permissions: ['view', 'add', 'edit', 'delete'] },
  'Reports': { permissions: ['view', 'create'] },
  'Settings': {
    submodules: [
      { id: 'user-management', label: 'User Management', permissions: ['manage'] },
      { id: 'archive', label: 'Import Data', permissions: ['manage'] },
      { id: 'delete', label: 'Export Data', permissions: ['manage'] },
      { id: 'activity-log', label: 'Activity Log', permissions: ['view'] }
    ]
  }
};

const ROLES = ['Admin', 'Teacher', 'Parent', 'Custom'];

const ADMIN_POSITIONS = [
  { id: 'library', label: 'Library', modules: ['Students'], permissions: ['view_students'] },
  { id: 'procurement', label: 'Procurement', modules: ['Procurement'], permissions: ['view_procurement', 'add_procurement', 'edit_procurement'] },
  { id: 'finance', label: 'Finance', modules: ['Financials'], permissions: ['view_financials', 'add_financials', 'edit_financials', 'approve_financials'] },
  { id: 'hr', label: 'HR', modules: ['HR'], permissions: ['view_hr', 'add_hr', 'edit_hr', 'approve_hr'] },
  { id: 'registrar', label: 'Registrar', modules: ['Students'], permissions: ['view_students', 'add_students', 'edit_students'] }
];

// Create a flat list of all modules and submodules for searching
// NOTE: Parent modules (modules with submodules) are excluded from selection
// Users must select individual submodules instead
const getAllModuleItems = (): Array<{ id: string; label: string; module: string; isSubmodule: boolean; submoduleId?: string }> => {
  const items: Array<{ id: string; label: string; module: string; isSubmodule: boolean; submoduleId?: string }> = [];
  
  Object.keys(MODULE_CONFIG).forEach(mod => {
    const modConfig = MODULE_CONFIG[mod];
    
    if (modConfig?.submodules) {
      // Module with submodules - ONLY add submodules, NOT the parent module
      modConfig.submodules.forEach(submod => {
        items.push({ 
          id: `submodule-${mod}-${submod.id}`, 
          label: `${mod} > ${submod.label}`, 
          module: mod, 
          isSubmodule: true,
          submoduleId: submod.id
        });
      });
    } else {
      // Module without submodules - add the module (these can be selected)
      items.push({ id: `module-${mod}`, label: mod, module: mod, isSubmodule: false });
    }
  });
  
  return items;
};

const ALL_MODULE_ITEMS = getAllModuleItems();

interface UserManagementProps {
  onUserUpdate?: () => void; // Callback when user is updated (for refreshing current user)
}

export const UserManagement: React.FC<UserManagementProps> = ({ onUserUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // Fetch staff members from database
  const [staffMembers, setStaffMembers] = useState<any[]>(MOCK_STAFF);
  
  useEffect(() => {
    const loadStaff = async () => {
      try {
        const staff = await fetchStaffMembers();
        if (staff && staff.length > 0) {
          setStaffMembers(staff.map((s: any) => ({
            id: s.id,
            full_name: s.full_name,
            employee_id: s.employee_id,
            position: s.position || null
          })));
        }
      } catch (err) {
        console.error('Error loading staff:', err);
        // Keep mock data as fallback
      }
    };
    
    loadStaff();
  }, []);
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [streams, setStreams] = useState<any[]>([]);
  const [loadingClassesStreams, setLoadingClassesStreams] = useState(false);

  // Load students, classes, and streams from Supabase when form opens
  useEffect(() => {
    if (showForm) {
      loadStudents();
      loadClassesAndStreams();
    }
  }, [showForm]);

  const loadStudents = async () => {
    setLoadingStudents(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          current_class:classes!current_class_id(name),
          stream:streams!stream_id(name)
        `)
        .order('admission_number', { ascending: true });
      
      if (error) throw error;
      // Map to expected format - use the same structure as masterlist
      setStudents((data || []).map((s: any) => ({
        id: s.admission_number,
        student_name: s.name || 'Unknown',
        admission_number: s.admission_number,
        class: s.current_class?.name || '',
        stream: s.stream?.name || ''
      })));
    } catch (error) {
      console.error('Error loading students:', error);
      // Fallback to mock data if error
      setStudents(MOCK_STUDENTS);
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadClassesAndStreams = async () => {
    setLoadingClassesStreams(true);
    try {
      const [classesData, streamsData] = await Promise.all([
        fetchClasses().catch(() => MOCK_CLASSES),
        fetchStreams().catch(() => MOCK_STREAMS)
      ]);
      setClasses(classesData || []);
      setStreams(streamsData || []);
    } catch (error) {
      console.error('Error loading classes/streams:', error);
      // Fallback to mock data
      setClasses(MOCK_CLASSES);
      setStreams(MOCK_STREAMS);
    } finally {
      setLoadingClassesStreams(false);
    }
  };

  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // Fetch users from Supabase
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Map to display format
      setUsers((data || []).map((u: any) => ({
        id: u.id,
        name: u.username || u.email?.split('@')[0] || 'Unknown',
        email: u.email,
        role: u.role,
        description: u.description || '-',
        status: u.status,
        lastLogin: u.last_login 
          ? new Date(u.last_login).toLocaleString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
              timeZoneName: 'short'
            })
          : 'Never'
      })));
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Filter and search users
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Apply search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        u.name?.toLowerCase().includes(lowerSearch) ||
        u.email?.toLowerCase().includes(lowerSearch) ||
        u.description?.toLowerCase().includes(lowerSearch)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(u => u.status === filterStatus);
    }

    // Apply role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(u => u.role === filterRole);
    }

    return filtered;
  }, [users, searchTerm, filterStatus, filterRole]);

  const toggleSelection = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
  };

  const clearSelection = () => {
    setSelectedUsers(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedUsers.size} user(s)? This action cannot be undone.`)) {
      return;
    }

    const userIds = Array.from(selectedUsers);
    for (const userId of userIds) {
      const user = users.find(u => u.id === userId);
      if (user) {
        await handleDeleteUser(userId, user.email);
      }
    }
    clearSelection();
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}? This action cannot be undone.`)) {
      return;
    }

    setDeletingUserId(userId);
    
    try {
      // First, delete from public.users table
      const { error: usersTableError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (usersTableError) {
        console.error('Error deleting user from users table:', usersTableError);
        alert('Failed to delete user from users table: ' + usersTableError.message);
        return;
      }
      
      // Then, delete from auth.users
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (authDeleteError) {
        console.error('Error deleting user from auth:', authDeleteError);
        alert('Failed to delete user from auth: ' + authDeleteError.message);
        return;
      }
      
      console.log('✅ User deleted successfully from both users table and auth');
      loadUsers(); // Refresh the list
    } catch (err: any) {
      console.error('Unexpected error deleting user:', err);
      alert('Failed to delete user: ' + err?.message);
    } finally {
      setDeletingUserId(null);
    }
  };

  const UserForm = () => {
    // Access parent component's classes, streams, and loading state
    const formClasses = classes;
    const formStreams = streams;
    const formLoadingClassesStreams = loadingClassesStreams;
    
    const [username, setUsername] = useState(selectedUser?.name || '');
    const [email, setEmail] = useState(selectedUser?.email || '');
    const [role, setRole] = useState(selectedUser?.role || 'Teacher');
    const [description, setDescription] = useState(selectedUser?.description || '');
    const [status, setStatus] = useState(selectedUser?.status || 'Active');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [customIsEmployee, setCustomIsEmployee] = useState(false);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [selectedModules, setSelectedModules] = useState<string[]>([]);
    const [selectedSubmodules, setSelectedSubmodules] = useState<Record<string, string[]>>({}); // module -> submodule ids
    const [expandedModules, setExpandedModules] = useState<string[]>([]);
    
    // Password change state (only for edit mode)
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    // Load user data when editing
    useEffect(() => {
      if (selectedUser) {
        setUsername(selectedUser.name || '');
        setEmail(selectedUser.email || '');
        setRole(selectedUser.role || 'Teacher');
        setDescription(selectedUser.description || '');
        setStatus(selectedUser.status || 'Active');
        
        // Load employee_id, selected_modules, student_ids, and report_access if available (need to fetch from database)
        if (selectedUser.id) {
          supabase
            .from('users')
            .select('employee_id, is_employee, selected_modules, student_ids, report_access')
            .eq('id', selectedUser.id)
            .single()
            .then(({ data, error }) => {
              if (!error && data) {
                if (data.employee_id) {
                  setSelectedEmployeeId(data.employee_id);
                  // Find and set employee search text
                  const staff = staffMembers.find(s => s.employee_id === data.employee_id);
                  if (staff) {
                    setEmployeeSearch(`${staff.full_name} (${staff.employee_id})`);
                  }
                }
                if (selectedUser.role === 'Custom') {
                  setCustomIsEmployee(data.is_employee || false);
                }
                // Load selected_modules if available
                if (data.selected_modules) {
                  try {
                    const modules = typeof data.selected_modules === 'string' 
                      ? JSON.parse(data.selected_modules) 
                      : data.selected_modules;
                    if (Array.isArray(modules)) {
                      setSelectedModuleItems(modules);
                    }
                  } catch (err) {
                    console.error('Error parsing selected_modules:', err);
                  }
                }
                // Load report_access if available
                if (data.report_access) {
                  try {
                    const reports = typeof data.report_access === 'string' 
                      ? JSON.parse(data.report_access) 
                      : data.report_access;
                    if (Array.isArray(reports)) {
                      setSelectedReports(reports);
                    }
                  } catch (err) {
                    console.error('Error parsing report_access:', err);
                  }
                }
                // Load student_ids for Parent accounts
                if (selectedUser.role === 'Parent' && data.student_ids) {
                  // student_ids can be an array or JSON string
                  let studentIdsArray: string[] = [];
                  if (Array.isArray(data.student_ids)) {
                    studentIdsArray = data.student_ids;
                  } else if (typeof data.student_ids === 'string') {
                    try {
                      const parsed = JSON.parse(data.student_ids);
                      studentIdsArray = Array.isArray(parsed) ? parsed : [];
                    } catch (err) {
                      console.error('Error parsing student_ids:', err);
                    }
                  }
                  if (studentIdsArray.length > 0) {
                    setParentStudentIds(studentIdsArray);
                  }
                }
              }
            });
        }
      } else {
        // Reset form for new user
        setUsername('');
        setEmail('');
        setRole('Teacher');
        setDescription('');
        setStatus('Active');
        setSelectedEmployeeId('');
        setEmployeeSearch('');
        setCustomIsEmployee(false);
        setParentStudentIds([]);
        setSelectedReports([]);
      }
      setSubmitError('');
      setSelectedModuleItems([]);
      // Note: parentStudentIds and selectedReports are only reset when creating a new user (in else block above)
      // When editing, they're loaded from the database in the fetch above
    }, [selectedUser, staffMembers]);
    
    // Reset employee fields when role changes
    useEffect(() => {
      if (role !== 'Admin' && role !== 'Teacher' && role !== 'Custom') {
        setSelectedEmployeeId('');
        setEmployeeSearch('');
        setCustomIsEmployee(false);
        // Reset parent student IDs when role changes away from Parent
        if (role !== 'Parent') {
          setParentStudentIds([]);
        }
      } else if (role === 'Admin' || role === 'Teacher') {
        // For Admin/Teacher, ensure is_employee is true (handled in submit)
        setCustomIsEmployee(false); // Not applicable for these roles
        // Reset parent student IDs when role changes to Admin/Teacher
        setParentStudentIds([]);
      }
    }, [role]);

    // Parent specifics
    const [parentStudentIds, setParentStudentIds] = useState<string[]>([]);
    const [studentSearch, setStudentSearch] = useState('');
    
    // Dropdown visibility states
    const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
    const [showStudentDropdown, setShowStudentDropdown] = useState(false);


    
    // Scroll-on-hover for popup
    const popupScrollRef = useRef<HTMLDivElement>(null);
    const [isHoveringPopup, setIsHoveringPopup] = useState(false);

    // Module search
    const [moduleSearch, setModuleSearch] = useState('');
    const [showModuleDropdown, setShowModuleDropdown] = useState(false);
    const [selectedModuleItems, setSelectedModuleItems] = useState<Array<{ id: string; label: string; module: string; isSubmodule: boolean; submoduleId?: string }>>([]);
    
    // Report access state
    const [selectedReports, setSelectedReports] = useState<string[]>([]);
    const [reportSearch, setReportSearch] = useState('');
    const [showReportDropdown, setShowReportDropdown] = useState(false);

    // Filter staff
    const filteredStaff = useMemo(() => {
      if (!employeeSearch) return staffMembers;
      const lower = employeeSearch.toLowerCase();
      return staffMembers.filter(s => s.full_name.toLowerCase().includes(lower) || s.employee_id.toLowerCase().includes(lower));
    }, [staffMembers, employeeSearch]);

    // Filter students
    const filteredStudents = useMemo(() => {
      if (!studentSearch) return students;
      const lower = studentSearch.toLowerCase();
      return students.filter(s => 
        (s.student_name && s.student_name.toLowerCase().includes(lower)) || 
        (s.admission_number && s.admission_number.toLowerCase().includes(lower))
      );
    }, [students, studentSearch]);

    // Filter module items for search
    const filteredModuleItems = useMemo(() => {
      if (!moduleSearch) return ALL_MODULE_ITEMS;
      const lower = moduleSearch.toLowerCase();
      return ALL_MODULE_ITEMS.filter(item => 
        item.label.toLowerCase().includes(lower) ||
        item.module.toLowerCase().includes(lower)
      ).filter(item => !selectedModuleItems.find(sel => sel.id === item.id)); // Exclude already selected
    }, [moduleSearch, selectedModuleItems]);

    // Sync selectedModuleItems with selectedModules and selectedSubmodules
    useEffect(() => {
      const modules = new Set<string>();
      const submods: Record<string, string[]> = {};
      
      selectedModuleItems.forEach(item => {
        if (item.isSubmodule) {
          modules.add(item.module);
          if (!submods[item.module]) submods[item.module] = [];
          if (item.submoduleId) submods[item.module].push(item.submoduleId);
        } else {
          modules.add(item.module);
        }
      });
      
      setSelectedModules(Array.from(modules));
      setSelectedSubmodules(submods);
      
      // Auto-expand modules that have selected submodules
      setExpandedModules(Array.from(modules));
    }, [selectedModuleItems]);

    const handleAddModuleItem = (item: { id: string; label: string; module: string; isSubmodule: boolean; submoduleId?: string }) => {
      if (!selectedModuleItems.find(sel => sel.id === item.id)) {
        setSelectedModuleItems(prev => [...prev, item]);
      }
      setModuleSearch('');
      setShowModuleDropdown(false);
    };

    const handleRemoveModuleItem = (itemId: string) => {
      setSelectedModuleItems(prev => prev.filter(item => item.id !== itemId));
    };

    // Handle password change
    const handlePasswordChange = async () => {
      setPasswordError('');
      
      // Validation
      if (!currentPassword || !newPassword || !confirmPassword) {
        setPasswordError('Please fill in all password fields');
        return;
      }
      
      if (newPassword.length < 6) {
        setPasswordError('New password must be at least 6 characters long');
        return;
      }
      
      if (newPassword !== confirmPassword) {
        setPasswordError('New passwords do not match');
        return;
      }
      
      if (!selectedUser?.id) {
        setPasswordError('User ID not found');
        return;
      }
      
      setChangingPassword(true);
      
      try {
        // Verify current password by attempting to sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: selectedUser.email,
          password: currentPassword
        });
        
        if (signInError) {
          setPasswordError('Current password is incorrect');
          setChangingPassword(false);
          return;
        }
        
        // Sign out after verification (we don't want to stay logged in as that user)
        await supabase.auth.signOut();
        
        // Update password using admin API
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          selectedUser.id,
          { password: newPassword }
        );
        
        if (updateError) {
          setPasswordError(updateError.message || 'Failed to update password');
          setChangingPassword(false);
          return;
        }
        
        // Success - reset form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordChange(false);
        setPasswordError('');
        
        // Show success message
        alert('Password updated successfully!');
      } catch (err: any) {
        console.error('Error changing password:', err);
        setPasswordError(err?.message || 'An unexpected error occurred');
      } finally {
        setChangingPassword(false);
      }
    };

    // Handle "Select All Modules" button
    const handleSelectAllModules = () => {
      // Add all modules and submodules that aren't already selected
      const allItems = ALL_MODULE_ITEMS.filter(item => 
        !selectedModuleItems.find(sel => sel.id === item.id)
      );
      setSelectedModuleItems(prev => [...prev, ...allItems]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitError('');
      setIsSubmitting(true);

      try {
        // Validation: Required fields
        if (!username || !email || !description) {
          setSubmitError('Please fill in all required fields: Username, Email Address, and Description');
          return;
        }

        if (!role || !status) {
          setSubmitError('Please select Role and Status');
          return;
        }

        // Validation: Admin or Teacher must have employee_id
        if ((role === 'Admin' || role === 'Teacher') && !selectedEmployeeId) {
          setSubmitError('Please select an Employee Name & ID for Admin or Teacher roles');
          return;
        }

        // Validation: Custom role with is_employee checked must have employee_id
        if (role === 'Custom' && customIsEmployee && !selectedEmployeeId) {
          setSubmitError('Please select an Employee ID when marking user as an employee');
          return;
        }

        // Validation: Admin, Teacher, and Custom must have at least one module/submodule
        if ((role === 'Admin' || role === 'Teacher' || role === 'Custom') && selectedModuleItems.length === 0) {
          setSubmitError('Please select at least one module or submodule for Admin, Teacher, or Custom users');
          return;
        }

        // Get current user ID for created_by field
        let createdById: string | null = null;
        try {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser) {
            createdById = currentUser.id;
          }
        } catch (err) {
          console.warn('Could not get current user ID for created_by field:', err);
        }

        // Prepare user data
        const userData: any = {
          username: username,
          email: email,
          role: role,
          description: description,
          status: status,
          employee_id: null, // Reset by default
          is_employee: false, // Reset by default
        };

        // Set is_employee and employee_id based on role
        if (role === 'Admin' || role === 'Teacher') {
          // Admin and Teacher are always employees
          userData.is_employee = true;
          userData.employee_id = selectedEmployeeId; // Only store employee_id, not name
        } else if (role === 'Custom' && customIsEmployee) {
          // Custom role with is_employee checked
          userData.is_employee = true;
          userData.employee_id = selectedEmployeeId; // Only store employee_id, not name
        } else if (role === 'Custom' && !customIsEmployee) {
          // Custom role without is_employee
          userData.is_employee = false;
          userData.employee_id = null;
        }

        if (role === 'Parent' && parentStudentIds.length > 0) {
          userData.student_ids = parentStudentIds;
        }

        // Update selected_modules from selectedModuleItems - store as JSON
        if (selectedModuleItems.length > 0) {
          const modulesData = selectedModuleItems.map(item => ({
            id: item.id,
            label: item.label,
            module: item.module,
            isSubmodule: item.isSubmodule,
            submoduleId: item.submoduleId
          }));
          userData.selected_modules = JSON.stringify(modulesData);
        } else if (role === 'Parent') {
          // For Parent users, set selected_modules to indicate parent portal
          userData.selected_modules = JSON.stringify([{ id: 'parent-portal', label: 'Parent Portal', module: 'Parent Portal', isSubmodule: false }]);
        } else {
          userData.selected_modules = null;
        }

        // Update report_access from selectedReports - store as JSON
        if (selectedReports.length > 0) {
          userData.report_access = JSON.stringify(selectedReports);
        } else {
          userData.report_access = null;
        }

        if (selectedUser && selectedUser.id) {
          // UPDATE EXISTING USER
          userData.updated_at = new Date().toISOString();
          
          // Check if email has changed - if so, update auth.users as well
          const emailChanged = email !== selectedUser.email;
          
          console.log('Updating user:', selectedUser.id, userData);

          // If email changed, update auth.users first
          if (emailChanged) {
            const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
              selectedUser.id,
              { email: email }
            );
            
            if (authUpdateError) {
              console.error('Error updating auth email:', authUpdateError);
              setSubmitError('Failed to update email in authentication system: ' + authUpdateError.message);
              return;
            }
            console.log('✅ Auth email updated successfully');
          }

          const { data, error } = await supabase
            .from('users')
            .update(userData)
            .eq('id', selectedUser.id)
            .select();

          if (error) {
            console.error('Error updating user:', error);
            setSubmitError(error.message || 'Failed to update user');
            return;
          }

          if (data && data.length > 0) {
            console.log('✅ User updated successfully:', data[0]);
            loadUsers();
            setShowForm(false);
            
            // Check if the updated user is the currently logged-in user
            // If so, refresh their data to update UI immediately
            try {
              const { data: { user: currentAuthUser } } = await supabase.auth.getUser();
              if (currentAuthUser && selectedUser.id === currentAuthUser.id) {
                // This is the current user - trigger refresh
                if (onUserUpdate) {
                  onUserUpdate();
                }
              }
            } catch (err) {
              console.error('Error checking current user:', err);
            }
            
            setSelectedUser(null);
          } else {
            setSubmitError('Update completed but no data returned');
          }
        } else {
          // CREATE NEW USER
          const defaultPassword = '0000';
          
          console.log('Creating new user:', email);
          
          // Use admin client to create auth user with default password
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: defaultPassword,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
              requires_password_change: true // Flag for first login
            }
          });

          if (authError) {
            console.error('Error creating auth user:', authError);
            setSubmitError(authError.message || 'Failed to create user account');
            return;
          }

          if (!authData.user) {
            setSubmitError('Failed to create user account');
            return;
          }

          console.log('✅ Auth user created:', authData.user.id);

          // Create user record in public.users
          userData.id = authData.user.id;
          userData.created_at = new Date().toISOString();
          userData.updated_at = new Date().toISOString();
          userData.requires_password_change = true; // Flag that user must change password
          userData.created_by = createdById; // Set the user who created this account

          const { data: userRecord, error: userError } = await supabaseAdmin
            .from('users')
            .insert(userData)
            .select()
            .single();

          if (userError) {
            console.error('Error creating user record:', userError);
            setSubmitError(userError.message || 'Failed to create user record');
            // Clean up: delete auth user if users table insert fails
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            return;
          }

          console.log('✅ User created successfully:', userRecord);
          loadUsers();
          setShowForm(false);
          setSelectedUser(null);
          // Show success message about default password
          setShowSuccessMessage(true);
          setTimeout(() => {
            setShowSuccessMessage(false);
          }, 10000); // Hide after 10 seconds
        }
      } catch (err: any) {
        console.error('Unexpected error:', err);
        setSubmitError(err?.message || 'An unexpected error occurred');
      } finally {
        setIsSubmitting(false);
      }
    };


    // Handle keyboard navigation for popup scrolling (ArrowUp/ArrowDown)
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!isHoveringPopup || !popupScrollRef.current) return;

        if (e.key === 'ArrowUp') {
          e.preventDefault();
          popupScrollRef.current.scrollBy({
            top: -100,
            behavior: 'smooth'
          });
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          popupScrollRef.current.scrollBy({
            top: 100,
            behavior: 'smooth'
          });
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isHoveringPopup]);



    const handleModuleToggle = (mod: string) => {
      if (selectedModules.includes(mod)) {
        setSelectedModules(prev => prev.filter(m => m !== mod));
        // Remove submodules when module is deselected
        const newSubmodules = { ...selectedSubmodules };
        delete newSubmodules[mod];
        setSelectedSubmodules(newSubmodules);
      } else {
        setSelectedModules(prev => [...prev, mod]);
        // Auto-expand if has submodules
        const modConfig = MODULE_CONFIG[mod];
        if (modConfig?.submodules && modConfig.submodules.length > 0) {
          setExpandedModules(prev => [...prev, mod]);
        }
      }
    };

    const handleSubmoduleToggle = (mod: string, submodId: string) => {
      setSelectedSubmodules(prev => {
        const current = prev[mod] || [];
        if (current.includes(submodId)) {
          return { ...prev, [mod]: current.filter(id => id !== submodId) };
        } else {
          return { ...prev, [mod]: [...current, submodId] };
        }
      });
    };

    const toggleModuleExpand = (mod: string) => {
      setExpandedModules(prev => 
        prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]
      );
    };


    const shouldShowEmployeeField = () => {
      if (role === 'Parent') return false;
      if (role === 'Custom' && !customIsEmployee) return false;
      return true;
    };

    return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div 
          ref={popupScrollRef}
          className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide"
          onMouseEnter={() => setIsHoveringPopup(true)}
          onMouseLeave={() => setIsHoveringPopup(false)}
        >
          <style>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-normal text-gray-800">
            {selectedUser ? 'Edit User' : 'Add New User'}
          </h2>
            {/* Removed the header buttons as requested */}
        </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Basic Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username <span className="text-red-500">*</span></label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg" placeholder="jdoe" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg" required />
              </div>
            </div>

            {/* Role, Description & Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={role} onChange={e => setRole(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg" placeholder="e.g. Grade 1 Teacher" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Custom: Is Employee? */}
            {role === 'Custom' && (
               <div className="flex items-center space-x-2">
                 <input type="checkbox" id="isEmployee" checked={customIsEmployee} onChange={e => setCustomIsEmployee(e.target.checked)} className="rounded border-gray-300 text-blue-600" />
                 <label htmlFor="isEmployee" className="text-sm text-gray-700">Is this an employee of the institution?</label>
               </div>
            )}

            {/* Employee Search */}
            {shouldShowEmployeeField() && (
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name & ID</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input type="text" value={employeeSearch} onChange={e => { setEmployeeSearch(e.target.value); setShowEmployeeDropdown(true); }} onFocus={() => setShowEmployeeDropdown(true)} className="w-full pl-10 p-3 border border-gray-300 rounded-lg" placeholder="Search staff..." />
                </div>
                {showEmployeeDropdown && employeeSearch && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredStaff.map(staff => (
                      <div key={staff.id} onClick={() => { setSelectedEmployeeId(staff.employee_id); setEmployeeSearch(`${staff.full_name} (${staff.employee_id})`); setShowEmployeeDropdown(false); }} className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0">
                        <div className="font-medium text-gray-800">{staff.full_name}</div>
                        <div className="text-sm text-gray-500">{staff.employee_id} • {staff.position || 'No Position'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Parent: Multi-select Students */}
            {role === 'Parent' && (
          <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Students</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input type="text" value={studentSearch} onChange={e => { setStudentSearch(e.target.value); setShowStudentDropdown(true); }} onFocus={() => setShowStudentDropdown(true)} className="w-full pl-10 p-3 border border-gray-300 rounded-lg" placeholder="Search student..." />
                </div>
                {/* Selected Students Tags */}
                <div className="flex flex-wrap gap-2 mt-2">
                   {parentStudentIds.map(id => {
                     const st = students.find(s => s.id === id);
                     return st ? (
                       <span key={id} className="inline-flex items-center px-5 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                         {st.student_name}
                         <button type="button" onClick={() => setParentStudentIds(prev => prev.filter(p => p !== id))} className="ml-2 text-blue-600 hover:text-blue-800 text-base">×</button>
                       </span>
                     ) : null;
                   })}
                </div>
                {showStudentDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {loadingStudents ? (
                      <div className="p-3 text-gray-500 text-center">Loading students...</div>
                    ) : filteredStudents.length > 0 ? (
                      filteredStudents.filter(s => !parentStudentIds.includes(s.id)).map(student => (
                        <div key={student.id} onClick={() => { 
                          if (!parentStudentIds.includes(student.id)) setParentStudentIds(prev => [...prev, student.id]);
                          setStudentSearch('');
                          setShowStudentDropdown(false); 
                        }} className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0">
                          <div className="font-medium text-gray-800">{student.student_name}</div>
                          <div className="text-sm text-gray-500">
                            {student.admission_number}
                            {student.class && ` • ${student.class}`}
                            {student.stream && ` • ${student.stream}`}
            </div>
          </div>
                      ))
                    ) : (
                      <div className="p-3 text-gray-500 text-center">No students found</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Modules Section (Except for Parents who just have students) */}
            {role !== 'Parent' && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Access Control</h3>
                
                {/* Module Selection - Searchable Dropdown */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Modules & Submodules <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleSelectAllModules}
                      className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                    >
                      Select All Modules
                    </button>
                  </div>
                  
                  {/* Search Input */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={moduleSearch}
                      onChange={(e) => {
                        setModuleSearch(e.target.value);
                        setShowModuleDropdown(true);
                      }}
                      onFocus={() => setShowModuleDropdown(true)}
                      placeholder="Search and add modules or submodules..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    
                    {/* Dropdown Results */}
                    {showModuleDropdown && moduleSearch && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredModuleItems.length > 0 ? (
                          filteredModuleItems.map(item => (
                            <div
                              key={item.id}
                              onClick={() => handleAddModuleItem(item)}
                              className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                            >
                              <div className="font-medium text-gray-800">{item.label}</div>
                              {item.isSubmodule && (
                                <div className="text-xs text-gray-500 mt-0.5">Submodule</div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-gray-500 text-center">No results found</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected Modules/Submodules Tags */}
                  {selectedModuleItems.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {selectedModuleItems.map(item => (
                        <span
                          key={item.id}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                        >
                          {item.label}
            <button
              type="button"
                            onClick={() => handleRemoveModuleItem(item.id)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Report Access Section - Only show when Reports module is selected */}
            {selectedModuleItems.some(item => item.module === 'Reports') && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Report Access Control</h3>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-3">
                    Select which specific reports this user should have access to. If no reports are selected, the user will have access to all reports.
                  </p>
                </div>

                {/* Report Search and Selection */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Available Reports
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const allReportIds = REPORT_ACCESS_CONFIG.map(report => report.id);
                        setSelectedReports(allReportIds);
                      }}
                      className="px-3 py-1.5 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
                    >
                      Select All Reports
                    </button>
                  </div>
                  
                  {/* Search Input */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={reportSearch}
                      onChange={(e) => {
                        setReportSearch(e.target.value);
                        setShowReportDropdown(true);
                      }}
                      onFocus={() => setShowReportDropdown(true)}
                      placeholder="Search reports by name or category..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    
                    {/* Dropdown Results */}
                    {showReportDropdown && reportSearch && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {REPORT_ACCESS_CONFIG
                          .filter(report => 
                            !selectedReports.includes(report.id) &&
                            (report.name.toLowerCase().includes(reportSearch.toLowerCase()) ||
                             report.category.toLowerCase().includes(reportSearch.toLowerCase()))
                          )
                          .map(report => (
                            <div
                              key={report.id}
                              onClick={() => {
                                setSelectedReports(prev => [...prev, report.id]);
                                setReportSearch('');
                                setShowReportDropdown(false);
                              }}
                              className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                            >
                              <div className="font-medium text-gray-800">{report.name}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{report.category}</div>
                              <div className="text-xs text-gray-400 mt-1">{report.description}</div>
                            </div>
                          ))}
                        {REPORT_ACCESS_CONFIG.filter(report => 
                          !selectedReports.includes(report.id) &&
                          (report.name.toLowerCase().includes(reportSearch.toLowerCase()) ||
                           report.category.toLowerCase().includes(reportSearch.toLowerCase()))
                        ).length === 0 && (
                          <div className="p-3 text-gray-500 text-center">No reports found</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected Reports Tags */}
                  {selectedReports.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Selected Reports ({selectedReports.length})</span>
                        <button
                          type="button"
                          onClick={() => setSelectedReports([])}
                          className="text-xs text-red-600 hover:text-red-800 transition-colors"
                        >
                          Clear All
                        </button>
                      </div>
                      
                      {/* Group by category */}
                      {Object.entries(
                        selectedReports.reduce((groups, reportId) => {
                          const report = REPORT_ACCESS_CONFIG.find(r => r.id === reportId);
                          if (report) {
                            if (!groups[report.category]) groups[report.category] = [];
                            groups[report.category].push(report);
                          }
                          return groups;
                        }, {} as Record<string, typeof REPORT_ACCESS_CONFIG>)
                      ).map(([category, reports]) => (
                        <div key={category} className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">{category}</h4>
                          <div className="flex flex-wrap gap-2">
                            {reports.map(report => (
                              <span
                                key={report.id}
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {report.name}
                                <button
                                  type="button"
                                  onClick={() => setSelectedReports(prev => prev.filter(id => id !== report.id))}
                                  className="ml-2 text-blue-600 hover:text-blue-800"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Change Password Section - Only show in edit mode */}
            {selectedUser && selectedUser.id && (
              <div className="mb-6 border-t border-gray-200 pt-6">
                <button
                  type="button"
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                  className="w-full px-4 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium flex items-center justify-center"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </button>
                
                {showPasswordChange && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4">Change Password</h4>
                    
                    <div className="space-y-4">
                      {/* Current Password */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            placeholder="Enter current password"
                            disabled={changingPassword}
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                          >
                            {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>
                      
                      {/* New Password */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            placeholder="Enter new password"
                            disabled={changingPassword}
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                          >
                            {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>
                      
                      {/* Confirm Password */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            placeholder="Confirm new password"
                            disabled={changingPassword}
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>
                      
                      {passwordError && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm">
                          {passwordError}
                        </div>
                      )}
                      
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowPasswordChange(false);
                            setCurrentPassword('');
                            setNewPassword('');
                            setConfirmPassword('');
                            setPasswordError('');
                          }}
                          disabled={changingPassword}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handlePasswordChange}
                          disabled={changingPassword}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {changingPassword ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save New Password'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {submitError}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              <button 
                type="button" 
                onClick={() => { setShowForm(false); setSelectedUser(null); setSubmitError(''); }} 
                disabled={isSubmitting}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  `${selectedUser ? 'Update' : 'Create'} User`
                )}
              </button>
            </div>
        </form>
      </div>
    </div>
  );
  };

  return (
    <div className="p-6 md:p-3 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Success Message for New User Creation */}
        {showSuccessMessage && (
          <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              <div>
                <p className="font-medium">User created successfully!</p>
                <p className="text-sm mt-1">Default password is <strong>0000</strong>. The user will be prompted to change it on first login.</p>
              </div>
            </div>
            <button
              onClick={() => setShowSuccessMessage(false)}
              className="text-blue-600 hover:text-blue-800 ml-4"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-3 mb-6 md:mb-3">
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Admin</div>
                <div className="text-2xl font-bold text-blue-600">
                  {users.filter(u => u.role === 'Admin' || u.role === 'Super Admin').length}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <GraduationCap className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Teachers</div>
                <div className="text-2xl font-bold text-purple-600">
                  {users.filter(u => u.role === 'Teacher').length}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Parents</div>
                <div className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.role === 'Parent').length}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Settings className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Custom</div>
                <div className="text-2xl font-bold text-orange-600">
                  {users.filter(u => u.role === 'Custom').length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by username, email, or description..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>
          <div className="flex items-center space-x-4 w-full md:w-auto">
            <button 
              onClick={() => setShowFilterModal(!showFilterModal)}
              className={`px-4 py-2 border rounded-lg flex items-center transition-colors ${
                (filterStatus !== 'all' || filterRole !== 'all')
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Filter className="w-5 h-5 mr-2" /> Filter
            </button>
            <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center whitespace-nowrap">
              <Plus className="w-5 h-5 mr-2" /> Add User
            </button>
          </div>
        </div>

        {/* Filter Modal */}
        {showFilterModal && (
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filter Users</h3>
              <button
                onClick={() => setShowFilterModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Roles</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Admin">Admin</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Parent">Parent</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
            </div>
            {(filterStatus !== 'all' || filterRole !== 'all') && (
              <button
                onClick={() => {
                  setFilterStatus('all');
                  setFilterRole('all');
                }}
                className="mt-4 text-sm text-blue-600 hover:text-blue-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Bulk Actions Bar */}
          {selectedUsers.size > 0 && (
            <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-600">
                  {selectedUsers.size} selected
                </span>
                <button
                  onClick={selectAll}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Select All ({filteredUsers.length})
                </button>
                <button
                  onClick={clearSelection}
                  className="text-xs text-gray-600 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
              <button
                onClick={handleBulkDelete}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Delete Selected
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  {/* Checkbox column header */}
                  <th className="pl-3 pr-2 py-3 text-left w-10">
                    {/* Empty header for checkbox column */}
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loadingUsers ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Loading users...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const handleRowClick = async () => {
                      // Check if trying to edit super admin
                      if (user.role === 'Super Admin' || user.role === 'Superadmin') {
                        // Check if current user is super admin
                        try {
                          const { data: { user: currentUser } } = await supabase.auth.getUser();
                          if (currentUser) {
                            const { data: currentUserData } = await supabase
                              .from('users')
                              .select('role')
                              .eq('id', currentUser.id)
                              .single();
                            
                            if (currentUserData?.role !== 'Super Admin' && currentUserData?.role !== 'Superadmin') {
                              alert('Only the master account can modify master account details.');
                              return;
                            }
                          }
                        } catch (err) {
                          console.error('Error checking current user:', err);
                          alert('Unable to verify permissions. Only the master account can modify master account details.');
                          return;
                        }
                      }
                      setSelectedUser(user);
                      setShowForm(true);
                    };

                    return (
                      <tr 
                        key={user.id} 
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onMouseEnter={() => setHoveredRow(user.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        onClick={handleRowClick}
                      >
                        {/* Checkbox column */}
                        <td 
                          className="pl-3 pr-2 py-4 whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.id)}
                            onChange={() => toggleSelection(user.id)}
                            className={`w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 transition-opacity cursor-pointer ${
                              hoveredRow === user.id || selectedUsers.size > 0
                                ? 'opacity-100'
                                : 'opacity-0'
                            }`}
                          />
                        </td>
                    <td className="px-2 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'Super Admin' ? 'bg-purple-100 text-purple-800' : user.role === 'Finance Manager' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.lastLogin}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.status === 'Inactive' ? 'bg-pink-100 text-pink-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex space-x-3 items-center">
                        <button 
                          onClick={handleRowClick}
                          disabled={deletingUserId === user.id}
                          className={`transition-colors ${
                            deletingUserId === user.id
                              ? 'text-blue-300 cursor-not-allowed'
                              : 'text-blue-600 hover:text-blue-700'
                          }`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          disabled={deletingUserId === user.id || user.role === 'Super Admin' || user.role === 'Superadmin'}
                          className={`transition-colors ${
                            deletingUserId === user.id
                              ? 'text-red-400 cursor-not-allowed'
                              : 'text-red-600 hover:text-red-700'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                          title={user.role === 'Super Admin' || user.role === 'Superadmin' ? 'Cannot delete master account' : 'Delete user'}
                        >
                          {deletingUserId === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && <UserForm />}
      </div>
    </div>
  );
};