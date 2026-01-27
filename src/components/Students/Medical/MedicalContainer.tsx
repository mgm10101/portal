import React, { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { MedicalInfoTable } from './MedicalInfoTable';
import { MedicalInfoForm } from './MedicalInfoForm';
import { MedicalLogForm } from './MedicalLogForm';

export const MedicalContainer: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showMedicalInfo, setShowMedicalInfo] = useState(false);
  const [showMedicalLog, setShowMedicalLog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'logs'>('info');

  // Placeholder data
  const [medicalRecords] = useState([
    {
      id: 1,
      studentName: 'John Doe',
      admissionNumber: '2023001',
      allergies: 'Peanuts, Dust',
      medicalConditions: 'Asthma',
      bloodType: 'O+',
      emergencyMedication: 'Inhaler',
      lastUpdated: '2024-01-15'
    },
    {
      id: 2,
      studentName: 'Jane Smith',
      admissionNumber: '2023002',
      allergies: 'None',
      medicalConditions: 'Type 1 Diabetes',
      bloodType: 'A+',
      emergencyMedication: 'Insulin',
      lastUpdated: '2024-01-10'
    },
    {
      id: 3,
      studentName: 'Michael Johnson',
      admissionNumber: '2023003',
      allergies: 'Penicillin',
      medicalConditions: 'ADHD',
      bloodType: 'B+',
      emergencyMedication: 'None',
      lastUpdated: '2024-01-12'
    },
    {
      id: 4,
      studentName: 'Sarah Williams',
      admissionNumber: '2023004',
      allergies: 'Shellfish',
      medicalConditions: 'Autism Spectrum Disorder',
      bloodType: 'AB+',
      emergencyMedication: 'None',
      lastUpdated: '2024-01-08'
    },
    {
      id: 5,
      studentName: 'David Brown',
      admissionNumber: '2023005',
      allergies: 'None',
      medicalConditions: 'Sickle Cell Anemia',
      bloodType: 'O-',
      emergencyMedication: 'Pain medication',
      lastUpdated: '2024-01-20'
    }
  ]);

  const [medicalLogs] = useState([
    {
      id: 1,
      studentName: 'John Doe',
      admissionNumber: '2023001',
      date: '2024-01-22',
      time: '10:30 AM',
      type: 'First Aid',
      complaint: 'Headache',
      treatment: 'Paracetamol 500mg',
      attendedBy: 'Nurse Mary'
    },
    {
      id: 2,
      studentName: 'Jane Smith',
      admissionNumber: '2023002',
      date: '2024-01-21',
      time: '2:15 PM',
      type: 'Dispensary',
      complaint: 'Blood sugar check',
      treatment: 'Insulin administered',
      attendedBy: 'Nurse Mary'
    },
    {
      id: 3,
      studentName: 'David Brown',
      admissionNumber: '2023005',
      date: '2024-01-20',
      time: '11:45 AM',
      type: 'Emergency',
      complaint: 'Sickle cell crisis',
      treatment: 'Pain management, hydration',
      attendedBy: 'Dr. Johnson'
    }
  ]);

  const filteredRecords = medicalRecords.filter(record =>
    record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLogs = medicalLogs.filter(log =>
    log.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (record: any) => {
    setSelectedStudent(record);
    setShowMedicalInfo(true);
  };

  const handleAddLog = () => {
    setSelectedStudent(null);
    setShowMedicalLog(true);
  };

  return (
    <div className="p-6 md:p-3 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'info'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Medical Information
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'logs'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Medical Logs
            </button>
          </div>
        </div>

        {/* Search and Action Bar */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by student name or admission number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {activeTab === 'info' ? (
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setShowMedicalInfo(true);
                }}
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Medical Info
              </button>
            ) : (
              <button
                onClick={handleAddLog}
                className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Medical Log
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'info' ? (
          <MedicalInfoTable
            records={filteredRecords}
            onEdit={handleEdit}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Complaint
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Treatment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attended By
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{log.date}</div>
                        <div className="text-sm text-gray-500">{log.time}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{log.studentName}</div>
                        <div className="text-sm text-gray-500">{log.admissionNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          log.type === 'Emergency'
                            ? 'bg-red-100 text-red-800'
                            : log.type === 'Dispensary'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{log.complaint}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{log.treatment}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{log.attendedBy}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Forms */}
        {showMedicalInfo && (
          <MedicalInfoForm
            selectedRecord={selectedStudent}
            onClose={() => {
              setShowMedicalInfo(false);
              setSelectedStudent(null);
            }}
            onSubmit={(values) => {
              console.log('Medical info submitted:', values);
              setShowMedicalInfo(false);
              setSelectedStudent(null);
            }}
          />
        )}

        {showMedicalLog && (
          <MedicalLogForm
            onClose={() => {
              setShowMedicalLog(false);
              setSelectedStudent(null);
            }}
            onSubmit={(values) => {
              console.log('Medical log submitted:', values);
              setShowMedicalLog(false);
              setSelectedStudent(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

