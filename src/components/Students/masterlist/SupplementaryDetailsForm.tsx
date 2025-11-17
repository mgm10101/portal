// src/components/Students/masterlist/SupplementaryDetailsForm.tsx

import React from 'react';
import { Plus } from 'lucide-react';
import { CustomFields } from './CustomFields';

interface SupplementaryDetailsFormProps {
  selectedStudent: any;
  onShowAddField: () => void;
  customFieldValues?: Record<string, string>;
  onCustomFieldsChange?: (v: Record<string, string>) => void;
}

export const SupplementaryDetailsForm: React.FC<SupplementaryDetailsFormProps> = ({
  selectedStudent,
  onShowAddField,
  customFieldValues = {},
  onCustomFieldsChange,
}) => {
  return (
    <>
      {/* Parent/Guardian Details */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Parent/Guardian Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Father/Guardian</h4>
            <div className="space-y-3">
              <input
                name="fatherName"
                type="text"
                placeholder="Name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue={selectedStudent?.father_name}
              />
              <input
                name="fatherPhone"
                type="tel"
                placeholder="Phone Number"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue={selectedStudent?.father_phone}
              />
              <input
                name="fatherEmail"
                type="email"
                placeholder="Email Address"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue={selectedStudent?.father_email}
              />
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Mother/Guardian</h4>
            <div className="space-y-3">
              <input
                name="motherName"
                type="text"
                placeholder="Name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue={selectedStudent?.mother_name}
              />
              <input
                name="motherPhone"
                type="tel"
                placeholder="Phone Number"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue={selectedStudent?.mother_phone}
              />
              <input
                name="motherEmail"
                type="email"
                placeholder="Email Address"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue={selectedStudent?.mother_email}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Emergency Contact
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Person & Phone
            </label>
            <input
              name="emergencyContact"
              type="text"
              placeholder="Name - Phone Number"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              defaultValue={selectedStudent?.emergency_contact}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relationship to Student
            </label>
            <input
              name="emergencyRelationship"
              type="text"
              placeholder="Relationship"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              defaultValue={selectedStudent?.emergency_relationship}
            />
          </div>
        </div>
      </div>

      {/* Documents */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Documents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Birth Certificate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Birth Certificate
            </label>
            <div className="flex">
              <select
                name="birthCertificateStatus"
                className="flex-1 p-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue={selectedStudent?.birth_certificate_status}
              >
                <option>Submitted</option>
                <option>Not Submitted</option>
              </select>
              <button
                type="button"
                className="px-3 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Copy of Parents' ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Copy of Parents' ID
            </label>
            <div className="flex">
              <select
                name="parentsIdStatus"
                className="flex-1 p-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue={selectedStudent?.parents_id_status}
              >
                <option>Submitted</option>
                <option>Not Submitted</option>
              </select>
              <button
                type="button"
                className="px-3 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Immunization Records */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Immunization Records
            </label>
            <div className="flex">
              <select
                name="immunizationRecordsStatus"
                className="flex-1 p-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue={selectedStudent?.immunization_records_status}
              >
                <option>Submitted</option>
                <option>Not Submitted</option>
              </select>
              <button
                type="button"
                className="px-3 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Passport Sized Photos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Passport Sized Photos
            </label>
            <div className="flex">
              <select
                name="passportPhotosStatus"
                className="flex-1 p-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue={selectedStudent?.passport_photos_status}
              >
                <option>Submitted</option>
                <option>Not Submitted</option>
              </select>
              <button
                type="button"
                className="px-3 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Medical Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Medical Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Allergies
            </label>
            <input
              name="allergies"
              type="text"
              placeholder="List any allergies"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              defaultValue={selectedStudent?.allergies}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Other Medical Conditions
            </label>
            <input
              name="medicalConditions"
              type="text"
              placeholder="Any other medical conditions"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              defaultValue={selectedStudent?.medical_conditions}
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address
        </label>
        <textarea
          name="address"
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          defaultValue={selectedStudent?.address}
        />
      </div>

      {/* Custom Fields */}
      <CustomFields
        selectedStudent={selectedStudent}
        onShowAddField={onShowAddField}
        values={selectedStudent?.custom_fields || customFieldValues}
        onChange={(v) => onCustomFieldsChange?.(v)}
      />
    </>
  );
};
