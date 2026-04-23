import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { InAppNotificationRow } from '../src/lib/api/notifications';

type NotificationInboxState = {
  items: InAppNotificationRow[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  /** Last synced user id (avoid cross-user flashes) */
  userId: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setItems: (items: InAppNotificationRow[], userId: string) => void;
  reset: () => void;
  upsertRow: (row: InAppNotificationRow) => void;
  markAllReadLocal: (userId: string) => void;
};

function unreadFromItems(items: InAppNotificationRow[]): number {
  return items.reduce((n, r) => n + (r.is_read ? 0 : 1), 0);
}

export const useNotificationInboxStore = create<NotificationInboxState>()(
  persist(
    (set, get) => ({
      items: [],
      unreadCount: 0,
      loading: false,
      error: null,
      userId: null,
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setItems: (items, userId) =>
        set({
          items,
          unreadCount: unreadFromItems(items),
          userId,
          error: null,
        }),
      reset: () =>
        set({
          items: [],
          unreadCount: 0,
          loading: false,
          error: null,
          userId: null,
        }),
      upsertRow: (row) => {
        const state = get();
        if (state.userId != null && row.user_id !== state.userId) return;
        const idx = state.items.findIndex((i) => i.id === row.id);
        let next: InAppNotificationRow[];
        if (idx === -1) {
          next = [row, ...state.items].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        } else {
          next = [...state.items];
          next[idx] = row;
        }
        set({ items: next, unreadCount: unreadFromItems(next) });
      },
      markAllReadLocal: (userId) => {
        const state = get();
        const readAt = new Date().toISOString();
        const items = state.items.map((r) =>
          r.user_id === userId && !r.is_read ? { ...r, is_read: true, read_at: readAt } : r
        );
        set({
          items,
          unreadCount: unreadFromItems(items),
        });
      },
    }),
    {
      name: 'nourishnet-notification-inbox',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        items: state.items,
        unreadCount: state.unreadCount,
        userId: state.userId,
      }),
    }
  )
);
