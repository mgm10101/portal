import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, Loader2, ChevronDown, Trash2 } from 'lucide-react';
import { supabase } from '../../../supabaseClient';

interface ClassProgressionModalProps {
  onClose: () => void;
  classes: { id: number; name: string }[];
  onSuccess: () => void;
}

interface Student {
  admission_number: string;
  name: string;
  current_class_id: number;
  current_class?: { name: string };
}

export const ClassProgressionModal: React.FC<ClassProgressionModalProps> = ({
  onClose,
  classes,
  onSuccess,
}) => {
  const [classMapping, setClassMapping] = useState<Record<number, number>>({});
  const [graduationMapping, setGraduationMapping] = useState<Set<number>>(new Set());
  const [students, setStudents] = useState<Student[]>([]);
  const [excludedStudents, setExcludedStudents] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation for scrolling
  useEffect(() => {
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
    fetchActiveStudents();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const fetchActiveStudents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          admission_number,
          name,
          current_class_id,
          current_class:classes!current_class_id(name)
        `)
        .eq('status', 'Active')
        .order('name');
      
      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClassMapping = (fromClassId: number, toClassId: number) => {
    // If "Graduation" is selected (value will be -1)
    if (toClassId === -1) {
      setGraduationMapping(prev => new Set(prev).add(fromClassId));
      // Remove from class mapping if it was there
      setClassMapping(prev => {
        const newMapping = { ...prev };
        delete newMapping[fromClassId];
        return newMapping;
      });
    } else {
      // Remove from graduation mapping if it was there
      setGraduationMapping(prev => {
        const newSet = new Set(prev);
        newSet.delete(fromClassId);
        return newSet;
      });
      setClassMapping(prev => ({
        ...prev,
        [fromClassId]: toClassId,
      }));
    }
  };

  const addStudentToExclusion = (admissionNumber: string) => {
    setExcludedStudents(prev => new Set(prev).add(admissionNumber));
    setSearchTerm('');
    setDropdownOpen(false);
  };

  const removeStudentFromExclusion = (admissionNumber: string) => {
    setExcludedStudents(prev => {
      const newSet = new Set(prev);
      newSet.delete(admissionNumber);
      return newSet;
    });
  };

  const getExcludedStudentsList = () => {
    return students.filter(s => excludedStudents.has(s.admission_number));
  };

  const getAvailableStudents = () => {
    return students.filter(s => !excludedStudents.has(s.admission_number));
  };

  const getFilteredStudents = () => {
    const available = getAvailableStudents();
    if (!searchTerm) return available;
    return available.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.admission_number.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleProgressStudents = async () => {
    setIsProcessing(true);
    try {
      // Filter students who will progress to a new class
      const studentsToProgress = students.filter(student => 
        !excludedStudents.has(student.admission_number) &&
        classMapping[student.current_class_id] &&
        !graduationMapping.has(student.current_class_id)
      );

      // Filter students who will graduate (set to inactive)
      const studentsToGraduate = students.filter(student => 
        !excludedStudents.has(student.admission_number) &&
        graduationMapping.has(student.current_class_id)
      );

      // Update students to new classes
      const classUpdates = studentsToProgress.map(student =>
        supabase
          .from('students')
          .update({ current_class_id: classMapping[student.current_class_id] })
          .eq('admission_number', student.admission_number)
      );

      // Set graduating students to inactive with withdrawal date set to today
      const today = new Date().toISOString().split('T')[0];
      const graduationUpdates = studentsToGraduate.map(student =>
        supabase
          .from('students')
          .update({ 
            status: 'Inactive',
            withdrawal_date: today
          })
          .eq('admission_number', student.admission_number)
      );

      await Promise.all([...classUpdates, ...graduationUpdates]);
      
      const totalProcessed = studentsToProgress.length + studentsToGraduate.length;
      const message = `Successfully processed ${totalProcessed} student(s)! ` +
        `${studentsToProgress.length} progressed to new classes, ` +
        `${studentsToGraduate.length} graduated (set to inactive).`;
      alert(message);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error progressing students:', error);
      alert('Error progressing students. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStudentsByClass = (classId: number) => {
    return students.filter(s => s.current_class_id === classId);
  };

  const getProgressionCount = () => {
    return students.filter(s => 
      !excludedStudents.has(s.admission_number) &&
      (classMapping[s.current_class_id] || graduationMapping.has(s.current_class_id))
    ).length;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Class Progression</h2>
            <p className="text-sm text-gray-600 mt-1">Map classes and select students to progress</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-6 space-y-6"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Class Mapping */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Class Progression Mapping</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-[1fr_auto_1fr] gap-4 mb-2">
                <div className="text-sm font-medium text-gray-700">Current Class</div>
                <div></div>
                <div className="text-sm font-medium text-gray-700">Progresses To</div>
              </div>
              <div className="space-y-3">
                {classes.map(fromClass => (
                  <div key={fromClass.id} className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                    <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                      <span className="text-gray-800">{fromClass.name}</span>
                      <span className="text-xs text-gray-500">
                        ({getStudentsByClass(fromClass.id).length} students)
                      </span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                    <select
                      value={graduationMapping.has(fromClass.id) ? -1 : (classMapping[fromClass.id] || '')}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        handleClassMapping(fromClass.id, value);
                      }}
                      className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select next class...</option>
                      <option value="-1">Graduation (Set to Inactive)</option>
                      {classes.map(toClass => (
                        <option key={toClass.id} value={toClass.id}>
                          {toClass.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Exclusion List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Students Not Progressing
              <span className="text-sm font-normal text-gray-600 ml-2">
                (Add students who will stay in their current class)
              </span>
            </h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                <span className="ml-2 text-gray-600">Loading students...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Searchable Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <div 
                    className="flex items-center border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-blue-400 transition-colors"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDropdownOpen(true);
                      }}
                      placeholder="Search and select a student..."
                      className="flex-1 px-3 py-2 rounded-l-lg focus:outline-none"
                    />
                    <button
                      type="button"
                      className="px-3 py-2 text-gray-500"
                    >
                      <ChevronDown className={`w-4 h-4 transform transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {dropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {getFilteredStudents().length === 0 ? (
                        <div className="px-3 py-4 text-center text-gray-500 text-sm">
                          {searchTerm ? 'No students found' : 'All students already added'}
                        </div>
                      ) : (
                        getFilteredStudents().map(student => (
                          <div
                            key={student.admission_number}
                            onClick={() => addStudentToExclusion(student.admission_number)}
                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="text-sm font-medium text-gray-800">{student.name}</div>
                            <div className="text-xs text-gray-500">
                              {student.admission_number} - {student.current_class?.name || 'N/A'}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Students List */}
                {getExcludedStudentsList().length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Selected Students ({excludedStudents.size})
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {getExcludedStudentsList().map(student => (
                        <div
                          key={student.admission_number}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                        >
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-800">{student.name}</div>
                            <div className="text-xs text-gray-500">
                              {student.admission_number} - Current: {student.current_class?.name || 'N/A'}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeStudentFromExclusion(student.admission_number)}
                            className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Progression Summary</h4>
            <div className="text-sm text-blue-800">
              <p><strong>{students.filter(s => !excludedStudents.has(s.admission_number) && classMapping[s.current_class_id] && !graduationMapping.has(s.current_class_id)).length}</strong> students will be progressed to new classes</p>
              <p><strong>{students.filter(s => !excludedStudents.has(s.admission_number) && graduationMapping.has(s.current_class_id)).length}</strong> students will graduate (set to inactive)</p>
              <p><strong>{excludedStudents.size}</strong> students will remain in current class</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            onClick={handleProgressStudents}
            disabled={isProcessing || getProgressionCount() === 0}
            className={`px-6 py-2 text-sm text-white rounded-lg transition-colors flex items-center ${
              isProcessing || getProgressionCount() === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Process ${getProgressionCount()} Students`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

