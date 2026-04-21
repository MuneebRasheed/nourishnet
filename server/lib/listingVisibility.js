'use strict';

function normFoodType(s) {
  return String(s ?? '').trim().toLowerCase();
}

function isDemandPulseActive(profile, nowMs) {
  if (!profile || profile.role !== 'recipient') return false;
  const exp = profile.demand_pulse_expires_at;
  if (exp == null || exp === '') return false;
  const t = new Date(exp).getTime();
  return Number.isFinite(t) && t > nowMs;
}

function pulseFoodTypeMatches(profile, listingFoodType) {
  const prefs = profile.demand_pulse_food_types;
  if (!Array.isArray(prefs) || prefs.length === 0) return false;
  const lf = normFoodType(listingFoodType);
  if (!lf) return false;
  return prefs.some((p) => normFoodType(p) === lf);
}

/**
 * Staggered browse + demand pulse priority (must stay in sync with `src/lib/demandPulseVisibility.ts`).
 * @param {Record<string, unknown>} row - listing row (snake_case from DB)
 * @param {Record<string, unknown>|null|undefined} profile - profiles row incl. role, demand_pulse_*
 * @param {number} nowMs
 */
function isListingVisibleToRecipientNow(row, profile, nowMs) {
  const gapRaw = row.preference_gap_seconds;
  const gap = gapRaw == null ? null : Number(gapRaw);
  if (gap == null || !Number.isFinite(gap) || gap <= 0) return true;

  if (isDemandPulseActive(profile, nowMs) && pulseFoodTypeMatches(profile, row.food_type)) {
    return true;
  }

  const created = new Date(row.created_at).getTime();
  if (!Number.isFinite(created)) return false;
  const eligibleAt = created + gap * 1000;
  return nowMs >= eligibleAt;
}

module.exports = {
  isListingVisibleToRecipientNow,
};
