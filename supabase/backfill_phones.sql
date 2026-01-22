-- Migration Script: Backfill Phone Numbers
-- Purpose: Syncs phone numbers from the private auth.users table to the public.profiles table.
-- Usage: Run this script in the Supabase SQL Editor.

-- 1. Ensure the phones column exists (safe check)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
        ALTER TABLE public.profiles ADD COLUMN phone text;
    END IF;
END $$;

-- 2. Update existing profiles with phone numbers from auth.users
UPDATE public.profiles
SET phone = AU.phone
FROM auth.users AS AU
WHERE public.profiles.id = AU.id
AND public.profiles.phone IS NULL  -- Optional: Remove this line if you want to overwrite even if not null
AND AU.phone IS NOT NULL;

-- 3. Verification Output (Optional)
SELECT count(*) as updated_profiles_count
FROM public.profiles
WHERE phone IS NOT NULL;
