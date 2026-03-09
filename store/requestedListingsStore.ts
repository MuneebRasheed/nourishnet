import { create } from 'zustand';

interface RequestedListingsState {
  requestedIds: Set<string>;
  addRequestedId: (id: string) => void;
  isRequested: (id: string) => boolean;
}

export const useRequestedListingsStore = create<RequestedListingsState>((set, get) => ({
  requestedIds: new Set<string>(),
  addRequestedId: (id) =>
    set((state) => ({
      requestedIds: new Set([...state.requestedIds, id]),
    })),
  isRequested: (id) => get().requestedIds.has(id),
}));
