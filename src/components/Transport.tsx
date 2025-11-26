import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Bus, Users, MapPin, Wrench, CheckCircle, Calendar, Edit, Trash2, AlertCircle, Clock, FileCheck, Route, Car, Sun, Moon, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { fetchClasses } from '../api/tables';
import { DropdownField } from './Students/masterlist/DropdownField';
import { OptionsModal } from './Students/masterlist/OptionsModal';

type TripType = 'morning' | 'evening';
type VehicleStatus = 'active' | 'maintenance' | 'inactive';
type MaintenanceStatus = 'scheduled' | 'in-progress' | 'completed';
type ComplianceStatus = 'compliant' | 'non-compliant' | 'pending';

interface Trip {
  id: number;
  tripType: TripType;
  routeName: string;
  vehicleId: string;
  vehicleNumber: string;
  driver: string;
  departureTime: string;
  arrivalTime: string;
  locations: Location[];
  students: TripStudent[];
  status: 'active' | 'inactive';
}

interface Location {
  id: number;
  name: string;
  address: string;
  pickupTime: string;
  dropoffTime: string;
  order: number;
}

interface TripStudent {
  id: number;
  studentName: string;
  studentId: string;
  grade: string;
  pickupLocation: string;
  dropoffLocation: string;
  contact: string;
}

interface Vehicle {
  id: number;
  vehicleNumber: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  capacity: number;
  fleet: string;
  status: VehicleStatus;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  complianceStatus: ComplianceStatus;
}

interface MaintenanceRecord {
  id: number;
  vehicleId: string;
  vehicleNumber: string;
  maintenanceDate: string;
  maintenanceType: string;
  partsChanged: string[];
  cost: number;
  performedBy: string;
  location: string;
  comments: string;
  recommendations: string;
  nextMaintenanceDate: string;
  nextMaintenanceType: string;
  status: MaintenanceStatus;
}

interface ComplianceChecklist {
  id: number;
  vehicleId: string;
  vehicleNumber: string;
  regulationName: string;
  requirement: string;
  status: ComplianceStatus;
  checkedDate: string;
  checkedBy: string;
  notes: string;
}

interface GovernmentRegulation {
  id: number;
  regulationName: string;
  description: string;
  category: string;
  effectiveDate: string;
  expiryDate: string | null;
  isActive: boolean;
}

interface TransportStudent {
  id?: string | number;
  admission_number: string;
  name: string;
  current_class_id: number | null;
  current_class?: { name: string };
  transport_zone_id?: number | null;
  transport_zone?: { name: string } | null;
  transport_type_id?: number | null;
  transport_type?: { name: string } | null;
  [key: string]: any; // Allow additional fields from the database
}

interface TransportType {
  id: number;
  name: string;
  sort_order?: number | null;
}

interface TransportZone {
  id: number;
  name: string;
  description: string | null;
  created_at?: string;
  updated_at?: string;
}

interface TransportZoneArea {
  id: number;
  zone_id: number;
  name: string;
  description: string | null;
  created_at?: string;
}

interface TransportFilterState {
  class: string;
  zone: string;
}

export const Transport: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'students' | 'trips' | 'vehicles' | 'maintenance' | 'compliance' | 'regulations' | 'zones'>('students');
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'trip' | 'vehicle' | 'maintenance' | 'compliance' | 'regulation'>('trip');
  
  // Students tab state
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [showStudentFilterModal, setShowStudentFilterModal] = useState(false);
  const [studentFilters, setStudentFilters] = useState<TransportFilterState>({
    class: '',
    zone: ''
  });
  const [appliedStudentFilters, setAppliedStudentFilters] = useState<TransportFilterState>({
    class: '',
    zone: ''
  });
  
  // Zones tab state
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [selectedZone, setSelectedZone] = useState<TransportZone | null>(null);
  const [showAreaForm, setShowAreaForm] = useState(false);
  const [selectedZoneForArea, setSelectedZoneForArea] = useState<number | null>(null);
  
  // Batch zone assignment state
  const [showBatchAssignModal, setShowBatchAssignModal] = useState(false);
  const [batchFilterClass, setBatchFilterClass] = useState('');
  const [batchFilterZone, setBatchFilterZone] = useState('');
  const [selectedStudentsForBatch, setSelectedStudentsForBatch] = useState<Set<string>>(new Set());
  const [batchAssignZoneId, setBatchAssignZoneId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);
  
  // Individual zone assignment state
  const [showIndividualAssignModal, setShowIndividualAssignModal] = useState(false);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<TransportStudent | null>(null);
  const [individualAssignZoneId, setIndividualAssignZoneId] = useState<string>('');
  const [individualAssignTypeId, setIndividualAssignTypeId] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Transport types state
  const [showTransportTypesModal, setShowTransportTypesModal] = useState(false);
  
  // Fetch functions
  const fetchTransportStudents = async () => {
    try {
      // First try with transport_zone_id if it exists - only fetch Active students
      let query = supabase
        .from('students')
        .select(`
          *,
          current_class:classes!current_class_id(name),
          transport_zone:transport_zones!transport_zone_id(name),
          transport_type:transport_types!transport_type_id(name)
        `)
        .eq('status', 'Active')
        .order('name');
      
      const { data, error } = await query;
      
      if (error) {
        // Check if error is due to missing transport_zones/transport_types table or columns
        const isMissingTableOrColumn = 
          error.code === 'PGRST116' || 
          error.code === '42P01' || // undefined_table
          error.code === '42703' || // undefined_column
          error.message?.includes('relation') || 
          error.message?.includes('does not exist') || 
          error.message?.includes('column') ||
          error.message?.includes('transport_zones') ||
          error.message?.includes('transport_zone_id') ||
          error.message?.includes('transport_types') ||
          error.message?.includes('transport_type_id');
        
        if (isMissingTableOrColumn) {
          // Fallback: fetch without transport_zone columns - try with class join first
          console.warn('Transport zones not set up yet. Fetching students without zone data. Please run the database migration.');
          
          // Try with class join - only fetch Active students
          let fallbackQuery = supabase
            .from('students')
            .select(`
              *,
              current_class:classes!current_class_id(name)
            `)
            .eq('status', 'Active')
            .order('name');
          
          const { data: fallbackData, error: fallbackError } = await fallbackQuery;
          
          if (fallbackError) {
            // If class join also fails, try just selecting all columns - only fetch Active students
            console.warn('Class join failed, fetching students without joins.');
            const { data: simpleData, error: simpleError } = await supabase
              .from('students')
              .select('*')
              .eq('status', 'Active')
              .order('name');
            
            if (simpleError) {
              console.error('Error fetching students:', simpleError);
              throw new Error(simpleError.message);
            }
            
            // Map to add null values for missing fields
            return (simpleData || []).map((student: any) => ({
              ...student,
              current_class_id: student.current_class_id || null,
              current_class: null,
              transport_zone_id: null,
              transport_zone: null,
              transport_type_id: null,
              transport_type: null
            })) as TransportStudent[];
          }
          
          // Map to add null transport_zone_id and transport_zone if not present
          return (fallbackData || []).map((student: any) => ({
            ...student,
            transport_zone_id: student.transport_zone_id || null,
            transport_zone: student.transport_zone || null,
            transport_type_id: student.transport_type_id || null,
            transport_type: student.transport_type || null
          })) as TransportStudent[];
        }
        throw new Error(error.message);
      }
      
      // Ensure transport_zone_id, transport_zone, transport_type_id, and transport_type exist (might be null)
      return (data || []).map((student: any) => ({
        ...student,
        transport_zone_id: student.transport_zone_id || null,
        transport_zone: student.transport_zone || null,
        transport_type_id: student.transport_type_id || null,
        transport_type: student.transport_type || null
      })) as TransportStudent[];
    } catch (err: any) {
      console.error('Error fetching transport students:', err);
      // Return empty array on error to prevent component crash
      return [] as TransportStudent[];
    }
  };

  const fetchTransportZones = async () => {
    try {
      const { data, error } = await supabase
        .from('transport_zones')
        .select('*')
        .order('name');
      
      if (error) {
        // If table doesn't exist yet, return empty array
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          return [] as TransportZone[];
        }
        throw new Error(error.message);
      }
      
      return data as TransportZone[];
    } catch (err: any) {
      console.error('Error fetching transport zones:', err);
      // Return empty array on error to prevent component crash
      return [] as TransportZone[];
    }
  };

  const fetchTransportTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('transport_types')
        .select('id, name, sort_order')
        .order('sort_order', { ascending: true, nullsLast: true })
        .order('id', { ascending: true });
      
      if (error) {
        // If table doesn't exist yet, return empty array
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          return [] as TransportType[];
        }
        throw new Error(error.message);
      }
      
      return data as TransportType[];
    } catch (err: any) {
      console.error('Error fetching transport types:', err);
      // Return empty array on error to prevent component crash
      return [] as TransportType[];
    }
  };

  const fetchZoneAreas = async (zoneId: number) => {
    const { data, error } = await supabase
      .from('transport_zone_areas')
      .select('*')
      .eq('zone_id', zoneId)
      .order('name');
    if (error) {
      // If table doesn't exist yet, return empty array
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return [] as TransportZoneArea[];
      }
      throw new Error(error.message);
    }
    return data as TransportZoneArea[];
  };
  
  // React Query hooks - with error handling to prevent crashes
  const { data: transportStudents = [], isLoading: isLoadingStudents, error: studentsError } = useQuery({
    queryKey: ['transport_students'],
    queryFn: fetchTransportStudents,
    retry: false, // Don't retry on error to avoid spam
    staleTime: 30000 // Cache for 30 seconds
  });

  const { data: transportZones = [], isLoading: isLoadingZones, error: zonesError } = useQuery({
    queryKey: ['transport_zones'],
    queryFn: fetchTransportZones,
    retry: false, // Don't retry on error to avoid spam
    staleTime: 30000 // Cache for 30 seconds
  });

  const { data: transportTypes = [], isLoading: isLoadingTypes } = useQuery({
    queryKey: ['transport_types'],
    queryFn: fetchTransportTypes,
    retry: false,
    staleTime: 30000
  });

  const { data: classesList = [] } = useQuery({ 
    queryKey: ['classes'], 
    queryFn: fetchClasses 
  });

  // Filter students
  const filteredStudents = transportStudents.filter(student => {
    // Search filter
    if (studentSearchTerm) {
      const searchLower = studentSearchTerm.toLowerCase();
      if (!student.name.toLowerCase().includes(searchLower) && 
          !student.admission_number?.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    
    // Class filter
    if (appliedStudentFilters.class) {
      if (student.current_class_id !== parseInt(appliedStudentFilters.class)) {
        return false;
      }
    }
    
    // Zone filter
    if (appliedStudentFilters.zone) {
      const zoneId = parseInt(appliedStudentFilters.zone);
      if (appliedStudentFilters.zone === 'unassigned') {
        if (student.transport_zone_id !== null) return false;
      } else {
        if (student.transport_zone_id !== zoneId) return false;
      }
    }
    
    return true;
  });

  const hasActiveFilters = appliedStudentFilters.class !== '' || appliedStudentFilters.zone !== '';

  const handleApplyStudentFilters = () => {
    setAppliedStudentFilters({ ...studentFilters });
    setShowStudentFilterModal(false);
  };

  const handleClearStudentFilters = () => {
    setStudentFilters({ class: '', zone: '' });
    setAppliedStudentFilters({ class: '', zone: '' });
    setShowStudentFilterModal(false);
  };

  // Zone Areas List Component
  const ZoneAreasList: React.FC<{ zoneId: number }> = ({ zoneId }) => {
    const { data: areas = [], isLoading } = useQuery({
      queryKey: ['transport_zone_areas', zoneId],
      queryFn: () => fetchZoneAreas(zoneId)
    });

    const handleDeleteArea = async (areaId: number, areaName: string) => {
      if (confirm(`Are you sure you want to delete area "${areaName}"?`)) {
        const { error } = await supabase
          .from('transport_zone_areas')
          .delete()
          .eq('id', areaId);
        if (!error) {
          queryClient.invalidateQueries({ queryKey: ['transport_zone_areas', zoneId] });
        }
      }
    };

    if (isLoading) {
      return <div className="text-sm text-gray-500">Loading areas...</div>;
    }

    if (areas.length === 0) {
      return <div className="text-sm text-gray-500">No areas assigned to this zone.</div>;
    }

    return (
      <div className="space-y-2">
        {areas.map((area) => (
          <div key={area.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-900">{area.name}</div>
              {area.description && (
                <div className="text-xs text-gray-500">{area.description}</div>
              )}
            </div>
            <button
              onClick={() => handleDeleteArea(area.id, area.name)}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  // Sample data
  const trips: Trip[] = [
    {
      id: 1,
      tripType: 'morning',
      routeName: 'North Route',
      vehicleId: 'V001',
      vehicleNumber: 'BUS-001',
      driver: 'John Driver',
      departureTime: '07:00',
      arrivalTime: '08:15',
      locations: [
        { id: 1, name: 'Downtown Station', address: '123 Main St', pickupTime: '07:00', dropoffTime: '', order: 1 },
        { id: 2, name: 'Park Avenue', address: '456 Park Ave', pickupTime: '07:20', dropoffTime: '', order: 2 },
        { id: 3, name: 'School', address: '789 School Rd', pickupTime: '', dropoffTime: '08:15', order: 3 }
      ],
      students: [
        { id: 1, studentName: 'Emily Johnson', studentId: 'STU001', grade: 'Grade 8', pickupLocation: 'Downtown Station', dropoffLocation: 'School', contact: '+1 234-567-8901' },
        { id: 2, studentName: 'David Brown', studentId: 'STU003', grade: 'Grade 9', pickupLocation: 'Park Avenue', dropoffLocation: 'School', contact: '+1 234-567-8903' }
      ],
      status: 'active'
    },
    {
      id: 2,
      tripType: 'evening',
      routeName: 'South Route',
      vehicleId: 'V002',
      vehicleNumber: 'BUS-002',
      driver: 'Jane Driver',
      departureTime: '15:30',
      arrivalTime: '17:00',
      locations: [
        { id: 4, name: 'School', address: '789 School Rd', pickupTime: '15:30', dropoffTime: '', order: 1 },
        { id: 5, name: 'Mall Area', address: '321 Mall St', pickupTime: '', dropoffTime: '16:15', order: 2 },
        { id: 6, name: 'Residential Complex', address: '654 Res Ave', pickupTime: '', dropoffTime: '17:00', order: 3 }
      ],
      students: [
        { id: 3, studentName: 'Sarah Williams', studentId: 'STU002', grade: 'Grade 8', pickupLocation: 'School', dropoffLocation: 'Mall Area', contact: '+1 234-567-8902' }
      ],
      status: 'active'
    }
  ];

  const vehicles: Vehicle[] = [
    {
      id: 1,
      vehicleNumber: 'BUS-001',
      registrationNumber: 'REG-2024-001',
      make: 'Mercedes',
      model: 'Sprinter',
      year: 2022,
      capacity: 30,
      fleet: 'Main Fleet',
      status: 'active',
      lastMaintenanceDate: '2024-01-15',
      nextMaintenanceDate: '2024-04-15',
      complianceStatus: 'compliant'
    },
    {
      id: 2,
      vehicleNumber: 'BUS-002',
      registrationNumber: 'REG-2024-002',
      make: 'Toyota',
      model: 'Coaster',
      year: 2021,
      capacity: 25,
      fleet: 'Main Fleet',
      status: 'active',
      lastMaintenanceDate: '2024-02-01',
      nextMaintenanceDate: '2024-05-01',
      complianceStatus: 'compliant'
    },
    {
      id: 3,
      vehicleNumber: 'BUS-003',
      registrationNumber: 'REG-2024-003',
      make: 'Ford',
      model: 'Transit',
      year: 2020,
      capacity: 20,
      fleet: 'Secondary Fleet',
      status: 'maintenance',
      lastMaintenanceDate: '2024-01-20',
      nextMaintenanceDate: '2024-04-20',
      complianceStatus: 'pending'
    }
  ];

  const maintenanceRecords: MaintenanceRecord[] = [
    {
      id: 1,
      vehicleId: 'V001',
      vehicleNumber: 'BUS-001',
      maintenanceDate: '2024-01-15',
      maintenanceType: 'Regular Service',
      partsChanged: ['Engine Oil', 'Oil Filter', 'Air Filter'],
      cost: 250.00,
      performedBy: 'ABC Auto Service',
      location: 'Service Center A',
      comments: 'Vehicle in good condition',
      recommendations: 'Next service due in 3 months or 5000km',
      nextMaintenanceDate: '2024-04-15',
      nextMaintenanceType: 'Regular Service',
      status: 'completed'
    },
    {
      id: 2,
      vehicleId: 'V002',
      vehicleNumber: 'BUS-002',
      maintenanceDate: '2024-02-01',
      maintenanceType: 'Brake Inspection',
      partsChanged: ['Brake Pads'],
      cost: 180.00,
      performedBy: 'XYZ Garage',
      location: 'Service Center B',
      comments: 'Brake pads replaced, brakes working well',
      recommendations: 'Monitor brake performance, next inspection in 6 months',
      nextMaintenanceDate: '2024-05-01',
      nextMaintenanceType: 'Regular Service',
      status: 'completed'
    },
    {
      id: 3,
      vehicleId: 'V003',
      vehicleNumber: 'BUS-003',
      maintenanceDate: '2024-02-10',
      maintenanceType: 'Engine Repair',
      partsChanged: ['Spark Plugs', 'Battery'],
      cost: 450.00,
      performedBy: 'ABC Auto Service',
      location: 'Service Center A',
      comments: 'Engine running smoothly after repairs',
      recommendations: 'Schedule regular check-ups every month',
      nextMaintenanceDate: '2024-04-20',
      nextMaintenanceType: 'Regular Service',
      status: 'in-progress'
    }
  ];

  const complianceChecklists: ComplianceChecklist[] = [
    {
      id: 1,
      vehicleId: 'V001',
      vehicleNumber: 'BUS-001',
      regulationName: 'Safety Inspection',
      requirement: 'Valid safety certificate',
      status: 'compliant',
      checkedDate: '2024-01-10',
      checkedBy: 'Safety Inspector',
      notes: 'All safety requirements met'
    },
    {
      id: 2,
      vehicleId: 'V001',
      vehicleNumber: 'BUS-001',
      regulationName: 'Insurance',
      requirement: 'Valid insurance coverage',
      status: 'compliant',
      checkedDate: '2024-01-05',
      checkedBy: 'Admin Staff',
      notes: 'Insurance valid until Dec 2024'
    },
    {
      id: 3,
      vehicleId: 'V003',
      vehicleNumber: 'BUS-003',
      regulationName: 'Emission Standards',
      requirement: 'Emission test certificate',
      status: 'non-compliant',
      checkedDate: '2024-02-01',
      checkedBy: 'Environmental Officer',
      notes: 'Emission test expired, renewal required'
    }
  ];

  const regulations: GovernmentRegulation[] = [
    {
      id: 1,
      regulationName: 'School Bus Safety Standards',
      description: 'All school buses must meet minimum safety requirements including seat belts, emergency exits, and first aid kits',
      category: 'Safety',
      effectiveDate: '2024-01-01',
      expiryDate: null,
      isActive: true
    },
    {
      id: 2,
      regulationName: 'Driver Certification',
      description: 'All drivers must hold valid commercial driving license and pass background checks',
      category: 'Personnel',
      effectiveDate: '2024-01-01',
      expiryDate: null,
      isActive: true
    },
    {
      id: 3,
      regulationName: 'Emission Standards',
      description: 'Vehicles must pass annual emission tests and meet environmental standards',
      category: 'Environmental',
      effectiveDate: '2024-01-01',
      expiryDate: '2024-12-31',
      isActive: true
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800',
      'maintenance': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'scheduled': 'bg-purple-100 text-purple-800',
      'compliant': 'bg-green-100 text-green-800',
      'non-compliant': 'bg-red-100 text-red-800',
      'pending': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const activeTrips = trips.filter(t => t.status === 'active').length;
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  // Count active students who have been assigned a zone (commuting students)
  const commutingStudents = (transportStudents || []).filter(s => s.transport_zone_id !== null && s.transport_zone_id !== undefined).length;
  const upcomingMaintenance = vehicles.filter(v => {
    const nextDate = new Date(v.nextMaintenanceDate);
    const today = new Date();
    const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 30 && daysUntil >= 0;
  }).length;
  const nonCompliantVehicles = vehicles.filter(v => v.complianceStatus === 'non-compliant').length;

  const TripForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Schedule New Trip</h2>
          <button
            onClick={() => setShowForm(false)}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trip Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="p-4 border-2 rounded-lg flex items-center justify-center space-x-2 border-blue-500 bg-blue-50"
                >
                  <Sun className="w-5 h-5 text-orange-600" />
                  <span className="font-medium">Morning</span>
                </button>
                <button
                  type="button"
                  className="p-4 border-2 rounded-lg flex items-center justify-center space-x-2 border-gray-300 hover:border-gray-400"
                >
                  <Moon className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Evening</span>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Route Name</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="North Route"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
              <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Select vehicle...</option>
                {vehicles.filter(v => v.status === 'active').map(v => (
                  <option key={v.id}>{v.vehicleNumber} - {v.make} {v.model}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Driver"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Departure Time</label>
              <input
                type="time"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Time</label>
              <input
                type="time"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Locations</label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Location name"
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Address"
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="time"
                  placeholder="Time"
                  className="w-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button type="button" className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Students</label>
            <div className="border border-gray-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">Select students to add to this trip</span>
                <button type="button" className="text-blue-600 hover:text-blue-700 text-sm">
                  <Plus className="w-4 h-4 inline mr-1" />
                  Add Student
                </button>
              </div>
              <div className="text-sm text-gray-500">No students added yet</div>
            </div>
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
              Create Trip
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
              <Route className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Active Trips</div>
                <div className="text-2xl font-bold text-gray-800">{activeTrips}</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Bus className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Active Vehicles</div>
                <div className="text-2xl font-bold text-green-600">{activeVehicles}</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Commuting Students</div>
                <div className="text-2xl font-bold text-purple-600">{commutingStudents}</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <AlertCircle className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Upcoming Maintenance</div>
                <div className="text-2xl font-bold text-orange-600">{upcomingMaintenance}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 md:mb-3">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              {[
                { id: 'students', label: 'Students', icon: Users },
                { id: 'zones', label: 'Zones', icon: MapPin },
                { id: 'trips', label: 'Trips', icon: Route },
                { id: 'vehicles', label: 'Vehicles', icon: Car },
                { id: 'maintenance', label: 'Maintenance', icon: Wrench },
                { id: 'compliance', label: 'Compliance', icon: FileCheck },
                { id: 'regulations', label: 'Regulations', icon: CheckCircle }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {activeTab === 'students' && (
            <div>
              {/* Search, Filter, and Add Student Button */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button 
                    onClick={() => setShowStudentFilterModal(true)}
                    className={`flex-shrink-0 flex items-center justify-center p-2 md:px-4 md:py-2 border rounded-lg transition-colors relative ${
                      hasActiveFilters 
                        ? 'border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Filter className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline">Filters</span>
                    {hasActiveFilters && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full"></span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setBatchFilterClass('');
                      setBatchFilterZone('');
                      setSelectedStudentsForBatch(new Set());
                      setBatchAssignZoneId('');
                      setShowBatchAssignModal(true);
                    }}
                    className="flex-shrink-0 bg-blue-600 text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5 md:mr-2" />
                    <span className="hidden md:inline">Assign Zone</span>
                  </button>
                </div>
              </div>

              {/* Students Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Admission Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Class
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Zone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {studentsError ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center">
                          <div className="text-red-600 mb-2">
                            <AlertCircle className="w-5 h-5 mx-auto mb-2" />
                            <p className="font-semibold">Failed to load students</p>
                            <p className="text-sm text-gray-600 mt-1">
                              Please run the database migration first. Check the console for details.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : isLoadingStudents ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          Loading students...
                        </td>
                      </tr>
                    ) : filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          No students found
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student, index) => (
                        <tr key={student.admission_number || student.id || index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">{student.admission_number || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {student.current_class?.name || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {student.transport_zone?.name || 'Unassigned'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {student.transport_type?.name || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <button 
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                onClick={() => {
                                  setSelectedStudentForEdit(student);
                                  // Initialize with current zone or empty (same pattern as batch)
                                  setIndividualAssignZoneId(
                                    student.transport_zone_id 
                                      ? student.transport_zone_id.toString() 
                                      : ''
                                  );
                                  // Initialize with current type or empty
                                  setIndividualAssignTypeId(
                                    student.transport_type_id 
                                      ? student.transport_type_id.toString() 
                                      : ''
                                  );
                                  setShowIndividualAssignModal(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'zones' && (
            <div>
              {/* Search and Add Zone Button */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search zones..."
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => {
                    setSelectedZone(null);
                    setShowZoneForm(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Zone</span>
                </button>
              </div>

              {/* Zones List */}
              <div className="space-y-4">
                {zonesError ? (
                  <div className="text-center py-8">
                    <div className="text-red-600 mb-2">
                      <AlertCircle className="w-5 h-5 mx-auto mb-2" />
                      <p className="font-semibold">Failed to load zones</p>
                      <p className="text-sm text-gray-600 mt-1">
                        The transport_zones table doesn't exist yet. Please run the database migration first.
                      </p>
                    </div>
                  </div>
                ) : isLoadingZones ? (
                  <div className="text-center text-gray-500 py-8">Loading zones...</div>
                ) : transportZones.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">No zones found. Create your first zone!</div>
                ) : (
                  transportZones.map((zone) => (
                    <div key={zone.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{zone.name}</h3>
                          {zone.description && (
                            <p className="text-sm text-gray-600 mt-1">{zone.description}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button 
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            onClick={() => {
                              setSelectedZone(zone);
                              setShowZoneForm(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            onClick={async () => {
                              if (confirm(`Are you sure you want to delete zone "${zone.name}"?`)) {
                                // TODO: Implement delete zone
                                const { error } = await supabase
                                  .from('transport_zones')
                                  .delete()
                                  .eq('id', zone.id);
                                if (!error) {
                                  queryClient.invalidateQueries({ queryKey: ['transport_zones'] });
                                }
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-gray-700">Areas</h4>
                          <button
                            onClick={() => {
                              setSelectedZoneForArea(zone.id);
                              setShowAreaForm(true);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Area</span>
                          </button>
                        </div>
                        <ZoneAreasList zoneId={zone.id} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'trips' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search trips..."
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => {
                    setFormType('trip');
                    setShowForm(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Schedule Trip</span>
                </button>
              </div>

              <div className="space-y-4">
                {trips.map((trip) => (
                  <div key={trip.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          {trip.tripType === 'morning' ? (
                            <Sun className="w-5 h-5 text-orange-600" />
                          ) : (
                            <Moon className="w-5 h-5 text-blue-600" />
                          )}
                          <h3 className="text-lg font-semibold text-gray-900">{trip.routeName}</h3>
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                            {trip.tripType}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Vehicle:</span> {trip.vehicleNumber} | 
                          <span className="font-medium ml-2">Driver:</span> {trip.driver} |
                          <span className="font-medium ml-2">Time:</span> {trip.departureTime} - {trip.arrivalTime}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          Locations ({trip.locations.length})
                        </h4>
                        <div className="space-y-1">
                          {trip.locations.map((loc, idx) => (
                            <div key={loc.id} className="text-xs text-gray-600 flex items-center space-x-2">
                              <span className="font-medium">{idx + 1}.</span>
                              <span>{loc.name}</span>
                              {loc.pickupTime && <span className="text-blue-600">Pickup: {loc.pickupTime}</span>}
                              {loc.dropoffTime && <span className="text-green-600">Dropoff: {loc.dropoffTime}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          Students ({trip.students.length})
                        </h4>
                        <div className="space-y-1">
                          {trip.students.map((student) => (
                            <div key={student.id} className="text-xs text-gray-600">
                              {student.studentName} ({student.grade}) - {student.pickupLocation} → {student.dropoffLocation}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'vehicles' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search vehicles..."
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => {
                    setFormType('vehicle');
                    setShowForm(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Vehicle</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fleet</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Maintenance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Maintenance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compliance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {vehicles.map((vehicle) => (
                      <tr key={vehicle.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{vehicle.vehicleNumber}</div>
                          <div className="text-xs text-gray-500">{vehicle.make} {vehicle.model} ({vehicle.year})</div>
                          <div className="text-xs text-gray-400">{vehicle.registrationNumber}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{vehicle.fleet}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{vehicle.capacity} seats</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(vehicle.lastMaintenanceDate)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            {formatDate(vehicle.nextMaintenanceDate)}
                            {new Date(vehicle.nextMaintenanceDate) <= new Date(new Date().setDate(new Date().getDate() + 30)) && (
                              <AlertCircle className="w-4 h-4 text-orange-600 ml-2" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vehicle.status)} capitalize`}>
                            {vehicle.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vehicle.complianceStatus)} capitalize`}>
                            {vehicle.complianceStatus.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
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

          {activeTab === 'maintenance' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search maintenance records..."
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => {
                    setFormType('maintenance');
                    setShowForm(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Record Maintenance</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parts Changed</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performed By</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Maintenance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {maintenanceRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.vehicleNumber}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(record.maintenanceDate)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{record.maintenanceType}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {record.partsChanged.map((part, idx) => (
                              <span key={idx} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                {part}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{record.performedBy}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">${record.cost.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(record.nextMaintenanceDate)}
                          <div className="text-xs text-gray-500">{record.nextMaintenanceType}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)} capitalize`}>
                            {record.status.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
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

          {activeTab === 'compliance' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search compliance records..."
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => {
                    setFormType('compliance');
                    setShowForm(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Compliance Check</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Regulation</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requirement</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Checked Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Checked By</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {complianceChecklists.map((check) => (
                      <tr key={check.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{check.vehicleNumber}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{check.regulationName}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{check.requirement}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(check.status)} capitalize`}>
                            {check.status.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(check.checkedDate)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{check.checkedBy}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{check.notes || '-'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
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

          {activeTab === 'regulations' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search regulations..."
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => {
                    setFormType('regulation');
                    setShowForm(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Regulation</span>
                </button>
              </div>

              <div className="space-y-4">
                {regulations.map((regulation) => (
                  <div key={regulation.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{regulation.regulationName}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            {regulation.category}
                          </span>
                          {regulation.isActive ? (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{regulation.description}</p>
                    <div className="text-xs text-gray-500">
                      <span>Effective: {formatDate(regulation.effectiveDate)}</span>
                      {regulation.expiryDate && (
                        <span className="ml-4">Expires: {formatDate(regulation.expiryDate)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {showForm && formType === 'trip' && <TripForm />}
        {showStudentFilterModal && (
          <StudentFilterModal />
        )}
        {showZoneForm && (
          <ZoneFormModal />
        )}
        {showAreaForm && (
          <AreaFormModal />
        )}
        {showBatchAssignModal && (
          <BatchZoneAssignModal />
        )}
        {showIndividualAssignModal && (
          <IndividualZoneAssignModal />
        )}
        {showTransportTypesModal && (
          <OptionsModal
            title="Transport Types"
            items={transportTypes}
            onAdd={async (name: string) => {
              // Get the max sort_order and add 1
              const { data: maxData } = await supabase
                .from('transport_types')
                .select('sort_order')
                .order('sort_order', { ascending: false, nullsFirst: false })
                .limit(1);
              
              const nextOrder = maxData && maxData.length > 0 && maxData[0].sort_order !== null 
                ? maxData[0].sort_order + 1 
                : 0;
              
              const { error } = await supabase.from('transport_types').insert({ name, sort_order: nextOrder });
              if (error) throw new Error(error.message);
            }}
            onDelete={async (id: number) => {
              const { error } = await supabase.from('transport_types').delete().eq('id', id);
              if (error) throw new Error(error.message);
            }}
            onClose={() => setShowTransportTypesModal(false)}
            tableName="transport_types"
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ['transport_types'] })}
          />
        )}
      </div>
    </div>
  );

  // Student Filter Modal Component
  function StudentFilterModal() {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Filter Students</h3>
            <button
              onClick={() => setShowStudentFilterModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Content */}
          <div className="p-6 space-y-6">
            {/* Class Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class
              </label>
              <select
                value={studentFilters.class}
                onChange={(e) => setStudentFilters({ ...studentFilters, class: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Classes</option>
                {classesList.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Zone Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zone
              </label>
              <select
                value={studentFilters.zone}
                onChange={(e) => setStudentFilters({ ...studentFilters, zone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Zones</option>
                <option value="unassigned">Unassigned</option>
                {transportZones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={handleClearStudentFilters}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={() => setShowStudentFilterModal(false)}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyStudentFilters}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Zone Form Modal Component
  function ZoneFormModal() {
    const [zoneName, setZoneName] = useState(selectedZone?.name || '');
    const [zoneDescription, setZoneDescription] = useState(selectedZone?.description || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
      if (selectedZone) {
        setZoneName(selectedZone.name);
        setZoneDescription(selectedZone.description || '');
      } else {
        setZoneName('');
        setZoneDescription('');
      }
    }, [selectedZone]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      try {
        if (selectedZone) {
          // Update existing zone
          const { error } = await supabase
            .from('transport_zones')
            .update({
              name: zoneName,
              description: zoneDescription || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', selectedZone.id);
          
          if (error) throw error;
        } else {
          // Create new zone
          const { error } = await supabase
            .from('transport_zones')
            .insert({
              name: zoneName,
              description: zoneDescription || null
            });
          
          if (error) throw error;
        }

        queryClient.invalidateQueries({ queryKey: ['transport_zones'] });
        setShowZoneForm(false);
        setSelectedZone(null);
        setZoneName('');
        setZoneDescription('');
      } catch (error) {
        console.error('Error saving zone:', error);
        alert('Failed to save zone. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              {selectedZone ? 'Edit Zone' : 'Add Zone'}
            </h3>
            <button
              onClick={() => {
                setShowZoneForm(false);
                setSelectedZone(null);
                setZoneName('');
                setZoneDescription('');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zone Name *
              </label>
              <input
                type="text"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={zoneDescription}
                onChange={(e) => setZoneDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowZoneForm(false);
                  setSelectedZone(null);
                  setZoneName('');
                  setZoneDescription('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : selectedZone ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Area Form Modal Component
  function AreaFormModal() {
    const [areaName, setAreaName] = useState('');
    const [areaDescription, setAreaDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedZoneForArea) return;

      setIsSubmitting(true);

      try {
        const { error } = await supabase
          .from('transport_zone_areas')
          .insert({
            zone_id: selectedZoneForArea,
            name: areaName,
            description: areaDescription || null
          });
        
        if (error) throw error;

        queryClient.invalidateQueries({ queryKey: ['transport_zone_areas', selectedZoneForArea] });
        setShowAreaForm(false);
        setSelectedZoneForArea(null);
        setAreaName('');
        setAreaDescription('');
      } catch (error) {
        console.error('Error saving area:', error);
        alert('Failed to save area. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Add Area</h3>
            <button
              onClick={() => {
                setShowAreaForm(false);
                setSelectedZoneForArea(null);
                setAreaName('');
                setAreaDescription('');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Area Name *
              </label>
              <input
                type="text"
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={areaDescription}
                onChange={(e) => setAreaDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowAreaForm(false);
                  setSelectedZoneForArea(null);
                  setAreaName('');
                  setAreaDescription('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Batch Zone Assignment Modal Component
  function BatchZoneAssignModal() {
    // Filter students based on batch filters
    const batchFilteredStudents = transportStudents.filter(student => {
      // Class filter
      if (batchFilterClass) {
        if (student.current_class_id !== parseInt(batchFilterClass)) {
          return false;
        }
      }
      
      // Zone filter
      if (batchFilterZone) {
        if (batchFilterZone === 'unassigned') {
          if (student.transport_zone_id !== null) return false;
        } else {
          if (student.transport_zone_id !== parseInt(batchFilterZone)) return false;
        }
      }
      
      return true;
    });

    const toggleStudentSelection = (admissionNumber: string) => {
      setSelectedStudentsForBatch(prev => {
        const newSet = new Set(prev);
        if (newSet.has(admissionNumber)) {
          newSet.delete(admissionNumber);
        } else {
          newSet.add(admissionNumber);
        }
        return newSet;
      });
    };

    const selectAll = () => {
      setSelectedStudentsForBatch(new Set(batchFilteredStudents.map(s => s.admission_number)));
    };

    const clearSelection = () => {
      setSelectedStudentsForBatch(new Set());
    };

    const handleBatchAssign = async () => {
      if (selectedStudentsForBatch.size === 0) {
        alert('Please select at least one student.');
        return;
      }

      if (!batchAssignZoneId) {
        alert('Please select a zone to assign.');
        return;
      }

      setIsAssigning(true);

      try {
        const zoneId = batchAssignZoneId === 'unassign' ? null : parseInt(batchAssignZoneId);
        const admissionNumbers = Array.from(selectedStudentsForBatch);

        console.log('Batch assigning zone:', { zoneId, admissionNumbers });

        // Get "Two Way" transport type ID for default assignment
        let defaultTypeId: number | null = null;
        if (zoneId !== null) {
          // Only set default type if a zone is being assigned (not unassigning)
          const { data: twoWayType } = await supabase
            .from('transport_types')
            .select('id')
            .eq('name', 'Two Way')
            .single();
          
          if (twoWayType) {
            defaultTypeId = twoWayType.id;
          }
        }

        // First, update all selected students with zone assignment
        const updateData: any = { transport_zone_id: zoneId };
        if (zoneId === null) {
          // If unassigning zone, also clear type
          updateData.transport_type_id = null;
        }

        const { data, error, count } = await supabase
          .from('students')
          .update(updateData)
          .in('admission_number', admissionNumbers)
          .select();

        // If zone is assigned, update students without a type to have "Two Way" as default
        if (zoneId !== null && defaultTypeId !== null && data) {
          // Find students that were updated but don't have a type
          const studentsWithoutType = data.filter((s: any) => !s.transport_type_id);
          if (studentsWithoutType.length > 0) {
            const admissionNumbersWithoutType = studentsWithoutType.map((s: any) => s.admission_number);
            await supabase
              .from('students')
              .update({ transport_type_id: defaultTypeId })
              .in('admission_number', admissionNumbersWithoutType)
              .is('transport_type_id', null);
          }
        }

        console.log('Batch update response:', { data, error, count });

        if (error) {
          console.error('Batch update error:', error);
          throw error;
        }

        // Check if any rows were actually updated
        if (!data || data.length === 0) {
          throw new Error('No students were updated. Please check if the admission numbers are correct.');
        }

        // Invalidate and refetch queries to refresh the data immediately
        await queryClient.invalidateQueries({ queryKey: ['transport_students'] });
        await queryClient.refetchQueries({ queryKey: ['transport_students'] });
        
        alert(`Successfully assigned zone to ${data.length} student(s).`);
        
        // Reset and close
        setSelectedStudentsForBatch(new Set());
        setBatchAssignZoneId('');
        setBatchFilterClass('');
        setBatchFilterZone('');
        setShowBatchAssignModal(false);
      } catch (error: any) {
        console.error('Error assigning zones:', error);
        alert(`Failed to assign zones: ${error.message || 'Unknown error occurred'}`);
      } finally {
        setIsAssigning(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Batch Zone Assignment</h3>
            <button
              onClick={() => {
                setShowBatchAssignModal(false);
                setSelectedStudentsForBatch(new Set());
                setBatchAssignZoneId('');
                setBatchFilterClass('');
                setBatchFilterZone('');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Class
                </label>
                <select
                  value={batchFilterClass}
                  onChange={(e) => setBatchFilterClass(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Classes</option>
                  {classesList.map((cls: any) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Zone Status
                </label>
                <select
                  value={batchFilterZone}
                  onChange={(e) => setBatchFilterZone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Zones</option>
                  <option value="unassigned">Unassigned</option>
                  {transportZones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Zone Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign to Zone *
              </label>
              <select
                value={batchAssignZoneId}
                onChange={(e) => setBatchAssignZoneId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Zone...</option>
                <option value="unassign">Unassign (Remove Zone)</option>
                {transportZones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Selection Controls */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedStudentsForBatch.size} of {batchFilteredStudents.length} selected
              </div>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  Select All
                </button>
                <button
                  onClick={clearSelection}
                  className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Students List */}
            <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
              {batchFilteredStudents.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No students match the selected filters.
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {batchFilteredStudents.map((student) => {
                    const isSelected = selectedStudentsForBatch.has(student.admission_number);
                    return (
                      <div
                        key={student.admission_number || student.id}
                        onClick={() => toggleStudentSelection(student.admission_number)}
                        className={`p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between ${
                          isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                      >
                        <div>
                          <div className="font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-600">
                            {student.admission_number} | {student.current_class?.name || '-'} | 
                            Zone: {student.transport_zone?.name || 'Unassigned'}
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={() => {
                setShowBatchAssignModal(false);
                setSelectedStudentsForBatch(new Set());
                setBatchAssignZoneId('');
                setBatchFilterClass('');
                setBatchFilterZone('');
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleBatchAssign}
              disabled={isAssigning || selectedStudentsForBatch.size === 0 || !batchAssignZoneId}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAssigning ? 'Assigning...' : `Assign to ${selectedStudentsForBatch.size} Student(s)`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Individual Zone Assignment Modal Component
  function IndividualZoneAssignModal() {
    const handleIndividualAssign = async () => {
      if (!selectedStudentForEdit) {
        alert('No student selected.');
        return;
      }

      if (!individualAssignZoneId) {
        alert('Please select a zone to assign.');
        return;
      }

      setIsUpdating(true);

      try {
        // Use the exact same logic as batch assignment
        const zoneId = individualAssignZoneId === 'unassign' ? null : parseInt(individualAssignZoneId);
        let typeId = individualAssignTypeId ? parseInt(individualAssignTypeId) : null;
        const admissionNumber = selectedStudentForEdit.admission_number;

        // If zone is assigned but type is not set, default to "Two Way"
        if (zoneId !== null && typeId === null) {
          const { data: twoWayType } = await supabase
            .from('transport_types')
            .select('id')
            .eq('name', 'Two Way')
            .single();
          
          if (twoWayType) {
            typeId = twoWayType.id;
          }
        } else if (zoneId === null) {
          // If unassigning zone, also clear type
          typeId = null;
        }

        console.log('Individual assigning zone and type:', { zoneId, typeId, admissionNumber });

        // Update student - use select() to get response data (same as batch)
        const { data, error, count } = await supabase
          .from('students')
          .update({ 
            transport_zone_id: zoneId,
            transport_type_id: typeId
          })
          .eq('admission_number', admissionNumber)
          .select();

        console.log('Individual update response:', { data, error, count });

        if (error) {
          console.error('Individual update error:', error);
          throw error;
        }

        // Check if any rows were actually updated (same as batch)
        if (!data || data.length === 0) {
          throw new Error('Student was not updated. Please check if the admission number is correct.');
        }

        // Invalidate and refetch queries to refresh the data immediately (same as batch)
        await queryClient.invalidateQueries({ queryKey: ['transport_students'] });
        await queryClient.refetchQueries({ queryKey: ['transport_students'] });
        
        alert(`Successfully assigned zone to student.`);
        
        // Reset and close (same as batch)
        setSelectedStudentForEdit(null);
        setIndividualAssignZoneId('');
        setIndividualAssignTypeId('');
        setShowIndividualAssignModal(false);
      } catch (error: any) {
        console.error('Error assigning zone:', error);
        alert(`Failed to assign zone: ${error.message || 'Unknown error occurred'}`);
      } finally {
        setIsUpdating(false);
      }
    };

    if (!selectedStudentForEdit) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Assign Zone</h3>
            <button
              onClick={() => {
                setShowIndividualAssignModal(false);
                setSelectedStudentForEdit(null);
                setIndividualAssignZoneId('');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Student Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="font-medium text-gray-900">{selectedStudentForEdit.name}</div>
              <div className="text-sm text-gray-600 mt-1">
                {selectedStudentForEdit.admission_number} | {selectedStudentForEdit.current_class?.name || '-'}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Current Zone: <span className="font-medium">{selectedStudentForEdit.transport_zone?.name || 'Unassigned'}</span>
              </div>
            </div>

            {/* Zone Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign to Zone *
              </label>
              <select
                value={individualAssignZoneId}
                onChange={(e) => setIndividualAssignZoneId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Zone...</option>
                <option value="unassign">Unassign (Remove Zone)</option>
                {transportZones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Selection */}
            <DropdownField
              name="transport_type_id"
              label="Type"
              items={transportTypes}
              selectedId={individualAssignTypeId ? parseInt(individualAssignTypeId) : undefined}
              clearIfInvalid={() => {}}
              onOpenModal={() => setShowTransportTypesModal(true)}
              onSelect={(id) => setIndividualAssignTypeId(id ? id.toString() : '')}
              tableName="transport_types"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={() => {
                setShowIndividualAssignModal(false);
                setSelectedStudentForEdit(null);
                setIndividualAssignZoneId('');
                setIndividualAssignTypeId('');
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleIndividualAssign}
              disabled={isUpdating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isUpdating ? 'Updating...' : 'Update'}
            </button>
          </div>
        </div>
      </div>
    );
  }
};

