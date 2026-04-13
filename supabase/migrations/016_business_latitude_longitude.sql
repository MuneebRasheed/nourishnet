-- Provider business address coordinates (Google Places / GPS).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS business_latitude double precision,
  ADD COLUMN IF NOT EXISTS business_longitude double precision;

COMMENT ON COLUMN public.profiles.business_latitude IS 'Business / pickup location latitude';
COMMENT ON COLUMN public.profiles.business_longitude IS 'Business / pickup location longitude';
