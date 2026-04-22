import React, { useMemo, useState, useCallback } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import { RootStackParamList } from '../navigations/RootNavigation';
import HomeHeader from '../components/HomeHeader';
import ContinueButton from '../components/ContinueButton';
import { ProviderListingCard } from '../components/ProviderListingCard';
import { ActiveCompletedTabs, type ActiveCompletedTab } from '../components/ActiveCompletedTabs';
import { useProviderListingsStore, type ProviderListing } from '../../store/providerListingsStore';
import {
  deleteListingApi,
  cancelListingApi,
  activateListingApi,
  fetchProviderListingsWithZeroQuantityResolved,
} from '../lib/api/listings';
import { Ionicons } from '@expo/vector-icons';
import BoxIcon from '../assets/svgs/BoxIcon';
import SettingsHeader from '../components/SettingsHeader';
import ListingIcon from '../assets/svgs/ListingIcon';

const defaultAvatar = require('../assets/images/Avatar.png');

const PROVIDER_NAME = 'Salman Ahmad';
const NOTIFICATION_COUNT = 2;

export default function ProviderListingsScreen() {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();
  const insets = useSafeAreaInsets();
  const allListings = useProviderListingsStore((s) => s.listings);
  const setListings = useProviderListingsStore((s) => s.setListings);
  const removeListing = useProviderListingsStore((s) => s.removeListing);
  const addListingFromApi = useProviderListingsStore((s) => s.addListingFromApi);
  const [activeTab, setActiveTab] = useState<ActiveCompletedTab>('Active');
  const [refreshing, setRefreshing] = useState(false);
  const topRefreshOffset = insets.top + 56;

  const loadProviderListings = useCallback(async () => {
    const { listings, error } = await fetchProviderListingsWithZeroQuantityResolved();
    if (!error) setListings(listings);
  }, [setListings]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const { listings, error } = await fetchProviderListingsWithZeroQuantityResolved();
        if (!cancelled && !error) setListings(listings);
      })();
      return () => {
        cancelled = true;
      };
    }, [setListings])
  );
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const ACTIVE_LISTING_STATUSES = useMemo(
    () => new Set<ProviderListing['status']>(['active', 'request_open', 'claimed']),
    []
  );

  const listings = useMemo(
    () =>
      allListings.filter((l) => {
        if (activeTab === 'Active') return ACTIVE_LISTING_STATUSES.has(l.status);
        return l.status === 'completed' || l.status === 'cancelled';
      }),
    [ACTIVE_LISTING_STATUSES, allListings, activeTab]
  );

  const handleCreateListing = () => {
    navigation.navigate('PostFoodScreen');
  };

  const handleViewRequests = (listing: ProviderListing) => {
    navigation.navigate('ListingRequestsScreen', {
      listingId: listing.id,
      listingTitle: listing.title || 'Food name',
    });
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

  const handleActivateListing = (listing: ProviderListing) => {
    Alert.alert(
      'Activate listing?',
      `"${listing.title || 'This listing'}" will show again to recipients.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          onPress: async () => {
            const { listing: updated, error } = await activateListingApi(listing.id);
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

  const emptyTitle =
    activeTab === 'Active' ? 'No active listings' : 'No past listings';
  const emptySubtitle =
    activeTab === 'Active'
      ? 'Create a new listing to start sharing food'
      : 'Completed pickups and inactive listings appear here';

  return (
    <View style={[styles.container, { paddingTop: insets.top,backgroundColor: colors.background }]}>
      <SettingsHeader
        title=" My Listings"
        showBorder={true}
        onRightPress={() => {}}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          listings.length === 0 && styles.scrollContentEmpty,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              try {
                await loadProviderListings();
              } finally {
                setRefreshing(false);
              }
            }}
            tintColor={palette.roleBulbColor2}
            titleColor={palette.roleBulbColor2}
            colors={[palette.roleBulbColor2]}
            progressBackgroundColor={isDark ? colors.inputFieldBg : palette.white}
            progressViewOffset={topRefreshOffset}
          />
        }
      >
        <View style={styles.content}>
          <ActiveCompletedTabs
            value={activeTab}
            onChange={setActiveTab as (tab: ActiveCompletedTab) => void}
            style={styles.tabs}
          />

          {listings.length === 0 ? (
            <View style={styles.emptyStateCenter}>
              <View
                style={styles.emptyStateCard}>
              <View
                style={styles.emptyStateIconWrap}>
                <BoxIcon
                  width={64}
                  height={64}
                  color={"#757575"}
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
                {emptyTitle}
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
                {emptySubtitle}
              </Text>
              {activeTab === 'Active' && (
                <ContinueButton
                  label="Create Your First Listing"
                  onPress={handleCreateListing}
                  isDark={isDark}
                  icon={<Ionicons name="add" size={22} color={palette.white} />}
                  iconPosition="left"
                  style={styles.createListingCta}
                />
              )}
              </View>
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
                statusLabel={
                  ACTIVE_LISTING_STATUSES.has(listing.status)
                    ? 'Active'
                    : listing.status === 'cancelled'
                      ? 'Inactive'
                      : 'Completed'
                }
                statusColor={ACTIVE_LISTING_STATUSES.has(listing.status) ? palette.roleBulbColor2 : colors.textSecondary}
                onPressViewRequests={() => handleViewRequests(listing)}
                onEdit={() => handleEditListing(listing)}
                onInactive={
                  ACTIVE_LISTING_STATUSES.has(listing.status)
                    ? () => handleInactiveListing(listing)
                    : undefined
                }
                onActivate={
                  listing.status === 'cancelled'
                    ? () => handleActivateListing(listing)
                    : undefined
                }
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  scrollContentEmpty: {
    flexGrow: 1,
    minHeight: '100%',
  },
  content: {
    flex: 1,
  },
  emptyStateCenter: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  tabs: {
   
    // marginBottom: 12,
  },
  primaryCta: {
    marginTop: 20,
    width: '100%',
  },
  emptyStateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    flex:1,
 
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
  createListingCta: {
    marginTop: 20,
    width: '100%',
  },
});
