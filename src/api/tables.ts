// src/api/tables.ts

// CORRECTED PATH: '../supabaseClient'
import { supabase } from '../supabaseClient'; 

// --- Generic Fetchers ---

export const fetchClasses = async () => {
  const { data, error } = await supabase.from('classes').select('id, name');
  if (error) throw new Error(error.message);
  return data;
};

export const fetchStreams = async () => {
  const { data, error } = await supabase.from('streams').select('id, name');
  if (error) throw new Error(error.message);
  return data;
};

export const fetchTeamColours = async () => {
  const { data, error } = await supabase.from('team_colours').select('id, name');
  if (error) throw new Error(error.message);
  return data;
};

// --- Classes Mutations ---

export const addClass = async (name: string) => {
  const { error } = await supabase.from('classes').insert({ name });
  if (error) throw new Error(error.message);
};

export const deleteClass = async (id: number) => {
  const { error } = await supabase.from('classes').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

// --- Streams Mutations ---

export const addStream = async (name: string) => {
  const { error } = await supabase.from('streams').insert({ name });
  if (error) throw new Error(error.message);
};

export const deleteStream = async (id: number) => {
  const { error } = await supabase.from('streams').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

// --- Team Colours Mutations ---

export const addColour = async (name: string) => {
  const { error } = await supabase.from('team_colours').insert({ name });
  if (error) throw new Error(error.message);
};

export const deleteColour = async (id: number) => {
  const { error } = await supabase.from('team_colours').delete().eq('id', id);
  if (error) throw new Error(error.message);
};