import React, { useState } from 'react';
import { Plus, Search, Filter, BookOpen, Edit, Trash2, Eye, Download, Calendar, User, Clock, Target, FileText, PlusCircle, X } from 'lucide-react';

type LessonPlanStatus = 'draft' | 'approved' | 'in-use' | 'completed';
type Subject = 'mathematics' | 'english' | 'science' | 'social-studies' | 'arts' | 'physical-education' | 'other';

interface LearningObjective {
  id: number;
  objective: string;
}

interface Material {
  id: number;
  item: string;
}

interface LessonSection {
  id: number;
  title: string;
  content: string;
  duration: number; // in minutes
}

interface CustomField {
  id: number;
  label: string;
  value: string;
  type: 'text' | 'textarea' | 'number' | 'date';
}

interface LessonPlan {
  id: number;
  title: string;
  subject: Subject;
  grade: string;
  topic: string;
  date: string;
  duration: number; // total minutes
  teacher: string;
  learningObjectives: LearningObjective[];
  materials: Material[];
  sections: LessonSection[];
  homework: string;
  assessment: string;
  notes: string;
  customFields: CustomField[];
  status: LessonPlanStatus;
  createdAt: string;
  lastModified: string;
}

export const LessonPlans: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<LessonPlan | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Sample lesson plans
  const lessonPlans: LessonPlan[] = [
    {
      id: 1,
      title: 'Introduction to Algebra',
      subject: 'mathematics',
      grade: 'Grade 8',
      topic: 'Linear Equations',
      date: '2024-03-18',
      duration: 45,
      teacher: 'John Teacher',
      learningObjectives: [
        { id: 1, objective: 'Students will understand the concept of variables' },
        { id: 2, objective: 'Students will solve simple linear equations' },
        { id: 3, objective: 'Students will apply algebraic thinking to word problems' }
      ],
      materials: [
        { id: 1, item: 'Whiteboard and markers' },
        { id: 2, item: 'Algebra worksheets' },
        { id: 3, item: 'Calculator' }
      ],
      sections: [
        {
          id: 1,
          title: 'Introduction (5 min)',
          content: 'Review previous lesson on basic arithmetic. Introduce the concept of variables using real-world examples.',
          duration: 5
        },
        {
          id: 2,
          title: 'Main Content (25 min)',
          content: 'Explain linear equations step by step. Work through examples on the board. Students practice with guided exercises.',
          duration: 25
        },
        {
          id: 3,
          title: 'Practice (10 min)',
          content: 'Students work independently on worksheet problems. Teacher circulates to provide assistance.',
          duration: 10
        },
        {
          id: 4,
          title: 'Closure (5 min)',
          content: 'Review key concepts. Answer questions. Assign homework.',
          duration: 5
        }
      ],
      homework: 'Complete exercises 1-10 on page 45. Show all work.',
      assessment: 'Formative: Observation during practice. Summative: Homework completion and accuracy.',
      notes: 'Some students struggled with the concept of variables. Consider using more visual aids next time.',
      customFields: [],
      status: 'approved',
      createdAt: '2024-03-10',
      lastModified: '2024-03-15'
    },
    {
      id: 2,
      title: 'Shakespeare\'s Sonnets',
      subject: 'english',
      grade: 'Grade 9',
      topic: 'Poetry Analysis',
      date: '2024-03-19',
      duration: 50,
      teacher: 'Jane Teacher',
      learningObjectives: [
        { id: 1, objective: 'Students will analyze the structure of a sonnet' },
        { id: 2, objective: 'Students will identify literary devices in poetry' }
      ],
      materials: [
        { id: 1, item: 'Shakespeare sonnet collection' },
        { id: 2, item: 'Projector for displaying poems' }
      ],
      sections: [
        {
          id: 1,
          title: 'Warm-up (5 min)',
          content: 'Quick discussion: What is poetry?',
          duration: 5
        },
        {
          id: 2,
          title: 'Introduction to Sonnets (15 min)',
          content: 'Explain sonnet structure (14 lines, rhyme scheme). Read Sonnet 18 together.',
          duration: 15
        },
        {
          id: 3,
          title: 'Analysis Activity (25 min)',
          content: 'Group work: Analyze assigned sonnet. Identify themes, devices, structure.',
          duration: 25
        },
        {
          id: 4,
          title: 'Presentation (5 min)',
          content: 'Groups share findings. Class discussion.',
          duration: 5
        }
      ],
      homework: 'Write a one-page analysis of Sonnet 130',
      assessment: 'Group presentation rubric. Written analysis assignment.',
      notes: 'Students engaged well with group work. Consider extending analysis time.',
      customFields: [],
      status: 'draft',
      createdAt: '2024-03-12',
      lastModified: '2024-03-17'
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

  const getSubjectLabel = (subject: Subject) => {
    const labels: Record<Subject, string> = {
      'mathematics': 'Mathematics',
      'english': 'English',
      'science': 'Science',
      'social-studies': 'Social Studies',
      'arts': 'Arts',
      'physical-education': 'Physical Education',
      'other': 'Other'
    };
    return labels[subject];
  };

  const getStatusColor = (status: LessonPlanStatus) => {
    const colors: Record<LessonPlanStatus, string> = {
      'draft': 'bg-gray-100 text-gray-800',
      'approved': 'bg-green-100 text-green-800',
      'in-use': 'bg-blue-100 text-blue-800',
      'completed': 'bg-purple-100 text-purple-800'
    };
    return colors[status];
  };

  const getSubjectColor = (subject: Subject) => {
    const colors: Record<Subject, string> = {
      'mathematics': 'bg-blue-100 text-blue-800',
      'english': 'bg-red-100 text-red-800',
      'science': 'bg-green-100 text-green-800',
      'social-studies': 'bg-yellow-100 text-yellow-800',
      'arts': 'bg-purple-100 text-purple-800',
      'physical-education': 'bg-orange-100 text-orange-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return colors[subject];
  };

  const LessonPlanForm = () => {
    const [sections, setSections] = useState<LessonSection[]>([
      { id: 1, title: 'Introduction', content: '', duration: 5 },
      { id: 2, title: 'Main Content', content: '', duration: 30 },
      { id: 3, title: 'Practice', content: '', duration: 10 }
    ]);
    const [objectives, setObjectives] = useState<LearningObjective[]>([{ id: 1, objective: '' }]);
    const [materials, setMaterials] = useState<Material[]>([{ id: 1, item: '' }]);
    const [customFields, setCustomFields] = useState<CustomField[]>([]);

    const addSection = () => {
      setSections([...sections, { id: Date.now(), title: '', content: '', duration: 5 }]);
    };

    const removeSection = (id: number) => {
      setSections(sections.filter(s => s.id !== id));
    };

    const addObjective = () => {
      setObjectives([...objectives, { id: Date.now(), objective: '' }]);
    };

    const removeObjective = (id: number) => {
      setObjectives(objectives.filter(o => o.id !== id));
    };

    const addMaterial = () => {
      setMaterials([...materials, { id: Date.now(), item: '' }]);
    };

    const removeMaterial = (id: number) => {
      setMaterials(materials.filter(m => m.id !== id));
    };

    const addCustomField = () => {
      setCustomFields([...customFields, { id: Date.now(), label: '', value: '', type: 'text' }]);
    };

    const removeCustomField = (id: number) => {
      setCustomFields(customFields.filter(f => f.id !== id));
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Create Lesson Plan</h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <form className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Mathematics</option>
                    <option>English</option>
                    <option>Science</option>
                    <option>Social Studies</option>
                    <option>Arts</option>
                    <option>Physical Education</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade/Class</label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Grade 6</option>
                    <option>Grade 7</option>
                    <option>Grade 8</option>
                    <option>Grade 9</option>
                    <option>Grade 10</option>
                    <option>Grade 11</option>
                    <option>Grade 12</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Title</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Introduction to Algebra"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Linear Equations"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="45"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Teacher name"
                  />
                </div>
              </div>
            </div>

            {/* Learning Objectives */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Learning Objectives</h3>
                <button
                  type="button"
                  onClick={addObjective}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Objective</span>
                </button>
              </div>
              <div className="space-y-2">
                {objectives.map((obj, index) => (
                  <div key={obj.id} className="flex items-start space-x-2">
                    <span className="mt-3 text-sm font-medium text-gray-600">{index + 1}.</span>
                    <input
                      type="text"
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Students will..."
                    />
                    {objectives.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeObjective(obj.id)}
                        className="mt-2 p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Materials/Resources */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Materials & Resources</h3>
                <button
                  type="button"
                  onClick={addMaterial}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Material</span>
                </button>
              </div>
              <div className="space-y-2">
                {materials.map((material) => (
                  <div key={material.id} className="flex items-center space-x-2">
                    <input
                      type="text"
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Material or resource needed"
                    />
                    {materials.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMaterial(material.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Lesson Structure/Sections */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Lesson Structure</h3>
                <button
                  type="button"
                  onClick={addSection}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Section</span>
                </button>
              </div>
              <div className="space-y-4">
                {sections.map((section, index) => (
                  <div key={section.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2 flex-1">
                        <span className="text-sm font-medium text-gray-600">Section {index + 1}</span>
                        <input
                          type="text"
                          className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Section title (e.g., Introduction, Main Content)"
                          defaultValue={section.title}
                        />
                        <input
                          type="number"
                          className="w-20 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Min"
                          defaultValue={section.duration}
                        />
                        <span className="text-sm text-gray-500">min</span>
                      </div>
                      {sections.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSection(section.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe the activities and content for this section..."
                      defaultValue={section.content}
                    ></textarea>
                  </div>
                ))}
              </div>
            </div>

            {/* Homework/Assignment */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Homework/Assignment</h3>
              <textarea
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe homework or assignments..."
              ></textarea>
            </div>

            {/* Assessment */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Assessment</h3>
              <textarea
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe assessment methods (formative, summative, rubrics, etc.)..."
              ></textarea>
            </div>

            {/* Notes/Reflections */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Notes & Reflections</h3>
              <textarea
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional notes, reflections, or reminders..."
              ></textarea>
            </div>

            {/* Custom Fields */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Custom Fields</h3>
                <button
                  type="button"
                  onClick={addCustomField}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Custom Field</span>
                </button>
              </div>
              <div className="space-y-3">
                {customFields.map((field) => (
                  <div key={field.id} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg">
                    <input
                      type="text"
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Field label"
                      defaultValue={field.label}
                    />
                    <select className="w-32 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option>Text</option>
                      <option>Textarea</option>
                      <option>Number</option>
                      <option>Date</option>
                    </select>
                    <input
                      type="text"
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Value"
                      defaultValue={field.value}
                    />
                    <button
                      type="button"
                      onClick={() => removeCustomField(field.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {customFields.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No custom fields. Click "Add Custom Field" to create one.</p>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Draft</option>
                <option>Approved</option>
                <option>In Use</option>
                <option>Completed</option>
              </select>
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
                Save Lesson Plan
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const LessonPlanView = () => {
    if (!selectedPlan) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedPlan.title}</h2>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSubjectColor(selectedPlan.subject)}`}>
                  {getSubjectLabel(selectedPlan.subject)}
                </span>
                <span className="text-sm text-gray-600">{selectedPlan.grade}</span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedPlan.status)} capitalize`}>
                  {selectedPlan.status}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setShowView(false);
                setSelectedPlan(null);
              }}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-600">Topic</p>
                <p className="text-sm font-medium text-gray-900">{selectedPlan.topic}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Date</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(selectedPlan.date)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Duration</p>
                <p className="text-sm font-medium text-gray-900">{selectedPlan.duration} min</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Teacher</p>
                <p className="text-sm font-medium text-gray-900">{selectedPlan.teacher}</p>
              </div>
            </div>

            {/* Learning Objectives */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-600" />
                Learning Objectives
              </h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                {selectedPlan.learningObjectives.map((obj) => (
                  <li key={obj.id} className="text-sm text-gray-700">{obj.objective}</li>
                ))}
              </ul>
            </div>

            {/* Materials */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-green-600" />
                Materials & Resources
              </h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                {selectedPlan.materials.map((material) => (
                  <li key={material.id} className="text-sm text-gray-700">{material.item}</li>
                ))}
              </ul>
            </div>

            {/* Lesson Structure */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-purple-600" />
                Lesson Structure
              </h3>
              <div className="space-y-4">
                {selectedPlan.sections.map((section, index) => (
                  <div key={section.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{section.title}</h4>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{section.duration} min</span>
                    </div>
                    <p className="text-sm text-gray-700">{section.content}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Homework */}
            {selectedPlan.homework && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Homework/Assignment</h3>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedPlan.homework}</p>
              </div>
            )}

            {/* Assessment */}
            {selectedPlan.assessment && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Assessment</h3>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedPlan.assessment}</p>
              </div>
            )}

            {/* Notes */}
            {selectedPlan.notes && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes & Reflections</h3>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedPlan.notes}</p>
              </div>
            )}

            {/* Custom Fields */}
            {selectedPlan.customFields.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Information</h3>
                <div className="space-y-2">
                  {selectedPlan.customFields.map((field) => (
                    <div key={field.id} className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700 w-32">{field.label}:</span>
                      <span className="text-sm text-gray-600">{field.value}</span>
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

  return (
    <div className="p-6 md:p-3 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-3 mb-6 md:mb-3">
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Total Plans</div>
                <div className="text-2xl font-bold text-gray-800">{lessonPlans.length}</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Approved</div>
                <div className="text-2xl font-bold text-green-600">
                  {lessonPlans.filter(p => p.status === 'approved').length}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <User className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Teachers</div>
                <div className="text-2xl font-bold text-purple-600">
                  {new Set(lessonPlans.map(p => p.teacher)).size}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">This Week</div>
                <div className="text-2xl font-bold text-orange-600">
                  {lessonPlans.filter(p => {
                    const planDate = new Date(p.date);
                    const today = new Date();
                    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                    return planDate >= today && planDate <= weekFromNow;
                  }).length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search, Filters, and Actions */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 md:mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search lesson plans..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* View Toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-l ${
                  viewMode === 'calendar'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Calendar
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
              <span className="hidden md:inline">New Lesson Plan</span>
            </button>
          </div>
        </div>

        {/* Lesson Plans Table */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lesson Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teacher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lessonPlans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{plan.title}</div>
                        <div className="text-xs text-gray-500">{plan.topic}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSubjectColor(plan.subject)}`}>
                          {getSubjectLabel(plan.subject)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {plan.grade}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(plan.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {plan.duration} min
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {plan.teacher}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(plan.status)} capitalize`}>
                          {plan.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedPlan(plan);
                              setShowView(true);
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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

        {viewMode === 'calendar' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-center text-gray-500">Calendar view coming soon</p>
          </div>
        )}

        {showForm && <LessonPlanForm />}
        {showView && <LessonPlanView />}
      </div>
    </div>
  );
};

