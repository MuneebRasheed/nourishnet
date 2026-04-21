import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import SettingsHeader from '../components/SettingsHeader';
import PreferenceChips from '../components/PreferenceChips';
import ContinueButton from '../components/ContinueButton';
import HeartTab from '../assets/svgs/HeartTab';
import HeartTabFill from '../assets/svgs/HeartTabFill';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigations/SearchNavigationStack';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { fetchProfile } from '../lib/profile';
import { getLocalDayEndIsoTimestamptz } from '../lib/demandPulseVisibility';

export default function SearchTabScreenMain() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();
  const insets = useSafeAreaInsets();
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const hasAtLeastOnePreference = selectedPreferences.length >= 1;

  const handleNeedFoodToday = async () => {
    if (!hasAtLeastOnePreference) return;
    setSaving(true);
    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user?.id) {
        Alert.alert('Unable to continue', userErr?.message ?? 'Not signed in.');
        return;
      }
      const foodTypes = selectedPreferences.slice(0, 2);
      const { error } = await supabase
        .from('profiles')
        .update({
          demand_pulse_expires_at: getLocalDayEndIsoTimestamptz(),
          demand_pulse_food_types: foodTypes,
        })
        .eq('id', user.id);
      if (error) {
        Alert.alert('Could not save', error.message ?? 'Update failed.');
        return;
      }
      const updated = await fetchProfile(user.id);
      if (updated) useAuthStore.getState().setProfile(updated);
      navigation.navigate('SearchTabScreen', { fromActivation: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <SettingsHeader title="Find Food" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={[styles.heartWrap, { backgroundColor: colors.notificationBg }]}>
            <HeartTab width={38} height={38} color={colors.primary} />
          </View>
          <Text
            style={[
              styles.heading,
              {
                color: colors.text,
                fontFamily: fontFamilies.interSemiBold,
                fontSize: fonts.body + 2,
              },
            ]}
          >
            Need Food Today?
          </Text>
          <Text
            style={[
              styles.description,
              {
                color: colors.textSecondary,
                fontFamily: fontFamilies.inter,
                fontSize: fonts.subhead,
                lineHeight: 20,
              },
            ]}
          >
            Tap below to let nearby donors know.
          </Text>
          <Text
            style={[
              styles.optionalLabel,
              {
                color: colors.textSecondary,
                fontFamily: fontFamilies.inter,
                fontSize: fonts.caption,
              },
            ]}
          >
            Pick at least 1 food type (required). You can add upto 2 preferences  for match listings.
          </Text>
          <View style={styles.chipsWrap}>
            <PreferenceChips
              selected={selectedPreferences}
              onSelectionChange={setSelectedPreferences}
            />
          </View>
          <View style={styles.buttonWrap}>
            {saving ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <ContinueButton
                label="I Need Food Today"
                onPress={handleNeedFoodToday}
                isDark={isDark}
                disabled={!hasAtLeastOnePreference}
                icon={<HeartTabFill width={20} height={20} color={palette.white} />}
                iconPosition="left"
                style={styles.primaryButton}
              />
            )}
          </View>
          <Text
            style={[
              styles.footerNote,
              {
                color: colors.textSecondary,
                fontFamily: fontFamilies.inter,
                fontSize: fonts.caption,
                lineHeight: 18,
              },
            ]}
          >
            Automatically turns off at midnight. You can turn it off anytime.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  heartWrap: {
    width: 64,
    height: 64,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heading: {
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    marginBottom: 5,
  },
  optionalLabel: {
    textAlign: 'center',
    marginBottom: 12,
  },
  chipsWrap: {
    width: '100%',
    marginBottom: 24,
    alignItems: 'center',
  },
  buttonWrap: {
    width: '100%',
    marginBottom: 12,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 52,
    justifyContent: 'center',
  },
  primaryButton: {
    width: '100%',
  },
  footerNote: {
    textAlign: 'center',
  },
});
