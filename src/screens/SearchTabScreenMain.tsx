import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
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

export default function SearchTabScreenMain() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();
  const insets = useSafeAreaInsets();
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);

  const handleNeedFoodToday = () => {
    navigation.navigate('SearchTabScreen');
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
            Tap below to let nearby donors know. No explanation needed.
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
            Optional — pick up to 2 preferences
          </Text>
          <View style={styles.chipsWrap}>
            <PreferenceChips
              selected={selectedPreferences}
              onSelectionChange={setSelectedPreferences}
            />
          </View>
          <View style={styles.buttonWrap}>
            <ContinueButton
              label="I Need Food Today"
              onPress={handleNeedFoodToday}
              isDark={isDark}
              icon={<HeartTabFill width={20} height={20} color={palette.white} />}
              iconPosition="left"
              style={styles.primaryButton}
            />
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
  },
  primaryButton: {
    width: '100%',
  },
  footerNote: {
    textAlign: 'center',
  },
});
