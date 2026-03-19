-- NourishNet: enforce single request + decrement listing quantity on verified pickup.
-- This migration is additive and keeps existing client flow intact.

-- 1) Enforce one request per recipient/listing at RPC level (no silent upsert updates).
create or replace function public.request_claim(p_listing_id uuid)
returns public.listing_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.listing_requests;
begin
  -- Lock listing + open request window if needed.
  perform public.ensure_request_window_open(p_listing_id);

  begin
    insert into public.listing_requests (listing_id, recipient_id)
    values (p_listing_id, auth.uid())
    returning * into req;
  exception
    when unique_violation then
      raise exception 'already_requested';
  end;

  return req;
end;
$$;

revoke all on function public.request_claim(uuid) from public;
grant execute on function public.request_claim(uuid) to authenticated;

-- 2) On successful PIN verification, decrement quantity by 1.
--    If remaining quantity <= 0, mark listing completed.
--    Otherwise reopen listing for next recipient and clear claim linkage.
create or replace function public.recipient_verify_pickup_pin(
  p_listing_id uuid,
  p_pin text,
  p_note text default null
)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  l public.listings;
  p public.pickups;
  qty_before int;
  qty_after int;
begin
  if p_pin is null or length(trim(p_pin)) <> 4 then
    raise exception 'invalid_pin';
  end if;

  select * into l
  from public.listings
  where id = p_listing_id
  for update;

  if not found then
    raise exception 'listing_not_found';
  end if;

  if l.claimed_by is null then
    raise exception 'listing_not_claimed';
  end if;

  if auth.uid() <> l.claimed_by then
    raise exception 'not_allowed';
  end if;

  select * into p
  from public.pickups
  where listing_id = p_listing_id
  for update;

  if not found then
    raise exception 'pickup_not_initialized';
  end if;

  if p.status = 'verified' then
    return json_build_object('pickup', row_to_json(p), 'listing', row_to_json(l));
  end if;

  if p.pin_hash is null or extensions.crypt(trim(p_pin), p.pin_hash) <> p.pin_hash then
    update public.pickups
    set status = 'failed'
    where id = p.id
    returning * into p;
    raise exception 'pin_mismatch';
  end if;

  update public.pickups
  set status = 'verified',
      verified_at = now(),
      verified_by = auth.uid()
  where id = p.id
  returning * into p;

  -- Parse quantity as integer bags/meals. Non-numeric values are treated as 0.
  qty_before := coalesce(nullif(regexp_replace(coalesce(l.quantity, ''), '[^0-9]', '', 'g'), '')::int, 0);
  qty_after := greatest(qty_before - 1, 0);

  if qty_after <= 0 then
    update public.listings
    set quantity = '0',
        status = 'completed',
        claim_window_ends_at = null,
        claimed_by = null,
        claimed_at = null,
        updated_at = now()
    where id = l.id
    returning * into l;
  else
    update public.listings
    set quantity = qty_after::text,
        status = 'active',
        claim_window_ends_at = null,
        claimed_by = null,
        claimed_at = null,
        updated_at = now()
    where id = l.id
    returning * into l;
  end if;

  insert into public.impact_events (listing_id, provider_id, recipient_id, event_type, meals_rescued, note)
  values (l.id, l.provider_id, auth.uid(), 'pickup_verified', 1, nullif(trim(p_note), ''));

  return json_build_object('pickup', row_to_json(p), 'listing', row_to_json(l));
end;
$$;

revoke all on function public.recipient_verify_pickup_pin(uuid, text, text) from public;
grant execute on function public.recipient_verify_pickup_pin(uuid, text, text) to authenticated;
