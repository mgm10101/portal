import React, { useState } from 'react';
import { Plus, Search, Filter, TrendingUp, TrendingDown, Target, Users, User, Calendar, Edit, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

type KPITarget = 'individual' | 'department';
type KPIDirection = 'higher' | 'lower'; // higher = more is better, lower = less is better
type TimePeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

interface KPI {
  id: number;
  name: string;
  targetType: KPITarget;
  targetName: string; // Person name or Department name
  direction: KPIDirection;
  target: number;
  current: number;
  unit: string;
  startDate: string;
  endDate: string;
  period: TimePeriod;
  status: 'on-track' | 'at-risk' | 'behind' | 'completed';
}

export const Performance: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [targetType, setTargetType] = useState<KPITarget>('individual');
  const [kpiDirection, setKpiDirection] = useState<KPIDirection>('higher');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly');
  const [showCustomDates, setShowCustomDates] = useState(false);

  // Sample KPI data
  const kpis: KPI[] = [
    {
      id: 1,
      name: 'Student Satisfaction Score',
      targetType: 'individual',
      targetName: 'John Teacher',
      direction: 'higher',
      target: 90,
      current: 87,
      unit: '%',
      startDate: '2024-01-01',
      endDate: '2024-03-31',
      period: 'quarterly',
      status: 'on-track'
    },
    {
      id: 2,
      name: 'Customer Complaints',
      targetType: 'department',
      targetName: 'Administration',
      direction: 'lower',
      target: 5,
      current: 8,
      unit: 'complaints',
      startDate: '2024-02-01',
      endDate: '2024-02-29',
      period: 'monthly',
      status: 'at-risk'
    },
    {
      id: 3,
      name: 'Class Attendance Rate',
      targetType: 'department',
      targetName: 'Science Department',
      direction: 'higher',
      target: 95,
      current: 92,
      unit: '%',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      period: 'yearly',
      status: 'on-track'
    },
    {
      id: 4,
      name: 'Response Time',
      targetType: 'individual',
      targetName: 'Dr. Smith',
      direction: 'lower',
      target: 24,
      current: 18,
      unit: 'hours',
      startDate: '2024-02-01',
      endDate: '2024-02-29',
      period: 'monthly',
      status: 'completed'
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

  const calculateProgress = (kpi: KPI): number => {
    if (kpi.direction === 'higher') {
      // For "higher is better" KPIs
      return Math.min(Math.round((kpi.current / kpi.target) * 100), 100);
    } else {
      // For "lower is better" KPIs
      if (kpi.current <= kpi.target) {
        return 100; // Achieved or exceeded
      }
      // Calculate how far from target (inverted)
      const excess = kpi.current - kpi.target;
      const percentageOver = (excess / kpi.target) * 100;
      return Math.max(100 - percentageOver, 0);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'on-track':
        return 'bg-blue-100 text-blue-800';
      case 'at-risk':
        return 'bg-yellow-100 text-yellow-800';
      case 'behind':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressBarColor = (percentage: number, status: string) => {
    if (status === 'completed') return 'bg-green-500';
    if (percentage >= 80) return 'bg-blue-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTargetIcon = (type: KPITarget) => {
    return type === 'individual' ? <User className="w-4 h-4" /> : <Users className="w-4 h-4" />;
  };

  const getDirectionIcon = (direction: KPIDirection) => {
    return direction === 'higher' 
      ? <TrendingUp className="w-4 h-4 text-green-600" /> 
      : <TrendingDown className="w-4 h-4 text-blue-600" />;
  };

  const KPIForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Create New KPI</h2>
          <button
            onClick={() => setShowForm(false)}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <form className="space-y-6">
          {/* KPI Target Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">KPI Target</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTargetType('individual')}
                className={`p-4 border-2 rounded-lg flex flex-col items-center justify-center space-y-2 transition-colors ${
                  targetType === 'individual'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <User className="w-6 h-6" />
                <span className="text-sm font-medium">Individual</span>
              </button>
              <button
                type="button"
                onClick={() => setTargetType('department')}
                className={`p-4 border-2 rounded-lg flex flex-col items-center justify-center space-y-2 transition-colors ${
                  targetType === 'department'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Users className="w-6 h-6" />
                <span className="text-sm font-medium">Department</span>
              </button>
            </div>
          </div>

          {/* KPI Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">KPI Name</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Student Satisfaction Score"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {targetType === 'individual' ? 'Staff Member' : 'Department'}
              </label>
              <div className="flex">
                <select className="flex-1 p-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  {targetType === 'individual' ? (
                    <>
                      <option>John Teacher</option>
                      <option>Dr. Smith</option>
                      <option>Admin Staff</option>
                    </>
                  ) : (
                    <>
                      <option>Science Department</option>
                      <option>Administration</option>
                      <option>Grade 8</option>
                      <option>Grade 9</option>
                    </>
                  )}
                </select>
                <button
                  type="button"
                  className="px-3 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* KPI Direction */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">KPI Direction</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setKpiDirection('higher')}
                className={`p-4 border-2 rounded-lg flex items-center justify-center space-x-3 transition-colors ${
                  kpiDirection === 'higher'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <TrendingUp className="w-6 h-6 text-green-600" />
                <div className="text-left">
                  <div className="text-sm font-medium">Higher is Better</div>
                  <div className="text-xs text-gray-500">e.g., Sales, Satisfaction</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setKpiDirection('lower')}
                className={`p-4 border-2 rounded-lg flex items-center justify-center space-x-3 transition-colors ${
                  kpiDirection === 'lower'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <TrendingDown className="w-6 h-6 text-blue-600" />
                <div className="text-left">
                  <div className="text-sm font-medium">Lower is Better</div>
                  <div className="text-xs text-gray-500">e.g., Complaints, Time</div>
                </div>
              </button>
            </div>
          </div>

          {/* Target and Unit */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Value</label>
              <input
                type="number"
                step="0.01"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="90"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Value</label>
              <input
                type="number"
                step="0.01"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="87"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="%, hours, count"
              />
            </div>
          </div>

          {/* Time Period Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Tracking Period</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <button
                type="button"
                onClick={() => {
                  setTimePeriod('weekly');
                  setShowCustomDates(false);
                }}
                className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                  timePeriod === 'weekly' && !showCustomDates
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimePeriod('monthly');
                  setShowCustomDates(false);
                }}
                className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                  timePeriod === 'monthly' && !showCustomDates
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimePeriod('quarterly');
                  setShowCustomDates(false);
                }}
                className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                  timePeriod === 'quarterly' && !showCustomDates
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                Quarterly
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimePeriod('yearly');
                  setShowCustomDates(false);
                }}
                className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                  timePeriod === 'yearly' && !showCustomDates
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                Yearly
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimePeriod('custom');
                  setShowCustomDates(true);
                }}
                className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                  showCustomDates
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                Custom
              </button>
            </div>
          </div>

          {/* Custom Date Range */}
          {showCustomDates && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add details about this KPI, measurement method, or any relevant context..."
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
              Create KPI
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-3 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-3 mb-6 md:mb-3">
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Target className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Total KPIs</div>
                <div className="text-2xl font-bold text-gray-800">{kpis.length}</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">On Track</div>
                <div className="text-2xl font-bold text-green-600">
                  {kpis.filter(k => k.status === 'on-track' || k.status === 'completed').length}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <AlertCircle className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">At Risk</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {kpis.filter(k => k.status === 'at-risk').length}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <TrendingDown className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Behind</div>
                <div className="text-2xl font-bold text-red-600">
                  {kpis.filter(k => k.status === 'behind').length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search, Filters, and Create KPI */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 md:mb-3">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search KPIs..."
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
              <span className="hidden md:inline">Create KPI</span>
            </button>
          </div>
        </div>

        {/* KPIs Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    KPI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Direction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
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
                {kpis.map((kpi) => {
                  const percentage = calculateProgress(kpi);

                  return (
                    <tr key={kpi.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-50 rounded-lg mr-3">
                            {getTargetIcon(kpi.targetType)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{kpi.name}</div>
                            <div className="text-xs text-gray-400">{formatDate(kpi.startDate)} to {formatDate(kpi.endDate)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">{kpi.targetName}</div>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 capitalize">
                          {kpi.targetType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          {getDirectionIcon(kpi.direction)}
                          <span className="text-xs text-gray-600 capitalize">{kpi.direction}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 capitalize">
                          {kpi.period}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {kpi.target} {kpi.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                        {kpi.current} {kpi.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                            <div
                              className={`h-2 rounded-full transition-all ${getProgressBarColor(percentage, kpi.status)}`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700">{percentage}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(kpi.status)} capitalize`}>
                          {kpi.status.replace('-', ' ')}
                        </span>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && <KPIForm />}
      </div>
    </div>
  );
};
