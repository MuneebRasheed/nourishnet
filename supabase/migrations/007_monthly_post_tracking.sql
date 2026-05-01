-- Migration: Track monthly post creation count (doesn't decrement on deletion)
-- This table tracks when posts are created to enforce monthly limits
-- Deleting a post doesn't remove the tracking record

CREATE TABLE IF NOT EXISTS public.monthly_post_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL, -- Don't use FK with CASCADE so record persists after deletion
  created_at timestamptz NOT NULL DEFAULT now(),
  year_month text NOT NULL -- Format: 'YYYY-MM' for easy querying
);

-- Index for fast lookups by provider and month
CREATE INDEX IF NOT EXISTS idx_monthly_post_tracking_provider_month 
  ON public.monthly_post_tracking(provider_id, year_month);

-- Index for fast lookups by listing_id
CREATE INDEX IF NOT EXISTS idx_monthly_post_tracking_listing 
  ON public.monthly_post_tracking(listing_id);

-- RLS policies
ALTER TABLE public.monthly_post_tracking ENABLE ROW LEVEL SECURITY;

-- Users can only read their own tracking records
DROP POLICY IF EXISTS "Users can view own post tracking" ON public.monthly_post_tracking;
CREATE POLICY "Users can view own post tracking"
  ON public.monthly_post_tracking FOR SELECT
  USING (auth.uid() = provider_id);

-- Only the system can insert tracking records (via trigger)
DROP POLICY IF EXISTS "System can insert post tracking" ON public.monthly_post_tracking;
CREATE POLICY "System can insert post tracking"
  ON public.monthly_post_tracking FOR INSERT
  WITH CHECK (true);

-- Function to track post creation
CREATE OR REPLACE FUNCTION track_post_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track when a new listing is created
  INSERT INTO public.monthly_post_tracking (
    provider_id,
    listing_id,
    created_at,
    year_month
  ) VALUES (
    NEW.provider_id,
    NEW.id,
    NEW.created_at,
    to_char(NEW.created_at, 'YYYY-MM')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically track post creation
DROP TRIGGER IF EXISTS trigger_track_post_creation ON public.listings;
CREATE TRIGGER trigger_track_post_creation
  AFTER INSERT ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION track_post_creation();

-- Function to get monthly post count (doesn't decrement on deletion)
CREATE OR REPLACE FUNCTION get_monthly_post_count(p_provider_id uuid, p_year_month text)
RETURNS integer AS $$
DECLARE
  post_count integer;
BEGIN
  SELECT COUNT(*)
  INTO post_count
  FROM public.monthly_post_tracking
  WHERE provider_id = p_provider_id
    AND year_month = p_year_month;
  
  RETURN COALESCE(post_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
