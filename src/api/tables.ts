// src/api/tables.ts

// CORRECTED PATH: '../supabaseClient'
import { supabase } from '../supabaseClient'; 

// --- Generic Fetchers ---

export const fetchClasses = async () => {
  const { data, error } = await supabase
    .from('classes')
    .select('id, name, sort_order')
    .order('sort_order', { ascending: true, nullsLast: true })
    .order('id', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
};

export const fetchStreams = async () => {
  const { data, error } = await supabase
    .from('streams')
    .select('id, name, sort_order')
    .order('sort_order', { ascending: true, nullsLast: true })
    .order('id', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
};

export const fetchTeamColours = async () => {
  const { data, error } = await supabase
    .from('team_colours')
    .select('id, name, sort_order')
    .order('sort_order', { ascending: true, nullsLast: true })
    .order('id', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
};

// --- Classes Mutations ---

export const addClass = async (name: string) => {
  // Get the max sort_order and add 1
  const { data: maxData } = await supabase
    .from('classes')
    .select('sort_order')
    .order('sort_order', { ascending: false, nullsFirst: false })
    .limit(1);
  
  const nextOrder = maxData && maxData.length > 0 && maxData[0].sort_order !== null 
    ? maxData[0].sort_order + 1 
    : 0;
  
  const { error } = await supabase.from('classes').insert({ name, sort_order: nextOrder });
  if (error) throw new Error(error.message);
};

export const updateClass = async (id: number, name: string) => {
  const { error } = await supabase
    .from('classes')
    .update({ name })
    .eq('id', id);
  if (error) throw new Error(error.message);
};

export const deleteClass = async (id: number) => {
  const { error } = await supabase.from('classes').delete().eq('id', id);
  if (error) {
    // Check for foreign key constraint violation
    if (error.code === '23503' || error.message?.includes('foreign key') || error.message?.includes('violates foreign key')) {
      throw new Error('Cannot delete this class because it is being used by existing students. Please update those students first.');
    }
    throw new Error(error.message);
  }
};

// --- Streams Mutations ---

export const addStream = async (name: string) => {
  // Get the max sort_order and add 1
  const { data: maxData } = await supabase
    .from('streams')
    .select('sort_order')
    .order('sort_order', { ascending: false, nullsFirst: false })
    .limit(1);
  
  const nextOrder = maxData && maxData.length > 0 && maxData[0].sort_order !== null 
    ? maxData[0].sort_order + 1 
    : 0;
  
  const { error } = await supabase.from('streams').insert({ name, sort_order: nextOrder });
  if (error) throw new Error(error.message);
};

export const updateStream = async (id: number, name: string) => {
  const { error } = await supabase
    .from('streams')
    .update({ name })
    .eq('id', id);
  if (error) throw new Error(error.message);
};

export const deleteStream = async (id: number) => {
  const { error } = await supabase.from('streams').delete().eq('id', id);
  if (error) {
    // Check for foreign key constraint violation
    if (error.code === '23503' || error.message?.includes('foreign key') || error.message?.includes('violates foreign key')) {
      throw new Error('Cannot delete this stream because it is being used by existing students. Please update those students first.');
    }
    throw new Error(error.message);
  }
};

// --- Team Colours Mutations ---

export const addColour = async (name: string) => {
  // Get the max sort_order and add 1
  const { data: maxData } = await supabase
    .from('team_colours')
    .select('sort_order')
    .order('sort_order', { ascending: false, nullsFirst: false })
    .limit(1);
  
  const nextOrder = maxData && maxData.length > 0 && maxData[0].sort_order !== null 
    ? maxData[0].sort_order + 1 
    : 0;
  
  const { error } = await supabase.from('team_colours').insert({ name, sort_order: nextOrder });
  if (error) throw new Error(error.message);
};

export const updateColour = async (id: number, name: string) => {
  const { error } = await supabase
    .from('team_colours')
    .update({ name })
    .eq('id', id);
  if (error) throw new Error(error.message);
};

export const deleteColour = async (id: number) => {
  const { error } = await supabase.from('team_colours').delete().eq('id', id);
  if (error) {
    // Check for foreign key constraint violation
    if (error.code === '23503' || error.message?.includes('foreign key') || error.message?.includes('violates foreign key')) {
      throw new Error('Cannot delete this team colour because it is being used by existing students. Please update those students first.');
    }
    throw new Error(error.message);
  }
};

// --- Medical Dropdowns: Allergies ---

export const fetchAllergies = async () => {
  const { data, error } = await supabase
    .from('allergies')
    .select('id, name, sort_order')
    .order('sort_order', { ascending: true, nullsLast: true })
    .order('id', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
};

export const addAllergy = async (name: string) => {
  // Get the max sort_order and add 1
  const { data: maxData } = await supabase
    .from('allergies')
    .select('sort_order')
    .order('sort_order', { ascending: false, nullsFirst: false })
    .limit(1);
  
  const nextOrder = maxData && maxData.length > 0 && maxData[0].sort_order !== null 
    ? maxData[0].sort_order + 1 
    : 0;
  
  const { error } = await supabase.from('allergies').insert({ name, sort_order: nextOrder });
  if (error) throw new Error(error.message);
};

export const updateAllergy = async (id: number, name: string) => {
  const { error } = await supabase
    .from('allergies')
    .update({ name })
    .eq('id', id);
  if (error) throw new Error(error.message);
};

export const deleteAllergy = async (id: number) => {
  const { error } = await supabase.from('allergies').delete().eq('id', id);
  if (error) {
    // Check for foreign key constraint violation
    if (error.code === '23503' || error.message?.includes('foreign key') || error.message?.includes('violates foreign key')) {
      throw new Error('Cannot delete this allergy because it is being used by existing students. Please update those students first.');
    }
    throw new Error(error.message);
  }
};

// --- Medical Dropdowns: Medical Conditions ---

export const fetchMedicalConditions = async () => {
  const { data, error } = await supabase
    .from('medical_conditions')
    .select('id, name, sort_order')
    .order('sort_order', { ascending: true, nullsLast: true })
    .order('id', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
};

export const addMedicalCondition = async (name: string) => {
  // Get the max sort_order and add 1
  const { data: maxData } = await supabase
    .from('medical_conditions')
    .select('sort_order')
    .order('sort_order', { ascending: false, nullsFirst: false })
    .limit(1);
  
  const nextOrder = maxData && maxData.length > 0 && maxData[0].sort_order !== null 
    ? maxData[0].sort_order + 1 
    : 0;
  
  const { error } = await supabase.from('medical_conditions').insert({ name, sort_order: nextOrder });
  if (error) throw new Error(error.message);
};

export const updateMedicalCondition = async (id: number, name: string) => {
  const { error } = await supabase
    .from('medical_conditions')
    .update({ name })
    .eq('id', id);
  if (error) throw new Error(error.message);
};

export const deleteMedicalCondition = async (id: number) => {
  const { error } = await supabase.from('medical_conditions').delete().eq('id', id);
  if (error) {
    // Check for foreign key constraint violation
    if (error.code === '23503' || error.message?.includes('foreign key') || error.message?.includes('violates foreign key')) {
      throw new Error('Cannot delete this medical condition because it is being used by existing students. Please update those students first.');
    }
    throw new Error(error.message);
  }
};

// --- Medical Dropdowns: Emergency Medications ---

export const fetchEmergencyMedications = async () => {
  const { data, error } = await supabase
    .from('emergency_medications')
    .select('id, name, sort_order')
    .order('sort_order', { ascending: true, nullsLast: true })
    .order('id', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
};

export const addEmergencyMedication = async (name: string) => {
  // Get the max sort_order and add 1
  const { data: maxData } = await supabase
    .from('emergency_medications')
    .select('sort_order')
    .order('sort_order', { ascending: false, nullsFirst: false })
    .limit(1);
  
  const nextOrder = maxData && maxData.length > 0 && maxData[0].sort_order !== null 
    ? maxData[0].sort_order + 1 
    : 0;
  
  const { error } = await supabase.from('emergency_medications').insert({ name, sort_order: nextOrder });
  if (error) throw new Error(error.message);
};

export const updateEmergencyMedication = async (id: number, name: string) => {
  const { error } = await supabase
    .from('emergency_medications')
    .update({ name })
    .eq('id', id);
  if (error) throw new Error(error.message);
};

export const deleteEmergencyMedication = async (id: number) => {
  const { error } = await supabase.from('emergency_medications').delete().eq('id', id);
  if (error) {
    // Check for foreign key constraint violation
    if (error.code === '23503' || error.message?.includes('foreign key') || error.message?.includes('violates foreign key')) {
      throw new Error('Cannot delete this emergency medication because it is being used by existing students. Please update those students first.');
    }
    throw new Error(error.message);
  }
};

// --- Document Types ---

export const fetchDocumentTypes = async () => {
  const { data, error } = await supabase
    .from('document_types')
    .select('id, name, sort_order')
    .order('sort_order', { ascending: true, nullsLast: true })
    .order('id', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
};

export const addDocumentType = async (name: string) => {
  // Get the max sort_order and add 1
  const { data: maxData } = await supabase
    .from('document_types')
    .select('sort_order')
    .order('sort_order', { ascending: false, nullsFirst: false })
    .limit(1);
  
  const nextOrder = maxData && maxData.length > 0 && maxData[0].sort_order !== null 
    ? maxData[0].sort_order + 1 
    : 0;
  
  const { error } = await supabase.from('document_types').insert({ name, sort_order: nextOrder });
  if (error) throw new Error(error.message);
};

export const deleteDocumentType = async (id: number) => {
  const { error } = await supabase.from('document_types').delete().eq('id', id);
  if (error) throw new Error(error.message);
};