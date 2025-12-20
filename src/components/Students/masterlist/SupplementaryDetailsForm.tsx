// src/components/Students/masterlist/SupplementaryDetailsForm.tsx

import React, { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2, Copy } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { CustomFields } from './CustomFields';
import { DynamicDocuments } from './DynamicDocuments';
import { DropdownField, DropdownItem } from './DropdownField';

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
  onOpenAllergiesModal?: () => void;
  onOpenMedicalConditionsModal?: () => void;
  onOpenEmergencyMedicationsModal?: () => void;
  clearIfInvalid?: (e: React.FocusEvent<HTMLSelectElement>, validList: string[]) => void;
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
  onOpenAllergiesModal = () => {},
  onOpenMedicalConditionsModal = () => {},
  onOpenEmergencyMedicationsModal = () => {},
  clearIfInvalid = () => {},
}) => {
  // Medical section state - using arrays to support multiple entries
  interface MedicalEntry {
    id: string; // Unique ID for this entry
    itemId?: number; // Selected dropdown item ID
    notes: string; // Notes for this entry
  }

  const [hasAllergies, setHasAllergies] = useState<boolean>(false);
  const [hasMedicalCondition, setHasMedicalCondition] = useState<boolean>(false);
  const [hasEmergencyMedication, setHasEmergencyMedication] = useState<boolean>(false);
  
  const [allergies, setAllergies] = useState<MedicalEntry[]>([]);
  const [medicalConditions, setMedicalConditions] = useState<MedicalEntry[]>([]);
  const [emergencyMedications, setEmergencyMedications] = useState<MedicalEntry[]>([]);
  
  // Fetch medical dropdown options from database
  const fetchAllergies = async (): Promise<DropdownItem[]> => {
    try {
      const { data, error } = await supabase
        .from('allergies')
        .select('id, name')
        .order('sort_order', { ascending: true, nullsLast: true })
        .order('id', { ascending: true });
      
      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          return [];
        }
        throw error;
      }
      
      return (data || []).map((item: any) => ({ id: item.id, name: item.name }));
    } catch (err) {
      console.error('Error fetching allergies:', err);
      return [];
    }
  };

  const fetchMedicalConditions = async (): Promise<DropdownItem[]> => {
    try {
      const { data, error } = await supabase
        .from('medical_conditions')
        .select('id, name')
        .order('sort_order', { ascending: true, nullsLast: true })
        .order('id', { ascending: true });
      
      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          return [];
        }
        throw error;
      }
      
      return (data || []).map((item: any) => ({ id: item.id, name: item.name }));
    } catch (err) {
      console.error('Error fetching medical conditions:', err);
      return [];
    }
  };

  const fetchEmergencyMedications = async (): Promise<DropdownItem[]> => {
    try {
      const { data, error } = await supabase
        .from('emergency_medications')
        .select('id, name')
        .order('sort_order', { ascending: true, nullsLast: true })
        .order('id', { ascending: true });
      
      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          return [];
        }
        throw error;
      }
      
      return (data || []).map((item: any) => ({ id: item.id, name: item.name }));
    } catch (err) {
      console.error('Error fetching emergency medications:', err);
      return [];
    }
  };

  // Use React Query to fetch medical dropdown options
  const { data: allergiesList = [] } = useQuery({
    queryKey: ['allergies'],
    queryFn: fetchAllergies,
  });

  const { data: medicalConditionsList = [] } = useQuery({
    queryKey: ['medical_conditions'],
    queryFn: fetchMedicalConditions,
  });

  const { data: emergencyMedicationsList = [] } = useQuery({
    queryKey: ['emergency_medications'],
    queryFn: fetchEmergencyMedications,
  });

  // Helper function to generate unique ID
  const generateId = () => `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add new entry functions
  const addAllergy = () => {
    setAllergies([...allergies, { id: generateId(), itemId: undefined, notes: '' }]);
  };

  const addMedicalCondition = () => {
    setMedicalConditions([...medicalConditions, { id: generateId(), itemId: undefined, notes: '' }]);
  };

  const addEmergencyMedication = () => {
    setEmergencyMedications([...emergencyMedications, { id: generateId(), itemId: undefined, notes: '' }]);
  };

  // Remove entry functions
  const removeAllergy = (id: string) => {
    setAllergies(allergies.filter(entry => entry.id !== id));
  };

  const removeMedicalCondition = (id: string) => {
    setMedicalConditions(medicalConditions.filter(entry => entry.id !== id));
  };

  const removeEmergencyMedication = (id: string) => {
    setEmergencyMedications(emergencyMedications.filter(entry => entry.id !== id));
  };

  // Update entry functions
  const updateAllergy = (id: string, updates: Partial<MedicalEntry>) => {
    setAllergies(allergies.map(entry => 
      entry.id === id ? { ...entry, ...updates } : entry
    ));
  };

  const updateMedicalCondition = (id: string, updates: Partial<MedicalEntry>) => {
    setMedicalConditions(medicalConditions.map(entry => 
      entry.id === id ? { ...entry, ...updates } : entry
    ));
  };

  const updateEmergencyMedication = (id: string, updates: Partial<MedicalEntry>) => {
    setEmergencyMedications(emergencyMedications.map(entry => 
      entry.id === id ? { ...entry, ...updates } : entry
    ));
  };

  // Fetch and initialize medical data from database
  useEffect(() => {
    const loadMedicalData = async () => {
      if (!selectedStudent?.admission_number) {
        // Reset if no student selected
        setHasAllergies(false);
        setHasMedicalCondition(false);
        setHasEmergencyMedication(false);
        setAllergies([]);
        setMedicalConditions([]);
        setEmergencyMedications([]);
        return;
      }

      try {
        // Fetch allergies
        const { data: allergiesData, error: allergiesError } = await supabase
          .from('student_allergies')
          .select('id, allergy_id, notes')
          .eq('admission_number', selectedStudent.admission_number);

        if (!allergiesError && allergiesData && allergiesData.length > 0) {
          setHasAllergies(true);
          setAllergies(
            allergiesData.map((item: any) => ({
              id: `db_${item.id}`,
              itemId: item.allergy_id,
              notes: item.notes || '',
            }))
          );
        } else {
          setHasAllergies(false);
          setAllergies([]);
        }

        // Fetch medical conditions
        const { data: conditionsData, error: conditionsError } = await supabase
          .from('student_medical_conditions')
          .select('id, medical_condition_id, notes')
          .eq('admission_number', selectedStudent.admission_number);

        if (!conditionsError && conditionsData && conditionsData.length > 0) {
          setHasMedicalCondition(true);
          setMedicalConditions(
            conditionsData.map((item: any) => ({
              id: `db_${item.id}`,
              itemId: item.medical_condition_id,
              notes: item.notes || '',
            }))
          );
        } else {
          setHasMedicalCondition(false);
          setMedicalConditions([]);
        }

        // Fetch emergency medications
        const { data: medicationsData, error: medicationsError } = await supabase
          .from('student_emergency_medications')
          .select('id, emergency_medication_id, notes')
          .eq('admission_number', selectedStudent.admission_number);

        if (!medicationsError && medicationsData && medicationsData.length > 0) {
          setHasEmergencyMedication(true);
          setEmergencyMedications(
            medicationsData.map((item: any) => ({
              id: `db_${item.id}`,
              itemId: item.emergency_medication_id,
              notes: item.notes || '',
            }))
          );
        } else {
          setHasEmergencyMedication(false);
          setEmergencyMedications([]);
        }
      } catch (err) {
        console.error('Error loading medical data:', err);
        // Reset on error
        setHasAllergies(false);
        setHasMedicalCondition(false);
        setHasEmergencyMedication(false);
        setAllergies([]);
        setMedicalConditions([]);
        setEmergencyMedications([]);
      }
    };

    loadMedicalData();
  }, [selectedStudent?.admission_number]);
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

  // Refs for emergency contact fields to enable programmatic updates
  const emergencyContactNameRef = useRef<HTMLInputElement>(null);
  const emergencyContactPhoneRef = useRef<HTMLInputElement>(null);
  const emergencyRelationshipRef = useRef<HTMLInputElement>(null);
  return (
    <>
      {/* Hidden inputs for medical data */}
      <input
        type="hidden"
        name="allergies_data"
        value={JSON.stringify(allergies)}
      />
      <input
        type="hidden"
        name="medical_conditions_data"
        value={JSON.stringify(medicalConditions)}
      />
      <input
        type="hidden"
        name="emergency_medications_data"
        value={JSON.stringify(emergencyMedications)}
      />
      
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
          Emergency Contact
        </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Quick fill:</span>
            <button
              type="button"
              onClick={() => {
                const form = document.querySelector('form') as HTMLFormElement;
                if (form && emergencyContactNameRef.current && emergencyContactPhoneRef.current) {
                  const motherNameInput = form.querySelector('[name="motherName"]') as HTMLInputElement;
                  const motherPhoneInput = form.querySelector('[name="motherPhone"]') as HTMLInputElement;
                  
                  if (motherNameInput && motherPhoneInput) {
                    const motherName = motherNameInput.value.trim();
                    const motherPhone = motherPhoneInput.value.trim();
                    
                    if (motherName || motherPhone) {
                      if (emergencyContactNameRef.current) {
                        emergencyContactNameRef.current.value = motherName;
                        emergencyContactNameRef.current.dispatchEvent(new Event('input', { bubbles: true }));
                      }
                      if (emergencyContactPhoneRef.current) {
                        emergencyContactPhoneRef.current.value = motherPhone;
                        emergencyContactPhoneRef.current.dispatchEvent(new Event('input', { bubbles: true }));
                      }
                      if (emergencyRelationshipRef.current) {
                        emergencyRelationshipRef.current.value = 'Mother';
                        emergencyRelationshipRef.current.dispatchEvent(new Event('input', { bubbles: true }));
                      }
                    }
                  }
                }
              }}
              disabled={isDisabled}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors ${
                isDisabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Fill from Mother/Guardian details"
            >
              <Copy className="w-3 h-3" />
              Mother
            </button>
            <button
              type="button"
              onClick={() => {
                const form = document.querySelector('form') as HTMLFormElement;
                if (form && emergencyContactNameRef.current && emergencyContactPhoneRef.current) {
                  const fatherNameInput = form.querySelector('[name="fatherName"]') as HTMLInputElement;
                  const fatherPhoneInput = form.querySelector('[name="fatherPhone"]') as HTMLInputElement;
                  
                  if (fatherNameInput && fatherPhoneInput) {
                    const fatherName = fatherNameInput.value.trim();
                    const fatherPhone = fatherPhoneInput.value.trim();
                    
                    if (fatherName || fatherPhone) {
                      if (emergencyContactNameRef.current) {
                        emergencyContactNameRef.current.value = fatherName;
                        emergencyContactNameRef.current.dispatchEvent(new Event('input', { bubbles: true }));
                      }
                      if (emergencyContactPhoneRef.current) {
                        emergencyContactPhoneRef.current.value = fatherPhone;
                        emergencyContactPhoneRef.current.dispatchEvent(new Event('input', { bubbles: true }));
                      }
                      if (emergencyRelationshipRef.current) {
                        emergencyRelationshipRef.current.value = 'Father';
                        emergencyRelationshipRef.current.dispatchEvent(new Event('input', { bubbles: true }));
                      }
                    }
                  }
                }
              }}
              disabled={isDisabled}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors ${
                isDisabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Fill from Father/Guardian details"
            >
              <Copy className="w-3 h-3" />
              Father
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              ref={emergencyContactNameRef}
              name="emergencyContactName"
              type="text"
              placeholder="Contact Name"
              autoComplete="off"
              disabled={isDisabled}
              className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              defaultValue={(() => {
                // Parse existing emergency_contact to extract name (text part)
                if (!selectedStudent?.emergency_contact) return '';
                const contact = selectedStudent.emergency_contact.trim();
                
                // First, try to find where phone part starts (first occurrence of digit or phone symbol)
                const phoneStartMatch = contact.match(/[\d\+\-\(\)]/);
                if (phoneStartMatch && phoneStartMatch.index !== undefined) {
                  // Phone part exists, extract name before it
                  const name = contact.substring(0, phoneStartMatch.index).trim();
                  return name;
                }
                
                // No phone part found - check if entire string is text (name only)
                const isAllText = /^[A-Za-z\s]+$/.test(contact);
                if (isAllText) {
                  return contact;
                }
                
                // Fallback: if string contains mixed content, try to extract text at start
                const textMatch = contact.match(/^([A-Za-z\s]+)/);
                return textMatch ? textMatch[1].trim() : '';
              })()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              ref={emergencyContactPhoneRef}
              name="emergencyContactPhone"
              type="tel"
              placeholder="Phone Number"
              autoComplete="off"
              disabled={isDisabled}
              className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              defaultValue={(() => {
                // Parse existing emergency_contact to extract phone (numbers and symbols)
                if (!selectedStudent?.emergency_contact) return '';
                const contact = selectedStudent.emergency_contact.trim();
                
                // Find where phone part starts (first occurrence of digit or phone symbol)
                const phoneStartMatch = contact.match(/[\d\+\-\(\)]/);
                if (phoneStartMatch && phoneStartMatch.index !== undefined) {
                  // Extract phone part from that position to the end
                  const phone = contact.substring(phoneStartMatch.index).trim();
                  return phone;
                }
                
                // No phone part found - check if entire string is numbers/symbols (phone only)
                const isAllPhone = /^[\d\+\-\(\)\s]+$/.test(contact);
                if (isAllPhone) {
                  return contact;
                }
                
                // No phone part found
                return '';
              })()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relationship to Student
            </label>
            <input
              ref={emergencyRelationshipRef}
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

      {/* Medical Section */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Medical
        </h3>
        <div className="space-y-4">
          {/* Checkbox (a) Has Allergies */}
          <div className="flex items-start">
            <input
              type="checkbox"
              id="hasAllergies"
              checked={hasAllergies}
              onChange={(e) => {
                setHasAllergies(e.target.checked);
                if (e.target.checked && allergies.length === 0) {
                  addAllergy();
                } else if (!e.target.checked) {
                  setAllergies([]);
                }
              }}
              disabled={isDisabled}
              className={`mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${
                isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
              }`}
            />
            <label htmlFor="hasAllergies" className={`ml-2 text-sm font-medium text-gray-700 ${
              isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
            }`}>
              (a) Has Allergies
            </label>
          </div>
          {hasAllergies && (
            <div className="ml-6 space-y-4 mb-4">
              {allergies.map((allergy, index) => (
                <div key={allergy.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <div>
                    <DropdownField
                      name={`allergy_${allergy.id}`}
                      label={index === 0 ? "Allergy" : ""}
                      items={allergiesList}
                      selectedId={allergy.itemId}
                      clearIfInvalid={clearIfInvalid}
                      onOpenModal={onOpenAllergiesModal}
                      onSelect={(id) => updateAllergy(allergy.id, { itemId: id })}
                      tableName="allergies"
                      placeholder="Select allergy..."
                      disabled={isDisabled}
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {index === 0 ? "Notes" : ""}
                      </label>
                      <input
                        type="text"
                        name={`allergy_notes_${allergy.id}`}
                        value={allergy.notes}
                        onChange={(e) => updateAllergy(allergy.id, { notes: e.target.value })}
                        placeholder="Enter details about the allergy..."
                        disabled={isDisabled}
                        className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>
                    {allergies.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAllergy(allergy.id)}
                        disabled={isDisabled}
                        className={`mt-6 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ${
                          isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        title="Remove this allergy"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addAllergy}
                disabled={isDisabled}
                className={`flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium ${
                  isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Plus className="w-4 h-4" />
                Add Another Allergy
              </button>
            </div>
          )}

          {/* Checkbox (b) Has Medical Condition */}
          <div className="flex items-start">
            <input
              type="checkbox"
              id="hasMedicalCondition"
              checked={hasMedicalCondition}
              onChange={(e) => {
                setHasMedicalCondition(e.target.checked);
                if (e.target.checked && medicalConditions.length === 0) {
                  addMedicalCondition();
                } else if (!e.target.checked) {
                  setMedicalConditions([]);
                }
              }}
              disabled={isDisabled}
              className={`mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${
                isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
              }`}
            />
            <label htmlFor="hasMedicalCondition" className={`ml-2 text-sm font-medium text-gray-700 ${
              isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
            }`}>
              (b) Currently managing a chronic medical condition e.g. diabetes, sickle cell
            </label>
          </div>
          {hasMedicalCondition && (
            <div className="ml-6 space-y-4 mb-4">
              {medicalConditions.map((condition, index) => (
                <div key={condition.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <div>
                    <DropdownField
                      name={`medical_condition_${condition.id}`}
                      label={index === 0 ? "Medical Condition" : ""}
                      items={medicalConditionsList}
                      selectedId={condition.itemId}
                      clearIfInvalid={clearIfInvalid}
                      onOpenModal={onOpenMedicalConditionsModal}
                      onSelect={(id) => updateMedicalCondition(condition.id, { itemId: id })}
                      tableName="medical_conditions"
                      placeholder="Select medical condition..."
                      disabled={isDisabled}
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {index === 0 ? "Notes" : ""}
                      </label>
                      <input
                        type="text"
                        name={`medical_condition_notes_${condition.id}`}
                        value={condition.notes}
                        onChange={(e) => updateMedicalCondition(condition.id, { notes: e.target.value })}
                        placeholder="Enter details about the medical condition..."
                        disabled={isDisabled}
                        className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>
                    {medicalConditions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedicalCondition(condition.id)}
                        disabled={isDisabled}
                        className={`mt-6 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ${
                          isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        title="Remove this medical condition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addMedicalCondition}
                disabled={isDisabled}
                className={`flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium ${
                  isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Plus className="w-4 h-4" />
                Add Another Medical Condition
              </button>
            </div>
          )}

          {/* Checkbox (c) Has Emergency Medication */}
          <div className="flex items-start">
            <input
              type="checkbox"
              id="hasEmergencyMedication"
              checked={hasEmergencyMedication}
              onChange={(e) => {
                setHasEmergencyMedication(e.target.checked);
                if (e.target.checked && emergencyMedications.length === 0) {
                  addEmergencyMedication();
                } else if (!e.target.checked) {
                  setEmergencyMedications([]);
                }
              }}
              disabled={isDisabled}
              className={`mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${
                isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
              }`}
            />
            <label htmlFor="hasEmergencyMedication" className={`ml-2 text-sm font-medium text-gray-700 ${
              isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
            }`}>
              (c) Emergency Medication prescribed e.g. Epipen, Asthma Inhaler
            </label>
          </div>
          {hasEmergencyMedication && (
            <div className="ml-6 space-y-4">
              {emergencyMedications.map((medication, index) => (
                <div key={medication.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <div>
                    <DropdownField
                      name={`emergency_medication_${medication.id}`}
                      label={index === 0 ? "Emergency Medication" : ""}
                      items={emergencyMedicationsList}
                      selectedId={medication.itemId}
                      clearIfInvalid={clearIfInvalid}
                      onOpenModal={onOpenEmergencyMedicationsModal}
                      onSelect={(id) => updateEmergencyMedication(medication.id, { itemId: id })}
                      tableName="emergency_medications"
                      placeholder="Select emergency medication..."
                      disabled={isDisabled}
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {index === 0 ? "Notes" : ""}
                      </label>
                      <input
                        type="text"
                        name={`emergency_medication_notes_${medication.id}`}
                        value={medication.notes}
                        onChange={(e) => updateEmergencyMedication(medication.id, { notes: e.target.value })}
                        placeholder="Enter details about the emergency medication..."
                        disabled={isDisabled}
                        className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>
                    {emergencyMedications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEmergencyMedication(medication.id)}
                        disabled={isDisabled}
                        className={`mt-6 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ${
                          isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        title="Remove this emergency medication"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addEmergencyMedication}
                disabled={isDisabled}
                className={`flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium ${
                  isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Plus className="w-4 h-4" />
                Add Another Emergency Medication
              </button>
            </div>
          )}
        </div>
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
