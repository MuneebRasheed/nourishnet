import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SettingsState {
  largeFont: boolean;
  setLargeFont: (value: boolean) => void;
  toggleLargeFont: () => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (value: boolean) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      largeFont: false,
      setLargeFont: (value) => set({ largeFont: value }),
      toggleLargeFont: () => set((state) => ({ largeFont: !state.largeFont })),
      notificationsEnabled: true,
      setNotificationsEnabled: (value) => set({ notificationsEnabled: value }),
      reset: () => set({ largeFont: false, notificationsEnabled: true }),
    }),
    {
      name: 'NourishNet-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ largeFont: state.largeFont, notificationsEnabled: state.notificationsEnabled }),
    }
  )
);
