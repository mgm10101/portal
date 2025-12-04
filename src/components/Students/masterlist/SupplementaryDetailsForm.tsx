// src/components/Students/masterlist/SupplementaryDetailsForm.tsx

import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../supabaseClient';
import { CustomFields } from './CustomFields';
import { DynamicDocuments } from './DynamicDocuments';

interface SupplementaryDetailsFormProps {
  selectedStudent: any;
  onShowAddField: () => void;
  customFieldValues?: Record<string, string>;
  onCustomFieldsChange?: (v: Record<string, string>) => void;
  documentValues?: Record<string, string>;
  onDocumentsChange?: (v: Record<string, string>) => void;
  transportZoneId?: number;
  setTransportZoneId?: (id: number) => void;
  transportTypeId?: number;
  setTransportTypeId?: (id: number) => void;
  boardingHouseId?: number;
  setBoardingHouseId?: (id: number) => void;
  boardingRoomId?: number;
  setBoardingRoomId?: (id: number) => void;
  accommodationTypeId?: number;
  setAccommodationTypeId?: (id: number) => void;
  isDisabled?: boolean; // Disable all fields when student is inactive
}

export const SupplementaryDetailsForm: React.FC<SupplementaryDetailsFormProps> = ({
  selectedStudent,
  onShowAddField,
  customFieldValues = {},
  onCustomFieldsChange,
  documentValues = {},
  onDocumentsChange,
  transportZoneId,
  setTransportZoneId,
  transportTypeId,
  setTransportTypeId,
  boardingHouseId,
  setBoardingHouseId,
  boardingRoomId,
  setBoardingRoomId,
  accommodationTypeId,
  setAccommodationTypeId,
  isDisabled = false,
}) => {
  // Fetch transport zones
  const fetchTransportZones = async (): Promise<DropdownItem[]> => {
    try {
      const { data, error } = await supabase
        .from('transport_zones')
        .select('id, name')
        .order('name');
      
      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          return [];
        }
        throw error;
      }
      
      return (data || []).map((zone: any) => ({ id: zone.id, name: zone.name }));
    } catch (err) {
      console.error('Error fetching transport zones:', err);
      return [];
    }
  };

  // Fetch transport types
  const fetchTransportTypes = async (): Promise<DropdownItem[]> => {
    try {
      const { data, error } = await supabase
        .from('transport_types')
        .select('id, name, sort_order')
        .order('sort_order', { ascending: true, nullsLast: true })
        .order('id', { ascending: true });
      
      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          return [];
        }
        throw error;
      }
      
      return (data || []).map((type: any) => ({ id: type.id, name: type.name }));
    } catch (err) {
      console.error('Error fetching transport types:', err);
      return [];
    }
  };

  const { data: transportZones = [] } = useQuery({
    queryKey: ['transport_zones'],
    queryFn: fetchTransportZones,
    staleTime: 30000,
  });

  const { data: transportTypes = [] } = useQuery({
    queryKey: ['transport_types'],
    queryFn: fetchTransportTypes,
    staleTime: 30000,
  });

  // Fetch boarding houses
  const fetchBoardingHouses = async (): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('boarding_houses')
        .select('id, name')
        .order('name');
      
      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          return [];
        }
        throw error;
      }
      
      return (data || []).map((house: any) => ({ id: house.id, name: house.name }));
    } catch (err) {
      console.error('Error fetching boarding houses:', err);
      return [];
    }
  };

  // Fetch boarding rooms (filtered by house if house is selected)
  const fetchBoardingRooms = async (): Promise<any[]> => {
    try {
      let query = supabase
        .from('boarding_rooms')
        .select('id, room_number, house_id')
        .order('room_number');
      
      // Filter by house if one is selected
      if (boardingHouseId) {
        query = query.eq('house_id', boardingHouseId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          return [];
        }
        throw error;
      }
      
      return (data || []).map((room: any) => ({ 
        id: room.id, 
        name: room.room_number,
        house_id: room.house_id
      }));
    } catch (err) {
      console.error('Error fetching boarding rooms:', err);
      return [];
    }
  };

  // Fetch accommodation types
  const fetchAccommodationTypes = async (): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('boarding_accommodation_types')
        .select('id, name')
        .order('name');
      
      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          return [];
        }
        throw error;
      }
      
      return (data || []).map((type: any) => ({ id: type.id, name: type.name }));
    } catch (err) {
      console.error('Error fetching accommodation types:', err);
      return [];
    }
  };

  const { data: boardingHouses = [] } = useQuery({
    queryKey: ['boarding_houses'],
    queryFn: fetchBoardingHouses,
    staleTime: 30000,
  });

  const { data: boardingRooms = [] } = useQuery({
    queryKey: ['boarding_rooms', boardingHouseId],
    queryFn: fetchBoardingRooms,
    staleTime: 30000,
  });

  const { data: accommodationTypes = [] } = useQuery({
    queryKey: ['boarding_accommodation_types'],
    queryFn: fetchAccommodationTypes,
    staleTime: 30000,
  });

  // Set "Two way" as default transport type if not set
  useEffect(() => {
    if (!transportTypeId && transportTypes.length > 0 && !selectedStudent?.transport_type_id) {
      const twoWayType = transportTypes.find((type: any) => 
        type.name.toLowerCase() === 'two way' || type.name.toLowerCase() === 'two-way'
      );
      if (twoWayType && setTransportTypeId) {
        setTransportTypeId(twoWayType.id);
      }
    }
  }, [transportTypes, transportTypeId, selectedStudent, setTransportTypeId]);

  // Clear room selection if house changes and selected room is not in the new house
  useEffect(() => {
    if (boardingHouseId && boardingRoomId && boardingRooms.length > 0) {
      const roomExists = boardingRooms.some((room: any) => room.id === boardingRoomId);
      if (!roomExists && setBoardingRoomId) {
        setBoardingRoomId(undefined);
      }
    } else if (!boardingHouseId && setBoardingRoomId) {
      // Clear room if house is cleared
      setBoardingRoomId(undefined);
    }
  }, [boardingHouseId, boardingRoomId, boardingRooms, setBoardingRoomId]);
  return (
    <>
      {/* Parent/Guardian Details */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Parent/Guardian Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Father/Guardian</h4>
            <div className="space-y-3">
              <input
                name="fatherName"
                type="text"
                placeholder="Name"
                disabled={isDisabled}
                className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                defaultValue={selectedStudent?.father_name}
              />
              <input
                name="fatherPhone"
                type="tel"
                placeholder="Phone Number"
                disabled={isDisabled}
                className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                defaultValue={selectedStudent?.father_phone}
              />
              <input
                name="fatherEmail"
                type="email"
                placeholder="Email Address"
                disabled={isDisabled}
                className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                defaultValue={selectedStudent?.father_email}
              />
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Mother/Guardian</h4>
            <div className="space-y-3">
              <input
                name="motherName"
                type="text"
                placeholder="Name"
                disabled={isDisabled}
                className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                defaultValue={selectedStudent?.mother_name}
              />
              <input
                name="motherPhone"
                type="tel"
                placeholder="Phone Number"
                disabled={isDisabled}
                className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                defaultValue={selectedStudent?.mother_phone}
              />
              <input
                name="motherEmail"
                type="email"
                placeholder="Email Address"
                disabled={isDisabled}
                className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                defaultValue={selectedStudent?.mother_email}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Emergency Contact
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Person & Phone
            </label>
            <input
              name="emergencyContact"
              type="text"
              placeholder="Name - Phone Number"
              disabled={isDisabled}
              className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              defaultValue={selectedStudent?.emergency_contact}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relationship to Student
            </label>
            <input
              name="emergencyRelationship"
              type="text"
              placeholder="Relationship"
              disabled={isDisabled}
              className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              defaultValue={selectedStudent?.emergency_relationship}
            />
          </div>
        </div>
      </div>

      {/* Dynamic Documents */}
      <DynamicDocuments
        selectedStudent={selectedStudent}
        values={selectedStudent?.documents || documentValues}
        onChange={(v) => onDocumentsChange?.(v)}
        isDisabled={isDisabled}
      />

      {/* Address */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Address
        </h3>
        <textarea
          name="address"
          rows={3}
          disabled={isDisabled}
          className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
          defaultValue={selectedStudent?.address}
        />
      </div>

      {/* Transport Section */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Transport
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zone
            </label>
            <select
              name="transport_zone_id"
              value={transportZoneId || ''}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : undefined;
                setTransportZoneId?.(value);
              }}
              disabled={isDisabled}
              className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            >
              <option value="">Select zone...</option>
              {transportZones.map((zone: any) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transport Type
            </label>
            <select
              name="transport_type_id"
              value={transportTypeId || ''}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : undefined;
                setTransportTypeId?.(value);
              }}
              disabled={isDisabled}
              className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            >
              <option value="">Select transport type...</option>
              {transportTypes.map((type: any) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Accommodation Section */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Accommodation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              House
            </label>
            <select
              name="boarding_house_id"
              value={boardingHouseId || ''}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : undefined;
                setBoardingHouseId?.(value);
              }}
              disabled={isDisabled}
              className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            >
              <option value="">Select house...</option>
              {boardingHouses.map((house: any) => (
                <option key={house.id} value={house.id}>
                  {house.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Room
            </label>
            <select
              name="boarding_room_id"
              value={boardingRoomId || ''}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : undefined;
                setBoardingRoomId?.(value);
              }}
              disabled={isDisabled || !boardingHouseId}
              className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDisabled || !boardingHouseId ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            >
              <option value="">{boardingHouseId ? 'Select room...' : 'Select house first...'}</option>
              {boardingRooms.map((room: any) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Accommodation Type
            </label>
            <select
              name="accommodation_type_id"
              value={accommodationTypeId || ''}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : undefined;
                setAccommodationTypeId?.(value);
              }}
              disabled={isDisabled}
              className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            >
              <option value="">Select accommodation type...</option>
              {accommodationTypes.map((type: any) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Custom Fields */}
      <CustomFields
        selectedStudent={selectedStudent}
        onShowAddField={onShowAddField}
        values={selectedStudent?.custom_fields || customFieldValues}
        onChange={(v) => onCustomFieldsChange?.(v)}
        isDisabled={isDisabled}
      />
    </>
  );
};
