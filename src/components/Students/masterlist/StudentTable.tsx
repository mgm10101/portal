// src/components/Students/masterlist/StudentTable.tsx

import React, { useState, useRef, useEffect } from 'react';
import { User, Edit, Trash2, Loader2 } from 'lucide-react';

interface StudentTableProps {
  students: any[];
  onEdit: (student: any) => void;
  onDelete?: (student: any) => void;
  onBulkDelete?: (admissionNumbers: string[]) => void;
  deletingStudentId?: string | null;
}

export const StudentTable: React.FC<StudentTableProps> = ({
  students,
  onEdit,
  onDelete = () => {},
  onBulkDelete,
  deletingStudentId = null,
}) => {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isHoveringTable, setIsHoveringTable] = useState(false);

  // Handle keyboard navigation for horizontal scrolling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isHoveringTable || !scrollContainerRef.current) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        scrollContainerRef.current.scrollBy({
          left: -100,
          behavior: 'smooth'
        });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        scrollContainerRef.current.scrollBy({
          left: 100,
          behavior: 'smooth'
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHoveringTable]);

  const toggleSelection = (admissionNumber: string) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(admissionNumber)) {
        newSet.delete(admissionNumber);
      } else {
        newSet.add(admissionNumber);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedStudents(new Set(students.map(s => s.admission_number)));
  };

  const clearSelection = () => {
    setSelectedStudents(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedStudents.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedStudents.size} student(s)? This action cannot be undone.`)) {
      return;
    }

    if (onBulkDelete) {
      await onBulkDelete(Array.from(selectedStudents));
      clearSelection();
    }
  };

  const hasSelections = selectedStudents.size > 0;
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Bulk Actions Bar */}
      {hasSelections && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-600">
              {selectedStudents.size} selected
            </span>
            <button
              onClick={selectAll}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Select All ({students.length})
            </button>
            <button
              onClick={clearSelection}
              className="text-xs text-gray-600 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
          <button
            onClick={handleBulkDelete}
            className="text-xs text-red-600 hover:text-red-700 font-medium"
          >
            Delete Selected
          </button>
        </div>
      )}
      
      <style>{`
        .table-scroll-container {
          overflow-x: auto;
          overflow-y: visible;
        }
        
        .table-scroll-container::-webkit-scrollbar {
          height: 10px;
        }
        
        .table-scroll-container::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 5px;
        }
        
        .table-scroll-container::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 5px;
        }
        
        .table-scroll-container::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto relative table-scroll-container"
        onMouseEnter={() => setIsHoveringTable(true)}
        onMouseLeave={() => setIsHoveringTable(false)}
      >
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {/* Checkbox column header */}
              <th className="pl-3 pr-2 py-3 text-left w-10">
                {/* Empty header for checkbox column */}
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Admission Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Class
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Team
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Father Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mother Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Emergency Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => (
              <tr 
                key={student.admission_number} 
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onMouseEnter={() => setHoveredRow(student.admission_number)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => onEdit(student)}
              >
                {/* Checkbox column */}
                <td 
                  className="pl-3 pr-2 py-4 whitespace-nowrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={selectedStudents.has(student.admission_number)}
                    onChange={() => toggleSelection(student.admission_number)}
                    className={`w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 transition-opacity cursor-pointer ${
                      hoveredRow === student.admission_number || hasSelections
                        ? 'opacity-100'
                        : 'opacity-0'
                    }`}
                  />
                </td>
                <td className="px-2 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {student.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Age: {student.age}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {student.admission_number}
                    </div>
                    <div className="text-sm text-gray-500">
                      Date: {student.date_of_admission}
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {student.current_class?.name || student.current_class_id}
                    {student.stream?.name ? ` ${student.stream.name}` : ''}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {student.team_colour?.name || student.team_colour_id || '-'}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {student.father_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {student.father_phone}
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {student.mother_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {student.mother_phone}
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {student.emergency_contact}
                    </div>
                    <div className="text-sm text-gray-500">
                      {student.emergency_relationship}
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {student.address || '-'}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    student.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-pink-100 text-pink-800'
                  }`}>
                    {student.status}
                  </span>
                </td>

                <td 
                  className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex space-x-3 items-center">
                    <button
                      onClick={() => onEdit(student)}
                      disabled={deletingStudentId === student.admission_number}
                      className={`transition-colors ${
                        deletingStudentId === student.admission_number
                          ? 'text-green-300 cursor-not-allowed'
                          : 'text-green-600 hover:text-green-700'
                      }`}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(student)}
                      disabled={deletingStudentId === student.admission_number}
                      className={`transition-colors ${
                        deletingStudentId === student.admission_number
                          ? 'text-red-400 cursor-not-allowed'
                          : 'text-red-600 hover:text-red-700'
                      }`}
                    >
                      {deletingStudentId === student.admission_number ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
