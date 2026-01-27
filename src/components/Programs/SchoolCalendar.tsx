import React, { useState } from 'react';
import { Plus, Search, Filter, Calendar, CalendarDays, MapPin, Users, Clock, Edit, Trash2, X } from 'lucide-react';

type ActivityType = 'holiday' | 'trip' | 'agm' | 'event' | 'meeting' | 'exam' | 'other';
type ActivityStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled';

interface CalendarActivity {
  id: number;
  title: string;
  type: ActivityType;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  participants: string[];
  organizer: string;
  status: ActivityStatus;
  isAllDay: boolean;
  color: string;
}

export const SchoolCalendar: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');
  const [selectedActivity, setSelectedActivity] = useState<CalendarActivity | null>(null);
  const [activityType, setActivityType] = useState<ActivityType>('event');
  const [isAllDay, setIsAllDay] = useState(true);

  // Sample activities
  const activities: CalendarActivity[] = [
    {
      id: 1,
      title: 'Annual General Meeting',
      type: 'agm',
      description: 'School AGM with parents and board members',
      startDate: '2024-03-15',
      endDate: '2024-03-15',
      startTime: '14:00',
      endTime: '17:00',
      location: 'Main Hall',
      participants: ['All Parents', 'Board Members', 'Staff'],
      organizer: 'Principal',
      status: 'scheduled',
      isAllDay: false,
      color: 'bg-blue-500'
    },
    {
      id: 2,
      title: 'Mid-Term Break',
      type: 'holiday',
      description: 'School closed for mid-term break',
      startDate: '2024-04-01',
      endDate: '2024-04-07',
      startTime: null,
      endTime: null,
      location: null,
      participants: ['All Students', 'All Staff'],
      organizer: 'Administration',
      status: 'scheduled',
      isAllDay: true,
      color: 'bg-red-500'
    },
    {
      id: 3,
      title: 'Science Museum Trip',
      type: 'trip',
      description: 'Educational trip to National Science Museum for Grade 8 students',
      startDate: '2024-03-20',
      endDate: '2024-03-20',
      startTime: '08:00',
      endTime: '15:00',
      location: 'National Science Museum',
      participants: ['Grade 8 Students', 'Science Teachers'],
      organizer: 'Dr. Smith',
      status: 'scheduled',
      isAllDay: false,
      color: 'bg-green-500'
    },
    {
      id: 4,
      title: 'Sports Day',
      type: 'event',
      description: 'Annual inter-house sports competition',
      startDate: '2024-05-10',
      endDate: '2024-05-10',
      startTime: '09:00',
      endTime: '16:00',
      location: 'School Grounds',
      participants: ['All Students', 'All Staff', 'Parents'],
      organizer: 'Sports Department',
      status: 'scheduled',
      isAllDay: false,
      color: 'bg-purple-500'
    },
    {
      id: 5,
      title: 'End of Term Exams',
      type: 'exam',
      description: 'Term 1 final examinations',
      startDate: '2024-04-15',
      endDate: '2024-04-19',
      startTime: '08:00',
      endTime: '13:00',
      location: 'All Classrooms',
      participants: ['All Students'],
      organizer: 'Academic Department',
      status: 'scheduled',
      isAllDay: false,
      color: 'bg-orange-500'
    },
    {
      id: 6,
      title: 'Parent-Teacher Conference',
      type: 'meeting',
      description: 'Individual parent-teacher meetings',
      startDate: '2024-03-25',
      endDate: '2024-03-27',
      startTime: '14:00',
      endTime: '17:00',
      location: 'Classrooms',
      participants: ['Parents', 'Teachers'],
      organizer: 'Academic Department',
      status: 'scheduled',
      isAllDay: false,
      color: 'bg-indigo-500'
    }
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear().toString().slice(-2);
    
    const getOrdinal = (n: number) => {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    
    return `${getOrdinal(day)} ${month} '${year}`;
  };

  const getActivityTypeLabel = (type: ActivityType) => {
    const labels: Record<ActivityType, string> = {
      'holiday': 'Holiday',
      'trip': 'Trip',
      'agm': 'AGM',
      'event': 'Event',
      'meeting': 'Meeting',
      'exam': 'Exam',
      'other': 'Other'
    };
    return labels[type];
  };

  const getActivityTypeColor = (type: ActivityType) => {
    const colors: Record<ActivityType, string> = {
      'holiday': 'bg-red-100 text-red-800 border-red-200',
      'trip': 'bg-green-100 text-green-800 border-green-200',
      'agm': 'bg-blue-100 text-blue-800 border-blue-200',
      'event': 'bg-purple-100 text-purple-800 border-purple-200',
      'meeting': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'exam': 'bg-orange-100 text-orange-800 border-orange-200',
      'other': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[type];
  };

  const getStatusColor = (status: ActivityStatus) => {
    const colors: Record<ActivityStatus, string> = {
      'scheduled': 'bg-blue-100 text-blue-800',
      'ongoing': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status];
  };

  // Get activities for a specific date
  const getActivitiesForDate = (date: string) => {
    return activities.filter(activity => {
      const activityStart = new Date(activity.startDate);
      const activityEnd = new Date(activity.endDate);
      const checkDate = new Date(date);
      return checkDate >= activityStart && checkDate <= activityEnd;
    });
  };

  // Generate calendar days for current month view
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const upcomingActivities = activities
    .filter(a => new Date(a.startDate) >= new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 5);

  const ActivityForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Schedule Activity</h2>
          <button
            onClick={() => setShowForm(false)}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <form className="space-y-6">
          {/* Activity Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Activity Type</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['holiday', 'trip', 'agm', 'event', 'meeting', 'exam', 'other'] as ActivityType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActivityType(type)}
                  className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                    activityType === type
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {getActivityTypeLabel(type)}
                </button>
              ))}
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter activity title"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the activity..."
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organizer</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Name or department"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Location (optional)"
              />
            </div>
          </div>

          {/* All Day Toggle */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isAllDay}
                onChange={(e) => setIsAllDay(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">All Day Event</span>
            </label>
          </div>

          {/* Time (if not all day) */}
          {!isAllDay && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Participants */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Participants</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {['All Students', 'All Staff', 'Parents', 'Grade 8 Students', 'Grade 9 Students', 'Board Members'].map((participant) => (
                <label key={participant} className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">{participant}</span>
                </label>
              ))}
            </div>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Or add custom participant..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Schedule Activity
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const MonthView = () => {
    const calendarDays = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      calendarDays.push(day);
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          <div className="flex items-center space-x-2">
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              ←
            </button>
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              →
            </button>
            <button
              onClick={() => {
                const today = new Date();
                setSelectedDate(today.toISOString().split('T')[0]);
              }}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Today
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {dayNames.map((day) => (
            <div key={day} className="p-2 text-center text-xs font-semibold text-gray-600">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="p-2 min-h-[80px]"></div>;
            }

            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayActivities = getActivitiesForDate(dateStr);
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            return (
              <div
                key={`${currentYear}-${currentMonth}-${day}-${index}`}
                className={`p-2 min-h-[80px] border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                  isToday ? 'bg-blue-50 border-blue-300' : ''
                }`}
                onClick={() => {
                  setSelectedDate(dateStr);
                  setShowForm(true);
                }}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                  {day}
                </div>
                <div className="space-y-1">
                  {dayActivities.slice(0, 2).map((activity) => (
                    <div
                      key={activity.id}
                      className={`text-xs px-1.5 py-0.5 rounded truncate ${activity.color} text-white`}
                      title={activity.title}
                    >
                      {activity.title}
                    </div>
                  ))}
                  {dayActivities.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{dayActivities.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 md:p-3 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-3 mb-6 md:mb-3">
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Total Activities</div>
                <div className="text-2xl font-bold text-gray-800">{activities.length}</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <CalendarDays className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Upcoming</div>
                <div className="text-2xl font-bold text-green-600">{upcomingActivities.length}</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <MapPin className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Trips</div>
                <div className="text-2xl font-bold text-purple-600">
                  {activities.filter(a => a.type === 'trip').length}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Events</div>
                <div className="text-2xl font-bold text-orange-600">
                  {activities.filter(a => a.type === 'event').length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* View Toggle and Actions */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 md:mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search activities..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* View Toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-l ${
                  viewMode === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-l ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                List
              </button>
            </div>

            <button className="flex-shrink-0 flex items-center justify-center p-2 md:px-4 md:py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Filters</span>
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex-shrink-0 bg-blue-600 text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
            >
              <Plus className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">Schedule Activity</span>
            </button>
          </div>
        </div>

        {/* Calendar View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Calendar */}
          <div className="lg:col-span-2">
            {viewMode === 'month' && <MonthView />}
            {viewMode === 'week' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <p className="text-center text-gray-500">Week view coming soon</p>
              </div>
            )}
            {viewMode === 'list' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {activities.map((activity) => (
                        <tr key={activity.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{activity.title}</div>
                            <div className="text-xs text-gray-500">{activity.description}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getActivityTypeColor(activity.type)} capitalize`}>
                              {getActivityTypeLabel(activity.type)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDate(activity.startDate)}</div>
                            {activity.startDate !== activity.endDate && (
                              <div className="text-xs text-gray-500">to {formatDate(activity.endDate)}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {activity.isAllDay ? (
                              <span className="text-gray-400">All Day</span>
                            ) : (
                              <>
                                {activity.startTime} - {activity.endTime}
                              </>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {activity.location || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(activity.status)} capitalize`}>
                              {activity.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Upcoming Activities */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Activities</h3>
              <div className="space-y-3">
                {upcomingActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedActivity(activity);
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900">{activity.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(activity.startDate)}</p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getActivityTypeColor(activity.type)} capitalize`}>
                        {getActivityTypeLabel(activity.type)}
                      </span>
                    </div>
                    {activity.location && (
                      <div className="flex items-center text-xs text-gray-600 mt-2">
                        <MapPin className="w-3 h-3 mr-1" />
                        {activity.location}
                      </div>
                    )}
                    {!activity.isAllDay && activity.startTime && (
                      <div className="flex items-center text-xs text-gray-600 mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {activity.startTime} - {activity.endTime}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Type Legend */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Types</h3>
              <div className="space-y-2">
                {(['holiday', 'trip', 'agm', 'event', 'meeting', 'exam', 'other'] as ActivityType[]).map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded ${getActivityTypeColor(type).split(' ')[0]}`}></div>
                    <span className="text-sm text-gray-700 capitalize">{getActivityTypeLabel(type)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {showForm && <ActivityForm />}
      </div>
    </div>
  );
};

