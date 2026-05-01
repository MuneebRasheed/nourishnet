import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  ImageSourcePropType,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import { RootStackParamList } from '../navigations/RootNavigation';
import HomeHeader from '../components/HomeHeader';
import ContinueButton from '../components/ContinueButton';
import { ProviderImpactStatCard, ProviderImpactStatsRow } from '../components/ProviderImpactStats';
import { ProviderQuickActionButton, ProviderQuickActionsRow } from '../components/ProviderQuickActionButton';
import { ProviderListingCard } from '../components/ProviderListingCard';
import { useProviderListingsStore, type ProviderListing } from '../../store/providerListingsStore';
import { fetchProviderListingsWithZeroQuantityResolved, deleteListingApi, cancelListingApi } from '../lib/api/listings';
import { useAuthStore } from '../../store/authStore';
import { getDisplayName, avatarUriWithCacheBust } from '../lib/profile';
import { Ionicons } from '@expo/vector-icons';
import ForkKnife from '../assets/svgs/ForkKnife';
import CheckMarkHeart from '../assets/svgs/CheckMarkHeart';
import BoxIcon from '../assets/svgs/BoxIcon';
import ThreelinesIcon from '../assets/svgs/ThreelinesIcon';
import { fetchAnalyticsSummaryApi } from '../lib/api/analytics';
import { useNotificationInboxStore } from '../../store/notificationInboxStore';
import { useProviderImpactStore } from '../../store/providerImpactStore';
import { getMonthlyPostCount, getSubscriptionTier, getMonthlyPostLimit } from '../lib/subscriptionLimits';
import { useOfferingsStore } from '../../store/offeringsStore';

const defaultAvatar = require('../assets/images/Avatar.png');

export default function ProviderHomeScreen() {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();
  const insets = useSafeAreaInsets();
  const profile = useAuthStore((s) => s.profile);
  const userRole = useAuthStore((s) => s.userRole);
  const notificationUnreadCount = useNotificationInboxStore((s) => s.unreadCount);
  const providerHomeAvatarUri = avatarUriWithCacheBust(profile?.avatar_url, profile?.updated_at);
  const allListings = useProviderListingsStore((s) => s.listings);
  const setListings = useProviderListingsStore((s) => s.setListings);
  const removeListing = useProviderListingsStore((s) => s.removeListing);
  const addListingFromApi = useProviderListingsStore((s) => s.addListingFromApi);
  const setHasPriorListing = useProviderListingsStore((s) => s.setHasPriorListing);
  const cachedStreakText = useProviderImpactStore((s) => s.streakText);
  const cachedMealsRescuedTotal = useProviderImpactStore((s) => s.mealsRescuedTotal);
  const setImpactCache = useProviderImpactStore((s) => s.setImpact);
  const customerInfo = useOfferingsStore((s) => s.customerInfo);
  const [streakText, setStreakText] = useState(cachedStreakText);
  const [mealsRescuedTotal, setMealsRescuedTotal] = useState(cachedMealsRescuedTotal);
  const [monthlyPostCount, setMonthlyPostCount] = useState<number | null>(null);
  const [providerListingsHydrated, setProviderListingsHydrated] = useState(
    useProviderListingsStore.persist.hasHydrated()
  );
  const [refreshing, setRefreshing] = useState(false);

  const subscriptionTier = useMemo(() => getSubscriptionTier(customerInfo), [customerInfo]);
  const monthlyPostLimit = useMemo(() => getMonthlyPostLimit(subscriptionTier), [subscriptionTier]);

  const loadProviderHomeData = useCallback(async () => {
    const analyticsPromise =
      userRole === 'provider' || userRole === 'recipient'
        ? fetchAnalyticsSummaryApi(userRole)
        : Promise.resolve(
            { summary: null } as Awaited<ReturnType<typeof fetchAnalyticsSummaryApi>>
          );
    const [listingsRes, analyticsRes] = await Promise.all([
      fetchProviderListingsWithZeroQuantityResolved(),
      analyticsPromise,
    ]);
    if (!listingsRes.error) {
      setListings(listingsRes.listings);
      // Check if at least 1 non-cancelled listing exists for repost button
      const usable = listingsRes.listings.filter((l) => l.status !== 'cancelled');
      setHasPriorListing(usable.length >= 1);
    }

    if (userRole === 'provider' || userRole === 'recipient') {
      if (analyticsRes.summary) {
        const nextStreakText = `${analyticsRes.summary.streakDays}-day streak`;
        const nextMeals = analyticsRes.summary.meals;
        setStreakText(nextStreakText);
        setMealsRescuedTotal(nextMeals);
        setImpactCache(nextStreakText, nextMeals);
      } else {
        setStreakText(cachedStreakText);
        setMealsRescuedTotal(cachedMealsRescuedTotal);
      }
    }

    // Load monthly post count for free plan users
    if (profile?.id && subscriptionTier === 'free') {
      const { count } = await getMonthlyPostCount(profile.id);
      console.log('Monthly post count:', count, 'Limit:', monthlyPostLimit);
      setMonthlyPostCount(count);
    } else {
      setMonthlyPostCount(null);
    }
  }, [setListings, setHasPriorListing, userRole, setImpactCache, cachedStreakText, cachedMealsRescuedTotal, profile?.id, subscriptionTier]);

  useFocusEffect(
    useCallback(() => {
      setStreakText(cachedStreakText);
      setMealsRescuedTotal(cachedMealsRescuedTotal);
    }, [cachedStreakText, cachedMealsRescuedTotal])
  );

  useEffect(() => {
    if (providerListingsHydrated) return;
    const unsub = useProviderListingsStore.persist.onFinishHydration(() => {
      setProviderListingsHydrated(true);
    });
    return unsub;
  }, [providerListingsHydrated]);

  useEffect(() => {
    // Show persisted listings/impact instantly; only fetch once when local cache is empty.
    if (!providerListingsHydrated) return;
    if (allListings.length > 0) return;
    void loadProviderHomeData();
  }, [providerListingsHydrated, allListings.length, loadProviderHomeData]);

  useFocusEffect(
    useCallback(() => {
      if (!providerListingsHydrated) return undefined;
      // Silent refresh on revisit so cache stays fresh without blocking UI.
      void loadProviderHomeData();
      return undefined;
    }, [providerListingsHydrated, loadProviderHomeData])
  );

  const ACTIVE_LISTING_STATUSES = useMemo(
    () => new Set<ProviderListing['status']>(['active', 'request_open', 'claimed']),
    []
  );

  const listings = useMemo(
    () => allListings.filter((l) => ACTIVE_LISTING_STATUSES.has(l.status)),
    [ACTIVE_LISTING_STATUSES, allListings]
  );
  const completedCount = useMemo(
    () => allListings.filter((l) => l.status === 'completed').length,
    [allListings]
  );
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const handlePostSurplus = () => {
    navigation.navigate('PostFoodScreen');
  };

  const handleViewListings = () => {
    navigation.navigate('MainTabs', { screen: 'Listings' });
  };

  const handleViewRequests = (listing: ProviderListing) => {
    navigation.navigate('ListingRequestsScreen', {
      listingId: listing.id,
      listingTitle: listing.title || 'Food name',
    });
  };

  const handleTrackImpact = () => {
    navigation.navigate('MainTabs', { screen: 'Analytics' });
  };

  const handleCreateFirstListing = () => {
    navigation.navigate('PostFoodScreen');
  };

  const handleEditListing = (listing: ProviderListing) => {
    navigation.navigate('PostFoodScreen', { editListing: listing });
  };

  const handleDeleteListing = (listing: ProviderListing) => {
    Alert.alert(
      'Delete listing',
      `Remove "${listing.title || 'this listing'}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteListingApi(listing.id);
            if (error) {
              Alert.alert('Error', error);
              return;
            }
            removeListing(listing.id);
          },
        },
      ]
    );
  };

  const handleInactiveListing = (listing: ProviderListing) => {
    Alert.alert(
      'Mark listing inactive?',
      `Recipients will no longer see "${listing.title || 'this listing'}". It stays in My Listings under Completed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark inactive',
          onPress: async () => {
            const { listing: updated, error } = await cancelListingApi(listing.id);
            if (error) {
              Alert.alert('Error', error);
              return;
            }
            if (updated) addListingFromApi(updated);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.topSection,
          { paddingTop: insets.top, backgroundColor: colors.background },
        ]}
      >
        <HomeHeader
          userName={getDisplayName(profile) || undefined}
          notificationCount={notificationUnreadCount}
          streakText={streakText}
          avatarSource={
            providerHomeAvatarUri
              ? { uri: providerHomeAvatarUri }
              : (defaultAvatar as ImageSourcePropType)
          }
        />

        <ContinueButton
          label="Post Surplus Food"
          onPress={handlePostSurplus}
          isDark={isDark}
          icon={<Ionicons name="add" size={24} color={palette.white} />}
          iconPosition="left"
          style={styles.primaryCta}
        />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              try {
                await loadProviderHomeData();
              } finally {
                setRefreshing(false);
              }
            }}
            tintColor={palette.roleBulbColor4}
            titleColor={palette.roleBulbColor4}
            colors={[palette.roleBulbColor4]}
            progressBackgroundColor={colors.surface}
          />
        }
      >
        <View style={styles.content}>
          {/* Monthly post limit indicator for free plan */}
          {subscriptionTier === 'free' && monthlyPostCount !== null && (
            <View style={[styles.postLimitBanner, { backgroundColor: isDark ? colors.inputFieldBg : palette.notificationFreshBg }]}>
              <View style={styles.postLimitHeader}>
                <View style={styles.postLimitTitleRow}>
                  <Ionicons 
                    name="information-circle-outline" 
                    size={20} 
                    color={monthlyPostCount >= monthlyPostLimit ? palette.errorRed : colors.primary} 
                  />
                  <Text style={[styles.postLimitTitle, { color: colors.text, fontFamily: fontFamilies.interSemiBold, fontSize: fonts.caption }]}>
                    Monthly Posts
                  </Text>
                </View>
                {monthlyPostCount >= monthlyPostLimit && (
                  <TouchableOpacity 
                    onPress={() => navigation.navigate('SubscriptionManagementScreen')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={[styles.upgradeLinkText, { color: colors.primary, fontFamily: fontFamilies.interSemiBold, fontSize: fonts.caption }]}>
                      Upgrade
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.postLimitStats}>
                <Text style={[styles.postLimitCount, { color: colors.text, fontFamily: fontFamilies.interBold, fontSize: fonts.title3 }]}>
                  {monthlyPostCount}
                  <Text style={[styles.postLimitTotal, { color: colors.textSecondary, fontFamily: fontFamilies.interMedium, fontSize: fonts.body }]}>
                    /{monthlyPostLimit}
                  </Text>
                </Text>
                <Text style={[styles.postLimitLabel, { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.caption }]}>
                  {monthlyPostCount >= monthlyPostLimit 
                    ? (monthlyPostCount > monthlyPostLimit 
                        ? `${monthlyPostCount - monthlyPostLimit} over limit - resets next month`
                        : 'All posts used this month')
                    : `${monthlyPostLimit - monthlyPostCount} post${monthlyPostLimit - monthlyPostCount !== 1 ? 's' : ''} remaining`
                  }
                </Text>
              </View>

              {/* Progress bar */}
              <View style={[styles.progressBarContainer, { backgroundColor: isDark ? colors.background : palette.white }]}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { 
                      backgroundColor: monthlyPostCount >= monthlyPostLimit ? palette.errorRed : colors.primary,
                      width: `${Math.min((monthlyPostCount / monthlyPostLimit) * 100, 100)}%`
                    }
                  ]} 
                />
              </View>
              {/* Debug info - remove after testing */}
              {__DEV__ && console.log('Progress bar width:', `${Math.min((monthlyPostCount / monthlyPostLimit) * 100, 100)}%`, 'Count:', monthlyPostCount, 'Limit:', monthlyPostLimit)}
            </View>
          )}

          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontFamily: fontFamilies.interBold, fontSize: fonts.body },
            ]}
          >
            Your Impact Overview
          </Text>
         
          <ProviderImpactStatsRow>
            <ProviderImpactStatCard
              value={String(listings.length)}
              title="Active Posts"
              label="Currently available"
              icon={ <BoxIcon width={26} height={26} color={isDark ? palette.roleBulbColor3 : palette.roleBulbColor1} /> }
              iconBgColor={isDark ? colors.inputFieldBg : palette.roleCardbg}
            />
            <ProviderImpactStatCard
              value={String(completedCount)}
              title="Completed"
              label="Successfully picked up"
              icon={<CheckMarkHeart width={20} height={20} color={colors.primary} />}
              iconBgColor={isDark ? colors.inputFieldBg : palette.roleCard}
            />
            <ProviderImpactStatCard
              value={String(mealsRescuedTotal)}
              title="Total Meals"
              label="Meals rescued"
              icon={<ForkKnife width={20} height={20} color={palette.timeIcon} />}
              iconBgColor={isDark ? colors.inputFieldBg : palette.timeIconBg}
            />
          </ProviderImpactStatsRow>

          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontFamily: fontFamilies.interBold, fontSize: fonts.body },
            ]}
          >
            Quick Actions
          </Text>
          <ProviderQuickActionsRow>
            <ProviderQuickActionButton
              title="View All"
              label="My Listings"
              icon={<BoxIcon width={20} height={22} color={isDark ? palette.roleBulbColor3 : palette.roleBulbColor1} />}
              iconBgColor={isDark ? colors.inputFieldBg : palette.roleCardbg}
              onPress={handleViewListings}
            />
            <ProviderQuickActionButton
              title="Track"
              label="Impact"
              icon={<ThreelinesIcon width={22} height={22} color={colors.primary} />}
              iconBgColor={isDark ? palette.ThreelinesIconBg : palette.ThreelinesIconBg}
              onPress={handleTrackImpact}
            />
          </ProviderQuickActionsRow>

          <View style={styles.sectionHeaderRow}>
            <Text
              style={[
                styles.sectionHeading,
                { color: colors.text, fontFamily: fontFamilies.interBold, fontSize: fonts.body },
              ]}
            >
              Your Active Listings
            </Text>
            {listings.length > 0 && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleViewListings}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text
                  style={[
                    styles.seeAllLink,
                    { color: colors.primary, fontFamily: fontFamilies.interSemiBold, fontSize: fonts.subhead },
                  ]}
                >
                  See all
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {listings.length === 0 ? (
            <View
              style={[
                styles.emptyStateCard,
                { backgroundColor: colors.inputFieldBg, borderColor: colors.borderColor },
              ]}
            >
              <View
                style={[
                  styles.emptyStateIconWrap,
                  { backgroundColor: isDark ? colors.inputFieldBg : palette.roleCardbg },
                ]}
              >
                <BoxIcon
                  width={26}
                  height={26}
                  color={isDark ? palette.roleBulbColor3 : palette.roleBulbColor1}
                />
              </View>
              <Text
                style={[
                  styles.emptyStateTitle,
                  {
                    color: colors.text,
                    fontFamily: fontFamilies.interBold,
                    fontSize: fonts.body,
                  },
                ]}
              >
                No active listings
              </Text>
              <Text
                style={[
                  styles.emptyStateSubtitle,
                  {
                    color: colors.textSecondary,
                    fontFamily: fontFamilies.inter,
                    fontSize: fonts.caption,
                  },
                ]}
              >
                Start sharing your surplus food with the community
              </Text>
              <ContinueButton
                label="Create Your First Listing"
                onPress={handleCreateFirstListing}
                isDark={isDark}
                icon={<Ionicons name="add" size={22} color={palette.white} />}
                iconPosition="left"
                style={styles.createListingCta}
              />
            </View>
          ) : (
            listings.map((listing) => (
              <ProviderListingCard
                key={listing.id}
                title={listing.title || 'Food name'}
                portionsLabel={
                  listing.quantity
                    ? `${listing.quantity} ${listing.quantityUnit || 'portions'}`
                    : listing.quantityUnit || 'portions'
                }
                timeRangeLabel={`${listing.startTime} - ${listing.endTime}`}
                address={listing.pickupAddress}
                foodType={listing.foodType}
                imageSource={listing.imageUrl ? { uri: listing.imageUrl } : undefined}
                statusLabel={ACTIVE_LISTING_STATUSES.has(listing.status) ? 'Active' : 'Completed'}
                onPressViewRequests={() => handleViewRequests(listing)}
                onEdit={() => handleEditListing(listing)}
                onInactive={() => handleInactiveListing(listing)}
                onDelete={() => handleDeleteListing(listing)}
              />
            ))
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
  topSection: {
    paddingHorizontal: 16,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  content: {},
  primaryCta: {
    marginTop: 20,
    width: '100%',
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 12,
  },
  sectionLabel: {
    marginBottom: 12,
  },
  emptyStateCard: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
   
  },
  emptyStateTitle: {
    marginTop: 16,
  },
  emptyStateSubtitle: {
    marginTop: 8,
    textAlign: 'center',
  },
  createListingCta: {
    marginTop: 20,
    width: '100%',
  },
  emptyStateIconWrap:{
    width: 55,
    height: 55,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "red",

 
  },
  sectionHeading: {},
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
    marginBottom: 12,
  },
  seeAllLink: {},
  postLimitBanner: {
    marginTop: 20,
    marginBottom: 4,
    padding: 16,
    borderRadius: 12,
  },
  postLimitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  postLimitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postLimitTitle: {},
  postLimitStats: {
    marginBottom: 12,
  },
  postLimitCount: {
    lineHeight: 28,
  },
  postLimitTotal: {
    lineHeight: 28,
  },
  postLimitLabel: {
    marginTop: 2,
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  upgradeLinkText: {},
});
