import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '../../store/themeStore';
import { useRequestedListingsStore } from '../../store/requestedListingsStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import { RootStackParamList } from '../navigations/RootNavigation';
import SettingsHeader from '../components/SettingsHeader';
import FoodCard, { type FoodCardData } from '../components/FoodCard';
import CheckMarkHeart from '../assets/svgs/CheckMarkHeart';

export default function MyRequestsScreen() {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<'Active' | 'Completed'>('Active');
  const requestedItems = useRequestedListingsStore((s) => s.requestedItems);
  const completedIds = useRequestedListingsStore((s) => s.completedIds);

  const headerTop = Platform.select({
    ios: insets.top,
    android: Math.max(insets.top, 16),
    default: insets.top,
  });

  const activeRequests = requestedItems.filter((i) => !completedIds.has(i.id));
  const completedRequests = requestedItems.filter((i) => completedIds.has(i.id));
  const requests = activeTab === 'Active' ? activeRequests : completedRequests;

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
          requests.length === 0 && styles.scrollContentEmpty,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {requests.length === 0 ? (
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
                item={{ ...item, isLive: false } as FoodCardData}
                claimLabel={activeTab === 'Completed' ? 'Completed' : 'Request Submitted'}
                claimButtonVariant="outline"
                claimButtonBgColor={colors.inputFieldBg}
                claimButtonTextColor={colors.textSecondary}
                claimIconColor={colors.textSecondary}
                viewDetailLabel="View Detail"
                onViewDetail={() =>
                  navigation.navigate('FoodDetailScreen', { item: { ...item } })
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
