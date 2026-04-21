-- Original posted quantity (unchanged when remaining `quantity` drops after verified pickups).

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS total_quantity text NOT NULL DEFAULT '';

-- Backfill from current quantity for existing rows (best-effort; same as pre-migration behavior for repost).
UPDATE public.listings
SET total_quantity = COALESCE(NULLIF(trim(quantity), ''), total_quantity, '')
WHERE trim(COALESCE(total_quantity, '')) = '';

COMMENT ON COLUMN public.listings.total_quantity IS 'Quantity originally posted; does not decrease when quantity drops after pickup.';
