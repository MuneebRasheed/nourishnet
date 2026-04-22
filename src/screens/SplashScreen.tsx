import React, { useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { StyleSheet, View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { getColors, AppColors } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import { RootStackParamList } from '../navigations/RootNavigation';
import SplashIcon from '../assets/svgs/SplashIcon';
import { supabase } from '../lib/supabase';
import { fetchProfile, needsProfileCompletion } from '../lib/profile';
import { hasCompletedOnboarding } from '../lib/onboardingStorage';

/** Upper bound while waiting for Supabase INITIAL_SESSION after app refresh. */
const INITIAL_SESSION_TIMEOUT_MS = 2000;

function waitForAuthStoreHydration(): Promise<void> {
  return new Promise((resolve) => {
    if (useAuthStore.persist.hasHydrated()) {
      resolve();
      return;
    }
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      unsub();
      resolve();
    });
  });
}

async function waitForSupabaseInitialSession(): Promise<void> {
  let finished = false;
  await new Promise<void>((resolve) => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event !== 'INITIAL_SESSION' || finished) return;
      finished = true;
      clearTimeout(timer);
      subscription.unsubscribe();
      resolve();
    });

    const timer = setTimeout(() => {
      if (finished) return;
      finished = true;
      subscription.unsubscribe();
      resolve();
    }, INITIAL_SESSION_TIMEOUT_MS);
  });
}

async function getStableSession(): Promise<Session | null> {
  const {
    data: { session: initialSession },
  } = await supabase.auth.getSession();
  if (initialSession) return initialSession;

  // If getSession() races before auth hydration/refresh, attempt one refresh pass.
  const { error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError) {
    const message = (refreshError.message ?? '').toLowerCase();
    if (!(message.includes('refresh token') && message.includes('not found'))) {
      console.warn('Session refresh failed during splash restore:', refreshError.message);
    }
  }

  const {
    data: { session: refreshedSession },
  } = await supabase.auth.getSession();
  return refreshedSession ?? null;
}

/**
 * Flow: Splash → check Supabase session →
 *   If session: load profile, set in Zustand, → MainTabs (dashboard).
 *   Else: first install → OnBoardingScreen (then role flow → login). Returning user → LoginScreen only.
 * User stays logged in until logout or delete account (session persisted in AsyncStorage).
 * Onboarding is shown once per install until the user signs in or completes signup (see onboardingStorage).
 */
const SplashScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useThemeStore((state) => state.theme);
  const setAuth = useAuthStore((state) => state.setAuth);
  const isDark = theme === 'dark';
  const colors: AppColors = getColors(isDark);
  const fontSizes = useAppFontSizes();

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await waitForAuthStoreHydration();
      await waitForSupabaseInitialSession();
      if (cancelled) return;
      const session = await getStableSession();
      if (cancelled) return;
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (cancelled) return;
        const email = session.user.email ?? '';
        const mustFinishProfile =
          !profile || !profile.role || needsProfileCompletion(profile);
        if (mustFinishProfile) {
          const r =
            profile?.role ?? useAuthStore.getState().userRole;
          setAuth(r ?? null, profile ?? null);
          if (r === 'provider') {
            navigation.replace('ProviderProfileScreen', { email });
          } else if (r === 'recipient') {
            navigation.replace('EditProfileScreen', { email });
          } else {
            navigation.replace('SelectRoleScreen', { intent: 'signup' });
          }
        } else {
          setAuth(profile.role, profile);
          navigation.replace('MainTabs');
        }
      } else {
        setAuth(null, null);
        const done = await hasCompletedOnboarding();
        if (cancelled) return;
        navigation.replace(done ? 'LoginScreen' : 'OnBoardingScreen');
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [navigation, setAuth]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SplashIcon width={115} height={108} />
      <View style={styles.doubleText}>
        <Text
          style={[
            styles.title,
            {
              color: colors.text,
              fontSize: fontSizes.largeTitle,
              fontFamily: fontFamilies.poppinsSemiBold,
            },
          ]}
        >
          NourishNet
        </Text>
        <Text
          style={[
            styles.tagline,
            {
              color: colors.textSecondary,
              fontSize: fontSizes.subhead,
              fontFamily: fontFamilies.inter,
            },
          ]}
        >
          Nourishing communities, together.
        </Text>
      </View>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  doubleText: {
    marginTop: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 5,
  },
  tagline: {
    textAlign: 'center',
  },
  button: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    textAlign: 'center',
  },
});
