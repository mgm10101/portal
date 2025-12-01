// src/supabaseAdminClient.ts
// Admin client with service role key for user management operations
// WARNING: This should only be used server-side in production
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyillyfcqesfucnzrzmg.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5aWxseWZjcWVzZnVjbnpyem1nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTE2MDY4MywiZXhwIjoyMDc0NzM2NjgzfQ.npUGjXJoF0KJdGKLys1nQXxMp4hGtqt1Bg08-VrkOAQ';

// Admin client with service role - bypasses RLS
// Use a different storage key to avoid conflicts with the regular client
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    storage: undefined, // Don't use localStorage for admin client
    storageKey: 'sb-admin-auth' // Different storage key if storage is needed
  }
});

