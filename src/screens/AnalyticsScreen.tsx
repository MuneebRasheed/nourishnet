import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import { useAuthStore } from '../../store/authStore';
import SettingsHeader from '../components/SettingsHeader';
import ImpactCard from '../components/ImpactCard';
import HeartTab from '../assets/svgs/HeartTab';
import LeafIcon1 from '../assets/svgs/LeafIcon1';
import BatchIcon from '../assets/svgs/BatchIcon';
import UpwardArrow from '../assets/svgs/UpwardArrow';
import ArrowCurve from '../assets/svgs/ArrowCurve';
import { fetchAnalyticsSummaryApi } from '../lib/api/analytics';

const DEFAULT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DEFAULT_BAR_DATA = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const CHART_HEIGHT = 120;

const MILESTONES = [
  {
    id: 'first-rescue',
    title: 'First Rescue',
    description: 'You claimed your first meal!',
    timeAgo: '3 days ago',
  },
  {
    id: 'eco-warrior',
    title: 'Eco Warrior',
    description: 'Saved 10 kg of CO2!',
    timeAgo: '1 week ago',
  },
];

const MILESTONE_PALETTE = [
  { iconBg: palette.roleCardbg, iconColor: palette.roleBulbColor1 },
  { iconBg: palette.roleCard, iconColor: palette.roleBulbColor2 },
];

export default function AnalyticsScreen() {
  const theme = useThemeStore((s) => s.theme);
  const userRole = useAuthStore((s) => s.userRole);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();
  const insets = useSafeAreaInsets();
  const [meals, setMeals] = useState(0);
  const [poundsRescued, setPoundsRescued] = useState(0);
  const [co2LbsSaved, setCo2LbsSaved] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [months, setMonths] = useState<string[]>(DEFAULT_MONTHS);
  const [barData, setBarData] = useState<number[]>(DEFAULT_BAR_DATA);
  const [firstPickupAgo, setFirstPickupAgo] = useState('Not yet');
  const [ecoWarriorAgo, setEcoWarriorAgo] = useState('Not yet');

  useEffect(() => {
    let cancelled = false;

    const formatTimeAgo = (iso: string | null): string => {
      if (!iso) return 'Not yet';
      const diffMs = Date.now() - new Date(iso).getTime();
      if (!Number.isFinite(diffMs) || diffMs < 0) return 'Not yet';
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
      const weeks = Math.floor(days / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    };

    const load = async () => {
      if (userRole !== 'provider' && userRole !== 'recipient') return;
      const { summary } = await fetchAnalyticsSummaryApi(userRole);
      if (!summary || cancelled) return;
      setMeals(summary.meals);
      setPoundsRescued(summary.poundsRescued);
      setCo2LbsSaved(summary.co2LbsSaved);
      setStreakDays(summary.streakDays);
      setMonths(summary.monthLabels.length ? summary.monthLabels : DEFAULT_MONTHS);
      setBarData(summary.monthRatios.length ? summary.monthRatios : DEFAULT_BAR_DATA);
      setFirstPickupAgo(formatTimeAgo(summary.firstPickupAt));
      setEcoWarriorAgo(formatTimeAgo(summary.firstEcoWarriorAt));
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [userRole]);

  const statLabels = useMemo(
    () => ({
      mealsTitle: userRole === 'provider' ? 'Meals Shared' : 'Meals',
      mealsLabel: userRole === 'provider' ? 'Meals completed' : 'Meals received',
    }),
    [userRole]
  );

  const milestones = useMemo(
    () => [
      {
        id: 'first-rescue',
        title: 'First Rescue',
        description: 'You claimed your first meal!',
        timeAgo: firstPickupAgo,
      },
      {
        id: 'eco-warrior',
        title: 'Eco Warrior',
        description: 'Saved 10 kg of CO2!',
        timeAgo: ecoWarriorAgo,
      },
    ],
    [ecoWarriorAgo, firstPickupAgo]
  );

  const headerTop = Platform.select({
    ios: insets.top,
    android: Math.max(insets.top, 16),
    default: insets.top,
  });

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <View style={[styles.header, { marginTop: headerTop }]}>
        <SettingsHeader title="Your Impact" />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
       
          <View style={styles.statsGrid}>
            <ImpactCard
              variant="stat"
              icon={<HeartTab width={20} height={20} color={palette.timeIcon} />}
              title={statLabels.mealsTitle}
              value={String(meals)}
              label={statLabels.mealsLabel}
              accentColor={palette.timeIcon}
            />
            <ImpactCard
              variant="stat"
              icon={<LeafIcon1 width={20} height={20} color={palette.roleBulbColor2} />}
              title="Weight"
              value={String(poundsRescued)}
              label="Pounds rescued"
              accentColor={palette.roleBulbColor2}
            />
            <ImpactCard
              variant="stat"
              icon={<UpwardArrow width={20} height={20} color={palette.logoutColor} />}
              title=" CO2"
              value={String(co2LbsSaved)}
              label="Lbs CO2 saved"
              accentColor={palette.logoutColor}
            />
            <ImpactCard
              variant="stat"
              icon={<BatchIcon width={20} height={20} color={palette.roleBulbColor3} />}
              title="Streak"
              value={String(streakDays)}
              label="Day Streak"
              accentColor={palette.roleBulbColor3}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.text,
                fontFamily: fontFamilies.poppinsSemiBold,
                fontSize: fonts.subhead,
              },
            ]}
          >
            Monthly Activity
          </Text>
          <View style={[styles.chartCard, { backgroundColor:colors.inputFieldBg,  }]}>
            <View style={styles.barChart}>
              {barData.map((ratio, i) => (
                <View key={months[i] ?? `m-${i}`} style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(8, CHART_HEIGHT * ratio),
                        backgroundColor: '#FF6B35',
                      },
                    ]}
                  />
                </View>
              ))}
            </View>
            <View style={styles.barLabels}>
              {months.map((label) => (
                <Text
                  key={label}
                  style={[
                    styles.barLabel,
                    {
                      color: colors.textSecondary,
                      fontFamily: fontFamilies.inter,
                      fontSize: fonts.caption,
                    },
                  ]}
                >
                  {label}
                </Text>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.text,
                fontFamily: fontFamilies.poppinsSemiBold,
                fontSize: fonts.subhead,
              },
            ]}
          >
            Milestones
          </Text>
          {milestones.map((m, index) => {
            const { iconBg, iconColor } = MILESTONE_PALETTE[index];
            const icon =
              index === 0 ? (
                <ArrowCurve width={24} height={24} color={iconColor} />
              ) : (
                <LeafIcon1 width={24} height={24} color={iconColor} />
              );
            return (
              <ImpactCard
                key={m.id}
                variant="milestone"
                icon={icon}
                iconBg={iconBg}
                title={m.title}
                description={m.description}
                timeAgo={m.timeAgo}
              />
            );
          })}
        </View>
      </ScrollView>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // marginTop: 60,
  },
  header: {
    // marginTop set dynamically via insets for responsive safe area on all devices
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop:12
  },
  chartCard: {
    padding: 16,
    borderRadius: 12,
    
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    gap: 8,
  },
  barWrapper: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '70%',
    minHeight: 8,
    borderRadius: 6,
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  barLabel: {},
});
