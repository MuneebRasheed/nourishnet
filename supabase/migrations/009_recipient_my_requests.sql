-- NourishNet: RPC to fetch "my requests" with listing details for the My Requests screen.
-- (No extra RLS on listings is needed: get_my_requests is SECURITY DEFINER and reads
-- both listing_requests and listings with definer rights, avoiding RLS recursion.)

-- RPC: return current user's requests with listing data (for My Requests screen)
CREATE OR REPLACE FUNCTION public.get_my_requests()
RETURNS TABLE (
  request_id uuid,
  listing_id uuid,
  request_status text,
  request_created_at timestamptz,
  listing_title text,
  food_type text,
  quantity text,
  quantity_unit text,
  dietary_tags text[],
  allergens text[],
  pickup_address text,
  start_time text,
  end_time text,
  note text,
  listing_status text,
  listing_created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    lr.id AS request_id,
    l.id AS listing_id,
    lr.status AS request_status,
    lr.created_at AS request_created_at,
    l.title AS listing_title,
    l.food_type,
    l.quantity,
    l.quantity_unit,
    l.dietary_tags,
    l.allergens,
    l.pickup_address,
    l.start_time,
    l.end_time,
    l.note,
    l.status AS listing_status,
    l.created_at AS listing_created_at
  FROM public.listing_requests lr
  JOIN public.listings l ON l.id = lr.listing_id
  WHERE lr.recipient_id = auth.uid()
  ORDER BY lr.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_my_requests() FROM public;
GRANT EXECUTE ON FUNCTION public.get_my_requests() TO authenticated;

COMMENT ON FUNCTION public.get_my_requests() IS 'Returns the current recipient user''s requests with listing details for My Requests screen.';
