import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '../../store/themeStore';
import { useRequestedListingsStore } from '../../store/requestedListingsStore';
import { useRecipientFeedStore } from '../../store/recipientFeedStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import { RootStackParamList } from '../navigations/RootNavigation';
import SettingsHeader from '../components/SettingsHeader';
import FoodCard from '../components/FoodCard';
import type { FoodDetailItem } from './FoodDetailScreen';
import CheckMarkHeart from '../assets/svgs/CheckMarkHeart';
import { fetchMyRequestsApi, type MyRequestItem } from '../lib/api/listings';

const DEFAULT_LISTING_IMAGE = require('../assets/images/FoodOnboard1.png');

function mergeMyRequestItems(existing: MyRequestItem[], incoming: MyRequestItem[]): MyRequestItem[] {
  const map = new Map<string, MyRequestItem>();
  for (const row of existing) map.set(row.id, row);
  for (const row of incoming) map.set(row.id, row);
  return [...map.values()];
}

export default function MyRequestsScreen() {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const setRequestedIds = useRequestedListingsStore((s) => s.setRequestedIds);
  const cachedActiveRequests = useRecipientFeedStore((s) => s.myRequestsActive);
  const cachedCompletedRequests = useRecipientFeedStore((s) => s.myRequestsCompleted);
  const myRequestsLoadedOnce = useRecipientFeedStore((s) => s.myRequestsLoadedOnce);
  const setMyRequestsCache = useRecipientFeedStore((s) => s.setMyRequests);
  const [activeTab, setActiveTab] = useState<'Active' | 'Completed'>('Active');
  const [activeRequests, setActiveRequests] = useState<MyRequestItem[]>(cachedActiveRequests);
  const [completedRequests, setCompletedRequests] = useState<MyRequestItem[]>(cachedCompletedRequests);
  const [recipientCacheHydrated, setRecipientCacheHydrated] = useState(
    useRecipientFeedStore.persist.hasHydrated()
  );
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (recipientCacheHydrated) return undefined;
      const unsub = useRecipientFeedStore.persist.onFinishHydration(() => {
        setRecipientCacheHydrated(true);
      });
      return unsub;
    }, [recipientCacheHydrated])
  );

  useFocusEffect(
    useCallback(() => {
      if (cachedActiveRequests.length > 0 || cachedCompletedRequests.length > 0) {
        setActiveRequests((prev) => mergeMyRequestItems(prev, cachedActiveRequests));
        setCompletedRequests((prev) => mergeMyRequestItems(prev, cachedCompletedRequests));
        setLoading(false);
      }
    }, [cachedActiveRequests, cachedCompletedRequests])
  );

  const loadMyRequests = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    const shouldShowLoading =
      mode === 'initial' &&
      recipientCacheHydrated &&
      !myRequestsLoadedOnce &&
      cachedActiveRequests.length === 0 &&
      cachedCompletedRequests.length === 0;
    const shouldShowRefreshing = mode === 'refresh';

    if (shouldShowLoading) setLoading(true);
    if (shouldShowRefreshing) setRefreshing(true);
    setError(null);
    const { active, completed, error: err } = await fetchMyRequestsApi();
    if (shouldShowLoading) setLoading(false);
    if (shouldShowRefreshing) setRefreshing(false);
    if (err) {
      setError(err);
      if (err === 'Your session expired. Please log in again.') {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'LoginScreen' }],
          })
        );
      }
      return;
    }
    setActiveRequests(active);
    setCompletedRequests(completed);
    // Replace cache with canonical backend result so archived/deleted rows are removed locally too.
    setMyRequestsCache(active, completed);
    setRequestedIds([...active, ...completed].map((r) => r.id));
  }, [
    recipientCacheHydrated,
    myRequestsLoadedOnce,
    cachedActiveRequests.length,
    cachedCompletedRequests.length,
    setRequestedIds,
    setMyRequestsCache,
  ]);

  useFocusEffect(
    useCallback(() => {
      loadMyRequests();
    }, [loadMyRequests])
  );

  const headerTop = Platform.select({
    ios: insets.top,
    android: Math.max(insets.top, 16),
    default: insets.top,
  });

  const requests = activeTab === 'Active' ? activeRequests : completedRequests;

  const getClaimLabel = (item: MyRequestItem): string => {
    if (activeTab === 'Completed') return 'Completed';
    if (item.requestStatus === 'won') return 'Accepted';
    if (item.requestStatus === 'lost' || item.requestStatus === 'cancelled') return 'Declined Request';
    return 'Request Submitted';
  };

  const toCardItem = (item: MyRequestItem): FoodDetailItem => ({
    id: item.id,
    image: item.imageUrl ? { uri: item.imageUrl } : DEFAULT_LISTING_IMAGE,
    title: item.title,
    source: item.source,
    distance: item.distance,
    pickupAddress: item.pickupAddress,
    postedAgo: item.postedAgo,
    portions: item.portions,
    timeSlot: item.timeSlot,
    dietaryTags: item.dietaryTags,
    isLive: false,
    requestStatus: item.requestStatus,
  });

  return (
    <View style={[styles.container, {  backgroundColor: colors.background }]}>
      <View style={[styles.header, { marginTop: headerTop }]}>
        <SettingsHeader
          title="My Requests"
          titleAlign="left"
          showBorder={true}
         
        />
      </View>
       <View style={[styles.tabs, { backgroundColor: colors.inputFieldBg }]}>
      {(['Active', 'Completed'] as const).map((tab) => {
        const active = tab === activeTab;
        return (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tab,
              { backgroundColor: active ? colors.primary : 'transparent' },
            ]}
            activeOpacity={0.9}
          >
            <Text
              style={{
                color: active ? palette.white : colors.textSecondary,
                fontFamily: fontFamilies.interBold,
                fontSize: fonts.body,
              }}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          (loading || requests.length === 0) && styles.scrollContentEmpty,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadMyRequests('refresh')}
            tintColor={palette.roleBulbColor4}
            titleColor={palette.roleBulbColor4}
            colors={[palette.roleBulbColor4]}
            progressBackgroundColor={colors.surface}
            progressViewOffset={0}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: fontFamilies.interSemiBold, fontSize: fonts.body + 2 }]}>
              {error}
            </Text>
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.emptyState}>
            <CheckMarkHeart width={64} height={64} color={colors.textSecondary}/>
            <View style={styles.emptyStateContent}>

            
            <Text
              style={[
                styles.emptyTitle,
                {
                  color: colors.text,
                  fontFamily: fontFamilies.interSemiBold,
                  fontSize: fonts.body+2,
                },
              ]}
            >
              {activeTab === 'Completed'
                ? 'No completed pickups yet'
                : 'No active requests'}
            </Text>
            <Text
              style={[
                styles.emptySubtitle,
                {
                  color: colors.textSecondary,
                  fontFamily: fontFamilies.inter,
                  fontSize: fonts.subhead+2,
                },
              ]}
            >
              {activeTab === 'Completed'
                ? 'Your completed food rescues will appear here'
                : 'Request food from the home feed to see your active requests here'}
            </Text>
            </View>
          </View>
        ) : (
          requests.map((item) => (
            <View key={item.id} style={styles.cardWrap}>
              <FoodCard
                item={toCardItem(item)}
                claimLabel={getClaimLabel(item)}
                claimButtonVariant="outline"
                claimButtonBgColor={colors.inputFieldBg}
                claimButtonTextColor={colors.textSecondary}
                claimIconColor={colors.textSecondary}
                viewDetailLabel="View Detail"
                onViewDetail={() =>
                  navigation.navigate('FoodDetailScreen', { item: toCardItem(item) })
                }
              />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    
  },
  screenTitle: {
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
 
  },
  tab: {
    flex: 1,
    
    borderRadius: 200,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrap: {},
  scrollContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
     gap: 12,
    paddingHorizontal: 50,
  },
  emptyIcon: {
    // marginBottom: 24,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 5,
    
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: 24,
  },

  emptyStateContent:{
   

  }
});
