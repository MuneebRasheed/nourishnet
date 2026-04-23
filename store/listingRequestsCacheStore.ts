import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { RequestPriority } from '../src/components/RequestCard';

export type CachedListingRequest = {
  id: string;
  requesterName: string;
  avatarUri?: string;
  distance: string;
  requestedAt: string;
  priority: RequestPriority;
  recipientId: string;
  pickupComplete?: boolean;
};

type ListingRequestsCacheState = {
  byListingId: Record<
    string,
    {
      pending: CachedListingRequest[];
      accepted: CachedListingRequest[];
      updatedAt: string;
    }
  >;
  setListingRequests: (
    listingId: string,
    pending: CachedListingRequest[],
    accepted: CachedListingRequest[]
  ) => void;
  clearListingRequests: (listingId: string) => void;
  clearAll: () => void;
};

export const useListingRequestsCacheStore = create<ListingRequestsCacheState>()(
  persist(
    (set) => ({
      byListingId: {},
      setListingRequests: (listingId, pending, accepted) =>
        set((state) => ({
          byListingId: {
            ...state.byListingId,
            [listingId]: {
              pending,
              accepted,
              updatedAt: new Date().toISOString(),
            },
          },
        })),
      clearListingRequests: (listingId) =>
        set((state) => {
          const next = { ...state.byListingId };
          delete next[listingId];
          return { byListingId: next };
        }),
      clearAll: () => set({ byListingId: {} }),
    }),
    {
      name: 'nourishnet-listing-requests-cache',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
