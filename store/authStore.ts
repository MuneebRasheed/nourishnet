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

function normalizeAuthRole(role: unknown): AuthRole | null {
  if (typeof role !== 'string') return null;
  const v = role.trim().toLowerCase();
  if (v === 'provider') return 'provider';
  if (v === 'recipient') return 'recipient';
  if (v === 'food_provider' || v === 'food provider') return 'provider';
  if (v === 'food_recipient' || v === 'food recipient') return 'recipient';
  return null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userRole: null,
      profile: null,
      setUserRole: (userRole) => set({ userRole: normalizeAuthRole(userRole) }),
      setProfile: (profile) =>
        set({
          profile,
          userRole: normalizeAuthRole(profile?.role),
        }),
      setAuth: (userRole, profile) =>
        set({
          userRole: normalizeAuthRole(userRole ?? profile?.role),
          profile,
        }),
      clearAuth: () => set({ userRole: null, profile: null }),
    }),
    {
      name: 'nourishnet-auth',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
