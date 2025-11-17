// src/components/Students/masterlist/useCustomFields.ts
// @tag: Custom hook for managing Custom Fields state, side effects, and logic.

import { useState, useEffect, useCallback } from 'react';
import { CustomFieldsProps, Field, DropdownOption, CustomFieldsHook } from './CustomFields.types';
import { fetchAllCustomFields, fetchOptionsForField, addOptionToDb, deleteOptionFromDb, deleteFieldFromDb } from './CustomFields.data';

export const useCustomFields = ({ selectedStudent, onChange, values }: CustomFieldsProps): CustomFieldsHook => {
  const [customFields, setCustomFields] = useState<Field[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [optionsModalField, setOptionsModalField] = useState<string | null>(null);
  const [dropdownOptions, setDropdownOptions] = useState<Record<string, DropdownOption[]>>({});
  const [openFields, setOpenFields] = useState<Record<string, boolean>>({});
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>(() => ({
    ...((selectedStudent && selectedStudent.custom_fields) || {}),
    ...(values || {}),
  }));

  // --- Data Fetching/Mutation Handlers ---

  const refreshFields = useCallback(async () => {
    const fields = await fetchAllCustomFields();
    setCustomFields(fields);
  }, []);

  const fetchDropdownOptionsIfNeeded = useCallback(async (fieldId: string) => {
    if (dropdownOptions[fieldId] && dropdownOptions[fieldId].length > 0) return;
    const { options } = await fetchOptionsForField(fieldId);
    if (options.length > 0) {
      setDropdownOptions((prev) => ({ ...prev, [fieldId]: options }));
    }
  }, [dropdownOptions]);

  const openOptions = useCallback(async (fieldId: string) => {
    const { options } = await fetchOptionsForField(fieldId);
    setDropdownOptions((prev) => ({ ...prev, [fieldId]: options }));
    setOptionsModalField(fieldId);
  }, []);

  const handleOptionsModalAdd = useCallback(async (name: string) => {
    if (!optionsModalField) return;
    const nextOptions = await addOptionToDb(optionsModalField, name);
    if (nextOptions) {
      setDropdownOptions((prev) => ({
        ...prev,
        [optionsModalField]: nextOptions.map((n, idx) => ({ id: idx + 1, name: n })),
      }));
    }
  }, [optionsModalField]);

  const handleOptionsModalDelete = useCallback(async (id: number) => {
    if (!optionsModalField) return;
    const idx = id - 1;
    const nextOptions = await deleteOptionFromDb(optionsModalField, idx);
    if (nextOptions) {
      setDropdownOptions((prev) => ({
        ...prev,
        [optionsModalField]: nextOptions.map((n, idx) => ({ id: idx + 1, name: n })),
      }));
    }
  }, [optionsModalField]);

  const handleFieldDelete = useCallback(async (fieldId: string) => {
    await deleteFieldFromDb(fieldId);
    await refreshFields();
  }, [refreshFields]);

  // --- Value/UI Handlers ---

  const handleValueChange = useCallback((fieldId: string, value: string) => {
    setSelectedValues((prev) => ({ ...prev, [fieldId]: value }));
  }, []);

  const toggleDropdown = useCallback(async (fieldId: string) => {
    await fetchDropdownOptionsIfNeeded(fieldId);
    setOpenFields((prev) => ({ ...prev, [fieldId]: !prev[fieldId] }));
  }, [fetchDropdownOptionsIfNeeded]);

  // --- Effects ---

  useEffect(() => {
    refreshFields();
  }, [refreshFields]);

  // Sync selectedStudent/values prop with internal state
  useEffect(() => {
    const incoming = {
      ...((selectedStudent && selectedStudent.custom_fields) || {}),
      ...(values || {}),
    };
    setSelectedValues(incoming);
  }, [selectedStudent, values]); // Note: Simplified comparison from original for brevity/line count.

  // Sync internal state with onChange prop
  useEffect(() => {
    // Only call onChange if selectedValues has changed from the prop values
    if (onChange && JSON.stringify(selectedValues) !== JSON.stringify(values || {})) {
      onChange({ ...selectedValues });
    }
  }, [selectedValues, onChange, values]);

  return {
    customFields, showAddModal, showEditModal, optionsModalField, dropdownOptions, openFields, selectedValues,
    setShowAddModal, setShowEditModal, setOptionsModalField, refreshFields, openOptions,
    fetchDropdownOptionsIfNeeded, handleValueChange, toggleDropdown, handleOptionsModalAdd,
    handleOptionsModalDelete, handleFieldDelete
  };
};