import React, { useMemo, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import { ListingsStackParamList } from '../navigations/ListingsNavigationStack';
import { RootStackParamList } from '../navigations/RootNavigation';
import HomeHeader from '../components/HomeHeader';
import ContinueButton from '../components/ContinueButton';
import { ProviderListingCard } from '../components/ProviderListingCard';
import { ActiveCompletedTabs, type ActiveCompletedTab } from '../components/ActiveCompletedTabs';
import { useProviderListingsStore, type ProviderListing } from '../../store/providerListingsStore';
import { deleteListingApi } from '../lib/api/listings';
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
  const removeListing = useProviderListingsStore((s) => s.removeListing);
  const [activeTab, setActiveTab] = useState<ActiveCompletedTab>('Active');
  type ListingsNav = NativeStackNavigationProp<ListingsStackParamList, 'ProviderListingsScreen'>;
type RootNav = NativeStackNavigationProp<RootStackParamList, keyof RootStackParamList>;
const navigation = useNavigation<CompositeNavigationProp<ListingsNav, RootNav>>();

  const listings = useMemo(
    () =>
      allListings.filter(
        (l) => l.status === (activeTab === 'Active' ? 'active' : 'completed')
      ),
    [allListings, activeTab]
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

  const emptyTitle =
    activeTab === 'Active' ? 'No active listings' : 'No completed listings';
  const emptySubtitle =
    activeTab === 'Active'
      ? 'Create a new listing to start sharing food'
      : 'Completed pickups will appear here';

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
                statusLabel={listing.status === 'active' ? 'Active' : 'Completed'}
                statusColor={listing.status === 'active' ? palette.roleBulbColor2 : colors.textSecondary}
                onPressViewRequests={() => handleViewRequests(listing)}
                onEdit={() => handleEditListing(listing)}
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
