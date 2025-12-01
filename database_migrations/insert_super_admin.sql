-- ============================================================================
-- INSERT SUPER ADMIN USER
-- ============================================================================
-- This script inserts the super admin user record into the users table.
-- 
-- IMPORTANT: 
-- 1. First create the user in Supabase Auth Dashboard (Authentication > Users)
-- 2. Get the UUID from Authentication > Users page
-- 3. Replace 'YOUR_USER_ID_HERE' below with the actual UUID
-- ============================================================================

-- Method 1: Using the email to find the user ID automatically
-- This is the recommended method - it will automatically find the user ID
INSERT INTO users (id, email, username, role, description, status)
SELECT 
  id,
  'admin@mgmacademy.org',
  'superadmin',
  'Super Admin',
  'Main System Administrator',
  'Active'
FROM auth.users
WHERE email = 'admin@mgmacademy.org'
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running the above, verify the user was created with:
-- SELECT * FROM users WHERE email = 'admin@mgmacademy.org';

-- ============================================================================
-- ALTERNATIVE METHOD (if you already have the UUID):
-- ============================================================================
-- If you know the exact UUID, you can use this instead:
-- INSERT INTO users (id, email, username, role, description, status)
-- VALUES (
--   'YOUR_USER_ID_HERE', -- Replace with actual UUID from auth.users
--   'admin@mgmacademy.org',
--   'superadmin',
--   'Super Admin',
--   'Main System Administrator',
--   'Active'
-- )
-- ON CONFLICT (id) DO NOTHING;

