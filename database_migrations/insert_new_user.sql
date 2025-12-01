-- ============================================================================
-- INSERT NEW USER INTO public.users
-- ============================================================================
-- This inserts the new auth user (mgmacademys@gmail.com) into public.users table
-- ============================================================================

INSERT INTO public.users (
  id,
  email,
  role,
  status,
  created_at,
  updated_at
)
SELECT 
  id,
  email,
  'Super Admin'::text,
  'Active'::text,
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'mgmacademys@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  updated_at = NOW()
RETURNING id, email, role, status;

-- Verify the user was inserted correctly
SELECT 
  u.id,
  u.email,
  u.role,
  u.status,
  au.email AS auth_email,
  CASE 
    WHEN u.id IS NOT NULL AND u.status = 'Active' THEN '✅ User inserted successfully'
    ELSE '❌ User insertion failed'
  END AS status_check
FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id
WHERE au.email = 'mgmacademys@gmail.com';

