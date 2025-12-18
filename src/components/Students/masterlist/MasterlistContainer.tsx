import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // 👈 Caching logic
import { supabase } from '../../../supabaseClient'; // 👈 Supabase client for writes

// NOTE: Ensure these imports are correctly pointing to the fetch/mutation functions 
// you have defined in src/api/tables.ts
import { 
  fetchClasses, fetchStreams, fetchTeamColours, 
  addClass, updateClass, deleteClass, 
  addStream, updateStream, deleteStream, 
  addColour, updateColour, deleteColour,
  fetchAllergies, addAllergy, updateAllergy, deleteAllergy,
  fetchMedicalConditions, addMedicalCondition, updateMedicalCondition, deleteMedicalCondition,
  fetchEmergencyMedications, addEmergencyMedication, updateEmergencyMedication, deleteEmergencyMedication
} from '../../../api/tables';

import { SearchFilterBar } from './SearchFilterBar';
import { StudentTable } from './StudentTable';
import { StudentForm } from './StudentForm';
import { OptionsModal } from './OptionsModal';
import { AddFieldModal } from './AddFieldModal';
import { FilterModal, FilterState } from './FilterModal';
import { PaginationControls } from './PaginationControls';

// --- STUDENT FETCH FUNCTION (Replaced students.ts) ---
const fetchStudents = async () => {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      current_class:classes!current_class_id(name),
      stream:streams!stream_id(name),
      team_colour:team_colours!team_colour_id(name)
    `)
    .order('updated_at', { ascending: false, nullsFirst: false });
    
  if (error) throw new Error(error.message);
  return data;
};
// ------------------------------------------------------------------------

export const MasterlistContainer: React.FC = () => {
  const queryClient = useQueryClient(); // For cache invalidation/refetch
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [showAddField, setShowAddField] = useState(false);
  const [showClassesModal, setShowClassesModal] = useState(false);
  const [showStreamsModal, setShowStreamsModal] = useState(false);
  const [showColoursModal, setShowColoursModal] = useState(false);
  const [showAllergiesModal, setShowAllergiesModal] = useState(false);
  const [showMedicalConditionsModal, setShowMedicalConditionsModal] = useState(false);
  const [showEmergencyMedicationsModal, setShowEmergencyMedicationsModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Filter state - default status to "Active" to show only active students by default
  const [filters, setFilters] = useState<FilterState>({
    currentClass: '',
    classAdmittedTo: '',
    minAge: '',
    maxAge: '',
    stream: '',
    status: 'Active',
  });
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
    currentClass: '',
    classAdmittedTo: '',
    minAge: '',
    maxAge: '',
    stream: '',
    status: 'Active',
  });
  const [currentPage, setCurrentPage] = useState(0);
  const studentsPerPage = 50;
  
  // --- REACT QUERY DATA FETCHING (Caching Reads) ---
  
  // Helper function to calculate age from date of birth
  const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Fetch students list with TanStack Query
  const { data: allFilteredStudents = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: fetchStudents,
    select: (data) => {
      let filtered = data;
      
      // Apply search term filter
      if (searchTerm) {
        filtered = filtered.filter(s => 
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.admission_number?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Apply multiple filters
      if (appliedFilters.currentClass) {
        filtered = filtered.filter(s => s.current_class_id === parseInt(appliedFilters.currentClass));
      }
      
      if (appliedFilters.classAdmittedTo) {
        filtered = filtered.filter(s => s.class_admitted_to_id === parseInt(appliedFilters.classAdmittedTo));
      }
      
      if (appliedFilters.stream) {
        filtered = filtered.filter(s => s.stream_id === parseInt(appliedFilters.stream));
      }
      
      if (appliedFilters.status) {
        filtered = filtered.filter(s => s.status === appliedFilters.status);
      }
      
      // Apply age range filter
      if (appliedFilters.minAge || appliedFilters.maxAge) {
        filtered = filtered.filter(s => {
          const age = calculateAge(s.date_of_birth);
          const minAge = appliedFilters.minAge ? parseInt(appliedFilters.minAge) : 0;
          const maxAge = appliedFilters.maxAge ? parseInt(appliedFilters.maxAge) : 999;
          return age >= minAge && age <= maxAge;
        });
      }
      
      return filtered;
    },
  });

  // Calculate pagination
  const totalPages = Math.ceil(allFilteredStudents.length / studentsPerPage);
  const startIndex = currentPage * studentsPerPage;
  const endIndex = startIndex + studentsPerPage;
  const students = allFilteredStudents.slice(startIndex, endIndex);

  // Reset to page 0 when filters or search change
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, appliedFilters]);

  // Fetch dropdown lists using TanStack Query
  const { data: classesList = [] } = useQuery({ queryKey: ['classes'], queryFn: fetchClasses });
  const { data: streamsList = [] } = useQuery({ queryKey: ['streams'], queryFn: fetchStreams });
  const { data: teamColoursList = [] } = useQuery({ queryKey: ['team_colours'], queryFn: fetchTeamColours });
  const { data: allergiesList = [] } = useQuery({ queryKey: ['allergies'], queryFn: fetchAllergies });
  const { data: medicalConditionsList = [] } = useQuery({ queryKey: ['medical_conditions'], queryFn: fetchMedicalConditions });
  const { data: emergencyMedicationsList = [] } = useQuery({ queryKey: ['emergency_medications'], queryFn: fetchEmergencyMedications });
  
  // --- STUDENT SUBMISSION HANDLER (Original Working Write Logic + Cache Invalidation) ---

  const handleFormSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      // Helper function to handle empty fields as delete action when updating
      const processFieldValue = (fieldValue: any, originalValue: any) => {
        // If updating and field is now empty but had a value before, explicitly set to null
        if (selectedStudent && !fieldValue && originalValue) {
          return null;
        }
        // Otherwise return the field value (or null if empty)
        return fieldValue || null;
      };

      // Check if admission_number is being changed (cascade update scenario)
      const isAdmissionNumberChanging = selectedStudent && 
        selectedStudent.admission_number !== values.admissionNumber;
      
      if (isAdmissionNumberChanging) {
        // Check for related records to inform user
        const [invoicesResult, paymentsResult] = await Promise.all([
          supabase.from('invoices').select('invoice_number', { count: 'exact' }).eq('admission_number', selectedStudent.admission_number),
          supabase.from('payments').select('id', { count: 'exact' }).eq('admission_number', selectedStudent.admission_number)
        ]);

        // Check balance_brought_forward separately (table might not exist)
        let bbfCount = 0;
        try {
          const bbfResult = await supabase
            .from('balance_brought_forward')
            .select('id', { count: 'exact' })
            .eq('admission_number', selectedStudent.admission_number);
          bbfCount = bbfResult.count || 0;
        } catch (err) {
          // Table might not exist, ignore error
          bbfCount = 0;
        }

        const invoiceCount = invoicesResult.count || 0;
        const paymentCount = paymentsResult.count || 0;
        const totalRelatedRecords = invoiceCount + paymentCount + bbfCount;

        if (totalRelatedRecords > 0) {
          const relatedRecords = [];
          if (invoiceCount > 0) relatedRecords.push(`${invoiceCount} invoice(s)`);
          if (paymentCount > 0) relatedRecords.push(`${paymentCount} payment(s)`);
          if (bbfCount > 0) relatedRecords.push(`${bbfCount} balance brought forward record(s)`);
          
          const message = `You are changing the admission number from "${selectedStudent.admission_number}" to "${values.admissionNumber}".\n\n` +
            `This student has ${totalRelatedRecords} related record(s): ${relatedRecords.join(', ')}.\n\n` +
            `All related records will be automatically updated to use the new admission number. Continue?`;
          
          if (!confirm(message)) {
            setIsSubmitting(false);
            return;
          }
        }
      }

      const payload = {
      admission_number: values.admissionNumber,
      name: values.name,
      date_of_birth: processFieldValue(values.dateOfBirth, selectedStudent?.date_of_birth),
      date_of_admission: processFieldValue(values.dateOfAdmission, selectedStudent?.date_of_admission),
      gender: processFieldValue(values.gender, selectedStudent?.gender),
      class_admitted_to_id: processFieldValue(values.class_admitted_to_id, selectedStudent?.class_admitted_to_id),
      current_class_id: processFieldValue(values.current_class_id, selectedStudent?.current_class_id),
      stream_id: processFieldValue(values.stream_id, selectedStudent?.stream_id),
      team_colour_id: processFieldValue(values.team_colour_id, selectedStudent?.team_colour_id),
      transport_zone_id: processFieldValue(values.transport_zone_id, selectedStudent?.transport_zone_id),
      transport_type_id: processFieldValue(values.transport_type_id, selectedStudent?.transport_type_id),
      boarding_house_id: processFieldValue(values.boarding_house_id, selectedStudent?.boarding_house_id),
      boarding_room_id: processFieldValue(values.boarding_room_id, selectedStudent?.boarding_room_id),
      accommodation_type_id: processFieldValue(values.accommodation_type_id, selectedStudent?.accommodation_type_id),
      status: values.status,
      // If status is Inactive, withdrawal_date must be set (default to today if not provided)
      withdrawal_date: values.status === 'Inactive' 
        ? (values.withdrawalDate || new Date().toISOString().split('T')[0])
        : processFieldValue(values.withdrawalDate, selectedStudent?.withdrawal_date),
      father_name: processFieldValue(values.fatherName, selectedStudent?.father_name),
      father_phone: processFieldValue(values.fatherPhone, selectedStudent?.father_phone),
      father_email: processFieldValue(values.fatherEmail, selectedStudent?.father_email),
      mother_name: processFieldValue(values.motherName, selectedStudent?.mother_name),
      mother_phone: processFieldValue(values.motherPhone, selectedStudent?.mother_phone),
      mother_email: processFieldValue(values.motherEmail, selectedStudent?.mother_email),
      emergency_contact: processFieldValue(values.emergencyContact, selectedStudent?.emergency_contact),
      emergency_relationship: processFieldValue(values.emergencyRelationship, selectedStudent?.emergency_relationship),
      address: processFieldValue(values.address, selectedStudent?.address),
    };

    // Merge custom fields: expects values.custom_fields to be Record<string,string>
    const customFields: Record<string, string> = values.custom_fields || {};
    const documents: Record<string, string> = values.documents || {};
    const dbPayload: Record<string, any> = { ...payload };

    for (const [fieldId, val] of Object.entries(customFields)) {
      // If updating and custom field is now empty but had a value before, set to null (delete action)
      if (selectedStudent && !val && selectedStudent[fieldId]) {
        dbPayload[fieldId] = null;
      } else if (val) {
        // Only add non-empty values
        dbPayload[fieldId] = val;
      }
    }

    // Add documents as JSONB field
    dbPayload.documents = documents;

    // Get admission number (for new students, it's in values; for updates, use selectedStudent)
    const admissionNumber = selectedStudent?.admission_number || values.admissionNumber;

    // Attempt to write normalized columns; if schema error occurs, fallback to JSON column
    try {
      if (selectedStudent) {
        const { data, error } = await supabase
          .from('students')
          .update(dbPayload)
          .eq('admission_number', selectedStudent.admission_number);
        if (error) throw error;
        else if (data) console.log('Updated student', data);
      } else {
        const { data, error } = await supabase.from('students').insert([dbPayload]);
        if (error) throw error;
        else if (data) console.log('Inserted student', data);
      }

      // Handle medical data (allergies, medical conditions, emergency medications)
      // Parse medical data from form values
      let allergiesData: any[] = [];
      let medicalConditionsData: any[] = [];
      let emergencyMedicationsData: any[] = [];

      try {
        if (values.allergies_data) {
          allergiesData = typeof values.allergies_data === 'string' 
            ? JSON.parse(values.allergies_data) 
            : values.allergies_data;
        }
      } catch (e) {
        console.error('Error parsing allergies data:', e);
      }

      try {
        if (values.medical_conditions_data) {
          medicalConditionsData = typeof values.medical_conditions_data === 'string'
            ? JSON.parse(values.medical_conditions_data)
            : values.medical_conditions_data;
        }
      } catch (e) {
        console.error('Error parsing medical conditions data:', e);
      }

      try {
        if (values.emergency_medications_data) {
          emergencyMedicationsData = typeof values.emergency_medications_data === 'string'
            ? JSON.parse(values.emergency_medications_data)
            : values.emergency_medications_data;
        }
      } catch (e) {
        console.error('Error parsing emergency medications data:', e);
      }

      // Save medical data to junction tables
      // 1. Delete existing records for this student
      await Promise.all([
        supabase.from('student_allergies').delete().eq('admission_number', admissionNumber),
        supabase.from('student_medical_conditions').delete().eq('admission_number', admissionNumber),
        supabase.from('student_emergency_medications').delete().eq('admission_number', admissionNumber),
      ]);

      // 2. Insert new records
      const allergiesToInsert = allergiesData
        .filter((entry: any) => entry.itemId) // Only entries with selected item
        .map((entry: any) => ({
          admission_number: admissionNumber,
          allergy_id: entry.itemId,
          notes: entry.notes || null,
        }));

      const conditionsToInsert = medicalConditionsData
        .filter((entry: any) => entry.itemId)
        .map((entry: any) => ({
          admission_number: admissionNumber,
          medical_condition_id: entry.itemId,
          notes: entry.notes || null,
        }));

      const medicationsToInsert = emergencyMedicationsData
        .filter((entry: any) => entry.itemId)
        .map((entry: any) => ({
          admission_number: admissionNumber,
          emergency_medication_id: entry.itemId,
          notes: entry.notes || null,
        }));

      // Insert in parallel
      const insertPromises = [];
      if (allergiesToInsert.length > 0) {
        insertPromises.push(supabase.from('student_allergies').insert(allergiesToInsert));
      }
      if (conditionsToInsert.length > 0) {
        insertPromises.push(supabase.from('student_medical_conditions').insert(conditionsToInsert));
      }
      if (medicationsToInsert.length > 0) {
        insertPromises.push(supabase.from('student_emergency_medications').insert(medicationsToInsert));
      }

      if (insertPromises.length > 0) {
        const insertResults = await Promise.all(insertPromises);
        const errors = insertResults.filter(result => result.error).map(result => result.error);
        if (errors.length > 0) {
          console.error('Error inserting medical data:', errors);
          // Don't throw - student was saved, medical data is secondary
        }
      }

    } catch (err: any) {
      // Fallback on missing column or schema cache issues: write core payload and custom_fields JSON
      if (err?.code === 'PGRST204' || /Could not find the 'custom_/.test(err?.message || '')) {
        const safePayload = { ...payload, custom_fields: customFields };
        try {
          if (selectedStudent) {
            const { data, error } = await supabase
              .from('students')
              .update(safePayload)
              .eq('admission_number', selectedStudent.admission_number);
            if (error) console.error('Update fallback error', error);
            else if (data) console.log('Updated student (fallback)', data);
          } else {
            const { data, error } = await supabase.from('students').insert([safePayload]);
            if (error) console.error('Insert fallback error', error);
            else if (data) console.log('Inserted student (fallback)', data);
          }
        } catch (fallbackErr) {
          console.error('Fallback write failed', fallbackErr);
        }
      } else {
        // Using your original console.error call
        console.error('Write failed', err);
      }
    }

      // 🛑 THE CACHING FIX: Invalidate the students cache to force a background refetch
      // This replaces the slow 'await fetchAll()' call from the original component.
      queryClient.invalidateQueries({ queryKey: ['students'] });
      
      setShowForm(false);
      setSelectedStudent(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle student deletion with cascade delete warning
  const handleDeleteStudent = async (student: any) => {
    // First, check for related records
    const [invoicesResult, paymentsResult] = await Promise.all([
      supabase.from('invoices').select('invoice_number', { count: 'exact' }).eq('admission_number', student.admission_number),
      supabase.from('payments').select('id', { count: 'exact' }).eq('admission_number', student.admission_number)
    ]);

    // Check balance_brought_forward separately (table might not exist)
    let bbfCount = 0;
    try {
      const bbfResult = await supabase
        .from('balance_brought_forward')
        .select('id', { count: 'exact' })
        .eq('admission_number', student.admission_number);
      bbfCount = bbfResult.count || 0;
    } catch (err) {
      // Table might not exist, ignore error
      bbfCount = 0;
    }

    const invoiceCount = invoicesResult.count || 0;
    const paymentCount = paymentsResult.count || 0;
    const totalRelatedRecords = invoiceCount + paymentCount + bbfCount;

    // Build warning message
    let warningMessage = `Are you sure you want to delete ${student.name} (${student.admission_number})?\n\n`;
    
    if (totalRelatedRecords > 0) {
      const relatedRecords = [];
      if (invoiceCount > 0) relatedRecords.push(`${invoiceCount} invoice(s)`);
      if (paymentCount > 0) relatedRecords.push(`${paymentCount} payment(s)`);
      if (bbfCount > 0) relatedRecords.push(`${bbfCount} balance brought forward record(s)`);
      
      warningMessage += `⚠️ WARNING: This student has ${totalRelatedRecords} related record(s) that will also be deleted:\n`;
      warningMessage += `   - ${relatedRecords.join('\n   - ')}\n\n`;
      warningMessage += `This action cannot be undone. All associated records will be permanently deleted.`;
    } else {
      warningMessage += `This action cannot be undone.`;
    }

    if (!confirm(warningMessage)) {
      return;
    }

    setDeletingStudentId(student.admission_number);
    setIsDeleting(true);
    try {
      // Delete related records first (for tables without CASCADE FK)
      // Invoices don't have FK constraint, so delete manually
      if (invoiceCount > 0) {
        // Get all invoice numbers for this student
        const { data: invoices } = await supabase
          .from('invoices')
          .select('invoice_number')
          .eq('admission_number', student.admission_number);
        
        if (invoices && invoices.length > 0) {
          const invoiceNumbers = invoices.map(inv => inv.invoice_number);
          
          // Delete payment_allocations first (they reference invoices)
          for (const invoiceNumber of invoiceNumbers) {
            await supabase
              .from('payment_allocations')
              .delete()
              .eq('invoice_number', invoiceNumber);
          }
          
          // Delete invoice line items
          for (const invoiceNumber of invoiceNumbers) {
            await supabase
              .from('invoice_line_items')
              .delete()
              .eq('invoice_number', invoiceNumber);
          }
          
          // Then delete invoices
          await supabase
            .from('invoices')
            .delete()
            .eq('admission_number', student.admission_number);
        }
      }

      // Delete balance_brought_forward records (if no FK CASCADE)
      if (bbfCount > 0) {
        try {
          await supabase
            .from('balance_brought_forward')
            .delete()
            .eq('admission_number', student.admission_number);
        } catch (err) {
          // Table might not exist, ignore error
          console.log('Could not delete balance_brought_forward records (table may not exist)');
        }
      }

      // Delete student (payments will be deleted automatically via CASCADE FK)
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('admission_number', student.admission_number);

      if (error) {
        console.error('Error deleting student:', error);
        alert('Failed to delete student. Please try again.');
      } else {
        // Invalidate cache to refresh the list
        queryClient.invalidateQueries({ queryKey: ['students'] });
      }
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete student. Please try again.');
    } finally {
      setDeletingStudentId(null);
      setIsDeleting(false);
    }
  };

  // Handle bulk deletion with cascade delete warning
  const handleBulkDelete = async (admissionNumbers: string[]) => {
    // Check for related records across all selected students
    const [invoicesResult, paymentsResult] = await Promise.all([
      supabase.from('invoices').select('admission_number', { count: 'exact' }).in('admission_number', admissionNumbers),
      supabase.from('payments').select('admission_number', { count: 'exact' }).in('admission_number', admissionNumbers)
    ]);

    // Check balance_brought_forward separately (table might not exist)
    let bbfCount = 0;
    try {
      const bbfResult = await supabase
        .from('balance_brought_forward')
        .select('admission_number', { count: 'exact' })
        .in('admission_number', admissionNumbers);
      bbfCount = bbfResult.count || 0;
    } catch (err) {
      // Table might not exist, ignore error
      bbfCount = 0;
    }

    const invoiceCount = invoicesResult.count || 0;
    const paymentCount = paymentsResult.count || 0;
    const totalRelatedRecords = invoiceCount + paymentCount + bbfCount;

    // Build warning message
    let warningMessage = `Are you sure you want to delete ${admissionNumbers.length} student(s)?\n\n`;
    
    if (totalRelatedRecords > 0) {
      const relatedRecords = [];
      if (invoiceCount > 0) relatedRecords.push(`${invoiceCount} invoice(s)`);
      if (paymentCount > 0) relatedRecords.push(`${paymentCount} payment(s)`);
      if (bbfCount > 0) relatedRecords.push(`${bbfCount} balance brought forward record(s)`);
      
      warningMessage += `⚠️ WARNING: These students have ${totalRelatedRecords} related record(s) that will also be deleted:\n`;
      warningMessage += `   - ${relatedRecords.join('\n   - ')}\n\n`;
      warningMessage += `This action cannot be undone. All associated records will be permanently deleted.`;
    } else {
      warningMessage += `This action cannot be undone.`;
    }

    if (!confirm(warningMessage)) {
      return;
    }

    setIsDeleting(true);
    try {
      // Delete related records first (for tables without CASCADE FK)
      // Invoices don't have FK constraint, so delete manually
      if (invoiceCount > 0) {
        // Get all invoice numbers for these students
        const { data: invoices } = await supabase
          .from('invoices')
          .select('invoice_number')
          .in('admission_number', admissionNumbers);
        
        if (invoices && invoices.length > 0) {
          const invoiceNumbers = invoices.map(inv => inv.invoice_number);
          
          // Delete payment_allocations first (they reference invoices)
          for (const invoiceNumber of invoiceNumbers) {
            await supabase
              .from('payment_allocations')
              .delete()
              .eq('invoice_number', invoiceNumber);
          }
          
          // Delete invoice line items
          for (const invoiceNumber of invoiceNumbers) {
            await supabase
              .from('invoice_line_items')
              .delete()
              .eq('invoice_number', invoiceNumber);
          }
          
          // Then delete invoices
          await supabase
            .from('invoices')
            .delete()
            .in('admission_number', admissionNumbers);
        }
      }

      // Delete balance_brought_forward records (if no FK CASCADE)
      if (bbfCount > 0) {
        try {
          await supabase
            .from('balance_brought_forward')
            .delete()
            .in('admission_number', admissionNumbers);
        } catch (err) {
          // Table might not exist, ignore error
          console.log('Could not delete balance_brought_forward records (table may not exist)');
        }
      }

      // Delete students (payments will be deleted automatically via CASCADE FK)
      const { error } = await supabase
        .from('students')
        .delete()
        .in('admission_number', admissionNumbers);

      if (error) {
        console.error('Error bulk deleting students:', error);
        alert('Failed to delete students. Please try again.');
      } else {
        // Invalidate cache to refresh the list
        queryClient.invalidateQueries({ queryKey: ['students'] });
      }
    } catch (err) {
      console.error('Bulk delete failed:', err);
      alert('Failed to delete students. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // --- DROPDOWN MODAL HANDLERS (Mutations with Caching) ---

  // Wrapper for Add/Delete operations that invalidates the specific list's cache
  // This replaces the direct calls (addClass/deleteClass, etc.) followed by fetchAll()
  const handleMutationWrapper = async (mutationFn: (nameOrId: any) => Promise<any>, key: string, nameOrId: any) => {
    try {
      await mutationFn(nameOrId);
      // Invalidate the cache for the modified list to trigger a refetch
      queryClient.invalidateQueries({ queryKey: [key] });
    } catch (e) {
      console.error(`Error mutating ${key}:`, e);
    }
  };

  const addClassHandler = (name: string) => handleMutationWrapper(addClass, 'classes', name);
  const editClassHandler = async (id: number, newName: string) => {
    try {
      await updateClass(id, newName);
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    } catch (error: any) {
      console.error('Error updating class:', error);
      alert(error.message || 'Failed to update class');
    }
  };
  const deleteClassHandler = async (id: number) => {
    try {
      await deleteClass(id);
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    } catch (error: any) {
      console.error('Error deleting class:', error);
      alert(error.message || 'Failed to delete class. This class may be in use by existing students.');
    }
  };
  
  const addStreamHandler = (name: string) => handleMutationWrapper(addStream, 'streams', name);
  const editStreamHandler = async (id: number, newName: string) => {
    try {
      await updateStream(id, newName);
      queryClient.invalidateQueries({ queryKey: ['streams'] });
    } catch (error: any) {
      console.error('Error updating stream:', error);
      alert(error.message || 'Failed to update stream');
    }
  };
  const deleteStreamHandler = async (id: number) => {
    try {
      await deleteStream(id);
      queryClient.invalidateQueries({ queryKey: ['streams'] });
    } catch (error: any) {
      console.error('Error deleting stream:', error);
      alert(error.message || 'Failed to delete stream. This stream may be in use by existing students.');
    }
  };
  
  const addColourHandler = (name: string) => handleMutationWrapper(addColour, 'team_colours', name);
  const editColourHandler = async (id: number, newName: string) => {
    try {
      await updateColour(id, newName);
      queryClient.invalidateQueries({ queryKey: ['team_colours'] });
    } catch (error: any) {
      console.error('Error updating team colour:', error);
      alert(error.message || 'Failed to update team colour');
    }
  };
  const deleteColourHandler = async (id: number) => {
    try {
      await deleteColour(id);
      queryClient.invalidateQueries({ queryKey: ['team_colours'] });
    } catch (error: any) {
      console.error('Error deleting team colour:', error);
      alert(error.message || 'Failed to delete team colour. This team colour may be in use by existing students.');
    }
  };

  // --- Medical Dropdowns: Allergies ---
  const addAllergyHandler = (name: string) => handleMutationWrapper(addAllergy, 'allergies', name);
  const editAllergyHandler = async (id: number, newName: string) => {
    try {
      await updateAllergy(id, newName);
      queryClient.invalidateQueries({ queryKey: ['allergies'] });
    } catch (error: any) {
      console.error('Error updating allergy:', error);
      alert(error.message || 'Failed to update allergy');
    }
  };
  const deleteAllergyHandler = async (id: number) => {
    try {
      await deleteAllergy(id);
      queryClient.invalidateQueries({ queryKey: ['allergies'] });
    } catch (error: any) {
      console.error('Error deleting allergy:', error);
      alert(error.message || 'Failed to delete allergy. This allergy may be in use by existing students.');
    }
  };

  // --- Medical Dropdowns: Medical Conditions ---
  const addMedicalConditionHandler = (name: string) => handleMutationWrapper(addMedicalCondition, 'medical_conditions', name);
  const editMedicalConditionHandler = async (id: number, newName: string) => {
    try {
      await updateMedicalCondition(id, newName);
      queryClient.invalidateQueries({ queryKey: ['medical_conditions'] });
    } catch (error: any) {
      console.error('Error updating medical condition:', error);
      alert(error.message || 'Failed to update medical condition');
    }
  };
  const deleteMedicalConditionHandler = async (id: number) => {
    try {
      await deleteMedicalCondition(id);
      queryClient.invalidateQueries({ queryKey: ['medical_conditions'] });
    } catch (error: any) {
      console.error('Error deleting medical condition:', error);
      alert(error.message || 'Failed to delete medical condition. This condition may be in use by existing students.');
    }
  };

  // --- Medical Dropdowns: Emergency Medications ---
  const addEmergencyMedicationHandler = (name: string) => handleMutationWrapper(addEmergencyMedication, 'emergency_medications', name);
  const editEmergencyMedicationHandler = async (id: number, newName: string) => {
    try {
      await updateEmergencyMedication(id, newName);
      queryClient.invalidateQueries({ queryKey: ['emergency_medications'] });
    } catch (error: any) {
      console.error('Error updating emergency medication:', error);
      alert(error.message || 'Failed to update emergency medication');
    }
  };
  const deleteEmergencyMedicationHandler = async (id: number) => {
    try {
      await deleteEmergencyMedication(id);
      queryClient.invalidateQueries({ queryKey: ['emergency_medications'] });
    } catch (error: any) {
      console.error('Error deleting emergency medication:', error);
      alert(error.message || 'Failed to delete emergency medication. This medication may be in use by existing students.');
    }
  };

  // --- FILTER HANDLERS ---
  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setShowFilterModal(false);
  };

  const handleClearFilters = () => {
    const defaultFilters: FilterState = {
      currentClass: '',
      classAdmittedTo: '',
      minAge: '',
      maxAge: '',
      stream: '',
      status: 'Active', // Default to showing only active students
    };
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  };

  // Check if any filters are active (excluding default status="Active")
  const hasActiveFilters = Object.entries(appliedFilters).some(([key, value]) => {
    if (key === 'status') {
      return value !== '' && value !== 'Active'; // Don't count default "Active" as an active filter
    }
    return value !== '';
  });

  // Display loading state for primary data
  if (isLoadingStudents) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          </div>
          <p className="text-gray-600 text-lg font-medium">Loading students...</p>
          <p className="text-gray-400 text-sm mt-2">Please wait while we fetch the data</p>
        </div>
      </div>
    );
  }

  // --- RENDER (Using React Query's data variables) ---
  return (
    <div className="p-6 md:p-3 bg-gray-50 min-h-screen relative">
      {/* Loading Overlay for Deletions */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center space-y-4 shadow-xl">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <div className="text-center">
              <p className="text-gray-900 text-lg font-medium">Deleting student(s)...</p>
              <p className="text-gray-600 text-sm mt-2">This may take a moment while we remove all associated records.</p>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto">
        
        {/* Search & Filters */}
        <SearchFilterBar
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          onAddStudent={() => {
            setSelectedStudent(null);
            setShowForm(true);
          }}
          onFilterClick={() => setShowFilterModal(true)}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Students Table */}
        <StudentTable
          students={students} // 👈 Using data from useQuery (paginated)
          onEdit={(student) => {
            setSelectedStudent(student);
            setShowForm(true);
          }}
          onDelete={handleDeleteStudent}
          onBulkDelete={handleBulkDelete}
          deletingStudentId={deletingStudentId}
        />

        {/* Pagination Controls */}
        {allFilteredStudents.length > studentsPerPage && (
          <PaginationControls
            page={currentPage}
            totalPages={totalPages}
            totalRecords={allFilteredStudents.length}
            onPageChange={setCurrentPage}
          />
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <StudentForm
            selectedStudent={selectedStudent}
            classesList={classesList} // 👈 Using data from useQuery
            streamsList={streamsList} // 👈 Using data from useQuery
            teamColoursList={teamColoursList} // 👈 Using data from useQuery
            onSubmit={handleFormSubmit} // 👈 Using the working write logic
            onCancel={() => {
              setShowForm(false);
              setSelectedStudent(null);
            }}
            onOpenClassesModal={() => setShowClassesModal(true)}
            onOpenStreamsModal={() => setShowStreamsModal(true)}
            onOpenColoursModal={() => setShowColoursModal(true)}
            onOpenAllergiesModal={() => setShowAllergiesModal(true)}
            onOpenMedicalConditionsModal={() => setShowMedicalConditionsModal(true)}
            onOpenEmergencyMedicationsModal={() => setShowEmergencyMedicationsModal(true)}
            onShowAddField={() => setShowAddField(true)}
            onRefreshStudents={() => queryClient.invalidateQueries({ queryKey: ['students'] })}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Add Custom Field Modal */}
        {showAddField && (
          <AddFieldModal
            onAddField={async () => {
              /* keep existing behavior */
            }}
            onClose={() => setShowAddField(false)}
          />
        )}

        {/* Options Modals */}
        {showClassesModal && (
          <OptionsModal
            title="Classes"
            items={classesList}
            onAdd={addClassHandler} // 👈 Using caching mutation wrapper
            onEdit={editClassHandler}
            onDelete={deleteClassHandler} // 👈 Using caching mutation wrapper
            onClose={() => setShowClassesModal(false)}
            tableName="classes"
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ['classes'] })}
          />
        )}
        {showStreamsModal && (
          <OptionsModal
            title="Streams"
            items={streamsList}
            onAdd={addStreamHandler} // 👈 Using caching mutation wrapper
            onEdit={editStreamHandler}
            onDelete={deleteStreamHandler} // 👈 Using caching mutation wrapper
            onClose={() => setShowStreamsModal(false)}
            tableName="streams"
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ['streams'] })}
          />
        )}
        {showColoursModal && (
          <OptionsModal
            title="Team Colours"
            items={teamColoursList}
            onAdd={addColourHandler} // 👈 Using caching mutation wrapper
            onEdit={editColourHandler}
            onDelete={deleteColourHandler} // 👈 Using caching mutation wrapper
            onClose={() => setShowColoursModal(false)}
            tableName="team_colours"
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ['team_colours'] })}
          />
        )}
        {showAllergiesModal && (
          <OptionsModal
            title="Allergies"
            items={allergiesList}
            onAdd={addAllergyHandler}
            onEdit={editAllergyHandler}
            onDelete={deleteAllergyHandler}
            onClose={() => setShowAllergiesModal(false)}
            tableName="allergies"
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ['allergies'] })}
          />
        )}
        {showMedicalConditionsModal && (
          <OptionsModal
            title="Medical Conditions"
            items={medicalConditionsList}
            onAdd={addMedicalConditionHandler}
            onEdit={editMedicalConditionHandler}
            onDelete={deleteMedicalConditionHandler}
            onClose={() => setShowMedicalConditionsModal(false)}
            tableName="medical_conditions"
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ['medical_conditions'] })}
          />
        )}
        {showEmergencyMedicationsModal && (
          <OptionsModal
            title="Emergency Medications"
            items={emergencyMedicationsList}
            onAdd={addEmergencyMedicationHandler}
            onEdit={editEmergencyMedicationHandler}
            onDelete={deleteEmergencyMedicationHandler}
            onClose={() => setShowEmergencyMedicationsModal(false)}
            tableName="emergency_medications"
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ['emergency_medications'] })}
          />
        )}

        {/* Filter Modal */}
        {showFilterModal && (
          <FilterModal
            filters={filters}
            onFiltersChange={setFilters}
            onClose={() => setShowFilterModal(false)}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
            classesList={classesList}
            streamsList={streamsList}
          />
        )}
      </div>
    </div>
  );
};