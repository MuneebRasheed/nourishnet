const { Router } = require('express');
const { createClient } = require('@supabase/supabase-js');

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

    const row = {
      provider_id: user.id,
      title,
      food_type: typeof body.foodType === 'string' ? body.foodType.trim() || null : null,
      quantity: typeof body.quantity === 'string' ? body.quantity : '',
      quantity_unit: typeof body.quantityUnit === 'string' ? body.quantityUnit : 'Portions',
      dietary_tags: Array.isArray(body.dietaryTags) ? body.dietaryTags : [],
      allergens: Array.isArray(body.allergens) ? body.allergens : [],
      image_url: typeof body.imageUrl === 'string' ? body.imageUrl.trim() : null,
      pickup_address: typeof body.pickupAddress === 'string' ? body.pickupAddress.trim() : '',
      start_time: typeof body.startTime === 'string' ? body.startTime : '',
      end_time: typeof body.endTime === 'string' ? body.endTime : '',
      note: typeof body.note === 'string' ? body.note.trim() : '',
      status: 'active',
      claim_mode: 'window',
      claim_window_seconds: 180,
    };

    const { data, error } = await supabase.from('listings').insert(row).select().single();
    if (error) {
      console.error('[listings POST]', error);
      return send(res, { error: error.message ?? 'Failed to create listing' }, 500);
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
    return send(res, { listings: data ?? [] }, 200);
  } catch (e) {
    console.error('[listings GET /browse]', e);
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
    if (body.status === 'active' || body.status === 'completed') {
      updates.status = body.status;
    }
    // Full listing update (for edit flow)
    if (typeof body.title === 'string' && body.title.trim()) updates.title = body.title.trim();
    if (body.foodType !== undefined) updates.food_type = typeof body.foodType === 'string' ? body.foodType.trim() || null : null;
    if (typeof body.quantity === 'string') updates.quantity = body.quantity;
    if (typeof body.quantityUnit === 'string') updates.quantity_unit = body.quantityUnit;
    if (Array.isArray(body.dietaryTags)) updates.dietary_tags = body.dietaryTags;
    if (Array.isArray(body.allergens)) updates.allergens = body.allergens;
    if (body.imageUrl !== undefined) updates.image_url = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : null;
    if (typeof body.pickupAddress === 'string') updates.pickup_address = body.pickupAddress.trim();
    if (typeof body.startTime === 'string') updates.start_time = body.startTime;
    if (typeof body.endTime === 'string') updates.end_time = body.endTime;
    if (typeof body.note === 'string') updates.note = body.note.trim();

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
