import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Eye, User, X, ChevronDown, Pencil } from 'lucide-react';
import { DropdownField } from '../Students/masterlist/DropdownField';
import { OptionsModal } from '../Students/masterlist/OptionsModal';

export const StaffInfo: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  
  // Placeholder data for departments (will be replaced with database later)
  const [departments, setDepartments] = useState([
    { id: 1, name: 'Science Department', sort_order: 0 },
    { id: 2, name: 'Mathematics Department', sort_order: 1 },
    { id: 3, name: 'English Department', sort_order: 2 },
    { id: 4, name: 'Administration', sort_order: 3 },
    { id: 5, name: 'Maintenance', sort_order: 4 },
  ]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | undefined>(undefined);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  
  // Salary state
  const [basicPay, setBasicPay] = useState<number>(0);
  const [allowances, setAllowances] = useState<Array<{ id: string; name: string; amount: number }>>([
    { id: '1', name: 'House Allowance', amount: 0 },
  ]);
  const [statutoryDeductions, setStatutoryDeductions] = useState<Array<{ id: string; name: string; amount: number }>>([
    { id: '1', name: 'SHIF', amount: 0 },
  ]);
  const [otherDeductions, setOtherDeductions] = useState<Array<{ id: string; name: string; amount: number }>>([]);
  
  // Custom fields state (placeholder)
  const [customFields, setCustomFields] = useState<Array<{ id: string; name: string; value: string }>>([]);
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  
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

  const staffMembers = [
    {
      id: 1,
      name: 'Dr. Sarah Johnson',
      employeeId: 'EMP001',
      department: 'Science Department',
      position: 'Head of Science',
      email: 'sarah.johnson@mgmacademy.edu',
      phone: '+1-234-567-8901',
      dateHired: '2020-08-15',
      salary: 75000,
      status: 'Active',
      address: '123 Oak Street, City',
      emergencyContact: 'John Johnson - +1-234-567-8902',
      qualifications: 'PhD in Chemistry, MSc in Education'
    },
    {
      id: 2,
      name: 'Michael Thompson',
      employeeId: 'EMP002',
      department: 'Mathematics Department',
      position: 'Senior Math Teacher',
      email: 'michael.thompson@mgmacademy.edu',
      phone: '+1-234-567-8903',
      dateHired: '2019-01-10',
      salary: 65000,
      status: 'Active',
      address: '456 Pine Avenue, City',
      emergencyContact: 'Lisa Thompson - +1-234-567-8904',
      qualifications: 'MSc in Mathematics, BEd'
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      employeeId: 'EMP003',
      department: 'Administration',
      position: 'School Secretary',
      email: 'emily.rodriguez@mgmacademy.edu',
      phone: '+1-234-567-8905',
      dateHired: '2021-03-01',
      salary: 45000,
      status: 'Active',
      address: '789 Maple Drive, City',
      emergencyContact: 'Carlos Rodriguez - +1-234-567-8906',
      qualifications: 'BA in Business Administration'
    }
  ];

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

  const StaffForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {selectedStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
          </h2>
          <button
            onClick={() => {
              setShowForm(false);
              setSelectedStaff(null);
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form className="space-y-6">
          {/* Basic Information */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue={selectedStaff?.name}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue={selectedStaff?.employeeId}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">National ID</label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter National ID"
                />
              </div>
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue={selectedStaff?.position}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue={selectedStaff?.email}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue={selectedStaff?.phone}
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                rows={2}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue={selectedStaff?.address}
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Relationship"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {/* Emergency Contact 2 */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">Emergency Contact 2</h4>
                <input
                  type="text"
                  placeholder="Name"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Relationship"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Salary Section */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Salary Information</h3>
            
            {/* Earnings Section */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-3">Earnings</h4>
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
                    <span className="text-xl font-bold text-blue-600">
                      Ksh. {grossPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Deductions Section */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Deductions</h4>
              
              {/* Statutory Deductions */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Statutory Deductions</label>
                  <button
                    type="button"
                    onClick={addStatutoryDeduction}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Deduction
                  </button>
                </div>
                <div className="space-y-2">
                  {statutoryDeductions.map((deduction) => (
                    <div key={deduction.id} className="flex gap-2">
                      <input
                        type="text"
                        value={deduction.name}
                        onChange={(e) => updateStatutoryDeduction(deduction.id, 'name', e.target.value)}
                        placeholder="Deduction name (e.g., SHIF)"
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={deduction.amount}
                        onChange={(e) => updateStatutoryDeduction(deduction.id, 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="Amount"
                        className="w-32 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => deleteStatutoryDeduction(deduction.id)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
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
                  <span className="text-xl font-bold text-green-600">
                    Ksh. {netPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Other Information */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Other Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Hired</label>
                <input
                  type="date"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue={selectedStaff?.dateHired}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Active</option>
                  <option>On Leave</option>
                  <option>Suspended</option>
                  <option>Terminated</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Qualifications</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue={selectedStaff?.qualifications}
              />
            </div>
          </div>

          {/* Custom Fields Section */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Custom Fields</h3>
              <button
                type="button"
                onClick={() => setShowAddFieldModal(true)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Custom Field
              </button>
            </div>
            <div className="space-y-3">
              {customFields.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No custom fields added</p>
              ) : (
                customFields.map((field) => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.name}</label>
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => setCustomFields(customFields.map(f => f.id === field.id ? { ...f, value: e.target.value } : f))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setSelectedStaff(null);
              }}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {selectedStaff ? 'Update' : 'Add'} Staff Member
            </button>
          </div>
        </form>
      </div>

      {/* Department Options Modal */}
      {showDepartmentModal && (
        <OptionsModal
          title="Departments"
          items={departments.map(d => ({ id: d.id, name: d.name, sort_order: d.sort_order }))}
          onAdd={async (name: string) => {
            // Placeholder - will connect to database later
            const newDept = { id: departments.length + 1, name, sort_order: departments.length };
            setDepartments([...departments, newDept]);
          }}
          onDelete={async (id: number) => {
            // Placeholder - will connect to database later
            setDepartments(departments.filter(d => d.id !== id));
          }}
          onClose={() => setShowDepartmentModal(false)}
          tableName="departments"
          onRefresh={() => {
            // Placeholder - will refresh from database later
          }}
        />
      )}

      {/* Add Custom Field Modal (Simplified) */}
      {showAddFieldModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Add Custom Field</h2>
              <button
                onClick={() => setShowAddFieldModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Field Name</label>
                <input
                  type="text"
                  placeholder="Enter field name"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      setCustomFields([...customFields, { id: Date.now().toString(), name: e.currentTarget.value, value: '' }]);
                      setShowAddFieldModal(false);
                    }
                  }}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddFieldModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Enter field name"]') as HTMLInputElement;
                    if (input?.value) {
                      setCustomFields([...customFields, { id: Date.now().toString(), name: input.value, value: '' }]);
                      setShowAddFieldModal(false);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Field
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 md:p-3 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-3 mb-6 md:mb-3">
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Total Staff</div>
            <div className="text-2xl font-bold text-gray-800">{staffMembers.length}</div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Active</div>
            <div className="text-2xl font-bold text-green-600">
              {staffMembers.filter(s => s.status === 'Active').length}
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Departments</div>
            <div className="text-2xl font-bold text-blue-600">5</div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Avg Salary</div>
            <div className="text-2xl font-bold text-purple-600">$61,667</div>
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
              onClick={() => setShowForm(true)}
              className="flex-shrink-0 bg-blue-600 text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
            >
              <Plus className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">Add Staff Member</span>
            </button>
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
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
                    Date Hired
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
                {staffMembers.map((staff) => (
                  <tr key={staff.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                          <div className="text-sm text-gray-500">{staff.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {staff.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {staff.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{staff.email}</div>
                        <div className="text-sm text-gray-500">{staff.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {staff.dateHired}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${staff.salary.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {staff.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-700">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStaff(staff);
                            setShowForm(true);
                          }}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && <StaffForm />}
      </div>
    </div>
  );
};