// src/components/Students/masterlist/DropdownField.tsx

import React, { useState, useEffect, useRef } from 'react';
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const fetchItems = async () => {
      const { data, error} = await supabase
        .from(tableName)
        .select('id,name,sort_order')
        .order('sort_order', { ascending: true, nullsLast: true })
        .order('id', { ascending: true });
      if (!error && data) setDropdownItems(data);
    };
    fetchItems();
  }, [open, tableName]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    // Add small delay to prevent immediate closing
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  // Sort items by sort_order for consistency
  const sortedItems = [...items].sort((a: any, b: any) => {
    if (a.sort_order !== undefined && b.sort_order !== undefined) {
      return a.sort_order - b.sort_order;
    }
    return a.id - b.id;
  });

  const options = dropdownItems.length > 0 ? dropdownItems : sortedItems;
  const filtered = options.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const current =
    localSelected || options.find(i => i.id === selectedId) || null;

  // Custom placeholder text for class fields
  const getPlaceholder = () => {
    if (label === "Class Admitted To" || label === "Current Class") {
      return "Select class...";
    }
    return `Select ${label.toLowerCase()}`;
  };

  // Clear selection handler
  const handleClear = () => {
    setLocalSelected(null);
    onSelect?.(undefined as any);
    setOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
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
          {current?.name || getPlaceholder()}
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
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-b-lg shadow-lg">
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
          {current && (
            <div className="border-t border-gray-300 bg-gray-50">
              <button
                type="button"
                onClick={handleClear}
                className="w-full px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Clear my choice
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
