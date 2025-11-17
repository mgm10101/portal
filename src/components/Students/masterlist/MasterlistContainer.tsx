import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // 👈 Caching logic
import { supabase } from '../../../supabaseClient'; // 👈 Supabase client for writes

// NOTE: Ensure these imports are correctly pointing to the fetch/mutation functions 
// you have defined in src/api/tables.ts
import { 
  fetchClasses, fetchStreams, fetchTeamColours, 
  addClass, deleteClass, addStream, deleteStream, 
  addColour, deleteColour
} from '../../../api/tables';

import { SearchFilterBar } from './SearchFilterBar';
import { StudentTable } from './StudentTable';
import { StudentForm } from './StudentForm';
import { OptionsModal } from './OptionsModal';
import { AddFieldModal } from './AddFieldModal';

// --- STUDENT FETCH FUNCTION (Replaced students.ts) ---
const fetchStudents = async () => {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      current_class:classes!current_class_id(name),
      stream:streams!stream_id(name),
      team_colour:team_colours!team_colour_id(name)
    `);
    
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
  
  // --- REACT QUERY DATA FETCHING (Caching Reads) ---
  
  // Fetch students list with TanStack Query
  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: fetchStudents,
    select: (data) => data.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())),
  });

  // Fetch dropdown lists using TanStack Query
  const { data: classesList = [] } = useQuery({ queryKey: ['classes'], queryFn: fetchClasses });
  const { data: streamsList = [] } = useQuery({ queryKey: ['streams'], queryFn: fetchStreams });
  const { data: teamColoursList = [] } = useQuery({ queryKey: ['team_colours'], queryFn: fetchTeamColours });
  
  // --- STUDENT SUBMISSION HANDLER (Original Working Write Logic + Cache Invalidation) ---

  const handleFormSubmit = async (values: any) => {
    const payload = {
      admission_number: values.admissionNumber,
      name: values.name,
      date_of_birth: values.dateOfBirth,
      date_of_admission: values.dateOfAdmission,
      class_admitted_to_id: values.class_admitted_to_id,
      current_class_id: values.current_class_id,
      stream_id: values.stream_id,
      team_colour_id: values.team_colour_id,
      status: values.status,
      withdrawal_date: values.withdrawalDate || null,
      father_name: values.fatherName,
      father_phone: values.fatherPhone,
      father_email: values.fatherEmail,
      mother_name: values.motherName,
      mother_phone: values.motherPhone,
      mother_email: values.motherEmail,
      emergency_contact: values.emergencyContact,
      emergency_relationship: values.emergencyRelationship,
      address: values.address,
      birth_certificate_status: values.birthCertificateStatus,
      parents_id_status: values.parentsIdStatus,
      immunization_records_status: values.immunizationRecordsStatus,
      passport_photos_status: values.passportPhotosStatus,
      allergies: values.allergies,
      medical_conditions: values.medicalConditions,
    };

    // Merge custom fields: expects values.custom_fields to be Record<string,string>
    const customFields: Record<string, string> = values.custom_fields || {};
    const dbPayload: Record<string, any> = { ...payload };

    for (const [fieldId, val] of Object.entries(customFields)) {
      if (!val) continue;
      dbPayload[fieldId] = val;
    }

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
  const deleteClassHandler = (id: number) => handleMutationWrapper(deleteClass, 'classes', id);
  const addStreamHandler = (name: string) => handleMutationWrapper(addStream, 'streams', name);
  const deleteStreamHandler = (id: number) => handleMutationWrapper(deleteStream, 'streams', id);
  const addColourHandler = (name: string) => handleMutationWrapper(addColour, 'team_colours', name);
  const deleteColourHandler = (id: number) => handleMutationWrapper(deleteColour, 'team_colours', id);

  // Display loading state for primary data
  if (isLoadingStudents) {
    return (
      <div className="p-6 text-center text-gray-500">
        🔄 Loading student data...
      </div>
    );
  }

  // --- RENDER (Using React Query's data variables) ---
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Student Masterlist
            </h1>
            <p className="text-gray-600">
              Manage comprehensive student records and information
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedStudent(null);
              setShowForm(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Student
          </button>
        </div>

        {/* Search & Filters */}
        <SearchFilterBar
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
        />

        {/* Students Table */}
        <StudentTable
          students={students} // 👈 Using data from useQuery
          onView={() => {}}
          onEdit={(student) => {
            setSelectedStudent(student);
            setShowForm(true);
          }}
        />

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
            onDelete={deleteClassHandler} // 👈 Using caching mutation wrapper
            onClose={() => setShowClassesModal(false)}
          />
        )}
        {showStreamsModal && (
          <OptionsModal
            title="Streams"
            items={streamsList}
            onAdd={addStreamHandler} // 👈 Using caching mutation wrapper
            onDelete={deleteStreamHandler} // 👈 Using caching mutation wrapper
            onClose={() => setShowStreamsModal(false)}
          />
        )}
        {showColoursModal && (
          <OptionsModal
            title="Team Colours"
            items={teamColoursList}
            onAdd={addColourHandler} // 👈 Using caching mutation wrapper
            onDelete={deleteColourHandler} // 👈 Using caching mutation wrapper
            onClose={() => setShowColoursModal(false)}
          />
        )}
      </div>
    </div>
  );
};