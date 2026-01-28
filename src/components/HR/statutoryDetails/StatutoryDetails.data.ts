// src/components/HR/statutoryDetails/StatutoryDetails.data.ts
// @tag: Database operations and data fetching for Statutory Details.

import { supabase } from '../../../supabaseClient';
import { StatutoryField, DropdownOption } from './StatutoryDetails.types';

// Fetch all statutory fields
export const fetchAllStatutoryFields = async (): Promise<StatutoryField[]> => {
  const { data, error } = await supabase
    .from('statutory_fields')
    .select('*')
    .order('field_name');

  if (error) {
    console.error('Error fetching statutory fields:', error);
    return [];
  }

  return data || [];
};

// Fetch options for a dropdown field
export const fetchOptionsForField = async (fieldId: string): Promise<{ options: string[] }> => {
  const { data, error } = await supabase
    .from('statutory_fields')
    .select('options')
    .eq('field_id', fieldId)
    .single();

  if (error || !data) {
    console.error('Error fetching field options:', error);
    return { options: [] };
  }

  return { options: data.options || [] };
};

// Add option to dropdown field
export const addOptionToDb = async (fieldId: string, name: string): Promise<string[] | null> => {
  const { data: fieldData, error: fetchError } = await supabase
    .from('statutory_fields')
    .select('options')
    .eq('field_id', fieldId)
    .single();

  if (fetchError || !fieldData) {
    console.error('Error fetching field for option add:', fetchError);
    return null;
  }

  const currentOptions = fieldData.options || [];
  const updatedOptions = [...currentOptions, name];

  const { error: updateError } = await supabase
    .from('statutory_fields')
    .update({ options: updatedOptions })
    .eq('field_id', fieldId);

  if (updateError) {
    console.error('Error adding option:', updateError);
    return null;
  }

  return updatedOptions;
};

// Delete option from dropdown field
export const deleteOptionFromDb = async (fieldId: string, index: number): Promise<string[] | null> => {
  const { data: fieldData, error: fetchError } = await supabase
    .from('statutory_fields')
    .select('options')
    .eq('field_id', fieldId)
    .single();

  if (fetchError || !fieldData) {
    console.error('Error fetching field for option delete:', fetchError);
    return null;
  }

  const currentOptions = fieldData.options || [];
  const updatedOptions = currentOptions.filter((_, i) => i !== index);

  const { error: updateError } = await supabase
    .from('statutory_fields')
    .update({ options: updatedOptions })
    .eq('field_id', fieldId);

  if (updateError) {
    console.error('Error deleting option:', updateError);
    return null;
  }

  return updatedOptions;
};

// Delete field
export const deleteFieldFromDb = async (fieldId: string): Promise<void> => {
  const { error } = await supabase
    .from('statutory_fields')
    .delete()
    .eq('field_id', fieldId);

  if (error) {
    console.error('Error deleting field:', error);
    throw error;
  }
};
