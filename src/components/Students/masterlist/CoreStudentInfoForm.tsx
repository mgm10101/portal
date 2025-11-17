// src/components/Students/masterlist/CoreStudentInfoForm.tsx

import React from 'react';
import { Plus, User, Upload } from 'lucide-react';
import { DropdownField, DropdownItem } from './DropdownField';

interface CoreStudentInfoFormProps {
  selectedStudent: any;
  classesList: DropdownItem[];
  streamsList: DropdownItem[];
  teamColoursList: DropdownItem[];
  statusValue: string;
  setStatusValue: (val: string) => void;
  clearIfInvalid: (
    e: React.FocusEvent<HTMLSelectElement>,
    validList: string[]
  ) => void;
  onOpenClassesModal: () => void;
  onOpenStreamsModal: () => void;
  onOpenColoursModal: () => void;
  classAdmittedToId?: number;
  setClassAdmittedToId: (id: number) => void;
  currentClassId?: number;
  setCurrentClassId: (id: number) => void;
  streamId?: number;
  setStreamId: (id: number) => void;
  teamColourId?: number;
  setTeamColourId: (id: number) => void;
}

export const CoreStudentInfoForm: React.FC<CoreStudentInfoFormProps> = ({
  selectedStudent,
  classesList,
  streamsList,
  teamColoursList,
  statusValue,
  setStatusValue,
  clearIfInvalid,
  onOpenClassesModal,
  onOpenStreamsModal,
  onOpenColoursModal,
  classAdmittedToId,
  setClassAdmittedToId,
  currentClassId,
  setCurrentClassId,
  streamId,
  setStreamId,
  teamColourId,
  setTeamColourId,
}) => {
  return (
    <>
      {/* Hidden inputs to include dropdown IDs in form submission */}
      <input
        type="hidden"
        name="class_admitted_to_id"
        value={classAdmittedToId ?? ''}
      />
      <input
        type="hidden"
        name="current_class_id"
        value={currentClassId ?? ''}
      />
      <input
        type="hidden"
        name="stream_id"
        value={streamId ?? ''}
      />
      <input
        type="hidden"
        name="team_colour_id"
        value={teamColourId ?? ''}
      />

      {/* Profile Picture */}
      <div className="flex items-center space-x-4">
        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
          <User className="w-10 h-10 text-gray-500" />
        </div>
        <button
          type="button"
          className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Photo
        </button>
      </div>

      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Student Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student Name
            </label>
            <input
              name="name"
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              defaultValue={selectedStudent?.name}
            />
          </div>
          {/* Admission Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admission Number
            </label>
            <input
              name="admissionNumber"
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              defaultValue={selectedStudent?.admission_number}
            />
          </div>
          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth
            </label>
            <input
              name="dateOfBirth"
              type="date"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              defaultValue={selectedStudent?.date_of_birth}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Age
            </label>
            <input
              type="number"
              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
              defaultValue={selectedStudent?.age}
              disabled
            />
          </div>

          {/* Class Admitted To */}
          <DropdownField
            name="class_admitted_to_id"
            label="Class Admitted To"
            items={classesList}
            selectedId={classAdmittedToId}
            clearIfInvalid={clearIfInvalid}
            onOpenModal={onOpenClassesModal}
            onSelect={setClassAdmittedToId}
            tableName="classes"
          />

          {/* Date of Admission */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Admission
            </label>
            <input
              name="dateOfAdmission"
              type="date"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              defaultValue={selectedStudent?.date_of_admission}
            />
          </div>
        </div>

        {/* Current Class / Stream / Team Colour */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Current Class */}
          <DropdownField
            name="current_class_id"
            label="Current Class"
            items={classesList}
            selectedId={currentClassId}
            clearIfInvalid={clearIfInvalid}
            onOpenModal={onOpenClassesModal}
            onSelect={setCurrentClassId}
            tableName="classes"
          />

          {/* Stream */}
          <DropdownField
            name="stream_id"
            label="Stream"
            items={streamsList}
            selectedId={streamId}
            clearIfInvalid={clearIfInvalid}
            onOpenModal={onOpenStreamsModal}
            onSelect={setStreamId}
            tableName="streams"
          />

          {/* Team Colour */}
          <DropdownField
            name="team_colour_id"
            label="Team Colour"
            items={teamColoursList}
            selectedId={teamColourId}
            clearIfInvalid={clearIfInvalid}
            onOpenModal={onOpenColoursModal}
            onSelect={setTeamColourId}
            tableName="team_colours"
          />
        </div>

        {/* Status & Withdrawal Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={statusValue}
              onChange={e => setStatusValue(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
          {statusValue === 'Inactive' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Withdrawal Date
              </label>
              <input
                name="withdrawalDate"
                type="date"
                defaultValue={selectedStudent?.withdrawal_date}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};
