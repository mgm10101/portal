import React, { useState } from 'react';
import { Plus, Search, Filter, TrendingUp, Phone, Mail, Calendar, Edit, Trash2, User, Users, MapPin, Flame, Snowflake, ThermometerSun } from 'lucide-react';

type LeadStage = 
  | 'inquiry' 
  | 'info-sent' 
  | 'visit-scheduled' 
  | 'visit-completed' 
  | 'application-submitted' 
  | 'interview-scheduled' 
  | 'interview-completed' 
  | 'offer-made' 
  | 'enrolled' 
  | 'lost';

type LeadSource = 'website' | 'referral' | 'walk-in' | 'social-media' | 'phone' | 'event' | 'other';
type LeadTemperature = 'hot' | 'warm' | 'cold';

interface Lead {
  id: number;
  parentName: string;
  studentName: string;
  email: string;
  phone: string;
  gradeInterested: string;
  stage: LeadStage;
  source: LeadSource;
  temperature: LeadTemperature;
  followUpDate: string;
  dateCreated: string;
  lastContact: string;
  assignedTo: string;
  notes: string;
}

const stageLabels: Record<LeadStage, string> = {
  'inquiry': 'Initial Inquiry',
  'info-sent': 'Information Sent',
  'visit-scheduled': 'Visit Scheduled',
  'visit-completed': 'Visit Completed',
  'application-submitted': 'Application Submitted',
  'interview-scheduled': 'Interview Scheduled',
  'interview-completed': 'Interview Completed',
  'offer-made': 'Offer Made',
  'enrolled': 'Enrolled',
  'lost': 'Lost/Declined'
};

export const Leads: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'pipeline' | 'table'>('pipeline');
  const [selectedSource, setSelectedSource] = useState<LeadSource>('website');
  const [selectedTemperature, setSelectedTemperature] = useState<LeadTemperature>('warm');

  // Sample leads data
  const leads: Lead[] = [
    {
      id: 1,
      parentName: 'Sarah Johnson',
      studentName: 'Emily Johnson',
      email: 'sarah.j@email.com',
      phone: '+1 234-567-8901',
      gradeInterested: 'Grade 8',
      stage: 'visit-scheduled',
      source: 'website',
      temperature: 'hot',
      followUpDate: '2024-02-20',
      dateCreated: '2024-02-10',
      lastContact: '2024-02-15',
      assignedTo: 'Admin Staff',
      notes: 'Very interested, wants to visit next week'
    },
    {
      id: 2,
      parentName: 'Michael Brown',
      studentName: 'David Brown',
      email: 'michael.b@email.com',
      phone: '+1 234-567-8902',
      gradeInterested: 'Grade 6',
      stage: 'application-submitted',
      source: 'referral',
      temperature: 'hot',
      followUpDate: '2024-02-18',
      dateCreated: '2024-01-15',
      lastContact: '2024-02-14',
      assignedTo: 'Admin Staff',
      notes: 'Referred by current parent Mrs. Smith'
    },
    {
      id: 3,
      parentName: 'Lisa Anderson',
      studentName: 'Sophie Anderson',
      email: 'lisa.a@email.com',
      phone: '+1 234-567-8903',
      gradeInterested: 'Grade 9',
      stage: 'info-sent',
      source: 'social-media',
      temperature: 'warm',
      followUpDate: '2024-02-22',
      dateCreated: '2024-02-12',
      lastContact: '2024-02-13',
      assignedTo: 'Admin Staff',
      notes: 'Sent prospectus via email'
    },
    {
      id: 4,
      parentName: 'James Wilson',
      studentName: 'Alex Wilson',
      email: 'james.w@email.com',
      phone: '+1 234-567-8904',
      gradeInterested: 'Grade 7',
      stage: 'inquiry',
      source: 'walk-in',
      temperature: 'cold',
      followUpDate: '2024-02-25',
      dateCreated: '2024-02-14',
      lastContact: '2024-02-14',
      assignedTo: 'Admin Staff',
      notes: 'Just browsing, needs time to decide'
    },
    {
      id: 5,
      parentName: 'Emma Davis',
      studentName: 'Oliver Davis',
      email: 'emma.d@email.com',
      phone: '+1 234-567-8905',
      gradeInterested: 'Grade 10',
      stage: 'offer-made',
      source: 'event',
      temperature: 'hot',
      followUpDate: '2024-02-17',
      dateCreated: '2024-01-20',
      lastContact: '2024-02-15',
      assignedTo: 'Principal',
      notes: 'Met at open house, very impressed'
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

  const getLeadsByStage = (stage: LeadStage) => {
    return leads.filter(lead => lead.stage === stage);
  };

  const getStageColor = (stage: LeadStage) => {
    const colors: Record<LeadStage, string> = {
      'inquiry': 'bg-gray-100 text-gray-800',
      'info-sent': 'bg-blue-100 text-blue-800',
      'visit-scheduled': 'bg-purple-100 text-purple-800',
      'visit-completed': 'bg-indigo-100 text-indigo-800',
      'application-submitted': 'bg-cyan-100 text-cyan-800',
      'interview-scheduled': 'bg-teal-100 text-teal-800',
      'interview-completed': 'bg-emerald-100 text-emerald-800',
      'offer-made': 'bg-lime-100 text-lime-800',
      'enrolled': 'bg-green-100 text-green-800',
      'lost': 'bg-red-100 text-red-800'
    };
    return colors[stage];
  };

  const getTemperatureIcon = (temp: LeadTemperature) => {
    switch (temp) {
      case 'hot':
        return <Flame className="w-4 h-4 text-red-600" />;
      case 'warm':
        return <ThermometerSun className="w-4 h-4 text-orange-600" />;
      case 'cold':
        return <Snowflake className="w-4 h-4 text-blue-600" />;
    }
  };

  const getTemperatureColor = (temp: LeadTemperature) => {
    switch (temp) {
      case 'hot':
        return 'bg-red-100 text-red-800';
      case 'warm':
        return 'bg-orange-100 text-orange-800';
      case 'cold':
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getSourceLabel = (source: LeadSource) => {
    const labels: Record<LeadSource, string> = {
      'website': 'Website',
      'referral': 'Referral',
      'walk-in': 'Walk-in',
      'social-media': 'Social Media',
      'phone': 'Phone Call',
      'event': 'Event',
      'other': 'Other'
    };
    return labels[source];
  };

  const conversionRate = Math.round((leads.filter(l => l.stage === 'enrolled').length / leads.length) * 100);
  const hotLeads = leads.filter(l => l.temperature === 'hot').length;

  const LeadForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Add New Lead</h2>
          <button
            onClick={() => setShowForm(false)}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <form className="space-y-6">
          {/* Parent & Student Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Name</label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="parent@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1 234-567-8900"
                />
              </div>
            </div>
          </div>

          {/* Lead Details */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Lead Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade Interested</label>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Admin Staff</option>
                  <option>Principal</option>
                  <option>Admissions Officer</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lead Source */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Lead Source</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['website', 'referral', 'walk-in', 'social-media', 'phone', 'event', 'other'] as LeadSource[]).map((source) => (
                <button
                  key={source}
                  type="button"
                  onClick={() => setSelectedSource(source)}
                  className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                    selectedSource === source
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {getSourceLabel(source)}
                </button>
              ))}
            </div>
          </div>

          {/* Lead Temperature */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Lead Temperature</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setSelectedTemperature('hot')}
                className={`p-4 border-2 rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                  selectedTemperature === 'hot'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Flame className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium">Hot</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTemperature('warm')}
                className={`p-4 border-2 rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                  selectedTemperature === 'warm'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <ThermometerSun className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium">Warm</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTemperature('cold')}
                className={`p-4 border-2 rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                  selectedTemperature === 'cold'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Snowflake className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">Cold</span>
              </button>
            </div>
          </div>

          {/* Follow-up Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
            <input
              type="date"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add any relevant notes about this lead..."
            ></textarea>
          </div>

          {/* Form Actions */}
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
              Add Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const PipelineView = () => {
    const stages: LeadStage[] = [
      'inquiry',
      'info-sent',
      'visit-scheduled',
      'visit-completed',
      'application-submitted',
      'interview-scheduled',
      'interview-completed',
      'offer-made',
      'enrolled',
      'lost'
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stages.map((stage) => {
          const stageLeads = getLeadsByStage(stage);
          return (
            <div key={stage} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">{stageLabels[stage]}</h3>
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                  {stageLeads.length}
                </span>
              </div>
              <div className="space-y-2">
                {stageLeads.map((lead) => (
                  <div key={lead.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{lead.parentName}</div>
                        <div className="text-xs text-gray-500">{lead.studentName}</div>
                      </div>
                      {getTemperatureIcon(lead.temperature)}
                    </div>
                    <div className="text-xs text-gray-600 mb-2">{lead.gradeInterested}</div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(lead.followUpDate)}
                    </div>
                  </div>
                ))}
                {stageLeads.length === 0 && (
                  <div className="text-xs text-gray-400 text-center py-4">No leads</div>
                )}
              </div>
            </div>
          );
        })}
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
              <Users className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Total Leads</div>
                <div className="text-2xl font-bold text-gray-800">{leads.length}</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Flame className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Hot Leads</div>
                <div className="text-2xl font-bold text-red-600">{hotLeads}</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Conversion Rate</div>
                <div className="text-2xl font-bold text-green-600">{conversionRate}%</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Follow-ups Due</div>
                <div className="text-2xl font-bold text-purple-600">
                  {leads.filter(l => new Date(l.followUpDate) <= new Date()).length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search, Filters, View Toggle, and Add Lead */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 md:mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="flex-shrink-0 flex items-center justify-center p-2 md:px-4 md:py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Filters</span>
            </button>
            
            {/* View Toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('pipeline')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'pipeline'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Pipeline
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-l ${
                  viewMode === 'table'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Table
              </button>
            </div>

            <button
              onClick={() => setShowForm(true)}
              className="flex-shrink-0 bg-blue-600 text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
            >
              <Plus className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">Add Lead</span>
            </button>
          </div>
        </div>

        {/* Pipeline or Table View */}
        {viewMode === 'pipeline' ? (
          <PipelineView />
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lead
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Temperature
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Follow-up
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{lead.parentName}</div>
                          <div className="text-xs text-gray-500">{lead.studentName}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-600">
                          <div className="flex items-center mb-1">
                            <Mail className="w-3 h-3 mr-1" />
                            {lead.email}
                          </div>
                          <div className="flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {lead.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.gradeInterested}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(lead.stage)}`}>
                          {stageLabels[lead.stage]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 capitalize">
                          {getSourceLabel(lead.source)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          {getTemperatureIcon(lead.temperature)}
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTemperatureColor(lead.temperature)} capitalize`}>
                            {lead.temperature}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(lead.followUpDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {lead.assignedTo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit className="w-4 h-4" />
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

        {showForm && <LeadForm />}
      </div>
    </div>
  );
};

