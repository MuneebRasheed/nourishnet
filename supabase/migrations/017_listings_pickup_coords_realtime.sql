-- Pickup coordinates for radius-based nearby notifications; enable Realtime for live recipient feed.
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS pickup_latitude double precision,
  ADD COLUMN IF NOT EXISTS pickup_longitude double precision;

COMMENT ON COLUMN public.listings.pickup_latitude IS 'Geocoded pickup address latitude (server-side)';
COMMENT ON COLUMN public.listings.pickup_longitude IS 'Geocoded pickup address longitude (server-side)';

-- Supabase Realtime: recipients subscribe to INSERT on listings (RLS still applies).
ALTER PUBLICATION supabase_realtime ADD TABLE public.listings;
