-- Align acceptance + completion flow with product behavior:
-- - Provider accept reserves quantity immediately.
-- - Recipient completion is driven by pickup verification.
-- - Listing is completed only when quantity is 0 and no accepted pickup is pending verification.

-- Support one pickup PIN per (listing, recipient), not one per listing.
DROP INDEX IF EXISTS public.uq_pickups_listing;
CREATE UNIQUE INDEX IF NOT EXISTS uq_pickups_listing_recipient
  ON public.pickups(listing_id, recipient_id);

-- Keep request submission open only while remaining quantity > 0.
CREATE OR REPLACE FUNCTION public.request_claim(p_listing_id uuid)
RETURNS public.listing_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req public.listing_requests;
  l public.listings;
  qty_remaining int;
BEGIN
  PERFORM public.ensure_request_window_open(p_listing_id);

  SELECT * INTO l
  FROM public.listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'listing_not_found';
  END IF;

  qty_remaining := COALESCE(NULLIF(regexp_replace(COALESCE(l.quantity, ''), '[^0-9]', '', 'g'), '')::int, 0);
  IF qty_remaining <= 0 THEN
    RAISE EXCEPTION 'requests_fully_booked';
  END IF;

  BEGIN
    INSERT INTO public.listing_requests (listing_id, recipient_id)
    VALUES (p_listing_id, auth.uid())
    RETURNING * INTO req;
  EXCEPTION
    WHEN unique_violation THEN
      RAISE EXCEPTION 'already_requested';
  END;

  RETURN req;
END;
$$;

REVOKE ALL ON FUNCTION public.request_claim(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.request_claim(uuid) TO authenticated;

DROP FUNCTION IF EXISTS public.provider_accept_request(uuid);
CREATE OR REPLACE FUNCTION public.provider_accept_request(p_request_id uuid)
RETURNS public.listing_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.listing_requests;
  l public.listings;
  qty_remaining int;
BEGIN
  SELECT * INTO r
  FROM public.listing_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'request_not_found';
  END IF;

  SELECT * INTO l
  FROM public.listings
  WHERE id = r.listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'listing_not_found';
  END IF;

  IF l.provider_id <> auth.uid() THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  IF l.status IN ('completed', 'cancelled') THEN
    RAISE EXCEPTION 'listing_not_available';
  END IF;

  IF r.status = 'won' THEN
    RETURN r;
  END IF;

  IF r.status <> 'pending' THEN
    RAISE EXCEPTION 'request_not_pending';
  END IF;

  qty_remaining := COALESCE(NULLIF(regexp_replace(COALESCE(l.quantity, ''), '[^0-9]', '', 'g'), '')::int, 0);
  IF qty_remaining <= 0 THEN
    RAISE EXCEPTION 'listing_not_available';
  END IF;

  UPDATE public.listing_requests
  SET status = 'won'
  WHERE id = r.id
  RETURNING * INTO r;

  UPDATE public.listings
  SET quantity = GREATEST(qty_remaining - 1, 0)::text,
      status = 'active',
      claim_window_ends_at = NULL,
      claimed_by = NULL,
      claimed_at = NULL,
      updated_at = now()
  WHERE id = l.id;

  RETURN r;
END;
$$;

REVOKE ALL ON FUNCTION public.provider_accept_request(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.provider_accept_request(uuid) TO authenticated;

DROP FUNCTION IF EXISTS public.provider_generate_pickup_pin(uuid);
CREATE OR REPLACE FUNCTION public.provider_generate_pickup_pin(
  p_listing_id uuid,
  p_recipient_id uuid DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  l public.listings;
  target_recipient uuid;
  pin text;
BEGIN
  SELECT * INTO l
  FROM public.listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'listing_not_found';
  END IF;

  IF l.provider_id <> auth.uid() THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  target_recipient := p_recipient_id;
  IF target_recipient IS NULL THEN
    SELECT r.recipient_id
    INTO target_recipient
    FROM public.listing_requests r
    WHERE r.listing_id = p_listing_id
      AND r.status = 'won'
      AND NOT EXISTS (
        SELECT 1
        FROM public.pickups p
        WHERE p.listing_id = r.listing_id
          AND p.recipient_id = r.recipient_id
          AND p.status = 'verified'
      )
    ORDER BY r.created_at ASC
    LIMIT 1;
  END IF;

  IF target_recipient IS NULL THEN
    RAISE EXCEPTION 'recipient_not_accepted';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.listing_requests r
    WHERE r.listing_id = p_listing_id
      AND r.recipient_id = target_recipient
      AND r.status = 'won'
  ) THEN
    RAISE EXCEPTION 'recipient_not_accepted';
  END IF;

  pin := lpad(((floor(random() * 10000))::int)::text, 4, '0');

  INSERT INTO public.pickups (listing_id, provider_id, recipient_id, status, pin_hash, pin_set_at)
  VALUES (l.id, l.provider_id, target_recipient, 'pending', extensions.crypt(pin, extensions.gen_salt('bf')), now())
  ON CONFLICT (listing_id, recipient_id) DO UPDATE
    SET provider_id = EXCLUDED.provider_id,
        status = EXCLUDED.status,
        pin_hash = EXCLUDED.pin_hash,
        pin_set_at = EXCLUDED.pin_set_at,
        verified_at = NULL,
        verified_by = NULL;

  RETURN pin;
END;
$$;

REVOKE ALL ON FUNCTION public.provider_generate_pickup_pin(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.provider_generate_pickup_pin(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.recipient_verify_pickup_pin(
  p_listing_id uuid,
  p_pin text,
  p_note text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  l public.listings;
  p public.pickups;
  pending_won_unverified int;
  qty_remaining int;
BEGIN
  IF p_pin IS NULL OR length(trim(p_pin)) <> 4 THEN
    RAISE EXCEPTION 'invalid_pin';
  END IF;

  SELECT * INTO l
  FROM public.listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'listing_not_found';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.listing_requests r
    WHERE r.listing_id = p_listing_id
      AND r.recipient_id = auth.uid()
      AND r.status = 'won'
  ) THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  SELECT * INTO p
  FROM public.pickups
  WHERE listing_id = p_listing_id
    AND recipient_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'pickup_not_initialized';
  END IF;

  IF p.status = 'verified' THEN
    RETURN json_build_object('pickup', row_to_json(p), 'listing', row_to_json(l));
  END IF;

  IF p.pin_hash IS NULL OR extensions.crypt(trim(p_pin), p.pin_hash) <> p.pin_hash THEN
    UPDATE public.pickups
    SET status = 'failed'
    WHERE id = p.id
    RETURNING * INTO p;
    RAISE EXCEPTION 'pin_mismatch';
  END IF;

  UPDATE public.pickups
  SET status = 'verified',
      verified_at = now(),
      verified_by = auth.uid()
  WHERE id = p.id
  RETURNING * INTO p;

  INSERT INTO public.impact_events (listing_id, provider_id, recipient_id, event_type, meals_rescued, note)
  VALUES (l.id, l.provider_id, auth.uid(), 'pickup_verified', 1, nullif(trim(p_note), ''));

  SELECT count(*)::int
  INTO pending_won_unverified
  FROM public.listing_requests r
  WHERE r.listing_id = p_listing_id
    AND r.status = 'won'
    AND NOT EXISTS (
      SELECT 1
      FROM public.pickups px
      WHERE px.listing_id = r.listing_id
        AND px.recipient_id = r.recipient_id
        AND px.status = 'verified'
    );

  qty_remaining := COALESCE(NULLIF(regexp_replace(COALESCE(l.quantity, ''), '[^0-9]', '', 'g'), '')::int, 0);

  UPDATE public.listings
  SET status = CASE
        WHEN qty_remaining <= 0 AND pending_won_unverified = 0 THEN 'completed'
        ELSE 'active'
      END,
      claim_window_ends_at = NULL,
      claimed_by = NULL,
      claimed_at = NULL,
      updated_at = now()
  WHERE id = l.id
  RETURNING * INTO l;

  RETURN json_build_object('pickup', row_to_json(p), 'listing', row_to_json(l));
END;
$$;

REVOKE ALL ON FUNCTION public.recipient_verify_pickup_pin(uuid, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.recipient_verify_pickup_pin(uuid, text, text) TO authenticated;
