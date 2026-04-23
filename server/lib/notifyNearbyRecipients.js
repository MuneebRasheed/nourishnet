const { haversineMeters } = require('./haversine');
const { parseRadiusMeters } = require('./radiusMeters');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100;

/** Align with DB check constraint in `023_notifications.sql` */
const NOTIFICATION_TYPES = {
  REQUEST_ACCEPTED: 'request_accepted',
  NEW_FOOD_AVAILABLE: 'new_food_available',
  REQUEST_NOT_AVAILABLE: 'request_not_available',
  REQUEST_NOT_SUBMITTED: 'request_not_submitted',
  PICKUP_REMINDER: 'pickup_reminder',
};

/**
 * Snapshot of listing for inbox / deep link (matches app listing fields where useful).
 * @param {Record<string, unknown>} listing
 * @param {string} providerId
 */
function buildNewFoodAvailableData(listing, providerId) {
  return {
    listingId: listing.id,
    providerId: listing.provider_id ?? providerId,
    title: listing.title ?? null,
    foodType: listing.food_type ?? null,
    quantity: listing.quantity ?? null,
    totalQuantity: listing.total_quantity ?? null,
    quantityUnit: listing.quantity_unit ?? null,
    dietaryTags: listing.dietary_tags ?? [],
    allergens: listing.allergens ?? [],
    imageUrl: listing.image_url ?? null,
    pickupAddress: listing.pickup_address ?? null,
    pickupLatitude: listing.pickup_latitude ?? null,
    pickupLongitude: listing.pickup_longitude ?? null,
    startTime: listing.start_time ?? null,
    endTime: listing.end_time ?? null,
    note: listing.note ?? null,
    status: listing.status ?? null,
    createdAt: listing.created_at ?? null,
  };
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} service
 * @param {Record<string, unknown>} listing
 * @param {string} providerId
 */
async function notifyNearbyRecipients(service, listing, providerId) {
  const lat = listing.pickup_latitude;
  const lng = listing.pickup_longitude;
  if (lat == null || lng == null || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
    return;
  }
  const pickupLat = Number(lat);
  const pickupLng = Number(lng);
  const radiusM = parseRadiusMeters();

  const { data: profiles, error } = await service
    .from('profiles')
    .select('id, expo_push_token, latitude, longitude')
    .eq('role', 'recipient');

  if (error) {
    console.warn('[notifyNearbyRecipients] profiles query', error.message);
    return;
  }

  /** @type {string[]} */
  const inRangeRecipientIds = [];
  const seenRecipientIds = new Set();
  const tokens = [];
  const seenTokens = new Set();

  for (const p of profiles ?? []) {
    if (!p?.id || p.id === providerId) continue;
    const plat = p.latitude != null ? Number(p.latitude) : null;
    const plng = p.longitude != null ? Number(p.longitude) : null;
    if (plat == null || plng == null || !Number.isFinite(plat) || !Number.isFinite(plng)) continue;

    const d = haversineMeters(pickupLat, pickupLng, plat, plng);
    if (d > radiusM) continue;

    if (!seenRecipientIds.has(p.id)) {
      seenRecipientIds.add(p.id);
      inRangeRecipientIds.push(p.id);
    }

    if (!p.expo_push_token || typeof p.expo_push_token !== 'string') continue;
    const t = p.expo_push_token.trim();
    if (!t || seenTokens.has(t)) continue;
    seenTokens.add(t);
    tokens.push(t);
  }

  if (inRangeRecipientIds.length === 0) return;

  const dataPayload = buildNewFoodAvailableData(listing, providerId);
  for (let i = 0; i < inRangeRecipientIds.length; i += BATCH_SIZE) {
    const chunk = inRangeRecipientIds.slice(i, i + BATCH_SIZE).map((userId) => ({
      user_id: userId,
      type: NOTIFICATION_TYPES.NEW_FOOD_AVAILABLE,
      data: dataPayload,
    }));
    const { error: insertError } = await service.from('notifications').insert(chunk);
    if (insertError) {
      console.warn('[notifyNearbyRecipients] notifications insert', insertError.message);
    }
  }

  if (tokens.length === 0) return;

  const title = 'Food nearby';
  const body =
    listing.title && String(listing.title).trim()
      ? `New listing: ${String(listing.title).trim()}`
      : 'A new food listing was posted near you.';

  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const chunk = tokens.slice(i, i + BATCH_SIZE);
    const messages = chunk.map((to) => ({
      to,
      sound: 'default',
      title,
      body,
      data: { type: 'new_listing', listingId: listing.id },
    }));

    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(messages),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.warn('[notifyNearbyRecipients] Expo push HTTP', res.status, json);
      }
    } catch (e) {
      console.warn('[notifyNearbyRecipients] Expo push failed', e?.message ?? e);
    }
  }
}

module.exports = { notifyNearbyRecipients, NOTIFICATION_TYPES };
