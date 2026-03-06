import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type AuthRole = 'provider' | 'recipient';

export type Profile = {
  id: string;
  role: AuthRole | null;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  address: string | null;
  phone: string | null;
  business_name: string | null;
  business_address: string | null;
  categories: string[];
  created_at?: string;
  updated_at?: string;
};

interface AuthState {
  userRole: AuthRole | null;
  profile: Profile | null;
  setUserRole: (role: AuthRole | null) => void;
  setProfile: (profile: Profile | null) => void;
  setAuth: (role: AuthRole | null, profile: Profile | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userRole: null,
      profile: null,
      setUserRole: (userRole) => set({ userRole }),
      setProfile: (profile) =>
        set({
          profile,
          userRole: profile?.role ?? null,
        }),
      setAuth: (userRole, profile) => set({ userRole, profile }),
      clearAuth: () => set({ userRole: null, profile: null }),
    }),
    {
      name: 'nourishnet-auth',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
