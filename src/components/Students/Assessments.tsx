import React, { useState, ChangeEvent } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Eye } from 'lucide-react';

export const Assessments: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);

  // map numeric ratings to CBE descriptions
  const ratingMap: Record<number, { text: string }> = {
    4: { text: 'Exceeding Expectations' },
    3: { text: 'Meeting Expectations' },
    2: { text: 'Approaching Expectations' },
    1: { text: 'Below Expectations' }
  };

  // sample data now uses individual subject fields
  const assessments = [
    {
      id: 1,
      student: 'John Smith',
      class: 'Grade 10',
      date: '2024-02-15',
      Math: 4,
      English: 3,
      EnvironmentalActivities: 2,
      assessmentType: 'Mid-Term Exam'
    },
    {
      id: 2,
      student: 'Emily Johnson',
      class: 'Grade 8',
      date: '2024-02-10',
      Math: 3,
      English: 2,
      EnvironmentalActivities: 1,
      assessmentType: 'Assignment'
    }
  ];

  const AssessmentForm: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'record' | 'report' | 'subjects'>('record');

    // common states
    const [admissionNo, setAdmissionNo] = useState('');
    const [studentInfo, setStudentInfo] = useState({ name: '', class: '', stream: '' });

    // Record Assessments tab states
    const classSubjectsMap: Record<string, string[]> = {
      'Grade 8': ['Math', 'English', 'Environmental Activities'],
      'Grade 9': ['Math', 'English', 'Environmental Activities'],
      'Grade 10': ['Math', 'English', 'Environmental Activities'],
      'Grade 11': ['Math', 'English', 'Environmental Activities'],
      'Grade 12': ['Math', 'English', 'Environmental Activities']
    };
    const [subjectsPerClass, setSubjectsPerClass] = useState(classSubjectsMap);
    const [selectedClass, setSelectedClass] = useState<string>('Grade 8');
    const [subjectResults, setSubjectResults] = useState<Record<string, number>>({});
    const [aggregateType, setAggregateType] = useState<'sum' | 'average'>('average');

    // Report Format tab states
    const [inputType, setInputType] = useState<'number' | 'percentage' | 'dropdown'>('number');
    const [outOf, setOutOf] = useState<number | undefined>(undefined);

    // new range state
    const [rangeMin, setRangeMin] = useState<number>(0);
    const [rangeMax, setRangeMax] = useState<number>(0);

    // dynamic criteria list
    const [criteriaList, setCriteriaList] = useState<
      { operator: '>' | '>=' | '<' | '<=' | '='; threshold: number; comment: string }[]
    >([]);

    const handleAdmissionChange = (e: ChangeEvent<HTMLInputElement>) => {
      setAdmissionNo(e.target.value);
      // TODO: fetch studentInfo by admissionNo
      // setStudentInfo({ name: 'Fetched Name', class: 'Grade 8', stream: 'A' });
    };

    const computeResult2 = (value: number) => {
      for (const crit of criteriaList) {
        switch (crit.operator) {
          case '>=': if (value >= crit.threshold) return crit.comment; break;
          case '<=': if (value <= crit.threshold) return crit.comment; break;
          case '>':  if (value >  crit.threshold) return crit.comment; break;
          case '<':  if (value <  crit.threshold) return crit.comment; break;
          case '=':  if (value === crit.threshold) return crit.comment; break;
        }
      }
      return '';
    };

    // aggregate calculations
    const subjectKeys = subjectsPerClass[studentInfo.class || selectedClass] || [];
    const subjectValues = subjectKeys
      .map((k) => subjectResults[k])
      .filter((v): v is number => typeof v === 'number');
    const sum = subjectValues.reduce((acc, v) => acc + v, 0);
    const aggResult1 = aggregateType === 'sum'
      ? sum
      : subjectValues.length
        ? Math.round(sum / subjectValues.length)
        : 0;
    const aggResult2 = computeResult2(aggResult1);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 sm:items-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {selectedAssessment ? 'Edit Assessment' : 'Record Assessment'}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                setSelectedAssessment(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-4">
              <button
                className={`px-3 py-2 text-sm font-medium ${
                  activeTab === 'record'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('record')}
              >
                Record Assessments
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium ${
                  activeTab === 'report'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('report')}
              >
                Report Format
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium ${
                  activeTab === 'subjects'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('subjects')}
              >
                Subjects per Class
              </button>
            </nav>
          </div>

          {/* Record Assessments Tab */}
          {activeTab === 'record' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admission Number
                </label>
                <input
                  type="text"
                  value={admissionNo}
                  onChange={handleAdmissionChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={studentInfo.name}
                    disabled
                    className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class
                  </label>
                  <input
                    type="text"
                    value={studentInfo.class}
                    disabled
                    className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stream
                  </label>
                  <input
                    type="text"
                    value={studentInfo.stream}
                    disabled
                    className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Subjects
                </h3>
                <div className="space-y-2">
                  {subjectsPerClass[studentInfo.class || selectedClass]?.map((subj) => (
                    <div key={subj} className="flex items-center space-x-3">
                      <label className="w-1/4 text-sm text-gray-700">{subj}</label>
                      <input
                        type="number"
                        placeholder="enter results"
                        value={subjectResults[subj] ?? ''} 
                        onChange={(e) =>
                          setSubjectResults({ ...subjectResults, [subj]: Number(e.target.value) })
                        }
                        className="flex-1 p-2 border border-gray-300 rounded-lg"
                      />
                      <input
                        type="text"
                        readOnly
                        value={
                          subjectResults[subj] != null
                            ? computeResult2(subjectResults[subj])
                            : ''
                        }
                        className="flex-1 p-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-red-600">Aggregate</h3>
                <div className="flex items-center space-x-3 mt-2">
                  <label className="w-1/3 text-sm text-gray-700">Type</label>
                  <select
                    value={aggregateType}
                    onChange={(e) => setAggregateType(e.target.value as 'sum' | 'average')}
                    className="flex-1 p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="sum">Sum</option>
                    <option value="average">Average</option>
                  </select>
                </div>
                <div className="flex items-center space-x-3 mt-2">
                  <label className="w-1/3 text-sm text-gray-700">Result 1</label>
                  <input
                    type="text"
                    readOnly
                    value={aggResult1}
                    className="flex-1 p-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div className="flex items-center space-x-3 mt-2">
                  <label className="w-1/3 text-sm text-gray-700">Result 2</label>
                  <input
                    type="text"
                    readOnly
                    value={aggResult2}
                    className="flex-1 p-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Report Format Tab */}
          {activeTab === 'report' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Result 1 Range
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={rangeMin}
                    onChange={(e) => setRangeMin(Number(e.target.value))}
                    placeholder="min"
                    className="w-1/2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    value={rangeMax}
                    onChange={(e) => setRangeMax(Number(e.target.value))}
                    placeholder="max"
                    className="w-1/2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Out Of (optional)
                </label>
                <input
                  type="number"
                  value={outOf ?? ''}
                  onChange={(e) =>
                    setOutOf(e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Criteria for Result 2
                </h3>
                <div className="space-y-2">
                  {criteriaList.map((crit, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <select
                        value={crit.operator}
                        onChange={(e) => {
                          const updated = [...criteriaList];
                          updated[idx].operator = e.target.value as any;
                          setCriteriaList(updated);
                        }}
                        className="p-2 border border-gray-300 rounded-lg"
                      >
                        <option value=">=">≥</option>
                        <option value="<=">≤</option>
                        <option value=">">&gt;</option>
                        <option value="<">&lt;</option>
                        <option value="=">=</option>
                      </select>
                      <input
                        type="number"
                        value={crit.threshold}
                        onChange={(e) => {
                          const updated = [...criteriaList];
                          updated[idx].threshold = Number(e.target.value);
                          setCriteriaList(updated);
                        }}
                        placeholder="Value"
                        className="p-2 border border-gray-300 rounded-lg"
                      />
                      <input
                        type="text"
                        value={crit.comment}
                        onChange={(e) => {
                          const updated = [...criteriaList];
                          updated[idx].comment = e.target.value;
                          setCriteriaList(updated);
                        }}
                        placeholder="Comment"
                        className="flex-1 p-2 border border-gray-300 rounded-lg"
                      />
                      <button
                        onClick={() => {
                          setCriteriaList(criteriaList.filter((_, i) => i !== idx));
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      setCriteriaList([
                        ...criteriaList,
                        { operator: '>=', threshold: 0, comment: '' }
                      ])
                    }
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Criterion
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Subjects per Class Tab (unchanged) */}
          {activeTab === 'subjects' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Class
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.keys(subjectsPerClass).map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Subjects for {selectedClass}
                </h3>
                {subjectsPerClass[selectedClass].map((subj, idx) => (
                  <div key={idx} className="flex items-center space-x-3 mb-2">
                    <input
                      type="text"
                      value={subj}
                      onChange={(e) => {
                        const updated = [...subjectsPerClass[selectedClass]];
                        updated[idx] = e.target.value;
                        setSubjectsPerClass({
                          ...subjectsPerClass,
                          [selectedClass]: updated
                        });
                      }}
                      className="flex-1 p-2 border border-gray-300 rounded-lg"
                    />
                    <button
                      onClick={() => {
                        const updated = subjectsPerClass[selectedClass].filter(
                          (_, i) => i !== idx
                        );
                        setSubjectsPerClass({
                          ...subjectsPerClass,
                          [selectedClass]: updated
                        });
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    setSubjectsPerClass({
                      ...subjectsPerClass,
                      [selectedClass]: [
                        ...subjectsPerClass[selectedClass],
                        ''
                      ]
                    });
                  }}
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Subject
                </button>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setSelectedAssessment(null);
              }}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {selectedAssessment ? 'Update' : 'Save'} Assessment
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 md:p-3 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Search, Filters, and Record Assessment */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 md:mb-3">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search assessments..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
              <span className="hidden md:inline">Record Assessment</span>
            </button>
          </div>
        </div>

        {/* Assessments Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assessment Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Math
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    English
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Environmental Activities
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aggregate Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assessments.map((assessment) => {
                  const subjects = ['Math','English','EnvironmentalActivities'] as const;
                  const total = subjects.reduce((sum,key)=> sum+assessment[key],0);
                  const avg = Math.round(total/subjects.length);
                  const desc = ratingMap[avg]?.text||'';

                  return (
                    <tr key={assessment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {assessment.student}
                          </div>
                          <div className="text-sm text-gray-500">
                            {assessment.class}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {assessment.assessmentType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {assessment.date}
                      </td>
                      {subjects.map((key) => (
                        <td key={key} className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium">
                              {assessment[key]}
                            </div>
                            <div className="text-sm text-gray-500">
                              {ratingMap[assessment[key]]?.text}
                            </div>
                          </div>
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium">{avg}</div>
                          <div className="text-sm text-gray-500">{desc}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-gray-600 hover:text-gray-800">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setSelectedAssessment(assessment); setShowForm(true); }}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && <AssessmentForm />}
      </div>
    </div>
  );
};
