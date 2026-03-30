import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthRole, Profile } from '../../store/authStore';
import type { RootStackParamList } from '../navigations/RootNavigation';
import { fetchProfile } from './profile';
import { markOnboardingComplete } from './onboardingStorage';
import { supabase } from './supabase';

export async function safeSignOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (!error) return;
  const message = (error.message ?? '').toLowerCase();
  if (message.includes('refresh token') && message.includes('not found')) return;
  throw error;
}

export async function completeAuthAndGoToMainTabs(
  navigation: NativeStackNavigationProp<RootStackParamList>,
  role: AuthRole | undefined,
  setAuth: (role: AuthRole | null, profile: Profile | null) => void
): Promise<{ ok: true } | { ok: false; message: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      message: 'Could not load your account. Please try again.',
    };
  }
  const profile = await fetchProfile(user.id);
  if (role && profile?.role && profile.role !== role) {
    await safeSignOut();
    setAuth(null, null);
    return {
      ok: false,
      message:
        role === 'provider'
          ? 'Please Login as Recipient.'
          : 'Please Login as Provider.',
    };
  }
  const resolvedRole = (profile?.role ?? role ?? null) as AuthRole | null;
  const profileWithRole = profile ? { ...profile, role: resolvedRole } : null;
  setAuth(resolvedRole, profileWithRole);
  await markOnboardingComplete();
  setTimeout(() => navigation.replace('MainTabs'), 0);
  return { ok: true };
}
