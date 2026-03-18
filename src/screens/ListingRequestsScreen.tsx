import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import { RootStackParamList } from '../navigations/RootNavigation';
import { useProviderListingsStore } from '../../store/providerListingsStore';
import SettingsHeader from '../components/SettingsHeader';
import { ActiveCompletedTabs } from '../components/ActiveCompletedTabs';
import { RequestCard, type ListingRequestItem } from '../components/RequestCard';
import { Ionicons } from '@expo/vector-icons';
import BoxIcon from '../assets/svgs/BoxIcon';
import ClockICon from '../assets/svgs/ClockICon';
import LocationPin from '../assets/svgs/LocationPin';
import { supabase } from '../lib/supabase';
import { generatePickupPinApi } from '../lib/api/listings';
import { PickupPinModal } from '../components/PickupPinModal';

export type { ListingRequestItem };

type RequestTab = 'Request' | 'Available';

function formatTimeAgo(iso: string | null | undefined) {
  if (!iso) return 'just now';
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 'just now';
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function ListingRequestsScreen() {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ListingRequestsScreen'>>();
  const { listingTitle = 'Listing', listingId } = route.params ?? {};
  const listings = useProviderListingsStore((s) => s.listings);
  const listing = useMemo(
    () => (listingId ? listings.find((l) => l.id === listingId) : null),
    [listingId, listings]
  );

  const [activeTab, setActiveTab] = useState<RequestTab>('Request');
  const [pendingRequests, setPendingRequests] = useState<ListingRequestItem[]>([]);
  const [acceptedRequests, setAcceptedRequests] = useState<ListingRequestItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mutatingRequestId, setMutatingRequestId] = useState<string | null>(null);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [displayedPin, setDisplayedPin] = useState<string | null>(null);
  const isMutatingRef = useRef(false);

  const fetchRequests = useCallback(async () => {
    if (!listingId) return;
    setIsRefreshing(true);

    // 1) Fetch requests
    const { data: requests, error: reqErr } = await supabase
      .from('listing_requests')
      .select('id, recipient_id, status, created_at')
      .eq('listing_id', listingId)
      .in('status', ['pending', 'won'])
      .order('created_at', { ascending: false });

    if (reqErr) {
      console.error('[ListingRequestsScreen] fetch listing_requests', reqErr);
      setPendingRequests([]);
      setAcceptedRequests([]);
      setIsRefreshing(false);
      return;
    }

    const rows = requests ?? [];
    const recipientIds = Array.from(new Set(rows.map((r) => r.recipient_id).filter(Boolean)));

    // 2) Optional: fetch profiles for names/avatars
    const profilesById = new Map<string, { full_name: string | null; avatar_url: string | null }>();
    if (recipientIds.length > 0) {
      const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', recipientIds);

      if (profErr) {
        console.error('[ListingRequestsScreen] fetch profiles', profErr);
      } else {
        for (const p of profiles ?? []) {
          profilesById.set(p.id, { full_name: p.full_name ?? null, avatar_url: p.avatar_url ?? null });
        }
      }
    }

    const toItem = (r: { id: string; recipient_id: string; created_at: string | null }) => {
      const profile = profilesById.get(r.recipient_id);
      const displayName =
        (profile?.full_name && profile.full_name.trim().length > 0
          ? profile.full_name.trim()
          : null) ?? 'Recipient';

      return {
        id: r.id,
        requesterName: displayName,
        avatar: profile?.avatar_url ? { uri: profile.avatar_url } : undefined,
        distance: '—',
        requestedAt: formatTimeAgo(r.created_at),
        priority: 'medium' as const,
      };
    };

    setPendingRequests(rows.filter((r) => r.status === 'pending').map(toItem));
    setAcceptedRequests(rows.filter((r) => r.status === 'won').map(toItem));
    setIsRefreshing(false);
  }, [listingId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
  };

  const handleAccept = useCallback(
    async (requestId: string) => {
      if (isMutatingRef.current) return;
      isMutatingRef.current = true;
      setMutatingRequestId(requestId);
      try {
        const { error } = await supabase.rpc('provider_accept_request', { p_request_id: requestId });
        if (error) {
          console.error('[ListingRequestsScreen] provider_accept_request', error);
          return;
        }
        await fetchRequests();
      } finally {
        setMutatingRequestId(null);
        isMutatingRef.current = false;
      }
    },
    [fetchRequests]
  );

  const handleDecline = useCallback(
    async (requestId: string) => {
      if (isMutatingRef.current) return;
      isMutatingRef.current = true;
      setMutatingRequestId(requestId);
      try {
        const { error } = await supabase.rpc('provider_decline_request', { p_request_id: requestId });
        if (error) {
          console.error('[ListingRequestsScreen] provider_decline_request', error);
          return;
        }
        await fetchRequests();
      } finally {
        setMutatingRequestId(null);
        isMutatingRef.current = false;
      }
    },
    [fetchRequests]
  );

  const handleQRCode = (requestId: string) => {
    if (!listingId) return;
    navigation.navigate('QRCodeScreen', { listingId, mode: 'show' });
  };

  const handlePinCode = async (requestId: string) => {
    if (!listingId || !requestId) return;

    const { pin, error } = await generatePickupPinApi(listingId);
    if (error || !pin) {
      Alert.alert('Unable to generate PIN', error ?? 'Please try again.');
      return;
    }
    setDisplayedPin(pin);
    setPinModalVisible(true);
  };

  const pendingCount = pendingRequests.length;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.headerWrap}>
        <SettingsHeader
          title={listingTitle}
          titleAlign="center"
          onLeftPress={handleBack}
          leftIcon={<Ionicons name="arrow-back" size={24} color={colors.text} />}
          onRightPress={() => {}}
          rightIcon={<Ionicons name="ellipsis-vertical" size={22} color={colors.text} />}
          showBorder={true}
          contentPaddingHorizontal={16}
        />
      </View>

      {listing != null && (
        <View style={[styles.listingDetailsCard, { backgroundColor: colors.inputFieldBg, borderColor: colors.borderColor }]}>
          <Text style={[styles.listingDetailsTitle, { color: colors.text, fontFamily: fontFamilies.interBold, fontSize: fonts.subhead }]}>
            {listing.title || 'Food name'}
          </Text>
          <View style={styles.listingDetailsRow}>
            <Ionicons name="cube-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.listingDetailsText, { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.caption }]}>
              {listing.quantity} {listing.quantityUnit}
              {listing.foodType ? ` · ${listing.foodType}` : ''}
            </Text>
          </View>
          <View style={styles.listingDetailsRow}>
            <LocationPin width={14} height={14} color={colors.textSecondary} />
            <Text style={[styles.listingDetailsText, { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.caption }]} numberOfLines={2}>
              {listing.pickupAddress}
            </Text>
          </View>
          <View style={styles.listingDetailsRow}>
            <ClockICon width={14} height={14} color={colors.textSecondary} />
            <Text style={[styles.listingDetailsText, { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.caption }]}>
              {listing.startTime} – {listing.endTime}
            </Text>
          </View>
          {listing.note != null && listing.note !== '' && (
            <View style={styles.listingDetailsRow}>
              <Ionicons name="document-text-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.listingDetailsText, { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.caption }]} numberOfLines={3}>
                {listing.note}
              </Text>
            </View>
          )}
          {(listing.dietaryTags?.length > 0 || listing.allergens?.length > 0) && (
            <View style={styles.listingDetailsTags}>
              {listing.dietaryTags?.map((tag) => (
                <View key={tag} style={[styles.listingTag, { backgroundColor: isDark ? colors.surfaceBorder : palette.roleCard }]}>
                  <Text style={[styles.listingTagText, { color: colors.text, fontFamily: fontFamilies.interMedium, fontSize: fonts.caption }]}>{tag}</Text>
                </View>
              ))}
              {listing.allergens?.filter((a) => a !== 'None').map((tag) => (
                <View key={tag} style={[styles.listingTag, { backgroundColor: palette.glutenColor }]}>
                  <Text style={[styles.listingTagText, { color: isDark ? palette.roleBulbColor3 : palette.roleBulbColor1, fontFamily: fontFamilies.interMedium, fontSize: fonts.caption }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.tabsRow}>
        <ActiveCompletedTabs
          value={activeTab}
          onChange={(tab) => setActiveTab(tab as RequestTab)}
          options={['Request', 'Available']}
          style={styles.tabsRowInner}
        />
      </View>

      <View style={styles.tabContent}>
      {activeTab === 'Request' && (
        <>
          <View style={styles.sectionHeader}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.textSecondary,
                  fontFamily: fontFamilies.interSemiBold,
                  fontSize: fonts.subhead,
                },
              ]}
            >
              Pending Requests
            </Text>
            <Text
              style={[
                styles.requestCount,
                {
                  color: colors.primary,
                  fontFamily: fontFamilies.interSemiBold,
                  fontSize: fonts.subhead,
                },
              ]}
            >
              {pendingCount} {pendingCount === 1 ? 'request' : 'requests'}
            </Text>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 100 },
              pendingRequests.length === 0 && styles.scrollContentEmpty,
            ]}
            showsVerticalScrollIndicator={false}
          >
            {pendingRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
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
                  No pending requests
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
                  New requests for this listing will appear here
                </Text>
              </View>
            ) : (
              pendingRequests.map((req) => (
                <RequestCard
                  key={req.id}
                  item={req}
                  variant="pending"
                  disabled={isRefreshing || mutatingRequestId === req.id}
                  onAccept={() => handleAccept(req.id)}
                  onDecline={() => handleDecline(req.id)}
                />
              ))
            )}
          </ScrollView>
        </>
      )}

      {activeTab === 'Available' && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
            acceptedRequests.length === 0 && styles.scrollContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {acceptedRequests.length === 0 ? (
            <View style={styles.emptyStateCenter}>
              <View style={styles.emptyStateCard}>
                <View style={styles.emptyStateIconWrap}>
                  <BoxIcon width={64} height={64} color="#757575" />
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
                  No accepted requests yet
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
                  Accept requests from the Request tab to see them here
                </Text>
              </View>
            </View>
          ) : (
            acceptedRequests.map((req) => (
              <RequestCard
                key={req.id}
                item={req}
                variant="accepted"
                onQRCode={() => handleQRCode(req.id)}
                onPinCode={() => handlePinCode(req.id)}
              />
            ))
          )}
        </ScrollView>
      )}
      </View>

      <PickupPinModal
        visible={pinModalVisible}
        pin={displayedPin}
        onClose={() => {
          setPinModalVisible(false);
          setDisplayedPin(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerWrap: {
    width: '100%',
  },
  listingDetailsCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  listingDetailsTitle: {
    marginBottom: 8,
  },
  listingDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  listingDetailsText: {
    flex: 1,
  },
  listingDetailsTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  listingTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  listingTagText: {},
  tabsRow: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  tabsRowInner: {
    width: '100%',
  },
  tabContent: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {},
  requestCount: {},
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  scrollContentEmpty: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateCenter: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyStateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    flex: 1,
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
