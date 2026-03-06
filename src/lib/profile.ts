import { supabase } from './supabase';
import type { Profile } from '../../store/authStore';

const PROFILE_COLUMNS = 'id, role, email, full_name, avatar_url, address, phone, business_name, business_address, categories, created_at, updated_at';

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    role: data.role ?? null,
    email: data.email ?? null,
    full_name: data.full_name ?? null,
    avatar_url: data.avatar_url ?? null,
    address: data.address ?? null,
    phone: data.phone ?? null,
    business_name: data.business_name ?? null,
    business_address: data.business_address ?? null,
    categories: Array.isArray(data.categories) ? data.categories : [],
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export function getDisplayName(profile: Profile | null): string {
  if (!profile) return '';
  if (profile.role === 'provider' && profile.business_name) return profile.business_name;
  return profile.full_name || profile.email || 'User';
}

export function getAvatarLetter(profile: Profile | null): string {
  if (!profile) return '?';
  const name = profile.full_name || profile.business_name || profile.email || '';
  return name.charAt(0).toUpperCase() || '?';
}
