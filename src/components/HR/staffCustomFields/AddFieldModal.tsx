// src/components/HR/staffCustomFields/AddFieldModal.tsx

import React, { useState } from 'react';
import { supabase } from '../../../supabaseClient';
import { Loader2 } from 'lucide-react';

interface AddFieldModalProps {
  onClose: () => void;
  onFieldCreated?: () => void;
}

export const AddFieldModal: React.FC<AddFieldModalProps> = ({
  onClose,
  onFieldCreated,
}) => {
  const [customFieldName, setCustomFieldName] = useState('');
  const [customFieldType, setCustomFieldType] = useState('Text/Number'); 
  const [dropdownOptions, setDropdownOptions] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const slotMap: Record<string, string[]> = {
    Text: ['staff_custom_text1', 'staff_custom_text2', 'staff_custom_text3', 'staff_custom_text4', 'staff_custom_text5', 'staff_custom_num1', 'staff_custom_num2', 'staff_custom_num3'],
  };

  const normalizeType = (type: string): 'Text' => {
    return 'Text'; 
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    const normalizedType = normalizeType(customFieldType); 

    const { data: existingFields } = await supabase
      .from('staff_custom_fields')
      .select('field_id, field_name, field_type');

    const usedSlots = (existingFields || [])
      .filter((f: any) => f.field_name && f.field_id)
      .map((f: any) => f.field_id);

    const availableSlot = slotMap[normalizedType].find(
      (slot) => !usedSlots.includes(slot)
    );

    if (!availableSlot) {
      setError(
        `You've used all ${slotMap[normalizedType].length} custom field slots. Please delete one before adding another.`
      );
      setIsLoading(false);
      return;
    }

    const payload: any = {
      field_id: availableSlot,
      field_name: customFieldName,
      field_type: customFieldType === 'Text/Number' ? 'Text Input' : customFieldType,
    };

    if (customFieldType === 'Dropdown') {
      const parsedOptions = dropdownOptions
        .split(',')
        .map((opt) => opt.trim())
        .filter((opt) => opt.length > 0);
      payload.options = parsedOptions;
    } else {
      payload.field_type = 'Text Input';
    }

    const { error: upsertError } = await supabase
      .from('staff_custom_fields')
      .upsert(payload, { onConflict: 'field_id' });

    if (upsertError) {
      setError(upsertError.message);
      setIsLoading(false);
      return;
    }

    if (onFieldCreated) onFieldCreated();
    onClose();
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Add New Field</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            ×
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Name
            </label>
            <input
              name="customFieldName"
              type="text"
              value={customFieldName}
              onChange={(e) => setCustomFieldName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="Enter field name"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Type
            </label>
            <select
              name="customFieldType"
              value={customFieldType}
              onChange={(e) => setCustomFieldType(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
              disabled={isLoading}
            >
              <option>Text/Number</option> 
              <option>Dropdown</option>
            </select>
          </div>
          {customFieldType === 'Dropdown' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dropdown Options (comma-separated)
              </label>
              <input
                type="text"
                value={dropdownOptions}
                onChange={(e) => setDropdownOptions(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
                placeholder="e.g. Option 1, Option 2, Option 3"
                disabled={isLoading}
              />
            </div>
          )}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {isLoading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
              Add Field
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

