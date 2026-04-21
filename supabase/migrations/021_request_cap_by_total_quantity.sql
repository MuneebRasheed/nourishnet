-- Cap new claim requests: when pending + active-won requests reach total_quantity (fallback: quantity), block new submissions.

CREATE OR REPLACE FUNCTION public.request_claim(p_listing_id uuid)
RETURNS public.listing_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req public.listing_requests;
  l public.listings;
  cap int;
  active_req int;
BEGIN
  PERFORM public.ensure_request_window_open(p_listing_id);

  SELECT * INTO l
  FROM public.listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'listing_not_found';
  END IF;

  -- Same digit parsing idea as pickup verify (non-numeric → 0 = no cap).
  cap := COALESCE(NULLIF(regexp_replace(COALESCE(l.total_quantity, ''), '[^0-9]', '', 'g'), '')::int, 0);
  IF cap <= 0 THEN
    cap := COALESCE(NULLIF(regexp_replace(COALESCE(l.quantity, ''), '[^0-9]', '', 'g'), '')::int, 0);
  END IF;

  IF cap > 0 THEN
    SELECT count(*)::int INTO active_req
    FROM public.listing_requests r
    WHERE r.listing_id = p_listing_id
      AND (
        r.status = 'pending'
        OR (
          r.status = 'won'
          AND l.claimed_by IS NOT NULL
          AND l.claimed_by = r.recipient_id
        )
      );

    IF active_req >= cap THEN
      RAISE EXCEPTION 'requests_fully_booked';
    END IF;
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
