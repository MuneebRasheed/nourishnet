-- Store Expo push token per profile (iOS client registers and updates own row via RLS)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS expo_push_token text,
  ADD COLUMN IF NOT EXISTS expo_push_token_updated_at timestamptz;

COMMENT ON COLUMN public.profiles.expo_push_token IS 'Expo push token (ExponentPushToken[...]) for remote notifications';
COMMENT ON COLUMN public.profiles.expo_push_token_updated_at IS 'Last time the client refreshed the push token';
