import { supabase } from './supabase';
import type { CustomerInfo } from 'react-native-purchases';

/**
 * Determines the user's subscription tier based on RevenueCat customer info
 */
export function getSubscriptionTier(customerInfo: CustomerInfo | null): 'free' | 'plus' | 'pro' {
  if (!customerInfo) {
    return 'free';
  }
  
  let hasPlus = false;
  for (const ent of Object.values(customerInfo.entitlements.active)) {
    const pid = (ent?.productIdentifier ?? '').toLowerCase();
    if (pid.includes('pro_')) {
      return 'pro';
    }
    if (pid.includes('plus_')) {
      hasPlus = true;
    }
  }
  return hasPlus ? 'plus' : 'free';
}

/**
 * Gets the monthly post limit based on subscription tier
 */
export function getMonthlyPostLimit(tier: 'free' | 'plus' | 'pro'): number {
  switch (tier) {
    case 'free':
      return 5;
    case 'plus':
    case 'pro':
      return Infinity; // Unlimited
    default:
      return 5;
  }
}

/**
 * Counts how many posts the user has created in the current month
 * This count does NOT decrement when posts are deleted - it tracks creation events
 * 
 * IMPORTANT: Uses the monthly_post_tracking table which persists records even after
 * listings are deleted. This prevents users from gaming the system by creating and
 * deleting posts repeatedly.
 */
export async function getMonthlyPostCount(userId: string): Promise<{ count: number; error?: string }> {
  try {
    // Get current year-month in 'YYYY-MM' format
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Count posts created this month using the tracking table
    // This table persists records even after listings are deleted
    const { count, error } = await supabase
      .from('monthly_post_tracking')
      .select('*', { count: 'exact', head: true })
      .eq('provider_id', userId)
      .eq('year_month', yearMonth);

    if (error) {
      return { count: 0, error: error.message };
    }

    return { count: count ?? 0 };
  } catch (err) {
    return { count: 0, error: String(err) };
  }
}

/**
 * Checks if the user can create a new post based on their subscription tier and monthly limit
 */
export async function canCreatePost(
  userId: string,
  customerInfo: CustomerInfo | null
): Promise<{ allowed: boolean; currentCount: number; limit: number; error?: string }> {
  const tier = getSubscriptionTier(customerInfo);
  const limit = getMonthlyPostLimit(tier);

  // If unlimited, allow immediately
  if (limit === Infinity) {
    return { allowed: true, currentCount: 0, limit };
  }

  // Check current month's post count
  const { count, error } = await getMonthlyPostCount(userId);
  
  if (error) {
    return { allowed: false, currentCount: 0, limit, error };
  }

  return {
    allowed: count < limit,
    currentCount: count,
    limit,
  };
}
