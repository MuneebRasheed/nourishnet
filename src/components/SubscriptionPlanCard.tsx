import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import { getColors, palette } from '../../utils/colors';

export type SubscriptionPlanCardProps = {
  icon: React.ReactNode;
  title: string;
  priceText: string;
  features: string[];
  buttonLabel: string;
  isCurrentPlan: boolean;
  isMostPopular?: boolean;
  offerTag?: string;
  isDark: boolean;
  customButtonBackgroundColor?: string;
  customButtonTextColor?: string;
  /** Override card background (e.g. for Plus section) */
  customCardBackgroundColor?: string;
  /** Override card border color (e.g. for Plus section) */
  customCardBorderColor?: string;
  /** Override card border width */
  customCardBorderWidth?: number;
  /** Override title color (e.g. to match Plus icon) */
  customTitleColor?: string;
  /** Shown after the price (e.g. `/month`, `/year`). */
  pricePeriodLabel?: string;
  /** Disable the CTA without treating the plan as the active subscription. */
  buttonDisabled?: boolean;
  /** Show a loading state on the CTA. */
  isLoading?: boolean;
  onButtonPress?: () => void;
};

export function SubscriptionPlanCard({
  icon,
  title,
  priceText,
  features,
  buttonLabel,
  isCurrentPlan,
  isMostPopular,
  offerTag,
  isDark,
  customButtonBackgroundColor,
  customButtonTextColor,
  customCardBackgroundColor,
  customCardBorderColor,
  customCardBorderWidth,
  customTitleColor,
  pricePeriodLabel = '/month',
  buttonDisabled = false,
  isLoading = false,
  onButtonPress,
}: SubscriptionPlanCardProps) {
  const colors = getColors(isDark);
  const fontSizes = useAppFontSizes();

  const selected = isMostPopular;
  const cardBg =
    customCardBackgroundColor ??
    (selected ? colors.inputFieldBg : colors.inputFieldBg);
  const cardBorder =
    customCardBorderColor ?? (selected ? colors.primary : colors.borderColor);
  const titleColor = customTitleColor ?? (selected ? colors.primary : colors.text);
  const isUpgradeButton = !isCurrentPlan && buttonLabel !== 'Current Plan';
  const isInactiveCurrentPlanLabel = buttonLabel === 'Current Plan' && !isCurrentPlan;
  const isUpgradeToPlus = buttonLabel === 'Upgrade to Plus';
  const buttonBgColor =
    customButtonBackgroundColor ??
    (isUpgradeToPlus ? colors.primary : buttonLabel === 'Current Plan' ? colors.inputFieldBg : colors.primary);
  const buttonTextColor = customButtonTextColor ?? palette.white;

  return (
    <View style={styles.wrapper}>
      {isMostPopular && (
        <View style={[styles.mostPopularBanner, { backgroundColor: colors.primary }]}>
          <Text
            style={[
              styles.mostPopularText,
              { fontSize: fontSizes.caption, fontFamily: fontFamilies.inter },
            ]}
          >
            MOST POPULAR
          </Text>
        </View>
      )}

      <View
        style={[
          styles.card,
          {
            backgroundColor: cardBg,
            borderColor: cardBorder,
            borderWidth: customCardBorderWidth ?? 0,
          },
        ]}
      >
        <View style={styles.cardInner}>
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              {icon}
              <Text
                style={[
                  styles.title,
                  {
                    color: titleColor,
                    fontSize: fontSizes.body,
                    fontFamily: fontFamilies.interMedium,
                  },
                ]}
              >
                {title}
              </Text>
            </View>

            {isCurrentPlan && (
              <View style={[styles.activeBadge, { backgroundColor: colors.surface }]}>
                <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
                <Text
                  style={[styles.activeText, { color: colors.text, fontSize: fontSizes.subhead }]}
                >
                  Active
                </Text>
              </View>
            )}

            {offerTag && !isCurrentPlan && (
              <View style={[styles.offerTag, { backgroundColor: colors.surface }]}>
                <Text
                  style={[
                    styles.offerTagText,
                    {
                      color: colors.primary,
                      fontSize: fontSizes.caption,
                      fontFamily: fontFamilies.interMedium,
                    },
                  ]}
                >
                  {offerTag}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.priceRow}>
            <Text
              style={[
                styles.price,
                {
                  color: colors.primary,
                  fontSize: fontSizes.title,
                  fontFamily: fontFamilies.poppinsBold,
                },
              ]}
            >
              {priceText}
            </Text>
            {pricePeriodLabel ? (
              <Text
                style={[
                  styles.perMonth,
                  {
                    color: colors.text,
                    fontSize: fontSizes.subhead,
                    fontFamily: fontFamilies.inter,
                  },
                ]}
              >
                {pricePeriodLabel}
              </Text>
            ) : null}
          </View>

          <View style={styles.features}>
            {features.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={[styles.tickCircle, { backgroundColor: palette.greenTickColor }]}>
                  <Ionicons name="checkmark" size={12} color={isDark ? palette.black : palette.white} />
                </View>
                <Text
                  style={[
                    styles.featureText,
                    {
                      color: colors.text,
                      fontSize: fontSizes.subhead,
                      fontFamily: fontFamilies.inter,
                    },
                  ]}
                >
                  {f}
                </Text>
              </View>
            ))}
          </View>

          <Pressable
            onPress={onButtonPress}
            disabled={isCurrentPlan || buttonDisabled || isLoading}
            style={[
              styles.button,
              {
                backgroundColor: buttonBgColor,
                borderWidth: isInactiveCurrentPlanLabel ? 1 : 0,
                borderColor: isInactiveCurrentPlanLabel ? colors.borderColor : 'transparent',
                opacity: isLoading ? 0.85 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.buttonText,
                {
                  color: customButtonTextColor ?? buttonTextColor,
                  fontSize: fontSizes.subhead,
                  fontFamily: isUpgradeButton ? fontFamilies.interSemiBold : fontFamilies.interMedium,
                },
              ]}
            >
              {isLoading ? 'Processing…' : buttonLabel}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 24,
    alignItems: 'center',
  },
  mostPopularBanner: {
    position: 'absolute',
    top: -12,
    zIndex: 10,
    height: 24,
    paddingHorizontal: 16,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  mostPopularText: {
    color: palette.white,
    letterSpacing: 0.5,
  },
  card: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'visible',
  },
  cardInner: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {},
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 3,
  },
  activeText: {
    fontFamily: fontFamilies.inter,
  },
  offerTag: {
    paddingHorizontal: 13,
    paddingVertical: 5,
    borderRadius: 20,
  },
  offerTagText: {},
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  price: {},
  perMonth: {
    marginLeft: 4,
  },
  features: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tickCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontFamily: fontFamilies.inter,
    flex: 1,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 48,
    alignItems: 'center',
  },
  buttonText: {},
});
