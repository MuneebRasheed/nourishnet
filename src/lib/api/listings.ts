import { supabase } from '../supabase';
import { API_BASE_URL } from './client';
import type { ProviderListing, ProviderListingDraft } from '../../../store/providerListingsStore';

/** Shape returned by the server (Supabase snake_case) */
export type ApiListing = {
  id: string;
  provider_id: string;
  title: string;
  food_type: string | null;
  quantity: string;
  total_quantity?: string | null;
  quantity_unit: string;
  dietary_tags: string[];
  allergens: string[];
  image_url?: string | null;
  pickup_address: string;
  pickup_latitude?: number | null;
  pickup_longitude?: number | null;
  start_time: string;
  end_time: string;
  note: string;
  status: 'active' | 'request_open' | 'claimed' | 'completed' | 'cancelled';
  claim_window_ends_at?: string | null;
  claimed_by?: string | null;
  preference_gap_seconds?: number | null;
  created_at: string;
  updated_at: string;
};

function numOrNull(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function mapApiToListing(row: ApiListing): ProviderListing {
  return {
    id: row.id,
    title: row.title,
    foodType: row.food_type,
    quantity: row.quantity != null ? String(row.quantity) : '',
    totalQuantity:
      row.total_quantity != null && String(row.total_quantity).trim() !== ''
        ? String(row.total_quantity)
        : row.quantity != null
          ? String(row.quantity)
          : '',
    quantityUnit: row.quantity_unit ?? 'Portions',
    dietaryTags: row.dietary_tags ?? [],
    allergens: row.allergens ?? [],
    imageUrl: row.image_url ?? null,
    pickupAddress: row.pickup_address ?? '',
    pickupLatitude: numOrNull(row.pickup_latitude),
    pickupLongitude: numOrNull(row.pickup_longitude),
    startTime: row.start_time ?? '',
    endTime: row.end_time ?? '',
    note: row.note ?? '',
    createdAt: row.created_at != null ? String(row.created_at) : '',
    status: row.status,
    preferenceGapSeconds: numOrNull(row.preference_gap_seconds),
  };
}

/** Maps Realtime `payload.new` or any compatible snake_case row to `ProviderListing`. */
export function listingRowToProviderListing(row: Record<string, unknown>): ProviderListing | null {
  if (!row || typeof row !== 'object') return null;
  const id = row.id;
  const title = row.title;
  if (typeof id !== 'string' || !id || typeof title !== 'string') return null;
  const status = row.status;
  if (
    status !== 'active' &&
    status !== 'request_open' &&
    status !== 'claimed' &&
    status !== 'completed' &&
    status !== 'cancelled'
  ) {
    return null;
  }
  return mapApiToListing(row as unknown as ApiListing);
}

async function ensureListingImageUrl(
  listingId: string,
  desiredImageUrl?: string | null
): Promise<ApiListing | null> {
  if (!desiredImageUrl) return null;
  const { data, error } = await supabase
    .from('listings')
    .update({ image_url: desiredImageUrl })
    .eq('id', listingId)
    .select('*')
    .single();
  if (error || !data) return null;
  return data as ApiListing;
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
    try {
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
      if (!refreshError) {
        session = refreshed.session ?? null;
      } else {
        const msg = (refreshError.message ?? '').toLowerCase();
        if (!(msg.includes('refresh token') && msg.includes('not found'))) {
          // Keep existing session fallback behavior for non-token-not-found errors.
          session = initialSession ?? null;
        } else {
          session = null;
        }
      }
    } catch {
      session = initialSession ?? null;
    }
  }

  const token = session?.access_token;
  if (!token) {
    // Ensure local client state is explicitly signed out instead of silently
    // continuing with unauthenticated API requests.
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
  }
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function createListingApi(draft: ProviderListingDraft): Promise<{ listing: ProviderListing | null; error?: string }> {
  const headers = await getAuthHeaders();
  const gap = draft.preferenceGapSeconds ?? null;
  const res = await fetch(`${API_BASE_URL}/listings`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: draft.title,
      foodType: draft.foodType,
      quantity: draft.quantity,
      totalQuantity: draft.totalQuantity?.trim() ? draft.totalQuantity : draft.quantity,
      quantityUnit: draft.quantityUnit,
      dietaryTags: draft.dietaryTags,
      allergens: draft.allergens,
      imageUrl: draft.imageUrl ?? null,
      pickupAddress: draft.pickupAddress,
      startTime: draft.startTime,
      endTime: draft.endTime,
      note: draft.note,
      preferenceGapSeconds: gap,
      preference_gap_seconds: gap,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { listing: null, error: data?.error ?? 'Failed to create listing' };
  }
  let apiListing: ApiListing | null = data.listing ?? null;
  if (apiListing && draft.imageUrl && !apiListing.image_url) {
    const patched = await ensureListingImageUrl(apiListing.id, draft.imageUrl);
    if (patched) apiListing = patched;
  }
  const listing = apiListing ? mapApiToListing(apiListing) : null;
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

/** Integer from `quantity` string (digits only), same idea as pickup decrement in DB. */
export function parseListingQuantityInt(quantity: string | undefined | null): number {
  const digits = String(quantity ?? '').replace(/[^0-9]/g, '');
  if (!digits) return 0;
  return parseInt(digits, 10) || 0;
}

/**
 * `totalQuantity` = original batch size. On create, same as `draftQuantity`.
 * On edit, keep the stored original unless the user raised quantity above it (restock).
 */
export function resolveTotalQuantityForSave(
  draftQuantity: string,
  editListing: ProviderListing | undefined
): string {
  const q = (draftQuantity ?? '').trim() || draftQuantity;
  if (!editListing) return q;
  const base = (editListing.totalQuantity?.trim() || editListing.quantity || '').trim();
  if (!base) return q;
  const dn = parseListingQuantityInt(q);
  const bn = parseListingQuantityInt(base);
  if (dn >= bn) return q;
  return base;
}

const LISTING_STATUSES_OPEN_FOR_COMPLETION: ProviderListing['status'][] = ['active', 'request_open', 'claimed'];

/** True if this listing should be treated as finished (no remaining quantity). */
export function listingHasZeroQuantity(listing: Pick<ProviderListing, 'quantity'>): boolean {
  return parseListingQuantityInt(listing.quantity) <= 0;
}

/**
 * Legacy compatibility helper.
 * Completion is now driven by pickup verification flow on the backend,
 * so quantity=0 is not auto-finalized on read.
 */
export async function finalizeZeroQuantityListingsOnServer(listings: ProviderListing[]): Promise<ProviderListing[]> {
  const _openStatuses = LISTING_STATUSES_OPEN_FOR_COMPLETION;
  void _openStatuses;
  return listings;
}

/**
 * Defensive client-side normalization for mixed backend versions:
 * - keep listings active when accepted recipients are still unverified
 * - move listings to completed when quantity is 0 and all accepted recipients are verified
 */
async function reconcileProviderListingCompletionState(
  listings: ProviderListing[]
): Promise<ProviderListing[]> {
  const listingIds = listings.map((l) => l.id);
  if (listingIds.length === 0) return listings;

  const { data: wonRows, error: wonError } = await supabase
    .from('listing_requests')
    .select('listing_id, recipient_id')
    .in('listing_id', listingIds)
    .eq('status', 'won');
  if (wonError) return listings;

  const { data: verifiedRows, error: verifiedError } = await supabase
    .from('impact_events')
    .select('listing_id, recipient_id')
    .in('listing_id', listingIds)
    .eq('event_type', 'pickup_verified');
  if (verifiedError) return listings;

  const verified = new Set(
    (verifiedRows ?? []).map((r) => `${String(r.listing_id)}::${String(r.recipient_id)}`)
  );
  const hasWonUnverified = new Set<string>();
  for (const row of wonRows ?? []) {
    const lid = String(row.listing_id);
    const key = `${String(row.listing_id)}::${String(row.recipient_id)}`;
    if (!verified.has(key)) hasWonUnverified.add(lid);
  }

  return listings.map((l) => {
    if (l.status === 'cancelled') return l;
    const qtyZero = listingHasZeroQuantity(l);
    if (qtyZero && !hasWonUnverified.has(l.id)) {
      return l.status === 'completed' ? l : { ...l, status: 'completed' };
    }
    if (hasWonUnverified.has(l.id)) {
      return l.status === 'active' ? l : { ...l, status: 'active' };
    }
    // If quantity is not zero and no pending accepted-verification work remains,
    // preserve backend status as-is.
    return l;
  });
}

/** Fetches provider listings without client-side status mutation. */
export async function fetchProviderListingsWithZeroQuantityResolved(): Promise<{
  listings: ProviderListing[];
  error?: string;
}> {
  const { listings, error } = await fetchListingsApi();
  if (error) return { listings: [], error };
  const reconciled = await reconcileProviderListingCompletionState(listings);
  return { listings: reconciled };
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
    const msg = (data?.error || '').trim();
    const mapped =
      msg === 'already_requested'
        ? 'already_requested'
        : msg === 'listing_not_requestable'
          ? 'listing_not_requestable'
          : msg === 'requests_fully_booked' || msg.includes('requests_fully_booked')
            ? 'requests_fully_booked'
            : msg || 'Failed to request claim';
    return { request: null, error: mapped };
  }
  return { request: data.request ?? null };
}

export async function providerAcceptRequestApi(
  requestId: string
): Promise<{ request: any | null; error?: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/listings/requests/${requestId}/accept`, {
    method: 'POST',
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data?.error || '').trim();
    const mapped =
      msg === 'request_not_found'
        ? 'Request no longer exists.'
        : msg === 'not_allowed'
          ? 'You are not allowed to accept this request.'
          : msg === 'listing_not_available'
            ? 'Listing is no longer available.'
            : msg === 'request_not_pending'
              ? 'This request is no longer pending.'
              : msg || 'Failed to accept request';
    return { request: null, error: mapped };
  }
  return { request: data.request ?? null };
}

export async function providerDeclineRequestApi(
  requestId: string
): Promise<{ request: any | null; error?: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/listings/requests/${requestId}/decline`, {
    method: 'POST',
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data?.error || '').trim();
    const mapped =
      msg === 'request_not_found'
        ? 'Request no longer exists.'
        : msg === 'not_allowed'
          ? 'You are not allowed to decline this request.'
          : msg || 'Failed to decline request';
    return { request: null, error: mapped };
  }
  return { request: data.request ?? null };
}

export async function generatePickupPinApi(
  listingId: string,
  recipientId?: string
): Promise<{ pin: string | null; error?: string }> {
  // Use Supabase RPC directly so we don't depend on the local Express API being reachable
  // from the simulator/device.
  const params: { p_listing_id: string; p_recipient_id?: string } = { p_listing_id: listingId };
  if (recipientId) params.p_recipient_id = recipientId;
  let { data, error } = await supabase.rpc('provider_generate_pickup_pin', params);

  // Backward compatibility: some environments still have the old signature
  // provider_generate_pickup_pin(p_listing_id uuid).
  if (
    error &&
    recipientId &&
    String(error.message || '').includes('provider_generate_pickup_pin(p_listing_id, p_recipient_id)')
  ) {
    const fallback = await supabase.rpc('provider_generate_pickup_pin', { p_listing_id: listingId });
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    const msg = (error.message || '').trim();
    const mapped =
      msg === 'listing_not_found'
        ? 'Listing not found.'
        : msg === 'not_allowed'
          ? 'You are not allowed to generate a PIN for this listing.'
          : msg === 'listing_not_claimed'
            ? 'This listing must be claimed before you can generate a pickup PIN.'
            : msg === 'recipient_not_accepted'
              ? 'Pickup PIN can be generated only for an accepted recipient.'
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

/** True if the current user has a recorded verified pickup for this listing (durable after PIN/QR success). */
export async function fetchRecipientPickupVerifiedForListing(
  listingId: string
): Promise<{ verified: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return { verified: false };
  const { data, error } = await supabase
    .from('impact_events')
    .select('id')
    .eq('listing_id', listingId)
    .eq('recipient_id', user.id)
    .eq('event_type', 'pickup_verified')
    .limit(1)
    .maybeSingle();
  if (error) return { verified: false, error: error.message };
  return { verified: data != null };
}

/** Recipients who completed pickup for this listing (provider RLS: own listings’ events). */
export async function fetchPickupVerifiedRecipientIdsForListing(
  listingId: string
): Promise<{ recipientIds: string[]; error?: string }> {
  const { data, error } = await supabase
    .from('impact_events')
    .select('recipient_id')
    .eq('listing_id', listingId)
    .eq('event_type', 'pickup_verified');
  if (error) return { recipientIds: [], error: error.message };
  const ids = new Set<string>();
  for (const row of data ?? []) {
    const id = row.recipient_id as string | null | undefined;
    if (typeof id === 'string' && id.length > 0) ids.add(id);
  }
  return { recipientIds: [...ids] };
}

/** Row shape returned by GET /listings/my-requests (snake_case). */
type MyRequestRow = {
  request_id: string;
  listing_id: string;
  request_status: string;
  request_created_at: string;
  provider_name: string | null;
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
  image_url: string | null;
  listing_status: string;
  listing_created_at: string;
};

/** Listing request row status from `listing_requests` (provider accept/decline / window). */
export type RecipientRequestStatus = 'pending' | 'won' | 'lost' | 'cancelled';

/** One request with listing data for My Requests screen (id = listing_id for navigation). */
export type MyRequestItem = {
  id: string;
  imageUrl?: string | null;
  title: string;
  source: string;
  distance: string;
  pickupAddress?: string;
  postedAgo: string;
  portions: string;
  timeSlot: string;
  dietaryTags?: string[];
  listingStatus: string;
  /** Status of this recipient's request for the listing */
  requestStatus: RecipientRequestStatus;
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

function normalizeRequestStatus(s: string): RecipientRequestStatus | null {
  if (s === 'pending' || s === 'won' || s === 'lost' || s === 'cancelled') return s;
  return null;
}

/** Listing IDs where the current user has a recorded verified pickup (PIN/QR). */
async function fetchPickupVerifiedListingIdsForUser(listingIds: string[]): Promise<Set<string>> {
  const out = new Set<string>();
  if (listingIds.length === 0) return out;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return out;
  const { data, error } = await supabase
    .from('impact_events')
    .select('listing_id')
    .eq('recipient_id', user.id)
    .eq('event_type', 'pickup_verified')
    .in('listing_id', listingIds);
  if (error) return out;
  for (const row of data ?? []) {
    const lid = row.listing_id as string | null | undefined;
    if (typeof lid === 'string' && lid.length > 0) out.add(lid);
  }
  return out;
}

function myRequestRowIsCompleted(row: MyRequestRow, pickupVerifiedListingIds: Set<string>): boolean {
  if (pickupVerifiedListingIds.has(row.listing_id)) return true;
  return false;
}

function rowToMyRequestItem(row: MyRequestRow): MyRequestItem {
  const requestStatus = normalizeRequestStatus(row.request_status) ?? 'pending';
  return {
    id: row.listing_id,
    imageUrl: row.image_url ?? null,
    title: row.listing_title ?? '',
    source: row.provider_name?.trim() || 'Provider',
    distance: row.pickup_address?.trim() || '',
    pickupAddress: row.pickup_address?.trim() || '',
    postedAgo: formatPostedAgo(row.listing_created_at),
    portions: [row.quantity ?? '', row.quantity_unit ?? 'Portions'].filter(Boolean).join(' ') || '0 Portions',
    timeSlot: [row.start_time, row.end_time].filter(Boolean).join(' - ') || '—',
    dietaryTags: row.dietary_tags?.length ? row.dietary_tags : undefined,
    listingStatus: row.listing_status,
    requestStatus,
  };
}

/** Current user's request for a listing, if any (`none` = no row). */
export async function fetchMyRequestStatusForListing(
  listingId: string
): Promise<{ status: RecipientRequestStatus | 'none'; error?: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/listings/${listingId}/my-request`, {
    method: 'GET',
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { status: 'none', error: data?.error ?? 'Failed to load request status' };
  }
  const s = data?.status as string | undefined;
  if (s === 'none' || s == null) return { status: 'none' };
  const normalized = normalizeRequestStatus(s);
  return { status: normalized ?? 'pending' };
}

export async function fetchMyRequestsApi(): Promise<{
  active: MyRequestItem[];
  completed: MyRequestItem[];
  error?: string;
}> {
  const headers = await getAuthHeaders();
  if (!headers.Authorization) {
    return {
      active: [],
      completed: [],
      error: 'Your session expired. Please log in again.',
    };
  }
  const res = await fetch(`${API_BASE_URL}/listings/my-requests`, { method: 'GET', headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const raw = String(data?.error ?? '').trim();
    const mapped =
      raw === 'Server auth is not configured or missing Authorization header'
        ? 'Your session expired. Please log in again.'
        : raw || 'Failed to fetch my requests';
    return {
      active: [],
      completed: [],
      error: mapped,
    };
  }
  const rows = (Array.isArray(data.requests) ? data.requests : []) as MyRequestRow[];
  const uniqueListingIds = [...new Set(rows.map((r) => r.listing_id))];
  const pickupVerifiedListingIds = await fetchPickupVerifiedListingIdsForUser(uniqueListingIds);

  const active: MyRequestItem[] = [];
  const completed: MyRequestItem[] = [];
  for (const row of rows) {
    const item = rowToMyRequestItem(row);
    if (myRequestRowIsCompleted(row, pickupVerifiedListingIds)) {
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
  const gap = draft.preferenceGapSeconds ?? null;
  const res = await fetch(`${API_BASE_URL}/listings/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      title: draft.title,
      foodType: draft.foodType,
      quantity: draft.quantity,
      totalQuantity: draft.totalQuantity?.trim() ? draft.totalQuantity : draft.quantity,
      quantityUnit: draft.quantityUnit,
      dietaryTags: draft.dietaryTags,
      allergens: draft.allergens,
      imageUrl: draft.imageUrl ?? null,
      pickupAddress: draft.pickupAddress,
      startTime: draft.startTime,
      endTime: draft.endTime,
      note: draft.note,
      preferenceGapSeconds: gap,
      preference_gap_seconds: gap,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { listing: null, error: data?.error ?? 'Failed to update listing' };
  }
  let apiListing: ApiListing | null = data.listing ?? null;
  if (apiListing && draft.imageUrl && !apiListing.image_url) {
    const patched = await ensureListingImageUrl(apiListing.id, draft.imageUrl);
    if (patched) apiListing = patched;
  }
  const listing = apiListing ? mapApiToListing(apiListing) : null;
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

/** Marks listing inactive (cancelled): hidden from browse, not deleted. */
export async function cancelListingApi(id: string): Promise<{ listing: ProviderListing | null; error?: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/listings/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status: 'cancelled' }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { listing: null, error: data?.error ?? 'Failed to mark listing inactive' };
  }
  const listing = data.listing ? mapApiToListing(data.listing) : null;
  return { listing };
}

/** Reactivates a cancelled (inactive) listing so recipients can see it again. */
export async function activateListingApi(id: string): Promise<{ listing: ProviderListing | null; error?: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/listings/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status: 'active' }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { listing: null, error: data?.error ?? 'Failed to reactivate listing' };
  }
  const listing = data.listing ? mapApiToListing(data.listing) : null;
  return { listing };
}
