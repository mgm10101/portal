// src/components/students/masterlist/SearchFilterBar.tsx

import React from 'react';
import { Search, Filter, Plus } from 'lucide-react';

interface SearchFilterBarProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onAddStudent: () => void;
  onFilterClick: () => void;
  hasActiveFilters: boolean;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchTerm,
  onSearchTermChange,
  onAddStudent,
  onFilterClick,
  hasActiveFilters,
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search Students by Name or Admission Number..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button 
          onClick={onFilterClick}
          className={`flex-shrink-0 flex items-center justify-center p-2 md:px-4 md:py-2 border rounded-lg transition-colors relative ${
            hasActiveFilters 
              ? 'border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100' 
              : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-4 h-4 md:mr-2" />
          <span className="hidden md:inline">Filters</span>
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full"></span>
          )}
        </button>
        <button
          onClick={onAddStudent}
          className="flex-shrink-0 bg-blue-600 text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
        >
          <Plus className="w-5 h-5 md:mr-2" />
          <span className="hidden md:inline">Add Student</span>
        </button>
      </div>
    </div>
  );
};
