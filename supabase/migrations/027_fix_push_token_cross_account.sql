-- Prevent cross-account push leaks by enforcing one Expo token owner.
-- This migration:
-- 1) deduplicates existing profile rows by expo_push_token (keeps most recent owner)
-- 2) adds a unique index on non-null tokens
-- 3) exposes an authenticated RPC that atomically reassigns token ownership

WITH ranked AS (
  SELECT
    id,
    expo_push_token,
    row_number() OVER (
      PARTITION BY expo_push_token
      ORDER BY expo_push_token_updated_at DESC NULLS LAST, updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
    ) AS rn
  FROM public.profiles
  WHERE expo_push_token IS NOT NULL
    AND btrim(expo_push_token) <> ''
)
UPDATE public.profiles p
SET
  expo_push_token = NULL,
  expo_push_token_updated_at = NULL
FROM ranked r
WHERE p.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_expo_push_token_unique
  ON public.profiles (expo_push_token)
  WHERE expo_push_token IS NOT NULL
    AND btrim(expo_push_token) <> '';

CREATE OR REPLACE FUNCTION public.set_my_expo_push_token(p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_token text := NULLIF(btrim(p_token), '');
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Ensure a token belongs to one profile only.
  IF v_token IS NOT NULL THEN
    UPDATE public.profiles
    SET
      expo_push_token = NULL,
      expo_push_token_updated_at = NULL
    WHERE expo_push_token = v_token
      AND id <> v_uid;
  END IF;

  UPDATE public.profiles
  SET
    expo_push_token = v_token,
    expo_push_token_updated_at = CASE WHEN v_token IS NULL THEN NULL ELSE now() END
  WHERE id = v_uid;
END;
$$;

REVOKE ALL ON FUNCTION public.set_my_expo_push_token(text) FROM public;
GRANT EXECUTE ON FUNCTION public.set_my_expo_push_token(text) TO authenticated;
