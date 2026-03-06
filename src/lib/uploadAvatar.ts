import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

const BUCKET = 'avatars';

export type PickImageResult = { uri: string; base64: string | null } | null;

export async function pickImage(): Promise<PickImageResult> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    base64: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    base64: asset.base64 ?? null,
  };
}

/**
 * Upload avatar to Supabase Storage and return the public URL.
 * Uses base64 for React Native compatibility.
 */
export async function uploadAvatar(userId: string, base64: string, contentType = 'image/jpeg'): Promise<string | null> {
  const ext = contentType.includes('png') ? 'png' : 'jpg';
  const path = `${userId}/avatar.${ext}`;
  const arrayBuffer = decode(base64);
  const { error } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, {
    contentType,
    upsert: true,
  });
  if (error) {
    console.error('[uploadAvatar]', error);
    return null;
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
