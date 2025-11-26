// src/services/staffService.ts

import { supabase } from '../supabaseClient';

// Staff interfaces
export interface StaffMember {
  id: number;
  full_name: string;
  employee_id: string;
  national_id: string | null;
  birthday: string | null;
  age: number | null;
  department_id: number | null;
  department_name: string | null;
  position: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  emergency_contact_1_name: string | null;
  emergency_contact_1_phone: string | null;
  emergency_contact_1_relationship: string | null;
  emergency_contact_2_name: string | null;
  emergency_contact_2_phone: string | null;
  emergency_contact_2_relationship: string | null;
  date_hired: string | null;
  status: 'Active' | 'On Leave' | 'Suspended' | 'Terminated' | 'Retired';
  date_of_termination: string | null;
  date_of_retirement: string | null;
  qualifications: string | null;
  basic_pay: number;
  gross_pay: number;
  net_pay: number;
  created_at: string;
  updated_at: string;
  // Custom fields will be added dynamically
  [key: string]: any;
}

export interface Department {
  id: number;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface StaffAllowance {
  id: number;
  staff_id: number;
  name: string;
  amount: number;
  created_at: string;
}

export interface StaffDeduction {
  id: number;
  staff_id: number;
  name: string;
  amount: number;
  deduction_type: 'Statutory' | 'Other';
  created_at: string;
}

export interface StaffSubmissionData {
  full_name: string;
  employee_id: string;
  national_id?: string | null;
  birthday?: string | null;
  department_id?: number | null;
  position?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  emergency_contact_1_name?: string | null;
  emergency_contact_1_phone?: string | null;
  emergency_contact_1_relationship?: string | null;
  emergency_contact_2_name?: string | null;
  emergency_contact_2_phone?: string | null;
  emergency_contact_2_relationship?: string | null;
  date_hired?: string | null;
  status: 'Active' | 'On Leave' | 'Suspended' | 'Terminated' | 'Retired';
  date_of_termination?: string | null;
  date_of_retirement?: string | null;
  qualifications?: string | null;
  basic_pay: number;
  allowances?: Array<{ name: string; amount: number }>;
  statutory_deductions?: Array<{ name: string; amount: number }>;
  other_deductions?: Array<{ name: string; amount: number }>;
  custom_fields?: Record<string, string>;
}

// Fetch all staff members with department join
export const fetchStaffMembers = async (): Promise<StaffMember[]> => {
  const { data, error } = await supabase
    .from('staff')
    .select(`
      *,
      departments:department_id (
        id,
        name
      )
    `)
    .order('full_name');

  if (error) {
    console.error('Error fetching staff members:', error);
    throw error;
  }

  return (data || []).map((staff: any) => ({
    ...staff,
    department_name: staff.departments?.name || null,
  }));
};

// Fetch a single staff member by ID
export const fetchStaffMember = async (id: number): Promise<StaffMember | null> => {
  const { data, error } = await supabase
    .from('staff')
    .select(`
      *,
      departments:department_id (
        id,
        name
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching staff member:', error);
    return null;
  }

  return {
    ...data,
    department_name: data.departments?.name || null,
  };
};

// Create a new staff member
export const createStaffMember = async (staffData: StaffSubmissionData): Promise<number> => {
  // Extract allowances and deductions
  const { allowances, statutory_deductions, other_deductions, custom_fields, ...coreData } = staffData;

  // Prepare custom fields for insertion (convert empty strings to null)
  const processedCustomFields: Record<string, any> = {};
  if (custom_fields) {
    Object.entries(custom_fields).forEach(([key, value]) => {
      processedCustomFields[key] = value === '' ? null : value;
    });
  }

  // Combine core data with custom fields
  const insertPayload = {
    ...coreData,
    ...processedCustomFields
  };

  console.log('🔵 [DEBUG] Creating staff member with payload:', insertPayload);

  // Insert staff data (core + custom fields)
  const { data, error } = await supabase
    .from('staff')
    .insert([insertPayload])
    .select('id')
    .single();

  if (error) {
    console.error('Error creating staff member:', JSON.stringify(error, null, 2));
    throw error;
  }

  const staffId = data.id;

  // Insert allowances
  if (allowances && allowances.length > 0) {
    const allowanceInserts = allowances.map(a => ({
      staff_id: staffId,
      name: a.name,
      amount: a.amount,
    }));

    const { error: allowanceError } = await supabase
      .from('staff_allowances')
      .insert(allowanceInserts);

    if (allowanceError) {
      console.error('Error creating allowances:', allowanceError);
    }
  }

  // Insert statutory deductions
  if (statutory_deductions && statutory_deductions.length > 0) {
    const statutoryInserts = statutory_deductions.map(d => ({
      staff_id: staffId,
      name: d.name,
      amount: d.amount,
      deduction_type: 'Statutory' as const,
    }));

    const { error: deductionError } = await supabase
      .from('staff_deductions')
      .insert(statutoryInserts);

    if (deductionError) {
      console.error('Error creating statutory deductions:', deductionError);
    }
  }

  // Insert other deductions
  if (other_deductions && other_deductions.length > 0) {
    const otherInserts = other_deductions.map(d => ({
      staff_id: staffId,
      name: d.name,
      amount: d.amount,
      deduction_type: 'Other' as const,
    }));

    const { error: deductionError } = await supabase
      .from('staff_deductions')
      .insert(otherInserts);

    if (deductionError) {
      console.error('Error creating other deductions:', deductionError);
    }
  }

  return staffId;
};

// Update an existing staff member
export const updateStaffMember = async (id: number, staffData: StaffSubmissionData): Promise<void> => {
  const { allowances, statutory_deductions, other_deductions, custom_fields, ...coreData } = staffData;

  // Prepare custom fields for update (convert empty strings to null)
  const processedCustomFields: Record<string, any> = {};
  if (custom_fields) {
    Object.entries(custom_fields).forEach(([key, value]) => {
      processedCustomFields[key] = value === '' ? null : value;
    });
  }

  // Combine core data with custom fields
  const updatePayload = {
    ...coreData,
    ...processedCustomFields
  };

  // Update staff data (core + custom fields)
  const { error } = await supabase
    .from('staff')
    .update(updatePayload)
    .eq('id', id);

  if (error) {
    console.error('Error updating staff member:', JSON.stringify(error, null, 2));
    throw error;
  }

  // Delete existing allowances and recreate
  await supabase.from('staff_allowances').delete().eq('staff_id', id);
  if (allowances && allowances.length > 0) {
    const allowanceInserts = allowances.map(a => ({
      staff_id: id,
      name: a.name,
      amount: a.amount,
    }));
    await supabase.from('staff_allowances').insert(allowanceInserts);
  }

  // Delete existing deductions and recreate
  await supabase.from('staff_deductions').delete().eq('staff_id', id);
  
  if (statutory_deductions && statutory_deductions.length > 0) {
    const statutoryInserts = statutory_deductions.map(d => ({
      staff_id: id,
      name: d.name,
      amount: d.amount,
      deduction_type: 'Statutory' as const,
    }));
    await supabase.from('staff_deductions').insert(statutoryInserts);
  }

  if (other_deductions && other_deductions.length > 0) {
    const otherInserts = other_deductions.map(d => ({
      staff_id: id,
      name: d.name,
      amount: d.amount,
      deduction_type: 'Other' as const,
    }));
    await supabase.from('staff_deductions').insert(otherInserts);
  }
};

// Delete staff member(s)
export const deleteStaffMembers = async (ids: number[]): Promise<void> => {
  const { error } = await supabase
    .from('staff')
    .delete()
    .in('id', ids);

  if (error) {
    console.error('Error deleting staff members:', error);
    throw error;
  }
};

// Fetch all departments
export const fetchDepartments = async (): Promise<Department[]> => {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('sort_order, name');

  if (error) {
    console.error('Error fetching departments:', error);
    throw error;
  }

  return data || [];
};

// Add a new department
export const addDepartment = async (name: string): Promise<Department> => {
  // Get max sort_order
  const { data: existing } = await supabase
    .from('departments')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1);

  const sortOrder = existing && existing.length > 0 ? (existing[0].sort_order || 0) + 1 : 0;

  const { data, error } = await supabase
    .from('departments')
    .insert([{ name, sort_order: sortOrder }])
    .select()
    .single();

  if (error) {
    console.error('Error adding department:', error);
    throw error;
  }

  return data;
};

// Update department name (this will cascade to staff records via foreign key)
export const updateDepartment = async (id: number, name: string): Promise<void> => {
  const { error } = await supabase
    .from('departments')
    .update({ name })
    .eq('id', id);

  if (error) {
    console.error('Error updating department:', error);
    throw error;
  }
};

// Delete a department
export const deleteDepartment = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from('departments')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting department:', error);
    throw error;
  }
};

// Fetch allowances for a staff member
export const fetchStaffAllowances = async (staffId: number): Promise<StaffAllowance[]> => {
  const { data, error } = await supabase
    .from('staff_allowances')
    .select('*')
    .eq('staff_id', staffId)
    .order('created_at');

  if (error) {
    console.error('Error fetching allowances:', error);
    return [];
  }

  return data || [];
};

// Fetch deductions for a staff member
export const fetchStaffDeductions = async (staffId: number): Promise<StaffDeduction[]> => {
  const { data, error } = await supabase
    .from('staff_deductions')
    .select('*')
    .eq('staff_id', staffId)
    .order('deduction_type, created_at');

  if (error) {
    console.error('Error fetching deductions:', error);
    return [];
  }

  return data || [];
};

