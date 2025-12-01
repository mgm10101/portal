-- ============================================================================
-- CLEAR USER SESSIONS - Run this to clear all sessions for a user
-- Replace 'admin@mgmacademy.org' with your actual email
-- ============================================================================

-- Clear all sessions for the user (forces fresh login)
DELETE FROM auth.sessions
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'admin@mgmacademy.org'
);

-- Also clear refresh tokens
DELETE FROM auth.refresh_tokens
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'admin@mgmacademy.org'
);

-- Verify sessions are cleared
SELECT 
  COUNT(*) AS remaining_sessions,
  'Sessions cleared for user' AS status
FROM auth.sessions
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'admin@mgmacademy.org'
);

