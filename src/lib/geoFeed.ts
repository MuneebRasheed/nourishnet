const EARTH_RADIUS_M = 6371000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance in meters (same formula as server/lib/haversine.js). */
export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_M * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/**
 * Must match server `NEARBY_NOTIFY_RADIUS_METERS` (default 10000).
 * Set `EXPO_PUBLIC_NEARBY_FEED_RADIUS_METERS` in `.env` when overriding.
 */
export function getFeedRadiusMeters(): number {
  const raw = process.env.EXPO_PUBLIC_NEARBY_FEED_RADIUS_METERS;
  if (raw == null || String(raw).trim() === '') return 10000;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 10000;
}
