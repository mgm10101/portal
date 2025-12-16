// src/components/Students/masterlist/CoreStudentInfoForm.tsx

import React, { useState, useEffect } from 'react';
import { Plus, User, Upload, TrendingUp } from 'lucide-react';
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
  onOpenProgressionModal?: () => void;
  isDisabled?: boolean; // Disable all fields except Status and withdrawal_date
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
  onOpenProgressionModal,
  isDisabled = false,
}) => {
  const [genderValue, setGenderValue] = useState(selectedStudent?.gender || '');

  // Update gender value when selectedStudent changes
  useEffect(() => {
    setGenderValue(selectedStudent?.gender || '');
  }, [selectedStudent]);

  return (
    <>
      <style>
        {`
          input[type="date"] {
            cursor: text;
          }
          input[type="date"]::-webkit-calendar-picker-indicator {
            cursor: pointer;
          }
          select[name="gender"] option[value=""] {
            color: #9ca3af;
          }
          select[name="gender"] option:not([value=""]) {
            color: #111827;
          }
        `}
      </style>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="w-10 h-10 text-gray-500" />
          </div>
          <button
            type="button"
            disabled={isDisabled}
            className={`flex items-center px-4 py-2 border border-gray-300 rounded-lg ${
              isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
            }`}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Photo
          </button>
        </div>
        {onOpenProgressionModal && !selectedStudent && (
          <button
            type="button"
            onClick={onOpenProgressionModal}
            className="flex items-center px-2 md:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <TrendingUp className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Batch Progress Students</span>
          </button>
        )}
      </div>

      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Student Name - spans 4 columns (keep same) */}
          <div className="md:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student Name
            </label>
            <input
              name="name"
              type="text"
              disabled={isDisabled}
              className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              defaultValue={selectedStudent?.name}
            />
          </div>
          {/* Gender - spans 3 columns (same width as Date of Birth) */}
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender
            </label>
            <select
              name="gender"
              value={genderValue}
              onChange={(e) => setGenderValue(e.target.value)}
              disabled={isDisabled}
              className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                genderValue === '' ? 'text-gray-400' : 'text-gray-900'
              } ${isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              <option value="" className="text-gray-400">Select Gender</option>
              <option value="Male" className="text-gray-900">Male</option>
              <option value="Female" className="text-gray-900">Female</option>
              <option value="Custom" className="text-gray-900">Custom</option>
            </select>
          </div>
          {/* Date of Birth - spans 3 columns (same width as Gender) */}
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth
            </label>
            <input
              name="dateOfBirth"
              type="date"
              disabled={isDisabled}
              className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              defaultValue={selectedStudent?.date_of_birth}
            />
          </div>
          {/* Age - spans 2 columns (keep same) */}
          <div className="md:col-span-2">
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Admission Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admission Number
            </label>
            <input
              name="admissionNumber"
              type="text"
              disabled={isDisabled}
              className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              defaultValue={selectedStudent?.admission_number}
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
            disabled={isDisabled}
          />

          {/* Date of Admission */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Admission
            </label>
            <input
              name="dateOfAdmission"
              type="date"
              disabled={isDisabled}
              className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
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
            disabled={isDisabled}
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
            disabled={isDisabled}
          />

          {/* Team */}
          <DropdownField
            name="team_colour_id"
            label="Team"
            items={teamColoursList}
            selectedId={teamColourId}
            clearIfInvalid={clearIfInvalid}
            onOpenModal={onOpenColoursModal}
            onSelect={setTeamColourId}
            tableName="team_colours"
            disabled={isDisabled}
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
              onChange={e => {
                setStatusValue(e.target.value);
                // If changing to Inactive, automatically set withdrawal_date to today
                if (e.target.value === 'Inactive') {
                  const today = new Date().toISOString().split('T')[0];
                  const withdrawalDateInput = document.querySelector('input[name="withdrawalDate"]') as HTMLInputElement;
                  if (withdrawalDateInput) {
                    withdrawalDateInput.value = today;
                  }
                }
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
          {statusValue === 'Inactive' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Withdrawal Date <span className="text-red-500">*</span>
              </label>
              <input
                name="withdrawalDate"
                type="date"
                defaultValue={selectedStudent?.withdrawal_date || new Date().toISOString().split('T')[0]}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};
