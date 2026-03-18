-- NourishNet: listing requests, pickups (PIN), impact events
-- Run in Supabase Dashboard → SQL Editor, or via Supabase CLI

-- 0) Rename existing claim requests table → listing_requests (keep data)
DO $$
BEGIN
  IF to_regclass('public.listing_claim_requests') IS NOT NULL
     AND to_regclass('public.listing_requests') IS NULL THEN
    ALTER TABLE public.listing_claim_requests RENAME TO listing_requests;
  END IF;
END $$;

-- 1) listing_requests (request/claim)
CREATE TABLE IF NOT EXISTS public.listing_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_listing_requests_listing_recipient
  ON public.listing_requests(listing_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_listing_requests_listing_id
  ON public.listing_requests(listing_id, created_at);
CREATE INDEX IF NOT EXISTS idx_listing_requests_recipient_id
  ON public.listing_requests(recipient_id, created_at DESC);

ALTER TABLE public.listing_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Recipients can read own listing requests" ON public.listing_requests;
CREATE POLICY "Recipients can read own listing requests"
  ON public.listing_requests FOR SELECT
  USING (auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Providers can read requests for own listings" ON public.listing_requests;
CREATE POLICY "Providers can read requests for own listings"
  ON public.listing_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.listings l
      WHERE l.id = listing_requests.listing_id
        AND l.provider_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Recipients can request claim on eligible listings" ON public.listing_requests;
CREATE POLICY "Recipients can request claim on eligible listings"
  ON public.listing_requests FOR INSERT
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

-- 1b) Update RPCs to use listing_requests (idempotent: replaces prior defs)
CREATE OR REPLACE FUNCTION public.request_claim(p_listing_id uuid)
RETURNS public.listing_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  listing_row public.listings;
  req public.listing_requests;
BEGIN
  listing_row := public.ensure_request_window_open(p_listing_id);

  INSERT INTO public.listing_requests (listing_id, recipient_id)
  VALUES (p_listing_id, auth.uid())
  ON CONFLICT (listing_id, recipient_id) DO UPDATE
    SET listing_id = EXCLUDED.listing_id
  RETURNING * INTO req;

  RETURN req;
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_claim_window(p_listing_id uuid)
RETURNS public.listings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  l public.listings;
  winner public.listing_requests;
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

  IF l.status IN ('claimed', 'completed', 'cancelled') OR l.claimed_by IS NOT NULL THEN
    RETURN l;
  END IF;

  IF l.claim_window_ends_at IS NULL OR now() < l.claim_window_ends_at THEN
    RAISE EXCEPTION 'claim_window_not_ended';
  END IF;

  SELECT *
  INTO winner
  FROM public.listing_requests r
  WHERE r.listing_id = p_listing_id
    AND r.status = 'pending'
  ORDER BY random()
  LIMIT 1;

  IF NOT FOUND THEN
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

  UPDATE public.listing_requests
  SET status = 'won'
  WHERE id = winner.id;

  UPDATE public.listing_requests
  SET status = 'lost'
  WHERE listing_id = p_listing_id
    AND id <> winner.id
    AND status = 'pending';

  RETURN l;
END;
$$;

-- 2) pickups (PIN verification)
CREATE TABLE IF NOT EXISTS public.pickups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed', 'cancelled')),
  pin_hash text,
  pin_set_at timestamptz,
  verified_at timestamptz,
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pickups_listing
  ON public.pickups(listing_id);
CREATE INDEX IF NOT EXISTS idx_pickups_provider_id
  ON public.pickups(provider_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pickups_recipient_id
  ON public.pickups(recipient_id, created_at DESC);

ALTER TABLE public.pickups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Providers can manage pickups for own listings" ON public.pickups;
CREATE POLICY "Providers can manage pickups for own listings"
  ON public.pickups FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.listings l
      WHERE l.id = pickups.listing_id
        AND l.provider_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.listings l
      WHERE l.id = pickups.listing_id
        AND l.provider_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Recipients can read own pickups" ON public.pickups;
CREATE POLICY "Recipients can read own pickups"
  ON public.pickups FOR SELECT
  USING (auth.uid() = recipient_id);

-- 3) impact_events (impact logging)
CREATE TABLE IF NOT EXISTS public.impact_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  provider_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('listing_completed', 'pickup_verified')),
  meals_rescued int NOT NULL DEFAULT 0 CHECK (meals_rescued >= 0),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_impact_events_listing_id
  ON public.impact_events(listing_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_impact_events_provider_id
  ON public.impact_events(provider_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_impact_events_recipient_id
  ON public.impact_events(recipient_id, created_at DESC);

ALTER TABLE public.impact_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read impact events they are part of" ON public.impact_events;
CREATE POLICY "Users can read impact events they are part of"
  ON public.impact_events FOR SELECT
  USING (
    auth.uid() = provider_id
    OR auth.uid() = recipient_id
  );

-- Inserts are expected via service role / backend only for MVP
-- (no INSERT policy on purpose)

