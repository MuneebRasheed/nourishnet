-- Staggered visibility: high-need recipients first, then general audience after gap (seconds).
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS preference_gap_seconds integer;

ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_preference_gap_seconds_check;

ALTER TABLE public.listings
  ADD CONSTRAINT listings_preference_gap_seconds_check
  CHECK (preference_gap_seconds IS NULL OR (preference_gap_seconds >= 1 AND preference_gap_seconds <= 300));

COMMENT ON COLUMN public.listings.preference_gap_seconds IS 'Delay (1–300s) before listing is shown to all recipients; NULL = no stagger.';
