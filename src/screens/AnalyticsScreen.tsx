import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import { useAuthStore } from '../../store/authStore';
import type { AuthRole } from '../../store/authStore';
import {
  DEFAULT_ANALYTICS_CACHE,
  useAnalyticsSummaryStore,
  type AnalyticsSummaryCache,
} from '../../store/analyticsSummaryStore';
import SettingsHeader from '../components/SettingsHeader';
import ImpactCard from '../components/ImpactCard';
import HeartTab from '../assets/svgs/HeartTab';
import LeafIcon1 from '../assets/svgs/LeafIcon1';
import BatchIcon from '../assets/svgs/BatchIcon';
import UpwardArrow from '../assets/svgs/UpwardArrow';
import ArrowCurve from '../assets/svgs/ArrowCurve';
import { fetchAnalyticsSummaryApi } from '../lib/api/analytics';
import { useRecipientFeedStore } from '../../store/recipientFeedStore';
import { fetchBrowseListingsApi } from '../lib/api/listings';

const CHART_HEIGHT = 150;
const CHART_TICK_STEPS = 5;

const MILESTONE_PALETTE = [
  { iconBg: palette.roleCardbg, iconColor: palette.roleBulbColor1 },
  { iconBg: palette.roleCard, iconColor: palette.roleBulbColor2 },
];

function formatTimeAgo(iso: string | null): string {
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
}

function toSnapshotFromApi(summary: Awaited<ReturnType<typeof fetchAnalyticsSummaryApi>>['summary']): AnalyticsSummaryCache {
  if (!summary) return DEFAULT_ANALYTICS_CACHE;
  return {
    meals: summary.meals,
    poundsRescued: summary.poundsRescued,
    co2LbsSaved: summary.co2LbsSaved,
    streakDays: summary.streakDays,
    monthLabels: summary.monthLabels.length ? summary.monthLabels : DEFAULT_ANALYTICS_CACHE.monthLabels,
    monthCounts: summary.monthCounts.length ? summary.monthCounts : DEFAULT_ANALYTICS_CACHE.monthCounts,
    monthRatios: summary.monthRatios.length ? summary.monthRatios : DEFAULT_ANALYTICS_CACHE.monthRatios,
    firstPickupAgo: formatTimeAgo(summary.firstPickupAt),
    ecoWarriorAgo: formatTimeAgo(summary.firstEcoWarriorAt),
    lastPickupDate: summary.lastPickupDate,
    pickupSuccessRate: summary.pickupSuccessRate,
    totalRequests: summary.totalRequests,
    acceptedRequests: summary.acceptedRequests,
  };
}

export default function AnalyticsScreen() {
  const theme = useThemeStore((s) => s.theme);
  const userRole = useAuthStore((s) => s.userRole);
  const cachedByRole = useAnalyticsSummaryStore((s) => s.byRole);
  const setRoleSummaryCache = useAnalyticsSummaryStore((s) => s.setRoleSummary);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();
  const insets = useSafeAreaInsets();
  const activeRole = (userRole === 'provider' || userRole === 'recipient' ? userRole : null) as AuthRole | null;
  const initialSnapshot = activeRole ? cachedByRole[activeRole] : DEFAULT_ANALYTICS_CACHE;
  const [meals, setMeals] = useState(initialSnapshot.meals);
  const [poundsRescued, setPoundsRescued] = useState(initialSnapshot.poundsRescued);
  const [co2LbsSaved, setCo2LbsSaved] = useState(initialSnapshot.co2LbsSaved);
  const [streakDays, setStreakDays] = useState(initialSnapshot.streakDays);
  const [months, setMonths] = useState<string[]>(initialSnapshot.monthLabels);
  const [monthCounts, setMonthCounts] = useState<number[]>(
    initialSnapshot.monthCounts ?? initialSnapshot.monthRatios
  );
  const [firstPickupAgo, setFirstPickupAgo] = useState(initialSnapshot.firstPickupAgo);
  const [ecoWarriorAgo, setEcoWarriorAgo] = useState(initialSnapshot.ecoWarriorAgo);
  const [lastPickupDate, setLastPickupDate] = useState(initialSnapshot.lastPickupDate);
  const [pickupSuccessRate, setPickupSuccessRate] = useState(initialSnapshot.pickupSuccessRate);
  const [availableMealsCount, setAvailableMealsCount] = useState(0);

  const applySnapshot = (snapshot: AnalyticsSummaryCache) => {
    setMeals(snapshot.meals);
    setPoundsRescued(snapshot.poundsRescued);
    setCo2LbsSaved(snapshot.co2LbsSaved);
    setStreakDays(snapshot.streakDays);
    setMonths(snapshot.monthLabels);
    setMonthCounts(snapshot.monthCounts ?? snapshot.monthRatios);
    setFirstPickupAgo(snapshot.firstPickupAgo);
    setEcoWarriorAgo(snapshot.ecoWarriorAgo);
    setLastPickupDate(snapshot.lastPickupDate);
    setPickupSuccessRate(snapshot.pickupSuccessRate);
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!activeRole) return;
      applySnapshot(cachedByRole[activeRole] ?? DEFAULT_ANALYTICS_CACHE);
      const { summary } = await fetchAnalyticsSummaryApi(activeRole);
      if (!summary || cancelled) return;
      const snapshot = toSnapshotFromApi(summary);
      applySnapshot(snapshot);
      setRoleSummaryCache(activeRole, snapshot);
      
      // Fetch available meals count for recipients
      if (activeRole === 'recipient') {
        const browseRes = await fetchBrowseListingsApi();
        if (!browseRes.error && !cancelled) {
          const activeListings = browseRes.listings.filter(
            (l) => l.status === 'active' || l.status === 'request_open' || l.status === 'claimed'
          );
          setAvailableMealsCount(activeListings.length);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [activeRole, cachedByRole, setRoleSummaryCache]);

  useFocusEffect(
    useCallback(() => {
      if (!activeRole) return undefined;
      let cancelled = false;
      void (async () => {
        const { summary } = await fetchAnalyticsSummaryApi(activeRole);
        if (!summary || cancelled) return;
        const snapshot = toSnapshotFromApi(summary);
        applySnapshot(snapshot);
        setRoleSummaryCache(activeRole, snapshot);
        
        // Fetch available meals count for recipients
        if (activeRole === 'recipient') {
          const browseRes = await fetchBrowseListingsApi();
          if (!browseRes.error && !cancelled) {
            const activeListings = browseRes.listings.filter(
              (l) => l.status === 'active' || l.status === 'request_open' || l.status === 'claimed'
            );
            setAvailableMealsCount(activeListings.length);
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [activeRole, setRoleSummaryCache])
  );

  const statLabels = useMemo(
    () => ({
      mealsTitle: userRole === 'provider' ? 'Meals Shared' : 'Meals',
      mealsLabel: userRole === 'provider' ? 'Meals completed' : 'Meals received',
    }),
    [userRole]
  );

  const formatLastPickupDate = (dateStr: string | null): string => {
    if (!dateStr) return 'No pickups yet';
    return formatTimeAgo(dateStr);
  };

  const milestones = useMemo(
    () => {
      if (userRole === 'recipient') {
        // Only show "First Meal" for recipients
        return [
          {
            id: 'first-meal',
            title: 'First Meal',
            description: 'Claimed your first meal',
            timeAgo: firstPickupAgo,
          },
        ];
      }
      // Provider milestones
      return [
        {
          id: 'first-rescue',
          title: 'First Rescue',
          description: 'You shared your first meal!',
          timeAgo: firstPickupAgo,
        },
        {
          id: 'eco-warrior',
          title: 'Eco Warrior',
          description: 'You shared enough meals to save 10 kg of CO2!',
          timeAgo: ecoWarriorAgo,
        },
      ];
    },
    [ecoWarriorAgo, firstPickupAgo, userRole]
  );
  const maxMonthlyMeals = useMemo(() => Math.max(0, ...monthCounts), [monthCounts]);
  const yAxisMax = useMemo(() => Math.max(10, Math.ceil(maxMonthlyMeals / 10) * 10), [maxMonthlyMeals]);
  const yAxisTicks = useMemo(
    () =>
      Array.from({ length: CHART_TICK_STEPS + 1 }, (_, i) => {
        const ratio = 1 - i / CHART_TICK_STEPS;
        return {
          ratio,
          value: Math.round(yAxisMax * ratio),
        };
      }),
    [yAxisMax]
  );
  const hasMonthlyActivity = useMemo(
    () => monthCounts.length > 0 && monthCounts.some((count) => count > 0),
    [monthCounts]
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
            {userRole === 'recipient' ? (
              <>
                {/* Recipient-specific metrics */}
                <ImpactCard
                  variant="stat"
                  icon={<HeartTab width={20} height={20} color={palette.timeIcon} />}
                  title="Total Meals"
                  value={String(meals)}
                  label="Meals received"
                  accentColor={palette.timeIcon}
                />
                <ImpactCard
                  variant="stat"
                  icon={<ArrowCurve width={20} height={20} color={palette.roleBulbColor2} />}
                  title="Last Pickup"
                  value={formatLastPickupDate(lastPickupDate)}
                  label="Most recent"
                  accentColor={palette.roleBulbColor2}
                  isDateValue={true}
                />
                <ImpactCard
                  variant="stat"
                  icon={<UpwardArrow width={20} height={20} color={palette.logoutColor} />}
                  title="Pickup Success Rate"
                  value={`${pickupSuccessRate}%`}
                  label="Requests accepted"
                  accentColor={palette.logoutColor}
                />
                <ImpactCard
                  variant="stat"
                  icon={<BatchIcon width={20} height={20} color={palette.roleBulbColor3} />}
                  title="Food Available"
                  value={String(availableMealsCount)}
                  label="Meals available"
                  accentColor={palette.roleBulbColor3}
                />
              </>
            ) : (
              <>
                {/* Provider metrics */}
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
              </>
            )}
          </View>
        </View>

        {userRole === 'provider' && (
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
            <View style={[styles.chartCard, { backgroundColor: colors.inputFieldBg }]}>
              {hasMonthlyActivity ? (
                <View style={styles.chartBody}>
                  <View style={styles.yAxis}>
                    {yAxisTicks.map((tick) => (
                      <Text
                        key={`tick-${tick.value}-${tick.ratio}`}
                        style={[
                          styles.yAxisLabel,
                          {
                            color: colors.textSecondary,
                            fontFamily: fontFamilies.inter,
                            fontSize: fonts.caption,
                          },
                        ]}
                      >
                        {tick.value}
                      </Text>
                    ))}
                  </View>
                  <View style={styles.chartContent}>
                    <View style={styles.chartArea}>
                      <View style={styles.gridLayer} pointerEvents="none">
                        {yAxisTicks.map((tick, index) => (
                          <View
                            key={`grid-${tick.value}-${tick.ratio}`}
                            style={[
                              styles.gridLine,
                              {
                                top: `${(1 - tick.ratio) * 100}%`,
                                opacity: index === yAxisTicks.length - 1 ? 0.35 : 0.2,
                                backgroundColor: colors.borderColor,
                              },
                            ]}
                          />
                        ))}
                      </View>
                      <View style={styles.barChart}>
                        {monthCounts.map((count, i) => (
                          <View key={months[i] ?? `m-${i}`} style={styles.barWrapper}>
                            <View
                              style={[
                                styles.bar,
                                {
                                  height: count > 0 ? Math.max(10, (CHART_HEIGHT * count) / yAxisMax) : 0,
                                  backgroundColor: '#FF6B35',
                                },
                              ]}
                            />
                          </View>
                        ))}
                      </View>
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
              ) : (
                <View style={styles.noActivityContainer}>
                  <Text
                    style={[
                      styles.noActivityText,
                      {
                        color: colors.textSecondary,
                        fontFamily: fontFamilies.poppinsSemiBold,
                        fontSize: fonts.body,
                      },
                    ]}
                  >
                    No Monthly Activity
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

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
    // padding: 16,
    paddingVertical: 16,
    paddingRight: 16,
    paddingLeft: 4,
    borderRadius: 12,
    
  },
  noActivityContainer: {
    height: CHART_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noActivityText: {
    textAlign: 'center',
  },
  chartBody: {
    flexDirection: 'row',
  
    // alignItems: 'flex-end',
  },
  yAxis: {
    height: CHART_HEIGHT,
    justifyContent: 'space-between',
    marginRight: 6,
    paddingBottom: 2,
  },
  yAxisLabel: {
    minWidth: 20,
    textAlign: 'right',
    lineHeight: 14,
  },
  chartContent: {
    flex: 1,
  },
  chartArea: {
    height: CHART_HEIGHT,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  gridLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: CHART_HEIGHT,
    gap: 8,
  },
  barWrapper: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '62%',
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
