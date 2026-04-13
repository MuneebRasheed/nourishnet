-- Recipient profile: optional coordinates from Places / GPS for matching and maps.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

COMMENT ON COLUMN public.profiles.latitude IS 'Approximate latitude (Google Places or device GPS)';
COMMENT ON COLUMN public.profiles.longitude IS 'Approximate longitude (Google Places or device GPS)';
