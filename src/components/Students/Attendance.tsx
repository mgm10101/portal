import React, { useState } from 'react';
import { Calendar, Plus, Search, Filter, Users, UserX } from 'lucide-react';

export const Attendance: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAbsentForm, setShowAbsentForm] = useState(false);

  const students = [
    { id: 1, name: 'John Smith', class: 'Grade 10', status: 'Present' },
    { id: 2, name: 'Emily Johnson', class: 'Grade 8', status: 'Present' },
    { id: 3, name: 'Michael Davis', class: 'Grade 12', status: 'Absent' },
    { id: 4, name: 'Sarah Wilson', class: 'Grade 9', status: 'Present' },
    { id: 5, name: 'David Brown', class: 'Grade 11', status: 'Absent' }
  ];

  const attendanceStats = {
    totalStudents: students.length,
    present: students.filter(s => s.status === 'Present').length,
    absent: students.filter(s => s.status === 'Absent').length,
    attendanceRate: Math.round((students.filter(s => s.status === 'Present').length / students.length) * 100)
  };

  const AbsentForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Mark Student Absent</h2>
          <button
            onClick={() => setShowAbsentForm(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              defaultValue={selectedDate}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
            <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>Select Student</option>
              {students.filter(s => s.status === 'Present').map(student => (
                <option key={student.id} value={student.id}>
                  {student.name} - {student.class}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
            <div className="flex">
              <select className="flex-1 p-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Sick</option>
                <option>Family Emergency</option>
                <option>Medical Appointment</option>
                <option>Other</option>
                <option>Unexcused</option>
              </select>
              <button
                type="button"
                className="px-3 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes about the absence..."
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowAbsentForm(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Mark Absent
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Student Attendance</h1>
            <p className="text-gray-600">Track daily student attendance - all active students are presumed present unless marked absent</p>
          </div>
          <button
            onClick={() => setShowAbsentForm(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center"
          >
            <UserX className="w-5 h-5 mr-2" />
            Mark Absent
          </button>
        </div>

        {/* Date Selection and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
          <div className="lg:col-span-1">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Total Students</div>
                <div className="text-2xl font-bold text-gray-800">{attendanceStats.totalStudents}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Present</div>
                <div className="text-2xl font-bold text-green-600">{attendanceStats.present}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <UserX className="w-8 h-8 text-red-500 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Absent</div>
                <div className="text-2xl font-bold text-red-600">{attendanceStats.absent}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-purple-500 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Attendance Rate</div>
                <div className="text-2xl font-bold text-purple-600">{attendanceStats.attendanceRate}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-2">
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter className="w-4 h-4 mr-2" />
                Filter by Class
              </button>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          student.status === 'Present' ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.class}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        student.status === 'Present' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {selectedDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {student.status === 'Present' ? (
                          <button 
                            onClick={() => setShowAbsentForm(true)}
                            className="text-red-600 hover:text-red-700"
                            title="Mark Absent"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            className="text-green-600 hover:text-green-700"
                            title="Mark Present"
                          >
                            <Users className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showAbsentForm && <AbsentForm />}
      </div>
    </div>
  );
};