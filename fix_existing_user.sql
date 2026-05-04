-- Fix existing user baig123@yopmail.com to add anonymous username
-- Run this in Supabase SQL Editor

UPDATE public.profiles
SET 
  full_name = 'AnonymousUser' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0'),
  updated_at = NOW()
WHERE 
  id = '4b5f4eea-70c2-4268-a92f-4dd984b4d3b8'
  AND email = 'baig123@yopmail.com';

-- Verify the update
SELECT id, email, full_name, role, updated_at
FROM public.profiles
WHERE email = 'baig123@yopmail.com';
