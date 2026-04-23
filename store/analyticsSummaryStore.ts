import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AuthRole } from './authStore';

export type AnalyticsSummaryCache = {
  meals: number;
  poundsRescued: number;
  co2LbsSaved: number;
  streakDays: number;
  monthLabels: string[];
  monthCounts: number[];
  monthRatios: number[];
  firstPickupAgo: string;
  ecoWarriorAgo: string;
};

const DEFAULT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DEFAULT_BAR_DATA = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

export const DEFAULT_ANALYTICS_CACHE: AnalyticsSummaryCache = {
  meals: 0,
  poundsRescued: 0,
  co2LbsSaved: 0,
  streakDays: 0,
  monthLabels: DEFAULT_MONTHS,
  monthCounts: DEFAULT_BAR_DATA,
  monthRatios: DEFAULT_BAR_DATA,
  firstPickupAgo: 'Not yet',
  ecoWarriorAgo: 'Not yet',
};

type AnalyticsSummaryState = {
  byRole: Record<AuthRole, AnalyticsSummaryCache>;
  setRoleSummary: (role: AuthRole, summary: AnalyticsSummaryCache) => void;
  clearAll: () => void;
};

export const useAnalyticsSummaryStore = create<AnalyticsSummaryState>()(
  persist(
    (set) => ({
      byRole: {
        provider: DEFAULT_ANALYTICS_CACHE,
        recipient: DEFAULT_ANALYTICS_CACHE,
      },
      setRoleSummary: (role, summary) =>
        set((state) => ({
          byRole: {
            ...state.byRole,
            [role]: summary,
          },
        })),
      clearAll: () =>
        set({
          byRole: {
            provider: DEFAULT_ANALYTICS_CACHE,
            recipient: DEFAULT_ANALYTICS_CACHE,
          },
        }),
    }),
    {
      name: 'nourishnet-analytics-summary',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
