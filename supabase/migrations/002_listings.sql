-- NourishNet: food listings (provider posts)
-- Run in Supabase Dashboard → SQL Editor, or via Supabase CLI

CREATE TABLE IF NOT EXISTS public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  food_type text,
  quantity text DEFAULT '',
  quantity_unit text DEFAULT 'Portions',
  dietary_tags text[] DEFAULT '{}',
  allergens text[] DEFAULT '{}',
  pickup_address text DEFAULT '',
  start_time text DEFAULT '',
  end_time text DEFAULT '',
  note text DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Index for listing by provider and status
CREATE INDEX IF NOT EXISTS idx_listings_provider_id ON public.listings(provider_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.listings(created_at DESC);

-- RLS
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Providers can do everything on their own listings
DROP POLICY IF EXISTS "Users can read own listings" ON public.listings;
CREATE POLICY "Users can read own listings"
  ON public.listings FOR SELECT
  USING (auth.uid() = provider_id);

DROP POLICY IF EXISTS "Users can insert own listings" ON public.listings;
CREATE POLICY "Users can insert own listings"
  ON public.listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = provider_id);

DROP POLICY IF EXISTS "Users can update own listings" ON public.listings;
CREATE POLICY "Users can update own listings"
  ON public.listings FOR UPDATE
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

DROP POLICY IF EXISTS "Users can delete own listings" ON public.listings;
CREATE POLICY "Users can delete own listings"
  ON public.listings FOR DELETE
  USING (auth.uid() = provider_id);

-- Optional: allow public/recipients to read active listings (for discovery)
-- Uncomment if you want a public feed later:
DROP POLICY IF EXISTS "Anyone can read active listings" ON public.listings;
CREATE POLICY "Anyone can read active listings"
  ON public.listings FOR SELECT
  USING (status = 'active');

COMMENT ON TABLE public.listings IS 'Food surplus listings posted by providers';
