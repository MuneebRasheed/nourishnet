import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import { RootStackParamList } from '../navigations/RootNavigation';
import { useProviderListingsStore, type ProviderListing } from '../../store/providerListingsStore';
import HomeHeader from '../components/HomeHeader';
import SearchBarWithFilter from '../components/SearchBarWithFilter';
import FilterModal from '../components/FilterModal';
import CategoryChips from '../components/CategoryChips';
import FoodCard, { FoodCardData } from '../components/FoodCard';
import type { FoodDetailItem } from './FoodDetailScreen';

const DEFAULT_LISTING_IMAGE = require('../assets/images/FoodOnboard1.png');

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
    image: DEFAULT_LISTING_IMAGE,
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

const MOCK_FOOD_LIST: FoodDetailItem[] = [
  {
    id: '1',
    image: require('../assets/images/Heart.png'),
    title: '20 Fresh Sandwich Packs',
    source: 'Sunshine Bakery',
    distance: '0.4 km away',
    postedAgo: '10 min ago',
    portions: '20 portions',
    timeSlot: '18:00 - 20:00',
    dietaryTags: ['Gluten', 'Dairy'],
    isLive: true,
    pickupAddress: '123 Main Street, Downtown',
    pickupTimeNote: 'Available today',
    pickupInstructions: 'Back door, ask for manager Sarah',
    quantity: 20,
    providerImage: require('../assets/images/Avatar.png'),
  },
  {
    id: '2',
    image: require('../assets/images/FoodOnboard2.png'),
    title: '20 Fresh Sandwich Packs',
    source: 'Sunshine Bakery',
    distance: '0.4 km',
    postedAgo: '10 min ago',
    portions: '20 portions',
    timeSlot: '18:00 - 20:00',
    dietaryTags: ['Gluten', 'Dairy'],
    isLive: true,
  },
  {
    id: '3',
    image: require('../assets/images/ReceiptOnboard1.png'),
    title: 'Mixed Platters & Sides',
    source: 'Green Kitchen',
    distance: '1.2 km',
    postedAgo: '25 min ago',
    portions: '8 portions',
    timeSlot: '12:00 - 14:00',
    dietaryTags: ['Vegan'],
    isLive: true,
  },
];

export default function HomeScreen() {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const allListings = useProviderListingsStore((s) => s.listings);
  const activeListings = useMemo(
    () => allListings.filter((l) => l.status === 'active'),
    [allListings]
  );
  const listingItems = useMemo(
    () => activeListings.map(providerListingToDetailItem),
    [activeListings]
  );
  const displayList = listingItems.length > 0 ? listingItems : MOCK_FOOD_LIST;
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top , paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <HomeHeader />
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
              All
            </Text>
            <View style={[styles.availableBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.availableText, { fontFamily: fontFamilies.interMedium, fontSize: fonts.caption }]}>
                {displayList.length} available
              </Text>
            </View>
          </View>
          <View style={styles.cards}>
            {displayList.map((item) => (
              <FoodCard
                key={item.id}
                item={item as FoodCardData}
                onClaim={() => navigation.navigate('FoodDetailScreen', { item })}
              />
            ))}
          </View>
        </View>
      </ScrollView>
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={(filters) => {
          // Optional: apply filters to home list
        }}
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
});
