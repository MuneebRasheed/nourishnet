import { create } from 'zustand';
import type { ImageSourcePropType } from 'react-native';

/** Snapshot of a listing when user requested it (for My Requests / Active). */
export interface RequestedListingSnapshot {
  id: string;
  image: ImageSourcePropType;
  title: string;
  source: string;
  distance: string;
  postedAgo: string;
  portions: string;
  timeSlot: string;
  dietaryTags?: string[];
  isLive?: boolean;
}

interface RequestedListingsState {
  requestedIds: Set<string>;
  requestedItems: RequestedListingSnapshot[];
  completedIds: Set<string>;
  addRequestedId: (id: string) => void;
  addRequestedItem: (item: RequestedListingSnapshot) => void;
  markRequestCompleted: (id: string) => void;
  isRequested: (id: string) => boolean;
  getRequestedItems: () => RequestedListingSnapshot[];
}

export const useRequestedListingsStore = create<RequestedListingsState>((set, get) => ({
  requestedIds: new Set<string>(),
  requestedItems: [],
  completedIds: new Set<string>(),
  addRequestedId: (id) =>
    set((state) => ({
      requestedIds: new Set([...state.requestedIds, id]),
    })),
  addRequestedItem: (item) =>
    set((state) => {
      const inList = state.requestedItems.some((i) => i.id === item.id);
      if (inList) return state;
      return {
        requestedIds: new Set([...state.requestedIds, item.id]),
        requestedItems: [...state.requestedItems, { ...item }],
      };
    }),
  markRequestCompleted: (id) =>
    set((state) => ({
      completedIds: new Set([...state.completedIds, id]),
    })),
  isRequested: (id) => get().requestedIds.has(id),
  getRequestedItems: () => get().requestedItems,
}));
