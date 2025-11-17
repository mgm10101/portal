// src/components/Students/masterlist/CustomFields.tsx
// @tag: Main container component that connects state logic (hook) to rendering.

import React from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { AddFieldModal } from './AddFieldModal';
import { OptionsModal } from './OptionsModal';
import { EditFieldsModal } from './EditFieldsModal';
import { CustomFieldsProps, Field, DropdownOption, CustomFieldsRenderProps } from './CustomFields.types';
import { useCustomFields } from './useCustomFields';

// External imports for modals (relative file paths preserved)
import { supabase } from '../../../supabaseClient';


// --- Presentational Component (Inline for Simplicity & Line Count) ---
const CustomFieldsRender: React.FC<CustomFieldsRenderProps> = ({
  customFields, showAddModal, showEditModal, optionsModalField, dropdownOptions, openFields, selectedValues,
  selectedStudent, openOptions, fetchDropdownOptionsIfNeeded, handleValueChange, toggleDropdown,
  handleOptionsModalAdd, handleOptionsModalDelete, onShowAdd, onShowEdit, onModalCloseAndRefresh, onEditModalClose
}) => (
  <>
    {/* Separator + Custom Fields UI */}
    <div className="border-t pt-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Custom Fields</h3>
      <div className="space-y-4 mb-4">
        {customFields.map((field) => (
          <div key={field.field_id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{field.field_name}</label>
            {field.field_type === 'Dropdown' ? (
              <div className="flex items-center space-x-2">
                {/* Dropdown Input/Toggle */}
                <div className="flex-1 relative overflow-visible">
                  <div
                    className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer ${
                      (selectedValues[field.field_id] || selectedStudent?.[field.field_id]) ? 'text-gray-900' : 'text-gray-400' // FIXED: Check both selectedValues state and selectedStudent prop
                    }`}
                    onClick={() => toggleDropdown(field.field_id)}
                    role="button" tabIndex={0}
                  >
                    {selectedValues[field.field_id] ?? selectedStudent?.[field.field_id] ?? `Select ${field.field_name.toLowerCase()}`}
                  </div>
                  <button type="button" onClick={() => toggleDropdown(field.field_id)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1" aria-label={`Toggle ${field.field_name} dropdown`}>
                    <ChevronDown className={`w-4 h-4 transform transition-transform cursor-pointer ${openFields[field.field_id] ? 'rotate-180' : ''}`} />
                  </button>
                  {/* Dropdown List */}
                  {openFields[field.field_id] && (
                    <div className="absolute left-0 right-0 z-50 w-full mt-1 bg-white border border-gray-300 rounded-b-lg shadow-sm">
                      <ul className="max-h-60 min-h-[4rem] overflow-auto text-gray-900">
                        {(dropdownOptions[field.field_id] || []).map((o) => (
                          <li key={o.id} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-gray-900" onClick={() => { handleValueChange(field.field_id, o.name); toggleDropdown(field.field_id); }}>
                            {o.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                {/* Edit Options Button */}
                <button type="button" onClick={() => openOptions(field.field_id)} className="h-10 w-10 inline-flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : (
              // Text Input
              <input
                name={field.field_id} type="text" placeholder={field.field_name}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue={selectedValues[field.field_id] ?? selectedStudent?.[field.field_id] ?? ''}
                onChange={(e) => handleValueChange(field.field_id, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
    </div>

    {/* Add + Edit Buttons */}
    <div className="flex space-x-2">
      <button type="button" onClick={onShowAdd} className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
        <Plus className="w-4 h-4 mr-2" /> Add Custom Field
      </button>
      <button type="button" onClick={onShowEdit} className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
        ✎ Edit Fields
      </button>
    </div>

    {/* Modals */}
    {showAddModal && (
      <AddFieldModal onClose={onModalCloseAndRefresh} onFieldCreated={onModalCloseAndRefresh} />
    )}

    {optionsModalField && (
      <OptionsModal
        title={`Options for ${customFields.find((f) => f.field_id === optionsModalField)?.field_name || optionsModalField}`}
        items={dropdownOptions[optionsModalField] || []}
        onAdd={handleOptionsModalAdd}
        onDelete={handleOptionsModalDelete}
        onClose={onEditModalClose}
      />
    )}

    {showEditModal && (
      <EditFieldsModal
        fields={customFields}
        onDelete={async (fieldId) => {
          await supabase.from('custom_fields').delete().eq('field_id', fieldId); // Supabase call is here for simplicity, ideally in data file.
          onModalCloseAndRefresh();
        }}
        onClose={onEditModalClose}
      />
    )}
  </>
);


// --- Main Component ---
export const CustomFields: React.FC<CustomFieldsProps> = (props) => {
  const state = useCustomFields(props);

  // Simplified handlers to map hook state setters/functions to presentational events
  const handleShowAdd = () => state.setShowAddModal(true);
  const handleShowEdit = () => state.setShowEditModal(true);
  const handleModalCloseAndRefresh = () => {
    state.setShowAddModal(false);
    state.refreshFields();
  };
  const handleEditModalClose = () => {
    state.setShowEditModal(false);
    state.setOptionsModalField(null); // Closes both OptionsModal and EditFieldsModal
  };

  const renderProps: CustomFieldsRenderProps = {
    customFields: state.customFields,
    showAddModal: state.showAddModal,
    showEditModal: state.showEditModal,
    optionsModalField: state.optionsModalField,
    dropdownOptions: state.dropdownOptions,
    openFields: state.openFields,
    selectedValues: state.selectedValues,
    selectedStudent: props.selectedStudent,
    openOptions: state.openOptions,
    fetchDropdownOptionsIfNeeded: state.fetchDropdownOptionsIfNeeded,
    handleValueChange: state.handleValueChange,
    toggleDropdown: state.toggleDropdown,
    handleOptionsModalAdd: state.handleOptionsModalAdd,
    handleOptionsModalDelete: state.handleOptionsModalDelete,
    onShowAdd: handleShowAdd,
    onShowEdit: handleShowEdit,
    onModalCloseAndRefresh: handleModalCloseAndRefresh,
    onEditModalClose: handleEditModalClose,
  };

  return <CustomFieldsRender {...renderProps} />;
};