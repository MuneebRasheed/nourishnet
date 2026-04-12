import type { CustomerInfo, PurchasesOfferings } from 'react-native-purchases';
import { create } from 'zustand';

interface OfferingsState {
  offerings: PurchasesOfferings | null;
  customerInfo: CustomerInfo | null;
  setOfferings: (offerings: PurchasesOfferings | null) => void;
  setCustomerInfo: (info: CustomerInfo | null) => void;
}

export const useOfferingsStore = create<OfferingsState>((set) => ({
  offerings: null,
  customerInfo: null,
  setOfferings: (offerings) => set({ offerings }),
  setCustomerInfo: (customerInfo) => set({ customerInfo }),
}));
