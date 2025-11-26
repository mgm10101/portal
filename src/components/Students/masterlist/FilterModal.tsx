import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

export interface FilterState {
  currentClass: string;
  classAdmittedTo: string;
  minAge: string;
  maxAge: string;
  stream: string;
  status: string;
}

interface FilterModalProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClose: () => void;
  onApply: () => void;
  onClear: () => void;
  classesList: any[];
  streamsList: any[];
}

export const FilterModal: React.FC<FilterModalProps> = ({
  filters,
  onFiltersChange,
  onClose,
  onApply,
  onClear,
  classesList,
  streamsList,
}) => {
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

  const handleChange = (field: keyof FilterState, value: string) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        ref={scrollContainerRef}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto scrollbar-hide"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <style>
          {`
            @media (min-width: 768px) {
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
              .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
            }
          `}
        </style>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Filter Students</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Content */}
        <div className="p-6 space-y-6">
          {/* Current Class */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Class
            </label>
            <select
              value={filters.currentClass}
              onChange={(e) => handleChange('currentClass', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Classes</option>
              {classesList.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Class Admitted To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class Admitted To
            </label>
            <select
              value={filters.classAdmittedTo}
              onChange={(e) => handleChange('classAdmittedTo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Classes</option>
              {classesList.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Age Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age Range
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Min Age</label>
                <input
                  type="number"
                  value={filters.minAge}
                  onChange={(e) => handleChange('minAge', e.target.value)}
                  placeholder="0"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Max Age</label>
                <input
                  type="number"
                  value={filters.maxAge}
                  onChange={(e) => handleChange('maxAge', e.target.value)}
                  placeholder="100"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Stream */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stream
            </label>
            <select
              value={filters.stream}
              onChange={(e) => handleChange('stream', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Streams</option>
              {streamsList.map((stream) => (
                <option key={stream.id} value={stream.id}>
                  {stream.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClear}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onApply}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

