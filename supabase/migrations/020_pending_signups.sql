-- Pending signup records for OTP-first account creation.
CREATE TABLE IF NOT EXISTS public.pending_signups (
  email text PRIMARY KEY,
  role text NOT NULL CHECK (role IN ('provider', 'recipient')),
  signup_otp_hash text NOT NULL,
  signup_otp_expires_at timestamptz NOT NULL,
  otp_attempts integer NOT NULL DEFAULT 0,
  last_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS pending_signups_email_lower_idx
  ON public.pending_signups (lower(email));

ALTER TABLE public.pending_signups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct access to pending_signups" ON public.pending_signups;
CREATE POLICY "No direct access to pending_signups"
  ON public.pending_signups
  FOR ALL
  TO public
  USING (false)
  WITH CHECK (false);
