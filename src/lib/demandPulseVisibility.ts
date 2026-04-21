import type { Profile } from '../../store/authStore';
import type { ProviderListing } from '../../store/providerListingsStore';

function normFoodType(s: unknown): string {
  return String(s ?? '').trim().toLowerCase();
}

export function isDemandPulseActive(profile: Profile | null | undefined, nowMs: number): boolean {
  if (!profile || profile.role !== 'recipient') return false;
  const exp = profile.demand_pulse_expires_at;
  if (exp == null || exp === '') return false;
  const t = new Date(exp).getTime();
  return Number.isFinite(t) && t > nowMs;
}

export function pulseFoodTypeMatches(
  profile: Profile | null | undefined,
  listingFoodType: string | null | undefined
): boolean {
  const prefs = profile?.demand_pulse_food_types;
  if (!Array.isArray(prefs) || prefs.length === 0) return false;
  const lf = normFoodType(listingFoodType);
  if (!lf) return false;
  return prefs.some((p) => normFoodType(p) === lf);
}

/** End of local calendar day as ISO (timestamptz) for `demand_pulse_expires_at`. */
export function getLocalDayEndIsoTimestamptz(): string {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return end.toISOString();
}

/**
 * Mirrors `server/lib/listingVisibility.js` for Realtime + client-side checks.
 */
export function isListingVisibleForRecipient(
  listing: Pick<ProviderListing, 'createdAt' | 'preferenceGapSeconds' | 'foodType'>,
  profile: Profile | null | undefined,
  nowMs: number
): boolean {
  const gapRaw = listing.preferenceGapSeconds;
  const gap = gapRaw == null ? null : Number(gapRaw);
  if (gap == null || !Number.isFinite(gap) || gap <= 0) return true;

  if (isDemandPulseActive(profile, nowMs) && pulseFoodTypeMatches(profile, listing.foodType ?? null)) {
    return true;
  }

  const created = new Date(listing.createdAt).getTime();
  // Gap is on but we cannot parse created_at — do not treat as visible (avoids leaking early to general recipients).
  if (!Number.isFinite(created)) return false;
  const eligibleAt = created + gap * 1000;
  return nowMs >= eligibleAt;
}

/**
 * Milliseconds until this listing becomes visible for the current profile under stagger rules.
 * Returns null if already visible, no stagger, or time cannot be computed.
 */
export function msUntilListingVisibleForRecipient(
  listing: Pick<ProviderListing, 'createdAt' | 'preferenceGapSeconds' | 'foodType'>,
  profile: Profile | null | undefined,
  nowMs: number
): number | null {
  if (isListingVisibleForRecipient(listing, profile, nowMs)) return null;
  const gapRaw = listing.preferenceGapSeconds;
  const gap = gapRaw == null ? null : Number(gapRaw);
  if (gap == null || !Number.isFinite(gap) || gap <= 0) return null;
  const created = new Date(listing.createdAt).getTime();
  if (!Number.isFinite(created)) return null;
  const eligibleAt = created + gap * 1000;
  const ms = eligibleAt - nowMs;
  if (ms <= 0) return null;
  // Small buffer so server clock is slightly ahead of device; cap below max allowed gap (300s) + slack.
  return Math.min(ms + 150, 310_000);
}
