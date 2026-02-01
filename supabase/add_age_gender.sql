-- Add Age and Gender columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS gender text;

-- Optional: Add check constraint for gender (if you want to restrict values)
-- ALTER TABLE public.profiles ADD CONSTRAINT check_gender CHECK (gender IN ('Male', 'Female', 'Other'));
