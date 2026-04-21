-- Recipient "Need Food Today" / Demand Pulse: prefs + expiry (RLS already allows own profile UPDATE).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS demand_pulse_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS demand_pulse_food_types text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_demand_pulse_food_types_cardinality;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_demand_pulse_food_types_cardinality
  CHECK (cardinality(demand_pulse_food_types) <= 2);

COMMENT ON COLUMN public.profiles.demand_pulse_expires_at IS 'End of demand-pulse window; NULL or past = off.';
COMMENT ON COLUMN public.profiles.demand_pulse_food_types IS 'Up to 2 food_type strings matching listings for priority visibility.';
