import React, { useState } from 'react';
import { Plus, Search, Clock, Users, Calendar, Edit, Trash2, User, X } from 'lucide-react';

type ShiftStatus = 'active' | 'upcoming' | 'completed' | 'cancelled';
type Department = 'teachers' | 'security' | 'cleaners' | 'administrative' | 'maintenance' | 'other';

interface ShiftTable {
  rowLabels: string[]; // e.g., ["8:00 AM - 4:00 PM", "4:00 PM - 12:00 AM", "12:00 AM - 8:00 AM"]
  columnLabels: string[]; // e.g., ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  cells: { [key: string]: string }; // key format: "rowIndex-columnIndex", value: staff name
}

interface Shift {
  id: number;
  title: string;
  department: Department;
  period: string;
  startDate: string;
  endDate: string;
  createdBy: string;
  createdAt: string;
  status: ShiftStatus;
  table: ShiftTable;
  notes: string;
}

export const Shifts: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<Department | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ShiftStatus | 'all'>('all');
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDepartment, setFormDepartment] = useState<Department>('teachers');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formPeriod, setFormPeriod] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formRowLabels, setFormRowLabels] = useState<string[]>([]);
  const [formColumnLabels, setFormColumnLabels] = useState<string[]>([]);
  const [formCells, setFormCells] = useState<{ [key: string]: string }>({});

  // Sample shifts
  const shifts: Shift[] = [
    {
      id: 1,
      title: 'Teachers Duty Roster - March 2024',
      department: 'teachers',
      period: 'Week 1-4, March 2024',
      startDate: '2024-03-01',
      endDate: '2024-03-31',
      createdBy: 'Principal',
      createdAt: '2024-02-25',
      status: 'active',
      table: {
        rowLabels: ['7:30 AM - 8:00 AM', '12:00 PM - 1:00 PM', '3:30 PM - 4:00 PM'],
        columnLabels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        cells: {
          '0-0': 'John Teacher',
          '0-1': 'Sarah Teacher',
          '0-2': 'Michael Teacher',
          '0-3': 'Emily Teacher',
          '0-4': 'David Teacher',
          '1-0': 'Robert Teacher',
          '1-1': 'Jennifer Teacher',
          '1-2': 'William Teacher',
          '1-3': 'Patricia Teacher',
          '1-4': 'James Teacher',
          '2-0': 'Mary Teacher',
          '2-1': 'Linda Teacher',
          '2-2': 'Richard Teacher',
          '2-3': 'Barbara Teacher',
          '2-4': 'Joseph Teacher'
        }
      },
      notes: 'Weekly rotation for morning assembly, lunch, and dismissal duties.'
    },
    {
      id: 2,
      title: 'Security Shifts - Q1 2024',
      department: 'security',
      period: 'January - March 2024',
      startDate: '2024-01-01',
      endDate: '2024-03-31',
      createdBy: 'Security Manager',
      createdAt: '2023-12-20',
      status: 'active',
      table: {
        rowLabels: ['6:00 AM - 6:00 PM', '6:00 PM - 6:00 AM'],
        columnLabels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        cells: {
          '0-0': 'James Security',
          '0-1': 'James Security',
          '0-2': 'James Security',
          '0-3': 'James Security',
          '0-4': 'James Security',
          '0-5': 'Robert Security',
          '0-6': 'Robert Security',
          '1-0': 'Robert Security',
          '1-1': 'Robert Security',
          '1-2': 'Robert Security',
          '1-3': 'Robert Security',
          '1-4': 'Robert Security',
          '1-5': 'David Security',
          '1-6': 'David Security'
        }
      },
      notes: '12-hour shift rotation. Day shift: 6 AM - 6 PM, Night shift: 6 PM - 6 AM.'
    },
    {
      id: 3,
      title: 'Cleaners Schedule - March 2024',
      department: 'cleaners',
      period: 'March 2024',
      startDate: '2024-03-01',
      endDate: '2024-03-31',
      createdBy: 'Facilities Manager',
      createdAt: '2024-02-28',
      status: 'active',
      table: {
        rowLabels: ['6:00 AM - 2:00 PM', '2:00 PM - 10:00 PM'],
        columnLabels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        cells: {
          '0-0': 'Mary Cleaner\nBlock A',
          '0-1': 'Mary Cleaner\nBlock A',
          '0-2': 'Mary Cleaner\nBlock A',
          '0-3': 'Mary Cleaner\nBlock A',
          '0-4': 'Mary Cleaner\nBlock A',
          '1-0': 'Patricia Cleaner\nBlock B',
          '1-1': 'Patricia Cleaner\nBlock B',
          '1-2': 'Patricia Cleaner\nBlock B',
          '1-3': 'Patricia Cleaner\nBlock B',
          '1-4': 'Patricia Cleaner\nBlock B'
        }
      },
      notes: 'Morning shift covers Block A classrooms. Afternoon shift covers Block B classrooms and common areas.'
    }
  ];

  const filteredShifts = shifts.filter(shift => {
    const matchesSearch = shift.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shift.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || shift.department === filterDepartment;
    const matchesStatus = filterStatus === 'all' || shift.status === filterStatus;
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const getDepartmentColor = (dept: Department) => {
    const colors: Record<Department, string> = {
      teachers: 'bg-blue-100 text-blue-800 border-blue-200',
      security: 'bg-red-100 text-red-800 border-red-200',
      cleaners: 'bg-green-100 text-green-800 border-green-200',
      administrative: 'bg-purple-100 text-purple-800 border-purple-200',
      maintenance: 'bg-orange-100 text-orange-800 border-orange-200',
      other: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[dept] || colors.other;
  };

  const getStatusColor = (status: ShiftStatus) => {
    const colors: Record<ShiftStatus, string> = {
      active: 'bg-green-100 text-green-800',
      upcoming: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    setShowForm(false);
    // Reset form
    setFormTitle('');
    setFormDepartment('teachers');
    setFormStartDate('');
    setFormEndDate('');
    setFormPeriod('');
    setFormNotes('');
    setFormRowLabels([]);
    setFormColumnLabels([]);
    setFormCells({});
  };

  const addRowLabel = () => {
    setFormRowLabels([...formRowLabels, '']);
  };

  const removeRowLabel = (index: number) => {
    const newRows = formRowLabels.filter((_, i) => i !== index);
    setFormRowLabels(newRows);
    // Remove cells for this row
    const newCells = { ...formCells };
    formColumnLabels.forEach((_, colIndex) => {
      delete newCells[`${index}-${colIndex}`];
    });
    // Update remaining row indices
    const updatedCells: { [key: string]: string } = {};
    Object.keys(newCells).forEach(key => {
      const [row, col] = key.split('-').map(Number);
      if (row > index) {
        updatedCells[`${row - 1}-${col}`] = newCells[key];
      } else if (row < index) {
        updatedCells[key] = newCells[key];
      }
    });
    setFormCells(updatedCells);
  };

  const addColumnLabel = () => {
    setFormColumnLabels([...formColumnLabels, '']);
  };

  const removeColumnLabel = (index: number) => {
    const newCols = formColumnLabels.filter((_, i) => i !== index);
    setFormColumnLabels(newCols);
    // Remove cells for this column
    const newCells = { ...formCells };
    formRowLabels.forEach((_, rowIndex) => {
      delete newCells[`${rowIndex}-${index}`];
    });
    // Update remaining column indices
    const updatedCells: { [key: string]: string } = {};
    Object.keys(newCells).forEach(key => {
      const [row, col] = key.split('-').map(Number);
      if (col > index) {
        updatedCells[`${row}-${col - 1}`] = newCells[key];
      } else if (col < index) {
        updatedCells[key] = newCells[key];
      }
    });
    setFormCells(updatedCells);
  };

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    setFormCells({
      ...formCells,
      [`${rowIndex}-${colIndex}`]: value
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Shifts & Rosters</h1>
          <p className="text-gray-600 mt-1">Manage staff shifts, duty rosters, and work schedules</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Shift
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search shifts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value as Department | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Departments</option>
            <option value="teachers">Teachers</option>
            <option value="security">Security</option>
            <option value="cleaners">Cleaners</option>
            <option value="administrative">Administrative</option>
            <option value="maintenance">Maintenance</option>
            <option value="other">Other</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ShiftStatus | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Shifts List */}
      <div className="space-y-6">
        {filteredShifts.map((shift) => (
          <div key={shift.id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{shift.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDepartmentColor(shift.department)}`}>
                      {shift.department.charAt(0).toUpperCase() + shift.department.slice(1)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(shift.status)}`}>
                      {shift.status.charAt(0).toUpperCase() + shift.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{shift.period}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(shift.startDate)} - {formatDate(shift.endDate)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>Created by {shift.createdBy}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedShift(shift)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="p-6 overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200">
                      Time/Shift
                    </th>
                    {shift.table.columnLabels.map((col, index) => (
                      <th
                        key={index}
                        className="px-4 py-3 text-center text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 min-w-[120px]"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shift.table.rowLabels.map((rowLabel, rowIndex) => (
                    <tr key={rowIndex}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 bg-gray-50 border border-gray-200 whitespace-nowrap">
                        {rowLabel}
                      </td>
                      {shift.table.columnLabels.map((_, colIndex) => {
                        const cellKey = `${rowIndex}-${colIndex}`;
                        const cellValue = shift.table.cells[cellKey] || '';
                        return (
                          <td
                            key={colIndex}
                            className="px-4 py-3 text-sm text-gray-700 border border-gray-200 text-center min-h-[60px]"
                          >
                            {cellValue.split('\n').map((line, i) => (
                              <div key={i} className={i > 0 ? 'mt-1' : ''}>{line}</div>
                            ))}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Notes */}
            {shift.notes && (
              <div className="px-6 pb-6">
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{shift.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredShifts.length === 0 && (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No shifts found</p>
          <p className="text-gray-400 text-sm mt-2">Create a new shift to get started</p>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-900">Create New Shift</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shift Title</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value as Department)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="teachers">Teachers</option>
                    <option value="security">Security</option>
                    <option value="cleaners">Cleaners</option>
                    <option value="administrative">Administrative</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Period Description</label>
                  <input
                    type="text"
                    value={formPeriod}
                    onChange={(e) => setFormPeriod(e.target.value)}
                    placeholder="e.g., Week 1-4, March 2024"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Row Labels */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700">Row Labels (e.g., Time Slots)</label>
                  <button
                    type="button"
                    onClick={addRowLabel}
                    className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Plus className="w-4 h-4" />
                    Add Row
                  </button>
                </div>
                <div className="space-y-2">
                  {formRowLabels.map((label, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={label}
                        onChange={(e) => {
                          const updated = [...formRowLabels];
                          updated[index] = e.target.value;
                          setFormRowLabels(updated);
                        }}
                        placeholder={`Row ${index + 1} (e.g., 8:00 AM - 4:00 PM)`}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => removeRowLabel(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column Labels */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700">Column Labels (e.g., Days of Week)</label>
                  <button
                    type="button"
                    onClick={addColumnLabel}
                    className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Plus className="w-4 h-4" />
                    Add Column
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formColumnLabels.map((label, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={label}
                        onChange={(e) => {
                          const updated = [...formColumnLabels];
                          updated[index] = e.target.value;
                          setFormColumnLabels(updated);
                        }}
                        placeholder={`Column ${index + 1} (e.g., Monday)`}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[150px]"
                      />
                      <button
                        type="button"
                        onClick={() => removeColumnLabel(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Table Builder */}
              {formRowLabels.length > 0 && formColumnLabels.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">Populate Table (Enter staff names in cells)</label>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200">
                            Time/Shift
                          </th>
                          {formColumnLabels.map((col, index) => (
                            <th
                              key={index}
                              className="px-3 py-2 text-center text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 min-w-[120px]"
                            >
                              {col || `Column ${index + 1}`}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {formRowLabels.map((rowLabel, rowIndex) => (
                          <tr key={rowIndex}>
                            <td className="px-3 py-2 text-sm font-medium text-gray-900 bg-gray-50 border border-gray-200 whitespace-nowrap">
                              {rowLabel || `Row ${rowIndex + 1}`}
                            </td>
                            {formColumnLabels.map((_, colIndex) => {
                              const cellKey = `${rowIndex}-${colIndex}`;
                              const cellValue = formCells[cellKey] || '';
                              return (
                                <td key={colIndex} className="px-2 py-2 border border-gray-200">
                                  <input
                                    type="text"
                                    value={cellValue}
                                    onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                                    placeholder="Staff name"
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">Tip: You can press Enter in a cell to add multiple lines (e.g., name and area)</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
