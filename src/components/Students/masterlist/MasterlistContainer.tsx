import React, { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // 👈 Caching logic
import { supabase } from '../../../supabaseClient'; // 👈 Supabase client for writes

// NOTE: Ensure these imports are correctly pointing to the fetch/mutation functions 
// you have defined in src/api/tables.ts
import { 
  fetchClasses, fetchStreams, fetchTeamColours, 
  addClass, updateClass, deleteClass, 
  addStream, updateStream, deleteStream, 
  addColour, updateColour, deleteColour
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
    .order('updated_at', { ascending: false, nullsLast: true });
    
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
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  
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

  // Handle student deletion
  const handleDeleteStudent = async (student: any) => {
    if (!confirm(`Are you sure you want to delete ${student.name}? This action cannot be undone.`)) {
      return;
    }

    setDeletingStudentId(student.admission_number);
    try {
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
    }
  };

  // Handle bulk deletion
  const handleBulkDelete = async (admissionNumbers: string[]) => {
    try {
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
    <div className="p-6 md:p-3 bg-gray-50 min-h-screen">
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