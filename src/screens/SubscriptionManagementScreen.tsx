import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Purchases, {
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesError,
  type PurchasesPackage,
} from 'react-native-purchases';
import { useResolvedIsDark } from '../../store/themeStore';
import { useOfferingsStore } from '../../store/offeringsStore';
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

const PLUS_PACKAGE_MONTHLY = 'monthly_plus';
const PLUS_PACKAGE_ANNUAL = 'yearly_plus';

function activeSubscriptionTier(info: CustomerInfo | null): 'basic' | 'plus' | 'pro' {
  if (!info) {
    return 'basic';
  }
  let hasPlus = false;
  for (const ent of Object.values(info.entitlements.active)) {
    const pid = (ent?.productIdentifier ?? '').toLowerCase();
    if (pid.includes('pro_')) {
      return 'pro';
    }
    if (pid.includes('plus_')) {
      hasPlus = true;
    }
  }
  return hasPlus ? 'plus' : 'basic';
}

function findPlusPackage(
  packages: readonly PurchasesPackage[] | undefined,
  billing: BillingPeriod
): PurchasesPackage | null {
  if (!packages?.length) {
    return null;
  }
  const id = billing === 'annual' ? PLUS_PACKAGE_ANNUAL : PLUS_PACKAGE_MONTHLY;
  return packages.find((p) => p.identifier === id) ?? null;
}

export default function SubscriptionManagementScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isDark = useResolvedIsDark();
  const colors = getColors(isDark);
  const fontSizes = useAppFontSizes();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [purchasing, setPurchasing] = useState<'plus' | 'pro' | null>(null);
  const [restoring, setRestoring] = useState(false);

  const offerings = useOfferingsStore((s) => s.offerings);
  const customerInfo = useOfferingsStore((s) => s.customerInfo);
  const setCustomerInfo = useOfferingsStore((s) => s.setCustomerInfo);

  const tier = useMemo(() => activeSubscriptionTier(customerInfo), [customerInfo]);

  const currentOffering = offerings?.current ?? null;

  const { plusPackage, proPackage } = useMemo(() => {
    if (!currentOffering) {
      return { plusPackage: null as PurchasesPackage | null, proPackage: null as PurchasesPackage | null };
    }
    const plus = findPlusPackage(currentOffering.availablePackages, billingPeriod);
    const pro =
      billingPeriod === 'annual' ? currentOffering.annual ?? null : currentOffering.monthly ?? null;
    return { plusPackage: plus, proPackage: pro };
  }, [currentOffering, billingPeriod]);

  const plusPriceText = plusPackage?.product.priceString ?? '—';
  const proPriceText = proPackage?.product.priceString ?? '—';
  const pricePeriodLabel = billingPeriod === 'annual' ? '/year' : '/month';

  useFocusEffect(
    useCallback(() => {
      void Purchases.getCustomerInfo()
        .then((info) => setCustomerInfo(info))
        .catch(() => setCustomerInfo(null));
    }, [setCustomerInfo])
  );

  const handleBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
  };

  const handlePurchase = async (pkg: PurchasesPackage | null, plan: 'plus' | 'pro') => {
    if (!pkg) {
      Alert.alert(
        'Unavailable',
        'This plan could not be loaded. Check your connection and try opening this screen again.'
      );
      return;
    }
    setPurchasing(plan);
    try {
      const { customerInfo: next } = await Purchases.purchasePackage(pkg);
      setCustomerInfo(next);
      Alert.alert('Subscribed', 'Your subscription is now active.');
    } catch (e) {
      const err = e as PurchasesError;
      if (err.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        return;
      }
      Alert.alert('Purchase did not complete', err.message ?? 'Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      const nextTier = activeSubscriptionTier(info);
      if (nextTier === 'basic') {
        Alert.alert('Restore complete', 'No active subscriptions were found for this account.');
      } else {
        Alert.alert('Restore complete', 'Your purchases have been restored.');
      }
    } catch (e) {
      const err = e as PurchasesError;
      Alert.alert('Restore failed', err.message ?? 'Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  const openManageSubscriptions = () => {
    if (Platform.OS === 'ios') {
      void Linking.openURL('https://apps.apple.com/account/subscriptions');
    } else {
      void Linking.openURL('https://play.google.com/store/account/subscriptions');
    }
  };

  const basicIsCurrent = tier === 'basic';
  const plusIsCurrent = tier === 'plus';
  const proIsCurrent = tier === 'pro';

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
          pricePeriodLabel=""
          features={['Browse listings', 'Request food', 'Pickup notifications']}
          buttonLabel="Current Plan"
          isCurrentPlan={basicIsCurrent}
          isDark={isDark}
          customTitleColor={colors.text}
          customButtonTextColor={colors.text}
        />

        <SubscriptionPlanCard
          icon={<KingIcon width={20} height={16} color={palette.kingIconColor} />}
          title="Plus"
          priceText={plusPriceText}
          pricePeriodLabel={pricePeriodLabel}
          features={['Everything in Basic', 'Priority requests', 'Unlimited listings']}
          buttonLabel={plusIsCurrent ? 'Current Plan' : proIsCurrent ? 'Included with Pro' : 'Upgrade to Plus'}
          isCurrentPlan={plusIsCurrent}
          isMostPopular
          offerTag={billingPeriod === 'annual' ? 'Best value' : undefined}
          isDark={isDark}
          customCardBackgroundColor={palette.notificationFreshBg}
          customCardBorderColor={colors.primary}
          customCardBorderWidth={1}
          customTitleColor={colors.text}
          customButtonTextColor={palette.white}
          buttonDisabled={proIsCurrent}
          isLoading={purchasing === 'plus'}
          onButtonPress={() => void handlePurchase(plusPackage, 'plus')}
        />

        <SubscriptionPlanCard
          icon={<DiamondIcon width={20} height={18} color={palette.diamondIconColor} />}
          title="Pro"
          priceText={proPriceText}
          pricePeriodLabel={pricePeriodLabel}
          features={['Everything in Plus', 'Analytics dashboard', 'Premium badge']}
          buttonLabel={proIsCurrent ? 'Current Plan' : 'Upgrade to Pro'}
          isCurrentPlan={proIsCurrent}
          isDark={isDark}
          customTitleColor={colors.text}
          customButtonTextColor={proIsCurrent ? colors.textSecondary : palette.white}
          customButtonBackgroundColor={proIsCurrent ? colors.inputFieldBg : undefined}
          isLoading={purchasing === 'pro'}
          onButtonPress={() => void handlePurchase(proPackage, 'pro')}
        />

        <View style={styles.footer}>
          <Pressable
            onPress={() => void handleRestore()}
            disabled={restoring}
            style={styles.footerManageLink}
          >
            <Text
              style={[
                styles.footerLink,
                {
                  color: palette.restorePurchasesColor,
                  fontFamily: fontFamilies.interMedium,
                  fontSize: fontSizes.subhead,
                  opacity: restoring ? 0.6 : 1,
                },
              ]}
            >
              {restoring ? 'Restoring…' : 'Restore Purchases'}
            </Text>
          </Pressable>
          <Pressable onPress={openManageSubscriptions} style={styles.footerManageLink}>
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
              {Platform.OS === 'ios' ? 'Manage via App Store' : 'Manage via Play Store'}
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
          Subscriptions renew automatically unless canceled in your App Store or Google Play
          subscription settings at least 24 hours before the end of the current period.
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
  footerManageLink: {
    paddingHorizontal: 20,
  },
});
