// src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Supabase credentials (hardcoded for deployment)
const supabaseUrl = 'https://tyillyfcqesfucnzrzmg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5aWxseWZjcWVzZnVjbnpyem1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjA2ODMsImV4cCI6MjA3NDczNjY4M30.m5VMprLSINEj4tsDHSASnDXyT5DCq1xeiC17z2NlypM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Log Supabase client initialization
console.log('✅ Supabase client initialized:', {
  url: supabaseUrl,
  hasAuth: !!supabase.auth
});
