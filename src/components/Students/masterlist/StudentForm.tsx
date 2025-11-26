// src/components/Students/masterlist/StudentForm.tsx

import React, { useState, useEffect } from 'react';
import { X, Users, Loader2 } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { CoreStudentInfoForm } from './CoreStudentInfoForm';
import { SupplementaryDetailsForm } from './SupplementaryDetailsForm';
import { DropdownItem } from './DropdownField';
import { ClassProgressionModal } from './ClassProgressionModal';

interface StudentFormProps {
  selectedStudent: any;
  classesList: DropdownItem[];
  streamsList: DropdownItem[];
  teamColoursList: DropdownItem[];
  onSubmit: (values: any) => void;
  onCancel: () => void;
  onOpenClassesModal: () => void;
  onOpenStreamsModal: () => void;
  onOpenColoursModal: () => void;
  onShowAddField: () => void;
  onRefreshStudents?: () => void;
  isSubmitting?: boolean;
}

export const StudentForm: React.FC<StudentFormProps> = ({
  selectedStudent,
  classesList,
  streamsList,
  teamColoursList,
  onSubmit,
  onCancel,
  onOpenClassesModal,
  onOpenStreamsModal,
  onOpenColoursModal,
  onShowAddField,
  onRefreshStudents,
  isSubmitting = false,
}) => {
  const [statusValue, setStatusValue] = useState(
    selectedStudent?.status || 'Active'
  );
  const [classAdmittedToId, setClassAdmittedToId] = useState<number | undefined>(
    selectedStudent?.class_admitted_to_id
  );
  const [currentClassId, setCurrentClassId] = useState<number | undefined>(
    selectedStudent?.current_class_id
  );
  const [streamId, setStreamId] = useState<number | undefined>(
    selectedStudent?.stream_id
  );
  const [teamColourId, setTeamColourId] = useState<number | undefined>(
    selectedStudent?.team_colour_id
  );

  // hold custom fields values provided by CustomFields component
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [documentValues, setDocumentValues] = useState<Record<string, string>>({});
  const [showProgressionModal, setShowProgressionModal] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Keyboard navigation for scrolling
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isHovering || !scrollContainerRef.current) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        scrollContainerRef.current.scrollBy({
          top: -100,
          behavior: 'smooth'
        });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        scrollContainerRef.current.scrollBy({
          top: 100,
          behavior: 'smooth'
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHovering]);

  useEffect(() => {
    setStatusValue(selectedStudent?.status || 'Active');
    setClassAdmittedToId(selectedStudent?.class_admitted_to_id);
    setCurrentClassId(selectedStudent?.current_class_id);
    setStreamId(selectedStudent?.stream_id);
    setTeamColourId(selectedStudent?.team_colour_id);
  }, [selectedStudent]);

  const clearIfInvalid = (
    e: React.FocusEvent<HTMLInputElement>,
    validList: string[]
  ) => {
    if (!validList.includes(e.target.value)) {
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Pull in your native form values...
    const formValues = Object.fromEntries(new FormData(e.currentTarget)) as any;
    
    // Validation: Check required fields
    const requiredFields = [
      { value: formValues.name, label: 'Student Name' },
      { value: formValues.admissionNumber, label: 'Admission Number' },
      { value: formValues.dateOfBirth, label: 'Date of Birth' },
      { value: classAdmittedToId, label: 'Class Admitted To' },
      { value: formValues.dateOfAdmission, label: 'Date of Admission' },
      { value: currentClassId, label: 'Current Class' }
    ];

    const emptyFields = requiredFields.filter(field => !field.value);
    
    if (emptyFields.length > 0) {
      const fieldNames = emptyFields.map(f => f.label).join(', ');
      alert(`Please fill in the following required fields: ${fieldNames}`);
      return;
    }

    // Validation: Check unique admission number
    try {
      const { data: existingStudents, error } = await supabase
        .from('students')
        .select('admission_number')
        .eq('admission_number', formValues.admissionNumber);
      
      if (error) throw error;
      
      // If editing, allow the same admission number for this student
      // If adding new, check if admission number already exists
      if (existingStudents && existingStudents.length > 0) {
        if (!selectedStudent || selectedStudent.admission_number !== formValues.admissionNumber) {
          alert(`Admission number "${formValues.admissionNumber}" is already in use. Please use a unique admission number.`);
          return;
        }
      }
    } catch (error) {
      console.error('Error checking admission number:', error);
      alert('Error validating admission number. Please try again.');
      return;
    }

    // …then merge in the dropdown state before you fire onSubmit
    const payload = {
      ...formValues,
      status: statusValue,
      class_admitted_to_id: classAdmittedToId,
      current_class_id: currentClassId,
      stream_id: streamId,
      team_colour_id: teamColourId,
      custom_fields: customFieldValues,
      documents: documentValues,
    };
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <style>
          {`
            @media (min-width: 768px) {
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
              .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
            }
          `}
        </style>
        <div 
          ref={scrollContainerRef}
          className="overflow-y-auto max-h-[calc(90vh-3rem)] pb-6 scrollbar-hide"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-normal text-gray-800">
              {selectedStudent ? 'Edit Student' : 'Add New Student'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <CoreStudentInfoForm
              selectedStudent={selectedStudent}
              classesList={classesList}
              streamsList={streamsList}
              teamColoursList={teamColoursList}
              statusValue={statusValue}
              setStatusValue={setStatusValue}
              clearIfInvalid={clearIfInvalid}
              onOpenClassesModal={onOpenClassesModal}
              onOpenStreamsModal={onOpenStreamsModal}
              onOpenColoursModal={onOpenColoursModal}
              classAdmittedToId={classAdmittedToId}
              setClassAdmittedToId={setClassAdmittedToId}
              currentClassId={currentClassId}
              setCurrentClassId={setCurrentClassId}
              streamId={streamId}
              setStreamId={setStreamId}
              teamColourId={teamColourId}
              setTeamColourId={setTeamColourId}
              onOpenProgressionModal={() => setShowProgressionModal(true)}
            />

            <SupplementaryDetailsForm
              selectedStudent={selectedStudent}
              onShowAddField={onShowAddField}
              customFieldValues={customFieldValues}
              onCustomFieldsChange={setCustomFieldValues}
              documentValues={documentValues}
              onDocumentsChange={setDocumentValues}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className={`px-6 py-2 border border-gray-300 rounded-lg transition-colors ${
                  isSubmitting
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-2 text-white rounded-lg transition-colors flex items-center ${
                  isSubmitting 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {selectedStudent ? 'Update' : 'Add'} Student
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Class Progression Modal */}
      {showProgressionModal && (
        <ClassProgressionModal
          onClose={() => setShowProgressionModal(false)}
          classes={classesList}
          onSuccess={() => {
            setShowProgressionModal(false);
            // Refresh student data to show updated classes
            if (onRefreshStudents) {
              onRefreshStudents();
            }
          }}
        />
      )}
    </div>
  );
};
