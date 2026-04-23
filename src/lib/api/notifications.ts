import { supabase } from '../supabase';

export type InAppNotificationType =
  | 'request_accepted'
  | 'new_food_available'
  | 'request_not_available'
  | 'request_not_submitted'
  | 'pickup_reminder';

export type InAppNotificationRow = {
  id: string;
  user_id: string;
  type: InAppNotificationType;
  data: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

export function formatNotificationTimeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const mins = Math.floor((Date.now() - t) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export async function fetchNotificationsForUser(
  userId: string,
  limit = 100
): Promise<{ data: InAppNotificationRow[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, type, data, is_read, read_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return { data: null, error: new Error(error.message) };
  }
  return { data: (data ?? []) as InAppNotificationRow[], error: null };
}

export async function markAllNotificationsRead(userId: string): Promise<{ error: Error | null }> {
  const readAt = new Date().toISOString();
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: readAt })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    return { error: new Error(error.message) };
  }
  return { error: null };
}

export async function markNotificationRead(
  userId: string,
  notificationId: string
): Promise<{ error: Error | null }> {
  const readAt = new Date().toISOString();
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: readAt })
    .eq('user_id', userId)
    .eq('id', notificationId)
    .eq('is_read', false);

  if (error) {
    return { error: new Error(error.message) };
  }
  return { error: null };
}
