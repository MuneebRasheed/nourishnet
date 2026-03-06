import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useResolvedIsDark } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import { RootStackParamList } from '../navigations/RootNavigation';
import SettingsHeader from '../components/SettingsHeader';
import { ActiveCompletedTabs } from '../components/ActiveCompletedTabs';
import { SubscriptionPlanCard } from '../components/SubscriptionPlanCard';
import { Ionicons } from '@expo/vector-icons';
import KingIcon from '../assets/svgs/KingIcon';
import StarIcon from '../assets/svgs/StarIcon';
import DiamondIcon from '../assets/svgs/DiamondIcon';

type BillingPeriod = 'monthly' | 'annual';

export default function SubscriptionManagementScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isDark = useResolvedIsDark();
  const colors = getColors(isDark);
  const fontSizes = useAppFontSizes();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');

  const handleBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
  };

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <SettingsHeader
        title="Subscription Plans"
        onLeftPress={handleBack}
        leftIcon={<Ionicons name="arrow-back" size={24} color={colors.text} />}
        contentPaddingHorizontal={16}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.segmentWrap}>
          <ActiveCompletedTabs
            value={billingPeriod === 'monthly' ? 'Monthly' : 'Annual'}
            onChange={(tab) => setBillingPeriod(tab === 'Monthly' ? 'monthly' : 'annual')}
            options={['Monthly', 'Annual']}
          />
        </View>

        <SubscriptionPlanCard
          icon={<StarIcon width={20} height={18} color={palette.basicIconColor} />}
          title="Basic"
          priceText="Free"
          features={['Browse listings', 'Request food', 'Pickup notifications']}
          buttonLabel="Current Plan"
          isCurrentPlan
          isDark={isDark}
          // customCardBackgroundColor={palette.notificationFreshBg}
          // customCardBorderColor={colors.primary}
          // customCardBorderWidth={0}
          customTitleColor={colors.text}
          customButtonTextColor={colors.text}
        />

        <SubscriptionPlanCard
          icon={<KingIcon width={20} height={16} color={palette.kingIconColor} />}
          title="Plus"
          priceText={billingPeriod === 'annual' ? '$4.99' : '$5.99'}
          features={['Everything in Basic', 'Priority requests', 'Unlimited listings']}
          buttonLabel="Upgrade to Plus"
          isCurrentPlan={false}
          isMostPopular
          offerTag={billingPeriod === 'annual' ? '2 months free' : undefined}
          isDark={isDark}
          customCardBackgroundColor={palette.notificationFreshBg}
          customCardBorderColor={colors.primary}
          customCardBorderWidth={1}
          customTitleColor={colors.text}
          customButtonTextColor={palette.white}
          onButtonPress={() => {}}
        />

        <SubscriptionPlanCard
          icon={<DiamondIcon width={20} height={18} color={palette.diamondIconColor} />}
          title="Pro"
          priceText={billingPeriod === 'annual' ? '$8.99' : '$9.99'}
          features={['Everything in Plus', 'Analytics dashboard', 'Premium badge']}
          buttonLabel="Current Plan"
          isCurrentPlan={false}
          isDark={isDark}
          // customCardBackgroundColor={palette.notificationFreshBg}
          // customCardBorderColor={colors.primary}
          // customCardBorderWidth={0}
          customTitleColor={colors.text}
          customButtonTextColor={colors.textSecondary}
          onButtonPress={() => {}}
        />

        <View style={styles.footer}>
          <Pressable onPress={() => {}} style={styles.footerManageLink}>
            <Text
              style={[
                styles.footerLink,
                {
                  color: palette.restorePurchasesColor,
                  fontFamily: fontFamilies.interMedium,
                  fontSize: fontSizes.subhead,
                },
              ]}
            >
              Restore Purchases
            </Text>
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL('https://apps.apple.com/account/subscriptions')}
            style={styles.footerManageLink}
          >
            <Text
              style={[
                styles.footerLink,
                {
                  color: palette.restorePurchasesColor,
                  fontFamily: fontFamilies.interMedium,
                  fontSize: fontSizes.subhead,
                },
              ]}
            >
              Manage via App Store
            </Text>
          </Pressable>
        </View>
        <Text
          style={[
            styles.disclaimer,
            {
              color: colors.textSecondary,
              fontSize: fontSizes.subhead,
              fontFamily: fontFamilies.inter,
            },
          ]}
        >
          Subscriptions renew automatically unless canceled via App Store settings at least 24
          hours before the end of the current period.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    
  },
  segmentWrap: {
    marginBottom: 20,
  },
  footer: {
    marginTop: 25,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  footerLink: {
    marginBottom: 12,
  },
  disclaimer: {
    textAlign: 'center',
    lineHeight: 20,
  },
  footerManageLink:{
    paddingHorizontal: 20,
    // backgroundColor:"red"
  }
});
