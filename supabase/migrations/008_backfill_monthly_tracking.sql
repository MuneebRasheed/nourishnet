-- Migration: Backfill monthly post tracking for existing providers
-- This ensures providers who already created posts have accurate counts

-- Backfill tracking records for ALL existing listings
-- This includes posts from previous months and current month
INSERT INTO public.monthly_post_tracking (provider_id, listing_id, created_at, year_month)
SELECT 
  provider_id, 
  id as listing_id,
  created_at, 
  to_char(created_at, 'YYYY-MM') as year_month
FROM public.listings
WHERE NOT EXISTS (
  -- Avoid duplicates if migration is run multiple times
  SELECT 1 FROM public.monthly_post_tracking 
  WHERE monthly_post_tracking.listing_id = listings.id
)
ORDER BY created_at ASC;

-- Log the backfill results
DO $$
DECLARE
  total_backfilled integer;
  providers_affected integer;
  current_month_posts integer;
BEGIN
  -- Count total records backfilled
  SELECT COUNT(*) INTO total_backfilled
  FROM public.monthly_post_tracking;
  
  -- Count unique providers affected
  SELECT COUNT(DISTINCT provider_id) INTO providers_affected
  FROM public.monthly_post_tracking;
  
  -- Count posts created in current month
  SELECT COUNT(*) INTO current_month_posts
  FROM public.monthly_post_tracking
  WHERE year_month = to_char(CURRENT_DATE, 'YYYY-MM');
  
  RAISE NOTICE 'Backfill complete:';
  RAISE NOTICE '  - Total tracking records: %', total_backfilled;
  RAISE NOTICE '  - Providers affected: %', providers_affected;
  RAISE NOTICE '  - Current month posts: %', current_month_posts;
END $$;

-- Create a view to help monitor monthly post counts per provider
CREATE OR REPLACE VIEW public.provider_monthly_post_summary AS
SELECT 
  provider_id,
  year_month,
  COUNT(*) as post_count,
  MIN(created_at) as first_post_at,
  MAX(created_at) as last_post_at
FROM public.monthly_post_tracking
GROUP BY provider_id, year_month
ORDER BY provider_id, year_month DESC;

-- Grant access to the view
GRANT SELECT ON public.provider_monthly_post_summary TO authenticated;

-- Create a helper function to check if a provider has exceeded their limit
-- This can be used in the app or for admin queries
CREATE OR REPLACE FUNCTION check_provider_monthly_limit(
  p_provider_id uuid,
  p_limit integer DEFAULT 5
)
RETURNS TABLE(
  provider_id uuid,
  current_month text,
  post_count integer,
  limit_value integer,
  has_exceeded boolean,
  remaining integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p_provider_id,
    to_char(CURRENT_DATE, 'YYYY-MM') as current_month,
    COALESCE(
      (SELECT COUNT(*)::integer 
       FROM public.monthly_post_tracking 
       WHERE monthly_post_tracking.provider_id = p_provider_id 
         AND year_month = to_char(CURRENT_DATE, 'YYYY-MM')),
      0
    ) as post_count,
    p_limit as limit_value,
    COALESCE(
      (SELECT COUNT(*) 
       FROM public.monthly_post_tracking 
       WHERE monthly_post_tracking.provider_id = p_provider_id 
         AND year_month = to_char(CURRENT_DATE, 'YYYY-MM')),
      0
    ) >= p_limit as has_exceeded,
    GREATEST(
      p_limit - COALESCE(
        (SELECT COUNT(*)::integer 
         FROM public.monthly_post_tracking 
         WHERE monthly_post_tracking.provider_id = p_provider_id 
           AND year_month = to_char(CURRENT_DATE, 'YYYY-MM')),
        0
      ),
      0
    ) as remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example usage (commented out):
-- SELECT * FROM check_provider_monthly_limit('your-provider-uuid', 5);
-- SELECT * FROM public.provider_monthly_post_summary WHERE provider_id = 'your-provider-uuid';
