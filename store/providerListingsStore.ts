import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ProviderListingStatus = 'active' | 'request_open' | 'claimed' | 'completed' | 'cancelled';

export type ProviderListing = {
  id: string;
  title: string;
  foodType: string | null;
  quantity: string;
  quantityUnit: string;
  dietaryTags: string[];
  allergens: string[];
  imageUrl?: string | null;
  pickupAddress: string;
  startTime: string;
  endTime: string;
  note: string;
  createdAt: string;
  status: ProviderListingStatus;
};

export type ProviderListingDraft = Omit<
  ProviderListing,
  'id' | 'createdAt' | 'status'
>;

interface ProviderListingsState {
  listings: ProviderListing[];
  addListing: (draft: ProviderListingDraft) => void;
  addListingFromApi: (listing: ProviderListing) => void;
  setListings: (listings: ProviderListing[]) => void;
  removeListing: (id: string) => void;
  completeListing: (id: string) => void;
  clearAll: () => void;
}

export const useProviderListingsStore = create<ProviderListingsState>()(
  persist(
    (set) => ({
      listings: [],
      addListing: (draft) =>
        set((state) => ({
          listings: [
            {
              ...draft,
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              createdAt: new Date().toISOString(),
              status: 'active',
            },
            ...state.listings,
          ],
        })),
      addListingFromApi: (listing) =>
        set((state) => ({
          listings: [listing, ...state.listings.filter((l) => l.id !== listing.id)],
        })),
      setListings: (listings) => set({ listings }),
      removeListing: (id) =>
        set((state) => ({
          listings: state.listings.filter((listing) => listing.id !== id),
        })),
      completeListing: (id) =>
        set((state) => ({
          listings: state.listings.map((listing) =>
            listing.id === id ? { ...listing, status: 'completed' } : listing
          ),
        })),
      clearAll: () => set({ listings: [] }),
    }),
    {
      name: 'nourishnet-provider-listings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

