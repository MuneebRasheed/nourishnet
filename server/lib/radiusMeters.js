/**
 * Max distance (meters) for nearby push + geo-filtered browse feed.
 * Env: NEARBY_NOTIFY_RADIUS_METERS (default 10000 = 10 km).
 */
function parseRadiusMeters() {
  const raw = process.env.NEARBY_NOTIFY_RADIUS_METERS;
  if (raw == null || raw === '') return 10000;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 10000;
}

module.exports = { parseRadiusMeters };
