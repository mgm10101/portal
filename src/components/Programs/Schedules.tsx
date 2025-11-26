import React, { useState } from 'react';
import { Plus, Search, Calendar, Clock, BookOpen, UtensilsCrossed, Edit, Trash2, Users, X } from 'lucide-react';

type ScheduleType = 'timetable' | 'meal-plan' | 'activity' | 'exam' | 'other';
type ScheduleStatus = 'active' | 'draft' | 'archived';

interface ScheduleTable {
  rowLabels: string[]; // e.g., ["8:00 - 8:45", "8:45 - 9:30", "9:30 - 10:15"]
  columnLabels: string[]; // e.g., ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  cells: { [key: string]: string }; // key format: "rowIndex-columnIndex", value: subject/activity name
}

interface Schedule {
  id: number;
  title: string;
  type: ScheduleType;
  period: string;
  startDate: string;
  endDate: string;
  applicableTo: string;
  createdBy: string;
  createdAt: string;
  status: ScheduleStatus;
  table: ScheduleTable;
  notes: string;
}

export const Schedules: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<ScheduleType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ScheduleStatus | 'all'>('all');
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<ScheduleType>('timetable');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formPeriod, setFormPeriod] = useState('');
  const [formApplicableTo, setFormApplicableTo] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formRowLabels, setFormRowLabels] = useState<string[]>([]);
  const [formColumnLabels, setFormColumnLabels] = useState<string[]>([]);
  const [formCells, setFormCells] = useState<{ [key: string]: string }>({});

  // Sample schedules
  const schedules: Schedule[] = [
    {
      id: 1,
      title: 'Grade 8 Class Timetable - Term 1',
      type: 'timetable',
      period: 'Term 1, 2024',
      startDate: '2024-01-15',
      endDate: '2024-04-12',
      applicableTo: 'Grade 8',
      createdBy: 'Academic Coordinator',
      createdAt: '2024-01-10',
      status: 'active',
      table: {
        rowLabels: [
          '8:00 - 8:45',
          '8:45 - 9:30',
          '9:30 - 10:15',
          '10:15 - 11:00',
          '11:00 - 11:30',
          '11:30 - 12:15',
          '12:15 - 1:00',
          '1:00 - 2:00',
          '2:00 - 2:45',
          '2:45 - 3:30'
        ],
        columnLabels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        cells: {
          '0-0': 'Mathematics\nMr. Johnson\nRoom 201',
          '0-1': 'English\nMs. Williams\nRoom 202',
          '0-2': 'Science\nDr. Smith\nLab 1',
          '0-3': 'Social Studies\nMrs. Brown\nRoom 203',
          '0-4': 'Mathematics\nMr. Johnson\nRoom 201',
          '1-0': 'English\nMs. Williams\nRoom 202',
          '1-1': 'Mathematics\nMr. Johnson\nRoom 201',
          '1-2': 'Physical Education\nCoach Davis\nSports Field',
          '1-3': 'Science\nDr. Smith\nLab 1',
          '1-4': 'English\nMs. Williams\nRoom 202',
          '2-0': 'Science\nDr. Smith\nLab 1',
          '2-1': 'Social Studies\nMrs. Brown\nRoom 203',
          '2-2': 'Mathematics\nMr. Johnson\nRoom 201',
          '2-3': 'English\nMs. Williams\nRoom 202',
          '2-4': 'Science\nDr. Smith\nLab 1',
          '3-0': 'Social Studies\nMrs. Brown\nRoom 203',
          '3-1': 'Science\nDr. Smith\nLab 1',
          '3-2': 'English\nMs. Williams\nRoom 202',
          '3-3': 'Mathematics\nMr. Johnson\nRoom 201',
          '3-4': 'Social Studies\nMrs. Brown\nRoom 203',
          '4-0': 'Break',
          '4-1': 'Break',
          '4-2': 'Break',
          '4-3': 'Break',
          '4-4': 'Break',
          '5-0': 'Physical Education\nCoach Davis\nSports Field',
          '5-1': 'Arts\nMs. Taylor\nArt Room',
          '5-2': 'Mathematics\nMr. Johnson\nRoom 201',
          '5-3': 'Physical Education\nCoach Davis\nSports Field',
          '5-4': 'Arts\nMs. Taylor\nArt Room',
          '6-0': 'Arts\nMs. Taylor\nArt Room',
          '6-1': 'Physical Education\nCoach Davis\nSports Field',
          '6-2': 'Social Studies\nMrs. Brown\nRoom 203',
          '6-3': 'Arts\nMs. Taylor\nArt Room',
          '6-4': 'Physical Education\nCoach Davis\nSports Field',
          '7-0': 'Lunch',
          '7-1': 'Lunch',
          '7-2': 'Lunch',
          '7-3': 'Lunch',
          '7-4': 'Lunch',
          '8-0': 'Mathematics\nMr. Johnson\nRoom 201',
          '8-1': 'English\nMs. Williams\nRoom 202',
          '8-2': 'Science\nDr. Smith\nLab 1',
          '8-3': 'Social Studies\nMrs. Brown\nRoom 203',
          '8-4': 'Mathematics\nMr. Johnson\nRoom 201',
          '9-0': 'English\nMs. Williams\nRoom 202',
          '9-1': 'Mathematics\nMr. Johnson\nRoom 201',
          '9-2': 'Science\nDr. Smith\nLab 1',
          '9-3': 'English\nMs. Williams\nRoom 202',
          '9-4': 'Social Studies\nMrs. Brown\nRoom 203'
        }
      },
      notes: 'Official class timetable for Grade 8 students. All students must follow this schedule.'
    },
    {
      id: 2,
      title: 'Boarding Meal Plan - March 2024',
      type: 'meal-plan',
      period: 'March 2024',
      startDate: '2024-03-01',
      endDate: '2024-03-31',
      applicableTo: 'All Boarding Students',
      createdBy: 'Catering Manager',
      createdAt: '2024-02-25',
      status: 'active',
      table: {
        rowLabels: ['7:00 - 8:00', '12:30 - 1:30', '6:00 - 7:00'],
        columnLabels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        cells: {
          '0-0': 'Breakfast\nScrambled eggs, toast, cereal, fruit, juice',
          '0-1': 'Breakfast\nPancakes, syrup, sausages, fruit, milk',
          '0-2': 'Breakfast\nOatmeal, boiled eggs, toast, fruit',
          '0-3': 'Breakfast\nFrench toast, bacon, fruit, juice',
          '0-4': 'Breakfast\nCereal, yogurt, toast, fruit',
          '0-5': 'Breakfast\nPancakes, eggs, fruit, juice',
          '0-6': 'Breakfast\nContinental breakfast',
          '1-0': 'Lunch\nRice, chicken stew, vegetables, salad',
          '1-1': 'Lunch\nJollof rice, fried chicken, coleslaw',
          '1-2': 'Lunch\nFried rice, beef, mixed vegetables',
          '1-3': 'Lunch\nPasta, meatballs, garlic bread',
          '1-4': 'Lunch\nRice, fish curry, vegetables',
          '1-5': 'Lunch\nSpecial weekend menu',
          '1-6': 'Lunch\nSunday special',
          '2-0': 'Dinner\nPasta, meatballs, garlic bread, dessert',
          '2-1': 'Dinner\nSoup, bread, grilled fish, vegetables',
          '2-2': 'Dinner\nPizza, salad, fruit juice',
          '2-3': 'Dinner\nRice, chicken curry, vegetables',
          '2-4': 'Dinner\nSpaghetti, meat sauce, salad',
          '2-5': 'Dinner\nWeekend special',
          '2-6': 'Dinner\nSunday dinner'
        }
      },
      notes: 'Monthly meal plan for boarding students. Special dietary requirements are accommodated upon request.'
    },
    {
      id: 3,
      title: 'Grade 10 Exam Schedule - Mid-Term',
      type: 'exam',
      period: 'Mid-Term Exams, March 2024',
      startDate: '2024-03-18',
      endDate: '2024-03-22',
      applicableTo: 'Grade 10',
      createdBy: 'Examination Officer',
      createdAt: '2024-03-01',
      status: 'active',
      table: {
        rowLabels: ['9:00 - 11:00', '11:30 - 1:30'],
        columnLabels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        cells: {
          '0-0': 'Mathematics\nMain Hall',
          '0-1': 'Physics\nMain Hall',
          '0-2': 'Biology\nMain Hall',
          '0-3': 'Geography\nMain Hall',
          '0-4': 'French\nMain Hall',
          '1-0': 'English\nMain Hall',
          '1-1': 'Chemistry\nMain Hall',
          '1-2': 'History\nMain Hall',
          '1-3': 'Additional Subject\nMain Hall',
          '1-4': 'Additional Subject\nMain Hall'
        }
      },
      notes: 'Mid-term examination schedule for Grade 10 students. All students must arrive 15 minutes before exam time.'
    },
    {
      id: 4,
      title: 'After-School Activities Schedule',
      type: 'activity',
      period: 'Term 1, 2024',
      startDate: '2024-01-15',
      endDate: '2024-04-12',
      applicableTo: 'All Students',
      createdBy: 'Activities Coordinator',
      createdAt: '2024-01-12',
      status: 'active',
      table: {
        rowLabels: ['3:30 - 5:00 PM'],
        columnLabels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        cells: {
          '0-0': 'Football Practice\nSports Field\nJunior & Senior teams',
          '0-1': 'Debate Club\nRoom 301\nDebate and public speaking',
          '0-2': 'Music Club\nMusic Room\nChoir and instrumental',
          '0-3': 'Art Club\nArt Room\nDrawing, painting, crafts',
          '0-4': 'Science Club\nLab 2\nExperiments and projects'
        }
      },
      notes: 'After-school activities are optional but highly encouraged. Students can join multiple clubs.'
    }
  ];

  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = schedule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || schedule.type === filterType;
    const matchesStatus = filterStatus === 'all' || schedule.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeColor = (type: ScheduleType) => {
    const colors: Record<ScheduleType, string> = {
      timetable: 'bg-blue-100 text-blue-800 border-blue-200',
      'meal-plan': 'bg-orange-100 text-orange-800 border-orange-200',
      activity: 'bg-green-100 text-green-800 border-green-200',
      exam: 'bg-red-100 text-red-800 border-red-200',
      other: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[type] || colors.other;
  };

  const getStatusColor = (status: ScheduleStatus) => {
    const colors: Record<ScheduleStatus, string> = {
      active: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    return colors[status];
  };

  const getTypeIcon = (type: ScheduleType) => {
    switch (type) {
      case 'timetable':
        return <BookOpen className="w-5 h-5" />;
      case 'meal-plan':
        return <UtensilsCrossed className="w-5 h-5" />;
      case 'activity':
        return <Users className="w-5 h-5" />;
      case 'exam':
        return <Calendar className="w-5 h-5" />;
      default:
        return <Calendar className="w-5 h-5" />;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    setShowForm(false);
    // Reset form
    setFormTitle('');
    setFormType('timetable');
    setFormStartDate('');
    setFormEndDate('');
    setFormPeriod('');
    setFormApplicableTo('');
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
          <h1 className="text-3xl font-semibold text-gray-900">Schedules</h1>
          <p className="text-gray-600 mt-1">Manage timetables, meal plans, and activity schedules</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Schedule
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search schedules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as ScheduleType | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="timetable">Timetable</option>
            <option value="meal-plan">Meal Plan</option>
            <option value="activity">Activity</option>
            <option value="exam">Exam</option>
            <option value="other">Other</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ScheduleStatus | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Schedules List */}
      <div className="space-y-6">
        {filteredSchedules.map((schedule) => (
          <div key={schedule.id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${getTypeColor(schedule.type).split(' ')[0]} ${getTypeColor(schedule.type).split(' ')[1]}`}>
                      {getTypeIcon(schedule.type)}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">{schedule.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(schedule.type)}`}>
                      {schedule.type.charAt(0).toUpperCase() + schedule.type.slice(1).replace('-', ' ')}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(schedule.status)}`}>
                      {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{schedule.period}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(schedule.startDate)} - {formatDate(schedule.endDate)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{schedule.applicableTo}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedSchedule(schedule)}
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
                      {schedule.type === 'timetable' || schedule.type === 'exam' ? 'Time' : schedule.type === 'meal-plan' ? 'Meal Time' : 'Time/Activity'}
                    </th>
                    {schedule.table.columnLabels.map((col, index) => (
                      <th
                        key={index}
                        className="px-4 py-3 text-center text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 min-w-[150px]"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {schedule.table.rowLabels.map((rowLabel, rowIndex) => (
                    <tr key={rowIndex}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 bg-gray-50 border border-gray-200 whitespace-nowrap">
                        {rowLabel}
                      </td>
                      {schedule.table.columnLabels.map((_, colIndex) => {
                        const cellKey = `${rowIndex}-${colIndex}`;
                        const cellValue = schedule.table.cells[cellKey] || '';
                        return (
                          <td
                            key={colIndex}
                            className="px-4 py-3 text-sm text-gray-700 border border-gray-200 text-center min-h-[60px] align-top"
                          >
                            {cellValue.split('\n').map((line, i) => (
                              <div key={i} className={i === 0 ? 'font-medium' : i > 0 ? 'mt-1 text-xs text-gray-600' : ''}>
                                {line}
                              </div>
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
            {schedule.notes && (
              <div className="px-6 pb-6">
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{schedule.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredSchedules.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No schedules found</p>
          <p className="text-gray-400 text-sm mt-2">Create a new schedule to get started</p>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-900">Create New Schedule</h2>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Title</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as ScheduleType)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="timetable">Timetable</option>
                    <option value="meal-plan">Meal Plan</option>
                    <option value="activity">Activity</option>
                    <option value="exam">Exam</option>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Period Description</label>
                  <input
                    type="text"
                    value={formPeriod}
                    onChange={(e) => setFormPeriod(e.target.value)}
                    placeholder="e.g., Term 1, 2024"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Applicable To</label>
                  <input
                    type="text"
                    value={formApplicableTo}
                    onChange={(e) => setFormApplicableTo(e.target.value)}
                    placeholder="e.g., Grade 8, All Students"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Row Labels */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Row Labels (e.g., Time Slots: 8:00 - 8:45, 8:45 - 9:30)
                  </label>
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
                        placeholder={`Row ${index + 1} (e.g., 8:00 - 8:45)`}
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
                  <label className="block text-sm font-medium text-gray-700">
                    Column Labels (e.g., Days: Monday, Tuesday, Wednesday)
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Populate Table (Enter {formType === 'timetable' || formType === 'exam' ? 'subject/activity' : formType === 'meal-plan' ? 'meal details' : 'activity'} in cells)
                  </label>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200">
                            {formType === 'timetable' || formType === 'exam' ? 'Time' : formType === 'meal-plan' ? 'Meal Time' : 'Time/Activity'}
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
                                  <textarea
                                    value={cellValue}
                                    onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                                    placeholder={formType === 'timetable' ? 'Subject\nTeacher\nRoom' : formType === 'meal-plan' ? 'Meal\nDescription' : 'Activity'}
                                    rows={3}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Tip: Use line breaks (Enter) to add multiple lines in a cell (e.g., Subject on first line, Teacher on second line, Room on third line)
                  </p>
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
                  Create Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
