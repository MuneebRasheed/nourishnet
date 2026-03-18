-- Allow providers to read profile (id, full_name, avatar_url) of users who have
-- requested their listings, so the Listing Requests screen can show requester names.

DROP POLICY IF EXISTS "Providers can read requester profiles" ON public.profiles;
CREATE POLICY "Providers can read requester profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.listing_requests lr
      JOIN public.listings l ON l.id = lr.listing_id AND l.provider_id = auth.uid()
      WHERE lr.recipient_id = profiles.id
    )
  );
