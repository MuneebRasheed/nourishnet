/**
 * @param {string} address
 * @param {string} apiKey Google Geocoding API key (server-side; not mobile-restricted)
 * @returns {Promise<{ lat: number; lng: number } | null>}
 */
async function geocodeAddress(address, apiKey) {
  const trimmed = typeof address === 'string' ? address.trim() : '';
  if (!trimmed || !apiKey) return null;

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(trimmed)}&key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  console.log('geocode response', res);
  const data = await res.json().catch(() => ({}));
  console.log('geocode data', data);
  if (data.status !== 'OK' || !data.results?.[0]?.geometry?.location) {
    console.log('geocode failed', data);
    return null;
  }
  const loc = data.results[0].geometry.location;
  const lat = Number(loc.lat);
  const lng = Number(loc.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

module.exports = { geocodeAddress };
