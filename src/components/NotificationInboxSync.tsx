import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { fetchNotificationsForUser, type InAppNotificationRow } from '../lib/api/notifications';
import { useAuthStore } from '../../store/authStore';
import { useNotificationInboxStore } from '../../store/notificationInboxStore';

/**
 * Subscribes to the signed-in user's notification rows (Realtime) and keeps
 * `useNotificationInboxStore` in sync. Mount once under main tabs (logged-in shell).
 */
export default function NotificationInboxSync() {
  const userId = useAuthStore((s) => s.profile?.id ?? null);

  useEffect(() => {
    if (!userId) {
      useNotificationInboxStore.getState().reset();
      return;
    }

    const store = useNotificationInboxStore.getState();
    const hasUsableCache = store.userId === userId && store.items.length > 0;
    store.setLoading(!hasUsableCache);
    store.setError(null);

    let cancelled = false;

    void (async () => {
      const { data, error } = await fetchNotificationsForUser(userId);
      if (cancelled) return;
      if (error) {
        store.setError(error.message);
        store.setLoading(false);
        return;
      }
      store.setItems(data ?? [], userId);
      store.setLoading(false);
    })();

    const channelBase = `notifications-inbox-${userId}`;
    // Use a unique topic per mount to avoid reusing an already-subscribed channel.
    const channelName = `${channelBase}-${Date.now()}`;
    for (const existing of supabase.getChannels()) {
      if (existing.topic.includes(channelBase)) {
        void supabase.removeChannel(existing);
      }
    }

    const channel = supabase
      .channel(`notifications-inbox-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as InAppNotificationRow;
          if (row?.id) useNotificationInboxStore.getState().upsertRow(row);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as InAppNotificationRow;
          if (row?.id) useNotificationInboxStore.getState().upsertRow(row);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return null;
}
