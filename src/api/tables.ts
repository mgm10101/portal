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

export const deleteClass = async (id: number) => {
  const { error } = await supabase.from('classes').delete().eq('id', id);
  if (error) throw new Error(error.message);
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

export const deleteStream = async (id: number) => {
  const { error } = await supabase.from('streams').delete().eq('id', id);
  if (error) throw new Error(error.message);
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

export const deleteColour = async (id: number) => {
  const { error } = await supabase.from('team_colours').delete().eq('id', id);
  if (error) throw new Error(error.message);
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