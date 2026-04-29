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

function findProPackage(
  packages: readonly PurchasesPackage[] | undefined,
  billing: BillingPeriod
): PurchasesPackage | null {
  if (!packages?.length) {
    return null;
  }
  
  // Find Pro packages by checking if product identifier contains "pro_"
  const proPackages = packages.filter((p) => {
    const productId = p.product.identifier.toLowerCase();
    return productId.includes('pro_');
  });

  if (!proPackages.length) {
    return null;
  }

  // Filter by billing period
  if (billing === 'annual') {
    // Look for yearly/annual in product ID or subscription period of 1 year
    return proPackages.find((p) => {
      const productId = p.product.identifier.toLowerCase();
      const period = p.product.subscriptionPeriod?.toLowerCase() || '';
      return productId.includes('yearly') || productId.includes('annual') || period.includes('p1y');
    }) ?? null;
  } else {
    // Look for monthly in product ID or subscription period of 1 month
    return proPackages.find((p) => {
      const productId = p.product.identifier.toLowerCase();
      const period = p.product.subscriptionPeriod?.toLowerCase() || '';
      return productId.includes('monthly') || period.includes('p1m');
    }) ?? null;
  }
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

  const proPackage = useMemo(() => {
    if (!currentOffering) {
      return null;
    }
    return findProPackage(currentOffering.availablePackages, billingPeriod);
  }, [currentOffering, billingPeriod]);

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

  const handlePurchase = async (pkg: PurchasesPackage | null) => {
    if (!pkg) {
      Alert.alert(
        'Unavailable',
        'This plan could not be loaded. Check your connection and try opening this screen again.'
      );
      return;
    }
    setPurchasing('pro');
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
          title="Free"
          priceText="Free"
          pricePeriodLabel=""
          features={[
            'Browse food near you',
            'Claim food',
            'Notifications',
            'Fair queue access',
            'Secure pickup (PIN)',
            'Up to 5 posts/month (providers)',
            'Basic impact count'
          ]}
          buttonLabel="Current Plan"
          isCurrentPlan={basicIsCurrent}
          isDark={isDark}
          customTitleColor={colors.text}
          customButtonTextColor={colors.text}
        />

        {/* Plus plan hidden - only showing Free and Pro plans */}

        <SubscriptionPlanCard
          icon={<DiamondIcon width={20} height={18} color={palette.diamondIconColor} />}
          title="Pro"
          priceText={proPriceText}
          pricePeriodLabel={pricePeriodLabel}
          features={[
            'Unlimited posts',
            'Priority listing visibility',
            'Demand insights',
            'Auto-reminders to post surplus',
            'Monthly impact summary',
            'Community Partner badge'
          ]}
          buttonLabel={proIsCurrent ? 'Current Plan' : 'Upgrade to Pro'}
          isCurrentPlan={proIsCurrent}
          isMostPopular
          offerTag={billingPeriod === 'annual' ? 'Best value' : undefined}
          isDark={isDark}
          customCardBackgroundColor={palette.notificationFreshBg}
          customCardBorderColor={colors.primary}
          customCardBorderWidth={1}
          customTitleColor={colors.text}
          customButtonTextColor={proIsCurrent ? colors.textSecondary : palette.white}
          customButtonBackgroundColor={proIsCurrent ? colors.inputFieldBg : undefined}
          isLoading={purchasing === 'pro'}
          onButtonPress={() => void handlePurchase(proPackage)}
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
