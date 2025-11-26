import React, { useState } from 'react';
import { Star, StarOff, Plus, Search, Filter, TrendingUp, Award } from 'lucide-react';

export const Behaviour: React.FC = () => {
  const [selectedWeek, setSelectedWeek] = useState('2024-W06');
  const [showIncidentForm, setShowIncidentForm] = useState(false);

  const students = [
    {
      id: 1,
      name: 'John Smith',
      grade: 'Grade 10',
      currentStars: 4,
      maxStars: 5,
      weeklyAverage: 4.2,
      incidents: [
        { date: '2024-02-05', offense: 'Late to class', starsLost: 1 }
      ]
    },
    {
      id: 2,
      name: 'Emily Johnson',
      grade: 'Grade 8',
      currentStars: 5,
      maxStars: 5,
      weeklyAverage: 4.8,
      incidents: []
    },
    {
      id: 3,
      name: 'Michael Davis',
      grade: 'Grade 12',
      currentStars: 2,
      maxStars: 5,
      weeklyAverage: 3.1,
      incidents: [
        { date: '2024-02-03', offense: 'Disrupting class', starsLost: 2 },
        { date: '2024-02-05', offense: 'Incomplete homework', starsLost: 1 }
      ]
    }
  ];

  const StarDisplay = ({ current, max }: { current: number, max: number }) => (
    <div className="flex">
      {Array.from({ length: max }).map((_, index) => (
        <div key={index}>
          {index < current ? (
            <Star className="w-5 h-5 text-yellow-500 fill-current" />
          ) : (
            <StarOff className="w-5 h-5 text-gray-300" />
          )}
        </div>
      ))}
    </div>
  );

  const IncidentForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Record Incident</h2>
          <button
            onClick={() => setShowIncidentForm(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
            <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>Select Student</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name} - {student.grade}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              defaultValue={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Offense</label>
            <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>Select Offense</option>
              <option>Late to class (1 star)</option>
              <option>Incomplete homework (1 star)</option>
              <option>Disrupting class (2 stars)</option>
              <option>Fighting (3 stars)</option>
              <option>Disrespect to teacher (3 stars)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stars to Deduct</label>
            <input
              type="number"
              min="1"
              max="5"
              defaultValue="1"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional details about the incident..."
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowIncidentForm(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Record Incident
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-3 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Week Selection and Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-3 mb-6 md:mb-3">
          <div className="lg:col-span-1">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Week</label>
              <input
                type="week"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Award className="w-8 h-8 text-yellow-500 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Best Behaved</div>
                <div className="text-lg font-bold text-gray-800">Emily Johnson</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Most Improved</div>
                <div className="text-lg font-bold text-gray-800">John Smith</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Star className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Average Stars</div>
                <div className="text-lg font-bold text-gray-800">4.0 / 5</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search, Filters, and Record Incident */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="flex-shrink-0 flex items-center justify-center p-2 md:px-4 md:py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Filter by Grade</span>
            </button>
            <button
              onClick={() => setShowIncidentForm(true)}
              className="flex-shrink-0 bg-red-600 text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-red-700 flex items-center justify-center"
            >
              <Plus className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">Record Incident</span>
            </button>
          </div>
        </div>

        {/* Students Behavioral Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Stars
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weekly Average
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recent Incidents
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
                      <div>
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.grade}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <StarDisplay current={student.currentStars} max={student.maxStars} />
                        <span className="text-sm text-gray-600">
                          ({student.currentStars}/{student.maxStars})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{student.weeklyAverage}</div>
                        <div className="ml-2 flex">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star 
                              key={index}
                              className={`w-3 h-3 ${
                                index < Math.round(student.weeklyAverage) 
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-gray-300'
                              }`} 
                            />
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        {student.incidents.length > 0 ? (
                          <div className="space-y-1">
                            {student.incidents.slice(0, 2).map((incident, index) => (
                              <div key={index} className="text-xs text-gray-600">
                                {incident.date}: {incident.offense} (-{incident.starsLost}★)
                              </div>
                            ))}
                            {student.incidents.length > 2 && (
                              <div className="text-xs text-blue-600 cursor-pointer">
                                +{student.incidents.length - 2} more
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-green-600">No incidents this week</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => setShowIncidentForm(true)}
                          className="text-red-600 hover:text-red-700"
                          title="Record Incident"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button className="text-blue-600 hover:text-blue-700" title="View History">
                          <TrendingUp className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showIncidentForm && <IncidentForm />}
      </div>
    </div>
  );
};