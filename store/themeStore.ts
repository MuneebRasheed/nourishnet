import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => {
        const current = get().theme;
        set({ theme: current === 'dark' ? 'light' : 'dark' });
      },
    }),
    {
      name: 'nourishnet-theme',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/** Resolves effective dark mode (for styling) when theme is 'system'. */
export function useResolvedIsDark(): boolean {
  const theme = useThemeStore((s) => s.theme);
  const system = useColorScheme();
  return theme === 'dark' || (theme === 'system' && system === 'dark');
}

