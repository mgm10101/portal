import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Edit, Trash2, User, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { DropdownField } from '../Students/masterlist/DropdownField';
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
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | undefined>(undefined);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  
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
  const [activeTab, setActiveTab] = useState<'staff' | 'statutory' | 'salary'>('staff');
  
  // Statutory Deductions Configuration State
  const [statutoryDeductionConfigs, setStatutoryDeductionConfigs] = useState<Array<{
    id: string;
    name: string;
    percentage: number;
    earningType: string; // 'Gross Earnings', 'Basic Salary', 'House Allowance', etc.
    hasBands: boolean;
    bands: Array<{ id: string; min: number; max: number | null; percentage: number }>;
    paidBy: {
      employer: number; // Percentage of earnings paid by employer
      employee: number; // Percentage of earnings paid by employee
    };
    limits: {
      type: 'deduction' | 'earning';
      lower: number | null;
      upper: number | null;
    };
  }>>([]);
  const [editingDeductionConfig, setEditingDeductionConfig] = useState<string | null>(null);
  
  // Custom fields state
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  
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

  // Load staff members and departments on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingStaff(true);
        setLoadingDepartments(true);
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
        setLoadingDepartments(false);
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

  const addStatutoryDeduction = () => {
    setStatutoryDeductions([...statutoryDeductions, { id: Date.now().toString(), name: '', amount: 0 }]);
  };

  const updateStatutoryDeduction = (id: string, field: 'name' | 'amount', value: string | number) => {
    setStatutoryDeductions(statutoryDeductions.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const deleteStatutoryDeduction = (id: string) => {
    setStatutoryDeductions(statutoryDeductions.filter(d => d.id !== id));
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

  const clearIfInvalid = (e: React.FocusEvent<HTMLSelectElement>, validList: string[]) => {
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
    setStatutoryDeductions([{ id: '1', name: 'SHIF', amount: 0 }]);
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-3 mb-6 md:mb-3">
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Active</div>
            <div className="text-2xl font-bold text-green-600">
              {staffMembers.filter(s => s.status === 'Active').length}
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">On Leave</div>
            <div className="text-2xl font-bold text-yellow-600">
              {staffMembers.filter(s => s.status === 'On Leave').length}
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Suspended</div>
            <div className="text-2xl font-bold text-orange-600">
              {staffMembers.filter(s => s.status === 'Suspended').length}
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Terminated</div>
            <div className="text-2xl font-bold text-red-600">
              {staffMembers.filter(s => s.status === 'Terminated').length}
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Retired</div>
            <div className="text-2xl font-bold text-purple-600">
              {staffMembers.filter(s => s.status === 'Retired').length}
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
            <button className="flex-shrink-0 flex items-center justify-center p-2 md:px-4 md:py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Filter by Department</span>
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
                  onClick={() => setSelectedStaffMembers(new Set(staffMembers.map(s => s.id)))}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Select All ({staffMembers.length})
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
              <thead className="bg-gray-50">
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
                    Salary
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
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                      <p className="mt-2">Loading staff members...</p>
                    </td>
                  </tr>
                ) : staffMembers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No staff members found
                    </td>
                  </tr>
                ) : (
                  staffMembers.map((staff) => {
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Ksh. {(staff.gross_pay || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Are you sure you want to delete ${staff.name}? This action cannot be undone.`)) {
                              // TODO: Implement delete functionality
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
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div 
          ref={(node) => {
            formScrollRef.current = node;
            if (node && savedScrollPosition.current > 0) {
              requestAnimationFrame(() => {
                if (formScrollRef.current) {
                  formScrollRef.current.scrollTop = savedScrollPosition.current;
                }
              });
            }
          }}
          onScroll={(e) => {
            savedScrollPosition.current = e.currentTarget.scrollTop;
          }}
          className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto"
        >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-normal text-gray-800">
            {selectedStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
          </h2>
          <button
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
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex -mb-px">
            <button
              type="button"
              onClick={() => setActiveTab('staff')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'staff'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Staff Information
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('statutory')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'statutory'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Statutory Deductions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('salary')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
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
                custom_fields: customFieldValues
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

          {/* Birthday and Age */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Birthday</label>
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

        {activeTab === 'statutory' && (
          <StatutoryDeductionsTab
            deductionConfigs={statutoryDeductionConfigs}
            setDeductionConfigs={setStatutoryDeductionConfigs}
            editingDeductionConfig={editingDeductionConfig}
            setEditingDeductionConfig={setEditingDeductionConfig}
            allowances={allowances}
            basicPay={basicPay}
            grossPay={grossPay}
          />
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
                
                {/* Statutory Deductions - Read Only (Calculated from Statutory Deductions tab) */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Statutory Deductions</label>
                    <span className="text-xs text-gray-500 italic">Configured in Statutory Deductions tab</span>
                  </div>
                  <div className="space-y-2">
                    {statutoryDeductionConfigs.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No statutory deductions configured. Go to Statutory Deductions tab to add them.</p>
                    ) : (
                      statutoryDeductionConfigs.map((config) => {
                        // Calculate amount based on configuration
                        let calculatedAmount = 0;
                        let earningBase = 0;
                        
                        if (config.earningType === 'Gross Earnings') {
                          earningBase = grossPay;
                        } else if (config.earningType === 'Basic Salary') {
                          earningBase = basicPay;
                        } else {
                          const allowance = allowances.find(a => a.name === config.earningType);
                          earningBase = allowance?.amount || 0;
                        }
                        
                        if (config.hasBands && config.bands.length > 0) {
                          // Calculate based on bands
                          for (const band of config.bands) {
                            if (earningBase >= band.min && (band.max === null || earningBase <= band.max)) {
                              const bandAmount = earningBase * (band.percentage / 100);
                              calculatedAmount = bandAmount;
                              break;
                            }
                          }
                        } else {
                          calculatedAmount = earningBase * (config.percentage / 100);
                        }
                        
                        // Apply limits
                        if (config.limits.type === 'deduction') {
                          if (config.limits.lower !== null && calculatedAmount < config.limits.lower) {
                            calculatedAmount = config.limits.lower;
                          }
                          if (config.limits.upper !== null && calculatedAmount > config.limits.upper) {
                            calculatedAmount = config.limits.upper;
                          }
                        } else if (config.limits.type === 'earning') {
                          if (config.limits.lower !== null && earningBase < config.limits.lower) {
                            calculatedAmount = 0;
                          }
                          if (config.limits.upper !== null && earningBase > config.limits.upper) {
                            earningBase = config.limits.upper;
                            if (config.hasBands && config.bands.length > 0) {
                              for (const band of config.bands) {
                                if (earningBase >= band.min && (band.max === null || earningBase <= band.max)) {
                                  calculatedAmount = earningBase * (band.percentage / 100);
                                  break;
                                }
                              }
                            } else {
                              calculatedAmount = earningBase * (config.percentage / 100);
                            }
                          }
                        }
                        
                        // Calculate employee deduction (percentage of deduction amount, not earnings)
                        // First calculate the total deduction amount
                        let totalDeductionAmount = calculatedAmount;
                        
                        // Now calculate employee and employer portions as percentages of the total deduction amount
                        const employerPercentOfDeduction = config.paidBy?.employer ?? 0; // Percentage of deduction amount
                        const employeePercentOfDeduction = config.paidBy?.employee ?? 0; // Percentage of deduction amount
                        
                        let employeeDeduction = totalDeductionAmount * (employeePercentOfDeduction / 100);
                        let employerPortion = totalDeductionAmount * (employerPercentOfDeduction / 100);
                        
                        // Apply limits to total deduction first, then split
                        if (config.limits && config.limits.type === 'deduction') {
                          if (config.limits.lower !== null && totalDeductionAmount < config.limits.lower) {
                            totalDeductionAmount = config.limits.lower;
                            employeeDeduction = totalDeductionAmount * (employeePercentOfDeduction / 100);
                            employerPortion = totalDeductionAmount * (employerPercentOfDeduction / 100);
                          }
                          if (config.limits.upper !== null && totalDeductionAmount > config.limits.upper) {
                            totalDeductionAmount = config.limits.upper;
                            employeeDeduction = totalDeductionAmount * (employeePercentOfDeduction / 100);
                            employerPortion = totalDeductionAmount * (employerPercentOfDeduction / 100);
                          }
                        } else if (config.limits && config.limits.type === 'earning') {
                          if (config.limits.lower !== null && earningBase < config.limits.lower) {
                            totalDeductionAmount = 0;
                            employeeDeduction = 0;
                            employerPortion = 0;
                          }
                          if (config.limits.upper !== null && earningBase > config.limits.upper) {
                            earningBase = config.limits.upper;
                            // Recalculate total deduction with new earning base
                            if (config.hasBands && config.bands.length > 0) {
                              for (const band of config.bands) {
                                if (earningBase >= band.min && (band.max === null || earningBase <= band.max)) {
                                  totalDeductionAmount = earningBase * (band.percentage / 100);
                                  break;
                                }
                              }
                            } else {
                              totalDeductionAmount = earningBase * (config.percentage / 100);
                            }
                            employeeDeduction = totalDeductionAmount * (employeePercentOfDeduction / 100);
                            employerPortion = totalDeductionAmount * (employerPercentOfDeduction / 100);
                          }
                        }
                        
                        const totalPercentage = employerPercentOfDeduction + employeePercentOfDeduction;
                        
                        return (
                          <div key={config.id} className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg">
                            <input
                              type="text"
                              value={config.name}
                              readOnly
                              className="flex-1 p-2 border border-gray-200 rounded-lg bg-white cursor-not-allowed"
                            />
                            <input
                              type="number"
                              value={employeeDeduction.toFixed(2)}
                              readOnly
                              className="w-32 p-2 border border-gray-200 rounded-lg bg-white cursor-not-allowed"
                              title={`Employee deduction: ${employeeDeduction.toFixed(2)} | Employer portion: ${employerPortion.toFixed(2)} | Total remitted: ${(employeeDeduction + employerPortion).toFixed(2)}`}
                            />
                            <div className="text-xs text-gray-500 w-40">
                              <div>Employer: {config.paidBy?.employer ?? 0}%</div>
                              <div>Employee: {config.paidBy?.employee ?? 0}%</div>
                              <div className="text-gray-400">Total: {totalPercentage.toFixed(2)}%</div>
                            </div>
                          </div>
                        );
                      })
                    )}
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
        {!showForm && console.log('🔴 [DEBUG] NOT rendering StaffForm, showForm is:', showForm)}
      </div>

      {/* Department Options Modal */}
      {showDepartmentModal && (
        <DepartmentModal
          departments={departments || []}
          onClose={async () => {
            setShowDepartmentModal(false);
            const updatedDepts = await fetchDepartments();
            setDepartments(updatedDepts);
          }}
        />
      )}
    </div>
  );
};

// Statutory Deductions Tab Component
interface StatutoryDeductionsTabProps {
  deductionConfigs: Array<{
    id: string;
    name: string;
    percentage: number;
    earningType: string;
    hasBands: boolean;
    bands: Array<{ id: string; min: number; max: number | null; percentage: number }>;
    paidBy: {
      employer: number;
      employee: number;
    };
    limits: {
      type: 'deduction' | 'earning';
      lower: number | null;
      upper: number | null;
    };
  }>;
  setDeductionConfigs: React.Dispatch<React.SetStateAction<any[]>>;
  editingDeductionConfig: string | null;
  setEditingDeductionConfig: React.Dispatch<React.SetStateAction<string | null>>;
  allowances: Array<{ id: string; name: string; amount: number }>;
  basicPay: number;
  grossPay: number;
}

const StatutoryDeductionsTab: React.FC<StatutoryDeductionsTabProps> = ({
  deductionConfigs,
  setDeductionConfigs,
  editingDeductionConfig,
  setEditingDeductionConfig,
  allowances,
  basicPay,
  grossPay
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showEarningDropdown, setShowEarningDropdown] = useState<Record<string, boolean>>({});

  // Get available earning types
  const earningTypes = useMemo(() => {
    const types = ['Gross Earnings', 'Basic Salary'];
    allowances.forEach(a => {
      if (a.name && !types.includes(a.name)) {
        types.push(a.name);
      }
    });
    return types;
  }, [allowances]);

  // Filter earning types based on search
  const filteredEarningTypes = useMemo(() => {
    if (!searchTerm) return earningTypes;
    return earningTypes.filter(type => 
      type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [earningTypes, searchTerm]);

  const addDeductionConfig = () => {
    const newId = Date.now().toString();
    setDeductionConfigs([...deductionConfigs, {
      id: newId,
      name: '',
      percentage: 0,
      earningType: 'Gross Earnings',
      hasBands: false,
      bands: [],
      paidBy: {
        employer: 0,
        employee: 0
      },
      limits: {
        type: 'deduction',
        lower: null,
        upper: null
      }
    }]);
    setEditingDeductionConfig(newId);
  };

  const updateDeductionConfig = (id: string, field: string, value: any) => {
    setDeductionConfigs(deductionConfigs.map(config => 
      config.id === id ? { ...config, [field]: value } : config
    ));
  };

  const deleteDeductionConfig = (id: string) => {
    setDeductionConfigs(deductionConfigs.filter(config => config.id !== id));
    if (editingDeductionConfig === id) {
      setEditingDeductionConfig(null);
    }
  };

  const addBand = (configId: string) => {
    setDeductionConfigs(deductionConfigs.map(config => {
      if (config.id === configId) {
        const currentBands = config.bands || [];
        const lastBand = currentBands.length > 0 ? currentBands[currentBands.length - 1] : null;
        const newBand = {
          id: Date.now().toString(),
          min: lastBand && lastBand.max !== null && lastBand.max !== undefined ? lastBand.max : 0,
          max: null as number | null,
          percentage: 0
        };
        return { ...config, bands: [...currentBands, newBand] };
      }
      return config;
    }));
  };

  const updateBand = (configId: string, bandId: string, field: string, value: any) => {
    setDeductionConfigs(deductionConfigs.map(config => {
      if (config.id === configId) {
        const currentBands = config.bands || [];
        return {
          ...config,
          bands: currentBands.map(band =>
            band.id === bandId ? { ...band, [field]: value } : band
          )
        };
      }
      return config;
    }));
  };

  const deleteBand = (configId: string, bandId: string) => {
    setDeductionConfigs(deductionConfigs.map(config => {
      if (config.id === configId) {
        return {
          ...config,
          bands: config.bands.filter(band => band.id !== bandId)
        };
      }
      return config;
    }));
  };

  const editingConfig = deductionConfigs.find(c => c.id === editingDeductionConfig);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Configure Statutory Deductions</h3>
        <button
          type="button"
          onClick={addDeductionConfig}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Statutory Deduction
        </button>
      </div>

      {/* List of Deduction Configs */}
      <div className="space-y-4">
        {deductionConfigs.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500">No statutory deductions configured. Click "Add Statutory Deduction" to create one.</p>
          </div>
        ) : (
          deductionConfigs.map((config) => (
            <div key={config.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3 flex-1">
                  <input
                    type="text"
                    value={config.name}
                    onChange={(e) => updateDeductionConfig(config.id, 'name', e.target.value)}
                    placeholder="Deduction Name (e.g. PAYE)"
                    className="text-lg font-medium border-b-2 border-transparent focus:border-blue-500 focus:outline-none px-2 py-1 flex-1 min-w-[300px]"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingDeductionConfig(editingDeductionConfig === config.id ? null : config.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    {editingDeductionConfig === config.id ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <Edit className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteDeductionConfig(config.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {editingDeductionConfig === config.id && (
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  {/* Percentage and Earning Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Percentage of Earnings (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={config.percentage ?? 0}
                        onChange={(e) => updateDeductionConfig(config.id, 'percentage', parseFloat(e.target.value) || 0)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={config.hasBands}
                      />
                      {config.hasBands && (
                        <p className="text-xs text-gray-500 mt-1">Percentage set per band below</p>
                      )}
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Based On
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={config.earningType}
                          readOnly
                          onClick={() => setShowEarningDropdown({ ...showEarningDropdown, [config.id]: true })}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer bg-white"
                        />
                        {showEarningDropdown[config.id] && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            <div className="p-2 border-b border-gray-200">
                              <input
                                type="text"
                                placeholder="Search earning type..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                autoFocus
                              />
                            </div>
                            {filteredEarningTypes.map((type) => (
                              <div
                                key={type}
                                onClick={() => {
                                  updateDeductionConfig(config.id, 'earningType', type);
                                  setShowEarningDropdown({ ...showEarningDropdown, [config.id]: false });
                                  setSearchTerm('');
                                }}
                                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                              >
                                {type}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bands Toggle */}
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.hasBands || false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          // Update both hasBands and bands in a single state update
                          setDeductionConfigs(deductionConfigs.map(c => {
                            if (c.id === config.id) {
                              if (!checked) {
                                return { ...c, hasBands: false, bands: [] };
                              } else {
                                // Initialize with first band
                                const firstBand = {
                                  id: Date.now().toString(),
                                  min: 0,
                                  max: null as number | null,
                                  percentage: c.percentage || 0
                                };
                                return { ...c, hasBands: true, bands: [firstBand] };
                              }
                            }
                            return c;
                          }));
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Use Bands (e.g., Tax Brackets)</span>
                    </label>
                  </div>

                  {/* Bands Configuration */}
                  {config.hasBands && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-1">Bands</h4>
                          <p className="text-xs text-gray-600">
                            Set up bands like tax brackets. First band starts from 0, subsequent bands start from previous band's max.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => addBand(config.id)}
                          className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Band
                        </button>
                      </div>
                      <div className="space-y-3">
                        {(!config.bands || config.bands.length === 0) ? (
                          <p className="text-sm text-gray-500 italic text-center py-4">No bands configured. Click "Add Band" to create one.</p>
                        ) : (
                          config.bands.map((band, index) => {
                            let bandDescription = '';
                            if (index === 0) {
                              if (band.max === null || band.max === undefined) {
                                bandDescription = `First ${(band.min || 0).toLocaleString()} and above`;
                              } else {
                                bandDescription = `First ${(band.min || 0).toLocaleString()} - ${band.max.toLocaleString()}`;
                              }
                            } else {
                              const prevBand = config.bands[index - 1];
                              if (band.max === null || band.max === undefined) {
                                bandDescription = `Above ${(band.min || 0).toLocaleString()}`;
                              } else {
                                bandDescription = `${(band.min || 0).toLocaleString()} - ${band.max.toLocaleString()}`;
                              }
                            }
                            
                            return (
                              <div key={band.id} className="bg-white p-4 rounded-lg border border-gray-200">
                                <div className="mb-3">
                                  <span className="text-sm font-medium text-gray-700">Band {index + 1}: </span>
                                  <span className="text-sm text-gray-600">{bandDescription}</span>
                                </div>
                                <div className="grid grid-cols-12 gap-2 items-end">
                                  <div className="col-span-3">
                                    <label className="text-xs text-gray-600 mb-1 block">Min Amount</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={band.min !== null && band.min !== undefined ? String(band.min) : '0'}
                                      onChange={(e) => updateBand(config.id, band.id, 'min', parseFloat(e.target.value) || 0)}
                                      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                      disabled={index > 0}
                                    />
                                  </div>
                                  <div className="col-span-3">
                                    <label className="text-xs text-gray-600 mb-1 block">Max Amount (leave empty for no limit)</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min={band.min ?? 0}
                                      value={band.max !== null && band.max !== undefined ? String(band.max) : ''}
                                      onChange={(e) => {
                                        const newMax = e.target.value ? parseFloat(e.target.value) : null;
                                        updateBand(config.id, band.id, 'max', newMax);
                                        // Update next band's min if it exists
                                        if (newMax !== null && config.bands && index < config.bands.length - 1) {
                                          const nextBand = config.bands[index + 1];
                                          if (nextBand && (nextBand.min ?? 0) <= newMax) {
                                            updateBand(config.id, nextBand.id, 'min', newMax);
                                          }
                                        }
                                      }}
                                      placeholder="No limit"
                                      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div className="col-span-4">
                                    <label className="text-xs text-gray-600 mb-1 block">Percentage (%) for this band</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      max="100"
                                      value={band.percentage ?? 0}
                                      onChange={(e) => updateBand(config.id, band.id, 'percentage', parseFloat(e.target.value) || 0)}
                                      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div className="col-span-2 flex items-end">
                                    <button
                                      type="button"
                                      onClick={() => deleteBand(config.id, band.id)}
                                      className="w-full p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                    >
                                      <Trash2 className="w-4 h-4 mx-auto" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Who Pays - Percentage Split */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Who Pays (Percentage of Deduction Amount)
                    </label>
                    <p className="text-xs text-gray-600 mb-3">
                      Specify the percentage of the total deduction amount paid by employer and employee. Example: For 12% NSSF where employer pays 5.5% of earnings, enter 45.8% (5.5/12 * 100) for employer and 54.2% (6.5/12 * 100) for employee.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Employee Percentage (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={config.paidBy?.employee ?? 0}
                          onChange={(e) => {
                            const employeePercent = parseFloat(e.target.value) || 0;
                            const employerPercent = 100 - employeePercent;
                            updateDeductionConfig(config.id, 'paidBy', {
                              employer: employerPercent >= 0 && employerPercent <= 100 ? employerPercent : config.paidBy?.employer ?? 0,
                              employee: employeePercent >= 0 && employeePercent <= 100 ? employeePercent : 0
                            });
                          }}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Employer Percentage (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={config.paidBy?.employer ?? 0}
                          onChange={(e) => {
                            const employerPercent = parseFloat(e.target.value) || 0;
                            const employeePercent = 100 - employerPercent;
                            updateDeductionConfig(config.id, 'paidBy', {
                              employer: employerPercent >= 0 && employerPercent <= 100 ? employerPercent : 0,
                              employee: employeePercent >= 0 && employeePercent <= 100 ? employeePercent : config.paidBy?.employee ?? 0
                            });
                          }}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Total: </span>
                      <span className={((config.paidBy?.employer ?? 0) + (config.paidBy?.employee ?? 0)) > 0 ? 'text-blue-600' : 'text-gray-400'}>
                        {((config.paidBy?.employer ?? 0) + (config.paidBy?.employee ?? 0)).toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* Limits */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Limits</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Limit Type</label>
                        <div className="flex space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`limitType-${config.id}`}
                              value="deduction"
                              checked={config.limits.type === 'deduction'}
                              onChange={(e) => updateDeductionConfig(config.id, 'limits', { ...config.limits, type: e.target.value as 'deduction' | 'earning' })}
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">On Deduction Amount</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`limitType-${config.id}`}
                              value="earning"
                              checked={config.limits.type === 'earning'}
                              onChange={(e) => updateDeductionConfig(config.id, 'limits', { ...config.limits, type: e.target.value as 'deduction' | 'earning' })}
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">On Earning Amount</span>
                          </label>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Lower Limit (leave empty for no limit)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={config.limits.lower || ''}
                            onChange={(e) => updateDeductionConfig(config.id, 'limits', { ...config.limits, lower: e.target.value ? parseFloat(e.target.value) : null })}
                            placeholder={config.limits.type === 'deduction' ? 'No lower limit on deduction amount' : 'No lower limit on earning amount'}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Upper Limit (leave empty for no limit)</label>
                          <input
                            type="number"
                            step="0.01"
                            min={config.limits.lower || 0}
                            value={config.limits.upper || ''}
                            onChange={(e) => updateDeductionConfig(config.id, 'limits', { ...config.limits, upper: e.target.value ? parseFloat(e.target.value) : null })}
                            placeholder={config.limits.type === 'deduction' ? 'No upper limit on deduction amount' : 'No upper limit on earning amount'}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save and Discard Buttons */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        // TODO: Save to database when database is configured
                        // For now, just collapse the card
                        setEditingDeductionConfig(null);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Discard changes - same as delete
                        deleteDeductionConfig(config.id);
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
