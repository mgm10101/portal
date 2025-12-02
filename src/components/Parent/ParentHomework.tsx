import React, { useState } from 'react';
import { FileText, Download, Upload, Calendar, CheckCircle, Clock, Star, Search } from 'lucide-react';

export const ParentHomework: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');

  // Mock data - will be replaced with Supabase later
  const homeworkList = [
    {
      id: '1',
      title: 'Mathematics Assignment - Chapter 5',
      subject: 'Mathematics',
      class: 'Grade 10',
      dueDate: '2024-12-15',
      postedDate: '2024-12-01',
      fileName: 'math_assignment_ch5.pdf',
      status: 'pending',
      submittedFile: null,
      grade: null
    },
    {
      id: '2',
      title: 'English Essay - Descriptive Writing',
      subject: 'English',
      class: 'Grade 10',
      dueDate: '2024-12-20',
      postedDate: '2024-12-02',
      fileName: 'english_essay.pdf',
      status: 'submitted',
      submittedFile: 'john_smith_essay.pdf',
      submittedDate: '2024-12-10',
      grade: null
    },
    {
      id: '3',
      title: 'Science Project - Photosynthesis',
      subject: 'Science',
      class: 'Grade 10',
      dueDate: '2024-12-18',
      postedDate: '2024-12-05',
      fileName: 'science_project.pdf',
      status: 'graded',
      submittedFile: 'john_smith_science.pdf',
      submittedDate: '2024-12-12',
      grade: 92
    }
  ];

  const filteredHomework = homeworkList.filter((hw) => {
    const matchesSearch = hw.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hw.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || hw.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleFileUpload = (homeworkId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Upload to Supabase storage
      console.log('Uploading submission for homework:', homeworkId, file.name);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-orange-500" />;
      case 'submitted':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'graded':
        return <Star className="w-5 h-5 text-green-500 fill-current" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Submission';
      case 'submitted':
        return 'Submitted';
      case 'graded':
        return 'Graded';
      default:
        return status;
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && selectedStatus !== 'graded';
  };

  return (
    <div className="p-6 md:p-3 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Homework</h1>
          <p className="text-gray-600">View assignments, download homework, and upload completed work</p>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search homework by title or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedStatus('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedStatus === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setSelectedStatus('submitted')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedStatus === 'submitted'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Submitted
            </button>
            <button
              onClick={() => setSelectedStatus('graded')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedStatus === 'graded'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Graded
            </button>
          </div>
        </div>

        {/* Homework Cards */}
        <div className="grid grid-cols-1 gap-6">
          {filteredHomework.map((homework) => (
            <div
              key={homework.id}
              className={`p-6 bg-white rounded-lg shadow-sm border-2 transition-all ${
                isOverdue(homework.dueDate)
                  ? 'border-red-300 bg-red-50'
                  : homework.status === 'graded'
                  ? 'border-green-200'
                  : 'border-gray-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <FileText className="w-6 h-6 text-blue-600 mr-2" />
                    <h3 className="text-xl font-semibold text-gray-900">{homework.title}</h3>
                  </div>
                  <div className="ml-8 space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Subject:</span> {homework.subject} •{' '}
                      <span className="font-medium">Class:</span> {homework.class}
                    </p>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span className="font-medium">Due Date:</span>{' '}
                      <span className={`ml-1 ${isOverdue(homework.dueDate) ? 'text-red-600 font-semibold' : ''}`}>
                        {new Date(homework.dueDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                      {isOverdue(homework.dueDate) && (
                        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded">
                          OVERDUE
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      Posted: {new Date(homework.postedDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(homework.status)}
                  <span className={`text-sm font-medium ${
                    homework.status === 'pending' ? 'text-orange-600' :
                    homework.status === 'submitted' ? 'text-blue-600' :
                    'text-green-600'
                  }`}>
                    {getStatusText(homework.status)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-200">
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Download className="w-4 h-4 mr-2" />
                  Download Assignment
                </button>

                {homework.status === 'pending' && (
                  <label className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Completed Work
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(homework.id, e)}
                      className="hidden"
                    />
                  </label>
                )}

                {homework.submittedFile && (
                  <div className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">
                    <FileText className="w-4 h-4 mr-2" />
                    <span className="text-sm">Submitted: {homework.submittedFile}</span>
                    {homework.submittedDate && (
                      <span className="ml-2 text-xs text-gray-500">
                        ({new Date(homework.submittedDate).toLocaleDateString()})
                      </span>
                    )}
                  </div>
                )}

                {homework.grade !== null && (
                  <div className="flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200">
                    <Star className="w-4 h-4 mr-2 fill-current" />
                    <span className="font-semibold">Grade: {homework.grade}/100</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredHomework.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No homework found matching your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

