-- ============================================================================
-- CHECK USER ALIGNMENT - Run this to see if auth and app users match
-- Replace 'admin@mgmacademy.org' with your actual email
-- ============================================================================

SELECT 
  -- Auth user info
  au.id AS auth_user_id,
  au.email AS auth_email,
  CASE 
    WHEN au.deleted_at IS NOT NULL THEN '❌ Auth user DELETED'
    WHEN au.banned_until IS NOT NULL AND au.banned_until > NOW() THEN '❌ Auth user BANNED'
    ELSE '✅ Auth user OK'
  END AS auth_status,
  
  -- App user info
  u.id AS app_user_id,
  u.email AS app_email,
  u.role,
  u.status,
  CASE 
    WHEN u.id IS NULL THEN '❌ public.users row MISSING'
    WHEN u.status IS DISTINCT FROM 'Active' THEN '❌ Status: ' || COALESCE(u.status, 'NULL')
    ELSE '✅ App user OK'
  END AS app_user_status,
  
  -- Overall diagnosis
  CASE 
    WHEN au.id IS NULL THEN '❌❌❌ Auth user does not exist - create user first'
    WHEN au.deleted_at IS NOT NULL THEN '❌❌❌ Auth user was deleted - recreate user'
    WHEN u.id IS NULL THEN '❌❌❌ public.users row missing - run INSERT into public.users'
    WHEN u.status IS DISTINCT FROM 'Active' THEN '❌❌❌ User status is not Active - update status to Active'
    WHEN au.id IS NOT NULL AND u.id IS NOT NULL AND u.status = 'Active' THEN '✅✅✅ Both rows exist and user is Active - issue might be elsewhere'
    ELSE '⚠️⚠️⚠️ Unknown issue'
  END AS overall_diagnosis

FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id
WHERE au.email = 'admin@mgmacademy.org';

