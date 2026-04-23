-- Persist recipient notifications when provider accepts/declines a request.
-- This keeps request status transitions and in-app notification rows atomic.

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

  INSERT INTO public.notifications (user_id, type, data)
  VALUES (
    r.recipient_id,
    'request_accepted',
    jsonb_build_object(
      'listingId', l.id,
      'foodTitle', l.title,
      'message', 'Your request for "' || COALESCE(l.title, 'this listing') || '" was accepted.'
    )
  );

  RETURN r;
END;
$$;

REVOKE ALL ON FUNCTION public.provider_accept_request(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.provider_accept_request(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.provider_decline_request(p_request_id uuid)
RETURNS public.listing_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.listing_requests;
  l public.listings;
  previous_status text;
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
    AND provider_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  previous_status := r.status;

  IF previous_status = 'cancelled' THEN
    RETURN r;
  END IF;

  UPDATE public.listing_requests
  SET status = 'cancelled'
  WHERE id = r.id
  RETURNING * INTO r;

  INSERT INTO public.notifications (user_id, type, data)
  VALUES (
    r.recipient_id,
    'request_not_available',
    jsonb_build_object(
      'listingId', l.id,
      'foodTitle', l.title,
      'message', 'Your request for "' || COALESCE(l.title, 'this listing') || '" was declined.'
    )
  );

  RETURN r;
END;
$$;

REVOKE ALL ON FUNCTION public.provider_decline_request(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.provider_decline_request(uuid) TO authenticated;
