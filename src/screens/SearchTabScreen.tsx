import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import SettingsHeader from '../components/SettingsHeader';
import PreferenceChips from '../components/PreferenceChips';
import ContinueButton from '../components/ContinueButton';
import FoodCard, { type FoodCardData } from '../components/FoodCard';
import HeartTab from '../assets/svgs/HeartTab';
import HeartTabFill from '../assets/svgs/HeartTabFill';

const MOCK_FOOD_LIST: FoodCardData[] = [
  {
    id: '1',
    image: require('../assets/images/Heart.png'),
    title: '20 Fresh Sandwich Packs',
    source: 'Sunshine Bakery',
    distance: '0.4 km',
    postedAgo: '10 min ago',
    portions: '20 portions',
    timeSlot: '18:00 - 20:00',
    dietaryTags: ['Gluten', 'Dairy'],
    isLive: true,
  },
  {
    id: '2',
    image: require('../assets/images/FoodOnboard2.png'),
    title: 'Mixed Platters & Sides',
    source: 'Green Kitchen',
    distance: '1.2 km',
    postedAgo: '25 min ago',
    portions: '8 portions',
    timeSlot: '12:00 - 14:00',
    dietaryTags: ['Vegan'],
    isLive: true,
  },
];

function getTimeUntilMidnight(): { hours: number; minutes: number } {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(23, 59, 59, 999);
  const diff = Math.max(0, midnight.getTime() - now.getTime());
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { hours, minutes };
}

function formatExpiry(hours: number, minutes: number): string {
  return `${hours}h ${minutes}m`;
}

export default function SearchTabScreen() {
 
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();
  const insets = useSafeAreaInsets();
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [isOnList, setIsOnList] = useState(false);
  const [showMeals, setShowMeals] = useState(false);
  const [expiry, setExpiry] = useState(getTimeUntilMidnight());
  const mealsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOnList) return;
    const tick = () => setExpiry(getTimeUntilMidnight());
    const id = setInterval(tick, 60 * 1000);
    return () => clearInterval(id);
  }, [isOnList]);

  // Show food list 5 seconds after this screen is shown
  useEffect(() => {
    mealsTimerRef.current = setTimeout(() => setShowMeals(true), 5000);
    return () => {
      if (mealsTimerRef.current) {
        clearTimeout(mealsTimerRef.current);
        mealsTimerRef.current = null;
      }
    };
  }, []);

  const handleNeedFoodToday = () => {
    setIsOnList(true);
    setExpiry(getTimeUntilMidnight());
  };

  const displayPreference = selectedPreferences[0] ?? 'Prepared Meals';

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
     <SettingsHeader
  title="Find Food"
  titleAlign="left"
  onRightPress={() => setIsOnList(false)}
  rightIcon={
    <Text
      style={[
        styles.turnOffHeaderText,
        {
          color: palette.logoutColor,
          fontFamily: fontFamilies.interSemiBold,
          fontSize: fonts.subhead,
        },
      ]}
    >
      Turn Off
    </Text>
  }
  contentPaddingHorizontal={16}
/>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          showMeals && styles.scrollContentWithMeals,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {!showMeals && (
            <>
              <View style={[styles.heartWrap, { backgroundColor: colors.notificationBg }]}>
                <HeartTab width={38} height={38} color={colors.primary} />
              </View>
              <Text style={[styles.heading, { color: colors.text, fontFamily: fontFamilies.interSemiBold, fontSize: fonts.title }]}>
                You're on the list
              </Text>
              <Text style={[styles.description, { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.subhead, lineHeight: 22 }]}>
                Nearby donors and organizations can see there's demand in your area.
              </Text>
              <View style={[styles.preferenceChip, { backgroundColor: colors.primary }]}>
                <Text style={[styles.preferenceChipText, { fontFamily: fontFamilies.interSemiBold, fontSize: fonts.subhead }]}>
                  {displayPreference}
                </Text>
              </View>
              <Text style={styles.expiryWrap}>
                <Text style={{ color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.caption }}>
                  Expires in :{' '}
                </Text>
                <Text style={{ color: colors.primary, fontFamily: fontFamilies.interSemiBold, fontSize: fonts.caption }}>
                  {formatExpiry(expiry.hours, expiry.minutes)}
                </Text>
              </Text>
            </>
          )}

          {showMeals && (
            <View style={styles.foodListSection}>
              <View style={styles.foodListHeader}>
                <Text style={[styles.foodListTitle, { color: colors.text, fontFamily: fontFamilies.interSemiBold, fontSize: fonts.body }]}>
                  Food List
                </Text>
                <Text style={styles.expiryWrap}>
                  <Text style={{ color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.caption }}>
                    Expires in :{' '}
                  </Text>
                  <Text style={{ color: colors.primary, fontFamily: fontFamilies.interSemiBold, fontSize: fonts.caption }}>
                    {formatExpiry(expiry.hours, expiry.minutes)}
                  </Text>
                </Text>
              </View>
              <View style={styles.foodCardsWrap}>
                {MOCK_FOOD_LIST.map((item) => (
                  <FoodCard
                    key={item.id}
                    item={item}
                    claimLabel="Request This Food"
                    onClaim={() => {}}
                  />
                ))}
              </View>
            </View>
          )}
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
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContentWithMeals: {
    justifyContent: 'flex-start',
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
    marginBottom: 5,
  },
  description: {
    textAlign: 'center',
    marginBottom: 10,
  },
  optionalLabel: {
    textAlign: 'center',
    marginBottom: 5,
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
  },
  primaryButton: {
    width: '100%',
  },
  footerNote: {
    textAlign: 'center',
  },
  preferenceChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 100,
    marginBottom: 10,
  },
  preferenceChipText: {
    color: palette.white,
  },
  expiryWrap: {},
  turnOffHeaderText: {marginRight: 3},
  foodListSection: {
    width: '100%',
    // marginTop: 12,
    alignItems: 'flex-start',
  },
  foodListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  foodListTitle: {},
  foodCardsWrap: {
    width: '100%',
  },
});
