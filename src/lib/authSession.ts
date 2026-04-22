import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthRole, Profile } from '../../store/authStore';
import type { RootStackParamList } from '../navigations/RootNavigation';
import { fetchProfile, needsProfileCompletion } from './profile';
import { markOnboardingComplete } from './onboardingStorage';
import { clearExpoPushTokenFromProfile } from './pushNotifications';
import { supabase } from './supabase';

export async function safeSignOut(): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.user?.id) {
    await clearExpoPushTokenFromProfile(session.user.id).catch(() => {});
  }
  const { error } = await supabase.auth.signOut();
  if (!error) return;
  const message = (error.message ?? '').toLowerCase();
  if (message.includes('refresh token') && message.includes('not found')) return;
  throw error;
}

function replaceToProfileCompletion(
  navigation: NativeStackNavigationProp<RootStackParamList>,
  role: AuthRole,
  email: string
) {
  navigation.replace(
    role === 'provider' ? 'ProviderProfileScreen' : 'EditProfileScreen',
    { email }
  );
}

export type AuthCompletionOptions = {
  /** Signup (e.g. OAuth from SignupScreen) can still enforce entry role vs DB role. Login ignores it. */
  flow?: 'login' | 'signup';
};

export async function completeAuthAndGoToMainTabs(
  navigation: NativeStackNavigationProp<RootStackParamList>,
  role: AuthRole | undefined,
  setAuth: (role: AuthRole | null, profile: Profile | null) => void,
  options?: AuthCompletionOptions
): Promise<{ ok: true } | { ok: false; message: string }> {
  const flow = options?.flow ?? 'signup';
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
  const email = user.email ?? '';

  if (
    flow === 'signup' &&
    role &&
    profile?.role &&
    profile.role !== role
  ) {
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

  // Row missing, or trigger created row with role still null (common) — same as post-OTP signup.
  const noRoleOrNoRow = !profile || !profile.role;
  if (noRoleOrNoRow) {
    if (!role) {
      await safeSignOut();
      setAuth(null, null);
      return {
        ok: false,
        message:
          'Please choose your role first (Provider or Recipient), then continue with social sign-in.',
      };
    }
    setAuth(role, profile);
    await markOnboardingComplete();
    setTimeout(() => replaceToProfileCompletion(navigation, role, email), 0);
    return { ok: true };
  }

  // Role set: only go to MainTabs when profile matches email signup completion.
  if (needsProfileCompletion(profile)) {
    const effectiveRole = profile.role;
    setAuth(effectiveRole, profile);
    await markOnboardingComplete();
    setTimeout(() => replaceToProfileCompletion(navigation, effectiveRole, email), 0);
    return { ok: true };
  }

  const resolvedRole = profile.role;
  const profileWithRole = { ...profile, role: resolvedRole };
  setAuth(resolvedRole, profileWithRole);
  await markOnboardingComplete();
  setTimeout(
    () =>
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      }),
    0
  );
  return { ok: true };
}
