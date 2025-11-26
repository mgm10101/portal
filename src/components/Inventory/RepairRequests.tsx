import React, { useState } from 'react';
import { Plus, Search, Filter, Wrench, FileText, CheckCircle, XCircle, Calendar, Edit, Trash2, DollarSign, Users, Building, Clock } from 'lucide-react';

type RepairStatus = 'pending' | 'quoted' | 'scheduled' | 'in-progress' | 'completed' | 'rejected';
type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface Quotation {
  id: number;
  vendor: string;
  amount: number;
  quoteDate: string;
  validUntil: string;
  notes: string;
}

interface RepairRequest {
  id: number;
  item: string;
  itemId: string;
  location: string;
  department: string;
  requestedBy: string;
  requestDate: string;
  issueDescription: string;
  priority: Priority;
  status: RepairStatus;
  quotations: Quotation[];
  selectedQuotationId: number | null;
  scheduledDate: string | null;
  scheduledTime: string | null;
  assignedVendor: string | null;
  assignedTeam: string | null;
  completedDate: string | null;
  rejectionReason: string | null;
  estimatedCost: number | null;
  actualCost: number | null;
}

export const RepairRequests: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [showQuotationForm, setShowQuotationForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RepairRequest | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'pending' | 'scheduled' | 'completed'>('all');

  // Sample repair requests
  const repairRequests: RepairRequest[] = [
    {
      id: 1,
      item: 'Air Conditioner Unit',
      itemId: 'AC-001',
      location: 'Room 101 - North Hall',
      department: 'Administration',
      requestedBy: 'John Admin',
      requestDate: '2024-02-10',
      issueDescription: 'AC not cooling properly, making strange noises',
      priority: 'high',
      status: 'quoted',
      quotations: [
        {
          id: 1,
          vendor: 'CoolTech Services',
          amount: 15000,
          quoteDate: '2024-02-12',
          validUntil: '2024-03-12',
          notes: 'Includes parts and labor, 3-month warranty'
        },
        {
          id: 2,
          vendor: 'HVAC Solutions Ltd',
          amount: 18000,
          quoteDate: '2024-02-13',
          validUntil: '2024-03-13',
          notes: 'Premium service with 6-month warranty'
        }
      ],
      selectedQuotationId: 1,
      scheduledDate: null,
      scheduledTime: null,
      assignedVendor: null,
      assignedTeam: null,
      completedDate: null,
      rejectionReason: null,
      estimatedCost: 15000,
      actualCost: null
    },
    {
      id: 2,
      item: 'Projector',
      itemId: 'PROJ-005',
      location: 'Science Lab - South Hall',
      department: 'Science Department',
      requestedBy: 'Dr. Smith',
      requestDate: '2024-02-14',
      issueDescription: 'Projector bulb needs replacement, screen flickering',
      priority: 'medium',
      status: 'scheduled',
      quotations: [
        {
          id: 3,
          vendor: 'TechFix Electronics',
          amount: 8000,
          quoteDate: '2024-02-15',
          validUntil: '2024-03-15',
          notes: 'Original bulb replacement'
        }
      ],
      selectedQuotationId: 3,
      scheduledDate: '2024-02-20',
      scheduledTime: '10:00',
      assignedVendor: 'TechFix Electronics',
      assignedTeam: null,
      completedDate: null,
      rejectionReason: null,
      estimatedCost: 8000,
      actualCost: null
    },
    {
      id: 3,
      item: 'Water Heater',
      itemId: 'WH-003',
      location: 'Boys Dormitory - North Hall',
      department: 'Boarding',
      requestedBy: 'House Parent',
      requestDate: '2024-02-12',
      issueDescription: 'Water heater not heating, needs repair',
      priority: 'urgent',
      status: 'in-progress',
      quotations: [
        {
          id: 4,
          vendor: 'Plumbing Experts',
          amount: 12000,
          quoteDate: '2024-02-13',
          validUntil: '2024-03-13',
          notes: 'Includes diagnosis and repair'
        }
      ],
      selectedQuotationId: 4,
      scheduledDate: '2024-02-16',
      scheduledTime: '14:00',
      assignedVendor: 'Plumbing Experts',
      assignedTeam: 'Maintenance Team A',
      completedDate: null,
      rejectionReason: null,
      estimatedCost: 12000,
      actualCost: null
    },
    {
      id: 4,
      item: 'Printer',
      itemId: 'PRINT-012',
      location: 'Administration Office',
      department: 'Administration',
      requestedBy: 'Admin Staff',
      requestDate: '2024-02-08',
      issueDescription: 'Printer jam, paper feed issues',
      priority: 'low',
      status: 'completed',
      quotations: [
        {
          id: 5,
          vendor: 'Office Equipment Repair',
          amount: 5000,
          quoteDate: '2024-02-09',
          validUntil: '2024-03-09',
          notes: 'Quick fix service'
        }
      ],
      selectedQuotationId: 5,
      scheduledDate: '2024-02-11',
      scheduledTime: '09:00',
      assignedVendor: 'Office Equipment Repair',
      assignedTeam: null,
      completedDate: '2024-02-11',
      rejectionReason: null,
      estimatedCost: 5000,
      actualCost: 4800
    },
    {
      id: 5,
      item: 'Desk Chair',
      itemId: 'CHAIR-045',
      location: 'Teacher\'s Office',
      department: 'Grade 8',
      requestedBy: 'John Teacher',
      requestDate: '2024-02-15',
      issueDescription: 'Chair leg broken, needs replacement',
      priority: 'low',
      status: 'rejected',
      quotations: [],
      selectedQuotationId: null,
      scheduledDate: null,
      scheduledTime: null,
      assignedVendor: null,
      assignedTeam: null,
      completedDate: null,
      rejectionReason: 'Item beyond repair, recommend replacement instead',
      estimatedCost: null,
      actualCost: null
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

  const getStatusColor = (status: RepairStatus) => {
    const colors: Record<RepairStatus, string> = {
      'pending': 'bg-gray-100 text-gray-800',
      'quoted': 'bg-blue-100 text-blue-800',
      'scheduled': 'bg-purple-100 text-purple-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return colors[status];
  };

  const getPriorityColor = (priority: Priority) => {
    const colors: Record<Priority, string> = {
      'low': 'bg-gray-100 text-gray-800',
      'medium': 'bg-blue-100 text-blue-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800'
    };
    return colors[priority];
  };

  const filteredRequests = viewMode === 'all' 
    ? repairRequests 
    : repairRequests.filter(req => {
        if (viewMode === 'pending') return req.status === 'pending' || req.status === 'quoted';
        if (viewMode === 'scheduled') return req.status === 'scheduled' || req.status === 'in-progress';
        if (viewMode === 'completed') return req.status === 'completed';
        return true;
      });

  const pendingCount = repairRequests.filter(r => r.status === 'pending' || r.status === 'quoted').length;
  const scheduledCount = repairRequests.filter(r => r.status === 'scheduled' || r.status === 'in-progress').length;
  const completedCount = repairRequests.filter(r => r.status === 'completed').length;
  const totalCost = repairRequests
    .filter(r => r.actualCost !== null)
    .reduce((sum, r) => sum + (r.actualCost || 0), 0);

  const RepairRequestForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">New Repair Request</h2>
          <button
            onClick={() => setShowForm(false)}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
              <div className="flex">
                <select className="flex-1 p-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Select item...</option>
                  <option>Air Conditioner Unit</option>
                  <option>Projector</option>
                  <option>Water Heater</option>
                  <option>Printer</option>
                  <option>Desk Chair</option>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Item ID</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="AC-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Room 101 - North Hall"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Administration</option>
                <option>Science Department</option>
                <option>Boarding</option>
                <option>Grade 8</option>
                <option>Grade 9</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requested By</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Admin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Issue Description</label>
            <textarea
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the repair issue in detail..."
            ></textarea>
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
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const QuotationForm = () => {
    if (!selectedRequest) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Add Quotation</h2>
            <button
              onClick={() => {
                setShowQuotationForm(false);
                setSelectedRequest(null);
              }}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Repair Request:</p>
            <p className="font-semibold text-gray-900">{selectedRequest.item} - {selectedRequest.location}</p>
          </div>

          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor/Service Provider</label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Vendor name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quotation Amount (KES)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quote Date</label>
                <input
                  type="date"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                <input
                  type="date"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional notes about the quotation..."
              ></textarea>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowQuotationForm(false);
                  setSelectedRequest(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Quotation
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const ScheduleForm = () => {
    if (!selectedRequest) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Schedule Repair</h2>
            <button
              onClick={() => {
                setShowScheduleForm(false);
                setSelectedRequest(null);
              }}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Repair Request:</p>
            <p className="font-semibold text-gray-900">{selectedRequest.item} - {selectedRequest.location}</p>
            {selectedRequest.quotations.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">Selected Quotation:</p>
                <p className="font-medium text-gray-900">
                  {selectedRequest.quotations.find(q => q.id === selectedRequest.selectedQuotationId)?.vendor || 'None selected'} - 
                  KES {selectedRequest.quotations.find(q => q.id === selectedRequest.selectedQuotationId)?.amount.toLocaleString() || '0'}
                </p>
              </div>
            )}
          </div>

          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                <input
                  type="date"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Time</label>
                <input
                  type="time"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Vendor</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Select vendor...</option>
                  {selectedRequest.quotations.map(quote => (
                    <option key={quote.id} value={quote.vendor}>{quote.vendor}</option>
                  ))}
                  <option>Internal Team</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Team (Optional)</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>None</option>
                  <option>Maintenance Team A</option>
                  <option>Maintenance Team B</option>
                  <option>IT Support Team</option>
                  <option>Electrical Team</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowScheduleForm(false);
                  setSelectedRequest(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Schedule Repair
              </button>
            </div>
          </form>
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
              <Wrench className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Total Requests</div>
                <div className="text-2xl font-bold text-gray-800">{repairRequests.length}</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Pending</div>
                <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Scheduled</div>
                <div className="text-2xl font-bold text-purple-600">{scheduledCount}</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Total Spent</div>
                <div className="text-2xl font-bold text-green-600">
                  KES {totalCost.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* View Toggle and Search */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 md:mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search repair requests..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* View Toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('all')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setViewMode('pending')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-l ${
                  viewMode === 'pending'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setViewMode('scheduled')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-l ${
                  viewMode === 'scheduled'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Scheduled
              </button>
              <button
                onClick={() => setViewMode('completed')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-l ${
                  viewMode === 'completed'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Completed
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
              <span className="hidden md:inline">New Request</span>
            </button>
          </div>
        </div>

        {/* Repair Requests Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quotations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor/Team
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{request.item}</div>
                      <div className="text-xs text-gray-500">{request.itemId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{request.location}</div>
                      <div className="text-xs text-gray-500">{request.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{request.requestedBy}</div>
                      <div className="text-xs text-gray-500">{formatDate(request.requestDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(request.priority)} capitalize`}>
                        {request.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)} capitalize`}>
                        {request.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {request.quotations.length} quotation{request.quotations.length !== 1 ? 's' : ''}
                      </div>
                      {request.selectedQuotationId && (
                        <div className="text-xs text-gray-500">
                          Selected: KES {request.quotations.find(q => q.id === request.selectedQuotationId)?.amount.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {request.assignedVendor ? (
                        <div className="text-sm text-gray-900">{request.assignedVendor}</div>
                      ) : (
                        <span className="text-xs text-gray-400">Not assigned</span>
                      )}
                      {request.assignedTeam && (
                        <div className="text-xs text-gray-500">{request.assignedTeam}</div>
                      )}
                      {request.scheduledDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(request.scheduledDate)} {request.scheduledTime}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {request.status === 'pending' || request.status === 'quoted' ? (
                          <>
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowQuotationForm(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Add Quotation"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                            {request.quotations.length > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowScheduleForm(true);
                                }}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Schedule"
                              >
                                <Calendar className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        ) : null}
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

        {showForm && <RepairRequestForm />}
        {showQuotationForm && <QuotationForm />}
        {showScheduleForm && <ScheduleForm />}
      </div>
    </div>
  );
};

