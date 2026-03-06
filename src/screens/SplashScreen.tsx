import React, { useEffect } from 'react';
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
import { fetchProfile } from '../lib/profile';

/** Delay so persisted auth has time to rehydrate from AsyncStorage. */
const REHYDRATE_DELAY_MS = 800;

/**
 * Flow: Splash → check Supabase session →
 *   If session: load profile, set in Zustand, → MainTabs (dashboard).
 *   Else: OnBoardingScreen → SelectRole → Login/Signup → MainTabs.
 * User stays logged in until logout or delete account (session persisted in AsyncStorage).
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
      await new Promise((r) => setTimeout(r, REHYDRATE_DELAY_MS));
      if (cancelled) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (cancelled) return;
        if (profile) {
          setAuth(profile.role ?? null, profile);
        } else {
          setAuth(null, null);
        }
        navigation.replace('MainTabs');
      } else {
        setAuth(null, null);
        navigation.replace('OnBoardingScreen');
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
