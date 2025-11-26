// src/components/HR/DepartmentModal.tsx

import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Loader2, Pencil, X } from 'lucide-react';
import { addDepartment, updateDepartment, deleteDepartment, Department } from '../../services/staffService';

interface DepartmentModalProps {
  departments: Department[];
  onClose: () => void;
}

export const DepartmentModal: React.FC<DepartmentModalProps> = ({
  departments,
  onClose,
}) => {
  const [localDepartments, setLocalDepartments] = useState(departments || []);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
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
    setLocalDepartments(departments || []);
  }, [departments]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    
    setIsSaving(true);
    try {
      await addDepartment(newName.trim());
      setNewName('');
      // Refresh will be handled by onClose
      onClose();
    } catch (error: any) {
      alert(`Failed to add department: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (dept: Department) => {
    setEditingId(dept.id);
    setEditingName(dept.name);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editingName.trim()) {
      setEditingId(null);
      return;
    }
    
    setIsSaving(true);
    try {
      await updateDepartment(id, editingName.trim());
      setEditingId(null);
      setEditingName('');
      // Refresh will be handled by onClose
      onClose();
    } catch (error: any) {
      alert(`Failed to update department: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this department? This will set the department to null for all staff members using it.')) {
      return;
    }
    
    setDeletingId(id);
    try {
      await deleteDepartment(id);
      // Refresh will be handled by onClose
      onClose();
    } catch (error: any) {
      alert(`Failed to delete department: ${error.message || 'Unknown error'}`);
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Departments</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <ul 
          ref={scrollContainerRef}
          className="max-h-48 overflow-y-auto mb-4 space-y-2"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {(localDepartments || []).map((dept) => (
            <li
              key={dept.id}
              className="flex justify-between items-center gap-2 p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm"
            >
              {editingId === dept.id ? (
                <>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-lg"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveEdit(dept.id);
                      } else if (e.key === 'Escape') {
                        handleCancelEdit();
                      }
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveEdit(dept.id)}
                    disabled={isSaving}
                    className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                    title="Save"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="p-1 text-gray-600 hover:text-gray-800"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-gray-800 flex-1">{dept.name}</span>
                  <button
                    type="button"
                    onClick={() => handleEdit(dept)}
                    className="p-1 text-blue-600 hover:text-blue-800"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(dept.id)}
                    disabled={deletingId === dept.id}
                    className={`p-1 transition-colors ${
                      deletingId === dept.id
                        ? 'text-red-400 cursor-not-allowed'
                        : 'text-red-600 hover:text-red-800'
                    }`}
                    title="Delete"
                  >
                    {deletingId === dept.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
        <div className="flex space-x-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Add new department"
            className="flex-1 p-2 border border-gray-300 rounded-lg"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAdd();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={isSaving || !newName.trim()}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
              isSaving || !newName.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

