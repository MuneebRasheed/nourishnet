import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ImageSourcePropType,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
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
import { useProviderListingsStore } from '../../store/providerListingsStore';
import { Ionicons } from '@expo/vector-icons';
import ForkKnife from '../assets/svgs/ForkKnife';
import CheckMarkHeart from '../assets/svgs/CheckMarkHeart';
import BoxIcon from '../assets/svgs/BoxIcon';
import ThreelinesIcon from '../assets/svgs/ThreelinesIcon';

const defaultAvatar = require('../assets/images/Avatar.png');

const PROVIDER_NAME = 'Salman Ahmad';
const NOTIFICATION_COUNT = 2;

export default function ProviderHomeScreen() {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();
  const insets = useSafeAreaInsets();
  const allListings = useProviderListingsStore((s) => s.listings);
  const listings = useMemo(
    () => allListings.filter((l) => l.status === 'active'),
    [allListings]
  );
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const handlePostSurplus = () => {
    navigation.navigate('PostFoodScreen');
  };

  const handleViewListings = () => {
    navigation.navigate('MainTabs', { screen: 'Listings' });
  };

  const handleTrackImpact = () => {
    navigation.navigate('MainTabs', { screen: 'Analytics' });
  };

  const handleCreateFirstListing = () => {
    navigation.navigate('PostFoodScreen');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <HomeHeader
            userName={PROVIDER_NAME}
            notificationCount={NOTIFICATION_COUNT}
            streakText="4-day streak"
            avatarSource={defaultAvatar as ImageSourcePropType}
          />

          <ContinueButton
            label="Post Surplus Food"
            onPress={handlePostSurplus}
            isDark={isDark}
            icon={<Ionicons name="add" size={24} color={palette.white} />}
            iconPosition="left"
            style={styles.primaryCta}
          />

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
              value="0"
              title="Active Posts"
              label="Currently available"
              icon={ <BoxIcon width={26} height={26} color={isDark ? palette.roleBulbColor3 : palette.roleBulbColor1} /> }
              iconBgColor={isDark ? colors.inputFieldBg : palette.roleCardbg}
            />
            <ProviderImpactStatCard
              value="0"
              title="Completed"
              label="Successfully picked up"
              icon={<CheckMarkHeart width={20} height={20} color={colors.primary} />}
              iconBgColor={isDark ? colors.inputFieldBg : palette.roleCard}
            />
            <ProviderImpactStatCard
              value="142"
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
                statusLabel={listing.status === 'active' ? 'Active' : 'Completed'}
                onPressViewRequests={handleViewListings}
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
});
