import { supabase } from '../supabase';

export type ImpactRole = 'provider' | 'recipient';

export type AnalyticsSummary = {
  meals: number;
  poundsRescued: number;
  co2LbsSaved: number;
  streakDays: number;
  monthLabels: string[];
  monthRatios: number[];
  firstPickupAt: string | null;
  firstEcoWarriorAt: string | null;
};

type ImpactEventRow = {
  created_at: string;
  meals_rescued: number | null;
  event_type: 'listing_completed' | 'pickup_verified';
};

function buildCalendarYearMonths() {
  const months: { key: string; label: string }[] = [];
  const d = new Date();
  const year = d.getFullYear();
  for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
    const t = new Date(year, monthIndex, 1);
    const key = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`;
    const label = t.toLocaleString('en-US', { month: 'short' });
    months.push({ key, label });
  }
  return months;
}

function calendarDayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * Longest run of consecutive local calendar days with ≥1 impact event,
 * ending on the **most recent** day you have activity (not necessarily today).
 *
 * The previous version started from *today* only, so missing activity “today”
 * always showed 0 even if you picked up yesterday and the day before.
 */
function computeStreakDays(dates: string[]): number {
  if (dates.length === 0) return 0;
  const daySet = new Set(dates.map((iso) => calendarDayKey(new Date(iso))));

  let latest: Date | null = null;
  for (const iso of dates) {
    const d = new Date(iso);
    if (!latest || d.getTime() > latest.getTime()) latest = d;
  }
  if (!latest) return 0;

  const cur = new Date(latest.getFullYear(), latest.getMonth(), latest.getDate());
  let streak = 0;
  while (true) {
    if (!daySet.has(calendarDayKey(cur))) break;
    streak += 1;
    cur.setDate(cur.getDate() - 1);
  }
  return streak;
}

export async function fetchAnalyticsSummaryApi(role: ImpactRole): Promise<{
  summary: AnalyticsSummary | null;
  error?: string;
}> {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) return { summary: null, error: 'Not signed in.' };

  const roleColumn = role === 'provider' ? 'provider_id' : 'recipient_id';
  const { data, error } = await supabase
    .from('impact_events')
    .select('created_at, meals_rescued, event_type')
    .eq(roleColumn, userId)
    .order('created_at', { ascending: true });

  if (error) {
    return { summary: null, error: error.message ?? 'Failed to load analytics.' };
  }

  const events = (data ?? []) as ImpactEventRow[];
  const meals = events.reduce((sum, e) => sum + Math.max(0, e.meals_rescued ?? 0), 0);
  const poundsRescued = meals;
  const co2LbsSaved = Math.round(poundsRescued * 1.8);
  const streakDays = computeStreakDays(events.map((e) => e.created_at));

  const months = buildCalendarYearMonths();
  const monthCount = new Map<string, number>();
  for (const m of months) monthCount.set(m.key, 0);
  for (const e of events) {
    const d = new Date(e.created_at);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!monthCount.has(k)) continue;
    monthCount.set(k, (monthCount.get(k) ?? 0) + Math.max(1, e.meals_rescued ?? 1));
  }

  const raw = months.map((m) => monthCount.get(m.key) ?? 0);
  const max = Math.max(0, ...raw);
  const monthRatios = raw.map((v) => (max > 0 ? v / max : 0));

  const firstPickupAt = events.length > 0 ? events[0].created_at : null;
  const firstEcoWarriorAt =
    co2LbsSaved >= 22
      ? events.find((e) => {
          const upto = events.filter((x) => x.created_at <= e.created_at);
          const lbs = upto.reduce((sum, x) => sum + Math.max(0, x.meals_rescued ?? 0), 0);
          return Math.round(lbs * 1.8) >= 22;
        })?.created_at ?? null
      : null;

  return {
    summary: {
      meals,
      poundsRescued,
      co2LbsSaved,
      streakDays,
      monthLabels: months.map((m) => m.label),
      monthRatios,
      firstPickupAt,
      firstEcoWarriorAt,
    },
  };
}

export async function fetchStreakTextApi(role: ImpactRole): Promise<{
  streakText: string;
  error?: string;
}> {
  const { summary, error } = await fetchAnalyticsSummaryApi(role);
  if (error || !summary) {
    return { streakText: '0-day streak', error };
  }
  return { streakText: `${summary.streakDays}-day streak` };
}
