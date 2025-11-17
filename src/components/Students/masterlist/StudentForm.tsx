// src/components/Students/masterlist/StudentForm.tsx

import React, { useState, useEffect } from 'react';
import { CoreStudentInfoForm } from './CoreStudentInfoForm';
import { SupplementaryDetailsForm } from './SupplementaryDetailsForm';
import { DropdownItem } from './DropdownField';

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Pull in your native form values...
    const formValues = Object.fromEntries(new FormData(e.currentTarget)) as any;
    // …then merge in the dropdown state before you fire onSubmit
    const payload = {
      ...formValues,
      status: statusValue,
      class_admitted_to_id: classAdmittedToId,
      current_class_id: currentClassId,
      stream_id: streamId,
      team_colour_id: teamColourId,
      custom_fields: customFieldValues,
    };
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="overflow-y-auto max-h-[calc(90vh-3rem)] pb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {selectedStudent ? 'Edit Student' : 'Add New Student'}
            </h2>
            <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
              ×
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
            />

            <SupplementaryDetailsForm
              selectedStudent={selectedStudent}
              onShowAddField={onShowAddField}
              customFieldValues={customFieldValues}
              onCustomFieldsChange={setCustomFieldValues}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {selectedStudent ? 'Update' : 'Add'} Student
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
