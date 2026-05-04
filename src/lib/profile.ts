import { supabase } from './supabase';
import type { Profile } from '../../store/authStore';
import { isGoogleMapsConfigured } from './googleMaps';

const PROFILE_COLUMNS =
  'id, role, email, full_name, avatar_url, address, latitude, longitude, phone, business_name, business_address, business_latitude, business_longitude, categories, demand_pulse_expires_at, demand_pulse_food_types, created_at, updated_at';

function normalizeRole(role: unknown): Profile['role'] {
  if (typeof role !== 'string') return null;
  const v = role.trim().toLowerCase();
  if (v === 'provider') return 'provider';
  if (v === 'recipient') return 'recipient';
  // Common variants (keeps app resilient to older DB values)
  if (v === 'food_provider' || v === 'food provider') return 'provider';
  if (v === 'food_recipient' || v === 'food recipient') return 'recipient';
  return null;
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    role: normalizeRole(data.role),
    email: data.email ?? null,
    full_name: data.full_name ?? null,
    avatar_url: data.avatar_url ?? null,
    address: data.address ?? null,
    latitude:
      data.latitude != null && Number.isFinite(Number(data.latitude)) ? Number(data.latitude) : null,
    longitude:
      data.longitude != null && Number.isFinite(Number(data.longitude)) ? Number(data.longitude) : null,
    phone: data.phone ?? null,
    business_name: data.business_name ?? null,
    business_address: data.business_address ?? null,
    business_latitude:
      data.business_latitude != null && Number.isFinite(Number(data.business_latitude))
        ? Number(data.business_latitude)
        : null,
    business_longitude:
      data.business_longitude != null && Number.isFinite(Number(data.business_longitude))
        ? Number(data.business_longitude)
        : null,
    categories: Array.isArray(data.categories) ? data.categories : [],
    demand_pulse_expires_at:
      data.demand_pulse_expires_at != null && typeof data.demand_pulse_expires_at === 'string'
        ? data.demand_pulse_expires_at
        : null,
    demand_pulse_food_types: Array.isArray(data.demand_pulse_food_types)
      ? data.demand_pulse_food_types.filter((t): t is string => typeof t === 'string')
      : [],
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

/** True until role is set and required fields for that role are filled (matches email signup → profile screens). */
export function needsProfileCompletion(profile: Profile | null): boolean {
  if (!profile) return true;
  if (!profile.role) return true;
  if (profile.role === 'provider') {
    const blat = profile.business_latitude ?? null;
    const blng = profile.business_longitude ?? null;
    const needsBusinessCoords =
      isGoogleMapsConfigured() && (blat == null || blng == null);
    return (
      !profile.business_name?.trim() ||
      !profile.business_address?.trim() ||
      !String(profile.phone ?? '').trim() ||
      needsBusinessCoords
    );
  }
  if (profile.role === 'recipient') {
    const lat = profile.latitude ?? null;
    const lng = profile.longitude ?? null;
    const needsCoords = isGoogleMapsConfigured() && (lat == null || lng == null);
    // Full name is optional for recipients, only address is required
    return !profile.address?.trim() || needsCoords;
  }
  return true;
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

/**
 * Storage uploads often reuse the same public URL (upsert same path). React Native's Image
 * caches by URI, so use a stable version key (e.g. profile.updated_at) to force refetch after updates.
 */
export function avatarUriWithCacheBust(
  url: string | null | undefined,
  cacheKey?: string | null
): string | undefined {
  if (url == null || typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (!/^https?:\/\//i.test(trimmed)) return trimmed;
  const key = cacheKey?.trim();
  if (!key) return trimmed;
  const sep = trimmed.includes('?') ? '&' : '?';
  return `${trimmed}${sep}v=${encodeURIComponent(key)}`;
}
