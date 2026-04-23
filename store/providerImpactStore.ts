import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type ProviderImpactState = {
  streakText: string;
  mealsRescuedTotal: number;
  setImpact: (streakText: string, mealsRescuedTotal: number) => void;
  clearAll: () => void;
};

export const useProviderImpactStore = create<ProviderImpactState>()(
  persist(
    (set) => ({
      streakText: '0-day streak',
      mealsRescuedTotal: 0,
      setImpact: (streakText, mealsRescuedTotal) =>
        set({
          streakText,
          mealsRescuedTotal: Number.isFinite(mealsRescuedTotal) ? mealsRescuedTotal : 0,
        }),
      clearAll: () =>
        set({
          streakText: '0-day streak',
          mealsRescuedTotal: 0,
        }),
    }),
    {
      name: 'nourishnet-provider-impact',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
