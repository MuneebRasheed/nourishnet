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
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import SettingsHeader from '../components/SettingsHeader';
import FoodCard, { type FoodCardData } from '../components/FoodCard';
import CheckMarkHeart from '../assets/svgs/CheckMarkHeart';

type RequestItem = FoodCardData & { status: 'waiting_approval' | 'ready_for_pickup' };

const MOCK_ACTIVE_REQUESTS: RequestItem[] = [
  {
    id: '1',
    image: require('../assets/images/Heart.png'),
    title: '2 Fresh Sandwich Packs',
    source: 'Sunshine Bakery',
    distance: '0.4 km',
    postedAgo: '10 min ago',
    portions: '20 portions',
    timeSlot: '18:00 - 20:00',
    dietaryTags: ['Gluten', 'Dairy'],
    status: 'waiting_approval',
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
    status: 'ready_for_pickup',
  },
];

const MOCK_COMPLETED_REQUESTS: RequestItem[] = [];

export default function MyRequestsScreen() {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'Active' | 'Completed'>('Active');

  const headerTop = Platform.select({
    ios: insets.top,
    android: Math.max(insets.top, 16),
    default: insets.top,
  });

  const requests = activeTab === 'Active' ? MOCK_ACTIVE_REQUESTS : MOCK_COMPLETED_REQUESTS;

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
          requests.map((item) => {
            const cardItem: FoodCardData = {
              id: item.id,
              image: item.image,
              title: item.title,
              source: item.source,
              distance: item.distance,
              postedAgo: item.postedAgo,
              portions: item.portions,
              timeSlot: item.timeSlot,
              dietaryTags: item.dietaryTags,
              isLive: false,
            };
            const isReady = item.status === 'ready_for_pickup';
            const claimLabel = isReady ? 'Navigate' : 'Request Submitted';
            const claimBtnBg = isReady ? colors.inputFieldBg : colors.requestBtnBg;
            const claimBtnBorder = isReady ? colors.borderColor : "transparent";
            const claimBtnText = isReady ? colors.text : palette.timerIconColor;
            const claimIcon = isReady ? palette.white : palette.timerIconColor;
            return (
              <FoodCard
                key={item.id}
                item={cardItem}
                claimLabel={claimLabel}
                claimButtonVariant="outline"
                claimButtonBgColor={claimBtnBg}
                claimButtonBorderColor={claimBtnBorder}
                claimButtonTextColor={claimBtnText}
                claimIconColor={claimIcon}
                claimIconType={isReady ? 'arrow' : 'timer'}
                onClaim={() => {
                  if (item.status === 'ready_for_pickup') {
                    // TODO: navigate to pickup
                  } else {
                    // TODO: view status
                  }
                }}
              />
            );
          })
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
