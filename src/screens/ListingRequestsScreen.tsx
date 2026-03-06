import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
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
import { VerifyPickupModal } from '../components/VerifyPickupModal';
import { Ionicons } from '@expo/vector-icons';
import BoxIcon from '../assets/svgs/BoxIcon';
import ClockICon from '../assets/svgs/ClockICon';
import LocationPin from '../assets/svgs/LocationPin';

export type { ListingRequestItem };

type RequestTab = 'Request' | 'Available';

// Mock data for pending requests
const MOCK_REQUESTS: ListingRequestItem[] = [
  { id: '1', requesterName: 'Sarah Johnson', distance: '0.5 km', requestedAt: '16m ago', priority: 'high' },
  { id: '2', requesterName: 'Sarah Johnson', distance: '0.5 km', requestedAt: '16m ago', priority: 'medium' },
  { id: '3', requesterName: 'Sarah Johnson', distance: '0.5 km', requestedAt: '16m ago', priority: 'high' },
  { id: '4', requesterName: 'Sarah Johnson', distance: '0.5 km', requestedAt: '16m ago', priority: 'high' },
];

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
  const [pendingRequests, setPendingRequests] = useState<ListingRequestItem[]>(MOCK_REQUESTS);
  const [acceptedRequests, setAcceptedRequests] = useState<ListingRequestItem[]>([]);
  const [verifyModalRequestId, setVerifyModalRequestId] = useState<string | null>(null);

  const handleBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
  };

  const handleAccept = (requestId: string) => {
    const accepted = pendingRequests.find((r) => r.id === requestId);
    if (accepted) {
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
      setAcceptedRequests((prev) => [...prev, accepted]);
    }
  };

  const handleDecline = (requestId: string) => {
    setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const handleQRCode = (requestId: string) => {
    // TODO: navigate to QR code screen
  };

  const handlePinCode = (requestId: string) => {
    setVerifyModalRequestId(requestId);
  };

  const handleVerifyPickup = (pin: string) => {
    if (verifyModalRequestId) {
      // TODO: verify PIN with backend for this request
    }
    setVerifyModalRequestId(null);
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

      <VerifyPickupModal
        visible={!!verifyModalRequestId}
        onClose={() => setVerifyModalRequestId(null)}
        onVerify={handleVerifyPickup}
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
