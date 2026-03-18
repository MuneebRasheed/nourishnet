-- NourishNet: pickup PIN generation + verification + completion
-- Run in Supabase Dashboard → SQL Editor, or via Supabase CLI migrations

-- Needed for crypt()/gen_salt() and gen_random_uuid()
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- Provider generates + sets a 4-digit PIN for a listing pickup.
-- Returns the plain PIN once (store/display on provider device).
create or replace function public.provider_generate_pickup_pin(p_listing_id uuid)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  l public.listings;
  pin text;
begin
  select * into l
  from public.listings
  where id = p_listing_id
  for update;

  if not found then
    raise exception 'listing_not_found';
  end if;

  if l.provider_id <> auth.uid() then
    raise exception 'not_allowed';
  end if;

  if l.status not in ('claimed', 'completed') then
    raise exception 'listing_not_claimed';
  end if;

  -- Generate a 4-digit string, including leading zeros.
  pin := lpad(((floor(random() * 10000))::int)::text, 4, '0');

  insert into public.pickups (listing_id, provider_id, recipient_id, status, pin_hash, pin_set_at)
  values (l.id, l.provider_id, l.claimed_by, 'pending', extensions.crypt(pin, extensions.gen_salt('bf')), now())
  on conflict (listing_id) do update
    set provider_id = excluded.provider_id,
        recipient_id = excluded.recipient_id,
        status = excluded.status,
        pin_hash = excluded.pin_hash,
        pin_set_at = excluded.pin_set_at;

  return pin;
end;
$$;

revoke all on function public.provider_generate_pickup_pin(uuid) from public;
grant execute on function public.provider_generate_pickup_pin(uuid) to authenticated;

-- Recipient verifies the provider's PIN at pickup.
-- On success: mark pickup verified, mark listing completed, insert impact event (optional note).
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

  update public.listings
  set status = 'completed',
      updated_at = now()
  where id = l.id
  returning * into l;

  insert into public.impact_events (listing_id, provider_id, recipient_id, event_type, meals_rescued, note)
  values (l.id, l.provider_id, l.claimed_by, 'pickup_verified', 0, nullif(trim(p_note), ''));

  return json_build_object('pickup', row_to_json(p), 'listing', row_to_json(l));
end;
$$;

revoke all on function public.recipient_verify_pickup_pin(uuid, text, text) from public;
grant execute on function public.recipient_verify_pickup_pin(uuid, text, text) to authenticated;

