import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

const BUCKET = 'listing-images';

export type PickListingImageResult = {
  uri: string;
  base64: string | null;
  mimeType: string | null;
} | { denied: true } | null;

export async function pickListingImage(): Promise<PickListingImageResult> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return { denied: true };

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
    base64: true,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    base64: asset.base64 ?? null,
    mimeType: asset.mimeType ?? 'image/jpeg',
  };
}

export async function uploadListingImage(
  userId: string,
  base64: string,
  listingIdHint?: string,
  contentType = 'image/jpeg'
): Promise<string | null> {
  const safeType = contentType || 'image/jpeg';
  const ext = safeType.includes('png') ? 'png' : safeType.includes('webp') ? 'webp' : 'jpg';
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const filename = `${listingIdHint ?? 'new'}-${unique}.${ext}`;
  const path = `${userId}/${filename}`;
  const arrayBuffer = decode(base64);

  const { error } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, {
    contentType: safeType,
    upsert: false,
  });
  if (error) {
    console.error('[uploadListingImage]', error);
    return null;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
