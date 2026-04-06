import { create } from 'zustand';

/** Used for "is this listing requested by me?" on Home/Detail. Synced from Supabase my-requests. */
interface RequestedListingsState {
  requestedIds: Set<string>;
  addRequestedId: (id: string) => void;
  removeRequestedId: (id: string) => void;
  setRequestedIds: (ids: string[]) => void;
  isRequested: (id: string) => boolean;
}

export const useRequestedListingsStore = create<RequestedListingsState>((set, get) => ({
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
  isRequested: (id) => get().requestedIds.has(id),
}));
