const { haversineMeters } = require('./haversine');
const { parseRadiusMeters } = require('./radiusMeters');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100;

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} service
 * @param {{ id: string; title?: string; pickup_latitude?: number | null; pickup_longitude?: number | null }} listing
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

  const tokens = [];
  const seen = new Set();

  for (const p of profiles ?? []) {
    if (!p?.expo_push_token || typeof p.expo_push_token !== 'string') continue;
    if (p.id === providerId) continue;
    const plat = p.latitude != null ? Number(p.latitude) : null;
    const plng = p.longitude != null ? Number(p.longitude) : null;
    if (plat == null || plng == null || !Number.isFinite(plat) || !Number.isFinite(plng)) continue;

    const d = haversineMeters(pickupLat, pickupLng, plat, plng);
    if (d > radiusM) continue;

    const t = p.expo_push_token.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    tokens.push(t);
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

module.exports = { notifyNearbyRecipients };
