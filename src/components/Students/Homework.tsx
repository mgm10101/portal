import React, { useState } from 'react';
import { Upload, FileText, Download, CheckCircle, XCircle, Calendar, Search, Filter, Eye, Star } from 'lucide-react';

export const Homework: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'uploaded' | 'submissions'>('uploaded');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');

  // Mock data - will be replaced with Supabase later
  const uploadedHomework = [
    {
      id: '1',
      title: 'Mathematics Assignment - Chapter 5',
      class: 'Grade 10',
      subject: 'Mathematics',
      dueDate: '2024-12-15',
      uploadedDate: '2024-12-01',
      fileName: 'math_assignment_ch5.pdf',
      status: 'active'
    },
    {
      id: '2',
      title: 'English Essay - Descriptive Writing',
      class: 'Grade 9',
      subject: 'English',
      dueDate: '2024-12-20',
      uploadedDate: '2024-12-02',
      fileName: 'english_essay.pdf',
      status: 'active'
    }
  ];

  const submissions = [
    {
      id: '1',
      studentName: 'John Smith',
      studentId: 'ADM001',
      homeworkTitle: 'Mathematics Assignment - Chapter 5',
      submittedDate: '2024-12-10',
      fileName: 'john_smith_math_assignment.pdf',
      grade: null,
      status: 'submitted'
    },
    {
      id: '2',
      studentName: 'Jane Doe',
      studentId: 'ADM002',
      homeworkTitle: 'Mathematics Assignment - Chapter 5',
      submittedDate: '2024-12-11',
      fileName: 'jane_doe_math_assignment.pdf',
      grade: 85,
      status: 'graded'
    }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      // TODO: Upload to Supabase storage
      console.log('Uploading file:', file.name);
    } else {
      alert('Please upload a PDF file');
    }
  };

  const handleGradeChange = (submissionId: string, grade: number) => {
    // TODO: Update grade in Supabase
    console.log('Grading submission:', submissionId, grade);
  };

  return (
    <div className="p-6 md:p-3 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Homework Management</h1>
          <p className="text-gray-600">Upload homework assignments and grade student submissions</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('uploaded')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'uploaded'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Uploaded Homework
                </div>
              </button>
              <button
                onClick={() => setActiveTab('submissions')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'submissions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Student Submissions
                </div>
              </button>
            </nav>
          </div>

          {/* Uploaded Homework Tab */}
          {activeTab === 'uploaded' && (
            <div className="p-6">
              {/* Upload Section */}
              <div className="mb-6 p-6 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload New Homework</h3>
                <div className="flex items-center space-x-4">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="homework-upload"
                    />
                    <div className="flex items-center justify-center px-6 py-3 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                      <Upload className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="text-blue-600 font-medium">Choose PDF File</span>
                    </div>
                  </label>
                </div>
                <p className="text-sm text-gray-600 mt-2">Only PDF files are accepted</p>
              </div>

              {/* Search and Filter */}
              <div className="mb-4 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search homework..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="all">All Classes</option>
                    <option value="grade-9">Grade 9</option>
                    <option value="grade-10">Grade 10</option>
                    <option value="grade-11">Grade 11</option>
                    <option value="grade-12">Grade 12</option>
                  </select>
                </div>
              </div>

              {/* Homework List */}
              <div className="space-y-4">
                {uploadedHomework.map((homework) => (
                  <div
                    key={homework.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <FileText className="w-5 h-5 text-blue-600 mr-2" />
                          <h3 className="text-lg font-semibold text-gray-900">{homework.title}</h3>
                        </div>
                        <div className="ml-7 space-y-1">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Class:</span> {homework.class} •{' '}
                            <span className="font-medium">Subject:</span> {homework.subject}
                          </p>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span className="font-medium">Due Date:</span>{' '}
                            <span className="ml-1">{new Date(homework.dueDate).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-gray-500">
                            Uploaded: {new Date(homework.uploadedDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Download className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submissions Tab */}
          {activeTab === 'submissions' && (
            <div className="p-6">
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by student name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Submissions List */}
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <FileText className="w-5 h-5 text-green-600 mr-2" />
                          <h3 className="text-lg font-semibold text-gray-900">{submission.studentName}</h3>
                          <span className="ml-2 text-sm text-gray-500">({submission.studentId})</span>
                        </div>
                        <div className="ml-7 space-y-1">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Homework:</span> {submission.homeworkTitle}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Submitted:</span>{' '}
                            {new Date(submission.submittedDate).toLocaleDateString()}
                          </p>
                          {submission.grade !== null && (
                            <p className="text-sm font-semibold text-blue-600">
                              Grade: {submission.grade}/100
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {submission.grade === null ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="Grade"
                              className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              onBlur={(e) => {
                                const grade = parseInt(e.target.value);
                                if (!isNaN(grade) && grade >= 0 && grade <= 100) {
                                  handleGradeChange(submission.id, grade);
                                }
                              }}
                            />
                            <span className="text-sm text-gray-600">/100</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-blue-600">
                            <Star className="w-5 h-5 mr-1 fill-current" />
                            <span className="font-semibold">{submission.grade}/100</span>
                          </div>
                        )}
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Download className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

