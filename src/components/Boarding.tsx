import React, { useState } from 'react';
import { Plus, Search, Filter, Bed, Users, Home, Wrench, UtensilsCrossed, UserCheck, Calendar, Edit, Trash2, CheckCircle, AlertCircle, Clock, Key, MapPin, Building2, User, Eye, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { fetchClasses } from '../api/tables';

type RoomStatus = 'fully-occupied' | 'partially-occupied' | 'vacant' | 'maintenance' | 'reserved';
type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';
type MaintenanceStatus = 'pending' | 'in-progress' | 'completed';

interface Room {
  id: number;
  room_number: string;
  house_id: number;
  floor: number;
  capacity: number;
  current_occupancy: number;
  status: RoomStatus;
  house?: { name: string };
  amenities?: string[];
  [key: string]: any; // For flexibility with database responses
}

interface BoardingStudent {
  id?: number;
  admission_number: string;
  name: string;
  current_class_id?: number;
  boarding_house_id?: number;
  boarding_room_id?: number;
  accommodation_type_id?: number;
  check_in_date?: string;
  check_out_date?: string | null;
  emergency_contact?: string;
  current_class?: { name: string };
  boarding_house?: { name: string };
  boarding_room?: { room_number: string };
  accommodation_type?: { name: string };
  roommates?: string[];
  [key: string]: any; // For flexibility with database responses
}

interface MaintenanceRequest {
  id: number;
  roomNumber: string;
  building: string;
  issue: string;
  reportedBy: string;
  reportedDate: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  assignedTo: string;
  completedDate: string | null;
}

interface Visitor {
  id: number;
  visitorName: string;
  studentName: string;
  roomNumber: string;
  visitDate: string;
  visitTime: string;
  purpose: string;
  checkedIn: boolean;
  checkedOut: boolean;
}

interface HousePersonnel {
  id: number;
  name: string;
  designation: string;
}

interface AccommodationType {
  id: number;
  name: string;
  description?: string;
}

interface House {
  id: number;
  name: string;
  designation: string; // e.g., "Boys House", "Girls House", "Grade 8 Boys", "Stream A"
  description: string | null;
  total_rooms: number;
  total_capacity: number;
  current_occupancy: number;
  amenities?: string[];
  personnel?: HousePersonnel[];
}

export const Boarding: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'houses' | 'rooms' | 'students' | 'maintenance' | 'visitors'>('houses');
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'room' | 'student' | 'maintenance' | 'visitor'>('room');
  const [showRoomsList, setShowRoomsList] = useState(false);
  const [selectedHouseForRooms, setSelectedHouseForRooms] = useState<House | null>(null);
  
  // House form state
  const [showHouseForm, setShowHouseForm] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [houseFormData, setHouseFormData] = useState({
    name: '',
    designation: '',
    description: '',
    personnel: [] as { name: string; designation: string }[],
    amenities: [] as string[]
  });
  
  // Room form state
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [roomFormData, setRoomFormData] = useState({
    house_id: '',
    room_number: '',
    floor: 1,
    capacity: 1,
    status: 'vacant' as RoomStatus,
    amenities: [] as string[]
  });
  
  // Student assignment state
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<BoardingStudent | null>(null);
  const [studentFormData, setStudentFormData] = useState({
    student_id: '',
    house_id: '',
    room_id: '',
    accommodation_type_id: '',
    check_in_date: '',
    emergency_contact: ''
  });
  
  // Accommodation types management
  const [showAccommodationTypesModal, setShowAccommodationTypesModal] = useState(false);
  const [newAccommodationType, setNewAccommodationType] = useState('');

  // Fetch functions
  const fetchBoardingHouses = async () => {
    try {
      // Fetch houses with personnel and amenities
      const { data: housesData, error: housesError } = await supabase
        .from('boarding_houses')
        .select('*')
        .order('name');

      if (housesError) {
        if (housesError.code === 'PGRST116' || housesError.message?.includes('relation') || housesError.message?.includes('does not exist')) {
          return [] as House[];
        }
        throw housesError;
      }

      if (!housesData || housesData.length === 0) {
        return [] as House[];
      }

      // Fetch personnel, amenities, and calculate stats for each house
      console.log('[fetchBoardingHouses] Processing', housesData.length, 'houses...');
      const housesWithDetails = await Promise.all(
        housesData.map(async (house) => {
          console.log(`[fetchBoardingHouses] Processing house ${house.id} (${house.name})...`);
          // Fetch personnel
          const { data: personnelData } = await supabase
            .from('boarding_house_personnel')
            .select('*')
            .eq('house_id', house.id)
            .order('name');

          // Fetch amenities
          const { data: amenitiesData } = await supabase
            .from('boarding_house_amenities')
            .select('name')
            .eq('house_id', house.id)
            .order('name');

          // Count rooms in this house
          const { data: roomsData } = await supabase
            .from('boarding_rooms')
            .select('id, capacity')
            .eq('house_id', house.id);

          const totalRooms = roomsData?.length || 0;
          const totalCapacity = roomsData?.reduce((sum, room) => sum + (room.capacity || 0), 0) || 0;

          // Count active students assigned to rooms in this house
          // IMPORTANT: Count by boarding_room_id pointing to rooms in this house, not by boarding_house_id
          console.log(`[fetchBoardingHouses] Counting active students for house ${house.id} (${house.name})...`);
          let activeStudentsCount = 0;
          try {
            // Get all room IDs for this house
            const roomIds = roomsData?.map(r => r.id) || [];
            console.log(`[fetchBoardingHouses] House ${house.id} has ${roomIds.length} rooms:`, roomIds);
            
            if (roomIds.length === 0) {
              console.log(`[fetchBoardingHouses] No rooms in house ${house.id}, occupancy is 0`);
              activeStudentsCount = 0;
            } else {
              // Get all active students with room assignments
              const { data: activeStudentsData, error: houseCountError } = await supabase
              .from('students')
              .select('admission_number, boarding_room_id, status')
              .eq('status', 'Active')
              .not('boarding_room_id', 'is', null);
              
              if (houseCountError) {
                console.error(`[fetchBoardingHouses] Error fetching students for house ${house.id}:`, houseCountError);
                console.error(`[fetchBoardingHouses] Full error object:`, JSON.stringify(houseCountError, null, 2));
                console.error(`[fetchBoardingHouses] Error code:`, houseCountError.code);
                console.error(`[fetchBoardingHouses] Error message:`, houseCountError.message);
                console.error(`[fetchBoardingHouses] Error details:`, houseCountError.details);
                console.error(`[fetchBoardingHouses] Error hint:`, houseCountError.hint);
                console.warn(`[fetchBoardingHouses] Setting occupancy to 0 for house ${house.id} due to error`);
                activeStudentsCount = 0;
              } else {
                // Filter students whose boarding_room_id is in this house's rooms
                const studentsInHouse = activeStudentsData?.filter(s => 
                  s.boarding_room_id && roomIds.includes(s.boarding_room_id)
                ) || [];
                activeStudentsCount = studentsInHouse.length;
                console.log(`[fetchBoardingHouses] Found ${activeStudentsCount} active students in house ${house.id}`);
                console.log(`[fetchBoardingHouses] Students in house ${house.id}:`, studentsInHouse.map(s => ({
                  admission_number: s.admission_number,
                  room_id: s.boarding_room_id
                })));
              }
            }
          } catch (err: any) {
            console.error(`[fetchBoardingHouses] Exception while counting students in house ${house.id}:`, err);
            console.error(`[fetchBoardingHouses] Exception details:`, JSON.stringify(err, null, 2));
            activeStudentsCount = 0;
          }

          const currentOccupancy = activeStudentsCount || 0;
          console.log(`[fetchBoardingHouses] Final occupancy for house ${house.id} (${house.name}): ${currentOccupancy}`);

          return {
            ...house,
            total_rooms: totalRooms || 0,
            total_capacity: totalCapacity,
            current_occupancy: currentOccupancy,
            amenities: amenitiesData?.map(a => a.name) || [],
            personnel: personnelData || []
          } as House;
        })
      );

      return housesWithDetails;
    } catch (err: any) {
      console.error('Error fetching boarding houses:', err);
      return [] as House[];
    }
  };

  const fetchBoardingRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('boarding_rooms')
        .select(`
          *,
          house:boarding_houses!house_id(name)
        `)
        .order('room_number');

      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          return [] as Room[];
        }
        throw error;
      }

      if (!data || data.length === 0) {
        return [] as Room[];
      }

      // Fetch amenities and recalculate occupancy for each room
      const roomsWithAmenities = await Promise.all(
        data.map(async (room) => {
          // Fetch amenities
          const { data: amenitiesData } = await supabase
            .from('boarding_room_amenities')
            .select('name')
            .eq('room_id', room.id)
            .order('name');

          // Count active students in this room
          console.log(`[fetchBoardingRooms] Counting active students for room ${room.id} (${room.room_number})...`);
          let activeStudentsCount = 0;
          try {
            // Get all active students assigned to this room
            const { data: activeStudentsData, error: roomCountError } = await supabase
              .from('students')
              .select('admission_number, boarding_room_id, status')
              .eq('status', 'Active')
              .eq('boarding_room_id', room.id);
            
            if (roomCountError) {
              console.error(`[fetchBoardingRooms] Error fetching students for room ${room.id}:`, roomCountError);
              console.error(`[fetchBoardingRooms] Full error object:`, JSON.stringify(roomCountError, null, 2));
              console.error(`[fetchBoardingRooms] Error code:`, roomCountError.code);
              console.error(`[fetchBoardingRooms] Error message:`, roomCountError.message);
              console.error(`[fetchBoardingRooms] Error details:`, roomCountError.details);
              console.error(`[fetchBoardingRooms] Error hint:`, roomCountError.hint);
              // Fallback: try manual filter approach
              console.warn(`[fetchBoardingRooms] Trying fallback: fetching all active students...`);
              const { data: allActiveStudents } = await supabase
                .from('students')
                .select('admission_number, boarding_room_id, status')
                .eq('status', 'Active');
              
              if (allActiveStudents) {
                const studentsInRoom = allActiveStudents.filter(s => s.boarding_room_id === room.id) || [];
                activeStudentsCount = studentsInRoom.length;
                console.log(`[fetchBoardingRooms] Found ${activeStudentsCount} active students in room ${room.id} (fallback filter)`);
                console.log(`[fetchBoardingRooms] Students in room ${room.id}:`, studentsInRoom.map(s => ({
                  admission_number: s.admission_number,
                  room_id: s.boarding_room_id
                })));
              } else {
                activeStudentsCount = room.current_occupancy ?? 0;
                console.warn(`[fetchBoardingRooms] Using stored occupancy for room ${room.id}:`, activeStudentsCount);
              }
            } else {
              // Count students directly from query result
              activeStudentsCount = activeStudentsData?.length || 0;
              console.log(`[fetchBoardingRooms] Found ${activeStudentsCount} active students in room ${room.id} (${room.room_number})`);
              console.log(`[fetchBoardingRooms] Students in room ${room.id}:`, activeStudentsData?.map(s => ({
                admission_number: s.admission_number,
                room_id: s.boarding_room_id
              })) || []);
            }
          } catch (err: any) {
            console.error(`[fetchBoardingRooms] Exception while counting students in room ${room.id}:`, err);
            console.error(`[fetchBoardingRooms] Exception details:`, JSON.stringify(err, null, 2));
            activeStudentsCount = room.current_occupancy ?? 0;
            console.warn(`[fetchBoardingRooms] Using stored occupancy due to exception:`, activeStudentsCount);
          }

          const currentOccupancy = activeStudentsCount || 0;
          console.log(`[fetchBoardingRooms] Final occupancy for room ${room.id} (${room.room_number}): ${currentOccupancy} / ${room.capacity}`);
          
          // Recalculate status based on actual occupancy
          let status = room.status as RoomStatus;
          if (status !== 'maintenance' && status !== 'reserved') {
            status = calculateRoomStatus(currentOccupancy, room.capacity);
          }

          // Update room occupancy in database if it differs
          if (room.current_occupancy !== currentOccupancy || room.status !== status) {
            await supabase
              .from('boarding_rooms')
              .update({
                current_occupancy: currentOccupancy,
                status: status
              })
              .eq('id', room.id);
          }

          return {
            ...room,
            current_occupancy: currentOccupancy,
            status: status,
            amenities: amenitiesData?.map(a => a.name) || []
          } as Room;
        })
      );

      return roomsWithAmenities;
    } catch (err: any) {
      console.error('Error fetching boarding rooms:', err);
      return [] as Room[];
    }
  };

  const fetchBoardingStudents = async () => {
    try {
      // Fetch ALL students (Active status) - even those not assigned rooms
      let query = supabase
        .from('students')
        .select(`
          *,
          current_class:classes!current_class_id(name),
          boarding_house:boarding_houses!boarding_house_id(name),
          boarding_room:boarding_rooms!boarding_room_id(room_number),
          accommodation_type:boarding_accommodation_types!accommodation_type_id(name)
        `)
        .eq('status', 'Active')
        .order('name');

      const { data, error } = await query;

      if (error) {
        // Check if error is due to missing tables/columns
        const isMissingTableOrColumn =
          error.code === 'PGRST116' ||
          error.code === '42P01' ||
          error.code === '42703' ||
          error.message?.includes('relation') ||
          error.message?.includes('does not exist') ||
          error.message?.includes('column') ||
          error.message?.includes('boarding');

        if (isMissingTableOrColumn) {
          console.warn('Boarding tables not set up yet. Fetching students without boarding data. Please run the database migration.');
          
          // Fallback: fetch without boarding columns
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
            const { data: simpleData, error: simpleError } = await supabase
              .from('students')
              .select('*')
              .eq('status', 'Active')
              .order('name');

            if (simpleError) {
              throw new Error(simpleError.message);
            }

            return (simpleData || []).map((student: any) => ({
              ...student,
              current_class: null,
              boarding_house: null,
              boarding_room: null,
              accommodation_type: null
            })) as BoardingStudent[];
          }

          return (fallbackData || []).map((student: any) => ({
            ...student,
            boarding_house: null,
            boarding_room: null,
            accommodation_type: null
          })) as BoardingStudent[];
        }
        throw error;
      }

      // Process students to get roommates
      const studentsWithRoommates = (data || []).map((student: any) => {
        // Find roommates (students in the same room)
        const roommates = (data || [])
          .filter((s: any) =>
            s.boarding_room_id &&
            s.boarding_room_id === student.boarding_room_id &&
            s.admission_number !== student.admission_number
          )
          .map((s: any) => s.name);

        return {
          ...student,
          roommates: roommates || []
        } as BoardingStudent;
      });

      return studentsWithRoommates;
    } catch (err: any) {
      console.error('Error fetching boarding students:', err);
      return [] as BoardingStudent[];
    }
  };

  const fetchAccommodationTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('boarding_accommodation_types')
        .select('*')
        .order('name');

      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          return [] as AccommodationType[];
        }
        throw error;
      }

      return (data || []) as AccommodationType[];
    } catch (err: any) {
      console.error('Error fetching accommodation types:', err);
      return [] as AccommodationType[];
    }
  };

  // React Query hooks
  const { data: houses = [], isLoading: isLoadingHouses, error: housesError } = useQuery({
    queryKey: ['boarding_houses'],
    queryFn: fetchBoardingHouses,
    retry: false,
    staleTime: 30000
  });

  const { data: rooms = [], isLoading: isLoadingRooms, error: roomsError } = useQuery({
    queryKey: ['boarding_rooms'],
    queryFn: fetchBoardingRooms,
    retry: false,
    staleTime: 30000
  });

  const { data: boardingStudents = [], isLoading: isLoadingStudents, error: studentsError } = useQuery({
    queryKey: ['boarding_students'],
    queryFn: fetchBoardingStudents,
    retry: false,
    staleTime: 30000
  });

  const { data: accommodationTypesData = [], isLoading: isLoadingAccommodationTypes } = useQuery({
    queryKey: ['boarding_accommodation_types'],
    queryFn: fetchAccommodationTypes,
    retry: false,
    staleTime: 30000
  });
  
  // Fetch all active students for dropdown
  const fetchAllActiveStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('admission_number, name, current_class_id, current_class:classes!current_class_id(name)')
        .eq('status', 'Active')
        .order('name');
      
      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching students:', err);
      return [];
    }
  };
  
  const { data: allStudents = [] } = useQuery({
    queryKey: ['all_active_students'],
    queryFn: fetchAllActiveStudents,
    retry: false,
    staleTime: 30000
  });

  // Convert accommodation types to array of strings for dropdown
  const accommodationTypes = accommodationTypesData.map(type => type.name);
  
  // Helper function to calculate room status based on occupancy
  const calculateRoomStatus = (currentOccupancy: number, capacity: number, manualStatus?: RoomStatus): RoomStatus => {
    // If manually set to maintenance or reserved, keep it
    if (manualStatus === 'maintenance' || manualStatus === 'reserved') {
      return manualStatus;
    }
    // Otherwise auto-calculate
    if (currentOccupancy === 0) return 'vacant';
    if (currentOccupancy === capacity) return 'fully-occupied';
    return 'partially-occupied';
  };
  
  // Get available rooms for a house
  const getAvailableRoomsForHouse = (houseId: number) => {
    return rooms.filter(r => r.house_id === houseId && (r.status === 'vacant' || r.status === 'partially-occupied'));
  };
  
  // Get students in a room
  const getStudentsInRoom = (roomId: number) => {
    return boardingStudents.filter(s => s.boarding_room_id === roomId);
  };
  
  // House CRUD handlers
  const handleAddHouse = async () => {
    try {
      // Insert house
      const { data: houseData, error: houseError } = await supabase
        .from('boarding_houses')
        .insert({
          name: houseFormData.name,
          designation: houseFormData.designation,
          description: houseFormData.description || null
        })
        .select()
        .single();
      
      if (houseError) throw houseError;
      
      // Insert personnel
      if (houseFormData.personnel.length > 0) {
        const personnelData = houseFormData.personnel.map(p => ({
          house_id: houseData.id,
          name: p.name,
          designation: p.designation
        }));
        
        const { error: personnelError } = await supabase
          .from('boarding_house_personnel')
          .insert(personnelData);
        
        if (personnelError) throw personnelError;
      }
      
      // Insert amenities
      if (houseFormData.amenities.length > 0) {
        const amenitiesData = houseFormData.amenities.map(a => ({
          house_id: houseData.id,
          name: a
        }));
        
        const { error: amenitiesError } = await supabase
          .from('boarding_house_amenities')
          .insert(amenitiesData);
        
        if (amenitiesError) throw amenitiesError;
      }
      
      await queryClient.invalidateQueries({ queryKey: ['boarding_houses'] });
      setShowHouseForm(false);
      setHouseFormData({ name: '', designation: '', description: '', personnel: [], amenities: [] });
      alert('House added successfully!');
    } catch (error: any) {
      console.error('Error adding house:', error);
      alert(`Failed to add house: ${error.message}`);
    }
  };
  
  const handleUpdateHouse = async () => {
    if (!selectedHouse) return;
    
    try {
      // Update house
      const { error: houseError } = await supabase
        .from('boarding_houses')
        .update({
          name: houseFormData.name,
          designation: houseFormData.designation,
          description: houseFormData.description || null
        })
        .eq('id', selectedHouse.id);
      
      if (houseError) throw houseError;
      
      // Delete existing personnel and amenities
      await supabase.from('boarding_house_personnel').delete().eq('house_id', selectedHouse.id);
      await supabase.from('boarding_house_amenities').delete().eq('house_id', selectedHouse.id);
      
      // Insert new personnel
      if (houseFormData.personnel.length > 0) {
        const personnelData = houseFormData.personnel.map(p => ({
          house_id: selectedHouse.id,
          name: p.name,
          designation: p.designation
        }));
        
        const { error: personnelError } = await supabase
          .from('boarding_house_personnel')
          .insert(personnelData);
        
        if (personnelError) throw personnelError;
      }
      
      // Insert new amenities
      if (houseFormData.amenities.length > 0) {
        const amenitiesData = houseFormData.amenities.map(a => ({
          house_id: selectedHouse.id,
          name: a
        }));
        
        const { error: amenitiesError } = await supabase
          .from('boarding_house_amenities')
          .insert(amenitiesData);
        
        if (amenitiesError) throw amenitiesError;
      }
      
      await queryClient.invalidateQueries({ queryKey: ['boarding_houses'] });
      setShowHouseForm(false);
      setSelectedHouse(null);
      setHouseFormData({ name: '', designation: '', description: '', personnel: [], amenities: [] });
      alert('House updated successfully!');
    } catch (error: any) {
      console.error('Error updating house:', error);
      alert(`Failed to update house: ${error.message}`);
    }
  };
  
  const handleDeleteHouse = async (houseId: number) => {
    if (!confirm('Are you sure you want to delete this house? This will also delete all rooms and unassign all students.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('boarding_houses')
        .delete()
        .eq('id', houseId);
      
      if (error) throw error;
      
      await queryClient.invalidateQueries({ queryKey: ['boarding_houses'] });
      await queryClient.invalidateQueries({ queryKey: ['boarding_rooms'] });
      await queryClient.invalidateQueries({ queryKey: ['boarding_students'] });
      alert('House deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting house:', error);
      alert(`Failed to delete house: ${error.message}`);
    }
  };
  
  // Room CRUD handlers
  const handleAddRoom = async () => {
    try {
      // Calculate current occupancy (0 for new room)
      const currentOccupancy = 0;
      const autoStatus = calculateRoomStatus(currentOccupancy, roomFormData.capacity, roomFormData.status);
      
      // Insert room
      const { data: roomData, error: roomError } = await supabase
        .from('boarding_rooms')
        .insert({
          house_id: parseInt(roomFormData.house_id),
          room_number: roomFormData.room_number,
          floor: roomFormData.floor,
          capacity: roomFormData.capacity,
          current_occupancy: currentOccupancy,
          status: autoStatus
        })
        .select()
        .single();
      
      if (roomError) throw roomError;
      
      // Insert amenities
      if (roomFormData.amenities.length > 0) {
        const amenitiesData = roomFormData.amenities.map(a => ({
          room_id: roomData.id,
          name: a
        }));
        
        const { error: amenitiesError } = await supabase
          .from('boarding_room_amenities')
          .insert(amenitiesData);
        
        if (amenitiesError) throw amenitiesError;
      }
      
      await queryClient.invalidateQueries({ queryKey: ['boarding_rooms'] });
      await queryClient.invalidateQueries({ queryKey: ['boarding_houses'] });
      setShowForm(false);
      setRoomFormData({ house_id: '', room_number: '', floor: 1, capacity: 1, status: 'vacant', amenities: [] });
      alert('Room added successfully!');
    } catch (error: any) {
      console.error('Error adding room:', error);
      alert(`Failed to add room: ${error.message}`);
    }
  };
  
  const handleUpdateRoom = async () => {
    if (!selectedRoom) return;
    
    try {
      // Get current occupancy from database
      const studentsInRoom = getStudentsInRoom(selectedRoom.id);
      const currentOccupancy = studentsInRoom.length;
      
      // Calculate status - if status is maintenance or reserved, keep it, otherwise auto-calculate
      const finalStatus = (roomFormData.status === 'maintenance' || roomFormData.status === 'reserved')
        ? roomFormData.status
        : calculateRoomStatus(currentOccupancy, roomFormData.capacity);
      
      // Update room
      const { error: roomError } = await supabase
        .from('boarding_rooms')
        .update({
          house_id: parseInt(roomFormData.house_id),
          room_number: roomFormData.room_number,
          floor: roomFormData.floor,
          capacity: roomFormData.capacity,
          current_occupancy: currentOccupancy,
          status: finalStatus
        })
        .eq('id', selectedRoom.id);
      
      if (roomError) throw roomError;
      
      // Delete existing amenities
      await supabase.from('boarding_room_amenities').delete().eq('room_id', selectedRoom.id);
      
      // Insert new amenities
      if (roomFormData.amenities.length > 0) {
        const amenitiesData = roomFormData.amenities.map(a => ({
          room_id: selectedRoom.id,
          name: a
        }));
        
        const { error: amenitiesError } = await supabase
          .from('boarding_room_amenities')
          .insert(amenitiesData);
        
        if (amenitiesError) throw amenitiesError;
      }
      
      await queryClient.invalidateQueries({ queryKey: ['boarding_rooms'] });
      await queryClient.invalidateQueries({ queryKey: ['boarding_houses'] });
      setShowForm(false);
      setSelectedRoom(null);
      setRoomFormData({ house_id: '', room_number: '', floor: 1, capacity: 1, status: 'vacant', amenities: [] });
      alert('Room updated successfully!');
    } catch (error: any) {
      console.error('Error updating room:', error);
      alert(`Failed to update room: ${error.message}`);
    }
  };
  
  const handleDeleteRoom = async (roomId: number) => {
    if (!confirm('Are you sure you want to delete this room? This will unassign all students from this room.')) {
      return;
    }
    
    try {
      // First unassign all students from this room
      await supabase
        .from('students')
        .update({ boarding_room_id: null })
        .eq('boarding_room_id', roomId);
      
      // Delete room
      const { error } = await supabase
        .from('boarding_rooms')
        .delete()
        .eq('id', roomId);
      
      if (error) throw error;
      
      await queryClient.invalidateQueries({ queryKey: ['boarding_rooms'] });
      await queryClient.invalidateQueries({ queryKey: ['boarding_houses'] });
      await queryClient.invalidateQueries({ queryKey: ['boarding_students'] });
      alert('Room deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting room:', error);
      alert(`Failed to delete room: ${error.message}`);
    }
  };
  
  // Student assignment handlers
  const handleAssignStudent = async () => {
    try {
      console.log('[handleAssignStudent] Starting assignment...', {
        student_id: studentFormData.student_id,
        house_id: studentFormData.house_id,
        room_id: studentFormData.room_id,
        accommodation_type_id: studentFormData.accommodation_type_id
      });
      
      const houseId = studentFormData.house_id ? parseInt(studentFormData.house_id) : null;
      const roomId = studentFormData.room_id ? parseInt(studentFormData.room_id) : null;
      const accommodationTypeId = studentFormData.accommodation_type_id ? parseInt(studentFormData.accommodation_type_id) : null;
      
      console.log('[handleAssignStudent] Parsed IDs:', { houseId, roomId, accommodationTypeId });
      
      // Update student
      console.log('[handleAssignStudent] Updating student record...');
      const { error: studentError, data: studentUpdateData } = await supabase
        .from('students')
        .update({
          boarding_house_id: houseId,
          boarding_room_id: roomId,
          accommodation_type_id: accommodationTypeId
        })
        .eq('admission_number', studentFormData.student_id)
        .select();
      
      if (studentError) {
        console.error('[handleAssignStudent] Error updating student:', studentError);
        throw studentError;
      }
      
      console.log('[handleAssignStudent] Student updated successfully:', studentUpdateData);
      
      // Update room occupancy and status if room is assigned
      if (roomId) {
        console.log(`[handleAssignStudent] Updating occupancy for room ${roomId}...`);
        // Count active students in this room
          const { data: studentsInRoom, error: countError } = await supabase
          .from('students')
          .select('admission_number, boarding_room_id, status')
          .eq('status', 'Active')
          .eq('boarding_room_id', roomId);
        
        let newOccupancy = 0;
        if (countError) {
          console.error(`[handleAssignStudent] Error fetching students for room ${roomId}:`, countError);
          console.error(`[handleAssignStudent] Full error:`, JSON.stringify(countError, null, 2));
          // Fallback: try fetching all and filtering
          console.log(`[handleAssignStudent] Trying fallback: fetching all active students...`);
          const { data: allActiveStudents } = await supabase
            .from('students')
            .select('admission_number, boarding_room_id, status')
            .eq('status', 'Active');
          
          if (allActiveStudents) {
            const filtered = allActiveStudents.filter(s => s.boarding_room_id === roomId) || [];
            newOccupancy = filtered.length;
            console.log(`[handleAssignStudent] Found ${newOccupancy} active students in room ${roomId} (fallback filter)`);
            console.log(`[handleAssignStudent] Students in room:`, filtered.map(s => ({
              admission_number: s.admission_number,
              room_id: s.boarding_room_id
            })));
          } else {
            alert(`Warning: Could not update room occupancy. Error: ${countError.message}`);
          }
        } else {
          newOccupancy = studentsInRoom?.length || 0;
          console.log(`[handleAssignStudent] Found ${newOccupancy} active students in room ${roomId}`);
            console.log(`[handleAssignStudent] Students in room:`, studentsInRoom?.map(s => ({
              admission_number: s.admission_number,
              room_id: s.boarding_room_id
            })) || []);
        }
        
        const room = rooms.find(r => r.id === roomId);
        if (room) {
          const newStatus = calculateRoomStatus(newOccupancy, room.capacity);
          
          console.log(`[handleAssignStudent] Updating room ${roomId}: occupancy=${newOccupancy}, status=${newStatus}, capacity=${room.capacity}`);
          
          const { error: updateError } = await supabase
            .from('boarding_rooms')
            .update({
              current_occupancy: newOccupancy,
              status: newStatus
            })
            .eq('id', roomId);
          
          if (updateError) {
            console.error(`[handleAssignStudent] Error updating room ${roomId}:`, updateError);
            console.error(`[handleAssignStudent] Update error details:`, JSON.stringify(updateError, null, 2));
            alert(`Warning: Could not update room occupancy. Error: ${updateError.message}`);
          } else {
            console.log(`[handleAssignStudent] Successfully updated room ${roomId} with occupancy ${newOccupancy}`);
          }
        } else {
          console.warn(`[handleAssignStudent] Room ${roomId} not found in rooms array`);
        }
      }
      
      await queryClient.invalidateQueries({ queryKey: ['boarding_students'] });
      await queryClient.invalidateQueries({ queryKey: ['boarding_rooms'] });
      await queryClient.invalidateQueries({ queryKey: ['boarding_houses'] });
      setShowForm(false);
      setStudentFormData({ student_id: '', house_id: '', room_id: '', accommodation_type_id: '', check_in_date: '', emergency_contact: '' });
      alert('Student assigned successfully!');
    } catch (error: any) {
      console.error('Error assigning student:', error);
      alert(`Failed to assign student: ${error.message}`);
    }
  };
  
  const handleUpdateStudentAssignment = async () => {
    if (!selectedStudentForEdit) return;
    
    try {
      const houseId = studentFormData.house_id ? parseInt(studentFormData.house_id) : null;
      const roomId = studentFormData.room_id ? parseInt(studentFormData.room_id) : null;
      const accommodationTypeId = studentFormData.accommodation_type_id ? parseInt(studentFormData.accommodation_type_id) : null;
      
      const oldRoomId = selectedStudentForEdit.boarding_room_id;
      
      // Update student
      const { error: studentError } = await supabase
        .from('students')
        .update({
          boarding_house_id: houseId,
          boarding_room_id: roomId,
          accommodation_type_id: accommodationTypeId
        })
        .eq('admission_number', selectedStudentForEdit.admission_number);
      
      if (studentError) throw studentError;
      
      // Update old room occupancy if student was moved from a room
      if (oldRoomId && oldRoomId !== roomId) {
        console.log(`[handleUpdateStudentAssignment] Updating old room ${oldRoomId} occupancy...`);
        // Count active students in old room
          const { data: studentsInOldRoom, error: oldRoomCountError } = await supabase
          .from('students')
          .select('admission_number, boarding_room_id, status')
          .eq('status', 'Active')
          .eq('boarding_room_id', oldRoomId);
        
        let newOccupancy = 0;
        if (oldRoomCountError) {
          console.error(`[handleUpdateStudentAssignment] Error fetching students for old room ${oldRoomId}:`, oldRoomCountError);
          // Fallback: try fetching all and filtering
          const { data: allActiveStudents } = await supabase
            .from('students')
            .select('admission_number, boarding_room_id, status')
            .eq('status', 'Active');
          
          if (allActiveStudents) {
            const filtered = allActiveStudents.filter(s => s.boarding_room_id === oldRoomId) || [];
            newOccupancy = filtered.length;
            console.log(`[handleUpdateStudentAssignment] Found ${newOccupancy} active students in old room ${oldRoomId} (fallback filter)`);
          }
        } else {
          newOccupancy = studentsInOldRoom?.length || 0;
          console.log(`[handleUpdateStudentAssignment] Found ${newOccupancy} active students in old room ${oldRoomId}`);
        }
        
        const oldRoom = rooms.find(r => r.id === oldRoomId);
        if (oldRoom) {
          const newStatus = calculateRoomStatus(newOccupancy, oldRoom.capacity);
          
          console.log(`[handleUpdateStudentAssignment] Updating old room ${oldRoomId}: occupancy=${newOccupancy}, status=${newStatus}, capacity=${oldRoom.capacity}`);
          
          const { error: updateError } = await supabase
            .from('boarding_rooms')
            .update({
              current_occupancy: newOccupancy,
              status: newStatus
            })
            .eq('id', oldRoomId);
          
          if (updateError) {
            console.error(`[handleUpdateStudentAssignment] Error updating old room ${oldRoomId}:`, updateError);
            console.error(`[handleUpdateStudentAssignment] Update error details:`, JSON.stringify(updateError, null, 2));
          } else {
            console.log(`[handleUpdateStudentAssignment] Successfully updated old room ${oldRoomId} with occupancy ${newOccupancy}`);
          }
        }
      }
      
      // Update new room occupancy if student was moved to a room
      if (roomId && roomId !== oldRoomId) {
        console.log(`[handleUpdateStudentAssignment] Updating new room ${roomId} occupancy...`);
        // Count active students in new room
          const { data: studentsInNewRoom, error: newRoomCountError } = await supabase
          .from('students')
          .select('admission_number, boarding_room_id, status')
          .eq('status', 'Active')
          .eq('boarding_room_id', roomId);
        
        let newOccupancy = 0;
        if (newRoomCountError) {
          console.error(`[handleUpdateStudentAssignment] Error fetching students for new room ${roomId}:`, newRoomCountError);
          // Fallback: try fetching all and filtering
          const { data: allActiveStudents } = await supabase
            .from('students')
            .select('admission_number, boarding_room_id, status')
            .eq('status', 'Active');
          
          if (allActiveStudents) {
            const filtered = allActiveStudents.filter(s => s.boarding_room_id === roomId) || [];
            newOccupancy = filtered.length;
            console.log(`[handleUpdateStudentAssignment] Found ${newOccupancy} active students in new room ${roomId} (fallback filter)`);
          }
        } else {
          newOccupancy = studentsInNewRoom?.length || 0;
          console.log(`[handleUpdateStudentAssignment] Found ${newOccupancy} active students in new room ${roomId}`);
        }
        
        const newRoom = rooms.find(r => r.id === roomId);
        if (newRoom) {
          const newStatus = calculateRoomStatus(newOccupancy, newRoom.capacity);
          
          console.log(`[handleUpdateStudentAssignment] Updating new room ${roomId}: occupancy=${newOccupancy}, status=${newStatus}, capacity=${newRoom.capacity}`);
          
          const { error: updateError } = await supabase
            .from('boarding_rooms')
            .update({
              current_occupancy: newOccupancy,
              status: newStatus
            })
            .eq('id', roomId);
          
          if (updateError) {
            console.error(`[handleUpdateStudentAssignment] Error updating new room ${roomId}:`, updateError);
            console.error(`[handleUpdateStudentAssignment] Update error details:`, JSON.stringify(updateError, null, 2));
          } else {
            console.log(`[handleUpdateStudentAssignment] Successfully updated new room ${roomId} with occupancy ${newOccupancy}`);
          }
        }
      }
      
      await queryClient.invalidateQueries({ queryKey: ['boarding_students'] });
      await queryClient.invalidateQueries({ queryKey: ['boarding_rooms'] });
      await queryClient.invalidateQueries({ queryKey: ['boarding_houses'] });
      setShowForm(false);
      setSelectedStudentForEdit(null);
      setStudentFormData({ student_id: '', house_id: '', room_id: '', accommodation_type_id: '', check_in_date: '', emergency_contact: '' });
      alert('Student assignment updated successfully!');
    } catch (error: any) {
      console.error('Error updating student assignment:', error);
      alert(`Failed to update student assignment: ${error.message}`);
    }
  };
  
  // Accommodation types handlers
  const handleAddAccommodationType = async () => {
    if (!newAccommodationType.trim()) {
      alert('Please enter an accommodation type name.');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('boarding_accommodation_types')
        .insert({ name: newAccommodationType.trim() });
      
      if (error) throw error;
      
      await queryClient.invalidateQueries({ queryKey: ['boarding_accommodation_types'] });
      setNewAccommodationType('');
      alert('Accommodation type added successfully!');
    } catch (error: any) {
      console.error('Error adding accommodation type:', error);
      alert(`Failed to add accommodation type: ${error.message}`);
    }
  };
  
  const handleDeleteAccommodationType = async (typeId: number) => {
    if (!confirm('Are you sure you want to delete this accommodation type? Students using this type will have it unassigned.')) {
      return;
    }
    
    try {
      // Unassign students using this type
      await supabase
        .from('students')
        .update({ accommodation_type_id: null })
        .eq('accommodation_type_id', typeId);
      
      // Delete type
      const { error } = await supabase
        .from('boarding_accommodation_types')
        .delete()
        .eq('id', typeId);
      
      if (error) throw error;
      
      await queryClient.invalidateQueries({ queryKey: ['boarding_accommodation_types'] });
      await queryClient.invalidateQueries({ queryKey: ['boarding_students'] });
      alert('Accommodation type deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting accommodation type:', error);
      alert(`Failed to delete accommodation type: ${error.message}`);
    }
  };

  const maintenanceRequests: MaintenanceRequest[] = [
    {
      id: 1,
      roomNumber: '301',
      building: 'Eagle House',
      issue: 'AC not working',
      reportedBy: 'Maintenance Staff',
      reportedDate: '2024-02-10',
      priority: 'high',
      status: 'in-progress',
      assignedTo: 'John Technician',
      completedDate: null
    },
    {
      id: 2,
      roomNumber: '205',
      building: 'Dove House',
      issue: 'Leaky faucet',
      reportedBy: 'House Parent',
      reportedDate: '2024-02-12',
      priority: 'medium',
      status: 'pending',
      assignedTo: 'John Technician',
      completedDate: null
    },
    {
      id: 3,
      roomNumber: 'Common Area',
      building: 'Eagle House',
      issue: 'Light bulb replacement',
      reportedBy: 'Student',
      reportedDate: '2024-02-14',
      priority: 'low',
      status: 'completed',
      assignedTo: 'John Technician',
      completedDate: '2024-02-15'
    }
  ];

  const visitors: Visitor[] = [
    {
      id: 1,
      visitorName: 'John Johnson',
      studentName: 'Emily Johnson',
      roomNumber: '101',
      visitDate: '2024-02-15',
      visitTime: '14:00',
      purpose: 'Parent Visit',
      checkedIn: true,
      checkedOut: true
    },
    {
      id: 2,
      visitorName: 'Mary Williams',
      studentName: 'Sarah Williams',
      roomNumber: '101',
      visitDate: '2024-02-16',
      visitTime: '16:00',
      purpose: 'Parent Visit',
      checkedIn: true,
      checkedOut: false
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
      'fully-occupied': 'bg-blue-100 text-blue-800',
      'partially-occupied': 'bg-yellow-100 text-yellow-800',
      'vacant': 'bg-green-100 text-green-800',
      'maintenance': 'bg-orange-100 text-orange-800',
      'reserved': 'bg-purple-100 text-purple-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'low': 'bg-gray-100 text-gray-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getAccommodationTypeColor = (typeName: string | undefined) => {
    if (!typeName || typeName === 'Unassigned') {
      return 'bg-gray-100 text-gray-800';
    }
    const lowerName = typeName.toLowerCase();
    if (lowerName.includes('full')) {
      return 'bg-green-100 text-green-800';
    }
    if (lowerName.includes('partial')) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-blue-100 text-blue-800';
  };

  const getStatusLabel = (status: RoomStatus) => {
    const labels: Record<RoomStatus, string> = {
      'fully-occupied': 'Fully Occupied',
      'partially-occupied': 'Partially Occupied',
      'vacant': 'Vacant',
      'maintenance': 'Maintenance',
      'reserved': 'Reserved'
    };
    return labels[status] || status;
  };

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.status === 'fully-occupied' || r.status === 'partially-occupied').length;
  const totalStudents = boardingStudents.filter(s => s.boarding_house_id || s.boarding_room_id).length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  const pendingMaintenance = maintenanceRequests.filter(m => m.status === 'pending' || m.status === 'in-progress').length;

  const RoomForm = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [houseId, setHouseId] = useState('');
    const [roomNumber, setRoomNumber] = useState('');
    const [floor, setFloor] = useState(1);
    const [capacity, setCapacity] = useState(1);
    const [status, setStatus] = useState<RoomStatus>('vacant');
    const [amenities, setAmenities] = useState<string[]>([]);
    const availableAmenities = ['AC', 'WiFi', 'Private Bathroom', 'Study Desk', 'TV', 'Refrigerator', 'Microwave', 'Balcony'];
    
    // Initialize form when editing - like Transport module
    React.useEffect(() => {
      if (selectedRoom) {
        setHouseId(selectedRoom.house_id.toString());
        setRoomNumber(selectedRoom.room_number);
        setFloor(selectedRoom.floor);
        setCapacity(selectedRoom.capacity);
        setStatus(selectedRoom.status);
        setAmenities(selectedRoom.amenities || []);
      } else {
        setHouseId('');
        setRoomNumber('');
        setFloor(1);
        setCapacity(1);
        setStatus('vacant');
        setAmenities([]);
      }
    }, [selectedRoom?.id]);
    
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      
      try {
        // Calculate current occupancy for status calculation
        const currentOccupancy = selectedRoom ? getStudentsInRoom(selectedRoom.id).length : 0;
        const finalStatus = (status === 'maintenance' || status === 'reserved')
          ? status
          : calculateRoomStatus(currentOccupancy, capacity);
        
        if (selectedRoom) {
          // Update room
          const { error: roomError } = await supabase
            .from('boarding_rooms')
            .update({
              house_id: parseInt(houseId),
              room_number: roomNumber,
              floor: floor,
              capacity: capacity,
              current_occupancy: currentOccupancy,
              status: finalStatus
            })
            .eq('id', selectedRoom.id);
          
          if (roomError) throw roomError;
          
          // Delete existing amenities
          await supabase.from('boarding_room_amenities').delete().eq('room_id', selectedRoom.id);
          
          // Insert new amenities
          if (amenities.length > 0) {
            const amenitiesData = amenities.map(a => ({
              room_id: selectedRoom.id,
              name: a
            }));
            
            const { error: amenitiesError } = await supabase
              .from('boarding_room_amenities')
              .insert(amenitiesData);
            
            if (amenitiesError) throw amenitiesError;
          }
          
          await queryClient.invalidateQueries({ queryKey: ['boarding_rooms'] });
          await queryClient.invalidateQueries({ queryKey: ['boarding_houses'] });
          setShowForm(false);
          setSelectedRoom(null);
          alert('Room updated successfully!');
        } else {
          // Add room
          const { data: roomData, error: roomError } = await supabase
            .from('boarding_rooms')
            .insert({
              house_id: parseInt(houseId),
              room_number: roomNumber,
              floor: floor,
              capacity: capacity,
              current_occupancy: 0,
              status: finalStatus
            })
            .select()
            .single();
          
          if (roomError) throw roomError;
          
          // Insert amenities
          if (amenities.length > 0) {
            const amenitiesData = amenities.map(a => ({
              room_id: roomData.id,
              name: a
            }));
            
            const { error: amenitiesError } = await supabase
              .from('boarding_room_amenities')
              .insert(amenitiesData);
            
            if (amenitiesError) throw amenitiesError;
          }
          
          await queryClient.invalidateQueries({ queryKey: ['boarding_rooms'] });
          await queryClient.invalidateQueries({ queryKey: ['boarding_houses'] });
          setShowForm(false);
          alert('Room added successfully!');
        }
      } catch (error: any) {
        console.error('Error saving room:', error);
        alert(`Failed to save room: ${error.message}`);
      } finally {
        setIsSubmitting(false);
      }
    };
    
    const toggleAmenity = (amenity: string) => {
      setAmenities(prev => 
        prev.includes(amenity)
          ? prev.filter(a => a !== amenity)
          : [...prev, amenity]
      );
    };
    
    // Get current occupancy for status calculation
    const currentOccupancy = selectedRoom ? getStudentsInRoom(selectedRoom.id).length : 0;
    const canEditStatus = status === 'maintenance' || status === 'reserved';
    const autoStatus = calculateRoomStatus(currentOccupancy, capacity);
    
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowForm(false);
            setSelectedRoom(null);
          }
        }}
      >
        <div 
          className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">{selectedRoom ? 'Edit Room' : 'Add New Room'}</h2>
            <button
              onClick={() => {
                setShowForm(false);
                setSelectedRoom(null);
              }}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">House *</label>
                <select
                  required
                  value={houseId}
                  onChange={(e) => setHouseId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select house...</option>
                  {houses.map(house => (
                    <option key={house.id} value={house.id}>{house.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Number *</label>
                <input
                  type="text"
                  required
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="101"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Floor *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={floor}
                  onChange={(e) => setFloor(parseInt(e.target.value) || 1)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={canEditStatus ? status : autoStatus}
                  onChange={(e) => {
                    const newStatus = e.target.value as RoomStatus;
                    // Only allow manual selection for maintenance and reserved
                    if (newStatus === 'maintenance' || newStatus === 'reserved') {
                      setStatus(newStatus);
                    }
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={autoStatus}>{getStatusLabel(autoStatus)} (Auto)</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="reserved">Reserved</option>
                </select>
                {!canEditStatus && (
                  <p className="text-xs text-gray-500 mt-1">Status auto-calculated based on occupancy. Select Maintenance or Reserved to override.</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amenities</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {availableAmenities.map((amenity) => (
                  <label key={amenity} className="flex items-center space-x-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={amenities.includes(amenity)}
                      onChange={() => toggleAmenity(amenity)}
                      className="rounded"
                    />
                    <span className="text-sm">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setSelectedRoom(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : selectedRoom ? 'Update Room' : 'Add Room'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const StudentForm = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [studentId, setStudentId] = useState('');
    const [houseId, setHouseId] = useState('');
    const [roomId, setRoomId] = useState('');
    const [accommodationTypeId, setAccommodationTypeId] = useState('');
    const [checkInDate, setCheckInDate] = useState('');
    const [emergencyContact, setEmergencyContact] = useState('');
    
    // Initialize form when editing - like Transport module
    React.useEffect(() => {
      if (selectedStudentForEdit) {
        setStudentId(selectedStudentForEdit.admission_number);
        setHouseId(selectedStudentForEdit.boarding_house_id?.toString() || '');
        setRoomId(selectedStudentForEdit.boarding_room_id?.toString() || '');
        setAccommodationTypeId(selectedStudentForEdit.accommodation_type_id?.toString() || '');
        setCheckInDate(selectedStudentForEdit.check_in_date || '');
        setEmergencyContact(selectedStudentForEdit.emergency_contact || '');
      } else {
        setStudentId('');
        setHouseId('');
        setRoomId('');
        setAccommodationTypeId('');
        setCheckInDate('');
        setEmergencyContact('');
      }
    }, [selectedStudentForEdit?.id]);
    
    // Reset room when house changes
    React.useEffect(() => {
      if (houseId) {
        setRoomId(''); // Clear room selection when house changes
      }
    }, [houseId]);
    
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      
      try {
        const finalHouseId = houseId ? parseInt(houseId) : null;
        const finalRoomId = roomId ? parseInt(roomId) : null;
        const finalAccommodationTypeId = accommodationTypeId ? parseInt(accommodationTypeId) : null;
        
        if (selectedStudentForEdit) {
          // Update student assignment
          const oldRoomId = selectedStudentForEdit.boarding_room_id;
          
          // Update student
          const { error: studentError } = await supabase
            .from('students')
            .update({
              boarding_house_id: finalHouseId,
              boarding_room_id: finalRoomId,
              accommodation_type_id: finalAccommodationTypeId
            })
            .eq('admission_number', studentId);
          
          if (studentError) throw studentError;
          
          // Update room occupancy if room changed
          if (oldRoomId && oldRoomId !== finalRoomId) {
            console.log(`[StudentForm] Updating old room ${oldRoomId} occupancy...`);
            try {
              // Get all active students and filter manually
              const { data: allActiveStudents } = await supabase
                .from('students')
                .select('admission_number, boarding_room_id, status')
                .eq('status', 'Active');
              
              const studentsInOldRoom = allActiveStudents?.filter(s => s.boarding_room_id === oldRoomId) || [];
              const newOccupancy = studentsInOldRoom.length;
              console.log(`[StudentForm] Found ${newOccupancy} active students in old room ${oldRoomId} (manual filter)`);
              
              const oldRoom = rooms.find(r => r.id === oldRoomId);
              if (oldRoom) {
                const newStatus = calculateRoomStatus(newOccupancy, oldRoom.capacity);
                
                console.log(`[StudentForm] Updating old room ${oldRoomId}: occupancy=${newOccupancy}, status=${newStatus}`);
                
                const { error: updateError } = await supabase
                  .from('boarding_rooms')
                  .update({ current_occupancy: newOccupancy, status: newStatus })
                  .eq('id', oldRoomId);
                
                if (updateError) {
                  console.error(`[StudentForm] Error updating old room ${oldRoomId}:`, updateError);
                }
              }
            } catch (err: any) {
              console.error(`[StudentForm] Exception updating old room ${oldRoomId}:`, err);
            }
          }
          
          if (finalRoomId && finalRoomId !== oldRoomId) {
            console.log(`[StudentForm] Updating new room ${finalRoomId} occupancy...`);
            try {
              // Get all active students and filter manually
              const { data: allActiveStudents } = await supabase
                .from('students')
                .select('admission_number, boarding_room_id, status')
                .eq('status', 'Active');
              
              const studentsInNewRoom = allActiveStudents?.filter(s => s.boarding_room_id === finalRoomId) || [];
              const newOccupancy = studentsInNewRoom.length;
              console.log(`[StudentForm] Found ${newOccupancy} active students in new room ${finalRoomId} (manual filter)`);
              
              const newRoom = rooms.find(r => r.id === finalRoomId);
              if (newRoom) {
                const newStatus = calculateRoomStatus(newOccupancy, newRoom.capacity);
                
                console.log(`[StudentForm] Updating new room ${finalRoomId}: occupancy=${newOccupancy}, status=${newStatus}`);
                
                const { error: updateError } = await supabase
                  .from('boarding_rooms')
                  .update({ current_occupancy: newOccupancy, status: newStatus })
                  .eq('id', finalRoomId);
                
                if (updateError) {
                  console.error(`[StudentForm] Error updating new room ${finalRoomId}:`, updateError);
                }
              }
            } catch (err: any) {
              console.error(`[StudentForm] Exception updating new room ${finalRoomId}:`, err);
            }
          }
          
          await queryClient.invalidateQueries({ queryKey: ['boarding_students'] });
          await queryClient.invalidateQueries({ queryKey: ['boarding_rooms'] });
          await queryClient.invalidateQueries({ queryKey: ['boarding_houses'] });
          setShowForm(false);
          setSelectedStudentForEdit(null);
          alert('Student assignment updated successfully!');
        } else {
          // Assign student
          const { error: studentError } = await supabase
            .from('students')
            .update({
              boarding_house_id: finalHouseId,
              boarding_room_id: finalRoomId,
              accommodation_type_id: finalAccommodationTypeId
            })
            .eq('admission_number', studentId);
          
          if (studentError) throw studentError;
          
          // Update room occupancy
          if (finalRoomId) {
            console.log(`[StudentForm] Updating room ${finalRoomId} occupancy for new assignment...`);
            try {
              // Get all active students and filter manually
              const { data: allActiveStudents } = await supabase
                .from('students')
                .select('admission_number, boarding_room_id, status')
                .eq('status', 'Active');
              
              const studentsInRoom = allActiveStudents?.filter(s => s.boarding_room_id === finalRoomId) || [];
              const newOccupancy = studentsInRoom.length;
              console.log(`[StudentForm] Found ${newOccupancy} active students in room ${finalRoomId} (manual filter)`);
              
              const room = rooms.find(r => r.id === finalRoomId);
              if (room) {
                const newStatus = calculateRoomStatus(newOccupancy, room.capacity);
                
                console.log(`[StudentForm] Updating room ${finalRoomId}: occupancy=${newOccupancy}, status=${newStatus}`);
                
                const { error: updateError } = await supabase
                  .from('boarding_rooms')
                  .update({ current_occupancy: newOccupancy, status: newStatus })
                  .eq('id', finalRoomId);
                
                if (updateError) {
                  console.error(`[StudentForm] Error updating room ${finalRoomId}:`, updateError);
                } else {
                  console.log(`[StudentForm] Successfully updated room ${finalRoomId}`);
                }
              }
            } catch (err: any) {
              console.error(`[StudentForm] Exception updating room ${finalRoomId}:`, err);
            }
          }
          
          await queryClient.invalidateQueries({ queryKey: ['boarding_students'] });
          await queryClient.invalidateQueries({ queryKey: ['boarding_rooms'] });
          await queryClient.invalidateQueries({ queryKey: ['boarding_houses'] });
          setShowForm(false);
          alert('Student assigned successfully!');
        }
      } catch (error: any) {
        console.error('Error saving student assignment:', error);
        alert(`Failed to save student assignment: ${error.message}`);
      } finally {
        setIsSubmitting(false);
      }
    };
    
    // Get available rooms for selected house
    const availableRooms = houseId 
      ? getAvailableRoomsForHouse(parseInt(houseId))
      : [];
    
    // Get roommates for selected room
    const roommates = roomId
      ? getStudentsInRoom(parseInt(roomId)).map(s => s.name)
      : [];
    
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowForm(false);
            setSelectedStudentForEdit(null);
          }
        }}
      >
        <div 
          className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {selectedStudentForEdit ? 'Edit Student Assignment' : 'Assign Student to Room'}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                setSelectedStudentForEdit(null);
              }}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                <select
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  disabled={!!selectedStudentForEdit}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">Select student...</option>
                  {allStudents.map(student => (
                    <option key={student.admission_number} value={student.admission_number}>
                      {student.name} ({student.admission_number}) - {(student.current_class as any)?.name || '-'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">House *</label>
                <select
                  required
                  value={houseId}
                  onChange={(e) => setHouseId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select house...</option>
                  {houses.map(house => (
                    <option key={house.id} value={house.id.toString()}>{house.name} - {house.designation}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  disabled={!houseId}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">Select room (optional)...</option>
                  {availableRooms.map(room => (
                    <option key={room.id} value={room.id.toString()}>
                      {room.room_number} (Floor {room.floor}) - {room.current_occupancy}/{room.capacity}
                    </option>
                  ))}
                </select>
                {!houseId && (
                  <p className="text-xs text-gray-500 mt-1">Please select a house first</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Accommodation Type</label>
                <div className="flex items-center space-x-2">
                  <select
                    value={accommodationTypeId}
                    onChange={(e) => setAccommodationTypeId(e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select accommodation type...</option>
                    {accommodationTypesData.map(type => (
                      <option key={type.id} value={type.id.toString()}>{type.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAccommodationTypesModal(true)}
                    className="px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
                  >
                    Manage
                  </button>
                </div>
              </div>
              {roomId && roommates.length > 0 && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Roommates</label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-700">
                      {roommates.join(', ')}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setSelectedStudentForEdit(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : selectedStudentForEdit ? 'Update Assignment' : 'Assign Student'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const MaintenanceForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">New Maintenance Request</h2>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Room/Area</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="101 or Common Area"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Building</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="North Hall"
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
              <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>John Technician</option>
                <option>Maintenance Staff</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Issue Description</label>
              <textarea
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the maintenance issue..."
              ></textarea>
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
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const VisitorForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Register Visitor</h2>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Visitor Name</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
              <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Select student...</option>
                {boardingStudents.map(student => (
                  <option key={student.admission_number}>{student.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visit Date</label>
              <input
                type="date"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visit Time</label>
              <input
                type="time"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Parent Visit, Family Visit, etc."
              />
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
              Register Visitor
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // House Form Component
  const HouseForm = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [houseName, setHouseName] = useState('');
    const [designation, setDesignation] = useState('');
    const [description, setDescription] = useState('');
    const [personnel, setPersonnel] = useState<{ name: string; designation: string }[]>([]);
    const [amenities, setAmenities] = useState<string[]>([]);
    const [newPersonnel, setNewPersonnel] = useState({ name: '', designation: '' });
    const [newAmenity, setNewAmenity] = useState('');
    const availableAmenities = ['Common Study Room', 'Recreation Room', 'WiFi', 'Laundry Service', 'Cafeteria Access', 'Health Clinic', 'Study Room'];
    
    // Initialize form when editing - like Transport module
    React.useEffect(() => {
      if (selectedHouse) {
        setHouseName(selectedHouse.name);
        setDesignation(selectedHouse.designation);
        setDescription(selectedHouse.description || '');
        setPersonnel(selectedHouse.personnel || []);
        setAmenities(selectedHouse.amenities || []);
      } else {
        setHouseName('');
        setDesignation('');
        setDescription('');
        setPersonnel([]);
        setAmenities([]);
      }
    }, [selectedHouse?.id]);
    
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      
      try {
        if (selectedHouse) {
          // Update house
          const { error: houseError } = await supabase
            .from('boarding_houses')
            .update({
              name: houseName,
              designation: designation,
              description: description || null
            })
            .eq('id', selectedHouse.id);
          
          if (houseError) throw houseError;
          
          // Delete existing personnel and amenities
          await supabase.from('boarding_house_personnel').delete().eq('house_id', selectedHouse.id);
          await supabase.from('boarding_house_amenities').delete().eq('house_id', selectedHouse.id);
          
          // Insert new personnel
          if (personnel.length > 0) {
            const personnelData = personnel.map(p => ({
              house_id: selectedHouse.id,
              name: p.name,
              designation: p.designation
            }));
            
            const { error: personnelError } = await supabase
              .from('boarding_house_personnel')
              .insert(personnelData);
            
            if (personnelError) throw personnelError;
          }
          
          // Insert new amenities
          if (amenities.length > 0) {
            const amenitiesData = amenities.map(a => ({
              house_id: selectedHouse.id,
              name: a
            }));
            
            const { error: amenitiesError } = await supabase
              .from('boarding_house_amenities')
              .insert(amenitiesData);
            
            if (amenitiesError) throw amenitiesError;
          }
          
          await queryClient.invalidateQueries({ queryKey: ['boarding_houses'] });
          setShowHouseForm(false);
          setSelectedHouse(null);
          alert('House updated successfully!');
        } else {
          // Create house
          const { data: houseData, error: houseError } = await supabase
            .from('boarding_houses')
            .insert({
              name: houseName,
              designation: designation,
              description: description || null
            })
            .select()
            .single();
          
          if (houseError) throw houseError;
          
          // Insert personnel
          if (personnel.length > 0) {
            const personnelData = personnel.map(p => ({
              house_id: houseData.id,
              name: p.name,
              designation: p.designation
            }));
            
            const { error: personnelError } = await supabase
              .from('boarding_house_personnel')
              .insert(personnelData);
            
            if (personnelError) throw personnelError;
          }
          
          // Insert amenities
          if (amenities.length > 0) {
            const amenitiesData = amenities.map(a => ({
              house_id: houseData.id,
              name: a
            }));
            
            const { error: amenitiesError } = await supabase
              .from('boarding_house_amenities')
              .insert(amenitiesData);
            
            if (amenitiesError) throw amenitiesError;
          }
          
          await queryClient.invalidateQueries({ queryKey: ['boarding_houses'] });
          setShowHouseForm(false);
          alert('House added successfully!');
        }
      } catch (error: any) {
        console.error('Error saving house:', error);
        alert(`Failed to save house: ${error.message}`);
      } finally {
        setIsSubmitting(false);
      }
    };
    
    const addPersonnel = () => {
      if (newPersonnel.name && newPersonnel.designation) {
        setPersonnel(prev => [...prev, { ...newPersonnel }]);
        setNewPersonnel({ name: '', designation: '' });
      }
    };
    
    const removePersonnel = (index: number) => {
      setPersonnel(prev => prev.filter((_, i) => i !== index));
    };
    
    const addAmenity = () => {
      if (newAmenity.trim() && !amenities.includes(newAmenity.trim())) {
        setAmenities(prev => [...prev, newAmenity.trim()]);
        setNewAmenity('');
      }
    };
    
    const removeAmenity = (amenity: string) => {
      setAmenities(prev => prev.filter(a => a !== amenity));
    };
    
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowHouseForm(false);
            setSelectedHouse(null);
          }
        }}
      >
        <div 
          className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">{selectedHouse ? 'Edit House' : 'Add New House'}</h2>
            <button
              onClick={() => {
                setShowHouseForm(false);
                setSelectedHouse(null);
              }}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">House Name *</label>
                <input
                  type="text"
                  required
                  value={houseName}
                  onChange={(e) => setHouseName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Eagle House"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation *</label>
                <input
                  type="text"
                  required
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Boys House - Senior"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Main boarding house for senior boys"
                />
              </div>
            </div>

            {/* Personnel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Personnel in Charge</label>
              <div className="space-y-2 mb-2">
                {personnel.map((person, idx) => (
                  <div key={idx} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <span className="text-sm font-medium">{person.name}</span>
                      <span className="text-sm text-gray-600 ml-2">- {person.designation}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePersonnel(idx)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newPersonnel.name}
                  onChange={(e) => setNewPersonnel(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Name"
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  value={newPersonnel.designation}
                  onChange={(e) => setNewPersonnel(prev => ({ ...prev, designation: e.target.value }))}
                  placeholder="Designation"
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addPersonnel}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Amenities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {amenities.map((amenity, idx) => (
                  <span key={idx} className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-lg">
                    {amenity}
                    <button
                      type="button"
                      onClick={() => removeAmenity(amenity)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                  placeholder="Enter amenity name"
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addAmenity}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowHouseForm(false);
                  setSelectedHouse(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : selectedHouse ? 'Update House' : 'Add House'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  
  // Accommodation Types Modal
  const AccommodationTypesModal = () => {
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowAccommodationTypesModal(false);
          }
        }}
      >
        <div 
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Manage Accommodation Types</h3>
            <button
              onClick={() => setShowAccommodationTypesModal(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Add new type */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={newAccommodationType}
                onChange={(e) => setNewAccommodationType(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAccommodationType())}
                placeholder="Enter accommodation type name"
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleAddAccommodationType}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add
              </button>
            </div>

            {/* List of types */}
            <div className="space-y-2">
              {accommodationTypesData.map(type => (
                <div key={type.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{type.name}</div>
                    {type.description && (
                      <div className="text-sm text-gray-600">{type.description}</div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteAccommodationType(type.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {accommodationTypesData.length === 0 && (
                <div className="text-center text-gray-500 py-8">No accommodation types yet. Add one above.</div>
              )}
            </div>
          </div>

          <div className="flex justify-end p-6 border-t border-gray-200">
            <button
              onClick={() => setShowAccommodationTypesModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderForm = () => {
    switch (formType) {
      case 'room': return <RoomForm />;
      case 'student': return <StudentForm />;
      case 'maintenance': return <MaintenanceForm />;
      case 'visitor': return <VisitorForm />;
    }
  };

  // Rooms List Modal Component
  const RoomsListModal = ({ house, rooms: houseRooms, onClose }: { house: House; rooms: Room[]; onClose: () => void }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredRooms = houseRooms.filter(room =>
      room.room_number.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div 
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{house.name} - Rooms</h3>
              <p className="text-sm text-gray-600 mt-1">{houseRooms.length} rooms total</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="p-6">
            {/* Search and Add Room */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2 flex-1 max-w-md">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search rooms..."
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                />
              </div>
              <button
                onClick={() => {
                  setSelectedRoom(null);
                  setFormType('room');
                  setShowForm(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Room</span>
              </button>
            </div>

            {/* Rooms Table - Same as rooms tab */}
            {filteredRooms.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {searchTerm ? 'No rooms found matching your search.' : 'No rooms assigned to this house yet.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Occupancy</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amenities</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredRooms.map((room) => (
                      <tr key={room.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{room.room_number}</div>
                          <div className="text-xs text-gray-500">{room.house?.name || 'Unknown'} - Floor {room.floor}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {room.current_occupancy} / {room.capacity}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(room.status)}`}>
                            {getStatusLabel(room.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {(room.amenities || []).map((amenity, idx) => (
                              <span key={idx} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                {amenity}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedRoom(room);
                                setFormType('room');
                                setShowForm(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRoom(room.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
              <Bed className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Total Rooms</div>
                <div className="text-2xl font-bold text-gray-800">{totalRooms}</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Boarding Students</div>
                <div className="text-2xl font-bold text-green-600">{totalStudents}</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Home className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Occupancy Rate</div>
                <div className="text-2xl font-bold text-purple-600">{occupancyRate}%</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Wrench className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Pending Maintenance</div>
                <div className="text-2xl font-bold text-orange-600">{pendingMaintenance}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 md:mb-3">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              {[
                { id: 'houses', label: 'Houses', icon: Building2 },
                { id: 'rooms', label: 'Rooms', icon: Bed },
                { id: 'students', label: 'Students', icon: Users },
                { id: 'maintenance', label: 'Maintenance', icon: Wrench },
                { id: 'visitors', label: 'Visitors', icon: UserCheck }
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
          {activeTab === 'houses' && (
            <div>
              {/* Search and Add House Button */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-2 flex-1 max-w-md">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search houses..."
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                  />
                </div>
                <button
                  onClick={() => {
                    setSelectedHouse(null);
                    setShowHouseForm(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add House</span>
                </button>
              </div>

              {/* Houses Card Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {houses.map((house) => (
                  <div key={house.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    {/* House Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{house.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{house.designation}</p>
                        {house.description && (
                          <p className="text-xs text-gray-500 mt-1">{house.description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedHouse(house);
                            setShowHouseForm(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteHouse(house.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* House Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Rooms</div>
                        <div className="text-lg font-bold text-gray-900">{house.total_rooms || 0}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Capacity</div>
                        <div className="text-lg font-bold text-gray-900">{house.total_capacity || 0}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Occupied</div>
                        <div className="text-lg font-bold text-gray-900">{house.current_occupancy || 0}</div>
                      </div>
                    </div>

                    {/* View Rooms Button */}
                    <button
                      onClick={() => {
                        setSelectedHouseForRooms(house);
                        setShowRoomsList(true);
                      }}
                      className="w-full mb-4 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 flex items-center justify-center space-x-2 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Rooms ({house.total_rooms || 0})</span>
                    </button>

                    {/* Amenities */}
                    <div className="mb-4">
                      <div className="text-sm font-semibold text-gray-700 mb-2">Amenities</div>
                      <div className="flex flex-wrap gap-2">
                        {(house.amenities || []).map((amenity, idx) => (
                          <span key={idx} className="inline-flex px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-lg">
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Personnel */}
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-2">Personnel in Charge</div>
                      <div className="space-y-2">
                        {(house.personnel || []).map((person) => (
                          <div key={person.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">{person.name}</div>
                              <div className="text-xs text-gray-600">{person.designation}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'rooms' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search rooms..."
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => {
                    setFormType('room');
                    setShowForm(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Room</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Occupancy</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amenities</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {rooms.map((room) => (
                      <tr key={room.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{room.room_number}</div>
                          <div className="text-xs text-gray-500">{room.house?.name || 'Unknown'} - Floor {room.floor}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {room.current_occupancy} / {room.capacity}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(room.status)}`}>
                            {getStatusLabel(room.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {(room.amenities || []).map((amenity, idx) => (
                              <span key={idx} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                {amenity}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedRoom(room);
                                setFormType('room');
                                setShowForm(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRoom(room.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
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

          {activeTab === 'students' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => {
                    setFormType('student');
                    setShowForm(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Assign Student</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-in</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Accommodation Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {boardingStudents.map((student) => (
                      <tr key={student.admission_number} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-xs text-gray-500">{student.admission_number} - {student.current_class?.name || '-'}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {student.boarding_house?.name || 'Unassigned'} - {student.boarding_room?.room_number || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {student.check_in_date ? formatDate(student.check_in_date) : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAccommodationTypeColor(student.accommodation_type?.name)}`}>
                            {student.accommodation_type?.name || 'Unassigned'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedStudentForEdit(student);
                                setFormType('student');
                                setShowForm(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
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
                    placeholder="Search maintenance..."
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
                  <span>New Request</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reported</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {maintenanceRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{req.roomNumber}</div>
                          <div className="text-xs text-gray-500">{req.building}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{req.issue}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(req.reportedDate)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(req.priority)} capitalize`}>
                            {req.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{req.assignedTo}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(req.status)} capitalize`}>
                            {req.status.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setFormType('maintenance');
                                setShowForm(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
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

          {activeTab === 'visitors' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search visitors..."
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => {
                    setFormType('visitor');
                    setShowForm(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Visitor</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visitor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visit Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {visitors.map((visitor) => (
                      <tr key={visitor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{visitor.visitorName}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{visitor.studentName}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{visitor.roomNumber}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(visitor.visitDate)} at {visitor.visitTime}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{visitor.purpose}</td>
                        <td className="px-6 py-4">
                          {visitor.checkedOut ? (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Checked Out
                            </span>
                          ) : visitor.checkedIn ? (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              Checked In
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setFormType('visitor');
                                setShowForm(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
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
        </div>

        {showForm && renderForm()}
        {showHouseForm && <HouseForm />}
        {showAccommodationTypesModal && <AccommodationTypesModal />}
        
        {/* Rooms List Modal */}
        {showRoomsList && selectedHouseForRooms && (
          <RoomsListModal 
            house={selectedHouseForRooms}
            rooms={rooms.filter(r => r.house_id === selectedHouseForRooms.id)}
            onClose={() => {
              setShowRoomsList(false);
              setSelectedHouseForRooms(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

