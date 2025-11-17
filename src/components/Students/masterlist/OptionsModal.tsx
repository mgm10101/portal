// src/components/students/masterlist/OptionsModal.tsx

import React, { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';

interface OptionsModalProps {
  title: string;
  items: { id: number; name: string }[];
  onAdd: (name: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onClose: () => void;
}

export const OptionsModal: React.FC<OptionsModalProps> = ({
  title,
  items,
  onAdd,
  onDelete,
  onClose,
}) => {
  const [newName, setNewName] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
        <ul className="max-h-48 overflow-y-auto mb-4 space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between items-center">
              <span>{item.name}</span>
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex space-x-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={`Add new ${title}`}
            className="flex-1 p-2 border border-gray-300 rounded-lg"
          />
          <button
            type="button"
            onClick={async () => {
              if (newName.trim()) {
                await onAdd(newName.trim());
                setNewName('');
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};
