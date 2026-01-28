import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Edit, Trash2, User, Loader2, CheckCircle, UserX, Clock, AlertTriangle, Calendar, X } from 'lucide-react';
import { DropdownField } from '../Students/masterlist/DropdownField';
import { StatutoryDetails } from './statutoryDetails/StatutoryDetails';
import {
  fetchStaffMembers,
  createStaffMember,
  updateStaffMember,
  deleteStaffMembers,
  fetchDepartments,
  fetchStaffAllowances,
  fetchStaffDeductions,
  StaffMember,
  Department,
  StaffSubmissionData
} from '../../services/staffService';
import { CustomFields } from './staffCustomFields/CustomFields';
import { DepartmentModal } from './DepartmentModal';

export const StaffInfo: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  
  // Debug effect to track showForm changes
  useEffect(() => {
    console.log('🟣 [DEBUG] showForm state changed to:', showForm);
  }, [showForm]);
  
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [selectedStaffMembers, setSelectedStaffMembers] = useState<Set<number>>(new Set());
  
  // Staff members and departments from Supabase
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | undefined>(undefined);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    department_id: undefined as number | undefined,
    status: undefined as string | undefined,
    position: undefined as string | undefined,
    min_salary: undefined as number | undefined,
    max_salary: undefined as number | undefined,
    date_hired_from: undefined as string | undefined,
    date_hired_to: undefined as string | undefined,
    min_age: undefined as number | undefined,
    max_age: undefined as number | undefined
  });
  
  // Form state
  const [fullName, setFullName] = useState<string>('');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [nationalId, setNationalId] = useState<string>('');
  const [birthday, setBirthday] = useState<string>('');
  const [age, setAge] = useState<number | null>(null);
  const [position, setPosition] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [emergencyContact1Name, setEmergencyContact1Name] = useState<string>('');
  const [emergencyContact1Phone, setEmergencyContact1Phone] = useState<string>('');
  const [emergencyContact1Relationship, setEmergencyContact1Relationship] = useState<string>('');
  const [emergencyContact2Name, setEmergencyContact2Name] = useState<string>('');
  const [emergencyContact2Phone, setEmergencyContact2Phone] = useState<string>('');
  const [emergencyContact2Relationship, setEmergencyContact2Relationship] = useState<string>('');
  const [dateHired, setDateHired] = useState<string>('');
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [newQualification, setNewQualification] = useState<string>('');
  const [numberOfLeaveDays, setNumberOfLeaveDays] = useState<number | null>(null);
  
  // Calculate age from birthday
  const calculateAge = (birthDate: string) => {
    if (!birthDate) {
      setAge(null);
      return;
    }
    
    const today = new Date();
    const birth = new Date(birthDate);
    
    let calculatedAge = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      calculatedAge--;
    }
    
    setAge(calculatedAge);
  };
  
  // Status and related dates
  const [status, setStatus] = useState<string>('Active');
  const [dateOfTermination, setDateOfTermination] = useState<string>('');
  const [dateOfRetirement, setDateOfRetirement] = useState<string>('');
  
  // Loading state for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Scroll position preservation
  const formScrollRef = useRef<HTMLDivElement>(null);
  const savedScrollPosition = useRef<number>(0);
  
  // Salary state
  const [basicPay, setBasicPay] = useState<number>(0);
  const [allowances, setAllowances] = useState<Array<{ id: string; name: string; amount: number }>>([
    { id: '1', name: 'House Allowance', amount: 0 },
  ]);
  const [statutoryDeductions, setStatutoryDeductions] = useState<Array<{ id: string; name: string; amount: number }>>([
    { id: '1', name: 'SHIF', amount: 0 },
  ]);
  const [otherDeductions, setOtherDeductions] = useState<Array<{ id: string; name: string; amount: number }>>([]);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'staff' | 'salary'>('staff');
  
  
  // Custom fields state
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [statutoryDetailsValues, setStatutoryDetailsValues] = useState<Record<string, string>>({});
  
  // Calculate gross pay
  const grossPay = useMemo(() => {
    const allowancesTotal = allowances.reduce((sum, a) => sum + (a.amount || 0), 0);
    return basicPay + allowancesTotal;
  }, [basicPay, allowances]);
  
  // Calculate net pay
  const netPay = useMemo(() => {
    const statutoryTotal = statutoryDeductions.reduce((sum, d) => sum + (d.amount || 0), 0);
    const otherTotal = otherDeductions.reduce((sum, d) => sum + (d.amount || 0), 0);
    return grossPay - statutoryTotal - otherTotal;
  }, [grossPay, statutoryDeductions, otherDeductions]);

  // Filter staff members based on applied filters
  const filteredStaffMembers = useMemo(() => {
    return staffMembers.filter(staff => {
      // Department filter
      if (filters.department_id && staff.department_id !== filters.department_id) {
        return false;
      }
      
      // Status filter
      if (filters.status && staff.status !== filters.status) {
        return false;
      }
      
      // Position filter
      if (filters.position && !staff.position?.toLowerCase().includes(filters.position.toLowerCase())) {
        return false;
      }
      
      // Salary range filter
      if (filters.min_salary && (staff.gross_pay || 0) < filters.min_salary) {
        return false;
      }
      if (filters.max_salary && (staff.gross_pay || 0) > filters.max_salary) {
        return false;
      }
      
      // Date hired range filter
      if (filters.date_hired_from && staff.date_hired && staff.date_hired < filters.date_hired_from) {
        return false;
      }
      if (filters.date_hired_to && staff.date_hired && staff.date_hired > filters.date_hired_to) {
        return false;
      }
      
      // Age range filter
      if (filters.min_age && (staff.age || 0) < filters.min_age) {
        return false;
      }
      if (filters.max_age && (staff.age || 0) > filters.max_age) {
        return false;
      }
      
      return true;
    });
  }, [staffMembers, filters]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.department_id ||
      filters.status ||
      filters.position ||
      filters.min_salary ||
      filters.max_salary ||
      filters.date_hired_from ||
      filters.date_hired_to ||
      filters.min_age ||
      filters.max_age
    );
  }, [filters]);

  // Load staff members and departments on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingStaff(true);
        const [staffData, deptData] = await Promise.all([
          fetchStaffMembers(),
          fetchDepartments()
        ]);
        setStaffMembers(staffData);
        setDepartments(deptData);
      } catch (error) {
        console.error('Error loading data:', error);
        alert('Failed to load staff data. Please refresh the page.');
      } finally {
        setLoadingStaff(false);
      }
    };
    loadData();
  }, []);

  // Helper functions for salary management
  const addAllowance = () => {
    setAllowances([...allowances, { id: Date.now().toString(), name: '', amount: 0 }]);
  };

  const updateAllowance = (id: string, field: 'name' | 'amount', value: string | number) => {
    setAllowances(allowances.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const deleteAllowance = (id: string) => {
    setAllowances(allowances.filter(a => a.id !== id));
  };


  const addOtherDeduction = () => {
    setOtherDeductions([...otherDeductions, { id: Date.now().toString(), name: '', amount: 0 }]);
  };

  const updateOtherDeduction = (id: string, field: 'name' | 'amount', value: string | number) => {
    setOtherDeductions(otherDeductions.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const deleteOtherDeduction = (id: string) => {
    setOtherDeductions(otherDeductions.filter(d => d.id !== id));
  };

  
  const clearIfInvalid = () => {
    // Placeholder function for dropdown validation
  };

  // Reset form fields function (without closing form)
  const resetFormFields = useCallback(() => {
    console.log('🟡 [DEBUG] resetFormFields called');
    setSelectedStaff(null);
    setFullName('');
    setEmployeeId('');
    setNationalId('');
    setBirthday('');
    setAge(null);
    setPosition('');
    setEmail('');
    setPhone('');
    setAddress('');
    setEmergencyContact1Name('');
    setEmergencyContact1Phone('');
    setEmergencyContact1Relationship('');
    setEmergencyContact2Name('');
    setEmergencyContact2Phone('');
    setEmergencyContact2Relationship('');
    setDateHired('');
    setStatus('Active');
    setDateOfTermination('');
    setDateOfRetirement('');
    setQualifications([]);
    setNewQualification('');
    setNumberOfLeaveDays(null);
    setBasicPay(0);
    setAllowances([{ id: '1', name: 'House Allowance', amount: 0 }]);
    setStatutoryDeductions([]);
    setOtherDeductions([]);
    setCustomFieldValues({});
    setSelectedDepartmentId(undefined);
    savedScrollPosition.current = 0;
    console.log('🟡 [DEBUG] resetFormFields completed');
  }, []);
  
  // Reset form function (closes form and resets fields)
  const resetForm = () => {
    setShowForm(false);
    resetFormFields();
  };
  
  // Load staff member data when selectedStaff changes
  useEffect(() => {
    const loadStaffData = async () => {
      if (selectedStaff) {
        console.log('🟠 [DEBUG] Loading staff data for:', selectedStaff.id);
        setFullName(selectedStaff.full_name || '');
        setEmployeeId(selectedStaff.employee_id || '');
        setNationalId(selectedStaff.national_id || '');
        setBirthday(selectedStaff.birthday || '');
        setAge(selectedStaff.age || null);
        setPosition(selectedStaff.position || '');
        setEmail(selectedStaff.email || '');
        setPhone(selectedStaff.phone || '');
        setAddress(selectedStaff.address || '');
        setEmergencyContact1Name(selectedStaff.emergency_contact_1_name || '');
        setEmergencyContact1Phone(selectedStaff.emergency_contact_1_phone || '');
        setEmergencyContact1Relationship(selectedStaff.emergency_contact_1_relationship || '');
        setEmergencyContact2Name(selectedStaff.emergency_contact_2_name || '');
        setEmergencyContact2Phone(selectedStaff.emergency_contact_2_phone || '');
        setEmergencyContact2Relationship(selectedStaff.emergency_contact_2_relationship || '');
        setDateHired(selectedStaff.date_hired || '');
        setStatus(selectedStaff.status || 'Active');
        setDateOfTermination(selectedStaff.date_of_termination || '');
        setDateOfRetirement(selectedStaff.date_of_retirement || '');
        // Parse qualifications from JSON string or use empty array
        try {
          const parsed = selectedStaff.qualifications 
            ? (typeof selectedStaff.qualifications === 'string' 
                ? JSON.parse(selectedStaff.qualifications) 
                : selectedStaff.qualifications)
            : [];
          setQualifications(Array.isArray(parsed) ? parsed : []);
        } catch {
          // If parsing fails, try to use as string and convert to array
          const quals = selectedStaff.qualifications || '';
          setQualifications(quals ? [quals] : []);
        }
        setNewQualification('');
        setNumberOfLeaveDays(selectedStaff.number_of_leave_days || null);
        setSelectedDepartmentId(selectedStaff.department_id || undefined);
        setBasicPay(selectedStaff.basic_pay || 0);
        
        // Load allowances and deductions
        try {
          const [allowancesData, deductionsData] = await Promise.all([
            fetchStaffAllowances(selectedStaff.id),
            fetchStaffDeductions(selectedStaff.id)
          ]);
          
          setAllowances(allowancesData.map(a => ({ id: a.id.toString(), name: a.name, amount: a.amount })));
          
          const statutory = deductionsData.filter(d => d.deduction_type === 'Statutory');
          const other = deductionsData.filter(d => d.deduction_type === 'Other');
          setStatutoryDeductions(statutory.map(d => ({ id: d.id.toString(), name: d.name, amount: d.amount })));
          setOtherDeductions(other.map(d => ({ id: d.id.toString(), name: d.name, amount: d.amount })));
          
          // Load custom fields
          const customFields: Record<string, string> = {};
          const customFieldColumns = ['staff_custom_text1', 'staff_custom_text2', 'staff_custom_text3', 'staff_custom_text4', 'staff_custom_text5', 'staff_custom_num1', 'staff_custom_num2', 'staff_custom_num3'];
          customFieldColumns.forEach(col => {
            if (selectedStaff[col as keyof StaffMember]) {
              customFields[col] = String(selectedStaff[col as keyof StaffMember]);
            }
          });
          setCustomFieldValues(customFields);
        } catch (error) {
          console.error('Error loading staff details:', error);
        }
      } else {
        // Form is open but no staff selected - this is a new staff member
        // Don't reset fields here as they're already reset when opening the form
        console.log('🟠 [DEBUG] No selectedStaff, but form is open - new staff member');
      }
    };
    
    if (showForm) {
      loadStaffData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStaff?.id, showForm]);

  // Restore scroll position after status change
  useEffect(() => {
    if (formScrollRef.current && savedScrollPosition.current > 0) {
      requestAnimationFrame(() => {
        if (formScrollRef.current) {
          formScrollRef.current.scrollTop = savedScrollPosition.current;
        }
      });
    }
  }, [status, dateOfTermination, dateOfRetirement, showForm]);

  return (
    <div className="p-6 md:p-3 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 md:gap-3 mb-6 md:mb-3">
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Active</div>
                <div className="text-2xl font-bold text-green-600">
                  {staffMembers.filter(s => s.status === 'Active').length}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">On Leave</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {staffMembers.filter(s => s.status === 'On Leave').length}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Suspended</div>
                <div className="text-2xl font-bold text-orange-600">
                  {staffMembers.filter(s => s.status === 'Suspended').length}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <UserX className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Terminated</div>
                <div className="text-2xl font-bold text-red-600">
                  {staffMembers.filter(s => s.status === 'Terminated').length}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Retired</div>
                <div className="text-2xl font-bold text-purple-600">
                  {staffMembers.filter(s => s.status === 'Retired').length}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <User className="w-8 h-8 text-gray-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Resigned</div>
                <div className="text-2xl font-bold text-gray-600">
                  {staffMembers.filter(s => s.status === 'Resigned').length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search, Filters, and Add Staff Member */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 md:mb-3">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button 
              className={`flex-shrink-0 flex items-center justify-center p-2 md:px-4 md:py-2 border rounded-lg transition-colors relative ${
                hasActiveFilters 
                  ? 'border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100' 
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => setShowFilterModal(true)}
            >
              <Filter className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Filter</span>
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full"></span>
              )}
            </button>
            <button
              onClick={() => {
                console.log('🔵 [DEBUG] Add Staff Member button clicked');
                console.log('🔵 [DEBUG] showForm before:', showForm);
                resetFormFields();
                console.log('🔵 [DEBUG] Form fields reset');
                setShowForm(true);
                console.log('🔵 [DEBUG] setShowForm(true) called');
                setTimeout(() => {
                  console.log('🔵 [DEBUG] showForm after timeout:', showForm);
                }, 100);
              }}
              className="flex-shrink-0 bg-blue-600 text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
            >
              <Plus className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">Add Staff Member</span>
            </button>
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Bulk Actions Bar */}
          {selectedStaffMembers.size > 0 && (
            <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-600">
                  {selectedStaffMembers.size} selected
                </span>
                <button
                  onClick={() => setSelectedStaffMembers(new Set(filteredStaffMembers.map(s => s.id)))}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Select All ({filteredStaffMembers.length})
                </button>
                <button
                  onClick={() => setSelectedStaffMembers(new Set())}
                  className="text-xs text-gray-600 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
              <button
                onClick={async () => {
                  const selectedArray = Array.from(selectedStaffMembers);
                  if (selectedArray.length === 0) return;
                  if (!window.confirm(`Are you sure you want to delete ${selectedArray.length} staff member(s)? This action cannot be undone.`)) {
                    return;
                  }
                  try {
                    await deleteStaffMembers(selectedArray);
                    setSelectedStaffMembers(new Set());
                    // Reload staff members
                    const updatedStaff = await fetchStaffMembers();
                    setStaffMembers(updatedStaff);
                    alert('Staff members deleted successfully!');
                  } catch (error: any) {
                    alert(`Failed to delete staff members: ${error.message || 'Unknown error'}`);
                  }
                }}
                className="text-xs text-red-600 hover:text-red-700 font-medium px-3 py-1 bg-red-50 hover:bg-red-100 rounded transition-colors"
              >
                Delete Selected
              </button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="pl-3 pr-0 py-3 text-left w-10">
                    {/* Empty header for checkbox column */}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loadingStaff ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                      <p className="mt-2">Loading staff members...</p>
                    </td>
                  </tr>
                ) : filteredStaffMembers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No staff members found
                    </td>
                  </tr>
                ) : (
                  filteredStaffMembers.map((staff) => {
                  const isHovered = hoveredRow === staff.id;
                  const isSelected = selectedStaffMembers.has(staff.id);
                  const hasSelections = selectedStaffMembers.size > 0;
                  
                  return (
                  <tr 
                    key={staff.id} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onMouseEnter={() => setHoveredRow(staff.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => {
                      setSelectedStaff(staff);
                      savedScrollPosition.current = 0;
                      setShowForm(true);
                    }}
                  >
                    {/* Checkbox column */}
                    <td 
                      className="pl-3 pr-0 py-4 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          setSelectedStaffMembers(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(staff.id)) {
                              newSet.delete(staff.id);
                            } else {
                              newSet.add(staff.id);
                            }
                            return newSet;
                          });
                        }}
                        className={`w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 transition-opacity cursor-pointer ${
                          isHovered || hasSelections
                            ? 'opacity-100'
                            : 'opacity-0'
                        }`}
                      />
                    </td>
                    <td className="pl-2 pr-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{staff.full_name}</div>
                          <div className="text-sm text-gray-500">{staff.employee_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {staff.department_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {staff.position || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{staff.phone || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{staff.email || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {staff.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStaff(staff);
                            setStatus(staff.status || 'Active');
                            setDateOfTermination(staff.dateOfTermination || '');
                            setDateOfRetirement(staff.dateOfRetirement || '');
                            savedScrollPosition.current = 0;
                            setShowForm(true);
                          }}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm(`Are you sure you want to delete ${staff.full_name}? This action cannot be undone.`)) {
                              try {
                                await deleteStaffMembers([staff.id]);
                                // Reload staff members
                                const updatedStaff = await fetchStaffMembers();
                                setStaffMembers(updatedStaff);
                                alert('Staff member deleted successfully!');
                              } catch (error: any) {
                                alert(`Failed to delete staff member: ${error.message || 'Unknown error'}`);
                              }
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
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

        {showForm && (
          <>
            {console.log('🟢 [DEBUG] Rendering StaffForm, showForm is:', showForm)}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => {
                setShowForm(false);
                setSelectedStaff(null);
                setStatus('Active');
                setDateOfTermination('');
                setDateOfRetirement('');
                setBirthday('');
                setAge(null);
                setNumberOfLeaveDays(null);
                savedScrollPosition.current = 0;
              }}
            >
        <div 
          ref={(node) => {
            if (node) {
              (formScrollRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
              if (savedScrollPosition.current > 0) {
                requestAnimationFrame(() => {
                  if (formScrollRef.current) {
                    formScrollRef.current.scrollTop = savedScrollPosition.current;
                  }
                });
              }
            }
          }}
          onScroll={(e) => {
            savedScrollPosition.current = e.currentTarget.scrollTop;
          }}
          className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto scrollbar-hide focus:outline-none"
          tabIndex={0}
          onMouseEnter={(e) => {
            const container = e.currentTarget;
            const handleKeyDown = (event: KeyboardEvent) => {
              if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                event.preventDefault();
                const scrollAmount = 40;
                if (event.key === 'ArrowUp') {
                  container.scrollTop -= scrollAmount;
                } else {
                  container.scrollTop += scrollAmount;
                }
              }
            };
            container.addEventListener('keydown', handleKeyDown);
            container.focus();
            
            // Cleanup on mouse leave
            const cleanup = () => {
              container.removeEventListener('keydown', handleKeyDown);
              container.removeEventListener('mouseleave', cleanup);
            };
            container.addEventListener('mouseleave', cleanup);
          }}
          onClick={(e) => {
            e.stopPropagation(); // Prevent click from bubbling to the overlay
          }}
        >
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex -mb-px">
            <button
              type="button"
              onClick={() => setActiveTab('staff')}
              className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'staff'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Staff Information
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('salary')}
              className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'salary'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Salary
            </button>
          </nav>
        </div>

        {activeTab === 'staff' && (
        <form 
          className="space-y-6"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!fullName || !employeeId) {
              alert('Please fill in required fields: Full Name and Employee ID');
              return;
            }
            
            setIsSubmitting(true);
            try {
              const staffData: StaffSubmissionData = {
                full_name: fullName,
                employee_id: employeeId,
                national_id: nationalId || null,
                birthday: birthday || null,
                department_id: selectedDepartmentId || null,
                position: position || null,
                email: email || null,
                phone: phone || null,
                address: address || null,
                emergency_contact_1_name: emergencyContact1Name || null,
                emergency_contact_1_phone: emergencyContact1Phone || null,
                emergency_contact_1_relationship: emergencyContact1Relationship || null,
                emergency_contact_2_name: emergencyContact2Name || null,
                emergency_contact_2_phone: emergencyContact2Phone || null,
                emergency_contact_2_relationship: emergencyContact2Relationship || null,
                date_hired: dateHired || null,
                status: status as any,
                date_of_termination: dateOfTermination || null,
                date_of_retirement: dateOfRetirement || null,
                qualifications: qualifications.length > 0 ? JSON.stringify(qualifications) : null,
                number_of_leave_days: numberOfLeaveDays || null,
                basic_pay: basicPay,
                allowances: allowances.map(a => ({ name: a.name, amount: a.amount })),
                statutory_deductions: statutoryDeductions.map(d => ({ name: d.name, amount: d.amount })),
                other_deductions: otherDeductions.map(d => ({ name: d.name, amount: d.amount })),
                custom_fields: customFieldValues,
                ...statutoryDetailsValues
              };

              if (selectedStaff) {
                await updateStaffMember(selectedStaff.id, staffData);
                alert('Staff member updated successfully!');
              } else {
                await createStaffMember(staffData);
                alert('Staff member added successfully!');
              }

              // Reload staff members
              const updatedStaff = await fetchStaffMembers();
              setStaffMembers(updatedStaff);

              // Reset form
              resetForm();
            } catch (error: any) {
              console.error('Error saving staff member:', error);
              alert(`Failed to save staff member: ${error.message || 'Unknown error'}`);
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          {/* Basic Information */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">National ID</label>
                <input
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter National ID"
                />
              </div>
            </div>
          </div>

          {/* Date of Birth and Age */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={birthday}
                onChange={(e) => {
                  setBirthday(e.target.value);
                  calculateAge(e.target.value);
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                type="text"
                value={age !== null ? age.toString() : ''}
                readOnly
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                placeholder="Auto-calculated"
              />
            </div>
          </div>

          {/* Department and Position */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <DropdownField
                name="department_id"
                label="Department"
                items={departments}
                selectedId={selectedDepartmentId}
                clearIfInvalid={clearIfInvalid}
                onOpenModal={() => setShowDepartmentModal(true)}
                onSelect={setSelectedDepartmentId}
                tableName="departments"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              ></textarea>
            </div>
          </div>

          {/* Emergency Contacts */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Emergency Contacts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Emergency Contact 1 */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">Emergency Contact 1</h4>
                <input
                  type="text"
                  placeholder="Name"
                  value={emergencyContact1Name}
                  onChange={(e) => setEmergencyContact1Name(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={emergencyContact1Phone}
                  onChange={(e) => setEmergencyContact1Phone(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Relationship"
                  value={emergencyContact1Relationship}
                  onChange={(e) => setEmergencyContact1Relationship(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {/* Emergency Contact 2 */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">Emergency Contact 2</h4>
                <input
                  type="text"
                  placeholder="Name"
                  value={emergencyContact2Name}
                  onChange={(e) => setEmergencyContact2Name(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={emergencyContact2Phone}
                  onChange={(e) => setEmergencyContact2Phone(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Relationship"
                  value={emergencyContact2Relationship}
                  onChange={(e) => setEmergencyContact2Relationship(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Statutory Details */}
          <StatutoryDetails
            selectedStaff={selectedStaff}
            onShowAddField={() => {}}
            onChange={(values) => setStatutoryDetailsValues(values)}
            values={statutoryDetailsValues}
          />

          {/* Other Information */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Other Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Hired</label>
                <input
                  type="date"
                  value={dateHired}
                  onChange={(e) => setDateHired(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                value={status}
                onChange={(e) => {
                  // Save scroll position before status change
                  if (formScrollRef.current) {
                    savedScrollPosition.current = formScrollRef.current.scrollTop;
                  }
                  setStatus(e.target.value);
                  // Clear date fields when status changes
                  if (e.target.value !== 'Terminated') {
                    setDateOfTermination('');
                  }
                  if (e.target.value !== 'Retired') {
                    setDateOfRetirement('');
                  }
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>Active</option>
                <option>On Leave</option>
                <option>Suspended</option>
                <option>Resigned</option>
                <option>Terminated</option>
                <option>Retired</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Leave Days in a Year</label>
              <input
                type="text"
                value={numberOfLeaveDays !== null ? numberOfLeaveDays.toString() : ''}
                onChange={(e) => {
                  // Only allow numbers
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setNumberOfLeaveDays(value === '' ? null : parseInt(value, 10));
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter number of leave days"
              />
            </div>
          </div>

          {/* Date of Termination - appears when status is Terminated */}
          {status === 'Terminated' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Termination</label>
              <input
                type="date"
                value={dateOfTermination}
                onChange={(e) => setDateOfTermination(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
          </div>
          )}
          
          {/* Date of Retirement - appears when status is Retired */}
          {status === 'Retired' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Retirement</label>
              <input
                type="date"
                value={dateOfRetirement}
                onChange={(e) => setDateOfRetirement(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          )}
          
            {/* Qualifications List */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Qualifications</label>
              <div className="space-y-2">
                {/* Add Qualification Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newQualification}
                    onChange={(e) => setNewQualification(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newQualification.trim()) {
                        e.preventDefault();
                        setQualifications([...qualifications, newQualification.trim()]);
                        setNewQualification('');
                      }
                    }}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter qualification and press Enter"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newQualification.trim()) {
                        setQualifications([...qualifications, newQualification.trim()]);
                        setNewQualification('');
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Qualifications List */}
                {qualifications.length > 0 && (
                  <div className="space-y-1.5">
                    {qualifications.map((qual, index) => {
                      // Convert index to lowercase alphabet (0 -> a, 1 -> b, etc.)
                      const alphabetLabel = String.fromCharCode(97 + index); // 97 is 'a' in ASCII
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-lg group hover:bg-gray-100 transition-colors"
                        >
                          <span className="text-sm text-gray-700 flex-1">
                            <span className="text-gray-500 font-medium">({alphabetLabel})</span> {qual}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setQualifications(qualifications.filter((_, i) => i !== index));
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {qualifications.length === 0 && (
                  <p className="text-sm text-gray-400 italic py-2">No qualifications added yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Custom Fields Section */}
          <CustomFields
            selectedStaff={selectedStaff}
            onShowAddField={() => {}}
            onChange={(values) => setCustomFieldValues(values)}
            values={customFieldValues}
          />

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setSelectedStaff(null);
                setStatus('Active');
                setDateOfTermination('');
                setDateOfRetirement('');
                setBirthday('');
                setAge(null);
                setNumberOfLeaveDays(null);
                savedScrollPosition.current = 0;
              }}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {selectedStaff ? 'Update' : 'Add'} Staff Member
            </button>
          </div>
        </form>
        )}


        {activeTab === 'salary' && (
          <form 
            className="space-y-6"
            onSubmit={(e) => e.preventDefault()}
          >
            {/* Salary Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Salary Information</h3>
              
              {/* Earnings Section */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">Earnings (Ksh)</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Basic Pay</label>
                    <input
                      type="number"
                      step="0.01"
                      value={basicPay}
                      onChange={(e) => setBasicPay(parseFloat(e.target.value) || 0)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  
                  {/* Allowances */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">Allowances</label>
                      <button
                        type="button"
                        onClick={addAllowance}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Allowance
                      </button>
                    </div>
                    <div className="space-y-2">
                      {allowances.map((allowance) => (
                        <div key={allowance.id} className="flex gap-2">
                          <input
                            type="text"
                            value={allowance.name}
                            onChange={(e) => updateAllowance(allowance.id, 'name', e.target.value)}
                            placeholder="Allowance name (e.g., House Allowance)"
                            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={allowance.amount}
                            onChange={(e) => updateAllowance(allowance.id, 'amount', parseFloat(e.target.value) || 0)}
                            placeholder="Amount"
                            className="w-32 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => deleteAllowance(allowance.id)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Gross Pay Display */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Gross Pay</span>
                      <span className="text-xl font-normal text-blue-600">
                        Ksh. {grossPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deductions Section */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Deductions (Ksh)</h4>
                
                {/* Statutory Deductions - Simple Input */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Statutory Deductions</label>
                  </div>
                  <div className="space-y-2">
                    {statutoryDeductions.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No statutory deductions added</p>
                    ) : (
                      statutoryDeductions.map((deduction) => (
                        <div key={deduction.id} className="flex gap-2">
                          <input
                            type="text"
                            value={deduction.name}
                            onChange={(e) => {
                              const updated = statutoryDeductions.map(d => 
                                d.id === deduction.id ? { ...d, name: e.target.value } : d
                              );
                              setStatutoryDeductions(updated);
                            }}
                            placeholder="Deduction name"
                            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={deduction.amount}
                            onChange={(e) => {
                              const updated = statutoryDeductions.map(d => 
                                d.id === deduction.id ? { ...d, amount: parseFloat(e.target.value) || 0 } : d
                              );
                              setStatutoryDeductions(updated);
                            }}
                            placeholder="Amount"
                            className="w-32 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setStatutoryDeductions(statutoryDeductions.filter(d => d.id !== deduction.id));
                            }}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setStatutoryDeductions([...statutoryDeductions, { id: Date.now().toString(), name: '', amount: 0 }]);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Statutory Deduction
                    </button>
                  </div>
                </div>

                {/* Other Deductions */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Other Deductions</label>
                    <button
                      type="button"
                      onClick={addOtherDeduction}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Deduction
                    </button>
                  </div>
                  <div className="space-y-2">
                    {otherDeductions.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No other deductions added</p>
                    ) : (
                      otherDeductions.map((deduction) => (
                        <div key={deduction.id} className="flex gap-2">
                          <input
                            type="text"
                            value={deduction.name}
                            onChange={(e) => updateOtherDeduction(deduction.id, 'name', e.target.value)}
                            placeholder="Deduction name"
                            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={deduction.amount}
                            onChange={(e) => updateOtherDeduction(deduction.id, 'amount', parseFloat(e.target.value) || 0)}
                            placeholder="Amount"
                            className="w-32 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => deleteOtherDeduction(deduction.id)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Net Pay Display */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Net Pay</span>
                    <span className="text-xl font-normal text-green-600">
                      Ksh. {netPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
          </>
        )}
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Filter Staff Members</h2>
              <button
                onClick={() => setShowFilterModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Department Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={filters.department_id || ''}
                  onChange={(e) => setFilters({...filters, department_id: e.target.value ? parseInt(e.target.value) : undefined})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => setFilters({...filters, status: e.target.value || undefined})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Resigned">Resigned</option>
                  <option value="Terminated">Terminated</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>

              {/* Position Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input
                  type="text"
                  value={filters.position || ''}
                  onChange={(e) => setFilters({...filters, position: e.target.value || undefined})}
                  placeholder="Filter by position (contains)"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Salary Range Filter */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Salary (Ksh)</label>
                  <input
                    type="number"
                    value={filters.min_salary || ''}
                    onChange={(e) => setFilters({...filters, min_salary: e.target.value ? parseFloat(e.target.value) : undefined})}
                    placeholder="0"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Salary (Ksh)</label>
                  <input
                    type="number"
                    value={filters.max_salary || ''}
                    onChange={(e) => setFilters({...filters, max_salary: e.target.value ? parseFloat(e.target.value) : undefined})}
                    placeholder="No limit"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Date Hired Range Filter */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Hired From</label>
                  <input
                    type="date"
                    value={filters.date_hired_from || ''}
                    onChange={(e) => setFilters({...filters, date_hired_from: e.target.value || undefined})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Hired To</label>
                  <input
                    type="date"
                    value={filters.date_hired_to || ''}
                    onChange={(e) => setFilters({...filters, date_hired_to: e.target.value || undefined})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Age Range Filter */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Age</label>
                  <input
                    type="number"
                    value={filters.min_age || ''}
                    onChange={(e) => setFilters({...filters, min_age: e.target.value ? parseInt(e.target.value) : undefined})}
                    placeholder="0"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Age</label>
                  <input
                    type="number"
                    value={filters.max_age || ''}
                    onChange={(e) => setFilters({...filters, max_age: e.target.value ? parseInt(e.target.value) : undefined})}
                    placeholder="No limit"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between space-x-3 pt-6 border-t border-gray-200 mt-6">
              <button
                onClick={() => {
                  setFilters({
                    department_id: undefined,
                    status: undefined,
                    position: undefined,
                    min_salary: undefined,
                    max_salary: undefined,
                    date_hired_from: undefined,
                    date_hired_to: undefined,
                    min_age: undefined,
                    max_age: undefined
                  });
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Clear Filters
              </button>
              <div className="space-x-3">
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Apply Filters ({filteredStaffMembers.length} results)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Department Options Modal */}
      {showDepartmentModal && (
        <DepartmentModal
          departments={departments || []}
          onClose={() => {
            setShowDepartmentModal(false);
            fetchDepartments().then(updatedDepts => {
              setDepartments(updatedDepts);
            });
          }}
        />
      )}
    </div>
  );
};

