import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ProviderListing } from './providerListingsStore';
import type { MyRequestItem } from '../src/lib/api/listings';

type RecipientFeedState = {
  browseListings: ProviderListing[];
  browseLoadedOnce: boolean;
  myRequestsActive: MyRequestItem[];
  myRequestsCompleted: MyRequestItem[];
  myRequestsLoadedOnce: boolean;
  recipientCompletedListingIds: string[];
  setBrowseListings: (listings: ProviderListing[]) => void;
  mergeBrowseListings: (incoming: ProviderListing[]) => void;
  setMyRequests: (active: MyRequestItem[], completed: MyRequestItem[]) => void;
  mergeMyRequests: (active: MyRequestItem[], completed: MyRequestItem[]) => void;
  setRecipientCompletedListingIds: (ids: string[]) => void;
  clearAll: () => void;
};

function mergeById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const map = new Map<string, T>();
  for (const row of existing) map.set(row.id, row);
  for (const row of incoming) map.set(row.id, row);
  return [...map.values()];
}

export const useRecipientFeedStore = create<RecipientFeedState>()(
  persist(
    (set) => ({
      browseListings: [],
      browseLoadedOnce: false,
      myRequestsActive: [],
      myRequestsCompleted: [],
      myRequestsLoadedOnce: false,
      recipientCompletedListingIds: [],
      setBrowseListings: (listings) =>
        set({
          browseListings: listings,
          browseLoadedOnce: true,
        }),
      mergeBrowseListings: (incoming) =>
        set((state) => ({
          browseListings: mergeById(state.browseListings, incoming).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),
          browseLoadedOnce: true,
        })),
      setMyRequests: (active, completed) =>
        set({
          myRequestsActive: active,
          myRequestsCompleted: completed,
          myRequestsLoadedOnce: true,
        }),
      mergeMyRequests: (active, completed) =>
        set((state) => ({
          myRequestsActive: mergeById(state.myRequestsActive, active),
          myRequestsCompleted: mergeById(state.myRequestsCompleted, completed),
          myRequestsLoadedOnce: true,
        })),
      setRecipientCompletedListingIds: (ids) =>
        set({
          recipientCompletedListingIds: Array.from(
            new Set(ids.filter((id): id is string => typeof id === 'string' && id.length > 0))
          ),
        }),
      clearAll: () =>
        set({
          browseListings: [],
          browseLoadedOnce: false,
          myRequestsActive: [],
          myRequestsCompleted: [],
          myRequestsLoadedOnce: false,
          recipientCompletedListingIds: [],
        }),
    }),
    {
      name: 'nourishnet-recipient-feed',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
