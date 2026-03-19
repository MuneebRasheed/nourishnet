import { supabase } from '../supabase';
import { API_BASE_URL } from './client';
import type { ProviderListing, ProviderListingDraft } from '../../../store/providerListingsStore';

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
  image_url?: string | null;
  pickup_address: string;
  start_time: string;
  end_time: string;
  note: string;
  status: 'active' | 'request_open' | 'claimed' | 'completed' | 'cancelled';
  claim_window_ends_at?: string | null;
  claimed_by?: string | null;
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
    imageUrl: row.image_url ?? null,
    pickupAddress: row.pickup_address ?? '',
    startTime: row.start_time ?? '',
    endTime: row.end_time ?? '',
    note: row.note ?? '',
    createdAt: row.created_at,
    status: row.status,
  };
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session: initialSession } } = await supabase.auth.getSession();

  // `getSession()` can return an expired access token (especially after app resume).
  // If we're close to expiry (or already expired), refresh before sending requests.
  let session = initialSession ?? null;
  const expiresAt = session?.expires_at ? session.expires_at * 1000 : null; // seconds -> ms
  const now = Date.now();
  const shouldRefresh = expiresAt != null && expiresAt <= now + 60_000; // refresh if <= 60s remaining
  if (!session || shouldRefresh) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (!refreshError) session = refreshed.session ?? null;
  }

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
      imageUrl: draft.imageUrl ?? null,
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

export async function fetchBrowseListingsApi(): Promise<{ listings: ProviderListing[]; error?: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/listings/browse`, { method: 'GET', headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { listings: [], error: data?.error ?? 'Failed to fetch listings' };
  }
  const listings = (data.listings ?? []).map(mapApiToListing);
  return { listings };
}

export async function requestClaimApi(listingId: string): Promise<{ request: any | null; error?: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/listings/${listingId}/request`, { method: 'POST', headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { request: null, error: data?.error ?? 'Failed to request claim' };
  }
  return { request: data.request ?? null };
}

export async function generatePickupPinApi(listingId: string): Promise<{ pin: string | null; error?: string }> {
  // Use Supabase RPC directly so we don't depend on the local Express API being reachable
  // from the simulator/device.
  const { data, error } = await supabase.rpc('provider_generate_pickup_pin', { p_listing_id: listingId });
  if (error) {
    const msg = (error.message || '').trim();
    const mapped =
      msg === 'listing_not_found'
        ? 'Listing not found.'
        : msg === 'not_allowed'
          ? 'You are not allowed to generate a PIN for this listing.'
          : msg === 'listing_not_claimed'
            ? 'This listing must be claimed before you can generate a pickup PIN.'
            : msg || 'Failed to generate pickup PIN';
    return { pin: null, error: mapped };
  }
  return { pin: typeof data === 'string' ? data : null };
}

export async function verifyPickupPinApi(
  listingId: string,
  pin: string,
  note?: string
): Promise<{ result: any | null; error?: string }> {
  const { data, error } = await supabase.rpc('recipient_verify_pickup_pin', {
    p_listing_id: listingId,
    p_pin: pin,
    p_note: note ?? null,
  });
  if (error) {
    const msg = (error.message || '').trim();
    const mapped =
      msg === 'invalid_pin'
        ? 'Invalid PIN.'
        : msg === 'pin_mismatch'
          ? 'Invalid PIN.'
          : msg === 'pickup_not_initialized'
            ? 'Pickup has not been initialized yet. Ask the provider to generate the pickup PIN.'
            : msg === 'listing_not_claimed'
              ? 'This listing is not claimed yet.'
              : msg === 'not_allowed'
                ? 'You are not allowed to verify this pickup.'
                : msg || 'Failed to verify PIN';
    return { result: null, error: mapped };
  }
  return { result: data ?? null };
}

/** Row shape returned by get_my_requests RPC (Supabase snake_case). */
type MyRequestRow = {
  request_id: string;
  listing_id: string;
  request_status: string;
  request_created_at: string;
  listing_title: string | null;
  food_type: string | null;
  quantity: string | null;
  quantity_unit: string | null;
  dietary_tags: string[] | null;
  allergens: string[] | null;
  pickup_address: string | null;
  start_time: string | null;
  end_time: string | null;
  note: string | null;
  listing_status: string;
  listing_created_at: string;
};

/** One request with listing data for My Requests screen (id = listing_id for navigation). */
export type MyRequestItem = {
  id: string;
  title: string;
  source: string;
  distance: string;
  postedAgo: string;
  portions: string;
  timeSlot: string;
  dietaryTags?: string[];
  listingStatus: string;
};

function formatPostedAgo(createdAt: string): string {
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

function rowToMyRequestItem(row: MyRequestRow): MyRequestItem {
  return {
    id: row.listing_id,
    title: row.listing_title ?? '',
    source: 'Provider',
    distance: '—',
    postedAgo: formatPostedAgo(row.listing_created_at),
    portions: [row.quantity ?? '', row.quantity_unit ?? 'Portions'].filter(Boolean).join(' ') || '0 Portions',
    timeSlot: [row.start_time, row.end_time].filter(Boolean).join(' - ') || '—',
    dietaryTags: row.dietary_tags?.length ? row.dietary_tags : undefined,
    listingStatus: row.listing_status,
  };
}

export async function fetchMyRequestsApi(): Promise<{
  active: MyRequestItem[];
  completed: MyRequestItem[];
  error?: string;
}> {
  const { data, error } = await supabase.rpc('get_my_requests');
  if (error) {
    return { active: [], completed: [], error: error.message ?? 'Failed to fetch my requests' };
  }
  const rows = (Array.isArray(data) ? data : []) as MyRequestRow[];
  const active: MyRequestItem[] = [];
  const completed: MyRequestItem[] = [];
  for (const row of rows) {
    const item = rowToMyRequestItem(row);
    if (row.listing_status === 'completed') {
      completed.push(item);
    } else {
      active.push(item);
    }
  }
  return { active, completed };
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
      imageUrl: draft.imageUrl ?? null,
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
