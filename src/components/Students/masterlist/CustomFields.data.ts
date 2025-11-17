// src/components/Students/masterlist/CustomFields.data.ts
// @tag: Functions for fetching and modifying Custom Fields data in Supabase.

import { supabase } from '../../../supabaseClient';
import { Field, DropdownOption } from './CustomFields.types';

const mapFieldData = (data: any[]): Field[] =>
  data.map((f: any) => ({
    field_id: f.field_id,
    field_name: f.field_name,
    field_type: f.field_type,
    options: f.options || [],
  }));

export const fetchAllCustomFields = async (): Promise<Field[]> => {
  const { data, error } = await supabase
    .from('custom_fields')
    .select('field_id, field_name, field_type, options')
    .order('field_name');

  if (error) {
    console.error('Error fetching custom fields:', error);
    return [];
  }
  return mapFieldData(data);
};

export const fetchOptionsForField = async (fieldId: string): Promise<{ options: DropdownOption[], fieldName: string | null }> => {
  const { data, error } = await supabase
    .from('custom_fields')
    .select('options, field_name')
    .eq('field_id', fieldId)
    .single();

  if (error || !data) {
    console.error('Error fetching options for field:', error);
    return { options: [], fieldName: null };
  }

  const opts: string[] = data.options || [];
  return {
    options: opts.map((name, idx) => ({ id: idx + 1, name })),
    fieldName: data.field_name,
  };
};

export const addOptionToDb = async (fieldId: string, newOption: string): Promise<string[] | null> => {
  const { data: currentData, error: fetchError } = await supabase
    .from('custom_fields')
    .select('options')
    .eq('field_id', fieldId)
    .single();

  if (fetchError || !currentData) {
    console.error('Error fetching current options:', fetchError);
    return null;
  }

  const opts: string[] = currentData.options || [];
  const next = [...opts, newOption];

  const { error: updateError } = await supabase
    .from('custom_fields')
    .update({ options: next })
    .eq('field_id', fieldId);

  if (updateError) {
    console.error('Error updating options:', updateError);
    return null;
  }
  return next;
};

export const deleteOptionFromDb = async (fieldId: string, optionIndex: number): Promise<string[] | null> => {
  const { data: currentData, error: fetchError } = await supabase
    .from('custom_fields')
    .select('options')
    .eq('field_id', fieldId)
    .single();

  if (fetchError || !currentData) {
    console.error('Error fetching current options:', fetchError);
    return null;
  }

  const opts: string[] = currentData.options || [];
  const next = opts.filter((_, i) => i !== optionIndex);

  const { error: updateError } = await supabase
    .from('custom_fields')
    .update({ options: next })
    .eq('field_id', fieldId);

  if (updateError) {
    console.error('Error deleting option:', updateError);
    return null;
  }
  return next;
};

export const deleteFieldFromDb = async (fieldId: string): Promise<void> => {
  const { error } = await supabase.from('custom_fields').delete().eq('field_id', fieldId);
  if (error) {
    console.error('Error deleting field:', error);
  }
};