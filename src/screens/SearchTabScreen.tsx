import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import SettingsHeader from '../components/SettingsHeader';
import FoodCard, { type FoodCardData } from '../components/FoodCard';
import HeartTab from '../assets/svgs/HeartTab';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList as SearchStackParamList } from '../navigations/SearchNavigationStack';
import { RootStackParamList } from '../navigations/RootNavigation';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../lib/supabase';
import { fetchProfile } from '../lib/profile';
import {
  fetchBrowseListingsApi,
  fetchMyRequestsApi,
  listingRowToProviderListing,
} from '../lib/api/listings';
import type { ProviderListing } from '../../store/providerListingsStore';
import { useRequestedListingsStore } from '../../store/requestedListingsStore';
import type { FoodDetailItem } from './FoodDetailScreen';
import { getFeedRadiusMeters, haversineMeters } from '../lib/geoFeed';
import {
  pulseFoodTypeMatches,
  isListingVisibleForRecipient,
  msUntilListingVisibleForRecipient,
} from '../lib/demandPulseVisibility';

const DEFAULT_LISTING_IMAGE = require('../assets/images/FoodOnboard1.png');

function isPulseActive(
  expiresAt: string | null | undefined,
  nowMs: number = Date.now()
): boolean {
  if (expiresAt == null || expiresAt === '') return false;
  const t = new Date(expiresAt).getTime();
  return Number.isFinite(t) && t > nowMs;
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

function expiryPartsFromIso(expiresAtIso: string): { hours: number; minutes: number } {
  const diff = Math.max(0, new Date(expiresAtIso).getTime() - Date.now());
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { hours, minutes };
}

function formatExpiry(hours: number, minutes: number): string {
  return `${hours}h ${minutes}m`;
}

function providerListingToDetailItem(
  listing: ProviderListing,
  recipientLat: number | null,
  recipientLng: number | null
): FoodDetailItem {
  let distance = '—';
  if (
    recipientLat != null &&
    recipientLng != null &&
    listing.pickupLatitude != null &&
    listing.pickupLongitude != null
  ) {
    const m = haversineMeters(
      listing.pickupLatitude,
      listing.pickupLongitude,
      recipientLat,
      recipientLng
    );
    if (Number.isFinite(m)) distance = `${(m / 1000).toFixed(1)} km`;
  }
  return {
    id: listing.id,
    image: listing.imageUrl ? { uri: listing.imageUrl } : DEFAULT_LISTING_IMAGE,
    title: listing.title,
    source: 'Provider',
    distance,
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

export default function SearchTabScreen() {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList & SearchStackParamList>>();
  const profile = useAuthStore((s) => s.profile);
  const userRole = useAuthStore((s) => s.userRole);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setRequestedIds = useRequestedListingsStore((s) => s.setRequestedIds);

  const [listings, setListings] = useState<ProviderListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [turningOff, setTurningOff] = useState(false);
  const [expiry, setExpiry] = useState({ hours: 0, minutes: 0 });

  const findFoodChannelSeq = useRef(0);
  const findFoodRealtimeGen = useRef(0);
  const findFoodStaggerTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const expiresAt = profile?.demand_pulse_expires_at ?? null;
  const pulseOn = isPulseActive(expiresAt);
  const prefs = profile?.demand_pulse_food_types ?? [];

  const loadListings = useCallback(async () => {
    if (!pulseOn) {
      setListings([]);
      setLoadingListings(false);
      return;
    }
    setLoadingListings(true);
    const [browseRes, myRes] = await Promise.all([
      fetchBrowseListingsApi(),
      fetchMyRequestsApi(),
    ]);
    if (!myRes.error) {
      setRequestedIds(myRes.active.map((r) => r.id));
    }
    const raw = browseRes.error ? [] : browseRes.listings;
    // Pulse view: only listings whose `food_type` matches at least one selected demand-pulse pref.
    const matched = raw.filter((l) => pulseFoodTypeMatches(profile, l.foodType ?? null));
    setListings(matched);
    setLoadingListings(false);
  }, [pulseOn, profile, setRequestedIds]);

  useFocusEffect(
    useCallback(() => {
      void loadListings();
    }, [loadListings])
  );

  useEffect(() => {
    if (!pulseOn || !expiresAt) return;
    const tick = () => setExpiry(expiryPartsFromIso(expiresAt));
    tick();
    const id = setInterval(tick, 60 * 1000);
    return () => clearInterval(id);
  }, [pulseOn, expiresAt]);

  /** Realtime + stagger refetch (same rules as Home), then pulse food-type filter for this screen. */
  useEffect(() => {
    if (!pulseOn || userRole !== 'recipient') {
      findFoodRealtimeGen.current += 1;
      findFoodStaggerTimersRef.current.forEach((tid) => clearTimeout(tid));
      findFoodStaggerTimersRef.current.clear();
      return;
    }

    const realtimeGen = ++findFoodRealtimeGen.current;

    const recipientLat =
      profile?.latitude != null && Number.isFinite(Number(profile.latitude))
        ? Number(profile.latitude)
        : null;
    const recipientLng =
      profile?.longitude != null && Number.isFinite(Number(profile.longitude))
        ? Number(profile.longitude)
        : null;
    const hasRecipientCoords = recipientLat != null && recipientLng != null;

    const channelTopic = `listings-find-food-pulse:${profile?.id ?? 'user'}:${++findFoodChannelSeq.current}`;
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

          const pulseProfile = useAuthStore.getState().profile;
          if (!pulseFoodTypeMatches(pulseProfile, listing.foodType ?? null)) return;

          const nowMs = Date.now();
          if (isListingVisibleForRecipient(listing, pulseProfile, nowMs)) {
            const pending = findFoodStaggerTimersRef.current.get(listing.id);
            if (pending) {
              clearTimeout(pending);
              findFoodStaggerTimersRef.current.delete(listing.id);
            }
            setListings((prev) => {
              if (prev.some((l) => l.id === listing.id)) return prev;
              return [listing, ...prev];
            });
            return;
          }

          const delay = msUntilListingVisibleForRecipient(listing, pulseProfile, nowMs);
          if (delay == null) return;
          const listingId = listing.id;
          if (findFoodStaggerTimersRef.current.has(listingId)) return;

          const t = setTimeout(() => {
            findFoodStaggerTimersRef.current.delete(listingId);
            if (findFoodRealtimeGen.current !== realtimeGen) return;
            void (async () => {
              const [browseRes, myRes] = await Promise.all([
                fetchBrowseListingsApi(),
                fetchMyRequestsApi(),
              ]);
              if (findFoodRealtimeGen.current !== realtimeGen || browseRes.error) return;
              if (!myRes.error) {
                useRequestedListingsStore.getState().setRequestedIds(myRes.active.map((r) => r.id));
              }
              const p = useAuthStore.getState().profile;
              const raw = browseRes.listings;
              const matched = raw.filter((l) => pulseFoodTypeMatches(p, l.foodType ?? null));
              setListings(matched);
            })();
          }, delay);
          findFoodStaggerTimersRef.current.set(listingId, t);
        }
      )
      .subscribe();

    return () => {
      findFoodRealtimeGen.current += 1;
      findFoodStaggerTimersRef.current.forEach((tid) => clearTimeout(tid));
      findFoodStaggerTimersRef.current.clear();
      void supabase.removeChannel(channel);
    };
  }, [
    pulseOn,
    userRole,
    profile?.id,
    profile?.latitude,
    profile?.longitude,
    profile?.demand_pulse_expires_at,
    profile?.demand_pulse_food_types,
  ]);

  const recipientLat =
    profile?.latitude != null && Number.isFinite(Number(profile.latitude))
      ? Number(profile.latitude)
      : null;
  const recipientLng =
    profile?.longitude != null && Number.isFinite(Number(profile.longitude))
      ? Number(profile.longitude)
      : null;

  const requestedIds = useRequestedListingsStore((s) => s.requestedIds);
  const isRequested = (id: string) => requestedIds.has(id);

  const handleTurnOff = async () => {
    if (turningOff) return;
    setTurningOff(true);
    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user?.id) {
        Alert.alert('Unable to turn off', userErr?.message ?? 'Not signed in.');
        return;
      }
      const { error } = await supabase
        .from('profiles')
        .update({
          demand_pulse_expires_at: null,
          demand_pulse_food_types: [],
        })
        .eq('id', user.id);
      if (error) {
        Alert.alert('Could not turn off', error.message ?? 'Update failed.');
        return;
      }
      const updated = await fetchProfile(user.id);
      if (updated) setProfile(updated);
      navigation.navigate('SearchTabScreenMain');
    } finally {
      setTurningOff(false);
    }
  };

  const displayPreference =
    prefs.length > 0 ? prefs.join(' · ') : 'Your area (add preferences on the previous screen for type match)';

  if (!pulseOn) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <SettingsHeader title="Find Food" titleAlign="left" contentPaddingHorizontal={16} />
        <View style={[styles.inactiveWrap, { paddingHorizontal: 16, paddingBottom: insets.bottom + 40 }]}>
          <Text
            style={[
              styles.inactiveTitle,
              { color: colors.text, fontFamily: fontFamilies.interSemiBold, fontSize: fonts.title },
            ]}
          >
            Demand pulse is off
          </Text>
          <Text
            style={[
              styles.inactiveBody,
              { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.subhead },
            ]}
          >
            Turn on &quot;I Need Food Today&quot; from the previous screen to join the list again.
          </Text>
          <Pressable
            onPress={() => navigation.navigate('SearchTabScreenMain')}
            style={[styles.backCta, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.backCtaText, { fontFamily: fontFamilies.interSemiBold, fontSize: fonts.subhead }]}>
              Back to Find Food
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <SettingsHeader
        title="Find Food"
        titleAlign="left"
        onRightPress={handleTurnOff}
        rightIcon={
          turningOff ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
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
          )
        }
        contentPaddingHorizontal={16}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={[styles.heartWrap, { backgroundColor: colors.notificationBg }]}>
            <HeartTab width={38} height={38} color={colors.primary} />
          </View>
          <Text
            style={[
              styles.heading,
              { color: colors.text, fontFamily: fontFamilies.interSemiBold, fontSize: fonts.title },
            ]}
          >
            You&apos;re on the list
          </Text>
          <Text
            style={[
              styles.description,
              { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.subhead, lineHeight: 22 },
            ]}
          >
            Nearby donors and organizations can see there&apos;s demand in your area.
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
              {expiresAt ? formatExpiry(expiry.hours, expiry.minutes) : '—'}
            </Text>
          </Text>

          <View style={styles.foodListSection}>
            <View style={styles.foodListHeader}>
              <Text
                style={[
                  styles.foodListTitle,
                  { color: colors.text, fontFamily: fontFamilies.interSemiBold, fontSize: fonts.body },
                ]}
              >
                Food near you
              </Text>
            </View>
            {loadingListings ? (
              <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />
            ) : listings.length === 0 ? (
              <Text
                style={{
                  marginTop: 12,
                  color: colors.textSecondary,
                  fontFamily: fontFamilies.inter,
                  fontSize: fonts.subhead,
                }}
              >
                {prefs.length > 0
                  ? 'No listings match your selected food types nearby right now. Check Home for the full feed.'
                  : 'No listings in range right now. Check Home for the full feed.'}
              </Text>
            ) : (
              <View style={styles.foodCardsWrap}>
                {listings.map((listing) => {
                  const item = providerListingToDetailItem(listing, recipientLat, recipientLng);
                  const requested = isRequested(listing.id);
                  const handlePress = () => {
                    navigation.navigate('FoodDetailScreen', { item });
                  };
                  return (
                    <View key={listing.id} style={{ marginBottom: 16 }}>
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
                })}
              </View>
            )}
          </View>
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
    paddingTop: 8,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  inactiveWrap: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  inactiveTitle: {
    textAlign: 'center',
  },
  inactiveBody: {
    textAlign: 'center',
    lineHeight: 22,
  },
  backCta: {
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
  },
  backCtaText: {
    color: palette.white,
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
  preferenceChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 100,
    marginBottom: 10,
    maxWidth: '100%',
  },
  preferenceChipText: {
    color: palette.white,
    textAlign: 'center',
  },
  expiryWrap: {
    marginBottom: 20,
  },
  turnOffHeaderText: { marginRight: 3 },
  foodListSection: {
    width: '100%',
    alignItems: 'flex-start',
  },
  foodListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  foodListTitle: {},
  foodCardsWrap: {
    width: '100%',
  },
});
