-- Add listing image URL and storage bucket for food photos

ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS image_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Users can upload own listing images" ON storage.objects;
CREATE POLICY "Users can upload own listing images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'listing-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own listing images" ON storage.objects;
CREATE POLICY "Users can update own listing images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'listing-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Listing images are publicly readable" ON storage.objects;
CREATE POLICY "Listing images are publicly readable"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'listing-images');
