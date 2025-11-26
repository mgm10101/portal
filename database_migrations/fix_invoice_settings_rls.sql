-- ============================================================================
-- FIX INVOICE SETTINGS RLS POLICIES
-- ============================================================================
-- This script fixes RLS policies for invoice_settings table and storage
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENABLE RLS ON invoice_settings TABLE (if not already enabled)
-- ----------------------------------------------------------------------------
ALTER TABLE invoice_settings ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 2. CREATE RLS POLICIES FOR invoice_settings TABLE
-- ----------------------------------------------------------------------------

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to invoice settings" ON invoice_settings;
DROP POLICY IF EXISTS "Allow authenticated users to manage invoice settings" ON invoice_settings;

-- Policy: Allow anyone to read invoice settings (public access)
CREATE POLICY "Allow public read access to invoice settings"
ON invoice_settings FOR SELECT
USING (true);

-- Policy: Allow authenticated users to insert/update invoice settings
CREATE POLICY "Allow authenticated users to manage invoice settings"
ON invoice_settings FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Alternative: If you want to allow anonymous access for updates too, use:
-- CREATE POLICY "Allow public to manage invoice settings"
-- ON invoice_settings FOR ALL
-- USING (true)
-- WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 3. FIX STORAGE RLS POLICIES FOR invoice-assets BUCKET
-- ----------------------------------------------------------------------------

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Public can view invoice assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload invoice assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update invoice assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete invoice assets" ON storage.objects;

-- Policy: Allow public to view/download files (SELECT)
CREATE POLICY "Public can view invoice assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'invoice-assets');

-- Policy: Allow authenticated users to upload files (INSERT)
-- Note: Using auth.uid() IS NOT NULL instead of auth.role() for better compatibility
CREATE POLICY "Authenticated users can upload invoice assets"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'invoice-assets' 
    AND (auth.role() = 'authenticated' OR auth.uid() IS NOT NULL)
);

-- Policy: Allow authenticated users to update files (UPDATE)
CREATE POLICY "Authenticated users can update invoice assets"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'invoice-assets' 
    AND (auth.role() = 'authenticated' OR auth.uid() IS NOT NULL)
)
WITH CHECK (
    bucket_id = 'invoice-assets' 
    AND (auth.role() = 'authenticated' OR auth.uid() IS NOT NULL)
);

-- Policy: Allow authenticated users to delete files (DELETE)
CREATE POLICY "Authenticated users can delete invoice assets"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'invoice-assets' 
    AND (auth.role() = 'authenticated' OR auth.uid() IS NOT NULL)
);

-- ============================================================================
-- ALTERNATIVE: If you want completely public access (no auth required)
-- Uncomment the policies below and comment out the authenticated ones above
-- ============================================================================

-- CREATE POLICY "Public can upload invoice assets"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'invoice-assets');

-- CREATE POLICY "Public can update invoice assets"
-- ON storage.objects FOR UPDATE
-- USING (bucket_id = 'invoice-assets')
-- WITH CHECK (bucket_id = 'invoice-assets');

-- CREATE POLICY "Public can delete invoice assets"
-- ON storage.objects FOR DELETE
-- USING (bucket_id = 'invoice-assets');

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================

