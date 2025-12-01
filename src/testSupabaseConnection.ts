// Test Supabase Connection
// Run this in browser console to test if Supabase is reachable

async function testSupabaseConnection() {
  const supabaseUrl = 'https://tyillyfcqesfucnzrzmg.supabase.co';
  
  console.log('Testing Supabase connection...');
  
  try {
    // Test 1: Basic connectivity
    console.log('Test 1: Checking if Supabase URL is reachable...');
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'OPTIONS',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5aWxseWZjcWVzZnVjbnpyem1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjA2ODMsImV4cCI6MjA3NDczNjY4M30.m5VMprLSINEj4tsDHSASnDXyT5DCq1xeiC17z2NlypM'
      }
    });
    
    console.log('✅ Supabase URL is reachable!', response.status);
    
    // Test 2: Auth endpoint
    console.log('Test 2: Checking auth endpoint...');
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'OPTIONS',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5aWxseWZjcWVzZnVjbnpyem1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjA2ODMsImV4cCI6MjA3NDczNjY4M30.m5VMprLSINEj4tsDHSASnDXyT5DCq1xeiC17z2NlypM'
      }
    });
    
    console.log('✅ Auth endpoint is reachable!', authResponse.status);
    
    return true;
  } catch (error: any) {
    console.error('❌ Connection test failed:', error);
    console.error('Error details:', error.message);
    return false;
  }
}

// Run the test
testSupabaseConnection();

