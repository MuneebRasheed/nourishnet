const { Router } = require('express');
const { createClient } = require('@supabase/supabase-js');
const { geocodeAddress } = require('../lib/geocode');
const { haversineMeters } = require('../lib/haversine');
const { parseRadiusMeters } = require('../lib/radiusMeters');
const { notifyNearbyRecipients } = require('../lib/notifyNearbyRecipients');
const { isListingVisibleToRecipientNow } = require('../lib/listingVisibility');

const router = Router();
const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

const send = (res, body, status) => res.status(status).json(body);

function getSupabaseWithAuth(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return null;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
}

function getSupabaseService() {
  if (!supabaseUrl || !supabaseServiceRoleKey) return null;
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

/** True if client sent either camelCase or snake_case gap field (own property). */
function bodyDeclaresPreferenceGapSeconds(body) {
  if (!body || typeof body !== 'object') return false;
  return (
    Object.prototype.hasOwnProperty.call(body, 'preferenceGapSeconds') ||
    Object.prototype.hasOwnProperty.call(body, 'preference_gap_seconds')
  );
}

/**
 * 1–300 inclusive, or null to clear / no stagger.
 * Returns undefined only if neither gap field was sent (PATCH: leave column unchanged).
 * Accepts camelCase or snake_case (some proxies / clients only forward one shape).
 */
function readPreferenceGapSeconds(body) {
  if (!body || typeof body !== 'object') return undefined;
  let v;
  if (Object.prototype.hasOwnProperty.call(body, 'preferenceGapSeconds')) {
    v = body.preferenceGapSeconds;
  } else if (Object.prototype.hasOwnProperty.call(body, 'preference_gap_seconds')) {
    v = body.preference_gap_seconds;
  } else {
    return undefined;
  }
  if (v === null || v === '') return null;
  const n = typeof v === 'string' ? Number(String(v).trim()) : Number(v);
  if (!Number.isFinite(n)) return null;
  const r = Math.round(n);
  if (r < 1 || r > 300) return null;
  return r;
}

// ---------- Create listing (POST /listings) ----------
router.post('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const supabase = getSupabaseWithAuth(authHeader);
    if (!supabase) {
      return send(res, { error: 'Server auth is not configured or missing Authorization header' }, 401);
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.id) {
      console.warn('[listings POST] auth.getUser failed', userError);
      return send(res, { error: userError?.message ?? 'Invalid token or user not found' }, 401);
    }

    const body = req.body || {};
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) {
      return send(res, { error: 'Title is required' }, 400);
    }

    const pickupAddress = typeof body.pickupAddress === 'string' ? body.pickupAddress.trim() : '';
    const googleKey = process.env.GOOGLE_MAPS_API_KEY ?? '';
    let pickup_latitude = null;
    let pickup_longitude = null;
    if (pickupAddress && googleKey) {
      try {
        const coords = await geocodeAddress(pickupAddress, googleKey);
        if (coords) {
          pickup_latitude = coords.lat;
          pickup_longitude = coords.lng;
        }
      } catch (geoErr) {
        console.warn('[listings POST] geocode failed, continuing without coords', geoErr?.message ?? geoErr);
      }
    }

    const rawGap = readPreferenceGapSeconds(body);
    const preference_gap_seconds = rawGap === undefined ? null : rawGap;

    const qty = typeof body.quantity === 'string' ? body.quantity : '';
    const totalQtyRaw =
      typeof body.totalQuantity === 'string'
        ? body.totalQuantity.trim()
        : typeof body.total_quantity === 'string'
          ? body.total_quantity.trim()
          : '';
    const total_quantity = totalQtyRaw !== '' ? totalQtyRaw : qty;

    const row = {
      provider_id: user.id,
      title,
      food_type: typeof body.foodType === 'string' ? body.foodType.trim() || null : null,
      quantity: qty,
      total_quantity,
      quantity_unit: typeof body.quantityUnit === 'string' ? body.quantityUnit : 'Portions',
      dietary_tags: Array.isArray(body.dietaryTags) ? body.dietaryTags : [],
      allergens: Array.isArray(body.allergens) ? body.allergens : [],
      image_url: typeof body.imageUrl === 'string' ? body.imageUrl.trim() : null,
      pickup_address: pickupAddress,
      pickup_latitude,
      pickup_longitude,
      start_time: typeof body.startTime === 'string' ? body.startTime : '',
      end_time: typeof body.endTime === 'string' ? body.endTime : '',
      note: typeof body.note === 'string' ? body.note.trim() : '',
      status: 'active',
      claim_mode: 'window',
      claim_window_seconds: 180,
      preference_gap_seconds,
    };

    const { data, error } = await supabase.from('listings').insert(row).select().single();
    if (error) {
      console.error('[listings POST]', error);
      return send(res, { error: error.message ?? 'Failed to create listing' }, 500);
    }

    const service = getSupabaseService();
    if (service && data?.id && pickup_latitude != null && pickup_longitude != null) {
      setImmediate(() => {
        notifyNearbyRecipients(service, data, user.id).catch((e) =>
          console.warn('[listings POST] notifyNearbyRecipients', e?.message ?? e)
        );
      });
    }

    return send(res, { listing: data }, 201);
  } catch (e) {
    console.error('[listings POST]', e);
    return send(res, { error: 'Something went wrong' }, 500);
  }
});

// ---------- Recipient requests a claim (POST /listings/:id/request) ----------
router.post('/:id/request', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const supabase = getSupabaseWithAuth(authHeader);
    if (!supabase) {
      return send(res, { error: 'Server auth is not configured or missing Authorization header' }, 401);
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.id) {
      console.warn('[listings POST /:id/request] auth.getUser failed', userError);
      return send(res, { error: userError?.message ?? 'Invalid token or user not found' }, 401);
    }

    const listingId = req.params.id;
    if (!listingId) {
      return send(res, { error: 'Listing id is required' }, 400);
    }

    const { data, error } = await supabase.rpc('request_claim', { p_listing_id: listingId });
    if (error) {
      console.error('[listings POST /:id/request]', error);
      return send(res, { error: error.message ?? 'Failed to request claim' }, 400);
    }
    return send(res, { request: data }, 200);
  } catch (e) {
    console.error('[listings POST /:id/request]', e);
    return send(res, { error: 'Something went wrong' }, 500);
  }
});

// ---------- Provider generates/sets pickup PIN (POST /listings/:id/pickup-pin) ----------
router.post('/:id/pickup-pin', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const supabase = getSupabaseWithAuth(authHeader);
    if (!supabase) {
      return send(res, { error: 'Server auth is not configured or missing Authorization header' }, 401);
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.id) {
      console.warn('[listings POST /:id/pickup-pin] auth.getUser failed', userError);
      return send(res, { error: userError?.message ?? 'Invalid token or user not found' }, 401);
    }

    const listingId = req.params.id;
    if (!listingId) {
      return send(res, { error: 'Listing id is required' }, 400);
    }

    const { data, error } = await supabase.rpc('provider_generate_pickup_pin', { p_listing_id: listingId });
    if (error) {
      console.error('[listings POST /:id/pickup-pin]', error);
      return send(res, { error: error.message ?? 'Failed to generate pickup PIN' }, 400);
    }
    return send(res, { pin: data }, 200);
  } catch (e) {
    console.error('[listings POST /:id/pickup-pin]', e);
    return send(res, { error: 'Something went wrong' }, 500);
  }
});

// ---------- Recipient verifies pickup PIN (POST /listings/:id/verify-pin) ----------
router.post('/:id/verify-pin', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const supabase = getSupabaseWithAuth(authHeader);
    if (!supabase) {
      return send(res, { error: 'Server auth is not configured or missing Authorization header' }, 401);
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.id) {
      console.warn('[listings POST /:id/verify-pin] auth.getUser failed', userError);
      return send(res, { error: userError?.message ?? 'Invalid token or user not found' }, 401);
    }

    const listingId = req.params.id;
    if (!listingId) {
      return send(res, { error: 'Listing id is required' }, 400);
    }

    const body = req.body || {};
    const pin = typeof body.pin === 'string' ? body.pin.trim() : '';
    const note = typeof body.note === 'string' ? body.note : null;
    if (!pin) {
      return send(res, { error: 'PIN is required' }, 400);
    }

    const { data, error } = await supabase.rpc('recipient_verify_pickup_pin', {
      p_listing_id: listingId,
      p_pin: pin,
      p_note: note,
    });
    if (error) {
      console.error('[listings POST /:id/verify-pin]', error);
      return send(res, { error: error.message ?? 'Failed to verify PIN' }, 400);
    }
    return send(res, { result: data }, 200);
  } catch (e) {
    console.error('[listings POST /:id/verify-pin]', e);
    return send(res, { error: 'Something went wrong' }, 500);
  }
});

// ---------- (Optional) Finalize claim window (POST /listings/:id/finalize) ----------
// This is intentionally locked to service role; use a scheduled job / edge function in production.
router.post('/:id/finalize', async (req, res) => {
  try {
    const adminToken = req.headers['x-admin-token'];
    if (!adminToken || adminToken !== process.env.ADMIN_TOKEN) {
      return send(res, { error: 'Unauthorized' }, 401);
    }
    const supabase = getSupabaseService();
    if (!supabase) {
      return send(res, { error: 'Server misconfigured' }, 500);
    }

    const listingId = req.params.id;
    if (!listingId) {
      return send(res, { error: 'Listing id is required' }, 400);
    }

    const { data, error } = await supabase.rpc('finalize_claim_window', { p_listing_id: listingId });
    if (error) {
      console.error('[listings POST /:id/finalize]', error);
      return send(res, { error: error.message ?? 'Failed to finalize claim' }, 400);
    }
    return send(res, { listing: data }, 200);
  } catch (e) {
    console.error('[listings POST /:id/finalize]', e);
    return send(res, { error: 'Something went wrong' }, 500);
  }
});

// ---------- List my listings (GET /listings) ----------
router.get('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const supabase = getSupabaseWithAuth(authHeader);
    if (!supabase) {
      return send(res, { error: 'Server auth is not configured or missing Authorization header' }, 401);
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.id) {
      console.warn('[listings GET] auth.getUser failed', userError);
      return send(res, { error: userError?.message ?? 'Invalid token or user not found' }, 401);
    }

    const statusFilter = req.query.status; // optional: active | completed
    let query = supabase
      .from('listings')
      .select('*')
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false });
    if (statusFilter === 'active' || statusFilter === 'completed') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[listings GET]', error);
      return send(res, { error: error.message ?? 'Failed to fetch listings' }, 500);
    }
    return send(res, { listings: data ?? [] }, 200);
  } catch (e) {
    console.error('[listings GET]', e);
    return send(res, { error: 'Something went wrong' }, 500);
  }
});

// ---------- Browse all active listings (GET /listings/browse) - for recipients ----------
router.get('/browse', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const supabase = getSupabaseWithAuth(authHeader);
    if (!supabase) {
      return send(res, { error: 'Server auth is not configured or missing Authorization header' }, 401);
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.id) {
      console.warn('[listings GET /browse] auth.getUser failed', userError);
      return send(res, { error: userError?.message ?? 'Invalid token or user not found' }, 401);
    }

    // Prefer service role for browse feed so RLS cannot accidentally hide active listings.
    // If service role isn't configured (common in local dev), gracefully fall back to the
    // authenticated client so the app still works.
    const supabaseService = getSupabaseService();
    const client = supabaseService ?? supabase;

    const { data, error } = await client
      .from('listings')
      .select('*')
      .in('status', ['active', 'request_open'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[listings GET /browse]', error);
      return send(res, { error: error.message ?? 'Failed to fetch listings' }, 500);
    }

    let listings = data ?? [];
    const { data: profileRow, error: profileError } = await client
      .from('profiles')
      .select('role, latitude, longitude, demand_pulse_expires_at, demand_pulse_food_types')
      .eq('id', user.id)
      .maybeSingle();

    const nowMs = Date.now();

    if (!profileError && profileRow?.role === 'recipient') {
      const plat = profileRow.latitude != null ? Number(profileRow.latitude) : null;
      const plng = profileRow.longitude != null ? Number(profileRow.longitude) : null;
      if (
        plat != null &&
        plng != null &&
        Number.isFinite(plat) &&
        Number.isFinite(plng)
      ) {
        const radiusM = parseRadiusMeters();
        listings = listings.filter((row) => {
          const blat = row.pickup_latitude != null ? Number(row.pickup_latitude) : null;
          const blng = row.pickup_longitude != null ? Number(row.pickup_longitude) : null;
          if (blat == null || blng == null || !Number.isFinite(blat) || !Number.isFinite(blng)) {
            return false;
          }
          return haversineMeters(blat, blng, plat, plng) <= radiusM;
        });
      }

      listings = listings.filter((row) => isListingVisibleToRecipientNow(row, profileRow, nowMs));
    }

    return send(res, { listings }, 200);
  } catch (e) {
    console.error('[listings GET /browse]', e);
    return send(res, { error: 'Something went wrong' }, 500);
  }
});

// ---------- Recipient: my requests with listing details (GET /listings/my-requests) ----------
// Uses service role after JWT verification so completed listings are visible (RLS would hide them).
router.get('/my-requests', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const supabase = getSupabaseWithAuth(authHeader);
    if (!supabase) {
      return send(res, { error: 'Server auth is not configured or missing Authorization header' }, 401);
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.id) {
      console.warn('[listings GET /my-requests] auth.getUser failed', userError);
      return send(res, { error: userError?.message ?? 'Invalid token or user not found' }, 401);
    }

    const service = getSupabaseService();
    if (!service) {
      return send(
        res,
        { error: 'Server misconfigured: SUPABASE_SERVICE_ROLE_KEY is required for /listings/my-requests' },
        503
      );
    }

    const { data: reqs, error: reqErr } = await service
      .from('listing_requests')
      .select('id, listing_id, status, created_at')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false });

    if (reqErr) {
      console.error('[listings GET /my-requests] listing_requests', reqErr);
      return send(res, { error: reqErr.message ?? 'Failed to fetch requests' }, 500);
    }

    const rows = reqs ?? [];
    if (rows.length === 0) {
      return send(res, { requests: [] }, 200);
    }

    const listingIds = [...new Set(rows.map((r) => r.listing_id))];
    const { data: listings, error: listErr } = await service
      .from('listings')
      .select(
        'id, title, food_type, quantity, quantity_unit, dietary_tags, allergens, pickup_address, start_time, end_time, note, image_url, status, created_at'
      )
      .in('id', listingIds);

    if (listErr) {
      console.error('[listings GET /my-requests] listings', listErr);
      return send(res, { error: listErr.message ?? 'Failed to fetch listings' }, 500);
    }

    const byId = new Map((listings ?? []).map((l) => [l.id, l]));

    const requests = rows
      .map((r) => {
        const l = byId.get(r.listing_id);
        if (!l) return null;
        return {
          request_id: r.id,
          listing_id: r.listing_id,
          request_status: r.status,
          request_created_at: r.created_at,
          listing_title: l.title,
          food_type: l.food_type,
          quantity: l.quantity,
          quantity_unit: l.quantity_unit,
          dietary_tags: l.dietary_tags,
          allergens: l.allergens,
          pickup_address: l.pickup_address,
          start_time: l.start_time,
          end_time: l.end_time,
          note: l.note,
          image_url: l.image_url,
          listing_status: l.status,
          listing_created_at: l.created_at,
        };
      })
      .filter(Boolean);

    return send(res, { requests }, 200);
  } catch (e) {
    console.error('[listings GET /my-requests]', e);
    return send(res, { error: 'Something went wrong' }, 500);
  }
});

// ---------- Recipient: request status for one listing (GET /listings/:id/my-request) ----------
router.get('/:id/my-request', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const supabase = getSupabaseWithAuth(authHeader);
    if (!supabase) {
      return send(res, { error: 'Server auth is not configured or missing Authorization header' }, 401);
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.id) {
      console.warn('[listings GET /:id/my-request] auth.getUser failed', userError);
      return send(res, { error: userError?.message ?? 'Invalid token or user not found' }, 401);
    }

    const listingId = req.params.id;
    if (!listingId) {
      return send(res, { error: 'Listing id is required' }, 400);
    }

    const { data, error } = await supabase
      .from('listing_requests')
      .select('status')
      .eq('listing_id', listingId)
      .eq('recipient_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('[listings GET /:id/my-request]', error);
      return send(res, { error: error.message ?? 'Failed to load request status' }, 500);
    }
    if (!data) {
      return send(res, { status: 'none' }, 200);
    }
    return send(res, { status: data.status }, 200);
  } catch (e) {
    console.error('[listings GET /:id/my-request]', e);
    return send(res, { error: 'Something went wrong' }, 500);
  }
});

// ---------- Delete listing (DELETE /listings/:id) ----------
router.delete('/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const supabase = getSupabaseWithAuth(authHeader);
    if (!supabase) {
      return send(res, { error: 'Server auth is not configured or missing Authorization header' }, 401);
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.id) {
      console.warn('[listings DELETE] auth.getUser failed', userError);
      return send(res, { error: userError?.message ?? 'Invalid token or user not found' }, 401);
    }

    const id = req.params.id;
    if (!id) {
      return send(res, { error: 'Listing id is required' }, 400);
    }

    const { error: deleteError } = await supabase
      .from('listings')
      .delete()
      .eq('id', id)
      .eq('provider_id', user.id);
    if (deleteError) {
      console.error('[listings DELETE]', deleteError);
      return send(res, { error: deleteError.message ?? 'Failed to delete listing' }, 500);
    }
    return send(res, { success: true }, 200);
  } catch (e) {
    console.error('[listings DELETE]', e);
    return send(res, { error: 'Something went wrong' }, 500);
  }
});

// ---------- Update listing status (PATCH /listings/:id) - e.g. mark completed ----------
router.patch('/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const supabase = getSupabaseWithAuth(authHeader);
    if (!supabase) {
      return send(res, { error: 'Server auth is not configured or missing Authorization header' }, 401);
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.id) {
      console.warn('[listings PATCH] auth.getUser failed', userError);
      return send(res, { error: userError?.message ?? 'Invalid token or user not found' }, 401);
    }

    const id = req.params.id;
    if (!id) {
      return send(res, { error: 'Listing id is required' }, 400);
    }
    const body = req.body || {};
    const updates = { updated_at: new Date().toISOString() };
    if (
      body.status === 'active' ||
      body.status === 'completed' ||
      body.status === 'cancelled'
    ) {
      updates.status = body.status;
    }
    // Full listing update (for edit flow)
    if (typeof body.title === 'string' && body.title.trim()) updates.title = body.title.trim();
    if (body.foodType !== undefined) updates.food_type = typeof body.foodType === 'string' ? body.foodType.trim() || null : null;
    if (typeof body.quantity === 'string') updates.quantity = body.quantity;
    if (typeof body.totalQuantity === 'string') updates.total_quantity = body.totalQuantity;
    else if (typeof body.total_quantity === 'string') updates.total_quantity = body.total_quantity;
    if (typeof body.quantityUnit === 'string') updates.quantity_unit = body.quantityUnit;
    if (Array.isArray(body.dietaryTags)) updates.dietary_tags = body.dietaryTags;
    if (Array.isArray(body.allergens)) updates.allergens = body.allergens;
    if (body.imageUrl !== undefined) updates.image_url = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : null;
    if (typeof body.pickupAddress === 'string') updates.pickup_address = body.pickupAddress.trim();
    if (typeof body.startTime === 'string') updates.start_time = body.startTime;
    if (typeof body.endTime === 'string') updates.end_time = body.endTime;
    if (typeof body.note === 'string') updates.note = body.note.trim();
    if (bodyDeclaresPreferenceGapSeconds(body)) {
      const g = readPreferenceGapSeconds(body);
      if (g !== undefined) updates.preference_gap_seconds = g;
    }

    const { data, error } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', id)
      .eq('provider_id', user.id)
      .select()
      .single();
    if (error) {
      console.error('[listings PATCH]', error);
      return send(res, { error: error.message ?? 'Failed to update listing' }, 500);
    }
    return send(res, { listing: data }, 200);
  } catch (e) {
    console.error('[listings PATCH]', e);
    return send(res, { error: 'Something went wrong' }, 500);
  }
});

module.exports = router;
