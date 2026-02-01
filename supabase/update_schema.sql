-- 1. Add expo_push_token column to profiles table
-- This stores the Expo Push Token for sending remote notifications later.
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS expo_push_token text,
ADD COLUMN IF NOT EXISTS push_platform text;

-- 2. Backfill Phone Numbers
-- Syncs phone numbers from the private auth.users table to the public.profiles table.
UPDATE public.profiles
SET phone = AU.phone
FROM auth.users AS AU
WHERE public.profiles.id = AU.id
AND public.profiles.phone IS NULL
AND AU.phone IS NOT NULL;

-- 3. Verification
SELECT 
    (SELECT count(*) FROM public.profiles WHERE expo_push_token IS NOT NULL) as profiles_with_tokens,
    (SELECT count(*) FROM public.profiles WHERE phone IS NOT NULL) as profiles_with_phones;
