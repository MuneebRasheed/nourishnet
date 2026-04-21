import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useRequestedListingsStore } from '../../store/requestedListingsStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import { RootStackParamList } from '../navigations/RootNavigation';
import type { ProviderListing } from '../../store/providerListingsStore';
import {
  fetchBrowseListingsApi,
  fetchMyRequestsApi,
  listingRowToProviderListing,
} from '../lib/api/listings';
import { supabase } from '../lib/supabase';
import HomeHeader from '../components/HomeHeader';
import SearchBarWithFilter from '../components/SearchBarWithFilter';
import FilterModal, {
  type FilterState,
  parseTimeForFilter,
} from '../components/FilterModal';
import CategoryChips from '../components/CategoryChips';
import FoodCard, { FoodCardData } from '../components/FoodCard';
import BoxIcon from '../assets/svgs/BoxIcon';
import type { FoodDetailItem } from './FoodDetailScreen';
import { getAvatarLetter, getDisplayName, avatarUriWithCacheBust } from '../lib/profile';
import { fetchStreakTextApi } from '../lib/api/analytics';
import { getFeedRadiusMeters, haversineMeters } from '../lib/geoFeed';
import {
  isListingVisibleForRecipient,
  msUntilListingVisibleForRecipient,
} from '../lib/demandPulseVisibility';

const DEFAULT_LISTING_IMAGE = require('../assets/images/FoodOnboard1.png');

/** Parse time string to minutes since midnight. Handles "18:00" (24h) and "3:30PM" style. */
function timeToMinutes(s: string): number | null {
  if (!s || typeof s !== 'string') return null;
  const trimmed = s.trim();
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const h = parseInt(match24[1], 10);
    const m = parseInt(match24[2], 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) return h * 60 + m;
  }
  const d = parseTimeForFilter(trimmed);
  return d ? d.getHours() * 60 + d.getMinutes() : null;
}

/** Parse timeSlot "18:00 - 20:00" to { start, end } in minutes. Returns null if unparseable. */
function parseTimeSlotMinutes(timeSlot: string): { start: number; end: number } | null {
  if (!timeSlot || typeof timeSlot !== 'string') return null;
  const parts = timeSlot.split('-').map((p) => p.trim());
  if (parts.length !== 2) return null;
  const start = timeToMinutes(parts[0]);
  const end = timeToMinutes(parts[1]);
  if (start == null || end == null) return null;
  return { start, end };
}

/** True if listing time slot overlaps filter window [filterStart, filterEnd] (minutes). */
function timeSlotOverlaps(
  timeSlot: string,
  filterStartMinutes: number,
  filterEndMinutes: number
): boolean {
  const slot = parseTimeSlotMinutes(timeSlot);
  if (!slot) return true;
  return slot.start < filterEndMinutes && slot.end > filterStartMinutes;
}

function formatPostedAgo(createdAt: string): string {
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

function providerListingToDetailItem(listing: ProviderListing): FoodDetailItem {
  return {
    id: listing.id,
    image: listing.imageUrl ? { uri: listing.imageUrl } : DEFAULT_LISTING_IMAGE,
    title: listing.title,
    source: 'Provider',
    distance: '—',
    postedAgo: formatPostedAgo(listing.createdAt),
    portions: `${listing.quantity} ${listing.quantityUnit}`,
    timeSlot: `${listing.startTime} - ${listing.endTime}`,
    dietaryTags: listing.dietaryTags?.length ? listing.dietaryTags : undefined,
    isLive: true,
    pickupAddress: listing.pickupAddress,
    pickupTimeNote: '',
    pickupInstructions: listing.note || undefined,
    quantity: parseInt(listing.quantity, 10) || 0,
    allergens: listing.allergens?.length ? listing.allergens : undefined,
    foodType: listing.foodType ?? undefined,
  };
}

export default function HomeScreen() {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const profile = useAuthStore((s) => s.profile);
  const userRole = useAuthStore((s) => s.userRole);
  const homeHeaderAvatarUri = avatarUriWithCacheBust(profile?.avatar_url, profile?.updated_at);
  const [browseListings, setBrowseListings] = useState<ProviderListing[]>([]);
  /** Listing ids the current user already finished (same bucket as My Requests → Completed). Hidden from this recipient’s home feed. */
  const [recipientCompletedListingIds, setRecipientCompletedListingIds] = useState<Set<string>>(
    () => new Set()
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [streakText, setStreakText] = useState('0-day streak');
  /** Unique Realtime topic per subscription — reused topic + `.on()` after `subscribe()` throws. */
  const listingsRecipientFeedChannelSeq = useRef(0);
  /** Bumps on Realtime effect cleanup so stagger timers from a previous subscription do not update state. */
  const recipientFeedRealtimeGen = useRef(0);
  /** INSERT → refetch after preference gap (no second Realtime event at eligible time). */
  const staggerRevealTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [browseRes, myRes] = await Promise.all([
        fetchBrowseListingsApi(),
        fetchMyRequestsApi(),
      ]);
      if (cancelled) return;
      setBrowseListings(browseRes.error ? [] : browseRes.listings);
      if (!myRes.error) {
        useRequestedListingsStore.getState().setRequestedIds(myRes.active.map((r) => r.id));
        setRecipientCompletedListingIds(new Set(myRes.completed.map((r) => r.id)));
      } else {
        setRecipientCompletedListingIds(new Set());
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Live updates when new listings are inserted (no pull-to-refresh). Geo-gated like GET /browse. */
  useEffect(() => {
    if (userRole !== 'recipient') {
      recipientFeedRealtimeGen.current += 1;
      staggerRevealTimersRef.current.forEach((tid) => clearTimeout(tid));
      staggerRevealTimersRef.current.clear();
      return;
    }

    const realtimeGen = ++recipientFeedRealtimeGen.current;

    const recipientLat =
      profile?.latitude != null && Number.isFinite(Number(profile.latitude))
        ? Number(profile.latitude)
        : null;
    const recipientLng =
      profile?.longitude != null && Number.isFinite(Number(profile.longitude))
        ? Number(profile.longitude)
        : null;
    const hasRecipientCoords = recipientLat != null && recipientLng != null;

    const channelTopic = `listings-recipient-feed:${profile?.id ?? 'user'}:${++listingsRecipientFeedChannelSeq.current}`;
    const channel = supabase
      .channel(channelTopic)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'listings' },
        (payload) => {
          const listing = listingRowToProviderListing(
            (payload.new ?? {}) as Record<string, unknown>
          );
          if (!listing) return;
          const visible =
            listing.status === 'active' ||
            listing.status === 'request_open' ||
            listing.status === 'claimed';
          if (!visible) return;

          if (hasRecipientCoords) {
            const blat = listing.pickupLatitude;
            const blng = listing.pickupLongitude;
            if (
              blat == null ||
              blng == null ||
              !Number.isFinite(blat) ||
              !Number.isFinite(blng)
            ) {
              return;
            }
            const d = haversineMeters(blat, blng, recipientLat, recipientLng);
            if (d > getFeedRadiusMeters()) return;
          }

          const nowMs = Date.now();
          const pulseProfile = useAuthStore.getState().profile;
          if (isListingVisibleForRecipient(listing, pulseProfile, nowMs)) {
            const pending = staggerRevealTimersRef.current.get(listing.id);
            if (pending) {
              clearTimeout(pending);
              staggerRevealTimersRef.current.delete(listing.id);
            }
            setBrowseListings((prev) => {
              if (prev.some((l) => l.id === listing.id)) return prev;
              return [listing, ...prev];
            });
            return;
          }

          // Stagger: no second Realtime event when the gap elapses — refetch browse once we're eligible.
          const delay = msUntilListingVisibleForRecipient(listing, pulseProfile, nowMs);
          if (delay == null) return;
          const listingId = listing.id;
          if (staggerRevealTimersRef.current.has(listingId)) return;

          const t = setTimeout(() => {
            staggerRevealTimersRef.current.delete(listingId);
            if (recipientFeedRealtimeGen.current !== realtimeGen) return;
            void (async () => {
              const browseRes = await fetchBrowseListingsApi();
              if (recipientFeedRealtimeGen.current !== realtimeGen || browseRes.error) return;
              setBrowseListings(browseRes.listings);
            })();
          }, delay);
          staggerRevealTimersRef.current.set(listingId, t);
        }
      )
      .subscribe();

    return () => {
      recipientFeedRealtimeGen.current += 1;
      staggerRevealTimersRef.current.forEach((tid) => clearTimeout(tid));
      staggerRevealTimersRef.current.clear();
      void supabase.removeChannel(channel);
    };
  }, [userRole, profile?.latitude, profile?.longitude]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (userRole !== 'provider' && userRole !== 'recipient') return;
      const { streakText: text } = await fetchStreakTextApi(userRole);
      if (!cancelled) setStreakText(text);
    })();
    return () => {
      cancelled = true;
    };
  }, [userRole]);

  const onRefresh = async () => {
    setRefreshing(true);
    const [browseRes, myRes] = await Promise.all([
      fetchBrowseListingsApi(),
      fetchMyRequestsApi(),
    ]);
    setBrowseListings(browseRes.error ? [] : browseRes.listings);
    if (!myRes.error) {
      setRequestedIds(myRes.active.map((r) => r.id));
      setRecipientCompletedListingIds(new Set(myRes.completed.map((r) => r.id)));
    }
    setRefreshing(false);
  };

  const ACTIVE_LISTING_STATUSES = useMemo(
    () => new Set<ProviderListing['status']>(['active', 'request_open', 'claimed']),
    []
  );

  const activeListings = useMemo(
    () => browseListings.filter((l) => ACTIVE_LISTING_STATUSES.has(l.status)),
    [ACTIVE_LISTING_STATUSES, browseListings]
  );
  const mergedActiveListings = useMemo(() => {
    // Recipient home should reflect the backend browse feed (same as provider-created listings).
    // Do not fall back to locally persisted provider listings, to avoid showing stale/mock data.
    const seen = new Set<string>();
    return activeListings.filter((l) => {
      if (recipientCompletedListingIds.has(l.id)) return false;
      if (seen.has(l.id)) return false;
      seen.add(l.id);
      return true;
    });
  }, [activeListings, recipientCompletedListingIds]);
  const listingItems = useMemo(
    () => mergedActiveListings.map(providerListingToDetailItem),
    [mergedActiveListings]
  );
  const baseList = listingItems;
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [appliedFilters, setAppliedFilters] = useState<FilterState | null>(null);

  const displayList = useMemo(() => {
    let list = baseList;
    // Filter by category (e.g. Prepared Meals, Baked Goods, Produce)
    if (category && category !== 'All') {
      const catLower = category.toLowerCase();
      list = list.filter((item) => {
        const ft = (item.foodType ?? '').trim().toLowerCase();
        if (!ft) return catLower === 'other'; // Items without foodType show under "Other"
        return ft === catLower || ft.replace(/\s+/g, '_') === catLower.replace(/\s+/g, '_');
      });
    }
    // Filter by search
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          (item.source && item.source.toLowerCase().includes(q)) ||
          (item.dietaryTags?.some((t) => t.toLowerCase().includes(q)))
      );
    }
    // Filter by modal filters (food type, pickup time, allergens, city)
    if (appliedFilters) {
      const { foodType: ft, pickupTimeStart, pickupTimeEnd, allergens: filterAllergens, city: filterCity } = appliedFilters;
      if (ft && ft.trim()) {
        const ftNorm = ft.trim().toLowerCase().replace(/\s+/g, ' ');
        list = list.filter((item) => {
          const itemFt = (item.foodType ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
          return itemFt === ftNorm || itemFt.replace(/\s/g, '_') === ftNorm.replace(/\s/g, '_');
        });
      }
      const filterStartM = timeToMinutes(pickupTimeStart);
      const filterEndM = timeToMinutes(pickupTimeEnd);
      if (filterStartM != null && filterEndM != null) {
        list = list.filter((item) =>
          timeSlotOverlaps(item.timeSlot, filterStartM, filterEndM)
        );
      }
      if (filterAllergens.length > 0) {
        const set = new Set(filterAllergens.map((a) => a.trim().toLowerCase()));
        list = list.filter((item) => {
          const itemAllergens = item.allergens ?? [];
          return !itemAllergens.some((a) => set.has(a.trim().toLowerCase()));
        });
      }
      if (filterCity && filterCity.trim()) {
        const cityLower = filterCity.trim().toLowerCase();
        list = list.filter((item) =>
          (item.pickupAddress ?? '').toLowerCase().includes(cityLower)
        );
      }
    }
    return list;
  }, [baseList, search, category, appliedFilters]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const requestedIds = useRequestedListingsStore((s) => s.requestedIds);
  const setRequestedIds = useRequestedListingsStore((s) => s.setRequestedIds);
  const isRequested = (id: string) => requestedIds.has(id);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const [myRes, browseRes] = await Promise.all([
          fetchMyRequestsApi(),
          userRole === 'recipient' ? fetchBrowseListingsApi() : Promise.resolve(null),
        ]);
        if (cancelled) return;
        if (!myRes.error) {
          setRequestedIds(myRes.active.map((r) => r.id));
          setRecipientCompletedListingIds(new Set(myRes.completed.map((r) => r.id)));
        }
        if (userRole === 'recipient' && browseRes && !browseRes.error) {
          setBrowseListings(browseRes.listings);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [setRequestedIds, userRole, profile?.demand_pulse_expires_at, profile?.demand_pulse_food_types])
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top , paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.content}>
          <HomeHeader
            userName={getDisplayName(profile)}
            avatarLetter={getAvatarLetter(profile)}
            avatarSource={homeHeaderAvatarUri ? { uri: homeHeaderAvatarUri } : undefined}
            streakText={streakText}
          />
          <View style={styles.searchSection}>
            <SearchBarWithFilter
              placeholder="Enter here"
              value={search}
              onChangeText={setSearch}
              onFilterPress={() => setFilterModalVisible(true)}
            />
          </View>
          <View style={styles.categoriesSection}>
            <CategoryChips selected={category} onSelect={setCategory} />
          </View>
          <View style={styles.sectionHeader}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, fontFamily: fontFamilies.interBold, fontSize: fonts.body },
              ]}
            >
              {category === 'All' ? 'All' : category}
            </Text>
            <View style={[styles.availableBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.availableText, { fontFamily: fontFamilies.interMedium, fontSize: fonts.caption }]}>
                {displayList.length} available
              </Text>
            </View>
          </View>
          <View style={styles.cards}>
            {displayList.length === 0 ? (
              <View style={styles.emptyStateCenter}>
                <View style={styles.emptyStateCard}>
                  <View style={styles.emptyStateIconWrap}>
                    <BoxIcon width={64} height={64} color={colors.textSecondary} />
                  </View>
                  <Text
                    style={[
                      styles.emptyStateTitle,
                      {
                        color: colors.text,
                        fontFamily: fontFamilies.interSemiBold,
                        fontSize: fonts.body,
                      },
                    ]}
                  >
                    No active food listings found
                  </Text>
                  <Text
                    style={[
                      styles.emptyStateTitle,
                      {
                        color: colors.textSecondary,
                        fontFamily: fontFamilies.inter,
                        fontSize: fonts.caption,
                        marginTop: 4,
                      },
                    ]}
                  >
                    Create a new listing to start sharing food.
                  </Text>
                </View>
              </View>
            ) : (
              displayList.map((item) => {
                const requested = isRequested(item.id);

                const handlePress = () => {
                  // Card button only navigates to detail; user submits request on detail screen
                  navigation.navigate('FoodDetailScreen', { item });
                };

                return (
                  <View key={item.id} style={{ marginBottom: 16 }}>
                    {requested && (
                      <Text
                        style={{
                          marginBottom: 4,
                          alignSelf: 'flex-start',
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 999,
                          backgroundColor: colors.inputFieldBg,
                          color: colors.textSecondary,
                          fontFamily: fontFamilies.interMedium,
                          fontSize: fonts.caption,
                        }}
                      >
                        Submitted
                      </Text>
                    )}

                    <FoodCard
                      item={item as FoodCardData}
                      claimLabel={requested ? 'Request Submitted' : 'Request This Food'}
                      claimButtonVariant={requested ? 'outline' : 'primary'}
                      claimButtonBgColor={requested ? colors.inputFieldBg : undefined}
                      claimButtonTextColor={requested ? colors.textSecondary : undefined}
                      claimIconColor={requested ? colors.textSecondary : undefined}
                      onClaim={handlePress}
                      viewDetailLabel={requested ? 'View Detail' : undefined}
                      onViewDetail={requested ? handlePress : undefined}
                    />
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={(filters) => setAppliedFilters(filters)}
        onReset={() => setAppliedFilters(null)}
        initialFilters={appliedFilters}
      />
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
  },
  content: {},
  searchSection: {
    marginTop: 20,
  },
  categoriesSection: {
    marginTop: 20,
    marginHorizontal: -16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {},
  availableBadge: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
  },
  availableText: {
    color: '#fff',
  },
  cards: {
    paddingBottom: 8,
  },
  emptyStateCenter: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    marginTop: 16,
  },
  emptyStateSubtitle: {
    marginTop: 8,
    textAlign: 'center',
  },
});
