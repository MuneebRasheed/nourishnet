-- NourishNet: provider declines a recipient request (RPC)
-- Run in Supabase Dashboard → SQL Editor, or via Supabase CLI migrations

create or replace function public.provider_decline_request(p_request_id uuid)
returns public.listing_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.listing_requests;
  l public.listings;
begin
  select * into r
  from public.listing_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'request_not_found';
  end if;

  select * into l
  from public.listings
  where id = r.listing_id
    and provider_id = auth.uid();

  if not found then
    raise exception 'not_allowed';
  end if;

  update public.listing_requests
  set status = 'cancelled'
  where id = r.id
  returning * into r;

  return r;
end;
$$;

revoke all on function public.provider_decline_request(uuid) from public;
grant execute on function public.provider_decline_request(uuid) to authenticated;
