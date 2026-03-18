-- NourishNet: provider accepts a recipient request (RPC)
-- Run in Supabase Dashboard → SQL Editor, or via Supabase CLI migrations

-- If an older version exists with a different return type, CREATE OR REPLACE will fail.
drop function if exists public.provider_accept_request(uuid);

create or replace function public.provider_accept_request(p_request_id uuid)
returns public.listing_requests
language plpgsql
security definer
set search_path = public
as $provider_accept_request$
declare
  r public.listing_requests;
  l public.listings;
begin
  -- Lock request row
  select * into r
  from public.listing_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'request_not_found';
  end if;

  -- Lock listing row
  select * into l
  from public.listings
  where id = r.listing_id
  for update;

  if not found then
    raise exception 'listing_not_found';
  end if;

  if l.provider_id <> auth.uid() then
    raise exception 'not_allowed';
  end if;

  -- If already claimed/completed/cancelled, do not allow changing winner
  if l.claimed_by is not null or l.status in ('claimed', 'completed', 'cancelled') then
    raise exception 'listing_not_available';
  end if;

  -- If the request is already cancelled/lost, provider can't accept it
  if r.status not in ('pending', 'won') then
    raise exception 'request_not_pending';
  end if;

  -- Idempotent: if already won, just return it
  if r.status = 'won' then
    return r;
  end if;

  -- Claim the listing for the selected recipient
  update public.listings
  set status = 'claimed',
      claimed_by = r.recipient_id,
      claimed_at = now(),
      claim_window_ends_at = null,
      updated_at = now()
  where id = l.id
  returning * into l;

  -- Mark this request as the winner
  update public.listing_requests
  set status = 'won'
  where id = r.id
  returning * into r;

  -- Mark all other pending requests as lost
  update public.listing_requests
  set status = 'lost'
  where listing_id = l.id
    and id <> r.id
    and status = 'pending';

  return r;
end;
$provider_accept_request$;

revoke all on function public.provider_accept_request(uuid) from public;
grant execute on function public.provider_accept_request(uuid) to authenticated;

