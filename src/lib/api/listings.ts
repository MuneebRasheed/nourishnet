import { supabase } from '../supabase';
import { API_BASE_URL } from './client';
import type { ProviderListing, ProviderListingDraft } from '../../store/providerListingsStore';

/** Shape returned by the server (Supabase snake_case) */
type ApiListing = {
  id: string;
  provider_id: string;
  title: string;
  food_type: string | null;
  quantity: string;
  quantity_unit: string;
  dietary_tags: string[];
  allergens: string[];
  pickup_address: string;
  start_time: string;
  end_time: string;
  note: string;
  status: 'active' | 'completed';
  created_at: string;
  updated_at: string;
};

function mapApiToListing(row: ApiListing): ProviderListing {
  return {
    id: row.id,
    title: row.title,
    foodType: row.food_type,
    quantity: row.quantity ?? '',
    quantityUnit: row.quantity_unit ?? 'Portions',
    dietaryTags: row.dietary_tags ?? [],
    allergens: row.allergens ?? [],
    pickupAddress: row.pickup_address ?? '',
    startTime: row.start_time ?? '',
    endTime: row.end_time ?? '',
    note: row.note ?? '',
    createdAt: row.created_at,
    status: row.status,
  };
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function createListingApi(draft: ProviderListingDraft): Promise<{ listing: ProviderListing | null; error?: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/listings`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: draft.title,
      foodType: draft.foodType,
      quantity: draft.quantity,
      quantityUnit: draft.quantityUnit,
      dietaryTags: draft.dietaryTags,
      allergens: draft.allergens,
      pickupAddress: draft.pickupAddress,
      startTime: draft.startTime,
      endTime: draft.endTime,
      note: draft.note,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { listing: null, error: data?.error ?? 'Failed to create listing' };
  }
  const listing = data.listing ? mapApiToListing(data.listing) : null;
  return { listing };
}

export async function fetchListingsApi(status?: 'active' | 'completed'): Promise<{ listings: ProviderListing[]; error?: string }> {
  const headers = await getAuthHeaders();
  const url = status ? `${API_BASE_URL}/listings?status=${status}` : `${API_BASE_URL}/listings`;
  const res = await fetch(url, { method: 'GET', headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { listings: [], error: data?.error ?? 'Failed to fetch listings' };
  }
  const listings = (data.listings ?? []).map(mapApiToListing);
  return { listings };
}

export async function deleteListingApi(id: string): Promise<{ error?: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/listings/${id}`, { method: 'DELETE', headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: data?.error ?? 'Failed to delete listing' };
  }
  return {};
}

export async function updateListingApi(
  id: string,
  draft: ProviderListingDraft
): Promise<{ listing: ProviderListing | null; error?: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/listings/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      title: draft.title,
      foodType: draft.foodType,
      quantity: draft.quantity,
      quantityUnit: draft.quantityUnit,
      dietaryTags: draft.dietaryTags,
      allergens: draft.allergens,
      pickupAddress: draft.pickupAddress,
      startTime: draft.startTime,
      endTime: draft.endTime,
      note: draft.note,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { listing: null, error: data?.error ?? 'Failed to update listing' };
  }
  const listing = data.listing ? mapApiToListing(data.listing) : null;
  return { listing };
}

export async function completeListingApi(id: string): Promise<{ listing: ProviderListing | null; error?: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/listings/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status: 'completed' }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { listing: null, error: data?.error ?? 'Failed to update listing' };
  }
  const listing = data.listing ? mapApiToListing(data.listing) : null;
  return { listing };
}
