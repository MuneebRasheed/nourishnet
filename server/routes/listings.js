const { Router } = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = Router();
const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? '';

const send = (res, body, status) => res.status(status).json(body);

function getSupabaseWithAuth(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
}

// ---------- Create listing (POST /listings) ----------
router.post('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const supabase = getSupabaseWithAuth(authHeader);
    if (!supabase) {
      return send(res, { error: 'Missing or invalid Authorization header' }, 401);
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.id) {
      return send(res, { error: 'Invalid token or user not found' }, 401);
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
      pickup_address: typeof body.pickupAddress === 'string' ? body.pickupAddress.trim() : '',
      start_time: typeof body.startTime === 'string' ? body.startTime : '',
      end_time: typeof body.endTime === 'string' ? body.endTime : '',
      note: typeof body.note === 'string' ? body.note.trim() : '',
      status: 'active',
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

// ---------- List my listings (GET /listings) ----------
router.get('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const supabase = getSupabaseWithAuth(authHeader);
    if (!supabase) {
      return send(res, { error: 'Missing or invalid Authorization header' }, 401);
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.id) {
      return send(res, { error: 'Invalid token or user not found' }, 401);
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

// ---------- Delete listing (DELETE /listings/:id) ----------
router.delete('/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const supabase = getSupabaseWithAuth(authHeader);
    if (!supabase) {
      return send(res, { error: 'Missing or invalid Authorization header' }, 401);
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.id) {
      return send(res, { error: 'Invalid token or user not found' }, 401);
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
      return send(res, { error: 'Missing or invalid Authorization header' }, 401);
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.id) {
      return send(res, { error: 'Invalid token or user not found' }, 401);
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
