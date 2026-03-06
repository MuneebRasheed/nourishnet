import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type AuthRole = 'provider' | 'recipient';

interface AuthState {
  userRole: AuthRole | null;
  setUserRole: (role: AuthRole | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userRole: null,
      setUserRole: (userRole) => set({ userRole }),
    }),
    {
      name: 'nourishnet-auth',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
