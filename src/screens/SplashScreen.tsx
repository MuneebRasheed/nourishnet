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

/** Delay so persisted auth has time to rehydrate from AsyncStorage. */
const REHYDRATE_DELAY_MS = 800;

/**
 * Flow: Splash → Onboarding (if no role) → SelectRole → Provider onboarding (FoodOnBoard) or Recipient onboarding (ReceiptOnBoard) → Login → MainTabs.
 * If user already has role (provider/recipient), go straight to MainTabs (provider flow = 4 tabs, recipient flow = 5 tabs).
 */
const SplashScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useThemeStore((state) => state.theme);
  const userRole = useAuthStore((state) => state.userRole);
  const isDark = theme === 'dark';
  const colors: AppColors = getColors(isDark);
  const fontSizes = useAppFontSizes();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (userRole === 'provider' || userRole === 'recipient') {
        navigation.replace('OnBoardingScreen');
      } else {
        navigation.replace('OnBoardingScreen');
      }
    }, REHYDRATE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [navigation, userRole]);

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
    marginBottom: 5, // spacing between title and tagline
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
