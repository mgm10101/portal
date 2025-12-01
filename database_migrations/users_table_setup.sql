-- ============================================================================
-- USERS TABLE SETUP
-- ============================================================================
-- This script creates the users table to link Supabase Auth users with
-- application-specific user data, roles, and permissions.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CREATE users TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  role TEXT NOT NULL DEFAULT 'Parent' CHECK (role IN ('Super Admin', 'Admin', 'Teacher', 'Parent', 'Custom')),
  description TEXT,
  employee_id TEXT, -- Link to staff table if applicable
  student_ids TEXT[], -- For Parent role - array of admission numbers
  class_streams JSONB, -- For Teacher role - array of {classId, className, streams[]}
  selected_modules JSONB, -- Array of selected modules/submodules (placeholder)
  permissions JSONB, -- Array of permission strings (placeholder for now)
  filters JSONB, -- Filter configurations (placeholder for now)
  is_employee BOOLEAN DEFAULT false, -- For Custom role
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) -- Track who created this user
);

-- ----------------------------------------------------------------------------
-- 2. CREATE INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);

-- ----------------------------------------------------------------------------
-- 3. ENABLE ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 4. CREATE RLS POLICIES
-- ----------------------------------------------------------------------------

-- Policy: Users can view their own data
DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Policy: Super Admin has full access to all users
DROP POLICY IF EXISTS "Super Admin full access" ON users;
CREATE POLICY "Super Admin full access" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'Super Admin'
    )
  );

-- Policy: Users with user management permission can view all users
-- (We'll refine this later when permissions are implemented)
-- For now, Super Admin can do everything

-- ----------------------------------------------------------------------------
-- 5. CREATE FUNCTION TO UPDATE updated_at TIMESTAMP
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 6. CREATE TRIGGER TO AUTO-UPDATE updated_at
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS update_users_updated_at_trigger ON users;
CREATE TRIGGER update_users_updated_at_trigger
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Create super admin user in Supabase Auth Dashboard
-- 2. Get the user ID from Authentication > Users
-- 3. Run the INSERT statement below with the actual user ID
-- ============================================================================

