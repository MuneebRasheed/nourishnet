-- Fix: Remove the "Recipients can read listings they requested" policy that causes
-- infinite recursion (listings policy checks listing_requests, which has a policy
-- that checks listings). The get_my_requests() RPC is SECURITY DEFINER and reads
-- both tables with definer rights, so it does not need this policy.

DROP POLICY IF EXISTS "Recipients can read listings they requested" ON public.listings;
