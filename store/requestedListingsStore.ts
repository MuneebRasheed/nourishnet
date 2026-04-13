import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Used for "is this listing requested by me?" on Home/Detail. Synced from API + persisted for fast UX across restarts. */
interface RequestedListingsState {
  requestedIds: Set<string>;
  addRequestedId: (id: string) => void;
  removeRequestedId: (id: string) => void;
  setRequestedIds: (ids: string[]) => void;
  /** Union server ids into the set (keeps optimistic ids until My Requests replaces). */
  mergeRequestedIds: (ids: string[]) => void;
  isRequested: (id: string) => boolean;
}

type PersistedSlice = { requestedIds: string[] };

function persistedIdsToSet(persisted: unknown): Set<string> {
  const raw = (persisted as PersistedSlice | undefined)?.requestedIds;
  if (!Array.isArray(raw)) return new Set();
  return new Set(raw.filter((id): id is string => typeof id === 'string' && id.length > 0));
}

export const useRequestedListingsStore = create<RequestedListingsState>()(
  persist(
    (set, get) => ({
      requestedIds: new Set<string>(),
      addRequestedId: (id) =>
        set((state) => ({
          requestedIds: new Set([...state.requestedIds, id]),
        })),
      removeRequestedId: (id) =>
        set((state) => {
          const next = new Set(state.requestedIds);
          next.delete(id);
          return { requestedIds: next };
        }),
      setRequestedIds: (ids) =>
        set({ requestedIds: new Set(ids) }),
      mergeRequestedIds: (ids) =>
        set((state) => ({
          requestedIds: new Set([...state.requestedIds, ...ids]),
        })),
      isRequested: (id) => get().requestedIds.has(id),
    }),
    {
      name: 'nourishnet-requested-listings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        requestedIds: Array.from(state.requestedIds),
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        requestedIds: persistedIdsToSet(persistedState),
      }),
    }
  )
);
