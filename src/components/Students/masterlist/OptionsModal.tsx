// src/components/students/masterlist/OptionsModal.tsx

import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Loader2, Pencil, X, Check } from 'lucide-react';
import { supabase } from '../../../supabaseClient';

interface OptionsModalProps {
  title: string;
  items: { id: number; name: string; sort_order?: number }[];
  onAdd: (name: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onEdit?: (id: number, newName: string) => Promise<void>;
  onClose: () => void;
  tableName?: string;
  onRefresh?: () => void;
}

export const OptionsModal: React.FC<OptionsModalProps> = ({
  title,
  items,
  onAdd,
  onDelete,
  onEdit,
  onClose,
  tableName,
  onRefresh,
}) => {
  const [newName, setNewName] = useState('');
  const [localItems, setLocalItems] = useState(items);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hasReordered, setHasReordered] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
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
    // Sort items by sort_order if available, otherwise by id
    const sorted = [...items].sort((a, b) => {
      if (a.sort_order !== undefined && b.sort_order !== undefined) {
        return a.sort_order - b.sort_order;
      }
      return a.id - b.id;
    });
    setLocalItems(sorted);
    setHasReordered(false);
  }, [items]);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === index) return;

    const newItems = [...localItems];
    const draggedItem = newItems[draggedIndex];
    
    // Remove dragged item and insert at new position
    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);
    
    setLocalItems(newItems);
    setDraggedIndex(index);
    setHasReordered(true);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (item: { id: number; name: string }) => {
    setEditingId(item.id);
    setEditingName(item.name);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editingName.trim() || !onEdit) {
      setEditingId(null);
      setEditingName('');
      return;
    }
    
    setIsSaving(true);
    try {
      await onEdit(id, editingName.trim());
      setEditingId(null);
      setEditingName('');
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Handle adding new option if there's a name
      if (newName.trim()) {
        await onAdd(newName.trim());
        setNewName('');
      }

      // Handle reordering if items were reordered
      if (hasReordered && tableName) {
        try {
          const updates = localItems.map((item, idx) => 
            supabase
              .from(tableName)
              .update({ sort_order: idx })
              .eq('id', item.id)
          );
          
          await Promise.all(updates);
          setHasReordered(false);
        } catch (error) {
          console.error('Error updating order:', error);
        }
      }

      // Refresh the data and close the popup
      if (onRefresh) {
        onRefresh();
      }
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

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
        <ul 
          ref={scrollContainerRef}
          className="max-h-48 overflow-y-auto mb-4 space-y-2"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {localItems.map((item, index) => (
            <li
              key={item.id}
              draggable={editingId !== item.id}
              onDragStart={() => editingId !== item.id && handleDragStart(index)}
              onDragOver={(e) => editingId !== item.id && handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex justify-between items-center gap-2 p-3 border border-gray-200 rounded-lg transition-all ${
                editingId === item.id 
                  ? 'cursor-default'
                  : 'cursor-grab active:cursor-grabbing'
              } ${
                draggedIndex === index ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
              } hover:border-blue-300 hover:shadow-sm`}
            >
              {editingId === item.id ? (
                <>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-lg"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveEdit(item.id);
                      } else if (e.key === 'Escape') {
                        handleCancelEdit();
                      }
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveEdit(item.id)}
                    disabled={isSaving}
                    className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                    title="Save"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
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
                  <span className="text-gray-800 flex-1">{item.name}</span>
                  {onEdit && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(item);
                      }}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    disabled={deletingId === item.id}
                    className={`p-1 transition-colors ${
                      deletingId === item.id
                        ? 'text-red-400 cursor-not-allowed'
                        : 'text-red-600 hover:text-red-800'
                    }`}
                    title="Delete"
                  >
                    {deletingId === item.id ? (
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
            placeholder={`Add new ${title}`}
            className="flex-1 p-2 border border-gray-300 rounded-lg"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSave();
              }
            }}
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || (!newName.trim() && !hasReordered)}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
              isSaving
                ? 'bg-blue-400 text-white cursor-not-allowed'
                : (newName.trim() || hasReordered)
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
