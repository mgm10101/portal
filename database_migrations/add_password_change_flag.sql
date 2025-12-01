-- Add a column to track if user needs to change password
-- This is more reliable than checking user metadata

-- First, check if column exists and what type it is
DO $$ 
BEGIN
  -- Add column as BOOLEAN if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'requires_password_change'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN requires_password_change BOOLEAN DEFAULT false;
  ELSE
    -- If column exists but might be TEXT, convert it to BOOLEAN
    -- First convert any string values to boolean
    UPDATE public.users 
    SET requires_password_change = CASE 
      WHEN requires_password_change::text IN ('true', 'TRUE', 'True', '1', 't') THEN true
      WHEN requires_password_change::text IN ('false', 'FALSE', 'False', '0', 'f', '') THEN false
      ELSE false
    END
    WHERE requires_password_change IS NOT NULL;
    
    -- Then alter the column type to BOOLEAN if it's not already
    ALTER TABLE public.users 
    ALTER COLUMN requires_password_change TYPE BOOLEAN 
    USING CASE 
      WHEN requires_password_change::text IN ('true', 'TRUE', 'True', '1', 't') THEN true
      WHEN requires_password_change::text IN ('false', 'FALSE', 'False', '0', 'f', '') THEN false
      ELSE false
    END;
  END IF;
END $$;

-- Update existing users to not require password change (if NULL)
UPDATE public.users 
SET requires_password_change = false 
WHERE requires_password_change IS NULL;

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_users_requires_password_change 
ON public.users(requires_password_change) 
WHERE requires_password_change = true;

-- Add comment
COMMENT ON COLUMN public.users.requires_password_change IS 
'Set to true when user is created with default password. Must be changed to false after first password change.';

