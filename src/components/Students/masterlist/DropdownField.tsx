// src/components/Students/masterlist/DropdownField.tsx

import React, { useState, useEffect } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { supabase } from '../../../supabaseClient';

export interface DropdownItem {
  id: number;
  name: string;
}

interface DropdownFieldProps {
  name: string;
  label: string;
  items: DropdownItem[];
  selectedId?: number;
  clearIfInvalid: (
    e: React.FocusEvent<HTMLSelectElement>,
    validList: string[]
  ) => void;
  onOpenModal: () => void;
  onSelect?: (id: number) => void;
  tableName: string;
}

export const DropdownField: React.FC<DropdownFieldProps> = ({
  name,
  label,
  items,
  selectedId,
  clearIfInvalid,
  onOpenModal,
  onSelect,
  tableName,
}) => {
  const [open, setOpen] = useState(false);
  const [dropdownItems, setDropdownItems] = useState<DropdownItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [localSelected, setLocalSelected] = useState<DropdownItem | null>(
    () => items.find(i => i.id === selectedId) || null
  );

  useEffect(() => {
    if (!open) return;
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from(tableName)
        .select('id,name');
      if (!error && data) setDropdownItems(data);
    };
    fetchItems();
  }, [open, tableName]);

  const options = dropdownItems.length > 0 ? dropdownItems : items;
  const filtered = options.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const current =
    localSelected || options.find(i => i.id === selectedId) || null;

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>

      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
        <div
          className={`flex-1 px-3 py-2 cursor-pointer ${
            current ? 'text-gray-900' : 'text-gray-400'
          }`}
          onClick={() => setOpen(o => !o)}
        >
          {current?.name || `Select ${label.toLowerCase()}`}
        </div>

        <button
          type="button"
          className="px-3 text-gray-500 hover:bg-gray-50"
          onClick={() => setOpen(o => !o)}
        >
          <ChevronDown
            className={`w-4 h-4 transform transition-transform ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>

        <button
          type="button"
          onClick={onOpenModal}
          className="flex items-center px-3 border-l border-gray-300 text-gray-500 hover:bg-gray-50"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {open && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-b-lg">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search..."
            className="w-full px-3 py-2 border-b border-gray-300 focus:outline-none"
          />
          <ul className="max-h-60 overflow-auto text-gray-900">
            {filtered.map(item => (
              <li
                key={item.id}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setLocalSelected(item);
                  onSelect?.(item.id);
                  setOpen(false);
                  setSearchTerm('');
                }}
              >
                {item.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
