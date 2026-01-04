// src/components/Financial/Invoices/InvoiceFilters.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, Plus, X } from 'lucide-react';
import { InvoiceHeader } from '../../../types/database';

interface InvoiceFiltersProps {
  onCreateInvoice: () => void;
  invoices: InvoiceHeader[];
  onFilterChange: (filteredInvoices: InvoiceHeader[]) => void;
}

interface FilterState {
  searchQuery: string;
  student: string;
  class: string;
  status: string;
  totalMin: string;
  totalMax: string;
  balanceDueMin: string;
  balanceDueMax: string;
  dueDateFrom: string;
  dueDateTo: string;
}

export const InvoiceFilters: React.FC<InvoiceFiltersProps> = ({ 
  onCreateInvoice, 
  invoices,
  onFilterChange 
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    student: '',
    class: '',
    status: '',
    totalMin: '',
    totalMax: '',
    balanceDueMin: '',
    balanceDueMax: '',
    dueDateFrom: '',
    dueDateTo: '',
  });
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const studentDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (studentDropdownRef.current && !studentDropdownRef.current.contains(event.target as Node)) {
        setShowStudentDropdown(false);
      }
    };

    if (showStudentDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStudentDropdown]);

  // Get unique students (combining name and admission number)
  const uniqueStudents = React.useMemo(() => {
    const studentMap = new Map<string, { name: string; admissionNumber: string }>();
    invoices.forEach(inv => {
      const key = `${inv.admission_number}`;
      if (!studentMap.has(key)) {
        studentMap.set(key, {
          name: inv.name,
          admissionNumber: inv.admission_number
        });
      }
    });
    return Array.from(studentMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  }, [invoices]);

  // Filter students based on search query
  const filteredStudents = React.useMemo(() => {
    if (!studentSearchQuery.trim()) {
      return uniqueStudents;
    }
    const query = studentSearchQuery.toLowerCase().trim();
    return uniqueStudents.filter(student =>
      student.name.toLowerCase().includes(query) ||
      student.admissionNumber.toLowerCase().includes(query)
    );
  }, [uniqueStudents, studentSearchQuery]);

  // Get unique classes and statuses for dropdowns
  const uniqueClasses = Array.from(new Set(invoices.map(inv => inv.class_name).filter(Boolean))) as string[];
  const statuses: InvoiceHeader['status'][] = ['Draft', 'Pending', 'Paid', 'Overdue', 'Forwarded'];

  // Apply filters
  React.useEffect(() => {
    let filtered = [...invoices];

    // Search filter (student name, admission number, invoice number)
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(invoice => 
        invoice.name.toLowerCase().includes(query) ||
        invoice.admission_number.toLowerCase().includes(query) ||
        invoice.invoice_number.toLowerCase().includes(query)
      );
    }

    // Student filter (by admission number - exact match)
    if (filters.student) {
      filtered = filtered.filter(invoice => invoice.admission_number === filters.student);
    }

    // Class filter
    if (filters.class) {
      filtered = filtered.filter(invoice => invoice.class_name === filters.class);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(invoice => invoice.status === filters.status);
    }

    // Total range filter
    if (filters.totalMin) {
      const min = parseFloat(filters.totalMin);
      if (!isNaN(min)) {
        filtered = filtered.filter(invoice => invoice.totalAmount >= min);
      }
    }
    if (filters.totalMax) {
      const max = parseFloat(filters.totalMax);
      if (!isNaN(max)) {
        filtered = filtered.filter(invoice => invoice.totalAmount <= max);
      }
    }

    // Balance due range filter
    if (filters.balanceDueMin) {
      const min = parseFloat(filters.balanceDueMin);
      if (!isNaN(min)) {
        filtered = filtered.filter(invoice => invoice.balanceDue >= min);
      }
    }
    if (filters.balanceDueMax) {
      const max = parseFloat(filters.balanceDueMax);
      if (!isNaN(max)) {
        filtered = filtered.filter(invoice => invoice.balanceDue <= max);
      }
    }

    // Due date range filter
    if (filters.dueDateFrom) {
      filtered = filtered.filter(invoice => invoice.due_date >= filters.dueDateFrom);
    }
    if (filters.dueDateTo) {
      filtered = filtered.filter(invoice => invoice.due_date <= filters.dueDateTo);
    }

    onFilterChange(filtered);
  }, [filters, invoices, onFilterChange]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: '',
      student: '',
      class: '',
      status: '',
      totalMin: '',
      totalMax: '',
      balanceDueMin: '',
      balanceDueMax: '',
      dueDateFrom: '',
      dueDateTo: '',
    });
    setStudentSearchQuery('');
  };

  const handleStudentSelect = (admissionNumber: string) => {
    handleFilterChange('student', admissionNumber);
    setShowStudentDropdown(false);
    setStudentSearchQuery('');
  };

  const handleStudentClear = () => {
    handleFilterChange('student', '');
    setStudentSearchQuery('');
  };

  const selectedStudent = uniqueStudents.find(s => s.admissionNumber === filters.student);

  const hasActiveFilters = filters.student || filters.class || filters.status || 
    filters.totalMin || filters.totalMax || filters.balanceDueMin || 
    filters.balanceDueMax || filters.dueDateFrom || filters.dueDateTo;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="p-4">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student name, admission number, or invoice number..."
              value={filters.searchQuery}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button 
            onClick={() => setShowFilters(true)}
            className={`flex-shrink-0 flex items-center justify-center p-2 md:px-4 md:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 ${
              hasActiveFilters ? 'bg-blue-50 border-blue-300' : ''
            }`}
          >
            <Filter className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Filters</span>
          </button>
          <button
            onClick={onCreateInvoice}
            className="flex-shrink-0 bg-blue-600 text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
          >
            <Plus className="w-5 h-5 md:mr-2" />
            <span className="hidden md:inline">Manage Invoices</span>
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Filter Invoices</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Student Filter - Searchable Dropdown */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student (Name/Admission)
                </label>
                <div className="relative" ref={studentDropdownRef}>
                  <input
                    type="text"
                    placeholder="Search student..."
                    value={selectedStudent && !showStudentDropdown 
                      ? `${selectedStudent.name} (${selectedStudent.admissionNumber})` 
                      : studentSearchQuery}
                    onChange={(e) => {
                      const value = e.target.value;
                      setStudentSearchQuery(value);
                      setShowStudentDropdown(true);
                      if (filters.student) {
                        handleFilterChange('student', '');
                      }
                    }}
                    onFocus={() => {
                      setShowStudentDropdown(true);
                      if (selectedStudent) {
                        setStudentSearchQuery('');
                      }
                    }}
                    className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {selectedStudent && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStudentClear();
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {showStudentDropdown && filteredStudents.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {filteredStudents.map((student) => (
                        <button
                          key={student.admissionNumber}
                          type="button"
                          onClick={() => handleStudentSelect(student.admissionNumber)}
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                        >
                          <div className="font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">Adm: {student.admissionNumber}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  {showStudentDropdown && studentSearchQuery && filteredStudents.length === 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                      <div className="px-3 py-2 text-sm text-gray-500">No students found</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Class Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class
                </label>
                <select
                  value={filters.class}
                  onChange={(e) => handleFilterChange('class', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Classes</option>
                  {uniqueClasses.map(className => (
                    <option key={className} value={className}>{className}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* Total Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Amount (Min)
                </label>
                <input
                  type="number"
                  placeholder="Min amount"
                  value={filters.totalMin}
                  onChange={(e) => handleFilterChange('totalMin', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Amount (Max)
                </label>
                <input
                  type="number"
                  placeholder="Max amount"
                  value={filters.totalMax}
                  onChange={(e) => handleFilterChange('totalMax', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Balance Due Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Balance Due (Min)
                </label>
                <input
                  type="number"
                  placeholder="Min balance"
                  value={filters.balanceDueMin}
                  onChange={(e) => handleFilterChange('balanceDueMin', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Balance Due (Max)
                </label>
                <input
                  type="number"
                  placeholder="Max balance"
                  value={filters.balanceDueMax}
                  onChange={(e) => handleFilterChange('balanceDueMax', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Due Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date (From)
                </label>
                <input
                  type="date"
                  value={filters.dueDateFrom}
                  onChange={(e) => handleFilterChange('dueDateFrom', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date (To)
                </label>
                <input
                  type="date"
                  value={filters.dueDateTo}
                  onChange={(e) => handleFilterChange('dueDateTo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </button>
              </div>
            )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceFilters;
