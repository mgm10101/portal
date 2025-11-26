-- ----------------------------------------------------------------------------
-- Create invoice_settings table for storing invoice configuration details
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS invoice_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    logo_url TEXT,
    school_name VARCHAR(255),
    contact_info TEXT,
    address TEXT,
    payment_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- Insert default row (will only insert if table is empty)
INSERT INTO invoice_settings (id, school_name)
VALUES (1, '')
ON CONFLICT (id) DO NOTHING;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_invoice_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_invoice_settings_updated_at ON invoice_settings;
CREATE TRIGGER set_invoice_settings_updated_at
BEFORE UPDATE ON invoice_settings
FOR EACH ROW
EXECUTE FUNCTION update_invoice_settings_updated_at();

-- ----------------------------------------------------------------------------
-- Note: For logo uploads, you'll also need to create a Supabase Storage bucket
-- Run this in Supabase Dashboard > Storage:
-- 
-- 1. Create a new bucket named "invoice-assets"
-- 2. Set it to Public (if you want public URLs) or Private (if you want signed URLs)
-- 3. Set up appropriate RLS policies for access
-- 
-- Example RLS policy (if bucket is public):
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'invoice-assets');
-- 
-- Example RLS policy (if bucket is private):
-- CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT 
--   WITH CHECK (bucket_id = 'invoice-assets' AND auth.role() = 'authenticated');
-- ----------------------------------------------------------------------------

