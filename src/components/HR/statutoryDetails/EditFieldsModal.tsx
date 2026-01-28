// src/components/HR/statutoryDetails/EditFieldsModal.tsx

import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { supabase } from '../../../supabaseClient';

interface EditFieldsModalProps {
  fields: { field_id: string; field_name: string; field_type: string }[];
  onClose: () => void;
  onFieldDeleted?: () => void;
}

export const EditFieldsModal: React.FC<EditFieldsModalProps> = ({
  fields,
  onClose,
  onFieldDeleted,
}) => {
  const [localFields, setLocalFields] = useState(fields);
  const [isHovering, setIsHovering] = useState(false);
  const scrollContainerRef = React.useRef<HTMLUListElement>(null);

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
    setLocalFields(fields);
  }, [fields]);

  const handleDelete = async (field_id: string) => {
    // 1) Optimistically remove from UI
    setLocalFields((f) => f.filter((fld) => fld.field_id !== field_id));

    // 2) Look up the real column name
    const { data: def, error: fetchErr } = await supabase
      .from('statutory_fields')
      .select('field_id')
      .eq('field_id', field_id)
      .single();
    if (fetchErr || !def) {
      console.error('Fetch error:', fetchErr?.message, fetchErr?.details);
      return;
    }
    const col = def.field_id;  // "statutory_text1", etc.

    // 3) Clear that single column across all staff
    const { error: updErr } = await supabase
      .from('staff')
      .update(
        { [col]: null } as Record<string, any>,
        { returning: 'minimal' }
      )
      .not(col, 'is', null);
    if (updErr) {
      console.error('Update error:', updErr.message, updErr.details);
      return;
    }

    // 4) Delete the definition from statutory_fields
    const { error: delErr } = await supabase
      .from('statutory_fields')
      .delete()
      .eq('field_id', field_id);
    if (delErr) {
      console.error('Delete error:', delErr.message, delErr.details);
      return;
    }

    if (onFieldDeleted) onFieldDeleted();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Edit Statutory Fields</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <ul 
          ref={scrollContainerRef}
          className="max-h-60 overflow-y-auto space-y-2"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {localFields.map((field) => (
            <li key={field.field_id} className="flex justify-between items-center">
              <span className="text-gray-800">{field.field_name || field.field_id}</span>
              <button
                type="button"
                onClick={() => handleDelete(field.field_id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
