-- ============================================================================
-- FIX USERS TABLE RLS - SIMPLE SOLUTION
-- ============================================================================
-- This script fixes the infinite recursion by using simple policies.
-- For now, we'll allow authenticated users to read/write users table.
-- We can refine security later once the basic setup works.
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Super Admin full access" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Authenticated users can insert" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to read users" ON users;
DROP POLICY IF EXISTS "Allow user management for now" ON users;
DROP POLICY IF EXISTS "Allow authenticated read" ON users;
DROP POLICY IF EXISTS "Allow own update" ON users;
DROP POLICY IF EXISTS "Allow own insert" ON users;
DROP POLICY IF EXISTS "Allow authenticated full access" ON users;

-- Simple policy: Allow all authenticated users to read users table
-- This is needed for login to check user role/status
CREATE POLICY "Allow authenticated read" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to update their own record
CREATE POLICY "Allow own update" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own record (for initial setup)
CREATE POLICY "Allow own insert" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow all authenticated users full access for now
-- (We'll restrict this later with proper permission checks)
CREATE POLICY "Allow authenticated full access" ON users
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

