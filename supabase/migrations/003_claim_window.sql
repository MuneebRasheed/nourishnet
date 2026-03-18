-- NourishNet: claim mode B (request window + fair winner)
-- Run in Supabase Dashboard → SQL Editor, or via Supabase CLI

-- 1) Extend listings to support claim window + claimed recipient
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS claim_mode text NOT NULL DEFAULT 'window' CHECK (claim_mode IN ('instant', 'window')),
  ADD COLUMN IF NOT EXISTS claim_window_seconds int NOT NULL DEFAULT 180 CHECK (claim_window_seconds BETWEEN 120 AND 300),
  ADD COLUMN IF NOT EXISTS claim_window_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS claimed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz;

-- Expand listing status beyond active/completed
DO $$
BEGIN
  -- Drop & recreate constraint to include new states
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'listings_status_check'
  ) THEN
    ALTER TABLE public.listings DROP CONSTRAINT listings_status_check;
  END IF;
END $$;

ALTER TABLE public.listings
  ADD CONSTRAINT listings_status_check
  CHECK (status IN ('active', 'request_open', 'claimed', 'completed', 'cancelled'));

CREATE INDEX IF NOT EXISTS idx_listings_claim_window_ends_at ON public.listings(claim_window_ends_at);
CREATE INDEX IF NOT EXISTS idx_listings_claimed_by ON public.listings(claimed_by);

-- 2) Claim requests table (one per recipient per listing)
CREATE TABLE IF NOT EXISTS public.listing_claim_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_listing_claim_requests_listing_recipient
  ON public.listing_claim_requests(listing_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_listing_claim_requests_listing_id
  ON public.listing_claim_requests(listing_id, created_at);
CREATE INDEX IF NOT EXISTS idx_listing_claim_requests_recipient_id
  ON public.listing_claim_requests(recipient_id, created_at DESC);

-- 3) RLS for claim requests
ALTER TABLE public.listing_claim_requests ENABLE ROW LEVEL SECURITY;

-- Recipients can see their own requests
DROP POLICY IF EXISTS "Recipients can read own claim requests" ON public.listing_claim_requests;
CREATE POLICY "Recipients can read own claim requests"
  ON public.listing_claim_requests FOR SELECT
  USING (auth.uid() = recipient_id);

-- Providers can see requests for their listings
DROP POLICY IF EXISTS "Providers can read requests for own listings" ON public.listing_claim_requests;
CREATE POLICY "Providers can read requests for own listings"
  ON public.listing_claim_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.listings l
      WHERE l.id = listing_claim_requests.listing_id
        AND l.provider_id = auth.uid()
    )
  );

-- Only recipients can insert requests, only if listing is eligible
DROP POLICY IF EXISTS "Recipients can request claim on eligible listings" ON public.listing_claim_requests;
CREATE POLICY "Recipients can request claim on eligible listings"
  ON public.listing_claim_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = recipient_id
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'recipient'
    )
    AND EXISTS (
      SELECT 1
      FROM public.listings l
      WHERE l.id = listing_id
        AND l.status IN ('active', 'request_open')
        AND (l.claim_mode = 'window')
        AND l.provider_id <> auth.uid()
        AND (l.claim_window_ends_at IS NULL OR now() < l.claim_window_ends_at)
        AND l.claimed_by IS NULL
    )
  );

-- 4) Helper: open a request window if needed
CREATE OR REPLACE FUNCTION public.ensure_request_window_open(p_listing_id uuid)
RETURNS public.listings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  l public.listings;
BEGIN
  SELECT * INTO l
  FROM public.listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'listing_not_found';
  END IF;

  IF l.claim_mode <> 'window' THEN
    RAISE EXCEPTION 'listing_not_window_mode';
  END IF;

  IF l.status NOT IN ('active', 'request_open') OR l.claimed_by IS NOT NULL THEN
    RAISE EXCEPTION 'listing_not_requestable';
  END IF;

  IF l.claim_window_ends_at IS NULL OR now() >= l.claim_window_ends_at THEN
    UPDATE public.listings
    SET
      status = 'request_open',
      claim_window_ends_at = now() + make_interval(secs => l.claim_window_seconds),
      updated_at = now()
    WHERE id = p_listing_id
    RETURNING * INTO l;
  ELSE
    -- Ensure status is request_open while window is active
    IF l.status <> 'request_open' THEN
      UPDATE public.listings
      SET status = 'request_open', updated_at = now()
      WHERE id = p_listing_id
      RETURNING * INTO l;
    END IF;
  END IF;

  RETURN l;
END;
$$;

-- 5) RPC: recipient requests a claim (idempotent per (listing, recipient))
CREATE OR REPLACE FUNCTION public.request_claim(p_listing_id uuid)
RETURNS public.listing_claim_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  listing_row public.listings;
  req public.listing_claim_requests;
BEGIN
  -- Lock listing + open window if needed
  listing_row := public.ensure_request_window_open(p_listing_id);

  -- Create request if it doesn't exist (idempotent)
  INSERT INTO public.listing_claim_requests (listing_id, recipient_id)
  VALUES (p_listing_id, auth.uid())
  ON CONFLICT (listing_id, recipient_id) DO UPDATE
    SET listing_id = EXCLUDED.listing_id
  RETURNING * INTO req;

  RETURN req;
END;
$$;

-- 6) RPC: finalize claim after window ends (call with service role or scheduled job)
CREATE OR REPLACE FUNCTION public.finalize_claim_window(p_listing_id uuid)
RETURNS public.listings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  l public.listings;
  winner public.listing_claim_requests;
BEGIN
  SELECT * INTO l
  FROM public.listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'listing_not_found';
  END IF;

  IF l.claim_mode <> 'window' THEN
    RAISE EXCEPTION 'listing_not_window_mode';
  END IF;

  -- If already claimed/completed/cancelled, return as-is
  IF l.status IN ('claimed', 'completed', 'cancelled') OR l.claimed_by IS NOT NULL THEN
    RETURN l;
  END IF;

  IF l.claim_window_ends_at IS NULL OR now() < l.claim_window_ends_at THEN
    RAISE EXCEPTION 'claim_window_not_ended';
  END IF;

  -- Pick a fair winner (simple MVP: uniform random among pending requests)
  SELECT *
  INTO winner
  FROM public.listing_claim_requests r
  WHERE r.listing_id = p_listing_id
    AND r.status = 'pending'
  ORDER BY random()
  LIMIT 1;

  IF NOT FOUND THEN
    -- Nobody requested: reopen as active (provider can wait; next request will open a new window)
    UPDATE public.listings
    SET status = 'active',
        claim_window_ends_at = NULL,
        updated_at = now()
    WHERE id = p_listing_id
    RETURNING * INTO l;
    RETURN l;
  END IF;

  UPDATE public.listings
  SET status = 'claimed',
      claimed_by = winner.recipient_id,
      claimed_at = now(),
      updated_at = now()
  WHERE id = p_listing_id
  RETURNING * INTO l;

  UPDATE public.listing_claim_requests
  SET status = 'won'
  WHERE id = winner.id;

  UPDATE public.listing_claim_requests
  SET status = 'lost'
  WHERE listing_id = p_listing_id
    AND id <> winner.id
    AND status = 'pending';

  RETURN l;
END;
$$;

