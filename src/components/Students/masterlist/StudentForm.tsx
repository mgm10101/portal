// src/components/Students/masterlist/StudentForm.tsx

import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
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
  onOpenAllergiesModal?: () => void;
  onOpenMedicalConditionsModal?: () => void;
  onOpenEmergencyMedicationsModal?: () => void;
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
  onOpenAllergiesModal = () => {},
  onOpenMedicalConditionsModal = () => {},
  onOpenEmergencyMedicationsModal = () => {},
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
  const [transportZoneId, setTransportZoneId] = useState<number | undefined>(
    selectedStudent?.transport_zone_id
  );
  const [transportTypeId, setTransportTypeId] = useState<number | undefined>(
    selectedStudent?.transport_type_id
  );
  const [boardingHouseId, setBoardingHouseId] = useState<number | undefined>(
    selectedStudent?.boarding_house_id
  );
  const [boardingRoomId, setBoardingRoomId] = useState<number | undefined>(
    selectedStudent?.boarding_room_id
  );
  const [accommodationTypeId, setAccommodationTypeId] = useState<number | undefined>(
    selectedStudent?.accommodation_type_id
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
    setTransportZoneId(selectedStudent?.transport_zone_id);
    setTransportTypeId(selectedStudent?.transport_type_id);
    setBoardingHouseId(selectedStudent?.boarding_house_id);
    setBoardingRoomId(selectedStudent?.boarding_room_id);
    setAccommodationTypeId(selectedStudent?.accommodation_type_id);
  }, [selectedStudent]);

  const clearIfInvalid = (
    e: React.FocusEvent<HTMLSelectElement>,
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

    // Parse medical data from hidden inputs
    let allergiesData: any[] = [];
    let medicalConditionsData: any[] = [];
    let emergencyMedicationsData: any[] = [];

    try {
      const allergiesJson = formValues.allergies_data as string;
      if (allergiesJson) {
        allergiesData = JSON.parse(allergiesJson);
      }
    } catch (e) {
      console.error('Error parsing allergies data:', e);
    }

    try {
      const conditionsJson = formValues.medical_conditions_data as string;
      if (conditionsJson) {
        medicalConditionsData = JSON.parse(conditionsJson);
      }
    } catch (e) {
      console.error('Error parsing medical conditions data:', e);
    }

    try {
      const medicationsJson = formValues.emergency_medications_data as string;
      if (medicationsJson) {
        emergencyMedicationsData = JSON.parse(medicationsJson);
      }
    } catch (e) {
      console.error('Error parsing emergency medications data:', e);
    }

    // Combine emergency contact name and phone into single field
    // Filter out placeholder-like values and ensure we only use actual user input
    const emergencyContactName = (formValues.emergencyContactName || '').trim();
    const emergencyContactPhone = (formValues.emergencyContactPhone || '').trim();
    
    // Filter out common placeholder/autocomplete values that shouldn't be saved
    const isPlaceholderValue = (value: string) => {
      const lower = value.toLowerCase();
      return lower === 'other' || lower === 'contact name' || lower === 'phone number' || 
             lower === 'name' || lower === 'phone' || lower === '';
    };
    
    const cleanName = isPlaceholderValue(emergencyContactName) ? '' : emergencyContactName;
    const cleanPhone = isPlaceholderValue(emergencyContactPhone) ? '' : emergencyContactPhone;
    
    // Only combine if both have values, otherwise use whichever has a value
    let emergencyContact = '';
    if (cleanName && cleanPhone) {
      emergencyContact = `${cleanName} ${cleanPhone}`;
    } else if (cleanName) {
      emergencyContact = cleanName;
    } else if (cleanPhone) {
      emergencyContact = cleanPhone;
    }

    // …then merge in the dropdown state before you fire onSubmit
    const payload = {
      ...formValues,
      emergencyContact, // Combined name and phone
      status: statusValue,
      class_admitted_to_id: classAdmittedToId,
      current_class_id: currentClassId,
      stream_id: streamId,
      team_colour_id: teamColourId,
      transport_zone_id: transportZoneId,
      transport_type_id: transportTypeId,
      boarding_house_id: boardingHouseId,
      boarding_room_id: boardingRoomId,
      accommodation_type_id: accommodationTypeId,
      custom_fields: customFieldValues,
      documents: documentValues,
      allergies_data: allergiesData,
      medical_conditions_data: medicalConditionsData,
      emergency_medications_data: emergencyMedicationsData,
    };
    onSubmit(payload);
  };

  const isDisabled = !!selectedStudent && selectedStudent?.status === 'Inactive' && statusValue === 'Inactive';

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
              isDisabled={isDisabled}
            />

            <SupplementaryDetailsForm
              selectedStudent={selectedStudent}
              onShowAddField={onShowAddField}
              customFieldValues={customFieldValues}
              onCustomFieldsChange={setCustomFieldValues}
              documentValues={documentValues}
              onDocumentsChange={setDocumentValues}
              transportZoneId={transportZoneId}
              setTransportZoneId={setTransportZoneId}
              transportTypeId={transportTypeId}
              setTransportTypeId={setTransportTypeId}
              boardingHouseId={boardingHouseId}
              setBoardingHouseId={setBoardingHouseId}
              boardingRoomId={boardingRoomId}
              setBoardingRoomId={setBoardingRoomId}
              accommodationTypeId={accommodationTypeId}
              setAccommodationTypeId={setAccommodationTypeId}
              isDisabled={isDisabled}
              onOpenAllergiesModal={onOpenAllergiesModal}
              onOpenMedicalConditionsModal={onOpenMedicalConditionsModal}
              onOpenEmergencyMedicationsModal={onOpenEmergencyMedicationsModal}
              clearIfInvalid={(e, validList) => {
                // Placeholder - same as class field
                const value = e.target.value;
                if (value && !validList.includes(value)) {
                  e.target.value = '';
                }
              }}
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
